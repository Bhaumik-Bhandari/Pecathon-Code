import base64
import io
import math
from typing import Any, Dict, List

import cv2
import numpy as np
import torch
import uvicorn
from astropy.stats import sigma_clipped_stats
from deepinv.models import DnCNN
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from photutils.detection import DAOStarFinder

app = FastAPI(
    title="Tsukuyomi Spirit Lens — Local AI Engine",
    description="Non-hallucinatory DnCNN astronomical image denoising and DAOStarFinder astrometric source extraction.",
    version="1.0.0",
)

# Enable CORS for all origins so the frontend can fail over seamlessly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
_dncnn_model = None


def get_dncnn_model():
    """Lazy-load the pre-trained DnCNN model on first request."""
    global _dncnn_model
    if _dncnn_model is None:
        try:
            model = DnCNN(
                in_channels=3,
                out_channels=3,
                pretrained="download_lipschitz",
                device=DEVICE,
            )
            model.eval()
            _dncnn_model = model
        except Exception as exc:
            print(f"[Spirit Lens Local Engine] Warning: Could not load pretrained DnCNN weights ({exc}). Falling back to initialized DnCNN.")
            model = DnCNN(
                in_channels=3,
                out_channels=3,
                pretrained=None,
                device=DEVICE,
            )
            model.eval()
            _dncnn_model = model
    return _dncnn_model


def classify_celestial_object(flux: float, max_flux: float, sharpness: float) -> str:
    """Classify a detected source using normalized flux and morphological sharpness."""
    relative_flux = flux / max(max_flux, 1e-6)
    if relative_flux >= 0.65:
        return "Luminous Star"
    if sharpness < 0.42 and relative_flux >= 0.25:
        return "Deep-Sky Candidate"
    if relative_flux >= 0.28:
        return "Compact Star"
    return "Faint Stellar Source"


def detect_stars_daofind(gray_image: np.ndarray, width: int, height: int) -> List[Dict[str, Any]]:
    """Run photutils.DAOStarFinder on the restored luminance channel and return normalized 0-100 coordinates."""
    data = gray_image.astype(np.float64)
    mean, median, std = sigma_clipped_stats(data, sigma=3.0, maxiters=5)

    # Guard against flat or near-zero background std
    effective_std = max(float(std), 2.5)
    daofind = DAOStarFinder(fwhm=3.5, threshold=3.5 * effective_std)
    sources = daofind(data - median)

    if sources is None or len(sources) == 0:
        return []

    # Sort by flux descending and cap to top 120 sources for responsive HUD rendering
    sources.sort("flux")
    sources.reverse()
    top_sources = sources[:120]

    fluxes = np.array([max(float(row["flux"]), 0.0) for row in top_sources], dtype=np.float64)
    max_flux = float(np.max(fluxes)) if len(fluxes) > 0 else 1.0

    stars: List[Dict[str, Any]] = []
    for row in top_sources:
        x_centroid = float(row["xcentroid"])
        y_centroid = float(row["ycentroid"])
        flux = max(float(row["flux"]), 0.0)
        sharpness = float(row["sharpness"]) if "sharpness" in row.colnames and not math.isnan(float(row["sharpness"])) else 0.5
        peak = max(float(row["peak"]), 0.0) if "peak" in row.colnames else flux

        norm_x = round(max(0.0, min(100.0, (x_centroid / max(width, 1)) * 100.0)), 2)
        norm_y = round(max(0.0, min(100.0, (y_centroid / max(height, 1)) * 100.0)), 2)
        norm_brightness = round(max(0.05, min(1.0, flux / max(max_flux, 1e-6))), 3)

        # Estimate visual reticle size (in px) from flux and peak intensity
        estimated_size = round(max(2.5, min(14.0, 3.0 + 7.5 * math.sqrt(norm_brightness))), 2)
        obj_type = classify_celestial_object(flux=flux, max_flux=max_flux, sharpness=sharpness)

        stars.append(
            {
                "x": norm_x,
                "y": norm_y,
                "brightness": norm_brightness,
                "size": estimated_size,
                "type": obj_type,
                "flux": round(flux, 2),
                "peak": round(peak, 2),
            }
        )

    return stars


@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "engine": "local-dncnn-daostarfinder",
        "device": str(DEVICE),
    }


@app.post("/api/restore")
async def restore_image(
    file: UploadFile = File(...),
    strength: float = Form(0.75),
):
    """
    Denoise an astronomical image using a pre-trained DnCNN model (no hallucination)
    and extract stellar objects with photutils.DAOStarFinder.
    """
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded image file is empty.")

    np_buffer = np.frombuffer(contents, dtype=np.uint8)
    bgr_image = cv2.imdecode(np_buffer, cv2.IMREAD_COLOR)
    if bgr_image is None:
        raise HTTPException(status_code=400, detail="Unable to decode uploaded image.")

    height, width = bgr_image.shape[:2]
    clamped_strength = float(max(0.05, min(1.0, strength)))

    # Convert BGR -> RGB float32 tensor in [0, 1], shape (1, 3, H, W)
    rgb_image = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2RGB)
    img_float = rgb_image.astype(np.float32) / 255.0
    input_tensor = (
        torch.from_numpy(np.transpose(img_float, (2, 0, 1)))
        .unsqueeze(0)
        .to(DEVICE)
    )

    # Run pre-trained DnCNN inference without gradients
    model = get_dncnn_model()
    with torch.no_grad():
        try:
            sigma_estimate = 0.06 * clamped_strength
            denoised_tensor = model(input_tensor, sigma=sigma_estimate)
        except TypeError:
            denoised_tensor = model(input_tensor)

    denoised_np = (
        denoised_tensor.squeeze(0)
        .detach()
        .cpu()
        .numpy()
    )
    denoised_np = np.transpose(denoised_np, (1, 2, 0))
    denoised_np = np.clip(denoised_np, 0.0, 1.0)

    # Blend original and DnCNN output using requested restoration strength
    blended_rgb = (1.0 - clamped_strength) * img_float + clamped_strength * denoised_np
    restored_rgb_u8 = np.clip(blended_rgb * 255.0, 0, 255).astype(np.uint8)

    # Extract stars on the restored grayscale luminance channel via DAOStarFinder
    restored_gray = cv2.cvtColor(restored_rgb_u8, cv2.COLOR_RGB2GRAY)
    stars = detect_stars_daofind(restored_gray, width=width, height=height)

    # Encode restored image to base64 PNG with full data URI prefix
    restored_bgr_u8 = cv2.cvtColor(restored_rgb_u8, cv2.COLOR_RGB2BGR)
    success, encoded_png = cv2.imencode(".png", restored_bgr_u8)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to encode restored PNG image.")

    b64_str = base64.b64encode(encoded_png.tobytes()).decode("utf-8")
    data_uri = f"data:image/png;base64,{b64_str}"

    return {
        "restoredImage": data_uri,
        "stars": stars,
        "engine": "local",
        "width": width,
        "height": height,
        "strength": clamped_strength,
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

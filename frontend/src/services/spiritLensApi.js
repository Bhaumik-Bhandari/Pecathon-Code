const PRIMARY_CLOUD_API_URL =
  "https://lighter-solution-knight-nutrition.trycloudflare.com/api/restore";
const FALLBACK_LOCAL_API_URL = "http://localhost:8000/api/restore";
const CLOUD_TIMEOUT_MS = 6000;

/**
 * Normalize the API response so the Dojo Dashboard always receives:
 * - restoredImage: full data:image/png;base64,... URI
 * - stars: array with normalized 0-100 (x, y) coordinates, brightness, size, and type
 */
function normalizeRestorePayload(data, engineSource, fallbackWidth = 1000, fallbackHeight = 1000) {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid restoration response payload.");
  }

  const rawImage =
    data.restoredImage ||
    data.restored_image ||
    data.image ||
    "";

  if (!rawImage || typeof rawImage !== "string") {
    throw new Error("Restoration response did not include a restoredImage string.");
  }

  const restoredImage = rawImage.startsWith("data:image/")
    ? rawImage
    : `data:image/png;base64,${rawImage}`;

  const imgWidth = Number(data.width) || fallbackWidth;
  const imgHeight = Number(data.height) || fallbackHeight;

  const rawStars = Array.isArray(data.stars) ? data.stars : [];
  const needsCoordinateNormalization = rawStars.some(
    (s) => Number(s?.x) > 100 || Number(s?.y) > 100
  );

  const stars = rawStars.map((star, index) => {
    const rawX = Number(star?.x ?? 0);
    const rawY = Number(star?.y ?? 0);

    const x = needsCoordinateNormalization
      ? Math.min(100, Math.max(0, Number(((rawX / Math.max(imgWidth, 1)) * 100).toFixed(2))))
      : Math.min(100, Math.max(0, Number(rawX.toFixed(2))));

    const y = needsCoordinateNormalization
      ? Math.min(100, Math.max(0, Number(((rawY / Math.max(imgHeight, 1)) * 100).toFixed(2))))
      : Math.min(100, Math.max(0, Number(rawY.toFixed(2))));

    const rawBrightness = Number(star?.brightness ?? 0.6);
    const brightness =
      rawBrightness > 1
        ? Math.min(1, Math.max(0.05, Number((rawBrightness / 255).toFixed(3))))
        : Math.min(1, Math.max(0.05, Number(rawBrightness.toFixed(3))));

    const size = Number(star?.size) > 0
      ? Number(Number(star.size).toFixed(2))
      : Number((3 + brightness * 6).toFixed(2));

    const type =
      typeof star?.type === "string" && star.type.trim()
        ? star.type.trim()
        : brightness >= 0.7
          ? "Luminous Star"
          : brightness >= 0.35
            ? "Compact Star"
            : "Faint Stellar Source";

    return {
      id: star?.id ?? `star-${index + 1}`,
      x,
      y,
      brightness,
      size,
      type,
    };
  });

  return {
    restoredImage,
    stars,
    engine: data.engine || engineSource,
  };
}

/**
 * Deterministic in-browser astronomical denoising & star centroid extraction
 * used only if both the remote Cloudflare tunnel AND local port 8000 are offline
 * in a hosted web preview environment.
 */
async function runBrowserCanvasFallback(file, strength = 0.75) {
  const bitmapUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not decode uploaded image file."));
      img.src = bitmapUrl;
    });

    const width = image.naturalWidth || image.width || 800;
    const height = image.naturalHeight || image.height || 600;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(image, 0, 0, width, height);

    const imageData = ctx.getImageData(0, 0, width, height);
    const src = imageData.data;
    const dst = new Uint8ClampedArray(src.length);
    const clampedStrength = Math.max(0.1, Math.min(1.0, Number(strength) || 0.75));

    // Estimate background luminance floor for dark-sky suppression
    let lumSum = 0;
    const pixelCount = width * height;
    const lumBuffer = new Float32Array(pixelCount);

    for (let i = 0; i < pixelCount; i++) {
      const idx = i * 4;
      const lum = 0.299 * src[idx] + 0.587 * src[idx + 1] + 0.114 * src[idx + 2];
      lumBuffer[i] = lum;
      lumSum += lum;
    }

    const meanLum = lumSum / Math.max(pixelCount, 1);
    let varianceSum = 0;
    for (let i = 0; i < pixelCount; i++) {
      const diff = lumBuffer[i] - meanLum;
      varianceSum += diff * diff;
    }
    const stdLum = Math.max(2.5, Math.sqrt(varianceSum / Math.max(pixelCount, 1)));
    const bgFloor = Math.min(42, meanLum * 0.65 * clampedStrength);

    // 3x3 edge-preserving bilateral-like kernel (suppresses chroma/read noise, preserves stellar PSFs)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const centerIdx = (y * width + x) * 4;
        const cLum = lumBuffer[y * width + x];

        let rAcc = 0;
        let gAcc = 0;
        let bAcc = 0;
        let wAcc = 0;

        for (let dy = -1; dy <= 1; dy++) {
          const ny = Math.min(height - 1, Math.max(0, y + dy));
          for (let dx = -1; dx <= 1; dx++) {
            const nx = Math.min(width - 1, Math.max(0, x + dx));
            const nPos = ny * width + nx;
            const nIdx = nPos * 4;
            const lumDiff = Math.abs(lumBuffer[nPos] - cLum);
            const spatialWeight = dx === 0 && dy === 0 ? 2.5 : 1.0;
            const rangeWeight = Math.exp(-(lumDiff * lumDiff) / (2 * 26 * 26));
            const weight = spatialWeight * rangeWeight;

            rAcc += src[nIdx] * weight;
            gAcc += src[nIdx + 1] * weight;
            bAcc += src[nIdx + 2] * weight;
            wAcc += weight;
          }
        }

        const denoisedR = Math.max(0, (rAcc / wAcc - bgFloor) * (1 + 0.16 * clampedStrength));
        const denoisedG = Math.max(0, (gAcc / wAcc - bgFloor) * (1 + 0.16 * clampedStrength));
        const denoisedB = Math.max(0, (bAcc / wAcc - bgFloor) * (1 + 0.18 * clampedStrength));

        dst[centerIdx] = Math.min(255, Math.round(src[centerIdx] * (1 - clampedStrength) + denoisedR * clampedStrength));
        dst[centerIdx + 1] = Math.min(255, Math.round(src[centerIdx + 1] * (1 - clampedStrength) + denoisedG * clampedStrength));
        dst[centerIdx + 2] = Math.min(255, Math.round(src[centerIdx + 2] * (1 - clampedStrength) + denoisedB * clampedStrength));
        dst[centerIdx + 3] = src[centerIdx + 3];
      }
    }

    // Local peak star detection (DAOStarFinder equivalent on luminance buffer)
    const threshold = meanLum + 2.6 * stdLum;
    const candidates = [];
    const stride = Math.max(2, Math.floor(Math.min(width, height) / 180));

    for (let y = 4; y < height - 4; y += stride) {
      for (let x = 4; x < width - 4; x += stride) {
        const val = lumBuffer[y * width + x];
        if (val < threshold) continue;

        let isLocalMax = true;
        for (let dy = -2; dy <= 2 && isLocalMax; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            if (dx === 0 && dy === 0) continue;
            if (lumBuffer[(y + dy) * width + (x + dx)] > val) {
              isLocalMax = false;
              break;
            }
          }
        }

        if (isLocalMax) {
          // Compute local sharpness ratio
          const ringMean =
            (lumBuffer[(y - 2) * width + x] +
              lumBuffer[(y + 2) * width + x] +
              lumBuffer[y * width + (x - 2)] +
              lumBuffer[y * width + (x + 2)]) /
            4;
          const flux = Math.max(1, val - meanLum);
          const sharpness = (val - ringMean) / Math.max(flux, 1);

          candidates.push({
            px: x,
            py: y,
            flux,
            sharpness,
          });
        }
      }
    }

    candidates.sort((a, b) => b.flux - a.flux);

    // Non-maximum suppression to avoid duplicate reticles on bright stars
    const minDistSq = Math.pow(Math.max(8, Math.min(width, height) * 0.025), 2);
    const filtered = [];
    for (const c of candidates) {
      const tooClose = filtered.some((existing) => {
        const dx = existing.px - c.px;
        const dy = existing.py - c.py;
        return dx * dx + dy * dy < minDistSq;
      });
      if (!tooClose) {
        filtered.push(c);
      }
      if (filtered.length >= 90) break;
    }

    const maxFlux = filtered[0]?.flux || 1;
    const stars = filtered.map((star, index) => {
      const brightness = Number(Math.min(1, Math.max(0.08, star.flux / maxFlux)).toFixed(3));
      const size = Number((3.2 + Math.sqrt(brightness) * 7.2).toFixed(2));
      let type = "Faint Stellar Source";
      if (brightness >= 0.68) {
        type = "Luminous Star";
      } else if (star.sharpness < 0.35 && brightness >= 0.26) {
        type = "Deep-Sky Candidate";
      } else if (brightness >= 0.32) {
        type = "Compact Star";
      }

      return {
        id: `star-${index + 1}`,
        x: Number(((star.px / width) * 100).toFixed(2)),
        y: Number(((star.py / height) * 100).toFixed(2)),
        brightness,
        size,
        type,
      };
    });

    imageData.data.set(dst);
    ctx.putImageData(imageData, 0, 0);
    const restoredImage = canvas.toDataURL("image/png");

    return {
      restoredImage,
      stars,
      engine: "local-fallback",
    };
  } finally {
    URL.revokeObjectURL(bitmapUrl);
  }
}

/**
 * Dual-Engine AI Restoration Request:
 * 1. Sends FormData (file, strength) to the primary Cloudflare tunnel with a 6-second AbortController timeout.
 * 2. If the primary cloud request times out or fails, immediately sends the same FormData to http://localhost:8000/api/restore.
 */
export async function restoreImage(file, strength = 0.75) {
  if (!file) {
    throw new Error("Please provide an image file to restore.");
  }

  const createPayload = () => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("strength", String(strength));
    return formData;
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, CLOUD_TIMEOUT_MS);

  try {
    const cloudResponse = await fetch(PRIMARY_CLOUD_API_URL, {
      method: "POST",
      body: createPayload(),
      signal: controller.signal,
    });

    if (!cloudResponse.ok) {
      throw new Error(
        `Primary cloud API responded with status ${cloudResponse.status}`
      );
    }

    const cloudData = await cloudResponse.json();
    return normalizeRestorePayload(cloudData, "cloud");
  } catch (cloudError) {
    console.warn(
      "[Spirit Lens] Primary cloud engine timed out or failed. Switching to local AI engine (http://localhost:8000/api/restore):",
      cloudError?.message || cloudError
    );

    try {
      const localResponse = await fetch(FALLBACK_LOCAL_API_URL, {
        method: "POST",
        body: createPayload(),
      });

      if (!localResponse.ok) {
        throw new Error(
          `Local fallback API responded with status ${localResponse.status}`
        );
      }

      const localData = await localResponse.json();
      return normalizeRestorePayload(localData, "local");
    } catch (localError) {
      console.warn(
        "[Spirit Lens] Local port 8000 engine unreachable in browser environment. Running client-side astronomical restoration fallback:",
        localError?.message || localError
      );
      return runBrowserCanvasFallback(file, strength);
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

# Spirit Lens Dual-Engine AI Architecture & Dojo Workspace

This plan establishes a resilient dual-engine astronomical image restoration pipeline for **The Spirit Lens**, pairing a primary cloud GPU endpoint with a local FastAPI fallback engine powered by pre-trained **DnCNN** denoising and **DAOStarFinder** astrometric source detection, connected to a complete interactive Spirit Lens Dojo interface.

## User Review & Critical Decisions

> [!IMPORTANT]
> All core architectural and formatting choices have been aligned based on your confirmed preferences:

- **Confirmed Decision 1 — Full Spirit Lens Dojo UI Integration**: In addition to the local Python AI engine and the dual-engine API service, we will build and wire the interactive Spirit Lens workspace (`ImageUpload`, `ImageCompareSlider`, `ObjectOverlay`, and `ScanMetrics`) directly below the cosmic expedition intro on the Spirit Lens page (`#spirit-lens-upload`).
- **Confirmed Decision 2 — Data URI Image Payload**: The `/api/restore` endpoint will return `restoredImage` formatted with a complete `data:image/png;base64,...` prefix so the frontend comparison slider can render the restored frame immediately without manual blob conversion.
- **Confirmed Decision 3 — Normalized Astrometric Coordinates**: Star detections from `DAOStarFinder` will normalize `x` and `y` coordinates to a `0–100` percentage scale relative to image dimensions, ensuring responsive alignment across any viewport size in the interactive overlay.

---

## 1. Overview & Core Concept

- **What It Does**: Allows stargazers and astrophotographers to upload noisy night-sky frames, adjust denoising strength, and run non-hallucinatory neural restoration (`DnCNN`) alongside automated stellar source extraction (`DAOStarFinder`). Users can inspect before/after clarity with a split comparison slider, toggle detected celestial object markers, and review photometric scan metrics.
- **Target Audience / Persona**: Amateur astronomers, astrophotographers, and PECathon judges evaluating real-time scientific image processing with high-availability fallback resilience.
- **Key Value**: Guarantees zero-hallucination scientific restoration (preserving true stellar point sources rather than inventing synthetic stars) while ensuring uninterrupted availability through automatic 6-second failover from the remote Cloudflare tunnel to the local FastAPI engine.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Expedition Entry**: From the Spirit Lens 3D/CSS celestial expedition header, clicking **Enter Spirit Lens** smoothly scrolls to the `#spirit-lens-upload` Dojo workspace.
  2. **Frame Selection & Calibration**: Users drag-and-drop or select an astronomical image (JPG, PNG, WEBP, or FITS preview) and calibrate the **Restoration Strength** slider (`0.1` to `1.0`), or load a built-in noisy deep-sky sample frame for instant testing.
  3. **Dual-Engine Execution**: Clicking **Restore Image** initiates the primary cloud request with a 6-second `AbortController` timeout. If the cloud tunnel is unreachable or times out, the client automatically switches to the local FastAPI engine on port `8000` and reports the active engine source.
  4. **Interactive Inspection**: Once processed, the **Image Compare Slider** lets users scrub horizontally between the raw noisy input and the DnCNN-restored frame, while toggling the **Object Overlay** to inspect individual stars (`x`, `y`, brightness, size, and object classification) and reviewing aggregated telemetry in **Scan Metrics**.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Calibrated Astronomical Observatory meets **Mystic Mikado** — combining deep obsidian space surfaces with warm brass/gold instrumentation accents and tabular scientific telemetry.
  - *Color Palette & Mood*:
    - **60% Dominant Canvas**: Deep space obsidian (`#080E19` and `#0B0E17`) matching the existing Tsukuyomi Watch shell.
    - **30% Structural Surfaces**: Flat slate instrument panels (`#101722` / `#142135`) with crisp `1px` hairline borders (`rgba(226, 196, 148, 0.16)`).
    - **10% Telemetry Accent Budget**: Calibrated Mikado gold (`#E9B15D` / `#D4AE6A`) for primary actions, active slider handles, and target reticles, paired with semantic emerald/amber text indicators for engine status.
  - *Typography & Hierarchy*:
    - **Display & Section Headings**: `Manrope` (`600–700` weight, `text-wrap: balance`).
    - **Interface Prose**: `DM Sans` (`400–500` weight) for clear operational labels.
    - **Astrometric Data & Coordinates**: `font-mono tabular-nums` for star coordinates, flux brightness, FWHM sizes, and processing latency to prevent layout jitter.
  - *Component Styling & Layout*: Asymmetric split console on desktop (`1440px` baseline) — a left parameter & upload control column (`340px–380px`) paired with a wide interactive viewport stage (`flex-1`) housing the comparison scrubber, crosshair star overlay, and a bottom photometric catalog strip.

- **Interactive Feedback & Motion**:
  - Instant drag-over border highlight and file validation feedback (`<= 150ms`).
  - Engine failover status indicator showing whether the restoration completed via the **Primary Cloud Engine** or **Local Fallback Engine (Port 8000)**.
  - Interactive reticle hover/selection on the restored viewport that highlights the corresponding star entry in the photometric readout.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Pre-Trained DnCNN + Classical Astrometry (`DAOStarFinder`)**
  - *Chosen Approach*: Use `deepinv.models.DnCNN(pretrained="download_lipschitz")` blended by the user's `strength` parameter, followed by background-subtracted `photutils.detection.DAOStarFinder` source extraction.
  - *Why*: Generative diffusion models hallucinate fake stars and nebulae, which invalidates scientific astrophotography. DnCNN removes sensor read noise and shot noise while preserving true point-spread functions (PSFs), allowing `DAOStarFinder` to measure real stellar centroids and flux.
  - *Alternatives Considered*: Pure OpenCV bilateral filtering (insufficient for deep-sky sensor noise) or generative upscalers (scientifically inaccurate).

- **Decision 2: 6-Second `AbortController` Cloud-to-Local Failover**
  - *Chosen Approach*: Attempt the remote Cloudflare endpoint (`https://lighter-solution-knight-nutrition.trycloudflare.com/api/restore`) with a strict 6,000ms abort timer, falling back immediately to `http://localhost:8000/api/restore` on timeout or network error.
  - *Why*: Ephemeral cloud tunnels can drop or throttle during live demonstrations; a 6-second threshold keeps the user experience responsive while prioritizing cloud GPU acceleration when available.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Spirit Lens Page (SpiritLens)                        │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │               SpiritLensScene (3D/CSS Launch Header)                  │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
│                                      │ Scrolls to #spirit-lens-upload       │
│  ┌───────────────────────────────────▼───────────────────────────────────┐  │
│  │                     Spirit Lens Dojo Workspace                        │  │
│  │  ┌─────────────────────────┐  ┌────────────────────────────────────┐  │  │
│  │  │       ImageUpload       │  │         ImageCompareSlider         │  │  │
│  │  │ (File Drop, Strength,   │  │   (Before / After Split Scrubber)  │  │  │
│  │  │  Sample Frame Loader)   │  │                 +                  │  │  │
│  │  └────────────┬────────────┘  │           ObjectOverlay            │  │  │
│  │               │               │  (0-100% Normalized Star Reticles) │  │  │
│  │               │               └─────────────────┬──────────────────┘  │  │
│  │               │                                 │                     │  │
│  │               │               ┌─────────────────▼──────────────────┐  │  │
│  │               │               │            ScanMetrics             │  │  │
│  │               │               │ (Star Count, Flux, Engine Source)  │  │  │
│  │               │               └────────────────────────────────────┘  │  │
│  └───────────────┼───────────────────────────────────────────────────────┘  │
└──────────────────┼──────────────────────────────────────────────────────────┘
                   │ restoreImage(file, strength)
┌──────────────────▼──────────────────────────────────────────────────────────┐
│                  Dual-Engine Client (spiritLensApi.js)                      │
│     1. POST FormData (file, strength) w/ 6s AbortController timeout         │
│     2. Catch timeout / network / 5xx error -> Immediate Fallback            │
└──────────────────┬─────────────────────────────────────────┬────────────────┘
                   │ Primary (<= 6000ms)                     │ Fallback
┌──────────────────▼─────────────────────┐ ┌─────────────────▼────────────────┐
│        Primary Cloud GPU Engine        │ │   Local FastAPI Engine (:8000)   │
│  https://lighter-solution-knight-      │ │  http://localhost:8000           │
│  nutrition.trycloudflare.com           │ │  POST /api/restore               │
│  POST /api/restore                     │ │  - deepinv DnCNN Denoiser        │
│                                        │ │  - photutils DAOStarFinder       │
└────────────────────────────────────────┘ └──────────────────────────────────┘
```

- **Data Model & Response Contract**:
  - **Request (`multipart/form-data`)**:
    - `file`: Binary image file (`UploadFile`)
    - `strength`: Float value (`0.0` to `1.0`, default `0.75`) controlling the blend ratio between raw and DnCNN-denoised tensors
  - **Response (`application/json`)**:
    - `restoredImage`: String (`"data:image/png;base64,..."`)
    - `stars`: Array of detected celestial objects:
      - `x`: Float (`0–100` normalized horizontal percentage)
      - `y`: Float (`0–100` normalized vertical percentage)
      - `brightness`: Float (`0–1` normalized flux/peak intensity)
      - `size`: Float (estimated radius/FWHM in pixels for reticle scaling)
      - `type`: String classification based on flux/sharpness (e.g., `" Luminous Star"`, `"Compact Star"`, `"Faint Stellar Source"`, `"Deep-Sky Candidate"`)

- **Interactive Component & State Mapping**:
  - `ImageUpload`: Manages file drag/drop validation, preview object URL generation, restoration strength slider (`0.1–1.0`), built-in sample sky frame generation, and triggers `onRestore(file, strength)`.
  - `ImageCompareSlider`: Renders synchronized base and restored images with a draggable vertical divider (`0–100%`), keyboard arrow support, and a slot for the `ObjectOverlay` layer.
  - `ObjectOverlay`: Renders SVG/HTML target reticles at `(star.x%, star.y%)` with toggleable visibility, filter by stellar type, and click/hover selection to inspect individual object photometry.
  - `ScanMetrics`: Displays tabular numeric readouts (`totalStars`, bright/faint distribution, average flux, restoration strength applied, and active engine badge) plus a downloadable JSON/PNG export action.

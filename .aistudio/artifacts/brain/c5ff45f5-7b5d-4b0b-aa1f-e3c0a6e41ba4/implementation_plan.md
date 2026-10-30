# Spirit Lens — Frontend Copy Cleanup & Orbital Scene Alignment Plan

Streamline the Spirit Lens workspace by removing internal backend/AI engine disclosures and failover thresholds from the user interface, fixing overlapping orbital lines and rocket trajectory collisions in the top Celestial Expedition banner, and simplifying the results metrics panel to focus strictly on user-facing astronomical insights.

## User Review & Critical Decisions

> [!IMPORTANT]
> Below are the confirmed design and scope decisions from our review:

- **Confirmed Decision 1 (Frontend Copy & Privacy)**: Remove all internal architecture disclosures (`Primary Cloud GPU inference`, `6-second automatic failover`, `FastAPI`, `DnCNN`, `photutils.DAOStarFinder`, `Timeout threshold: 6.0s`, and the `Target target:` typo) and replace them with clean, user-friendly astronomical copy.
- **Confirmed Decision 2 (Top Celestial Expedition Banner)**: Keep the top planetary expedition section and fix the CSS layout and positioning of the orbital ring, planets, and rocket trajectory so they sit cleanly in the right-hand space viewport without overlapping headings, HUD bars, or bottom controls.
- **Confirmed Decision 3 (Metrics & Catalog Simplification)**: Keep **Detected Sources**, **Mean Brightness**, and **Max Object Size** in a clean 3-column summary strip alongside the interactive object filter and source table, while completely removing the **Active AI Engine** card and internal algorithm labels (`DAOStarFinder 3.5σ`, `Cloudflare Tunnel`, `localhost:8000`).

---

## 1. Overview & Core Concept

- **What It Does**: Provides a polished, distraction-free astrophotography enhancement and star-detection workspace where users can explore celestial targets, upload or generate a night-sky frame, compare before/after noise suppression with an interactive split slider, and inspect detected celestial objects.
- **Target Audience / Persona**: Stargazers, amateur astrophotographers, and hackathon judges evaluating the Spirit Lens visual experience.
- **Key Value**: Eliminates exposed backend implementation details that look like debug telemetry or invite tampering, while fixing visual overlap bugs in the top space scene.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Celestial Expedition Banner**: Users view a clean, non-overlapping orbital animation on the right while reading the mission intro on the left, selecting a celestial destination (`Earth`, `The Moon`, `Mars`, `Jupiter`, `Saturn`), and clicking **Enter Spirit Lens** to scroll smoothly to the workspace.
  2. **Frame Calibration & Restoration**: Users drop a night-sky exposure (or load a sample frame), set the **Noise Reduction Strength** slider, and click **Restore Image**.
  3. **Split Comparison & Source Inspection**: Users drag the vertical comparison handle between `ORIGINAL` and `RESTORED` views, toggle star reticles, filter by object classification, and export their restored PNG or catalog JSON.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Deep-space observatory console integrated with the Mystic Mikado warm gold (`#e9b15d`) and obsidian (`#080e19` / `#0d1522`) palette.
  - *Color Palette & Mood*: Dominant deep-space slate (`#080e19`, 60%), structural panels with subtle hairline borders (`#0d1522` & `border-white/10`, 30%), and calibrated amber/gold accents (`#e9b15d`, 10%).
  - *Typography & Hierarchy*: `Manrope` display headings paired with `DM Sans` body prose and `font-mono tabular-nums` strictly for numeric coordinates, percentages, and pixel sizes.
  - *Component Styling & Layout*: Asymmetric 2-column workspace (`360px` left control panel + flexible right viewport and 3-column metrics strip).
- **Interactive Feedback & Motion**: Smooth CSS compositor animations (`transform`, `opacity`) for the orbital scene and immediate pointer tracking on the before/after comparison slider.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Removing Internal Architecture & Failover Copy from the UI**
  - *Chosen Approach*: Replace references to `Cloud GPU`, `6-second failover`, `FastAPI`, `DnCNN`, and `DAOStarFinder` with user-centric terms (`Spirit Lens Restoration`, `Deep-Sky Enhancement & Star Detection`, `Noise Reduction Strength`, `Restored`).
  - *Why*: Exposing timeout thresholds, port numbers, and library names clutters the UI and reveals internal fallback mechanics to end users.
  - *Alternatives Considered*: Keeping algorithm names as small badges — rejected because the user explicitly requested removing internal logic disclosures from the frontend.
- **Decision 2: Re-anchoring the CSS Orbital Path & Rocket Trajectory**
  - *Chosen Approach*: Constrain `.spirit-lite-orbit`, `.spirit-lite-horizon`, and `.spirit-lite-rocket` keyframes within the right 55% of `.spirit-cinema-frame` with proper `z-index` layering below the HUD and controls, and tighten vertical bounds (`top: 22%` to `height: 56%`).
  - *Why*: Previously, `.spirit-lite-orbit` (`width: 59%`, `rotate(-18deg)`) and `.spirit-lite-rocket` (`z-index: 4`, ascending to `top: 31%`) crossed into the top HUD and left text column, making lines appear to climb over the interface.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:
```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SpiritLens PageView                              │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Celestial Expedition Banner (CSS Space Scene + Planet Selector)   │  │
│  │  • Contained right-side orbital ring, planets & rocket keyframes  │  │
│  │  • Non-overlapping left copy & bottom status bar                  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                   │                                     │
│                                   ▼                                     │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Spirit Lens Workspace Header                                      │  │
│  │  • Clean title, user-friendly subtitle & Active Sector indicator  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                 │                                       │               │
│                 ▼                                       ▼               │
│  ┌─────────────────────────────┐   ┌─────────────────────────────────┐  │
│  │ ImageUpload Console (Left)  │   │ ImageCompareSlider (Right Top)  │  │
│  │  • Dropzone & Sample Loader │   │  • ORIGINAL vs RESTORED split   │  │
│  │  • Noise Reduction Slider   │   │  • ObjectOverlay Star Reticles  │  │
│  │  • Restore & Reset Actions  │   └─────────────────────────────────┘  │
│  └─────────────────────────────┘                    │                   │
│                                                     ▼                   │
│                                    ┌─────────────────────────────────┐  │
│                                    │ ScanMetrics Panel (Right Bottom)│  │
│                                    │  • 3-Card KPI Strip (Sources,   │  │
│                                    │    Mean Brightness, Max Size)   │  │
│                                    │  • Category Filter & Table      │  │
│                                    └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - `selectedId`: Currently selected celestial body (`earth`, `moon`, `mars`, `jupiter`, `saturn`).
  - `selectedFile` & `originalPreviewUrl`: Input image `File` and object URL for preview.
  - `strength`: Numeric value (`0.1` to `1.0`) controlling noise reduction intensity.
  - `restoredImage` & `stars`: Base64/URL of the restored image and array of detected celestial sources (`{ id, x, y, brightness, size, type }`).
- **Interactive Component & State Mapping**:
  - **Celestial Expedition Banner**: Clicking planet buttons updates `selectedId`; clicking `Skip launch` / `Replay sequence` toggles `phase` between `launch` and `orbit`; clicking `Enter Spirit Lens` scrolls smoothly to `#spirit-lens-upload`.
  - **ImageUpload**: Selecting a file or clicking `Load Sample Sky Frame` populates `selectedFile` and resets prior scan outputs; adjusting the range slider updates `strength`; clicking `Restore Image` invokes `restoreImage(selectedFile, strength)`.
  - **ImageCompareSlider & ObjectOverlay**: Dragging the slider updates `sliderPosition` (`0%`–`100%`); clicking `Show/Hide Star Reticles` toggles `showOverlay`; clicking any reticle highlights `selectedStar`.
  - **ScanMetrics**: Displays the 3 core metrics (`Detected Sources`, `Mean Brightness`, `Max Object Size`), filters `stars` by `activeTypeFilter`, highlights `selectedStar` rows on click, and exports the restored PNG or JSON catalog.

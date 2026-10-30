# Tsukuyomi Watch — SkyView Radar Feature Plan

This plan covers adding the standalone **SkyView Radar** multi-wavelength astronomical telescope viewer (`frontend/src/components/features/skyview/SkyViewRadar.jsx`) and wiring it into the app router and Sidebar navigation.

---

## 1. Overview & Core Concept

- **What It Does**: Allows observers to enter any celestial target or coordinate (e.g., `Orion Nebula`, `M31`, `Sirius`) and scan it simultaneously across four NASA SkyView Virtual Observatory spectral bands in a responsive 2×2 grid.
- **Key Value**: Gives users instant multi-spectrum comparison (Optical, Infrared, X-Ray, and Radio) with on-submit API querying so the NASA SkyView CGI endpoint is only called when clicking **Scan Sector**.

---

## 2. User Experience & Visual Design

- **Top Control Bar**:
  - Clean form with a text input (`placeholder="Enter target e.g., Orion Nebula, M31, Sirius"`) and a **"Scan Sector"** submit button.
  - Defaults to a pre-loaded target (`M31` / `Orion Nebula`) so the 2×2 grid is immediately populated on first visit.
- **2×2 Multi-Spectrum Telescope Grid**:
  - Displays 4 survey cards in a responsive `grid-cols-1 md:grid-cols-2` layout:
    1. **Optical (`DSS`)** — Digitized Sky Survey
    2. **Infrared (`2MASS-J`)** — Two Micron All-Sky Survey (J-Band)
    3. **X-Ray (`RASS-Inband`)** — ROSAT All-Sky Survey
    4. **Radio (`NVSS`)** — NRAO VLA Sky Survey
  - Each card tracks its own independent `loading` and `error` state:
    - Shows `"Calibrating telescope telemetry..."` while the NASA JPEG stream is being generated.
    - Shows `"No telemetry available in this spectrum."` if `onError` triggers for a given survey/coordinate.
- **Aesthetic & Theme**:
  - Matches the dark obsidian/samurai palette (`#080c14` / `#0e1522` backgrounds, gold `#e9b15d` and cyan `#22d3ee` accents, and `font-mono tabular-nums` for survey parameters).

---

## 3. Technical Architecture & Routing

```
┌─────────────────────────────────────────────────────────────────────────┐
│                             App Router & Sidebar                        │
│  • /watchtower        ─► Watchtower                                     │
│  • /spirit-lens       ─► SpiritLens                                     │
│  • /celestial-scroll  ─► CelestialScroll                                │
│  • /skyview-radar     ─► SkyViewRadar (New Route & Sidebar Link)        │
└───────────────────────────────────────┬─────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                             SkyViewRadar.jsx                            │
│  • State: inputValue (controlled input), committedTarget (on submit)    │
│  • Constructs 4 NASA SkyView URLs from committedTarget:                 │
│    https://skyview.gsfc.nasa.gov/current/cgi/runquery.pl                │
│      ?Position={encodeURIComponent(target)}&Survey={survey}             │
│      &Pixels=500&Return=JPEG                                            │
│  • 2x2 Grid of SpectrumCard subcomponents with onLoad / onError states  │
└─────────────────────────────────────────────────────────────────────────┘
```

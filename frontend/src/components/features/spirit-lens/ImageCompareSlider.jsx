import { useCallback, useEffect, useRef, useState } from "react";
import {
  Eye,
  EyeOff,
  Maximize2,
  Move,
  MoveHorizontal,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import ObjectOverlay from "./ObjectOverlay";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.5;

export default function ImageCompareSlider({
  originalImage,
  restoredImage,
  stars = [],
  showOverlay = true,
  onToggleOverlay,
  selectedStar,
  onSelectStar,
  activeTypeFilter = "ALL",
}) {
  const containerRef = useRef(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [draggingSlider, setDraggingSlider] = useState(false);

  // Interactive Pan & Zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ clientX: 0, clientY: 0, startX: 0, startY: 0 });

  const clampPan = useCallback((nextX, nextY, targetZoom) => {
    if (targetZoom <= 1) return { x: 0, y: 0 };
    const rect = containerRef.current?.getBoundingClientRect();
    const maxOffsetX = rect ? ((targetZoom - 1) * rect.width) / 2 : 300;
    const maxOffsetY = rect ? ((targetZoom - 1) * rect.height) / 2 : 200;
    return {
      x: Math.max(-maxOffsetX, Math.min(maxOffsetX, nextX)),
      y: Math.max(-maxOffsetY, Math.min(maxOffsetY, nextY)),
    };
  }, []);

  const handleZoomChange = useCallback(
    (nextZoomValue) => {
      const clampedZoom = Math.max(
        MIN_ZOOM,
        Math.min(MAX_ZOOM, Number(nextZoomValue.toFixed(2)))
      );
      setZoom(clampedZoom);
      setPan((prev) => clampPan(prev.x, prev.y, clampedZoom));
    },
    [clampPan]
  );

  const handleResetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Reset zoom/pan when switching images
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [originalImage, restoredImage]);

  const updatePositionFromClientX = useCallback((clientX) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return;
    const relativeX = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (relativeX / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  // Katana Divider Dragging
  useEffect(() => {
    if (!draggingSlider) return undefined;

    function handlePointerMove(event) {
      updatePositionFromClientX(event.clientX);
    }

    function handlePointerUp() {
      setDraggingSlider(false);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [draggingSlider, updatePositionFromClientX]);

  // Zoomed Canvas Panning
  useEffect(() => {
    if (!isPanning) return undefined;

    function handlePointerMove(event) {
      const deltaX = event.clientX - panStartRef.current.clientX;
      const deltaY = event.clientY - panStartRef.current.clientY;
      setPan(
        clampPan(
          panStartRef.current.startX + deltaX,
          panStartRef.current.startY + deltaY,
          zoom
        )
      );
    }

    function handlePointerUp() {
      setIsPanning(false);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isPanning, zoom, clampPan]);

  // Wheel Zoom inside viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    function handleWheel(event) {
      if (!event.ctrlKey && !event.metaKey && zoom === 1 && event.deltaY > 0) {
        // Allow normal page scroll when at 1x and scrolling down
        return;
      }
      event.preventDefault();
      const direction = event.deltaY < 0 ? 0.25 : -0.25;
      handleZoomChange(zoom + direction);
    }

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [zoom, handleZoomChange]);

  if (!originalImage) {
    return (
      <div className="relative isolate z-10 flex min-h-[420px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-[#e2c494]/16 bg-[#080e19] p-8 text-center">
        <p className="text-sm font-medium text-[#f2e9db]">
          Sky Viewport Ready
        </p>
        <p className="mt-1.5 max-w-md text-xs leading-5 text-[#8e99ab]">
          Upload a night-sky photo or load a sample frame on the left to
          compare original and restored exposures.
        </p>
      </div>
    );
  }

  const hasRestored = Boolean(restoredImage);

  const transformStyle = {
    transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
    transformOrigin: "center center",
    transition: isPanning ? "none" : "transform 160ms cubic-bezier(0.16, 1, 0.3, 1)",
  };

  return (
    <div className="relative isolate z-10 flex flex-col gap-3 overflow-hidden rounded-2xl border border-[#e2c494]/16 bg-[#0d1522] p-4 sm:p-5">
      {/* Viewport Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#b7c0ce]">
          <span className="font-semibold text-[#f2e9db]">
            {hasRestored ? "Katana Before / After Split" : "Original Exposure Preview"}
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums text-[#8e99ab]">
            {hasRestored
              ? `Split ${Math.round(sliderPosition)}% · ${stars.length} sources`
              : "Ready to restore"}
          </span>
          {zoom > 1 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#e9b15d]">
                <Move size={12} />
                Drag canvas to pan
              </span>
            </>
          )}
        </div>

        {/* Zoom & Star Marker Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center rounded-lg border border-white/10 bg-[#080e19] p-0.5">
            <button
              type="button"
              onClick={() => handleZoomChange(zoom - ZOOM_STEP)}
              disabled={zoom <= MIN_ZOOM}
              aria-label="Zoom out"
              title="Zoom out"
              className="rounded-md p-1.5 text-[#b7c0ce] transition hover:bg-white/10 hover:text-white disabled:opacity-35"
            >
              <ZoomOut size={14} />
            </button>

            <span className="min-w-[50px] px-1.5 text-center font-mono text-xs font-semibold tabular-nums text-[#e9b15d]">
              {Math.round(zoom * 100)}%
            </span>

            <button
              type="button"
              onClick={() => handleZoomChange(zoom + ZOOM_STEP)}
              disabled={zoom >= MAX_ZOOM}
              aria-label="Zoom in"
              title="Zoom in"
              className="rounded-md p-1.5 text-[#b7c0ce] transition hover:bg-white/10 hover:text-white disabled:opacity-35"
            >
              <ZoomIn size={14} />
            </button>

            {zoom > 1 && (
              <button
                type="button"
                onClick={handleResetView}
                aria-label="Reset zoom and pan"
                title="Reset 100% view"
                className="ml-0.5 inline-flex items-center gap-1 rounded-md border-l border-white/10 px-2 py-1 text-[11px] font-medium text-[#e9b15d] transition hover:bg-white/10"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>

          {hasRestored && (
            <button
              type="button"
              onClick={onToggleOverlay}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition whitespace-nowrap ${
                showOverlay
                  ? "border-[#e9b15d]/50 bg-[#e9b15d]/15 text-[#f2e9db]"
                  : "border-white/10 bg-white/[0.03] text-[#95a0b2] hover:text-white"
              }`}
            >
              {showOverlay ? (
                <Eye size={14} className="text-[#e9b15d]" />
              ) : (
                <EyeOff size={14} />
              )}
              <span>{showOverlay ? "Hide Markers" : "Show Markers"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Interactive Image Stage — isolated stacking context & overflow-hidden prevents Topbar overlap */}
      <div
        ref={containerRef}
        onPointerDown={(e) => {
          if (zoom > 1) {
            setIsPanning(true);
            panStartRef.current = {
              clientX: e.clientX,
              clientY: e.clientY,
              startX: pan.x,
              startY: pan.y,
            };
            return;
          }
          if (hasRestored) {
            updatePositionFromClientX(e.clientX);
          }
        }}
        className={`relative isolate z-10 aspect-[16/10] w-full select-none overflow-hidden rounded-xl border border-white/10 bg-[#05080f] ${
          zoom > 1
            ? isPanning
              ? "cursor-grabbing"
              : "cursor-grab"
            : "cursor-crosshair"
        }`}
      >
        {/* Base Layer: Restored Image (or Original if not yet restored) */}
        <div className="absolute inset-0 h-full w-full" style={transformStyle}>
          <img
            src={restoredImage || originalImage}
            alt={
              hasRestored
                ? "Restored night-sky exposure"
                : "Original night-sky exposure"
            }
            referrerPolicy="no-referrer"
            draggable={false}
            className="block h-full w-full object-contain"
          />

          {/* Detected Stars Overlay transforms in lockstep with zoomed/panned image */}
          {hasRestored && (
            <ObjectOverlay
              stars={stars}
              visible={showOverlay}
              selectedStar={selectedStar}
              onSelectStar={onSelectStar}
              activeTypeFilter={activeTypeFilter}
            />
          )}
        </div>

        {/* Foreground Clipped Layer: Raw Original Image (Left side of Katana slider) */}
        {hasRestored && (
          <div
            className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          >
            <div className="h-full w-full" style={transformStyle}>
              <img
                src={originalImage}
                alt="Original night-sky exposure"
                referrerPolicy="no-referrer"
                draggable={false}
                className="block h-full w-full object-contain"
              />
            </div>
          </div>
        )}

        {/* Corner Labels (z-20 inside isolated container) */}
        <div className="pointer-events-none absolute left-3 top-3 z-20 rounded border border-white/10 bg-[#080e19]/85 px-2.5 py-1 font-mono text-[11px] text-[#cbd5e1]">
          BEFORE · RAW
        </div>

        {hasRestored && (
          <div className="pointer-events-none absolute right-3 top-3 z-20 rounded border border-[#e9b15d]/35 bg-[#080e19]/85 px-2.5 py-1 font-mono text-[11px] text-[#e9b15d]">
            AFTER · RESTORED
          </div>
        )}

        {/* Bottom HUD Hint for Zoom/Pan */}
        <div className="pointer-events-none absolute bottom-3 left-3 z-20 flex items-center gap-2 rounded-lg border border-white/10 bg-[#080e19]/85 px-2.5 py-1 text-[11px] text-[#95a0b2]">
          <Maximize2 size={11} className="text-[#e9b15d]" />
          <span className="font-mono tabular-nums">
            {zoom > 1
              ? `${zoom.toFixed(1)}x Magnification · Drag image to pan, drag blade to split`
              : "Use + / - or scroll wheel to zoom up to 4x"}
          </span>
        </div>

        {/* Vertical Katana Split Handle (strictly clipped inside overflow-hidden stage, z-20) */}
        {hasRestored && (
          <div
            role="slider"
            tabIndex={0}
            aria-label="Katana before and after image comparison slider"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(sliderPosition)}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") {
                e.preventDefault();
                setSliderPosition((p) => Math.max(0, p - 4));
              } else if (e.key === "ArrowRight") {
                e.preventDefault();
                setSliderPosition((p) => Math.min(100, p + 4));
              }
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              setDraggingSlider(true);
            }}
            style={{ left: `${sliderPosition}%` }}
            className="absolute inset-y-0 z-20 w-0.5 -translate-x-1/2 cursor-ew-resize bg-gradient-to-b from-[#f5cb83] via-[#e9b15d] to-[#d94c42] shadow-[0_0_12px_rgba(233,177,93,0.85)] focus-visible:outline-none"
          >
            <span className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#e9b15d] bg-[#0b121e] text-[#e9b15d] shadow-[0_0_16px_rgba(233,177,93,0.45)] transition-transform hover:scale-110">
              <MoveHorizontal size={16} />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

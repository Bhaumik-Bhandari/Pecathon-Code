import { useRef, useState } from "react";
import {
  FileImage,
  RefreshCw,
  RotateCcw,
  Sliders,
  Sparkles,
  Upload,
} from "lucide-react";

/**
 * Generates a synthetic noisy deep-sky astronomical frame on an HTML5 canvas
 * so users can test the DnCNN + DAOStarFinder pipeline with one click.
 */
export function generateSampleAstronomyFile() {
  return new Promise((resolve) => {
    const width = 960;
    const height = 600;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    // Deep-sky background gradient
    const bgGrad = ctx.createRadialGradient(
      width * 0.62,
      height * 0.42,
      20,
      width * 0.5,
      height * 0.5,
      width * 0.7
    );
    bgGrad.addColorStop(0, "#141d30");
    bgGrad.addColorStop(0.5, "#0b101c");
    bgGrad.addColorStop(1, "#05080f");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle diffuse nebula glow
    const nebGrad = ctx.createRadialGradient(
      width * 0.58,
      height * 0.44,
      10,
      width * 0.58,
      height * 0.44,
      210
    );
    nebGrad.addColorStop(0, "rgba(182, 134, 88, 0.16)");
    nebGrad.addColorStop(0.45, "rgba(92, 118, 178, 0.09)");
    nebGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = nebGrad;
    ctx.fillRect(0, 0, width, height);

    // Seeded pseudo-random generator for reproducible stellar catalog
    let seed = 4219;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    // Draw 55 realistic stellar point-spread functions (PSFs)
    for (let i = 0; i < 55; i++) {
      const x = 40 + rand() * (width - 80);
      const y = 36 + rand() * (height - 72);
      const tier = rand();
      const radius = tier > 0.86 ? 4.8 + rand() * 3.2 : tier > 0.45 ? 2.4 + rand() * 1.8 : 1.3 + rand();
      const warm = rand() > 0.65;

      const starGrad = ctx.createRadialGradient(x, y, 0, x, y, radius * 3.2);
      if (warm) {
        starGrad.addColorStop(0, "rgba(255, 248, 231, 1)");
        starGrad.addColorStop(0.32, "rgba(244, 206, 146, 0.82)");
        starGrad.addColorStop(1, "rgba(244, 206, 146, 0)");
      } else {
        starGrad.addColorStop(0, "rgba(248, 252, 255, 1)");
        starGrad.addColorStop(0.32, "rgba(182, 214, 255, 0.78)");
        starGrad.addColorStop(1, "rgba(182, 214, 255, 0)");
      }

      ctx.fillStyle = starGrad;
      ctx.beginPath();
      ctx.arc(x, y, radius * 3.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Inject realistic ISO sensor read noise & shot noise
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const grain = (rand() - 0.42) * 38;
      const chromaR = (rand() - 0.5) * 18;
      const chromaB = (rand() - 0.5) * 18;
      data[i] = Math.min(255, Math.max(0, data[i] + grain + chromaR));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + grain));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + grain + chromaB));
    }
    ctx.putImageData(imgData, 0, 0);

    canvas.toBlob((blob) => {
      const sampleFile = new File([blob], "cygnus_field_iso6400_raw.png", {
        type: "image/png",
      });
      resolve(sampleFile);
    }, "image/png");
  });
}

export default function ImageUpload({
  selectedFile,
  strength,
  onFileSelect,
  onStrengthChange,
  onRestore,
  onReset,
  loading,
}) {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [generatingSample, setGeneratingSample] = useState(false);

  function handleFiles(files) {
    const file = files?.[0];
    if (!file) return;
    onFileSelect(file);
  }

  function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    if (event.dataTransfer?.files?.length) {
      handleFiles(event.dataTransfer.files);
    }
  }

  async function handleLoadSample() {
    setGeneratingSample(true);
    try {
      const sampleFile = await generateSampleAstronomyFile();
      onFileSelect(sampleFile);
    } finally {
      setGeneratingSample(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-[#e2c494]/16 bg-[#0d1522] p-5 sm:p-6">
      <div>
        <p className="text-xs font-medium tracking-wide text-[#e9b15d]">
          01 · Exposure Input
        </p>
        <h3 className="mt-1 text-lg font-semibold text-[#f2e9db]">
          Calibrate & Restore
        </h3>
        <p className="mt-1 text-xs leading-5 text-[#95a0b2]">
          Upload a night-sky photo or load a sample frame to reduce background
          noise and highlight celestial objects.
        </p>
      </div>

      {/* Dropzone */}
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragActive(false);
        }}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        className={`group flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 py-7 text-center transition duration-150 ${
          dragActive
            ? "border-[#e9b15d] bg-[#e9b15d]/10"
            : "border-[#e2c494]/25 bg-[#080e19]/70 hover:border-[#e9b15d]/55 hover:bg-[#111c2d]/70"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#e9b15d]/25 bg-[#e9b15d]/10 text-[#e9b15d]">
          {selectedFile ? <FileImage size={20} /> : <Upload size={20} />}
        </div>

        {selectedFile ? (
          <div className="mt-3 max-w-full">
            <p className="truncate text-sm font-medium text-[#f2e9db]">
              {selectedFile.name}
            </p>
            <p className="mt-1 font-mono text-xs tabular-nums text-[#8e99ab]">
              {(selectedFile.size / 1024).toFixed(1)} KB · Click to replace frame
            </p>
          </div>
        ) : (
          <div className="mt-3">
            <p className="text-sm font-medium text-[#f2e9db]">
              Drop night-sky photo or browse
            </p>
            <p className="mt-1 text-xs text-[#8e99ab]">
              Supports PNG, JPG, and WEBP exposures
            </p>
          </div>
        )}
      </div>

      {/* Quick sample frame button */}
      <button
        type="button"
        onClick={handleLoadSample}
        disabled={loading || generatingSample}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-medium text-[#d8cbb8] transition hover:border-[#e9b15d]/40 hover:bg-[#e9b15d]/10 hover:text-[#f2e9db] disabled:opacity-50 whitespace-nowrap"
      >
        <Sparkles size={14} className="text-[#e9b15d]" />
        {generatingSample ? "Preparing sample frame..." : "Load Sample Sky Frame"}
      </button>

      {/* Denoising Strength Control */}
      <div className="border-t border-white/10 pt-4">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor="spirit-strength-slider"
            className="flex items-center gap-2 text-xs font-medium text-[#d8cbb8]"
          >
            <Sliders size={14} className="text-[#e9b15d]" />
            <span>Noise Reduction Strength</span>
          </label>
          <span className="font-mono text-sm font-semibold tabular-nums text-[#e9b15d]">
            {Math.round(strength * 100)}%
          </span>
        </div>

        <input
          id="spirit-strength-slider"
          type="range"
          min="0.1"
          max="1.0"
          step="0.05"
          value={strength}
          onChange={(e) => onStrengthChange( parseFloat(e.target.value) )}
          disabled={loading}
          className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#1a2639] accent-[#e9b15d]"
        />

        <div className="mt-1.5 flex justify-between font-mono text-[11px] tabular-nums text-[#7b8698]">
          <span>10% Subtle</span>
          <span>55% Balanced</span>
          <span>100% Deep Clean</span>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="flex flex-col gap-2.5 pt-1 sm:flex-row">
        <button
          type="button"
          onClick={onRestore}
          disabled={!selectedFile || loading}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#e9b15d] bg-gradient-to-r from-[#f1cb8c] to-[#dba653] px-4 py-3 text-xs font-bold text-[#111827] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          {loading ? "Restoring Exposure..." : "Restore Image"}
        </button>

        {selectedFile && (
          <button
            type="button"
            onClick={onReset}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-xs font-medium text-[#b5becd] transition hover:border-white/25 hover:text-white disabled:opacity-50 whitespace-nowrap"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Radar, Search } from "lucide-react";

const SURVEYS = [
  {
    id: "optical",
    title: "Optical (DSS)",
    surveyCode: "DSS",
    band: "Visible Spectrum · Digitized Sky Survey",
    accent: "text-[#e9b15d]",
  },
  {
    id: "infrared",
    title: "Infrared (2MASS)",
    surveyCode: "2MASS-J",
    band: "Near-Infrared 1.25 µm · 2MASS-J",
    accent: "text-cyan-400",
  },
  {
    id: "xray",
    title: "X-Ray (RASS-Inband)",
    surveyCode: "RASS-Inband",
    band: "High-Energy X-Ray · ROSAT All-Sky",
    accent: "text-[#e9b15d]",
  },
  {
    id: "radio",
    title: "Radio (NVSS)",
    surveyCode: "NVSS",
    band: "1.4 GHz Continuum · NRAO VLA",
    accent: "text-cyan-400",
  },
];

function buildSkyViewUrl(target, survey) {
  return `https://skyview.gsfc.nasa.gov/current/cgi/runquery.pl?Position=${encodeURIComponent(
    target
  )}&Survey=${encodeURIComponent(survey)}&Pixels=500&Return=JPEG`;
}

function SpectrumCard({ item, target, scanId }) {
  const [status, setStatus] = useState("loading"); // "loading" | "loaded" | "error"
  const imageUrl = buildSkyViewUrl(target, item.surveyCode);

  useEffect(() => {
    setStatus("loading");
  }, [target, item.surveyCode, scanId]);

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-[#e2c494]/16 bg-[#0b121e] shadow-[0_14px_40px_rgba(0,0,0,0.35)]">
      {/* Card Header */}
      <header className="flex items-center justify-between gap-3 border-b border-white/10 bg-[#0f1726] px-4 py-3.5">
        <div>
          <h2 className="text-sm font-semibold text-[#f2e9db]">{item.title}</h2>
          <p className="mt-0.5 font-mono text-[11px] text-[#8e99ab]">
            {item.band}
          </p>
        </div>

        <span
          className={`font-mono text-xs font-semibold tabular-nums ${item.accent}`}
        >
          {item.surveyCode}
        </span>
      </header>

      {/* Telescope Viewport */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#05080f]">
        {status === "loading" && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2.5 bg-[#05080f] p-6 text-center">
            <Radar size={24} className="animate-spin text-[#e9b15d]" />
            <p className="font-mono text-xs text-[#e9b15d]">
              Calibrating telescope telemetry...
            </p>
            <p className="font-mono text-[11px] text-[#7b8698]">
              Target: {target} · Survey: {item.surveyCode}
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="
            absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[#05080f] p-6 text-center
          ">
            <p className="font-mono text-xs text-[#cbd5e1]">
              No telemetry available in this spectrum.
            </p>
            <p className="font-mono text-[11px] text-[#7b8698]">
              Survey: {item.surveyCode} · 500×500 px
            </p>
          </div>
        )}

        <img
          key={`${target}-${item.surveyCode}-${scanId}`}
          src={imageUrl}
          alt={`${target} in ${item.title} spectrum`}
          referrerPolicy="no-referrer"
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
          className={`block h-full w-full object-cover transition-opacity duration-300 ${
            status === "loaded" ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Subtle HUD Coordinate Overlay */}
        <div className="pointer-events-none absolute bottom-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between rounded-lg border border-white/10 bg-[#080e19]/85 px-2.5 py-1 font-mono text-[11px] tabular-nums text-[#95a0b2]">
          <span className="truncate text-[#f2e9db]">{target}</span>
          <span className="text-cyan-400">500×500 px</span>
        </div>
      </div>
    </article>
  );
}

export default function SkyViewRadar() {
  const [inputValue, setInputValue] = useState("Orion Nebula");
  const [target, setTarget] = useState("Orion Nebula");
  const [scanId, setScanId] = useState(0);

  function handleScanSubmit(event) {
    event.preventDefault();
    const cleaned = inputValue.trim();
    if (!cleaned) return;
    setTarget(cleaned);
    setScanId((prev) => prev + 1);
  }

  return (
    <section className="space-y-6 pb-10">
      {/* Top Control Bar */}
      <div className="rounded-2xl border border-[#e2c494]/20 bg-[#080e19] p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Radar size={18} className="text-[#e9b15d]" />
            <h1 className="text-lg font-semibold text-[#f2e9db] sm:text-xl">
              SkyView Radar · Multi-Spectrum Telemetry
            </h1>
          </div>

          <span className="font-mono text-xs tabular-nums text-cyan-400">
            Active Sector: {target}
          </span>
        </div>

        <form
          onSubmit={handleScanSubmit}
          className="flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <div className="relative flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8e99ab]"
            />
            <input
              type="text"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="Enter target e.g., Orion Nebula, M31, Sirius"
              aria-label="Enter celestial target or coordinates"
              className="w-full rounded-xl border border-white/10 bg-[#0d1522] py-3 pl-10 pr-4 font-mono text-xs text-[#f2e9db] outline-none transition placeholder:text-[#7b8698] focus:border-[#e9b15d]/60"
            />
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#e9b15d] px-5 py-3 text-xs font-semibold text-[#111827] transition hover:bg-[#f5cb83] whitespace-nowrap"
          >
            <Radar size={15} />
            <span>Scan Sector</span>
          </button>
        </form>
      </div>

      {/* 2x2 Multi-Spectrum Telescope Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {SURVEYS.map((item) => (
          <SpectrumCard
            key={item.id}
            item={item}
            target={target}
            scanId={scanId}
          />
        ))}
      </div>
    </section>
  );
}

import { Download, FileJson, Sparkles, Star } from "lucide-react";

const CATEGORIES = [
  "ALL",
  "Luminous Star",
  "Compact Star",
  "Faint Stellar Source",
  "Deep-Sky Candidate",
];

export default function ScanMetrics({
  stars = [],
  strength = 0.75,
  restoredImage = null,
  selectedStar = null,
  onSelectStar,
  activeTypeFilter = "ALL",
  onTypeFilterChange,
}) {
  const totalStars = stars.length;

  const meanBrightness =
    totalStars > 0
      ? stars.reduce((acc, s) => acc + (Number(s.brightness) || 0), 0) / totalStars
      : 0;

  const maxSize =
    totalStars > 0
      ? Math.max(...stars.map((s) => Number(s.size) || 0))
      : 0;

  function handleDownloadRestored() {
    if (!restoredImage) return;
    const link = document.createElement("a");
    link.href = restoredImage;
    link.download = "spirit_lens_restored.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleExportCatalog() {
    const payload = {
      exportedAt: new Date().toISOString(),
      strength,
      totalSources: totalStars,
      stars,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "spirit_lens_star_catalog.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-[#e2c494]/16 bg-[#0d1522] p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-[#e9b15d]">
            02 · Celestial Object Summary
          </p>
          <h3 className="mt-1 text-lg font-semibold text-[#f2e9db]">
            Detected Sky Catalog
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {restoredImage && (
            <>
              <button
                type="button"
                onClick={handleDownloadRestored}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-[#e9d7b9] transition hover:border-[#e9b15d]/40 hover:text-white whitespace-nowrap"
              >
                <Download size={14} className="text-[#e9b15d]" />
                Download PNG
              </button>
              <button
                type="button"
                onClick={handleExportCatalog}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-[#e9d7b9] transition hover:border-[#e9b15d]/40 hover:text-white whitespace-nowrap"
              >
                <FileJson size={14} className="text-[#e9b15d]" />
                Export JSON
              </button>
            </>
          )}
        </div>
      </div>

      {/* 3-Column Metrics Strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-[#080e19]/80 p-3.5">
          <p className="text-xs text-[#8e99ab]">Detected Sources</p>
          <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-[#f2e9db]">
            {totalStars}
          </p>
          <p className="mt-1 text-[11px] text-[#7b8698]">
            Mapped celestial objects
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#080e19]/80 p-3.5">
          <p className="text-xs text-[#8e99ab]">Mean Brightness</p>
          <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-[#f2e9db]">
            {(meanBrightness * 100).toFixed(1)}
            <span className="ml-1 text-xs font-normal text-[#8e99ab]">%</span>
          </p>
          <p className="mt-1 text-[11px] text-[#7b8698]">
            Average relative luminosity
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#080e19]/80 p-3.5">
          <p className="text-xs text-[#8e99ab]">Max Object Size</p>
          <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-[#f2e9db]">
            {maxSize.toFixed(1)}
            <span className="ml-1 text-xs font-normal text-[#8e99ab]">px</span>
          </p>
          <p className="mt-1 text-[11px] text-[#7b8698]">
            Largest detected radius
          </p>
        </div>
      </div>

      {/* Category Filter Bar */}
      {totalStars > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORIES.map((category) => {
            const count =
              category === "ALL"
                ? totalStars
                : stars.filter((s) => s.type === category).length;

            const active = activeTypeFilter === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => onTypeFilterChange?.(category)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition whitespace-nowrap ${
                  active
                    ? "bg-[#e9b15d] text-[#111827] font-semibold"
                    : "border border-white/10 bg-white/[0.02] text-[#95a0b2] hover:border-[#e9b15d]/35 hover:text-[#f2e9db]"
                }`}
              >
                {category === "ALL" ? "All Objects" : category} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Selected Star Callout */}
      {selectedStar && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e9b15d]/35 bg-[#e9b15d]/10 px-4 py-3 text-xs">
          <div className="flex items-center gap-2 text-[#f2e9db]">
            <Sparkles size={15} className="text-[#e9b15d]" />
            <span className="font-semibold">{selectedStar.type}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              X: {selectedStar.x.toFixed(2)}% / Y: {selectedStar.y.toFixed(2)}%
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              Brightness: {(selectedStar.brightness * 100).toFixed(1)}%
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              Size: {selectedStar.size} px
            </span>
          </div>
          <button
            type="button"
            onClick={() => onSelectStar?.(null)}
            className="text-xs font-medium text-[#e9b15d] underline hover:text-white"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Compact Photometric Table */}
      {totalStars > 0 ? (
        <div className="max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-[#080e19]/60">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 border-b border-white/10 bg-[#0b1320] text-[#8e99ab]">
              <tr>
                <th className="px-3.5 py-2.5 font-medium">#</th>
                <th className="px-3.5 py-2.5 font-medium">Classification</th>
                <th className="px-3.5 py-2.5 font-medium">X (%)</th>
                <th className="px-3.5 py-2.5 font-medium">Y (%)</th>
                <th className="px-3.5 py-2.5 font-medium">Brightness</th>
                <th className="px-3.5 py-2.5 font-medium">Size (px)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono tabular-nums text-[#d8cbb8]">
              {stars
                .filter(
                  (s) =>
                    activeTypeFilter === "ALL" || s.type === activeTypeFilter
                )
                .slice(0, 40)
                .map((star, idx) => {
                  const isSelected =
                    selectedStar &&
                    (selectedStar.id === star.id ||
                      (selectedStar.x === star.x &&
                        selectedStar.y === star.y));

                  return (
                    <tr
                      key={star.id || `${star.x}-${star.y}-${idx}`}
                      onClick={() => onSelectStar?.(isSelected ? null : star)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-[#e9b15d]/20 text-white"
                          : "hover:bg-white/[0.04]"
                      }`}
                    >
                      <td className="px-3.5 py-2 text-[#7b8698]">
                        {String(idx + 1).padStart(2, "0")}
                      </td>
                      <td className="px-3.5 py-2 font-sans font-medium text-[#f2e9db]">
                        <span className="inline-flex items-center gap-1.5">
                          <Star size={12} className="text-[#e9b15d]" />
                          {star.type}
                        </span>
                      </td>
                      <td className="px-3.5 py-2">{star.x.toFixed(2)}%</td>
                      <td className="px-3.5 py-2">{star.y.toFixed(2)}%</td>
                      <td className="px-3.5 py-2">
                        {(star.brightness * 100).toFixed(1)}%
                      </td>
                      <td className="px-3.5 py-2">{star.size}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-xs text-[#7b8698]">
          Click "Restore Image" to detect and list stars in the current exposure.
        </p>
      )}
    </div>
  );
}

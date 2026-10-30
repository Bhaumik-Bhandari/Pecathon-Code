export default function ObjectOverlay({
  stars = [],
  visible = true,
  selectedStar,
  onSelectStar,
  activeTypeFilter = "ALL",
}) {
  if (!visible || !Array.isArray(stars) || stars.length === 0) {
    return null;
  }

  const filteredStars =
    activeTypeFilter === "ALL"
      ? stars
      : stars.filter((star) => star.type === activeTypeFilter);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
      aria-label="Detected celestial object reticles"
    >
      {filteredStars.map((star, index) => {
        const isSelected =
          selectedStar &&
          (selectedStar.id === star.id ||
            (selectedStar.x === star.x && selectedStar.y === star.y));

        const diameter = Math.max(14, Math.min(36, (Number(star.size) || 4) * 2.8));
        const isDeepSky = star.type === "Deep-Sky Candidate";
        const isLuminous = star.type === "Luminous Star";

        const ringColor = isSelected
          ? "border-[#f5d38c] bg-[#e9b15d]/25 shadow-[0_0_16px_rgba(233,177,93,0.85)]"
          : isDeepSky
            ? "border-cyan-300/80 bg-cyan-400/10 hover:border-cyan-200"
            : isLuminous
              ? "border-[#e9b15d]/85 bg-[#e9b15d]/10 hover:border-[#ffe2a8]"
              : "border-slate-200/55 bg-white/5 hover:border-[#e9b15d]";

        return (
          <button
            key={star.id || `${star.x}-${star.y}-${index}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectStar?.(isSelected ? null : star);
            }}
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${diameter}px`,
              height: `${diameter}px`,
            }}
            title={`${star.type} (${star.x.toFixed(1)}%, ${star.y.toFixed(1)}%) · Flux ${(star.brightness * 100).toFixed(0)}%`}
            className={`pointer-events-auto group absolute -translate-x-1/2 -translate-y-1/2 rounded-full border transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e9b15d] ${ringColor} ${
              isSelected ? "scale-125 z-30" : "hover:scale-110"
            }`}
          >
            {/* Center crosshair dot */}
            <span
              className={`block h-1 w-1 mx-auto rounded-full ${
                isDeepSky ? "bg-cyan-300" : "bg-[#f5d38c]"
              }`}
            />

            {/* Floating coordinate readout when selected or hovered */}
            <span
              className={`pointer-events-none absolute left-1/2 bottom-full mb-1.5 -translate-x-1/2 whitespace-nowrap rounded border border-[#e9b15d]/40 bg-[#080e19]/95 px-2 py-0.5 font-mono text-[10px] tabular-nums text-[#f2e9db] transition-opacity duration-150 ${
                isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
            >
              {star.type} · ({star.x.toFixed(1)}%, {star.y.toFixed(1)}%)
            </span>
          </button>
        );
      })}
    </div>
  );
}

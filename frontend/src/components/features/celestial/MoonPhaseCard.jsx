
import { useMemo, useState, useId } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MoonStar,
  Sparkles,
  Sun,
  Telescope,
} from "lucide-react";

const SYNODIC_MONTH = 29.530588853;
const DAY_MS = 24 * 60 * 60 * 1000;
const REFERENCE_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);

const PHASES = [
  {
    name: "New Moon",
    subtitle: "A quiet beginning",
    description:
      "The Moon is near the Sun in the sky, so its illuminated face is turned mostly away from Earth. This is a useful time to seek out faint objects under dark skies.",
    icon: "new",
  },
  {
    name: "Waxing Crescent",
    subtitle: "The first light returns",
    description:
      "A slim crescent appears after sunset. Look low toward the western horizon shortly after sunset, with an unobstructed view and a clear sky.",
    icon: "waxing-crescent",
  },
  {
    name: "First Quarter",
    subtitle: "Half-lit, full of detail",
    description:
      "The Moon appears half illuminated. Shadows along the boundary between lunar day and night can make craters and mountains especially striking through a telescope.",
    icon: "first-quarter",
  },
  {
    name: "Waxing Gibbous",
    subtitle: "The light gathers",
    description:
      "More than half of the lunar face is illuminated as the Moon approaches full. Bright lunar features become easy to observe, although the sky is less dark.",
    icon: "waxing-gibbous",
  },
  {
    name: "Full Moon",
    subtitle: "The lunar lantern",
    description:
      "The near side of the Moon appears fully illuminated. It is beautiful to observe with the naked eye, while high magnification can make surface details look flatter because shadows are short.",
    icon: "full",
  },
  {
    name: "Waning Gibbous",
    subtitle: "Light begins to recede",
    description:
      "The illuminated portion starts decreasing after full Moon. The Moon often rises later in the evening, making the timing of an observing session important.",
    icon: "waning-gibbous",
  },
  {
    name: "Last Quarter",
    subtitle: "A half-lit farewell",
    description:
      "The Moon appears half illuminated again, now on the opposite side. Its later-night and morning visibility can suit observers who prefer a different schedule.",
    icon: "last-quarter",
  },
  {
    name: "Waning Crescent",
    subtitle: "The last silver arc",
    description:
      "A slender crescent remains before the next new Moon. It is generally seen before sunrise, depending on the date and your location.",
    icon: "waning-crescent",
  },
];

function normalizeDate(value) {
  const source =
    value instanceof Date && !Number.isNaN(value.getTime())
      ? value
      : new Date();

  return new Date(
    source.getFullYear(),
    source.getMonth(),
    source.getDate(),
    12,
    0,
    0,
    0
  );
}

function formatInputDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatFullDate(date) {
  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatShortDate(date) {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function calculateMoon(date) {
  const daysSinceReference =
    (date.getTime() - REFERENCE_NEW_MOON) / DAY_MS;

  const fraction =
    ((daysSinceReference % SYNODIC_MONTH) + SYNODIC_MONTH) %
    SYNODIC_MONTH /
    SYNODIC_MONTH;

  const illumination =
    ((1 - Math.cos(2 * Math.PI * fraction)) / 2) * 100;

  const ageDays = fraction * SYNODIC_MONTH;
  const phaseIndex = Math.round(fraction * 8) % 8;
  const phase = PHASES[phaseIndex];

  const nextPhaseDate = (targetFraction) => {
    let cycleDistance =
      ((targetFraction - fraction) % 1 + 1) % 1;

    // If the selected date is already very close to this phase,
    // calculate the next occurrence rather than returning today.
    if (cycleDistance < 0.015) {
      cycleDistance += 1;
    }

    const daysAway = cycleDistance * SYNODIC_MONTH;
    const estimatedDate = new Date(
      date.getTime() + daysAway * DAY_MS
    );

    return {
      estimatedDate,
      daysAway: Math.ceil(daysAway),
    };
  };

  const nextFullMoon = nextPhaseDate(0.5);
  const nextNewMoon = nextPhaseDate(0);

  return {
    fraction,
    illumination,
    ageDays,
    phase,
    waxing: fraction < 0.5,
    nextFullMoon,
    nextNewMoon,
  };
}

function getMoonPath(fraction) {
  const waxing = fraction < 0.5;
  const cosine = Math.cos(2 * Math.PI * fraction);
  const rx = Math.max(0.001, Math.abs(cosine) * 40);

  // The inner arc changes direction as the lunar terminator moves
  // across the disc.
  const sweep = waxing
    ? cosine >= 0
      ? 0
      : 1
    : cosine >= 0
      ? 1
      : 0;

  const outerSweep = waxing ? 1 : 0;

  return [
    "M 50 10",
    `A 40 40 0 0 ${outerSweep} 50 90`,
    `A ${rx.toFixed(3)} 40 0 0 ${sweep} 50 10`,
    "Z",
  ].join(" ");
}

function MoonIllustration({ fraction }) {
  const generatedId = useId().replace(/:/g, "");
  const clipId = `moon-lit-${generatedId}`;
  const glowId = `moon-glow-${generatedId}`;
  const gradientId = `moon-surface-${generatedId}`;
  const moonPath = getMoonPath(fraction);

  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label="Illustration of the current lunar phase"
      className="relative z-10 h-full w-full overflow-visible"
    >
      <defs>
        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#D8B86E" stopOpacity="0.22" />
          <stop offset="65%" stopColor="#D8B86E" stopOpacity="0.07" />
          <stop offset="100%" stopColor="#D8B86E" stopOpacity="0" />
        </radialGradient>

        <linearGradient
          id={gradientId}
          x1="0%"
          y1="10%"
          x2="100%"
          y2="90%"
        >
          <stop offset="0%" stopColor="#FFF3D5" />
          <stop offset="55%" stopColor="#E8D2A0" />
          <stop offset="100%" stopColor="#B99B62" />
        </linearGradient>

        <clipPath id={clipId}>
          <path d={moonPath} />
        </clipPath>

        <filter id={`soft-shadow-${generatedId}`}>
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
      </defs>

      <circle cx="50" cy="50" r="49" fill={`url(#${glowId})`} />

      <circle
        cx="50"
        cy="50"
        r="40"
        fill="#202837"
        stroke="#A6A8A7"
        strokeOpacity="0.13"
        strokeWidth="0.7"
      />

      <circle
        cx="50"
        cy="50"
        r="40"
        fill="#080D17"
        opacity="0.35"
      />

      <path
        d={moonPath}
        fill="#E8D2A0"
        opacity="0.18"
        transform="translate(0 1.5)"
        filter={`url(#soft-shadow-${generatedId})`}
      />

      <path d={moonPath} fill={`url(#${gradientId})`} />

      <g clipPath={`url(#${clipId})`}>
        <circle
          cx="34"
          cy="34"
          r="5.4"
          fill="#A98B56"
          opacity="0.24"
        />
        <circle
          cx="34"
          cy="34"
          r="3.6"
          fill="#FBF0D6"
          opacity="0.19"
        />

        <circle
          cx="63"
          cy="38"
          r="7"
          fill="#A98B56"
          opacity="0.20"
        />
        <circle
          cx="63"
          cy="38"
          r="5.3"
          fill="#EDE0C0"
          opacity="0.26"
        />

        <circle
          cx="49"
          cy="61"
          r="4.3"
          fill="#9B7E4E"
          opacity="0.24"
        />
        <circle
          cx="49"
          cy="61"
          r="2.5"
          fill="#F8E9C6"
          opacity="0.19"
        />

        <circle
          cx="69"
          cy="65"
          r="3.1"
          fill="#9B7E4E"
          opacity="0.20"
        />

        <path
          d="M25 49 Q35 42 41 51 T59 53"
          stroke="#B39762"
          strokeOpacity="0.20"
          strokeWidth="1"
          fill="none"
        />

        <path
          d="M35 24 Q43 20 51 25"
          stroke="#FFFFFF"
          strokeOpacity="0.20"
          strokeWidth="0.8"
          fill="none"
        />
      </g>

      <circle
        cx="50"
        cy="50"
        r="40"
        fill="none"
        stroke="#F5E7C6"
        strokeOpacity="0.23"
        strokeWidth="0.65"
      />
    </svg>
  );
}

function Milestone({ label, date, days, icon }) {
  const Icon = icon;

  return (
    <div className="moon-milestone flex min-w-0 flex-1 items-start gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#C8A76A]/20 bg-[#C8A76A]/[0.06] text-[#D6B774]">
        <Icon size={18} strokeWidth={1.6} />
      </div>

      <div className="min-w-0">
        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#969BA5]">
          {label}
        </p>
        <p className="mt-1.5 truncate font-serif text-base text-[#EDE0C9]">
          {formatShortDate(date)}
        </p>
        <p className="mt-1 text-[10px] text-[#858B96]">
          In approximately {days} {days === 1 ? "day" : "days"}
        </p>
      </div>
    </div>
  );
}

export default function MoonPhaseCard({
  initialDate,
  onExplore,
  className = "",
}) {
  const moonId = useId();

  const [selectedDate, setSelectedDate] = useState(() =>
    normalizeDate(initialDate)
  );

  const moon = useMemo(
    () => calculateMoon(selectedDate),
    [selectedDate]
  );

  const changeDate = (amount) => {
    setSelectedDate((current) => {
      const next = new Date(current);
      next.setDate(next.getDate() + amount);
      return normalizeDate(next);
    });
  };

  const selectDate = (value) => {
    if (!value) return;

    const [year, month, day] = value.split("-").map(Number);
    setSelectedDate(new Date(year, month - 1, day, 12, 0, 0));
  };

  const selectToday = () => {
    setSelectedDate(normalizeDate(new Date()));
  };

  const handleExplore = () => {
    if (typeof onExplore === "function") {
      onExplore({
        date: new Date(selectedDate),
        phase: moon.phase.name,
        illumination: Math.round(moon.illumination),
        lunarAge: Number(moon.ageDays.toFixed(1)),
      });
      return;
    }

    const eventSection = document.getElementById("celestial-events");

    if (eventSection) {
      eventSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <section
      className={`moon-phase-card relative isolate w-full overflow-hidden rounded-[28px] border border-[#C8A76A]/25 bg-[#090E17] p-5 text-[#F4E9D5] shadow-[0_24px_75px_rgba(0,0,0,0.24)] sm:rounded-[30px] sm:p-7 ${className}`}
    >
      <style>{`
        @keyframes moon-rise {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes moon-orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes moon-breathe {
          0%, 100% { opacity: .42; transform: scale(.96); }
          50% { opacity: .8; transform: scale(1.04); }
        }

        @keyframes moon-star-twinkle {
          0%, 100% { opacity: .25; }
          50% { opacity: .9; }
        }

        .moon-phase-card .moon-reveal {
          animation: moon-rise .65s cubic-bezier(.2,.7,.2,1) both;
        }

        .moon-phase-card .moon-art {
          animation: moon-rise .8s cubic-bezier(.2,.7,.2,1) both;
          animation-delay: .12s;
        }

        .moon-phase-card .moon-aura {
          animation: moon-breathe 6s ease-in-out infinite;
        }

        .moon-phase-card .moon-orbit {
          animation: moon-orbit 65s linear infinite;
        }

        .moon-phase-card .moon-star {
          animation: moon-star-twinkle 3s ease-in-out infinite;
          animation-delay: var(--twinkle-delay, 0s);
        }

        .moon-phase-card .moon-milestone {
          transition: transform .3s ease, border-color .3s ease, background .3s ease;
        }

        .moon-phase-card .moon-milestone:hover {
          transform: translateY(-3px);
          border-color: rgba(200,167,106,.27);
          background: rgba(200,167,106,.045);
        }

        .moon-phase-card .moon-date-button {
          display: inline-flex;
          height: 34px;
          width: 34px;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 11px;
          color: #D5BD8A;
          transition: border-color .2s ease, background .2s ease, transform .2s ease;
        }

        .moon-phase-card .moon-date-button:hover {
          transform: translateY(-1px);
          border-color: rgba(200,167,106,.38);
          background: rgba(200,167,106,.08);
        }

        .moon-phase-card .moon-date-button:focus-visible,
        .moon-phase-card .moon-action:focus-visible,
        .moon-phase-card input:focus-visible {
          outline: 2px solid #E4C47F;
          outline-offset: 3px;
        }

        .moon-phase-card .moon-action {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          border: 1px solid rgba(245,213,148,.28);
          border-radius: 12px;
          background: linear-gradient(110deg, #E0C17D, #B98B43, #E0C17D);
          background-size: 200% 100%;
          padding: 12px 16px;
          color: #17130C;
          font-size: 12px;
          font-weight: 700;
          transition: transform .25s ease, box-shadow .25s ease, background-position .45s ease;
        }

        .moon-phase-card .moon-action:hover {
          transform: translateY(-2px);
          background-position: 100% 0;
          box-shadow: 0 8px 24px rgba(190,147,67,.18);
        }

        .moon-phase-card .moon-date-input {
          width: 100%;
          min-width: 0;
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 11px;
          background: rgba(255,255,255,.025);
          padding: 9px 10px;
          color: #E8DCC5;
          color-scheme: dark;
          font-size: 11px;
        }

        @media (prefers-reduced-motion: reduce) {
          .moon-phase-card *,
          .moon-phase-card *::before,
          .moon-phase-card *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_35%,rgba(170,128,57,0.12),transparent_40%),radial-gradient(ellipse_at_0%_100%,rgba(39,59,87,0.15),transparent_40%)]" />

        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full border border-[#C8A76A]/[0.09]" />

        <div className="absolute -right-7 top-20 h-52 w-52 rounded-full border border-dashed border-[#C8A76A]/[0.10]" />

        <div className="absolute right-8 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-[#BE9959]/[0.07] blur-[80px] moon-aura" />

        {[
          ["12%", "18%", "0s"],
          ["30%", "8%", "1.1s"],
          ["47%", "25%", "2.2s"],
          ["78%", "15%", "0.5s"],
          ["92%", "32%", "1.7s"],
          ["68%", "77%", "0.8s"],
          ["16%", "84%", "2.6s"],
        ].map(([left, top, delay]) => (
          <span
            key={`${left}-${top}`}
            className="moon-star absolute h-1 w-1 rounded-full bg-[#E7CC91]"
            style={{
              left,
              top,
              "--twinkle-delay": delay,
              boxShadow: "0 0 8px rgba(231,204,145,.55)",
            }}
          />
        ))}
      </div>

      <header className="moon-reveal flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#C8A76A]/25 bg-[#C8A76A]/[0.06] text-[#E4C781]">
            <MoonStar size={21} strokeWidth={1.5} />
          </div>

          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#D2B475]">
              Lunar observatory
            </p>
            <p className="mt-1 text-xs text-[#9297A0]">
              A closer look at the Moon
            </p>
          </div>
        </div>

        <span className="hidden items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-[9px] uppercase tracking-[0.13em] text-[#A5A8AE] sm:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-[#D7B671]" />
          Lunar phase estimate
        </span>
      </header>

      <div className="mt-7 grid gap-7 sm:mt-9 lg:grid-cols-[minmax(0,1fr)_250px] lg:items-center">
        <div className="moon-reveal min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#9399A4]">
            Phase for the selected date
          </p>

          <h2 className="mt-3 font-serif text-3xl leading-tight tracking-[-0.035em] text-[#F0E4CE] sm:text-4xl">
            {moon.phase.name}
          </h2>

          <p className="mt-2 text-sm text-[#D4B779]">
            {moon.phase.subtitle}
          </p>

          <p className="mt-4 max-w-xl text-[13px] leading-6 text-[#A9AEB8]">
            {moon.phase.description}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => changeDate(-1)}
              aria-label="Previous date"
              title="Previous day"
              className="moon-date-button"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="inline-flex min-w-0 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 py-2.5">
              <CalendarDays
                size={14}
                className="shrink-0 text-[#D0AE68]"
              />
              <span className="truncate text-xs text-[#E8DCC5]">
                {formatFullDate(selectedDate)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => changeDate(1)}
              aria-label="Next date"
              title="Next day"
              className="moon-date-button"
            >
              <ChevronRight size={16} />
            </button>

            <button
              type="button"
              onClick={selectToday}
              className="rounded-xl border border-white/[0.08] px-3 py-2.5 text-[10px] font-medium text-[#B9B3A7] transition hover:border-[#C8A76A]/30 hover:text-[#E7D3AB]"
            >
              Today
            </button>
          </div>

          <div className="mt-3 max-w-[255px]">
            <label
              htmlFor={`moon-date-${moonId.replace(/:/g, "")}`}
              className="mb-2 block text-[9px] uppercase tracking-[0.15em] text-[#828A96]"
            >
              Or choose a date
            </label>

            <input
              id={`moon-date-${String(useId).length}`}
              type="date"
              value={formatInputDate(selectedDate)}
              onChange={(event) => selectDate(event.target.value)}
              className="moon-date-input"
            />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
              <div className="flex items-center gap-2 text-[#CBAE70]">
                <Sun size={14} />
                <span className="text-[9px] uppercase tracking-[0.14em]">
                  Illumination
                </span>
              </div>

              <p className="mt-2 font-serif text-2xl text-[#F0E4CE]">
                {Math.round(moon.illumination)}%
              </p>

              <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.08]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#98753E] via-[#DCC17E] to-[#F2E6BF] transition-[width] duration-500"
                  style={{ width: `${moon.illumination}%` }}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
              <div className="flex items-center gap-2 text-[#CBAE70]">
                <Clock3 size={14} />
                <span className="text-[9px] uppercase tracking-[0.14em]">
                  Lunar age
                </span>
              </div>

              <p className="mt-2 font-serif text-2xl text-[#F0E4CE]">
                {moon.ageDays.toFixed(1)}
                <span className="ml-1 font-sans text-xs text-[#969BA5]">
                  days
                </span>
              </p>

              <p className="mt-2 text-[10px] text-[#858B96]">
                Of a ~29.5-day cycle
              </p>
            </div>
          </div>
        </div>

        <div className="moon-art relative mx-auto w-full max-w-[275px] lg:max-w-none">
          <div className="relative aspect-square">
            <div
              className="moon-orbit absolute inset-[3%] rounded-full border border-[#C8A76A]/[0.12]"
            >
              <span className="absolute left-[12%] top-[15%] h-1.5 w-1.5 rounded-full bg-[#DCC17E] shadow-[0_0_12px_rgba(220,193,126,.7)]" />
            </div>

            <div className="absolute inset-[12%] rounded-full border border-dashed border-[#C8A76A]/[0.11]" />

            <div className="absolute inset-[18%] rounded-full bg-[#C8A76A]/[0.06] blur-2xl" />

            <div className="absolute inset-[18%] flex items-center justify-center">
              <MoonIllustration fraction={moon.fraction} />
            </div>

            <div className="absolute left-[4%] top-[28%] rounded-lg border border-white/[0.07] bg-[#111822]/90 px-2.5 py-2 backdrop-blur-md">
              <p className="text-[8px] uppercase tracking-[0.12em] text-[#858B96]">
                Cycle
              </p>
              <p className="mt-1 text-xs font-medium text-[#E7D4A7]">
                {Math.round(moon.fraction * 100)}%
              </p>
            </div>

            <div className="absolute bottom-[14%] right-[1%] rounded-lg border border-[#C8A76A]/20 bg-[#111822]/95 px-3 py-2.5 backdrop-blur-md">
              <div className="flex items-center gap-1.5">
                <Sparkles size={11} className="text-[#D6B774]" />
                <p className="text-[8px] uppercase tracking-[0.12em] text-[#BEB3A0]">
                  Lunar phase
                </p>
              </div>
              <p className="mt-1 text-xs font-medium text-[#F0E3CB]">
                {moon.phase.name}
              </p>
            </div>
          </div>

          <p className="mt-1 text-center text-[9px] leading-5 text-[#777F8B]">
            Simplified phase illustration · not to scale
          </p>
        </div>
      </div>

      <div className="moon-reveal mt-7 border-t border-white/[0.08] pt-6 sm:mt-8 sm:pt-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[#D6B774]">
              <span className="h-px w-5 bg-[#C8A76A]/70" />
              <span className="text-[9px] font-semibold uppercase tracking-[0.2em]">
                Next lunar milestones
              </span>
            </div>

            <h3 className="font-serif text-xl text-[#EDE0C9]">
              Follow the cycle
            </h3>
          </div>

          <p className="text-[9px] text-[#858B96]">
            Approximate dates
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Milestone
            label="Next full Moon"
            date={moon.nextFullMoon.estimatedDate}
            days={moon.nextFullMoon.daysAway}
            icon={Sun}
          />

          <Milestone
            label="Next new Moon"
            date={moon.nextNewMoon.estimatedDate}
            days={moon.nextNewMoon.daysAway}
            icon={MoonStar}
          />
        </div>
      </div>

      <footer className="moon-reveal mt-6 flex flex-col gap-4 border-t border-white/[0.07] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#C8A76A]/20 bg-[#C8A76A]/[0.05] text-[#D6B774]">
            <Telescope size={15} />
          </div>

          <div>
            <p className="text-xs font-medium text-[#DED3C1]">
              Choose your observing night
            </p>
            <p className="mt-1 max-w-md text-[10px] leading-5 text-[#858B96]">
              Moonlight can affect the visibility of faint stars and meteors.
              Check local conditions before planning a session.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleExplore}
          className="moon-action shrink-0"
        >
          Explore the sky
          <ArrowUpRight size={15} />
        </button>
      </footer>

      <p className="mt-4 text-[9px] leading-5 text-[#737B87]">
        Phase and illumination are calculated from a simplified lunar-cycle
        model. The milestone dates are estimates, not an authoritative
        astronomical ephemeris. Local visibility and rise/set times are not
        calculated by this card.
      </p>
    </section>
  );
}

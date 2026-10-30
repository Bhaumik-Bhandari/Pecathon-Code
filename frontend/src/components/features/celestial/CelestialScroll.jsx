import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  BellPlus,
  BellRing,
  Bookmark,
  BookmarkCheck,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Compass,
  ExternalLink,
  Flame,
  MoonStar,
  Orbit,
  Rocket,
  Satellite,
  Search,
  Sparkles,
  Sun,
  Telescope,
  X,
} from "lucide-react";
import MoonPhaseCard from "./MoonPhaseCard.jsx";
import { useNotifications } from "../../../context/NotificationContext";
import {
  CURATED_CELESTIAL_EVENTS,
  EVENT_CATEGORIES,
  TRADITIONAL_LUNAR_MONTHS,
  buildLunarCalendarGrid,
  fetchCelestialScrollData,
  getTonightSkyAlert,
} from "../../../services/celestialApi";

const WATCHLIST_KEY = "pecathon-celestial-watchlist";
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function readWatchlist() {
  try {
    const value = JSON.parse(localStorage.getItem(WATCHLIST_KEY) || "[]");
    return Array.isArray(value)
      ? value.filter((item) => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function parseLocalDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

function formatDateRange(start, end) {
  if (!start) return "Upcoming";
  if (!end || start === end) {
    return parseLocalDate(start).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  const first = parseLocalDate(start);
  const last = parseLocalDate(end);
  if (
    first.getMonth() === last.getMonth() &&
    first.getFullYear() === last.getFullYear()
  ) {
    return `${first.toLocaleDateString("en-US", {
      month: "short",
    })} ${first.getDate()}–${last.getDate()}, ${last.getFullYear()}`;
  }
  return `${first.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} – ${last.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

function getCategoryIcon(category) {
  switch (category) {
    case "Meteor Shower":
      return Flame;
    case "Eclipse":
      return Sun;
    case "Moon Phase":
      return MoonStar;
    case "ISS Pass":
      return Satellite;
    case "Rocket Launch":
      return Rocket;
    default:
      return Orbit;
  }
}

function LunarPhaseMiniGlyph({ glyph, illumination }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0"
      aria-label={`${glyph} (${illumination}% lit)`}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="#141c2b"
        stroke="#c8a76a"
        strokeOpacity="0.45"
        strokeWidth="1.2"
      />
      {glyph === "full" && <circle cx="12" cy="12" r="8" fill="#f0d99d" />}
      {glyph === "new" && (
        <circle
          cx="12"
          cy="12"
          r="7.5"
          fill="#0b101b"
          stroke="#e9b15d"
          strokeDasharray="2 2"
          strokeWidth="0.9"
        />
      )}
      {glyph === "first-quarter" && (
        <path d="M12 4 A8 8 0 0 1 12 20 Z" fill="#e9c87b" />
      )}
      {glyph === "last-quarter" && (
        <path d="M12 4 A8 8 0 0 0 12 20 Z" fill="#e9c87b" />
      )}
      {glyph === "waxing-crescent" && (
        <path
          d="M12 4 A8 8 0 0 1 12 20 A5 8 0 0 0 12 4 Z"
          fill="#e9c87b"
        />
      )}
      {glyph === "waning-crescent" && (
        <path
          d="M12 4 A8 8 0 0 0 12 20 A5 8 0 0 1 12 4 Z"
          fill="#e9c87b"
        />
      )}
      {glyph === "waxing-gibbous" && (
        <path
          d="M12 4 A8 8 0 0 1 12 20 A4 8 0 0 1 12 4 Z"
          fill="#ecd18e"
        />
      )}
      {glyph === "waning-gibbous" && (
        <path
          d="M12 4 A8 8 0 0 0 12 20 A4 8 0 0 0 12 4 Z"
          fill="#ecd18e"
        />
      )}
    </svg>
  );
}

function EventCard({
  event,
  saved,
  expanded,
  onToggleSave,
  onToggleDetails,
  onDispatchAlert,
}) {
  const CategoryIcon = getCategoryIcon(event.category);

  return (
    <article className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#0e1522]/95 p-5 transition duration-200 hover:border-[#d4ae6a]/45 hover:bg-[#121b2c]">
      <div>
        {/* Top Metadata Line (Zero-pill unboxed metadata + interactive actions) */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-[#c8a76a]">
            <CategoryIcon size={14} className="shrink-0 text-[#e9b15d]" />
            <span className="font-semibold text-[#e9b15d]">
              {event.category}
            </span>
            <span aria-hidden="true">·</span>
            <span className="truncate text-[#95a0b2]">{event.intensity}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onDispatchAlert(event)}
              title="Send alert to Topbar Notification Bell"
              aria-label={`Send alert for ${event.name}`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-[#c8a76a] transition hover:border-[#e9b15d]/50 hover:bg-[#e9b15d]/15 hover:text-[#ffe4ad]"
            >
              <BellPlus size={15} />
            </button>

            <button
              type="button"
              onClick={() => onToggleSave(event.id)}
              aria-label={
                saved
                  ? `Remove ${event.name} from watchlist`
                  : `Save ${event.name}`
              }
              title={saved ? "Remove from watchlist" : "Save to watchlist"}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                saved
                  ? "border-[#e9b15d]/50 bg-[#e9b15d]/15 text-[#f2d28b]"
                  : "border-white/10 bg-white/[0.03] text-[#95a0b2] hover:border-[#e9b15d]/35 hover:text-[#f2e9db]"
              }`}
            >
              {saved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="mt-3.5 text-lg font-semibold tracking-tight text-[#f5ecd9]">
          {event.name}
        </h3>

        {/* Description */}
        <p className="mt-2 text-xs leading-6 text-[#adb5c2]">
          {event.description}
        </p>
      </div>

      <div className="mt-5">
        {/* Telemetry Details */}
        <div className="space-y-2 border-t border-white/10 pt-3.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[#8e99ab]">Date / Window</span>
            <span className="font-mono tabular-nums text-[#f2e9db]">
              {formatDateRange(event.peakStart, event.peakEnd)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-[#8e99ab]">Local Time</span>
            <span className="font-mono tabular-nums text-[#e9b15d]">
              {event.timeWindow}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-[#8e99ab]">Sky Vector</span>
            <span className="truncate text-right text-[#cbd5e1]">
              {event.direction}
            </span>
          </div>
        </div>

        {/* Action Row */}
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
          <button
            type="button"
            onClick={() => onDispatchAlert(event)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#e9b15d] transition hover:text-[#ffe2a8]"
          >
            <BellRing size={13} />
            <span>Push Sky Alert</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleDetails(event.id)}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#b8c1d0] transition hover:text-white"
          >
            <span>{expanded ? "Hide Notes" : "Field Notes"}</span>
            {expanded ? (
              <ChevronDown size={14} className="rotate-180" />
            ) : (
              <ArrowUpRight size={14} />
            )}
          </button>
        </div>

        {expanded && (
          <div className="mt-3.5 rounded-xl border border-[#c8a76a]/25 bg-[#080d16] p-3.5 text-xs">
            <p className="font-semibold text-[#e9b15d]">Observer's Protocol</p>
            <p className="mt-1 leading-5 text-[#cbd5e1]">{event.viewingTip}</p>

            <div className="mt-2.5 flex items-center justify-between border-t border-white/10 pt-2.5 text-[11px] text-[#8e99ab]">
              <span>{event.provider}</span>
              <a
                href={event.source}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[#e9b15d] hover:underline"
              >
                <span>Ephemeris</span>
                <ExternalLink size={11} />
              </a>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

export default function CelestialScroll() {
  const { addNotification, settings } = useNotifications();
  const autoAlertDispatchedRef = useRef(false);

  const [events, setEvents] = useState(CURATED_CELESTIAL_EVENTS);
  const [skyConditions, setSkyConditions] = useState({
    source: "Open-Meteo & NASA Ephemeris",
    cloudCover: 11,
    humidity: 26,
    visibilityKm: 24.0,
    nightHonorScore: 92,
    moonriseTime: "8:14 PM",
    bestWindow: "10:30 PM – 03:30 AM",
  });
  const [tonightAlert, setTonightAlert] = useState(getTonightSkyAlert);

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedDateFilter, setSelectedDateFilter] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() => {
    // Default to November 2026 where majority of late-autumn events cluster, or current month
    return { year: 2026, monthIndex: 10 }; // 10 = November (0-indexed)
  });

  const [savedIds, setSavedIds] = useState(readWatchlist);
  const [expandedId, setExpandedId] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  function showToast(msg) {
    setToastMessage(msg);
    window.clearTimeout(showToast._timer);
    showToast._timer = window.setTimeout(() => setToastMessage(""), 2800);
  }

  // Load Open-Meteo & NASA Celestial Data
  useEffect(() => {
    let mounted = true;
    fetchCelestialScrollData(
      settings.defaultLatitude,
      settings.defaultLongitude
    ).then((data) => {
      if (!mounted) return;
      if (Array.isArray(data.events) && data.events.length > 0) {
        setEvents(data.events);
      }
      if (data.skyConditions) {
        setSkyConditions(data.skyConditions);
      }
      if (data.tonightAlert) {
        setTonightAlert(data.tonightAlert);
      }
    });

    return () => {
      mounted = false;
    };
  }, [settings.defaultLatitude, settings.defaultLongitude]);

  // Auto-dispatch "The Moon Rises Tonight at 8:14 PM" to Topbar NotificationContext on mount
  useEffect(() => {
    if (autoAlertDispatchedRef.current) return;
    if (settings.autoLunarAlerts === false) return;

    autoAlertDispatchedRef.current = true;
    const alertPayload = getTonightSkyAlert();
    addNotification(alertPayload);
  }, [addNotification, settings.autoLunarAlerts]);

  useEffect(() => {
    try {
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(savedIds));
    } catch {
      // Ignore storage error
    }
  }, [savedIds]);

  const calendarCells = useMemo(
    () =>
      buildLunarCalendarGrid(
        calendarMonth.year,
        calendarMonth.monthIndex,
        events
      ),
    [calendarMonth.year, calendarMonth.monthIndex, events]
  );

  const traditionalMonthMeta =
    TRADITIONAL_LUNAR_MONTHS[calendarMonth.monthIndex] ||
    TRADITIONAL_LUNAR_MONTHS[10];

  const filteredEvents = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return events.filter((event) => {
      const matchesQuery =
        !needle ||
        `${event.name} ${event.category} ${event.description} ${event.intensity} ${event.direction}`
          .toLowerCase()
          .includes(needle);

      const matchesCategory =
        activeCategory === "all" ||
        (activeCategory === "saved" && savedIds.includes(event.id)) ||
        event.category === activeCategory;

      const matchesDate =
        !selectedDateFilter ||
        event.peakStart === selectedDateFilter ||
        event.peakEnd === selectedDateFilter ||
        (event.activeStart <= selectedDateFilter &&
          event.activeEnd >= selectedDateFilter);

      return matchesQuery && matchesCategory && matchesDate;
    });
  }, [events, query, activeCategory, savedIds, selectedDateFilter]);

  function handleDispatchEventAlert(event) {
    const title =
      event.alertText || `${event.name} · ${event.timeWindow}`;
    addNotification({
      id: `event-alert-${event.id}`,
      title,
      message: `${event.category} (${event.intensity}) · ${event.direction}. ${event.moonlight}.`,
      category: event.category,
      eventDate: event.peakStart,
      route: "/celestial-scroll",
      forceUnread: true,
    });
    showToast(`Alert sent to Topbar Bell: "${title}"`);
  }

  function toggleSave(id) {
    const isSaved = savedIds.includes(id);
    setSavedIds((current) =>
      isSaved ? current.filter((item) => item !== id) : [...current, id]
    );
    showToast(isSaved ? "Removed from Watchlist" : "Saved to Celestial Watchlist");
  }

  function changeCalendarMonth(delta) {
    setCalendarMonth((prev) => {
      const d = new Date(prev.year, prev.monthIndex + delta, 1);
      return { year: d.getFullYear(), monthIndex: d.getMonth() };
    });
  }

  function handleDateInputSelect(value) {
    setSelectedDateFilter(value);
    if (value) {
      const [y, m] = value.split("-").map(Number);
      if (y && m) {
        setCalendarMonth({ year: y, monthIndex: m - 1 });
      }
    }
  }

  return (
    <div className="space-y-7 pb-12">
      {/* Main Celestial Scroll Container */}
      <section className="relative isolate overflow-hidden rounded-[26px] border border-[#c8a76a]/20 bg-[#080c14] p-5 text-[#f5ecd9] shadow-[0_24px_80px_rgba(0,0,0,0.4)] sm:p-8">
        {/* Header & Open-Meteo / NASA Telemetry Bar */}
        <header className="flex flex-col justify-between gap-6 border-b border-white/10 pb-7 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#e9b15d]">
              <Sparkles size={14} />
              <span>Tsukuyomi Watch · Celestial Scroll</span>
            </div>

            <h1 className="mt-2 font-serif text-3xl tracking-tight text-[#f4ebdd] sm:text-4xl">
              Astronomical Events & Lunar Ephemeris
            </h1>

            <p className="mt-2 text-sm leading-6 text-[#9ca6b8]">
              Track meteor showers, solar and lunar eclipses, moon phases, ISS
              orbital transits, and rocket launches calibrated with Open-Meteo
              and NASA space telemetry.
            </p>
          </div>

          {/* Live Telemetry Readout */}
          <div className="grid grid-cols-3 gap-3 rounded-2xl border border-white/10 bg-[#0e1522] p-3.5 sm:min-w-[360px]">
            <div>
              <p className="text-[11px] text-[#8e99ab]">Cloud Cover</p>
              <p className="mt-0.5 font-mono text-base font-bold tabular-nums text-[#f2e9db]">
                {skyConditions.cloudCover}%
              </p>
            </div>
            <div className="border-l border-white/10 pl-3">
              <p className="text-[11px] text-[#8e99ab]">Visibility</p>
              <p className="mt-0.5 font-mono text-base font-bold tabular-nums text-[#f2e9db]">
                {skyConditions.visibilityKm} km
              </p>
            </div>
            <div className="border-l border-white/10 pl-3">
              <p className="text-[11px] text-[#8e99ab]">Moonrise</p>
              <p className="mt-0.5 font-mono text-base font-bold tabular-nums text-[#e9b15d]">
                {skyConditions.moonriseTime}
              </p>
            </div>
          </div>
        </header>

        {/* Interactive Lunar Observatory Card */}
        <div className="mt-7">
          <MoonPhaseCard
            onExplore={({ date }) => {
              if (date instanceof Date) {
                const iso = `${date.getFullYear()}-${String(
                  date.getMonth() + 1
                ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                handleDateInputSelect(iso);
              }
              document.getElementById("celestial-events-feed")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }}
          />
        </div>

        {/* Traditional Lunar Calendar Filter & Date Picker */}
        <section
          aria-label="Traditional Lunar Calendar Filter"
          className="mt-8 rounded-2xl border border-[#c8a76a]/25 bg-[#0c121e] p-5 sm:p-6"
        >
          <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-4 lg:flex-row lg:items-center">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#e9b15d]">
                <CalendarDays size={14} />
                <span>
                  Traditional Lunar Almanac · {traditionalMonthMeta.kanji} (
                  {traditionalMonthMeta.romaji})
                </span>
              </div>
              <h2 className="mt-1 text-lg font-semibold text-[#f5ecd9]">
                {new Date(
                  calendarMonth.year,
                  calendarMonth.monthIndex,
                  1
                ).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}{" "}
                <span className="text-xs font-normal text-[#8e99ab]">
                  · {traditionalMonthMeta.meaning}
                </span>
              </h2>
            </div>

            {/* Date Picker & Month Step Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#080c14] p-1">
                <button
                  type="button"
                  onClick={() => changeCalendarMonth(-1)}
                  aria-label="Previous lunar month"
                  className="rounded-lg p-1.5 text-[#cbd5e1] transition hover:bg-white/10 hover:text-white"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-2 font-mono text-xs font-semibold tabular-nums text-[#e9b15d]">
                  {calendarMonth.year}-
                  {String(calendarMonth.monthIndex + 1).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  onClick={() => changeCalendarMonth(1)}
                  aria-label="Next lunar month"
                  className="rounded-lg p-1.5 text-[#cbd5e1] transition hover:bg-white/10 hover:text-white"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#080c14] px-3 py-1.5">
                <label
                  htmlFor="lunar-filter-date-picker"
                  className="text-xs text-[#8e99ab] whitespace-nowrap"
                >
                  Filter Date:
                </label>
                <input
                  id="lunar-filter-date-picker"
                  type="date"
                  value={selectedDateFilter}
                  onChange={(e) => handleDateInputSelect(e.target.value)}
                  className="bg-transparent font-mono text-xs text-[#f2e9db] outline-none [color-scheme:dark]"
                />
                {selectedDateFilter && (
                  <button
                    type="button"
                    onClick={() => setSelectedDateFilter("")}
                    aria-label="Clear date filter"
                    className="rounded p-0.5 text-slate-400 hover:text-white"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="mt-4 grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[#8e99ab]">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Lunar Calendar Grid */}
          <div className="mt-1 grid grid-cols-7 gap-1.5">
            {calendarCells.map((cell, idx) => {
              if (!cell) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="min-h-[64px] rounded-xl border border-white/[0.03] bg-white/[0.01]"
                  />
                );
              }

              const isSelected = selectedDateFilter === cell.isoDate;
              const hasEvents = cell.events.length > 0;

              return (
                <button
                  key={cell.isoDate}
                  type="button"
                  onClick={() =>
                    setSelectedDateFilter((current) =>
                      current === cell.isoDate ? "" : cell.isoDate
                    )
                  }
                  className={`group flex min-h-[68px] flex-col justify-between rounded-xl border p-2 text-left transition ${
                    isSelected
                      ? "border-[#e9b15d] bg-[#e9b15d]/15 shadow-[0_0_15px_rgba(233,177,93,0.2)]"
                      : hasEvents
                        ? "border-[#c8a76a]/30 bg-[#121a2a] hover:border-[#e9b15d]/60"
                        : "border-white/[0.06] bg-[#080c14]/70 hover:border-white/20"
                  }`}
                >
                  <div className="flex w-full items-center justify-between gap-1">
                    <span
                      className={`font-mono text-xs font-semibold tabular-nums ${
                        isSelected
                          ? "text-[#e9b15d]"
                          : hasEvents
                            ? "text-[#f5ecd9]"
                            : "text-[#8e99ab]"
                      }`}
                    >
                      {String(cell.day).padStart(2, "0")}
                    </span>

                    <LunarPhaseMiniGlyph
                      glyph={cell.lunar.glyph}
                      illumination={cell.lunar.illumination}
                    />
                  </div>

                  <div className="mt-1.5 flex items-center justify-between gap-1">
                    <span className="hidden truncate text-[10px] text-[#95a0b2] sm:inline">
                      {cell.lunar.illumination}%
                    </span>

                    {hasEvents && (
                      <span className="ml-auto font-mono text-[10px] font-semibold text-[#e9b15d]">
                        {cell.events.length}{" "}
                        {cell.events.length === 1 ? "ev" : "evs"}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Events Hub Feed & Category Filter Controls */}
        <section id="celestial-events-feed" className="scroll-mt-24 pt-8">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#e9b15d]">
                02 · Multi-Category Sky Catalog
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-[#f5ecd9]">
                Upcoming Astronomical Sightings
              </h2>
            </div>

            {/* Search Input */}
            <div className="relative w-full lg:max-w-[300px]">
              <Search
                size={15}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8e99ab]"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter by event, constellation, or vehicle..."
                aria-label="Search celestial events"
                className="w-full rounded-xl border border-white/10 bg-[#0e1522] py-2.5 pl-10 pr-4 text-xs text-[#f2e9db] outline-none transition placeholder:text-[#778192] focus:border-[#e9b15d]/60"
              />
            </div>
          </div>

          {/* Interactive Event-Type Segmented Filter Bar */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {EVENT_CATEGORIES.map((cat) => {
              const active = activeCategory === cat.id;
              const count =
                cat.id === "all"
                  ? events.length
                  : cat.id === "saved"
                    ? savedIds.length
                    : events.filter((e) => e.category === cat.id).length;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-medium transition whitespace-nowrap ${
                    active
                      ? "border-[#e9b15d] bg-[#e9b15d] font-semibold text-[#111827]"
                      : "border-white/10 bg-[#0e1522] text-[#b0b9c6] hover:border-[#e9b15d]/40 hover:text-white"
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`font-mono text-[11px] tabular-nums ${
                      active ? "text-[#111827]/80" : "text-[#8e99ab]"
                    }`}
                  >
                    ({count})
                  </span>
                </button>
              );
            })}

            {selectedDateFilter && (
              <button
                type="button"
                onClick={() => setSelectedDateFilter("")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#e9b15d]/40 bg-[#e9b15d]/15 px-3 py-2 text-xs font-medium text-[#e9b15d] hover:bg-[#e9b15d]/25 whitespace-nowrap"
              >
                <span>Date: {selectedDateFilter}</span>
                <X size={13} />
              </button>
            )}
          </div>

          {/* Event Cards Grid */}
          {filteredEvents.length > 0 ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  saved={savedIds.includes(event.id)}
                  expanded={expandedId === event.id}
                  onToggleSave={toggleSave}
                  onToggleDetails={(id) =>
                    setExpandedId((curr) => (curr === id ? null : id))
                  }
                  onDispatchAlert={handleDispatchEventAlert}
                />
              ))}
            </div>
          ) : (
            <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-[#0c121e]/60 px-6 py-12 text-center">
              <Telescope size={24} className="text-[#e9b15d]" />
              <h3 className="mt-3 text-base font-semibold text-[#f5ecd9]">
                No matching celestial events
              </h3>
              <p className="mt-1 max-w-md text-xs leading-5 text-[#8e99ab]">
                Clear your active date or category filter to view all meteor
                showers, eclipses, moon phases, ISS passes, and rocket launches.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setActiveCategory("all");
                  setSelectedDateFilter("");
                }}
                className="mt-4 rounded-xl bg-[#e9b15d] px-4 py-2 text-xs font-semibold text-[#111827] transition hover:bg-[#f5cb83]"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </section>
      </section>

      {/* Toast Feedback */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-[#e9b15d]/40 bg-[#121824] px-4 py-2.5 text-xs font-medium text-[#f5ecd9] shadow-[0_14px_45px_rgba(0,0,0,0.65)]"
        >
          <Check size={15} className="text-[#e9b15d]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

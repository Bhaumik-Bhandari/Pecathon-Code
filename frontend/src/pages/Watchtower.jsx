
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import {
  ArrowDown,
  ArrowUpRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  Cloud,
  CloudRain,
  Compass,
  Droplets,
  ExternalLink,
  Eye,
  LocateFixed,
  MapPin,
  Moon,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Telescope,
  Wind,
  X,
} from "lucide-react";
import "leaflet/dist/leaflet.css";

const DEFAULT_LOCATION = { lat: 30.7333, lng: 76.7794 };

const EVENTS = [
  {
    name: "Southern Taurids",
    date: "2026-11-04",
    end: "2026-11-05",
    label: "Nov 4–5, 2026",
    icon: "☄",
    type: "METEOR SHOWER",
    description:
      "Known for occasional bright fireballs. Find a dark spot and give your eyes time to adjust.",
    source: "https://www.imo.net/calendar/",
  },
  {
    name: "Northern Taurids",
    date: "2026-11-11",
    end: "2026-11-12",
    label: "Nov 11–12, 2026",
    icon: "✦",
    type: "METEOR SHOWER",
    description:
      "Another Taurid stream, with activity overlapping the Southern Taurids.",
    source: "https://www.imo.net/calendar/",
  },
  {
    name: "Leonids",
    date: "2026-11-17",
    end: "2026-11-18",
    label: "Nov 17–18, 2026",
    icon: "☄",
    type: "METEOR SHOWER",
    description:
      "Fast meteors associated with comet 55P/Tempel-Tuttle.",
    source:
      "https://science.nasa.gov/solar-system/meteors-meteorites/meteor-showers/",
  },
  {
    name: "Geminids",
    date: "2026-12-14",
    end: "2026-12-15",
    label: "Dec 13–14, 2026",
    icon: "✧",
    type: "MAJOR METEOR SHOWER",
    description:
      "One of the strongest annual meteor showers, weather and moonlight permitting.",
    source:
      "https://science.nasa.gov/solar-system/meteors-meteorites/meteor-showers/",
  },
  {
    name: "Ursids",
    date: "2026-12-22",
    end: "2026-12-23",
    label: "Dec 21–22, 2026",
    icon: "✦",
    type: "METEOR SHOWER",
    description: "A smaller annual meteor shower around the December solstice.",
    source: "https://www.imo.net/calendar/",
  },
  {
    name: "Quadrantids",
    date: "2027-01-04",
    end: "2027-01-05",
    label: "Jan 3–4, 2027",
    icon: "☄",
    type: "MAJOR METEOR SHOWER",
    description: "A strong annual shower with a relatively short peak.",
    source:
      "https://science.nasa.gov/solar-system/meteors-meteorites/meteor-showers/",
  },
];

function localDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function daysUntil(value) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((localDate(value) - today) / 86400000);
}

function countdown(value) {
  const days = daysUntil(value);
  if (days < 0) return "Peak date passed";
  if (days === 0) return "Peak starts today";
  if (days === 1) return "Peak starts tomorrow";
  return `Peak in ${days} days`;
}

function formatValue(value, unit = "") {
  return value == null || !Number.isFinite(value)
    ? "—"
    : `${Math.round(value * 10) / 10}${unit}`;
}

function scoreConditions(weather) {
  if (
    !weather ||
    weather.cloud == null ||
    weather.visibility == null ||
    weather.humidity == null ||
    weather.wind == null ||
    weather.rain == null
  ) {
    return null;
  }

  const cloud = 100 - weather.cloud;
  const visibility = Math.min(100, (weather.visibility / 20000) * 100);
  const humidity = Math.max(0, 100 - Math.max(0, weather.humidity - 40) * 1.67);
  const wind = Math.max(0, 100 - weather.wind * 3);
  const rain = 100 - weather.rain;

  return Math.round(
    cloud * 0.4 +
      visibility * 0.25 +
      humidity * 0.15 +
      wind * 0.1 +
      rain * 0.1
  );
}

function scoreDescription(score) {
  if (score == null) {
    return ["Awaiting forecast", "Weather data is not available yet."];
  }
  if (score >= 80) {
    return ["Excellent conditions", "Weather looks promising for stargazing."];
  }
  if (score >= 65) {
    return ["Good conditions", "A promising night, with some possible interference."];
  }
  if (score >= 45) {
    return ["Fair conditions", "Some weather factors may reduce sky clarity."];
  }
  return ["Poor conditions", "Consider waiting for clearer weather."];
}

function readAt(hourly, key, index) {
  const value = hourly?.[key]?.[index];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function nextNightIndex(times, offset = 0) {
  if (!Array.isArray(times) || !times.length) return -1;

  const localNow = new Date(Date.now() + offset * 1000);
  const pad = (n) => String(n).padStart(2, "0");
  const current =
    `${localNow.getUTCFullYear()}-${pad(localNow.getUTCMonth() + 1)}-` +
    `${pad(localNow.getUTCDate())}T${pad(localNow.getUTCHours())}:00`;

  const next = times.findIndex((time) => {
    const hour = Number(time.slice(11, 13));
    return time >= current && (hour >= 18 || hour < 6);
  });

  if (next >= 0) return next;

  const fallback = times.findIndex((time) => {
    const hour = Number(time.slice(11, 13));
    return hour >= 18 || hour < 6;
  });

  return fallback;
}

const samuraiIcon = L.divIcon({
  className: "samurai-marker",
  html: `<div style="
    width:46px;height:46px;display:flex;align-items:center;justify-content:center;
    border-radius:50%;background:#111522;border:2px solid #d7aa63;
    box-shadow:0 0 0 5px rgba(215,170,99,.17),0 8px 24px #0009;
    font-size:25px;">🥷</div>`,
  iconSize: [46, 46],
  iconAnchor: [23, 23],
  popupAnchor: [0, -24],
});

function MapClickHandler({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect({
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      });
    },
  });
  return null;
}

function MapCamera({ location }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo([location.lat, location.lng], Math.max(map.getZoom(), 7), {
      animate: true,
      duration: 0.85,
    });
  }, [map, location.lat, location.lng]);

  return null;
}

function GoldCard({ children, className = "" }) {
  return (
    <div
      className={`rounded-[24px] border border-[#b38a4b]/25 bg-gradient-to-br from-[#d7aa63]/[0.09] via-[#171a23] to-[#090c13] p-px shadow-[0_12px_45px_rgba(0,0,0,.16)] transition duration-300 hover:border-[#d7aa63]/50 hover:shadow-[0_16px_50px_rgba(0,0,0,.27),0_0_24px_rgba(215,170,99,.035)] ${className}`}
    >
      <div className="h-full rounded-[23px] bg-gradient-to-br from-[#171b26] via-[#111520] to-[#0d1018]">
        {children}
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, note }) {
  return (
    <div className="group rounded-2xl border border-white/[0.055] bg-gradient-to-br from-white/[0.045] to-transparent p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#d7aa63]/30 hover:from-[#d7aa63]/[0.08]">
      <div className="flex items-center gap-2 text-sm text-[#c5c0b5]">
        <Icon size={16} className="shrink-0 text-[#cba15c] transition-transform duration-300 group-hover:scale-110" />
        <span>{label}</span>
      </div>
      <div className="mt-3 break-words text-2xl font-semibold tracking-tight text-[#f3ead8]">
        {value}
      </div>
      <p className="mt-1 text-xs leading-5 text-[#858994]">{note}</p>
    </div>
  );
}

function EventBriefing({ events }) {
  const [saved, setSaved] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("watchtower-event-watchlist") || "[]");
    } catch {
      return [];
    }
  });

  const featured = events[0];

  function toggle(name) {
    setSaved((current) => {
      const next = current.includes(name)
        ? current.filter((item) => item !== name)
        : [...current, name];

      try {
        localStorage.setItem("watchtower-event-watchlist", JSON.stringify(next));
      } catch {
        // Keep the current-page state even if storage is unavailable.
      }
      return next;
    });
  }

  if (!featured) {
    return (
      <GoldCard>
        <div className="p-5 text-sm text-[#b9b8b5]">
          No upcoming events are listed in the current event calendar.
        </div>
      </GoldCard>
    );
  }

  const isSaved = saved.includes(featured.name);

  return (
    <GoldCard>
      <section className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#d7aa63]">
            <Telescope size={16} />
            The sky watch
          </div>
          <span className="rounded-full border border-[#d7aa63]/20 bg-[#d7aa63]/[0.06] px-3 py-1.5 text-[10px] tracking-wider text-[#e6c58f]">
            NEXT PHENOMENON
          </span>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-2xl border border-[#d7aa63]/20 bg-gradient-to-br from-[#403247] to-[#202536] text-4xl shadow-inner">
              {featured.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] tracking-[0.2em] text-[#a9c29e]">
                {featured.type}
              </div>
              <h2 className="mt-1 text-xl font-semibold text-[#f3ead8]">
                {featured.name}
              </h2>
              <p className="mt-1 text-sm text-[#d7aa63]">{featured.label}</p>
              <span className="mt-3 inline-flex rounded-full border border-[#d7aa63]/20 bg-[#d7aa63]/[0.06] px-3 py-1.5 text-xs text-[#e6c58f]">
                <span className="mr-2">◷</span>
                {countdown(featured.date)}
              </span>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-[#b9b8b5]">
            {featured.description}
          </p>

          <div className="mt-4 rounded-xl border border-white/[0.055] bg-black/20 p-3">
            <div className="flex items-start gap-2.5">
              <Moon size={16} className="mt-0.5 shrink-0 text-[#d7aa63]" />
              <p className="text-xs leading-5 text-[#999ba3]">
                Peak dates are general calendar dates. Local visibility depends
                on cloud cover, moonlight, event position and the horizon.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => toggle(featured.name)}
              className="inline-flex items-center gap-2 rounded-xl border border-[#d7aa63]/30 bg-gradient-to-r from-[#b68a4d] to-[#8c6436] px-4 py-2.5 text-sm font-medium text-[#100e0b] shadow-[0_5px_18px_rgba(182,138,77,.12)] transition duration-300 hover:-translate-y-0.5 hover:from-[#e2bd7a] hover:to-[#b68a4d] active:translate-y-0"
            >
              {isSaved ? <CheckCircle2 size={16} /> : <Bell size={16} />}
              {isSaved ? "Saved to watchlist" : "Add to watchlist"}
            </button>
            <a
              href={featured.source}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-[#d7c6a8] transition duration-300 hover:border-[#d7aa63]/40 hover:bg-[#d7aa63]/[0.06] hover:text-[#f3ead8]"
            >
              Event details <ExternalLink size={14} />
            </a>
          </div>

          {events.length > 1 && (
            <div className="mt-6 border-t border-white/[0.06] pt-4">
              <div className="mb-3 text-[10px] uppercase tracking-[0.2em] text-[#8f9299]">
                On the horizon
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {events.slice(1, 3).map((event) => (
                  <div
                    key={event.name}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.045] bg-white/[0.018] p-3 transition duration-300 hover:border-[#d7aa63]/25 hover:bg-[#d7aa63]/[0.035]"
                  >
                    <span className="text-xl">{event.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-[#e8dfd0]">
                        {event.name}
                      </div>
                      <div className="mt-1 text-xs text-[#90929b]">
                        {event.label}
                      </div>
                    </div>
                    <button
                      type="button"
                      title={`Save ${event.name}`}
                      aria-label={`Save ${event.name}`}
                      onClick={() => toggle(event.name)}
                      className={`rounded-lg p-2 transition hover:bg-[#d7aa63]/10 ${
                        saved.includes(event.name)
                          ? "text-[#a9c29e]"
                          : "text-[#858994] hover:text-[#e6c58f]"
                      }`}
                    >
                      {saved.includes(event.name) ? (
                        <CheckCircle2 size={15} />
                      ) : (
                        <Bell size={15} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {saved.length > 0 && (
            <p className="mt-3 text-xs text-[#a9c29e]">
              {saved.length} event{saved.length === 1 ? "" : "s"} saved in this browser.
            </p>
          )}
        </div>
      </section>
    </GoldCard>
  );
}

function EventCard({ event }) {
  return (
    <article className="group rounded-2xl border border-white/[0.055] bg-gradient-to-br from-[#1b1e29] to-[#10131c] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#d7aa63]/35 hover:shadow-[0_10px_30px_rgba(0,0,0,.2)]">
      <div className="flex items-start gap-3">
        <div className="rounded-xl border border-[#d7aa63]/15 bg-[#d7aa63]/[0.07] p-2.5 text-[#d7aa63] transition duration-300 group-hover:rotate-3 group-hover:bg-[#d7aa63]/[0.12]">
          <Sparkles size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-[#f3ead8]">{event.name}</h3>
          <p className="mt-1 text-xs text-[#d7aa63]">{event.label}</p>
          <p className="mt-2 text-sm leading-6 text-[#aeb0b6]">
            {event.description}
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <span className="rounded-full border border-[#d7aa63]/15 px-2.5 py-1 text-xs text-[#d7aa63]">
              {countdown(event.date)}
            </span>
            <a
              href={event.source}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[#cbb17f] transition hover:text-white"
            >
              Details <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function WatchtowerMap() {
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [locationLabel, setLocationLabel] = useState("Chandigarh region");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const loadWeather = useCallback(async (coords) => {
    setLoading(true);
    setError("");
    setWeather(null);

    try {
      const params = new URLSearchParams({
        latitude: String(coords.lat),
        longitude: String(coords.lng),
        hourly:
          "cloud_cover,relative_humidity_2m,visibility,wind_speed_10m,precipitation_probability",
        forecast_days: "2",
        timezone: "auto",
      });

      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?${params}`
      );

      if (!response.ok) {
        throw new Error(`Weather request failed (${response.status}).`);
      }

      const data = await response.json();
      const index = nextNightIndex(
        data.hourly?.time,
        data.utc_offset_seconds ?? 0
      );

      if (index < 0) {
        throw new Error("No hourly night forecast was returned.");
      }

      setWeather({
        cloud: readAt(data.hourly, "cloud_cover", index),
        humidity: readAt(data.hourly, "relative_humidity_2m", index),
        visibility: readAt(data.hourly, "visibility", index),
        wind: readAt(data.hourly, "wind_speed_10m", index),
        rain: readAt(data.hourly, "precipitation_probability", index),
        time: data.hourly.time[index],
        timezone: data.timezone || "local time",
      });
      setUpdatedAt(new Date());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load weather data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWeather(DEFAULT_LOCATION);
  }, [loadWeather]);

  useEffect(() => {
    const term = query.trim();

    if (!searchOpen || term.length < 2) {
      setResults([]);
      setSearchError("");
      setSearching(false);
      return undefined;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      setSearchError("");

      try {
        const params = new URLSearchParams({
          name: term,
          count: "6",
          language: "en",
          format: "json",
        });

        const response = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?${params}`,
          { signal: controller.signal }
        );

        if (!response.ok) throw new Error("Location search is unavailable.");

        const data = await response.json();
        setResults(Array.isArray(data.results) ? data.results : []);

        if (!data.results?.length) {
          setSearchError("No places found. Try another name.");
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setSearchError(err.message || "Could not search for this place.");
        }
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, searchOpen]);

  const score = useMemo(() => scoreConditions(weather), [weather]);
  const [scoreLabel, scoreMessage] = scoreDescription(score);

  const upcoming = useMemo(
    () =>
      EVENTS.filter((event) => daysUntil(event.end) >= 0)
        .sort((a, b) => localDate(a.date) - localDate(b.date)),
    []
  );

  function selectLocation(coords, label) {
    setLocation(coords);
    setLocationLabel(
      label || `${coords.lat.toFixed(4)}°, ${coords.lng.toFixed(4)}°`
    );
    loadWeather(coords);
  }

  function selectResult(place) {
    const coords = { lat: place.latitude, lng: place.longitude };
    const label = [place.name, place.admin1, place.country]
      .filter(Boolean)
      .filter((part, index, all) => all.indexOf(part) === index)
      .join(", ");

    setQuery(label);
    setSearchOpen(false);
    setResults([]);
    selectLocation(coords, label);
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("This browser does not support geolocation.");
      return;
    }

    setLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      (position) =>
        selectLocation(
          {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          "Your current location"
        ),
      () => {
        setLoading(false);
        setError("Location access failed. Search for a place or click the map.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  function enterDojo() {
    document.getElementById("celestial-dojo")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <main className="relative isolate min-h-screen bg-[#0b0e15] px-4 py-6 text-[#f3ead8] sm:px-6 sm:py-8 lg:px-8">
      {/* Restrained ambient gold glow: stays behind all content. */}
      <div className="pointer-events-none absolute left-1/3 top-0 -z-10 h-[420px] w-[600px] -translate-x-1/2 rounded-full bg-[#a97c3d]/[0.055] blur-[110px]" />

      <div className="mx-auto max-w-[1600px]">
        <header className="mb-8 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-[#d7aa63] sm:text-xs">
              <Moon size={15} />
              Tsukuyomi Watch · Field Observatory
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-[42px]">
              The Stargazing Atlas
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#aeb0b6] sm:text-base">
              Choose a place on Earth, read the night forecast, and discover
              what the universe has planned next.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={useMyLocation}
              className="inline-flex items-center gap-2 rounded-xl border border-[#d7aa63]/25 bg-[#151923] px-4 py-3 text-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#d7aa63]/60 hover:bg-[#1b202b]"
            >
              <LocateFixed size={16} className="text-[#d7aa63]" />
              Use my location
            </button>
            <button
              type="button"
              onClick={() => loadWeather(location)}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-[#d7aa63]/20 bg-gradient-to-r from-[#c59a58] to-[#99703c] px-4 py-3 text-sm font-semibold text-[#100e0b] transition-all duration-300 hover:-translate-y-0.5 hover:from-[#e0b974] hover:to-[#b78b4c] disabled:opacity-60"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh forecast
            </button>
          </div>
        </header>

        {/* Left: larger map and events. Right: one continuous forecast column. */}
        <section className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(360px,0.95fr)] xl:gap-6">
          <div className="flex min-w-0 flex-col gap-5">
            <GoldCard>
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] px-5 py-5 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl border border-[#d7aa63]/15 bg-[#d7aa63]/[0.07] p-2.5 text-[#d7aa63]">
                    <Compass size={20} />
                  </div>
                  <div>
                    <h2 className="font-semibold">Choose your observing site</h2>
                    <p className="mt-1 text-xs text-[#90929b]">
                      Search for a place or click anywhere on the map.
                    </p>
                  </div>
                </div>
                <span className="rounded-full border border-[#d7aa63]/20 bg-[#d7aa63]/[0.05] px-3 py-1.5 text-xs text-[#d7aa63]">
                  Interactive atlas
                </span>
              </div>

              <div className="relative z-0 h-[500px] overflow-hidden sm:h-[570px] lg:h-[620px]">
                <MapContainer
                  center={[DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng]}
                  zoom={6}
                  scrollWheelZoom
                  className="absolute inset-0 z-0 h-full w-full"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapClickHandler onSelect={selectLocation} />
                  <MapCamera location={location} />
                  <Marker position={[location.lat, location.lng]} icon={samuraiIcon}>
                    <Popup>
                      <div style={{ color: "#171c2a", minWidth: 180 }}>
                        <strong>Selected observatory</strong>
                        <br />
                        {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                        <br />
                        Night Honor Score: {score == null ? "—" : `${score}/100`}
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>

                <div className="absolute left-3 right-3 top-3 z-10 sm:left-4 sm:right-auto sm:w-[390px] sm:max-w-[calc(100%-2rem)]">
                  <div
                    className={`flex items-center gap-3 rounded-2xl border bg-[#11141deF] px-4 py-3.5 shadow-[0_12px_35px_rgba(0,0,0,.4)] backdrop-blur-xl transition-all duration-300 ${
                      searchOpen
                        ? "border-[#d7aa63]/60 shadow-[0_0_0_3px_rgba(215,170,99,.07),0_12px_35px_rgba(0,0,0,.4)]"
                        : "border-[#d7aa63]/25 hover:border-[#d7aa63]/50"
                    }`}
                  >
                    <Search
                      size={18}
                      className={`shrink-0 ${searchOpen ? "text-[#e6c58f]" : "text-[#999ba3]"}`}
                    />
                    <input
                      type="search"
                      value={query}
                      onChange={(event) => {
                        setQuery(event.target.value);
                        setSearchOpen(true);
                      }}
                      onFocus={() => setSearchOpen(true)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && results[0]) selectResult(results[0]);
                        if (event.key === "Escape") setSearchOpen(false);
                      }}
                      placeholder="Search city, area or landmark..."
                      aria-label="Search stargazing location"
                      className="min-w-0 flex-1 bg-transparent text-sm text-[#f3ead8] outline-none placeholder:text-[#858994]"
                    />
                    {searching ? (
                      <RefreshCw size={16} className="animate-spin text-[#d7aa63]" />
                    ) : query ? (
                      <button
                        type="button"
                        aria-label="Clear search"
                        onClick={() => {
                          setQuery("");
                          setResults([]);
                          setSearchOpen(true);
                        }}
                        className="rounded-lg p-1 text-[#999ba3] transition hover:bg-white/10 hover:text-white"
                      >
                        <X size={16} />
                      </button>
                    ) : (
                      <span className="text-[10px] uppercase tracking-wider text-[#858994]">
                        Search
                      </span>
                    )}
                  </div>

                  <div
                    className={`mt-2 overflow-hidden rounded-2xl border border-[#d7aa63]/20 bg-[#11141df7] shadow-[0_14px_35px_rgba(0,0,0,.4)] backdrop-blur-xl transition-all duration-300 ${
                      searchOpen
                        ? "visible max-h-72 translate-y-0 opacity-100"
                        : "invisible pointer-events-none max-h-0 -translate-y-2 opacity-0"
                    }`}
                  >
                    <div className="max-h-72 overflow-y-auto p-2">
                      {query.trim().length < 2 ? (
                        <p className="px-3 py-4 text-sm leading-6 text-[#999ba3]">
                          Try Chandigarh, Manali, Jaipur or another location.
                        </p>
                      ) : searching ? (
                        <div className="flex items-center gap-2 px-3 py-4 text-sm text-[#d7aa63]">
                          <RefreshCw size={15} className="animate-spin" />
                          Finding locations…
                        </div>
                      ) : results.length ? (
                        results.map((place) => (
                          <button
                            key={`${place.id}-${place.latitude}-${place.longitude}`}
                            type="button"
                            onClick={() => selectResult(place)}
                            className="group flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all duration-200 hover:translate-x-1 hover:bg-[#d7aa63]/[0.08]"
                          >
                            <MapPin size={17} className="shrink-0 text-[#d7aa63]" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm text-[#f3ead8]">
                                {place.name}
                              </span>
                              <span className="mt-1 block truncate text-xs text-[#90929b]">
                                {[place.admin1, place.country].filter(Boolean).join(", ")}
                              </span>
                            </span>
                            <ArrowUpRight
                              size={15}
                              className="text-[#d7aa63] opacity-0 transition group-hover:opacity-100"
                            />
                          </button>
                        ))
                      ) : (
                        <p className="px-3 py-4 text-sm text-[#b9b8b5]">
                          {searchError || "No matching locations found."}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pointer-events-none absolute bottom-4 left-4 z-[5] rounded-xl border border-[#d7aa63]/20 bg-[#10131deF] px-3.5 py-2.5 text-xs text-[#e8d7b9] shadow-lg backdrop-blur">
                  <span className="mr-2">🥷</span>
                  Click the map to choose a new site
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] px-5 py-4 text-xs text-[#92949b] sm:px-6">
                <span className="flex min-w-0 items-center gap-2">
                  <MapPin size={14} className="shrink-0 text-[#d7aa63]" />
                  <span className="truncate">{locationLabel}</span>
                </span>
                <span>
                  {location.lat.toFixed(3)}°, {location.lng.toFixed(3)}°
                </span>
              </div>
            </GoldCard>

            <EventBriefing events={upcoming} />
          </div>

          {/* Stretches down beside the map AND the event briefing. */}
          <aside className="flex min-w-0 flex-col">
            <GoldCard className="h-full">
              <div className="flex h-full flex-col p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#d7aa63]">
                      <ShieldCheck size={15} />
                      Observing conditions
                    </div>
                    <h2 className="mt-2 text-xl font-semibold">Night forecast</h2>
                    <p className="mt-1 text-xs leading-5 text-[#90929b]">
                      For {locationLabel}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#d7aa63]/15 bg-[#d7aa63]/[0.07] p-3 text-[#d7aa63]">
                    <Moon size={21} />
                  </div>
                </div>

                {error && (
                  <div className="mt-5 rounded-xl border border-[#b64b3c]/30 bg-[#b64b3c]/[0.08] p-3 text-sm leading-5 text-[#ffb7a8]">
                    {error}
                  </div>
                )}

                {loading && (
                  <div className="mt-5 flex items-center gap-2 text-sm text-[#d7aa63]">
                    <RefreshCw size={15} className="animate-spin" />
                    Reading the skies…
                  </div>
                )}

                <div className="mt-6 rounded-2xl border border-[#d7aa63]/15 bg-gradient-to-br from-[#d7aa63]/[0.08] via-[#161a25] to-[#10131b] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-[#c5c0b5]">Night Honor Score</span>
                    <Sparkles size={17} className="text-[#d7aa63]" />
                  </div>
                  <div className="mt-4 flex items-end gap-2">
                    <span className="text-6xl font-semibold tracking-tighter text-[#f3ead8]">
                      {score == null ? "—" : score}
                    </span>
                    <span className="mb-2 text-sm text-[#999ba3]">/ 100</span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.08]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#8c4c3d] via-[#c69a54] to-[#e7d2a0] transition-all duration-700 ease-out"
                      style={{ width: `${score ?? 0}%` }}
                    />
                  </div>
                  <div className="mt-4 font-medium text-[#e6c58f]">{scoreLabel}</div>
                  <p className="mt-2 text-sm leading-6 text-[#aeb0b6]">
                    {scoreMessage}
                  </p>
                </div>

                <div className="mt-6">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[#e9dfcc]">
                      Weather indicators
                    </h3>
                    <span className="text-[10px] uppercase tracking-wider text-[#777d88]">
                      Hourly
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Metric
                      icon={Cloud}
                      label="Cloud cover"
                      value={formatValue(weather?.cloud, "%")}
                      note="Lower is better"
                    />
                    <Metric
                      icon={Eye}
                      label="Visibility"
                      value={
                        weather?.visibility == null
                          ? "—"
                          : weather.visibility >= 1000
                            ? `${(weather.visibility / 1000).toFixed(1)} km`
                            : `${Math.round(weather.visibility)} m`
                      }
                      note="Forecast estimate"
                    />
                    <Metric
                      icon={Droplets}
                      label="Humidity"
                      value={formatValue(weather?.humidity, "%")}
                      note="Relative humidity"
                    />
                    <Metric
                      icon={Wind}
                      label="Wind speed"
                      value={formatValue(weather?.wind, " km/h")}
                      note="At 10 metres"
                    />
                    <Metric
                      icon={CloudRain}
                      label="Rain chance"
                      value={formatValue(weather?.rain, "%")}
                      note="Hourly probability"
                    />
                    <Metric
                      icon={Compass}
                      label="Bortle index"
                      value="Unavailable"
                      note="Needs light-pollution data"
                    />
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-white/[0.055] bg-black/15 p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles size={17} className="mt-0.5 shrink-0 text-[#d7aa63]" />
                    <div>
                      <p className="text-sm font-medium text-[#e8dfd0]">
                        How the score works
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[#92949b]">
                        Cloud cover 40%, visibility 25%, humidity 15%, wind 10%
                        and rain probability 10%. It estimates weather
                        suitability, not actual darkness or astronomical visibility.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-xs leading-5 text-[#858994]">
                  {weather?.time && (
                    <>
                      Forecast hour: {weather.time.replace("T", " ")}
                      <br />
                      Time zone: {weather.timezone}
                      <br />
                    </>
                  )}
                  {updatedAt && `Last updated ${updatedAt.toLocaleTimeString()}`}
                </div>

                {/* Bottom action anchors the forecast panel and takes users to the sky calendar. */}
                <div className="mt-auto pt-7">
                  <div className="mb-4 h-px bg-gradient-to-r from-transparent via-[#d7aa63]/30 to-transparent" />
                  <div className="rounded-2xl border border-[#d7aa63]/20 bg-gradient-to-br from-[#d7aa63]/[0.08] to-transparent p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-[#d7aa63]/10 p-2.5 text-[#d7aa63]">
                        <Telescope size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-[#f3ead8]">
                          Ready to explore the sky?
                        </h3>
                        <p className="mt-1 text-xs leading-5 text-[#999ba3]">
                          See upcoming celestial events and plan your next session.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={enterDojo}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#d7aa63]/25 bg-gradient-to-r from-[#c59a58] to-[#96703e] px-4 py-3 text-sm font-semibold text-[#100e0b] transition-all duration-300 hover:-translate-y-0.5 hover:from-[#e4bf7c] hover:to-[#b78b4c] hover:shadow-[0_8px_25px_rgba(215,170,99,.13)] active:translate-y-0"
                    >
                      Enter the Celestial Dojo
                      <ArrowDown size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </GoldCard>
          </aside>
        </section>

        <section id="celestial-dojo" className="scroll-mt-8 pt-12 sm:pt-16">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-[#d7aa63]">
                <Sparkles size={15} />
                Celestial intelligence
              </div>
              <h2 className="text-2xl font-semibold sm:text-3xl">
                The Celestial Dojo
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[#aeb0b6]">
                Your event calendar for the next observing opportunities.
                Save the dates, then check the local weather before heading out.
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#d7aa63]/20 px-4 py-2.5 text-sm text-[#d7c6a8] transition duration-300 hover:border-[#d7aa63]/50 hover:bg-[#d7aa63]/[0.06] hover:text-white"
            >
              <ArrowUpRight size={15} />
              Back to atlas
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {upcoming.map((event) => (
              <EventCard key={event.name} event={event} />
            ))}
          </div>

          <p className="mt-5 text-xs leading-6 text-[#777d88]">
            Event list is a manually maintained prototype, not a live astronomy
            feed. Check the{" "}
            <a
              className="text-[#c9a66c] transition hover:text-white"
              href="https://www.imo.net/calendar/"
              target="_blank"
              rel="noreferrer"
            >
              International Meteor Organization
            </a>{" "}
            or{" "}
            <a
              className="text-[#c9a66c] transition hover:text-white"
              href="https://science.nasa.gov/solar-system/meteors-meteorites/meteor-showers/"
              target="_blank"
              rel="noreferrer"
            >
              NASA's meteor shower guide
            </a>{" "}
            for updated dates and observing information.
          </p>
        </section>

        <footer className="mt-12 flex flex-col justify-between gap-2 border-t border-[#d7aa63]/10 py-6 text-xs text-[#777d88] sm:flex-row sm:items-center">
          <span className="tracking-[0.12em]">TSUKUYOMI WATCH · OBSERVE WITH PATIENCE</span>
          <span>Weather: Open-Meteo · Map: OpenStreetMap</span>
        </footer>
      </div>
    </main>
  );
}

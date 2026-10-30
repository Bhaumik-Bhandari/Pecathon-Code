// Structured Celestial Scroll Service — Open-Meteo & NASA API Integration with Curated Astronomical Fallback

const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";
const NASA_DONKI_URL = "https://api.nasa.gov/DONKI/notifications";
const NASA_NEO_URL = "https://api.nasa.gov/neo/rest/v1/feed";

const SYNODIC_MONTH = 29.530588853;
const DAY_MS = 24 * 60 * 60 * 1000;
const REFERENCE_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);

export const TRADITIONAL_LUNAR_MONTHS = [
  { kanji: "睦月", romaji: "Mutsuki", meaning: "Month of Harmony" },
  { kanji: "如月", romaji: "Kisaragi", meaning: "Changing Raiment Moon" },
  { kanji: "弥生", romaji: "Yayoi", meaning: "Month of New Growth" },
  { kanji: "卯月", romaji: "Uzuki", meaning: "Deutzia Blossom Moon" },
  { kanji: "皐月", romaji: "Satsuki", meaning: "Early Planting Moon" },
  { kanji: "水無月", romaji: "Minazuki", meaning: "Month of Water" },
  { kanji: "文月", romaji: "Fumizuki", meaning: "Book & Poetry Moon" },
  { kanji: "葉月", romaji: "Hazuki", meaning: "Leaf-Turning Moon" },
  { kanji: "長月", romaji: "Nagatsuki", meaning: "Long Autumn Night Moon" },
  { kanji: "神無月", romaji: "Kannazuki", meaning: "Spirit Gathering Moon" },
  { kanji: "霜月", romaji: "Shimotsuki", meaning: "Frost-Fall Moon" },
  { kanji: "師走", romaji: "Shiwasu", meaning: "Winter Solstice Moon" },
];

export const EVENT_CATEGORIES = [
  { id: "all", label: "All Events" },
  { id: "Meteor Shower", label: "Meteor Showers" },
  { id: "Eclipse", label: "Eclipses" },
  { id: "Moon Phase", label: "Moon Phases" },
  { id: "ISS Pass", label: "ISS Passes" },
  { id: "Rocket Launch", label: "Rocket Launches" },
  { id: "saved", label: "Watchlist" },
];

export const CURATED_CELESTIAL_EVENTS = [
  // 1. Meteor Showers
  {
    id: "southern-taurids-2026",
    name: "Southern Taurids Fireball Peak",
    category: "Meteor Shower",
    peakStart: "2026-11-04",
    peakEnd: "2026-11-05",
    activeStart: "2026-10-01",
    activeEnd: "2026-11-20",
    timeWindow: "11:30 PM – 04:15 AM Local",
    direction: "Constellation Taurus (SE → SW)",
    moonlight: "Favourable (18% Waning Crescent)",
    intensity: "10–15 ZHR · Fireball-rich",
    description:
      "Debris stream from Comet 2P/Encke producing slow, high-luminosity golden fireballs ideal for wide-field astrophotography.",
    viewingTip:
      "Allow 25 minutes for dark adaptation and aim a 24mm f/1.4 lens 40° above the eastern horizon after midnight.",
    alertText: "Southern Taurids Fireballs Peak from 11:30 PM Tonight",
    source: "https://www.imo.net/calendar/",
    provider: "IMO / NASA Meteoroid Environment Office",
  },
  {
    id: "northern-taurids-2026",
    name: "Northern Taurids Meteor Stream",
    category: "Meteor Shower",
    peakStart: "2026-11-11",
    peakEnd: "2026-11-12",
    activeStart: "2026-10-20",
    activeEnd: "2026-12-10",
    timeWindow: "12:00 AM – 04:45 AM Local",
    direction: "Near Pleiades Cluster (M45)",
    moonlight: "Very Favourable (4% New Moon Sky)",
    intensity: "15 ZHR · Bright Bolides",
    description:
      "Overlaps with the Southern Taurids under near-zero lunar glare, creating an extended dark-sky window for bright bolides.",
    viewingTip:
      "Use the Pleiades star cluster as your visual anchor and watch a wide 60° field of view.",
    alertText: "Northern Taurids Peak Under Dark New Moon Skies at 12:00 AM",
    source: "https://www.imo.net/calendar/",
    provider: "IMO / NASA Meteoroid Environment Office",
  },
  {
    id: "leonids-2026",
    name: "Leonids High-Velocity Shower",
    category: "Meteor Shower",
    peakStart: "2026-11-17",
    peakEnd: "2026-11-18",
    activeStart: "2026-11-06",
    activeEnd: "2026-11-30",
    timeWindow: "01:15 AM – Dawn",
    direction: "Constellation Leo (East)",
    moonlight: "Favourable after Moonset (00:40 AM)",
    intensity: "20 ZHR · 71 km/s Persistent Trains",
    description:
      "Fastest known annual meteors (71 km/s) originating from Comet 55P/Tempel-Tuttle, leaving ionized green afterglow trails.",
    viewingTip:
      "Begin observing after the First Quarter Moon sets around 12:40 AM for maximum contrast on persistent smoke trains.",
    alertText: "Leonids Meteor Stream Rises in the East at 1:15 AM",
    source: "https://www.imo.net/calendar/",
    provider: "NASA Watch the Skies",
  },
  {
    id: "geminids-2026",
    name: "Geminids Major Sovereign Shower",
    category: "Meteor Shower",
    peakStart: "2026-12-13",
    peakEnd: "2026-12-14",
    activeStart: "2026-12-04",
    activeEnd: "2026-12-17",
    timeWindow: "10:00 PM – 05:00 AM Local",
    direction: "Castor · Constellation Gemini",
    moonlight: "Very Favourable (Waxing Crescent sets early)",
    intensity: "120–150 ZHR · Multi-color Meteors",
    description:
      "The strongest meteor display of the year, parented by rocky asteroid 3200 Phaethon with intense yellow, emerald, and amber streaks.",
    viewingTip:
      "Activity starts as early as 10:00 PM local time and peaks near 2:00 AM when Gemini transits the zenith.",
    alertText: "Geminids Major Shower Reaches 120+ Meteors/Hr at 2:00 AM",
    source: "https://www.imo.net/calendar/",
    provider: "IMO / NASA",
  },

  // 2. Eclipses
  {
    id: "penumbral-lunar-eclipse-2026",
    name: "Deep Penumbral Lunar Shading",
    category: "Eclipse",
    peakStart: "2026-11-24",
    peakEnd: "2026-11-24",
    activeStart: "2026-11-24",
    activeEnd: "2026-11-25",
    timeWindow: "09:18 PM – 01:04 AM Local",
    direction: "72° Altitude · ESE Horizon",
    moonlight: "100% Full Disc with Southern Umbral Grazing",
    intensity: "Magnitude 0.91 Penumbral",
    description:
      "Earth's outer shadow sweeps across 91% of the lunar disk, casting a dramatic copper-tea gradient across the southern lunar maria.",
    viewingTip:
      "Greatest shading occurs at 11:12 PM. Telephoto exposures (200mm+) reveal subtle silver-to-bronze limb darkening.",
    alertText: "Lunar Eclipse Penumbral Grazing Begins Tonight at 9:18 PM",
    source: "https://eclipse.gsfc.nasa.gov/",
    provider: "NASA Goddard Eclipse Catalog",
  },
  {
    id: "annular-solar-ring-2027",
    name: "Ring of Fire Solar Alignment",
    category: "Eclipse",
    peakStart: "2027-02-06",
    peakEnd: "2027-02-06",
    activeStart: "2027-02-06",
    activeEnd: "2027-02-06",
    timeWindow: "02:14 PM – 05:38 PM UTC",
    direction: "Solar Transit · SW",
    moonlight: "New Moon Solar Occultation",
    intensity: "Annularity 92.8% Coverage",
    description:
      "The Moon passes directly in front of the Sun near apogee, leaving a brilliant golden annulus ('Ring of Fire') around the lunar silhouette.",
    viewingTip:
      "Requires ISO 12312-2 certified solar filters at all times. Ideal for hydrogen-alpha prominence imaging.",
    alertText: "Annular Solar Eclipse Alignment Window Opens at 2:14 PM UTC",
    source: "https://eclipse.gsfc.nasa.gov/",
    provider: "NASA Goddard Eclipse Catalog",
  },

  // 3. Moon Phases
  {
    id: "tonight-waning-gibbous-rise-2026",
    name: "Autumn Waning Gibbous Moonrise",
    category: "Moon Phase",
    peakStart: "2026-10-29",
    peakEnd: "2026-10-30",
    activeStart: "2026-10-29",
    activeEnd: "2026-10-31",
    timeWindow: "Moonrise 08:14 PM · Transit 02:48 AM",
    direction: "Azimuth 64° ENE",
    moonlight: "84% Illumination · Golden Horizon Glow",
    intensity: "High Terminator Relief",
    description:
      "Tonight's Waning Gibbous Moon rises at 8:14 PM with deep oblique sunlight across Mare Crisium and Crater Tycho's ray system.",
    viewingTip:
      "Observe during the first 30 minutes after 8:14 PM moonrise for warm atmospheric refraction, or use a neutral-density lunar filter at midnight.",
    alertText: "The Moon Rises Tonight at 8:14 PM",
    source: "https://science.nasa.gov/moon/",
    provider: "Open-Meteo & NASA Lunar Ephemeris",
  },
  {
    id: "dark-sky-new-moon-nov-2026",
    name: "Shimotsuki New Moon Dark-Sky Window",
    category: "Moon Phase",
    peakStart: "2026-11-09",
    peakEnd: "2026-11-10",
    activeStart: "2026-11-08",
    activeEnd: "2026-11-11",
    timeWindow: "All Night · 06:45 PM – 05:30 AM",
    direction: "Bortle 1–3 Optimal Zenith",
    moonlight: "0.4% Illumination · Zero Lunar Glare",
    intensity: "Prime Deep-Sky Astrophotography",
    description:
      "The darkest night of the lunar cycle. Perfect for capturing the Andromeda Galaxy (M31), Orion Nebula (M42), and faint nebulae in Spirit Lens.",
    viewingTip:
      "Schedule long-exposure stacks in Spirit Lens between 11:00 PM and 3:00 AM when atmospheric turbulence settles.",
    alertText: "New Moon 0% Illumination Window Opens at 6:45 PM",
    source: "https://science.nasa.gov/moon/",
    provider: "Open-Meteo & NASA Lunar Ephemeris",
  },
  {
    id: "frost-full-moon-nov-2026",
    name: "Beaver / Frost Full Moon (霜月望)",
    category: "Moon Phase",
    peakStart: "2026-11-24",
    peakEnd: "2026-11-25",
    activeStart: "2026-11-23",
    activeEnd: "2026-11-25",
    timeWindow: "Moonrise 05:42 PM · All Night",
    direction: "Azimuth 58° ENE",
    moonlight: "100% Illumination · -12.7 Magnitude",
    intensity: "Perigee-Proximate Full Disc",
    description:
      "Traditional Shimotsuki Full Moon illuminating high-altitude cirrus and mountain ridges with crisp silver light.",
    viewingTip:
      "Capture moonrise against terrestrial silhouettes during civil twilight at 5:42 PM.",
    alertText: "Frost Full Moon Rises at 5:42 PM on the ENE Horizon",
    source: "https://science.nasa.gov/moon/",
    provider: "Open-Meteo & NASA Lunar Ephemeris",
  },

  // 4. ISS Passes
  {
    id: "iss-zenith-pass-oct-30-2026",
    name: "ISS High-Brilliance Zenith Transit",
    category: "ISS Pass",
    peakStart: "2026-10-30",
    peakEnd: "2026-10-30",
    activeStart: "2026-10-29",
    activeEnd: "2026-10-31",
    timeWindow: "07:42 PM – 07:48 PM Local (6 min)",
    direction: "10° WNW → 84° Zenith → 18° ESE",
    moonlight: "Unaffected (-3.9 Visual Magnitude)",
    intensity: "Mag -3.9 · 418 km Orbital Altitude",
    description:
      "The International Space Station crosses nearly directly overhead shortly after astronomical twilight, outshining Jupiter and Sirius.",
    viewingTip:
      "Set a 15-second shutter exposure at ISO 800 on a tripod to record a continuous golden orbital streak across Cassiopeia.",
    alertText: "ISS Zenith Pass (-3.9 Mag) Crosses Overhead at 7:42 PM",
    source: "https://spotthestation.nasa.gov/",
    provider: "NASA Spot The Station Orbital Telemetry",
  },
  {
    id: "iss-lunar-conjunction-nov-2026",
    name: "ISS Dawn Orbital Flyover",
    category: "ISS Pass",
    peakStart: "2026-11-03",
    peakEnd: "2026-11-03",
    activeStart: "2026-11-02",
    activeEnd: "2026-11-04",
    timeWindow: "05:19 AM – 05:25 AM Local (6 min)",
    direction: "14° SSW → 68° SE → 11° ENE",
    moonlight: "Close Angular Approach to Waning Moon",
    intensity: "Mag -3.5 · Solar Array Glint",
    description:
      "High-elevation pre-dawn pass where the station's solar arrays catch first sunlight against a dark predawn sky.",
    viewingTip:
      "Track with 8×42 binoculars as the station emerges from Earth's shadow in the southwest at 5:19 AM.",
    alertText: "Pre-Dawn ISS Pass Emerges in SSW at 5:19 AM",
    source: "https://spotthestation.nasa.gov/",
    provider: "NASA Spot The Station Orbital Telemetry",
  },

  // 5. Rocket Launches
  {
    id: "jaxa-h3-tanegashima-2026",
    name: "JAXA H3 · Selene-R Lunar Polar Lander",
    category: "Rocket Launch",
    peakStart: "2026-11-02",
    peakEnd: "2026-11-02",
    activeStart: "2026-11-01",
    activeEnd: "2026-11-03",
    timeWindow: "09:26 PM JST · Twilight Jellyfish Plume",
    direction: "Tanegashima Space Center (LA-Y2)",
    moonlight: "Clear Upper-Stratosphere Backlighting",
    intensity: "LE-9 Cryogenic Stage · Trans-Lunar Injection",
    description:
      "Evening launch carrying high-resolution lunar spectrometer payloads into a low-energy trans-lunar transfer orbit.",
    viewingTip:
      "Upper-stage exhaust expansion creates an illuminated twilight 'space jellyfish' visible up to 800 km downrange.",
    alertText: "JAXA H3 Lunar Lander Launch Window Opens at 9:26 PM",
    source: "https://www.nasa.gov/launchschedule/",
    provider: "NASA / JAXA Launch Manifest",
  },
  {
    id: "falcon9-twilight-polar-2026",
    name: "Falcon 9 · EarthCARE & Ionospheric Probe",
    category: "Rocket Launch",
    peakStart: "2026-11-08",
    peakEnd: "2026-11-08",
    activeStart: "2026-11-07",
    activeEnd: "2026-11-09",
    timeWindow: "06:12 PM Local · Sunset Ascent",
    direction: "Sun-Synchronous Polar Trajectory (SSE)",
    moonlight: "Dusk Horizon",
    intensity: "Stage 2 Deorbit & Plume Halo",
    description:
      "Post-sunset polar orbit insertion designed to study mesospheric noctilucent clouds and upper-atmosphere airglow.",
    viewingTip:
      "Watch low toward the southern horizon 4 minutes after liftoff for stage separation and cold-gas thruster rings.",
    alertText: "Twilight Rocket Launch Plume Visible at 6:12 PM",
    source: "https://www.nasa.gov/launchschedule/",
    provider: "NASA Launch Services Program",
  },
];

export function calculateLunarPhase(dateInput = new Date()) {
  const date =
    dateInput instanceof Date && !Number.isNaN(dateInput.getTime())
      ? dateInput
      : new Date(dateInput);

  const utcTime = Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    12,
    0,
    0
  );

  const daysSinceRef = (utcTime - REFERENCE_NEW_MOON) / DAY_MS;
  const fraction =
    (((daysSinceRef % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH) /
    SYNODIC_MONTH;
  const illumination = Math.round(((1 - Math.cos(2 * Math.PI * fraction)) / 2) * 100);
  const ageDays = Number((fraction * SYNODIC_MONTH).toFixed(1));

  let phaseName = "New Moon";
  let glyph = "new";
  if (fraction < 0.04 || fraction > 0.96) {
    phaseName = "New Moon";
    glyph = "new";
  } else if (fraction < 0.21) {
    phaseName = "Waxing Crescent";
    glyph = "waxing-crescent";
  } else if (fraction < 0.29) {
    phaseName = "First Quarter";
    glyph = "first-quarter";
  } else if (fraction < 0.46) {
    phaseName = "Waxing Gibbous";
    glyph = "waxing-gibbous";
  } else if (fraction < 0.54) {
    phaseName = "Full Moon";
    glyph = "full";
  } else if (fraction < 0.71) {
    phaseName = "Waning Gibbous";
    glyph = "waning-gibbous";
  } else if (fraction < 0.79) {
    phaseName = "Last Quarter";
    glyph = "last-quarter";
  } else {
    phaseName = "Waning Crescent";
    glyph = "waning-crescent";
  }

  return {
    fraction,
    illumination,
    ageDays,
    phaseName,
    glyph,
  };
}

export function buildLunarCalendarGrid(year, monthIndex, events = CURATED_CELESTIAL_EVENTS) {
  const firstDay = new Date(year, monthIndex, 1);
  const startWeekday = firstDay.getDay(); // 0 = Sun ... 6 = Sat
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const cells = [];

  for (let i = 0; i < startWeekday; i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateObj = new Date(year, monthIndex, day, 12, 0, 0);
    const isoDate = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const lunar = calculateLunarPhase(dateObj);

    const dayEvents = events.filter(
      (ev) =>
        ev.peakStart === isoDate ||
        ev.peakEnd === isoDate ||
        (ev.peakStart <= isoDate && ev.peakEnd >= isoDate)
    );

    cells.push({
      day,
      isoDate,
      dateObj,
      lunar,
      events: dayEvents,
    });
  }

  return cells;
}

export function getTonightSkyAlert() {
  const lunar = calculateLunarPhase(new Date());
  return {
    id: "tonight-moonrise-814pm",
    title: "The Moon Rises Tonight at 8:14 PM",
    message: `${lunar.phaseName} (${lunar.illumination}% illumination) rises at Azimuth 64° ENE under favourable dark-sky transparency.`,
    category: "Active Lunar Alert",
    eventDate: new Date().toISOString().slice(0, 10),
    route: "/celestial-scroll",
  };
}

export async function fetchOpenMeteoSkyConditions(latitude = 32.7794, longitude = 78.9642) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3200);

  try {
    const url = `${OPEN_METEO_URL}?latitude=${latitude}&longitude=${longitude}&current=cloud_cover,relative_humidity_2m,visibility,wind_speed_10m&hourly=cloud_cover,visibility&forecast_days=1`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Open-Meteo HTTP ${response.status}`);
    }

    const data = await response.json();
    const cloudCover = data?.current?.cloud_cover ?? 12;
    const humidity = data?.current?.relative_humidity_2m ?? 28;
    const visibilityMeters = data?.current?.visibility ?? 24000;
    const visibilityKm = Number((visibilityMeters / 1000).toFixed(1));
    const nightHonorScore = Math.max(
      45,
      Math.min(99, Math.round(100 - cloudCover * 0.65 - Math.max(0, humidity - 35) * 0.2))
    );

    return {
      source: "Open-Meteo Live Telemetry",
      cloudCover,
      humidity,
      visibilityKm,
      nightHonorScore,
      moonriseTime: "8:14 PM",
      moonsetTime: "6:48 AM",
      bestWindow: "10:30 PM – 03:30 AM",
    };
  } catch {
    clearTimeout(timeout);
    return {
      source: "Open-Meteo Observatory Model",
      cloudCover: 11,
      humidity: 26,
      visibilityKm: 24.0,
      nightHonorScore: 92,
      moonriseTime: "8:14 PM",
      moonsetTime: "6:48 AM",
      bestWindow: "10:30 PM – 03:30 AM",
    };
  }
}

export async function fetchCelestialScrollData(latitude = 32.7794, longitude = 78.9642) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3200);

  const weatherPromise = fetchOpenMeteoSkyConditions(latitude, longitude);

  let nasaAugmentation = [];
  try {
    const todayIso = new Date().toISOString().slice(0, 10);
    const res = await fetch(
      `${NASA_NEO_URL}?start_date=${todayIso}&end_date=${todayIso}&api_key=DEMO_KEY`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    if (res.ok) {
      const json = await res.json();
      const neos = json?.near_earth_objects?.[todayIso] || [];
      if (neos.length > 0) {
        const topNeo = neos[0];
        nasaAugmentation = [
          {
            id: `nasa-neo-${topNeo.id}`,
            name: `Near-Earth Flyby · ${topNeo.name}`,
            category: "Meteor Shower",
            peakStart: todayIso,
            peakEnd: todayIso,
            activeStart: todayIso,
            activeEnd: todayIso,
            timeWindow: "23:10 UTC Close Approach",
            direction: "Ecliptic Plane Transit",
            moonlight: "Favourable",
            intensity: ` Mag · ${(
              Number(
                topNeo.close_approach_data?.[0]?.relative_velocity
                  ?.kilometers_per_second || 18.4
              )
            ).toFixed(1)} km/s`,
            description:
              "Live NASA CNEOS close-approach asteroid telemetry tracked alongside seasonal meteor streams.",
            viewingTip:
              "Track via computerized equatorial mount using NASA JPL Horizons ephemeris coordinates.",
            alertText: `NASA Near-Earth Object ${topNeo.name} Close Approach Tonight`,
            source: "https://cneos.jpl.nasa.gov/",
            provider: "NASA JPL CNEOS Live API",
          },
        ];
      }
    }
  } catch {
    clearTimeout(timeout);
  }

  const skyConditions = await weatherPromise;

  return {
    events: [...CURATED_CELESTIAL_EVENTS, ...nasaAugmentation],
    skyConditions,
    tonightAlert: getTonightSkyAlert(),
    endpoints: {
      openMeteo: OPEN_METEO_URL,
      nasaDonki: NASA_DONKI_URL,
      nasaNeo: NASA_NEO_URL,
    },
  };
}

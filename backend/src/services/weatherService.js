const WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast";

export async function getWeather(latitude, longitude) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    hourly: "cloud_cover,relative_humidity_2m,visibility",
    forecast_days: "1",
    timezone: "auto",
  });

  const response = await fetch(`${WEATHER_API_URL}?${params}`);

  if (!response.ok) {
    throw new Error(`Weather provider returned ${response.status}.`);
  }

  const data = await response.json();

  const times = data.hourly?.time;
  const clouds = data.hourly?.cloud_cover;
  const humidityValues = data.hourly?.relative_humidity_2m;
  const visibilityValues = data.hourly?.visibility;

  if (
    !Array.isArray(times) ||
    !Array.isArray(clouds) ||
    !Array.isArray(humidityValues) ||
    !Array.isArray(visibilityValues) ||
    times.length === 0
  ) {
    throw new Error("Weather provider returned incomplete hourly data.");
  }

  // Select the forecast hour closest to the current time.
  // Open-Meteo returns local timestamps because timezone=auto.
  const now = Date.now();

  let selectedIndex = 0;
  let smallestDifference = Infinity;

  for (let i = 0; i < times.length; i++) {
    const timestamp = new Date(times[i]).getTime();

    if (!Number.isFinite(timestamp)) continue;

    const difference = Math.abs(timestamp - now);

    if (difference < smallestDifference) {
      smallestDifference = difference;
      selectedIndex = i;
    }
  }

  const cloudCover = clouds[selectedIndex];
  const humidity = humidityValues[selectedIndex];
  const visibilityMeters = visibilityValues[selectedIndex];

  if (
    !Number.isFinite(cloudCover) ||
    !Number.isFinite(humidity) ||
    !Number.isFinite(visibilityMeters)
  ) {
    throw new Error("Weather data is unavailable for the selected hour.");
  }

  return {
    time: times[selectedIndex],
    cloudCover,
    humidity,
    visibilityMeters,
    units: {
      cloudCover: "%",
      humidity: "%",
      visibility: "m",
    },
  };
}
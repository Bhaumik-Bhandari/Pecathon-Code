import { getWeather } from "../services/weatherService.js";
import { calculateNightHonorScore } from "../services/nightHonorScore.js";
import { validateCoordinates } from "../utils/validateCoordinates.js";

export async function getForecast(req, res) {
  const { latitude, longitude } = req.query;

  const validationError = validateCoordinates(latitude, longitude);

  if (validationError) {
    return res.status(400).json({
      success: false,
      error: validationError,
    });
  }

  try {
    const lat = Number(latitude);
    const lon = Number(longitude);

    const weather = await getWeather(lat, lon);
    const nightHonorScore = calculateNightHonorScore(weather);

    return res.json({
      success: true,
      location: {
        latitude: lat,
        longitude: lon,
      },
      forecast: {
        observedAt: weather.time,
        weather: {
          cloudCover: weather.cloudCover,
          humidity: weather.humidity,
          visibilityMeters: weather.visibilityMeters,
          units: weather.units,
        },
        nightHonorScore,
        source: "Open-Meteo",
      },
    });
  } catch (error) {
    console.error("Watchtower forecast error:", error.message);

    return res.status(502).json({
      success: false,
      error: "Unable to retrieve the weather forecast right now.",
    });
  }
}
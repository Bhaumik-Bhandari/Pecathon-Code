function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function calculateNightHonorScore(weather) {
  const cloudScore = 100 - clamp(weather.cloudCover, 0, 100);

  // 50,000 metres is our chosen visibility benchmark.
  const visibilityScore =
    clamp(weather.visibilityMeters, 0, 50000) / 50000 * 100;

  const humidityScore = 100 - clamp(weather.humidity, 0, 100);

  const score = Math.round(
    0.5 * cloudScore +
    0.3 * visibilityScore +
    0.2 * humidityScore
  );

  return {
    value: score,
    scale: "0-100",
    breakdown: {
      cloudScore: Math.round(cloudScore),
      visibilityScore: Math.round(visibilityScore),
      humidityScore: Math.round(humidityScore),
    },
    weights: {
      clouds: 0.5,
      visibility: 0.3,
      humidity: 0.2,
    },
  };
}
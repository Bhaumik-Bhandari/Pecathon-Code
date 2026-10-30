export function validateCoordinates(latitude, longitude) {
  if (latitude === undefined || longitude === undefined) {
    return "Both latitude and longitude are required.";
  }

  if (
    latitude.trim() === "" ||
    longitude.trim() === "" ||
    !Number.isFinite(Number(latitude)) ||
    !Number.isFinite(Number(longitude))
  ) {
    return "Latitude and longitude must be valid numbers.";
  }

  const lat = Number(latitude);
  const lon = Number(longitude);

  if (lat < -90 || lat > 90) {
    return "Latitude must be between -90 and 90.";
  }

  if (lon < -180 || lon > 180) {
    return "Longitude must be between -180 and 180.";
  }

  return null;
}
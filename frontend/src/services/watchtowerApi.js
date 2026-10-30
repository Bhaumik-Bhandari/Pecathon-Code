
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "";

export function getBrowserPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(
        new Error("Geolocation is not supported by this browser.")
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        const messages = {
          1: "Location permission was denied. Allow location access in your browser settings.",
          2: "Your location is currently unavailable.",
          3: "Location request timed out. Please try again.",
        };

        reject(
          new Error(
            messages[error.code] ||
            "Could not retrieve your location."
          )
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
}

export async function fetchForecast(latitude, longitude) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
  });

  const response = await fetch(
    `${API_BASE_URL}/api/watchtower/forecast?${params}`
  );

  if (!response.ok) {
    throw new Error(
      `Forecast request failed (${response.status}).`
    );
  }

  return response.json();
}

export async function getLocalForecast() {
  // 1. Ask the browser for the user's coordinates.
  const { latitude, longitude } =
    await getBrowserPosition();

  // 2. Send those coordinates to Express.
  const forecast = await fetchForecast(
    latitude,
    longitude
  );

  // 3. Return both coordinates and backend response.
  return {
    location: { latitude, longitude },
    forecast,
  };
}

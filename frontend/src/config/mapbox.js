const DEFAULT_MAP_CENTER = {
  latitude: 28.6139,
  longitude: 77.209,
};

export const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';
export const MAPBOX_STYLE_URL = import.meta.env.VITE_MAPBOX_STYLE_URL || 'mapbox://styles/mapbox/streets-v12';

export const MAPBOX_DEFAULT_CENTER = DEFAULT_MAP_CENTER;

export const formatCoordinate = (value, digits = 6) => {
  if (!Number.isFinite(value)) return '--';
  return Number(value).toFixed(digits);
};

export const buildDirectionsUrl = (origin, destination) => {
  if (!destination || !Number.isFinite(destination.latitude) || !Number.isFinite(destination.longitude)) {
    return '';
  }

  const destinationParam = `${destination.latitude},${destination.longitude}`;
  if (!origin || !Number.isFinite(origin.latitude) || !Number.isFinite(origin.longitude)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destinationParam)}`;
  }

  const originParam = `${origin.latitude},${origin.longitude}`;
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originParam)}&destination=${encodeURIComponent(destinationParam)}`;
};

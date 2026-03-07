const MAPBOX_JS_URL = 'https://api.mapbox.com/mapbox-gl-js/v3.6.0/mapbox-gl.js';
const MAPBOX_CSS_URL = 'https://api.mapbox.com/mapbox-gl-js/v3.6.0/mapbox-gl.css';
const MAPBOX_JS_ID = 'bookmysalon-mapbox-js';
const MAPBOX_CSS_ID = 'bookmysalon-mapbox-css';

let mapboxLoadPromise;

const appendCss = () => {
  if (document.getElementById(MAPBOX_CSS_ID)) return;

  const link = document.createElement('link');
  link.id = MAPBOX_CSS_ID;
  link.rel = 'stylesheet';
  link.href = MAPBOX_CSS_URL;
  document.head.appendChild(link);
};

export const loadMapboxGl = () => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Mapbox can only be loaded in a browser environment.'));
  }

  if (window.mapboxgl) {
    return Promise.resolve(window.mapboxgl);
  }

  if (mapboxLoadPromise) {
    return mapboxLoadPromise;
  }

  mapboxLoadPromise = new Promise((resolve, reject) => {
    appendCss();

    const existingScript = document.getElementById(MAPBOX_JS_ID);
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.mapboxgl));
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Mapbox script.')));
      return;
    }

    const script = document.createElement('script');
    script.id = MAPBOX_JS_ID;
    script.async = true;
    script.src = MAPBOX_JS_URL;

    script.onload = () => {
      if (!window.mapboxgl) {
        reject(new Error('Mapbox script loaded but mapboxgl is unavailable.'));
        return;
      }
      resolve(window.mapboxgl);
    };

    script.onerror = () => {
      reject(new Error('Failed to load Mapbox script.'));
    };

    document.body.appendChild(script);
  });

  return mapboxLoadPromise;
};

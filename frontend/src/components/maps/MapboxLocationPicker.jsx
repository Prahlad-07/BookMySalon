import React, { useEffect, useRef, useState } from 'react';
import { MAPBOX_DEFAULT_CENTER, MAPBOX_STYLE_URL, formatCoordinate } from '../../config/mapbox';
import { loadMapboxGl } from '../../utils/loadMapboxGl';

const getInitialCoordinates = (value) => {
  if (value && Number.isFinite(value.latitude) && Number.isFinite(value.longitude)) {
    return value;
  }
  return MAPBOX_DEFAULT_CENTER;
};

export default function MapboxLocationPicker({
  accessToken,
  value,
  onChange,
  zoom = 13,
  className = '',
  readOnly = false,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onChangeRef = useRef(onChange);

  const [mapError, setMapError] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);

  const initialCoordinates = getInitialCoordinates(value);

  const setMarkerPosition = (latitude, longitude, flyToPosition = true) => {
    if (!markerRef.current) return;

    markerRef.current.setLngLat([longitude, latitude]);

    if (flyToPosition && mapRef.current) {
      mapRef.current.flyTo({
        center: [longitude, latitude],
        essential: true,
        zoom: Math.max(mapRef.current.getZoom(), zoom),
      });
    }

    if (onChangeRef.current) {
      onChangeRef.current({ latitude, longitude });
    }
  };

  const centerOnMarker = () => {
    if (!mapRef.current || !markerRef.current) return;
    const lngLat = markerRef.current.getLngLat();
    mapRef.current.flyTo({
      center: [lngLat.lng, lngLat.lat],
      essential: true,
      zoom: Math.max(mapRef.current.getZoom(), zoom),
    });
  };

  const resetToDefaultLocation = () => {
    if (readOnly) return;
    setMarkerPosition(MAPBOX_DEFAULT_CENTER.latitude, MAPBOX_DEFAULT_CENTER.longitude);
  };

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!accessToken) {
      setMapError('Mapbox token is missing. Set VITE_MAPBOX_ACCESS_TOKEN to enable maps.');
      setIsInitializing(false);
      return undefined;
    }

    let isCancelled = false;

    const initMap = async () => {
      try {
        setIsInitializing(true);
        const mapboxgl = await loadMapboxGl();
        if (isCancelled || !containerRef.current) return;

        mapboxgl.accessToken = accessToken;

        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: MAPBOX_STYLE_URL,
          center: [initialCoordinates.longitude, initialCoordinates.latitude],
          zoom,
        });

        map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');

        const markerElement = document.createElement('div');
        markerElement.className = 'custom-map-marker custom-map-marker--active';

        const marker = new mapboxgl.Marker({
          element: markerElement,
          draggable: !readOnly,
        })
          .setLngLat([initialCoordinates.longitude, initialCoordinates.latitude])
          .addTo(map);

        if (!readOnly) {
          map.on('click', (event) => {
            setMarkerPosition(event.lngLat.lat, event.lngLat.lng, false);
          });

          marker.on('dragend', () => {
            const lngLat = marker.getLngLat();
            setMarkerPosition(lngLat.lat, lngLat.lng, false);
          });
        }

        map.on('load', () => {
          setIsInitializing(false);
        });

        map.on('error', () => {
          setMapError('Map failed to load completely. Please refresh and try again.');
          setIsInitializing(false);
        });

        mapRef.current = map;
        markerRef.current = marker;
        setMapError('');
      } catch (error) {
        if (!isCancelled) {
          setMapError(error?.message || 'Unable to load Mapbox map');
          setIsInitializing(false);
        }
      }
    };

    initMap();

    return () => {
      isCancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markerRef.current = null;
    };
  }, [accessToken, readOnly, zoom]);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    if (!value || !Number.isFinite(value.latitude) || !Number.isFinite(value.longitude)) return;

    const nextPosition = [value.longitude, value.latitude];
    markerRef.current.setLngLat(nextPosition);
  }, [value?.latitude, value?.longitude]);

  if (!accessToken) {
    return (
      <div className={`rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-800 ${className}`}>
        Mapbox token is missing. Add <code>VITE_MAPBOX_ACCESS_TOKEN</code> to use location picker.
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="map-shell relative">
        <div ref={containerRef} className="h-80 w-full" />
        {isInitializing && (
          <div className="absolute inset-0 bg-slate-200/55 backdrop-blur-[1px] flex items-center justify-center">
            <div className="card-base rounded-xl px-4 py-3 text-sm text-slate-700">Loading map...</div>
          </div>
        )}
      </div>

      <div className="mt-2 text-sm text-slate-600 flex flex-wrap items-center gap-3">
        <span>Lat: {formatCoordinate(value?.latitude)}</span>
        <span>Lng: {formatCoordinate(value?.longitude)}</span>
      </div>

      <div className="map-control-row">
        <button type="button" onClick={centerOnMarker} className="btn-outline px-3 py-1.5 text-xs">
          Center on Pin
        </button>
        {!readOnly && (
          <button type="button" onClick={resetToDefaultLocation} className="btn-outline px-3 py-1.5 text-xs">
            Reset to Default
          </button>
        )}
      </div>

      {mapError && <div className="notice-box notice-error mt-2 text-sm">{mapError}</div>}
    </div>
  );
}

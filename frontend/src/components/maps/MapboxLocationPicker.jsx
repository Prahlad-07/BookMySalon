import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MAPBOX_DEFAULT_CENTER, MAPBOX_STYLE_URL, formatCoordinate } from '../../config/mapbox';
import { loadMapboxGl } from '../../utils/loadMapboxGl';
import { useT } from '../../i18n';

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
  const t = useT();
  const tRef = useRef(t);
  tRef.current = t;

  const valueLatitude = value?.latitude;
  const valueLongitude = value?.longitude;
  const initialCoordinates = useMemo(
    () =>
      Number.isFinite(valueLatitude) && Number.isFinite(valueLongitude)
        ? { latitude: valueLatitude, longitude: valueLongitude }
        : MAPBOX_DEFAULT_CENTER,
    [valueLatitude, valueLongitude]
  );

  const setMarkerPosition = useCallback((latitude, longitude, flyToPosition = true) => {
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
  }, [zoom]);

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
          setMapError(tRef.current('map.failed'));
          setIsInitializing(false);
        });

        mapRef.current = map;
        markerRef.current = marker;
        setMapError('');
      } catch (error) {
        if (!isCancelled) {
          setMapError(tRef.current('map.failed'));
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
  }, [
    accessToken,
    initialCoordinates.latitude,
    initialCoordinates.longitude,
    readOnly,
    setMarkerPosition,
    zoom,
  ]);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    if (!Number.isFinite(valueLatitude) || !Number.isFinite(valueLongitude)) return;

    const nextPosition = [valueLongitude, valueLatitude];
    markerRef.current.setLngLat(nextPosition);
  }, [valueLatitude, valueLongitude]);

  if (!accessToken) {
    return (
      <div className={`notice-box notice-warning ${className}`}>
        Mapbox token is missing. Add <code>VITE_MAPBOX_ACCESS_TOKEN</code> to use location picker.
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="map-shell relative">
        <div ref={containerRef} className="h-80 w-full" />
        {isInitializing && (
          <div className="map-loading-overlay">
            <div className="flex items-center gap-2 rounded-md border border-line bg-surface px-4 py-2.5 text-sm text-ink-2">{t('map.loading')}…</div>
          </div>
        )}
      </div>

      <div className="num mt-2 flex flex-wrap items-center gap-3 text-[13px] text-ink-3">
        <span>
          {t('owner.form.lat')}: {formatCoordinate(value?.latitude)}
        </span>
        <span>
          {t('owner.form.lng')}: {formatCoordinate(value?.longitude)}
        </span>
      </div>

      <div className="map-control-row">
        <button type="button" onClick={centerOnMarker} className="btn-secondary btn-sm">
          {t('map.center')}
        </button>
        {!readOnly && (
          <button type="button" onClick={resetToDefaultLocation} className="btn-secondary btn-sm">
            {t('map.reset')}
          </button>
        )}
      </div>

      {mapError && <div className="notice-box notice-error mt-2 text-sm">{mapError}</div>}
    </div>
  );
}

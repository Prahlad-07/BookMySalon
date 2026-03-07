import React, { useEffect, useRef, useState } from 'react';
import { buildDirectionsUrl, MAPBOX_STYLE_URL } from '../../config/mapbox';
import { loadMapboxGl } from '../../utils/loadMapboxGl';

const SOURCE_ID = 'nearby-salons';
const CLUSTER_LAYER_ID = 'nearby-salons-clusters';
const CLUSTER_COUNT_LAYER_ID = 'nearby-salons-cluster-count';
const POINT_OUTER_LAYER_ID = 'nearby-salons-point-outer';
const POINT_INNER_LAYER_ID = 'nearby-salons-point-inner';
const ACTIVE_POINT_LAYER_ID = 'nearby-salons-point-active';

const DEFAULT_CENTER = [77.209, 28.6139];

const isValidCoordinate = (latitude, longitude) => Number.isFinite(latitude) && Number.isFinite(longitude);

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const toDistanceLabel = (distanceKm) => {
  const distance = Number(distanceKm);
  return Number.isFinite(distance) ? `${distance.toFixed(2)} km away` : '';
};

const toFeatureCollection = (salons = []) => ({
  type: 'FeatureCollection',
  features: salons
    .filter((salon) => isValidCoordinate(Number(salon.latitude), Number(salon.longitude)))
    .map((salon) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [Number(salon.longitude), Number(salon.latitude)],
      },
      properties: {
        id: String(salon.id),
        name: salon.name || 'Salon',
        address: [salon.address, salon.city].filter(Boolean).join(', '),
        distanceKm: toDistanceLabel(salon.distanceKm),
      },
    })),
});

const buildPopupHtml = (salon, userLocation) => {
  const directionsUrl = buildDirectionsUrl(userLocation, {
    latitude: Number(salon.latitude),
    longitude: Number(salon.longitude),
  });

  const distanceLabel = toDistanceLabel(salon.distanceKm);
  const addressLabel = [salon.address, salon.city].filter(Boolean).join(', ');

  return `
    <div style="font-family: Manrope, sans-serif; min-width: 230px;">
      <h4 style="font-size: 16px; font-weight: 700; margin-bottom: 6px; color: var(--color-text);">${escapeHtml(
        salon.name || 'Salon'
      )}</h4>
      ${
        addressLabel
          ? `<p style="font-size: 13px; margin: 0 0 8px; color: var(--color-muted);">${escapeHtml(addressLabel)}</p>`
          : ''
      }
      ${
        distanceLabel
          ? `<p style="font-size: 13px; margin: 0 0 10px; font-weight: 700; color: var(--color-primary);">${escapeHtml(
              distanceLabel
            )}</p>`
          : ''
      }
      <div style="display: flex; flex-wrap: wrap; gap: 8px;">
        <a
          href="/salon/${encodeURIComponent(String(salon.id))}"
          style="background: var(--color-primary); color: #fff; padding: 6px 10px; border-radius: 8px; text-decoration: none; font-size: 12px; font-weight: 700;"
        >
          View Salon
        </a>
        ${
          directionsUrl
            ? `<a href="${escapeHtml(
                directionsUrl
              )}" target="_blank" rel="noopener noreferrer" style="background: var(--color-surface-muted); color: var(--color-text); padding: 6px 10px; border-radius: 8px; text-decoration: none; font-size: 12px; font-weight: 700;">Directions</a>`
            : ''
        }
      </div>
    </div>
  `;
};

export default function NearbySalonsMap({
  accessToken,
  salons,
  userLocation,
  onSalonSelect,
  activeSalonId = null,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const mapboxRef = useRef(null);
  const popupRef = useRef(null);
  const userMarkerRef = useRef(null);
  const fitBoundsTimerRef = useRef(null);
  const salonsRef = useRef([]);
  const onSalonSelectRef = useRef(onSalonSelect);

  const [mapError, setMapError] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);

  salonsRef.current = Array.isArray(salons) ? salons : [];

  useEffect(() => {
    onSalonSelectRef.current = onSalonSelect;
  }, [onSalonSelect]);

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
        mapboxRef.current = mapboxgl;

        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: MAPBOX_STYLE_URL,
          center:
            isValidCoordinate(userLocation?.latitude, userLocation?.longitude)
              ? [Number(userLocation.longitude), Number(userLocation.latitude)]
              : DEFAULT_CENTER,
          zoom: isValidCoordinate(userLocation?.latitude, userLocation?.longitude) ? 11.2 : 4.2,
          attributionControl: true,
        });

        map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');
        map.addControl(
          new mapboxgl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true,
            showUserHeading: true,
          }),
          'top-right'
        );

        map.on('load', () => {
          map.addSource(SOURCE_ID, {
            type: 'geojson',
            data: toFeatureCollection(salonsRef.current),
            cluster: true,
            clusterMaxZoom: 13,
            clusterRadius: 46,
          });

          map.addLayer({
            id: CLUSTER_LAYER_ID,
            type: 'circle',
            source: SOURCE_ID,
            filter: ['has', 'point_count'],
            paint: {
              'circle-color': '#0f6e86',
              'circle-radius': ['step', ['get', 'point_count'], 18, 10, 22, 30, 27],
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff',
              'circle-opacity': 0.9,
            },
          });

          map.addLayer({
            id: CLUSTER_COUNT_LAYER_ID,
            type: 'symbol',
            source: SOURCE_ID,
            filter: ['has', 'point_count'],
            layout: {
              'text-field': ['get', 'point_count_abbreviated'],
              'text-font': ['Open Sans Bold'],
              'text-size': 12,
            },
            paint: {
              'text-color': '#ffffff',
            },
          });

          map.addLayer({
            id: POINT_OUTER_LAYER_ID,
            type: 'circle',
            source: SOURCE_ID,
            filter: ['!', ['has', 'point_count']],
            paint: {
              'circle-color': '#0f6e86',
              'circle-radius': 10,
              'circle-opacity': 0.18,
            },
          });

          map.addLayer({
            id: POINT_INNER_LAYER_ID,
            type: 'circle',
            source: SOURCE_ID,
            filter: ['!', ['has', 'point_count']],
            paint: {
              'circle-color': '#e07a2f',
              'circle-radius': 6,
              'circle-stroke-color': '#ffffff',
              'circle-stroke-width': 2,
            },
          });

          map.addLayer({
            id: ACTIVE_POINT_LAYER_ID,
            type: 'circle',
            source: SOURCE_ID,
            filter: ['==', ['get', 'id'], '__none__'],
            paint: {
              'circle-color': '#0f6e86',
              'circle-radius': 12,
              'circle-stroke-color': '#ffffff',
              'circle-stroke-width': 3,
              'circle-opacity': 0.75,
            },
          });

          map.on('click', CLUSTER_LAYER_ID, (event) => {
            const features = map.queryRenderedFeatures(event.point, { layers: [CLUSTER_LAYER_ID] });
            const clusterId = features?.[0]?.properties?.cluster_id;
            if (!clusterId) return;

            const source = map.getSource(SOURCE_ID);
            source.getClusterExpansionZoom(clusterId, (error, zoom) => {
              if (error) return;
              const [longitude, latitude] = features[0].geometry.coordinates;
              map.easeTo({ center: [longitude, latitude], zoom });
            });
          });

          const handlePointClick = (event) => {
            const feature = event.features?.[0];
            const id = Number(feature?.properties?.id);
            const salon = salonsRef.current.find((item) => Number(item.id) === id);
            if (!salon || !isValidCoordinate(Number(salon.latitude), Number(salon.longitude))) return;

            if (typeof onSalonSelectRef.current === 'function') {
              onSalonSelectRef.current(salon);
            }

            if (popupRef.current) {
              popupRef.current.remove();
            }

            popupRef.current = new mapboxgl.Popup({ offset: 12 })
              .setLngLat([Number(salon.longitude), Number(salon.latitude)])
              .setHTML(buildPopupHtml(salon, userLocation))
              .addTo(map);
          };

          map.on('click', POINT_OUTER_LAYER_ID, handlePointClick);
          map.on('click', POINT_INNER_LAYER_ID, handlePointClick);

          [CLUSTER_LAYER_ID, POINT_OUTER_LAYER_ID, POINT_INNER_LAYER_ID].forEach((layerId) => {
            map.on('mouseenter', layerId, () => {
              map.getCanvas().style.cursor = 'pointer';
            });
            map.on('mouseleave', layerId, () => {
              map.getCanvas().style.cursor = '';
            });
          });

          setIsInitializing(false);
        });

        map.on('error', () => {
          setMapError('Map failed to load completely. Please refresh this page.');
          setIsInitializing(false);
        });

        mapRef.current = map;
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
      if (fitBoundsTimerRef.current) {
        clearTimeout(fitBoundsTimerRef.current);
        fitBoundsTimerRef.current = null;
      }
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [accessToken]);

  useEffect(() => {
    if (!mapRef.current) return;

    const source = mapRef.current.getSource(SOURCE_ID);
    if (source) {
      source.setData(toFeatureCollection(salonsRef.current));
    }
  }, [salons]);

  useEffect(() => {
    if (!mapRef.current || !mapboxRef.current) return;
    const map = mapRef.current;

    if (map.getLayer(ACTIVE_POINT_LAYER_ID)) {
      map.setFilter(ACTIVE_POINT_LAYER_ID, [
        '==',
        ['get', 'id'],
        activeSalonId != null ? String(activeSalonId) : '__none__',
      ]);
    }

    if (!activeSalonId) return;
    const selectedSalon = salonsRef.current.find((item) => Number(item.id) === Number(activeSalonId));
    if (!selectedSalon || !isValidCoordinate(Number(selectedSalon.latitude), Number(selectedSalon.longitude))) return;

    map.easeTo({
      center: [Number(selectedSalon.longitude), Number(selectedSalon.latitude)],
      zoom: Math.max(map.getZoom(), 12.4),
      duration: 550,
    });
  }, [activeSalonId]);

  useEffect(() => {
    if (!mapRef.current || !mapboxRef.current) return;
    if (!isValidCoordinate(userLocation?.latitude, userLocation?.longitude)) return;

    const map = mapRef.current;
    const mapboxgl = mapboxRef.current;
    const position = [Number(userLocation.longitude), Number(userLocation.latitude)];

    if (!userMarkerRef.current) {
      const markerElement = document.createElement('div');
      markerElement.className = 'user-location-marker';
      userMarkerRef.current = new mapboxgl.Marker({ element: markerElement }).setLngLat(position).addTo(map);
    } else {
      userMarkerRef.current.setLngLat(position);
    }

    const points = [position];
    salonsRef.current.forEach((salon) => {
      if (isValidCoordinate(Number(salon.latitude), Number(salon.longitude))) {
        points.push([Number(salon.longitude), Number(salon.latitude)]);
      }
    });

    if (fitBoundsTimerRef.current) {
      clearTimeout(fitBoundsTimerRef.current);
    }

    fitBoundsTimerRef.current = setTimeout(() => {
      if (points.length === 1) {
        map.easeTo({ center: position, zoom: 12 });
        return;
      }

      const bounds = new mapboxgl.LngLatBounds(points[0], points[0]);
      for (let index = 1; index < points.length; index += 1) {
        bounds.extend(points[index]);
      }

      map.fitBounds(bounds, {
        padding: 74,
        maxZoom: 13,
        duration: 680,
      });
    }, 140);

    return () => {
      if (fitBoundsTimerRef.current) {
        clearTimeout(fitBoundsTimerRef.current);
        fitBoundsTimerRef.current = null;
      }
    };
  }, [salons, userLocation?.latitude, userLocation?.longitude]);

  if (!accessToken) {
    return (
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-800">
        Mapbox token is missing. Add <code>VITE_MAPBOX_ACCESS_TOKEN</code> to use map features.
      </div>
    );
  }

  return (
    <div className="map-shell relative">
      <div ref={containerRef} className="h-[430px] w-full" />

      {isInitializing && (
        <div className="absolute inset-0 bg-slate-200/55 backdrop-blur-[1px] flex items-center justify-center">
          <div className="card-base rounded-xl px-4 py-3 text-sm text-slate-700">Loading nearby map...</div>
        </div>
      )}

      {mapError && (
        <div className="absolute left-3 right-3 bottom-3 notice-box notice-error text-xs sm:text-sm">{mapError}</div>
      )}
    </div>
  );
}

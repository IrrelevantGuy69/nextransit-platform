'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L, { type Map as LeafletMap, type LeafletMouseEvent } from 'leaflet';
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import { BusSnapshot, Route as RouteEntity, Stop, StopETA } from '@/lib/api';
import { LatLngTuple, StudioStop, isValidLatLng } from './types';

export { isValidLatLng };

export const ROUTE_PALETTE = ['#162A22', '#1D4ED8', '#7C3AED', '#0F766E', '#C2410C'];
export const ROUTE_RING_PALETTE = ['#86EFAC', '#93C5FD', '#C4B5FD', '#99F6E4', '#FDBA74'];

const TENANT_CENTERS: Record<string, LatLngTuple> = {
  '11111111-1111-1111-1111-111111111111': [3.1209, 101.6538],
  '22222222-2222-2222-2222-222222222222': [1.2966, 103.7764],
  '33333333-3333-3333-3333-333333333333': [35.7126, 139.762],
  '44444444-4444-4444-4444-444444444444': [28.545, 77.1926],
  '55555555-5555-5555-5555-555555555555': [13.0184, 77.5683],
  '66666666-6666-6666-6666-666666666666': [3.05, 101.69],
  '77777777-7777-7777-7777-777777777777': [29.7, 77.0],
};

const BUS_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>';

const CHECK_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';

export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface ArcLengthTable {
  coords: LatLngTuple[];
  cumDist: number[];
  totalDist: number;
}

export function buildArcLengthTable(coords: LatLngTuple[]): ArcLengthTable {
  if (!coords || coords.length === 0) {
    return { coords: [], cumDist: [], totalDist: 0 };
  }
  const cumDist: number[] = [0];
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    const d = haversineDistanceMeters(
      coords[i - 1][0],
      coords[i - 1][1],
      coords[i][0],
      coords[i][1],
    );
    total += d;
    cumDist.push(total);
  }
  return { coords, cumDist, totalDist: total };
}

export function sampleArcLength(
  table: ArcLengthTable,
  progress: number,
): { lat: number; lng: number; heading: number } {
  const { coords, cumDist, totalDist } = table;
  if (!coords || coords.length === 0) {
    return { lat: 0, lng: 0, heading: 0 };
  }
  if (coords.length === 1 || totalDist <= 0) {
    return { lat: coords[0][0], lng: coords[0][1], heading: 0 };
  }

  let p = progress % 1.0;
  if (p < 0) p += 1.0;
  const targetDist = p * totalDist;

  let idx = 0;
  for (let i = 1; i < cumDist.length; i++) {
    if (cumDist[i] >= targetDist) {
      idx = i - 1;
      break;
    }
  }
  if (idx >= coords.length - 1) {
    idx = coords.length - 2;
  }

  const p1 = coords[idx];
  const p2 = coords[idx + 1];
  const segDist = cumDist[idx + 1] - cumDist[idx];
  let t = 0;
  if (segDist > 0.0001) {
    t = (targetDist - cumDist[idx]) / segDist;
  }
  t = Math.max(0, Math.min(1, t));

  const lat = p1[0] + (p2[0] - p1[0]) * t;
  const lng = p1[1] + (p2[1] - p1[1]) * t;

  let aheadP = (p + 0.004) % 1.0;
  if (aheadP < 0) aheadP += 1.0;
  const aheadTarget = aheadP * totalDist;
  let aheadIdx = 0;
  for (let i = 1; i < cumDist.length; i++) {
    if (cumDist[i] >= aheadTarget) {
      aheadIdx = i - 1;
      break;
    }
  }
  if (aheadIdx >= coords.length - 1) {
    aheadIdx = coords.length - 2;
  }
  const ap1 = coords[aheadIdx];
  const ap2 = coords[aheadIdx + 1];
  const aSegDist = cumDist[aheadIdx + 1] - cumDist[aheadIdx];
  let at = 0;
  if (aSegDist > 0.0001) {
    at = (aheadTarget - cumDist[aheadIdx]) / aSegDist;
  }
  at = Math.max(0, Math.min(1, at));
  const aheadLat = ap1[0] + (ap2[0] - ap1[0]) * at;
  const aheadLng = ap1[1] + (ap2[1] - ap1[1]) * at;

  const dLng = aheadLng - lng;
  const dLat = aheadLat - lat;
  let heading = (Math.atan2(dLng, dLat) * 180) / Math.PI;
  if (heading < 0) heading += 360;

  return { lat, lng, heading };
}

function generateClosedSpline(points: LatLngTuple[], numSegments: number = 24): LatLngTuple[] {
  const valid = points.filter((p) => Array.isArray(p) && p.length >= 2 && isValidLatLng(p[0], p[1]));
  if (valid.length < 2) return valid;
  const n = valid.length;
  const result: LatLngTuple[] = [];

  for (let i = 0; i < n; i++) {
    const p0 = valid[(i - 1 + n) % n];
    const p1 = valid[i];
    const p2 = valid[(i + 1) % n];
    const p3 = valid[(i + 2) % n];

    for (let j = 0; j < numSegments; j++) {
      const t = j / numSegments;
      const t2 = t * t;
      const t3 = t2 * t;

      const lat =
        0.5 *
        (2 * p1[0] +
          (-p0[0] + p2[0]) * t +
          (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
          (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);
      const lng =
        0.5 *
        (2 * p1[1] +
          (-p0[1] + p2[1]) * t +
          (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
          (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);

      if (isValidLatLng(lat, lng)) {
        result.push([lat, lng]);
      }
    }
  }

  if (result.length > 0) {
    result.push([result[0][0], result[0][1]]);
  }
  return result;
}

export interface RouteGeometryItem {
  route: RouteEntity;
  color: string;
  ringColor: string;
  stops: Stop[];
  primaryCoords: LatLngTuple[];
  alternateCoords: LatLngTuple[];
  primaryTable: ArcLengthTable;
  alternateTable: ArcLengthTable;
}

export interface FleetSpatialMapProps {
  tenantId: string;
  stops: Stop[];
  routes: RouteEntity[];
  activeRoute: RouteEntity | null;
  snapshots: BusSnapshot[];
  activeSnapshot: BusSnapshot | null;
  selectedBusId: string | null;
  selectedRouteId?: string;
  stopETAs: StopETA[];
  showRoutes: boolean;
  focusKey: string;
  onSelectBus: (busId: string) => void;
  onReady?: (map: LeafletMap) => void;
  studioMode?: boolean;
  isCreatingRoute?: boolean;
  studioStops?: StudioStop[];
  studioPolyline?: [number, number][];
  onMapClick?: (lat: number, lng: number) => void;
  onRemoveStudioStop?: (index: number) => void;
  followBus?: boolean;
  isSimulating?: boolean;
}

function MapClickHandler({
  studioMode,
  onMapClick,
}: {
  studioMode?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      if (studioMode && onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

export default function FleetSpatialMap({
  tenantId,
  stops,
  routes,
  activeRoute,
  snapshots,
  activeSnapshot,
  selectedBusId,
  selectedRouteId = 'all',
  stopETAs,
  showRoutes,
  focusKey,
  onSelectBus,
  onReady,
  studioMode = false,
  isCreatingRoute = false,
  studioStops = [],
  studioPolyline = [],
  onMapClick,
  onRemoveStudioStop,
  followBus = false,
  isSimulating = true,
}: FleetSpatialMapProps) {
  const isStudioActive = studioMode || isCreatingRoute;
  const mapRef = useRef<LeafletMap | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  const busProgressRef = useRef<Record<string, number>>({});
  const initialPositionsRef = useRef<Record<string, LatLngTuple>>({});
  const markerInstancesRef = useRef<Record<string, L.Marker | null>>({});
  const headingElementsRef = useRef<Record<string, HTMLElement | null>>({});

  const safeStops = stops || [];
  const safeRoutes = routes || [];
  const safeSnapshots = snapshots || [];
  const safeEtas = stopETAs || [];

  const defaultCenter = useMemo<LatLngTuple>(() => {
    if (TENANT_CENTERS[tenantId] && isValidLatLng(TENANT_CENTERS[tenantId][0], TENANT_CENTERS[tenantId][1])) {
      return TENANT_CENTERS[tenantId];
    }
    const firstValidStop = safeStops.find((s) => s && isValidLatLng(s.latitude, s.longitude));
    if (firstValidStop) {
      return [firstValidStop.latitude, firstValidStop.longitude];
    }
    return [3.1209, 101.6538];
  }, [tenantId, safeStops]);

  const routeGeometries = useMemo<RouteGeometryItem[]>(() => {
    return safeRoutes.map((rt, idx) => {
      const color = ROUTE_PALETTE[idx % ROUTE_PALETTE.length];
      const ringColor = ROUTE_RING_PALETTE[idx % ROUTE_RING_PALETTE.length];

      const matchingEtas = safeEtas.filter((e) => e && e.route_id === rt.id);
      let orderedStops: Stop[] = [];
      if (matchingEtas.length > 0) {
        const sortedEtas = [...matchingEtas].sort((a, b) => a.stop_sequence - b.stop_sequence);
        const seen = new Set<string>();
        for (const eta of sortedEtas) {
          if (!seen.has(eta.stop_id)) {
            seen.add(eta.stop_id);
            const found = safeStops.find((s) => s.id === eta.stop_id);
            if (found && isValidLatLng(found.latitude, found.longitude)) {
              orderedStops.push(found);
            }
          }
        }
      }

      if (orderedStops.length === 0) {
        const validStops = safeStops.filter((s) => s && isValidLatLng(s.latitude, s.longitude));
        const perRoute = Math.max(1, Math.floor(validStops.length / Math.max(1, safeRoutes.length)));
        orderedStops = validStops.slice(idx * perRoute, (idx + 1) * perRoute);
      }

      const stopTuples = orderedStops.map((s) => [s.latitude, s.longitude] as LatLngTuple);

      let primaryCoords: LatLngTuple[] = [];
      if (rt.primary_polyline && Array.isArray(rt.primary_polyline) && rt.primary_polyline.length >= 2) {
        primaryCoords = rt.primary_polyline.filter((pt) => isValidLatLng(pt[0], pt[1])) as LatLngTuple[];
      }
      if (primaryCoords.length < 2) {
        primaryCoords = generateClosedSpline(stopTuples, 25);
      }

      let alternateCoords: LatLngTuple[] = [];
      if (rt.alternate_polyline && Array.isArray(rt.alternate_polyline) && rt.alternate_polyline.length >= 2) {
        alternateCoords = rt.alternate_polyline.filter((pt) => isValidLatLng(pt[0], pt[1])) as LatLngTuple[];
      }
      if (alternateCoords.length < 2 && primaryCoords.length >= 2) {
        alternateCoords = primaryCoords.map((pt, i) => {
          const t = i / primaryCoords.length;
          if (t > 0.25 && t < 0.75) {
            const arc = Math.sin(((t - 0.25) / 0.5) * Math.PI);
            return [pt[0] + 0.0035 * arc, pt[1] + 0.0035 * arc] as LatLngTuple;
          }
          return [pt[0], pt[1]] as LatLngTuple;
        });
      }

      const primaryTable = buildArcLengthTable(primaryCoords);
      const alternateTable = buildArcLengthTable(alternateCoords);

      return {
        route: rt,
        color,
        ringColor,
        stops: orderedStops,
        primaryCoords,
        alternateCoords,
        primaryTable,
        alternateTable,
      };
    });
  }, [safeRoutes, safeStops, safeEtas]);

  const arcTables = useMemo(() => {
    const map = new Map<string, ArcLengthTable>();
    for (const rg of routeGeometries) {
      map.set(`${rg.route.id}-pri`, rg.primaryTable);
      map.set(`${rg.route.id}-alt`, rg.alternateTable);
      map.set(rg.route.id, rg.primaryTable);
    }
    return map;
  }, [routeGeometries]);

  useEffect(() => {
    const STAGGERED = [0.05, 0.25, 0.45, 0.65, 0.82];
    safeSnapshots.forEach((bus, idx) => {
      if (!bus || !bus.bus_id) return;
      if (busProgressRef.current[bus.bus_id] === undefined) {
        if (typeof bus.route_progress === 'number' && bus.route_progress >= 0 && bus.route_progress <= 1) {
          busProgressRef.current[bus.bus_id] = bus.route_progress;
        } else {
          busProgressRef.current[bus.bus_id] = STAGGERED[idx % STAGGERED.length];
        }
      }
    });
  }, [safeSnapshots]);

  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dtSeconds = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      if (isSimulating) {
        safeSnapshots.forEach((bus) => {
          if (!bus || !bus.bus_id) return;
          const isAlt = bus.route_variant === 'ALTERNATE_ROUTE_2' || bus.is_detour;
          const table =
            arcTables.get(`${bus.route_id || 'fallback'}-${isAlt ? 'alt' : 'pri'}`) ||
            arcTables.get(`${bus.route_id || 'fallback'}-pri`) ||
            routeGeometries[0]?.primaryTable;

          if (!table || table.totalDist <= 0) return;

          const routeTotalKm = table.totalDist / 1000.0;
          const speedKmh = Math.max(12, bus.speed_kmh || 38.0);
          const currentProg = busProgressRef.current[bus.bus_id] ?? 0.05;
          const nextProg = (currentProg + (speedKmh / 3600.0) * dtSeconds / routeTotalKm) % 1.0;
          busProgressRef.current[bus.bus_id] = nextProg >= 0 ? nextProg : nextProg + 1.0;

          const sampled = sampleArcLength(table, busProgressRef.current[bus.bus_id]);
          const marker = markerInstancesRef.current[bus.bus_id];
          if (marker && isValidLatLng(sampled.lat, sampled.lng)) {
            marker.setLatLng([sampled.lat, sampled.lng]);
          }

          const headingEl = headingElementsRef.current[bus.bus_id];
          if (headingEl) {
            headingEl.style.transform = `rotate(${Math.round(sampled.heading)}deg)`;
          }

          if (followBus && selectedBusId === bus.bus_id && mapRef.current && isValidLatLng(sampled.lat, sampled.lng)) {
            mapRef.current.panTo([sampled.lat, sampled.lng], { animate: false });
          }
        });
      } else {
        safeSnapshots.forEach((bus) => {
          if (!bus || !bus.bus_id) return;
          const isAlt = bus.route_variant === 'ALTERNATE_ROUTE_2' || bus.is_detour;
          const table =
            arcTables.get(`${bus.route_id || 'fallback'}-${isAlt ? 'alt' : 'pri'}`) ||
            arcTables.get(`${bus.route_id || 'fallback'}-pri`) ||
            routeGeometries[0]?.primaryTable;
          if (!table || table.totalDist <= 0) return;
          const sampled = sampleArcLength(table, busProgressRef.current[bus.bus_id] ?? 0.05);
          const marker = markerInstancesRef.current[bus.bus_id];
          if (marker && isValidLatLng(sampled.lat, sampled.lng)) {
            marker.setLatLng([sampled.lat, sampled.lng]);
          }
        });
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isSimulating, followBus, selectedBusId, safeSnapshots, arcTables, routeGeometries]);

  const visibleGeometries = useMemo(() => {
    if (selectedRouteId === 'all') return routeGeometries;
    return routeGeometries.filter((rg) => rg.route.id === selectedRouteId);
  }, [routeGeometries, selectedRouteId]);

  const visibleBuses = useMemo(() => {
    return safeSnapshots.filter((bus) => {
      if (!bus || !bus.bus_id) return false;
      if (selectedBusId) return bus.bus_id === selectedBusId;
      if (selectedRouteId === 'all') return true;
      return bus.route_id === selectedRouteId;
    });
  }, [safeSnapshots, selectedBusId, selectedRouteId]);

  return (
    <div
      ref={mapContainerRef}
      className={`w-full min-h-[560px] h-[560px] relative rounded-[28px] overflow-hidden bg-muted ${
        isStudioActive ? 'cursor-crosshair' : ''
      }`}
    >
      <MapContainer
        center={defaultCenter}
        zoom={14}
        zoomControl={false}
        scrollWheelZoom
        ref={(map: LeafletMap | null) => {
          mapRef.current = map;
          if (map) {
            if (!('resize' in map)) {
              (map as unknown as { resize: () => void }).resize = () => {
                map.invalidateSize();
              };
            }
            if (onReady) onReady(map);
          }
        }}
        style={{ width: '100%', height: '560px', minHeight: '560px' }}
        className="w-full h-[560px] min-h-[560px] relative rounded-[28px] overflow-hidden"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles"
        />

        <MapClickHandler studioMode={isStudioActive} onMapClick={onMapClick} />

        <FocusController
          focusKey={focusKey}
          center={defaultCenter}
          selectedBusId={selectedBusId}
          selectedRouteId={selectedRouteId}
          routeGeometries={routeGeometries}
        />

        {showRoutes &&
          visibleGeometries.map((rg) => {
            const hasAlternateBus = safeSnapshots.some(
              (b) =>
                b &&
                b.route_id === rg.route.id &&
                (b.route_variant === 'ALTERNATE_ROUTE_2' || b.is_detour),
            );

            return (
              <React.Fragment key={`corridor-geom-${rg.route.id}`}>
                <Polyline
                  positions={rg.primaryCoords}
                  pathOptions={{
                    color: '#000000',
                    weight: 6,
                    opacity: 0.35,
                    lineJoin: 'round',
                    lineCap: 'round',
                  }}
                  interactive={false}
                />
                <Polyline
                  positions={rg.primaryCoords}
                  pathOptions={{
                    color: rg.color,
                    weight: 4,
                    opacity: 0.95,
                    lineJoin: 'round',
                    lineCap: 'round',
                  }}
                  interactive={false}
                />

                {hasAlternateBus && rg.alternateCoords.length >= 2 && (
                  <Polyline
                    positions={rg.alternateCoords}
                    pathOptions={{
                      color: '#D97706',
                      weight: 3.5,
                      dashArray: '8, 8',
                      opacity: 0.95,
                      lineJoin: 'round',
                      lineCap: 'round',
                    }}
                    interactive={false}
                  />
                )}
              </React.Fragment>
            );
          })}

        {isStudioActive && studioPolyline.length >= 2 && (
          <Polyline
            positions={studioPolyline}
            pathOptions={{
              color: '#4F46E5',
              weight: 4.5,
              opacity: 0.95,
              lineJoin: 'round',
              lineCap: 'round',
            }}
            interactive={false}
          />
        )}

        {isStudioActive &&
          studioStops.map((st, idx) => {
            if (!st || !isValidLatLng(st.latitude, st.longitude)) return null;
            const isOrigin = idx === 0;
            const isDest = idx === studioStops.length - 1 && studioStops.length > 1;
            const pinColor = isOrigin ? '#059669' : isDest ? '#D97706' : '#4F46E5';
            const pinLabel = isOrigin ? '#1 (Origin)' : isDest ? `#${idx + 1} (Destination)` : `#${idx + 1}`;

            const icon = L.divIcon({
              className: '',
              html: `<div style="background-color:${pinColor}; color:#ffffff; font-family:var(--font-sans, sans-serif); font-weight:700; font-size:11px; padding:3px 8px; border-radius:9999px; box-shadow:0 4px 10px rgba(0,0,0,0.18); border:2px solid #ffffff; white-space:nowrap; display:flex; align-items:center; gap:3px;">${pinLabel}</div>`,
              iconSize: [60, 24],
              iconAnchor: [30, 12],
            });

            return (
              <Marker
                key={`studio-stop-${st.id}-${idx}`}
                position={[st.latitude, st.longitude]}
                icon={icon}
                eventHandlers={{
                  click: () => onRemoveStudioStop && onRemoveStudioStop(idx),
                }}
                title={`${st.name} (Click to remove waypoint)`}
              >
                <Tooltip direction="top" offset={[0, -12]}>
                  <div className="text-center font-sans">
                    <p className="font-semibold text-xs text-neutral-900">{st.name}</p>
                    <p className="text-[10px] text-neutral-500 font-medium">Click pin to remove from corridor</p>
                  </div>
                </Tooltip>
              </Marker>
            );
          })}

        {showRoutes &&
          visibleGeometries.map((rg) => {
            return rg.stops.map((stop, sIdx) => {
              if (!stop || !isValidLatLng(stop.latitude, stop.longitude)) return null;
              const isStopActive = activeSnapshot?.current_stop_sequence === sIdx + 1;
              const eta = safeEtas.find((e) => e && e.stop_id === stop.id);

              return (
                <CircleMarker
                  key={`stop-${rg.route.id}-${stop.id}`}
                  center={[stop.latitude, stop.longitude]}
                  radius={isStopActive ? 8 : 6}
                  pathOptions={{
                    fillColor: isStopActive ? rg.color : '#FFFFFF',
                    color: rg.color,
                    weight: 2.5,
                    fillOpacity: 1,
                  }}
                  eventHandlers={{
                    click: () => {
                      if (mapRef.current) {
                        mapRef.current.setView([stop.latitude, stop.longitude], 16, { animate: false });
                      }
                    },
                  }}
                >
                  <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                    <div className="p-2.5 font-sans bg-white/95 backdrop-blur-md rounded-xl border border-black/10 shadow-lg text-left min-w-[150px]">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="size-2 rounded-full" style={{ backgroundColor: rg.color }} />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-black/50">
                          Stop #{sIdx + 1}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-[#162A22] leading-tight">
                        {stop.name}
                      </p>
                      <p className="text-[10px] text-black/50 font-medium mt-0.5">
                        {stop.code} · {rg.route.code}
                      </p>
                      {eta && (
                        <div className="mt-1.5 pt-1.5 border-t border-black/5 flex items-center justify-between">
                          <span className="text-[10px] text-black/50">Arrival:</span>
                          <span className="text-[11px] font-bold text-[#162A22]">
                            {eta.eta_minutes <= 0.5 ? 'Arriving now' : `~${Math.round(eta.eta_minutes)} min`}
                          </span>
                        </div>
                      )}
                    </div>
                  </Tooltip>
                </CircleMarker>
              );
            });
          })}

        {visibleBuses.map((bus) => {
          const matchedRg =
            routeGeometries.find((r) => r.route.id === bus.route_id) || routeGeometries[0];
          const color = matchedRg ? matchedRg.color : ROUTE_PALETTE[0];
          const isSelected = bus.bus_id === selectedBusId;
          const isCompleted =
            bus.bus_status === 'COMPLETED' || bus.trip_status === 'JOURNEY_ENDED';
          const isDelayed =
            (bus.delay_minutes !== undefined && bus.delay_minutes > 0.1) ||
            bus.route_variant === 'ALTERNATE_ROUTE_2' ||
            bus.is_detour;

          if (!initialPositionsRef.current[bus.bus_id]) {
            const table = matchedRg?.primaryTable;
            const initialProg = busProgressRef.current[bus.bus_id] ?? 0.05;
            if (table && table.totalDist > 0) {
              const pt = sampleArcLength(table, initialProg);
              if (isValidLatLng(pt.lat, pt.lng)) {
                initialPositionsRef.current[bus.bus_id] = [pt.lat, pt.lng];
              }
            }
            if (!initialPositionsRef.current[bus.bus_id]) {
              initialPositionsRef.current[bus.bus_id] = isValidLatLng(bus.latitude, bus.longitude)
                ? [bus.latitude, bus.longitude]
                : defaultCenter;
            }
          }

          const staticInitialPos = initialPositionsRef.current[bus.bus_id];

          const iconHtml = `
            <div class="bus-marker ${isSelected ? 'bus-marker--selected' : ''} ${
            isDelayed ? 'bus-marker--delayed' : ''
          } ${isCompleted ? 'bus-marker--completed' : ''}" style="${
            !isSelected && !isCompleted && !isDelayed ? `background-color: ${color};` : ''
          }">
              <span class="bus-marker__heading" style="transform: rotate(${Math.round(bus.heading_deg ?? 0)}deg);"></span>
              ${isCompleted ? CHECK_SVG : BUS_SVG}
              <span class="bus-marker__label">${bus.fleet_code}</span>
            </div>
          `;

          const icon = L.divIcon({
            className: '',
            html: iconHtml,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
          });

          return (
            <Marker
              key={`bus-marker-${bus.bus_id}`}
              position={staticInitialPos}
              icon={icon}
              zIndexOffset={isSelected ? 1000 : 200}
              ref={(m) => {
                markerInstancesRef.current[bus.bus_id] = m;
                if (m) {
                  const el = m.getElement();
                  if (el) {
                    headingElementsRef.current[bus.bus_id] = el.querySelector(
                      '.bus-marker__heading',
                    ) as HTMLElement | null;
                  }
                }
              }}
              eventHandlers={{
                click: () => onSelectBus(bus.bus_id),
              }}
            />
          );
        })}
      </MapContainer>

      {!selectedBusId && routeGeometries.length > 0 && !studioMode && (
        <div className="absolute bottom-4 right-4 z-[500] pointer-events-auto bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-black/10 shadow-lg font-sans flex flex-col gap-1.5">
          <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400">
            Active Corridors ({routeGeometries.length})
          </span>
          <div className="flex flex-col gap-1">
            {routeGeometries.map((rg) => (
              <div
                key={`legend-${rg.route.id}`}
                className="flex items-center gap-2 text-xs font-medium text-neutral-800"
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: rg.color }}
                />
                <span className="truncate max-w-[150px]">{rg.route.code} · {rg.route.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface FocusControllerProps {
  focusKey: string;
  center: LatLngTuple;
  selectedBusId: string | null;
  selectedRouteId: string;
  routeGeometries: RouteGeometryItem[];
}

function FocusController({
  focusKey,
  center,
  selectedBusId,
  selectedRouteId,
  routeGeometries,
}: FocusControllerProps) {
  const map = useMap();

  useEffect(() => {
    let allPoints: LatLngTuple[] = [];

    if (selectedRouteId !== 'all') {
      const match = routeGeometries.find((r) => r.route.id === selectedRouteId);
      if (match && match.primaryCoords.length > 0) {
        allPoints = match.primaryCoords;
      }
    }

    if (allPoints.length === 0 && routeGeometries.length > 0) {
      routeGeometries.forEach((rg) => allPoints.push(...rg.primaryCoords));
    }

    if (allPoints.length === 0 && isValidLatLng(center[0], center[1])) {
      allPoints = [center];
    }

    const rafId = window.requestAnimationFrame(() => {
      try {
        map.invalidateSize({ animate: false });
        const size = map.getSize();
        if (!size || !Number.isFinite(size.x) || !Number.isFinite(size.y) || size.x < 32 || size.y < 32) {
          return;
        }

        const cleanPoints = allPoints.filter(
          (p): p is [number, number] =>
            Array.isArray(p) &&
            p.length >= 2 &&
            typeof p[0] === 'number' &&
            typeof p[1] === 'number' &&
            Number.isFinite(p[0]) &&
            Number.isFinite(p[1]) &&
            Math.abs(p[0]) < 85 &&
            Math.abs(p[1]) <= 180 &&
            !(p[0] === 0 && p[1] === 0),
        );

        if (cleanPoints.length === 0) {
          return;
        }

        if (cleanPoints.length === 1) {
          map.setView([cleanPoints[0][0], cleanPoints[0][1]], 15, { animate: false });
          return;
        }

        let minLat = cleanPoints[0][0];
        let maxLat = cleanPoints[0][0];
        let minLng = cleanPoints[0][1];
        let maxLng = cleanPoints[0][1];

        for (const pt of cleanPoints) {
          if (pt[0] < minLat) minLat = pt[0];
          if (pt[0] > maxLat) maxLat = pt[0];
          if (pt[1] < minLng) minLng = pt[1];
          if (pt[1] > maxLng) maxLng = pt[1];
        }

        const latSpan = Math.abs(maxLat - minLat);
        const lngSpan = Math.abs(maxLng - minLng);

        if (latSpan < 0.0003 && lngSpan < 0.0003) {
          map.setView([(minLat + maxLat) / 2, (minLng + maxLng) / 2], 15, { animate: false });
          return;
        }

        const bounds = L.latLngBounds(
          L.latLng(minLat, minLng),
          L.latLng(maxLat, maxLng),
        );

        if (bounds.isValid()) {
          map.fitBounds(bounds, {
            padding: [40, 40],
            maxZoom: 15,
            animate: false,
          });
        }
      } catch {
        return;
      }
    });
    return () => window.cancelAnimationFrame(rafId);
  }, [focusKey, map, center, selectedRouteId, routeGeometries]);

  return null;
}

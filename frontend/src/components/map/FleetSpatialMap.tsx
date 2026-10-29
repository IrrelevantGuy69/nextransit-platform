'use client';

import React, { useEffect, useMemo } from 'react';
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
import { LatLngTuple, StudioStop } from './types';

const BUS_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>';

const CHECK_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';

export const ROUTE_PALETTE = ['#162A22', '#D97706', '#0D9488', '#4F46E5'];
export const ROUTE_RING_PALETTE = ['#86EFAC', '#FDE68A', '#99F6E4', '#C7D2FE'];

const TENANT_CENTERS: Record<string, LatLngTuple> = {
  '11111111-1111-1111-1111-111111111111': [3.1209, 101.6538],
  '22222222-2222-2222-2222-222222222222': [1.2966, 103.7764],
  '33333333-3333-3333-3333-333333333333': [35.7126, 139.762],
  '44444444-4444-4444-4444-444444444444': [28.545, 77.1926],
  '55555555-5555-5555-5555-555555555555': [13.0184, 77.5683],
};

function getSplinePoints(points: LatLngTuple[], numSegments: number = 8): LatLngTuple[] {
  if (points.length < 3) return points;
  const result: LatLngTuple[] = [];
  const pts: LatLngTuple[] = [points[0], ...points, points[points.length - 1]];
  for (let i = 1; i < pts.length - 2; i++) {
    const p0 = pts[i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2];
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
      result.push([lat, lng]);
    }
  }
  result.push(points[points.length - 1]);
  return result;
}

export interface ClusteredBusNode {
  bus: BusSnapshot;
  realLat: number;
  realLng: number;
  displayLat: number;
  displayLng: number;
  isOffset: boolean;
  labelPositionClass: string;
  clusterIndex: number;
  clusterSize: number;
  routeColor: string;
}

interface MultiRoutePath {
  route: RouteEntity;
  color: string;
  ringColor: string;
  rawPoints: LatLngTuple[];
  splinePoints: LatLngTuple[];
  stops: Stop[];
  isActive: boolean;
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
  onMapClick?: (lat: number, lng: number) => void;
  onRemoveStudioStop?: (index: number) => void;
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
  onMapClick,
  onRemoveStudioStop,
}: FleetSpatialMapProps) {
  const isStudioActive = studioMode || isCreatingRoute;
  const mapRef = React.useRef<LeafletMap | null>(null);
  const mapContainerRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => {
      if (container.clientWidth > 0 && container.clientHeight > 0 && mapRef.current) {
        if ('invalidateSize' in mapRef.current) {
          mapRef.current.invalidateSize();
        }
        const candidate = mapRef.current as unknown as Record<string, unknown>;
        if (typeof candidate.resize === 'function') {
          (candidate.resize as () => void)();
        }
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapRef.current) {
        if ('invalidateSize' in mapRef.current) {
          mapRef.current.invalidateSize();
        }
        const candidate = mapRef.current as unknown as Record<string, unknown>;
        if (typeof candidate.resize === 'function') {
          (candidate.resize as () => void)();
        }
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [isStudioActive]);

  const safeStops = stops || [];
  const safeRoutes = routes || [];
  const safeSnapshots = snapshots || [];
  const safeEtas = stopETAs || [];

  const selectedBusSnapshot = useMemo(() => {
    if (!selectedBusId) return null;
    return safeSnapshots.find((b) => b && b.bus_id === selectedBusId) || null;
  }, [safeSnapshots, selectedBusId]);

  const defaultCenter = useMemo<LatLngTuple>(() => {
    if (TENANT_CENTERS[tenantId]) {
      return TENANT_CENTERS[tenantId];
    }
    if (safeStops.length > 0 && typeof safeStops[0].latitude === 'number' && typeof safeStops[0].longitude === 'number') {
      return [safeStops[0].latitude, safeStops[0].longitude];
    }
    return [3.1209, 101.6538];
  }, [tenantId, safeStops]);

  const multiRoutePaths = useMemo<MultiRoutePath[]>(() => {
    if (safeRoutes.length === 0) {
      const pts = safeStops
        .filter((s) => s && typeof s.latitude === 'number' && typeof s.longitude === 'number')
        .map((s) => [s.latitude, s.longitude] as LatLngTuple);
      return [
        {
          route: {
            id: 'fallback-rt',
            tenant_id: tenantId,
            code: 'R1',
            name: 'Campus Corridor',
            origin: '',
            destination: '',
            distance_km: 0,
            estimated_minutes: 0,
            active: true,
            created_at: '',
          },
          color: ROUTE_PALETTE[0],
          ringColor: ROUTE_RING_PALETTE[0],
          rawPoints: pts,
          splinePoints: getSplinePoints(pts),
          stops: safeStops,
          isActive: true,
        },
      ];
    }

    return safeRoutes.map((rt, idx) => {
      const color = ROUTE_PALETTE[idx % ROUTE_PALETTE.length];
      const ringColor = ROUTE_RING_PALETTE[idx % ROUTE_RING_PALETTE.length];
      const matchingEtas = safeEtas.filter((e) => e && e.route_id === rt.id);

      let orderedStopsForRoute: Stop[] = [];
      if (matchingEtas.length > 0) {
        const sortedEtas = [...matchingEtas].sort((a, b) => a.stop_sequence - b.stop_sequence);
        const seenStopIds = new Set<string>();
        for (const eta of sortedEtas) {
          if (!seenStopIds.has(eta.stop_id)) {
            seenStopIds.add(eta.stop_id);
            const found = safeStops.find((s) => s.id === eta.stop_id);
            if (found) {
              orderedStopsForRoute.push(found);
            } else {
              orderedStopsForRoute.push({
                id: eta.stop_id,
                tenant_id: tenantId,
                name: eta.stop_name || 'Stop',
                code: eta.stop_code || '',
                latitude: eta.stop_latitude,
                longitude: eta.stop_longitude,
                created_at: '',
              });
            }
          }
        }
      }

      if (orderedStopsForRoute.length === 0) {
        const stopsPerRoute = Math.max(1, Math.floor(safeStops.length / safeRoutes.length));
        orderedStopsForRoute = safeStops.slice(idx * stopsPerRoute, (idx + 1) * stopsPerRoute);
      }

      const rawPoints = orderedStopsForRoute
        .filter((s) => s && typeof s.latitude === 'number' && typeof s.longitude === 'number' && !isNaN(s.latitude) && !isNaN(s.longitude))
        .map((s) => [s.latitude, s.longitude] as LatLngTuple);

      const splinePoints = getSplinePoints(rawPoints);

      const isSingleBusMode = !!selectedBusSnapshot;
      const isActive = isSingleBusMode
        ? selectedBusSnapshot?.route_id === rt.id
        : selectedRouteId === 'all' ||
          selectedRouteId === rt.id ||
          (activeRoute && activeRoute.id === rt.id);

      return {
        route: rt,
        color,
        ringColor,
        rawPoints,
        splinePoints,
        stops: orderedStopsForRoute,
        isActive: !!isActive,
      };
    });
  }, [safeRoutes, safeStops, safeEtas, selectedRouteId, activeRoute, tenantId, selectedBusSnapshot]);

  const activePathPoints = useMemo<LatLngTuple[]>(() => {
    if (selectedBusSnapshot && selectedBusSnapshot.route_id) {
      const p = multiRoutePaths.find((m) => m.route.id === selectedBusSnapshot.route_id);
      if (p && p.rawPoints.length > 0) return p.rawPoints;
    }
    if (selectedRouteId !== 'all') {
      const p = multiRoutePaths.find((m) => m.route.id === selectedRouteId);
      if (p && p.rawPoints.length > 0) return p.rawPoints;
    }
    const allPts: LatLngTuple[] = [];
    multiRoutePaths.forEach((m) => {
      allPts.push(...(m.rawPoints || []));
    });
    return allPts.length > 0
      ? allPts
      : safeStops
          .filter((s) => s && typeof s.latitude === 'number' && typeof s.longitude === 'number')
          .map((s) => [s.latitude, s.longitude] as LatLngTuple);
  }, [multiRoutePaths, selectedRouteId, safeStops, selectedBusSnapshot]);

  const clusteredBuses = useMemo<ClusteredBusNode[]>(() => {
    const rawVisible = safeSnapshots.filter((b) => {
      if (!b || typeof b.latitude !== 'number' || typeof b.longitude !== 'number') return false;
      if (isNaN(b.latitude) || isNaN(b.longitude)) return false;
      if (selectedBusId) return b.bus_id === selectedBusId;
      if (!selectedRouteId || selectedRouteId === 'all') return true;
      return b.route_id === selectedRouteId;
    });

    const seenBusIds = new Set<string>();
    const visibleSnapshots: BusSnapshot[] = [];
    for (const b of rawVisible) {
      if (!seenBusIds.has(b.bus_id)) {
        seenBusIds.add(b.bus_id);
        visibleSnapshots.push(b);
      }
    }

    const THRESHOLD = 0.0010;
    const clusters: BusSnapshot[][] = [];
    const assigned = new Set<string>();

    for (let i = 0; i < visibleSnapshots.length; i++) {
      const b1 = visibleSnapshots[i];
      if (assigned.has(b1.bus_id)) continue;

      const cluster: BusSnapshot[] = [b1];
      assigned.add(b1.bus_id);

      for (let j = i + 1; j < visibleSnapshots.length; j++) {
        const b2 = visibleSnapshots[j];
        if (assigned.has(b2.bus_id)) continue;

        const dist = Math.hypot(b1.latitude - b2.latitude, b1.longitude - b2.longitude);
        if (dist < THRESHOLD) {
          cluster.push(b2);
          assigned.add(b2.bus_id);
        }
      }
      clusters.push(cluster);
    }

    const result: ClusteredBusNode[] = [];
    const labelClasses = [
      'bus-marker__label--top',
      'bus-marker__label--bottom-left',
      'bus-marker__label--bottom-right',
      'bus-marker__label--top-left',
      'bus-marker__label--top-right',
    ];

    for (const cluster of clusters) {
      if (cluster.length === 1) {
        const bus = cluster[0];
        const routeIdx = safeRoutes.findIndex((r) => r.id === bus.route_id);
        const color = routeIdx >= 0 ? ROUTE_PALETTE[routeIdx % ROUTE_PALETTE.length] : '#162A22';
        result.push({
          bus,
          realLat: bus.latitude,
          realLng: bus.longitude,
          displayLat: bus.latitude,
          displayLng: bus.longitude,
          isOffset: false,
          labelPositionClass: '',
          clusterIndex: 0,
          clusterSize: 1,
          routeColor: color,
        });
      } else {
        const size = cluster.length;
        const centerLat = cluster.reduce((sum, b) => sum + b.latitude, 0) / size;
        const centerLng = cluster.reduce((sum, b) => sum + b.longitude, 0) / size;
        const radius = 0.0008;

        cluster.forEach((bus, idx) => {
          const angle = (idx * 2 * Math.PI) / size;
          const displayLat = centerLat + Math.cos(angle) * radius;
          const displayLng = centerLng + Math.sin(angle) * radius;
          const routeIdx = safeRoutes.findIndex((r) => r.id === bus.route_id);
          const color = routeIdx >= 0 ? ROUTE_PALETTE[routeIdx % ROUTE_PALETTE.length] : '#162A22';

          result.push({
            bus,
            realLat: bus.latitude,
            realLng: bus.longitude,
            displayLat,
            displayLng,
            isOffset: true,
            labelPositionClass: labelClasses[idx % labelClasses.length],
            clusterIndex: idx,
            clusterSize: size,
            routeColor: color,
          });
        });
      }
    }

    return result;
  }, [safeSnapshots, selectedBusId, selectedRouteId, safeRoutes]);

  const studioSplinePoints = useMemo<LatLngTuple[]>(() => {
    if (!studioStops || studioStops.length < 2) return [];
    const raw = studioStops.map((s) => [s.latitude, s.longitude] as LatLngTuple);
    return getSplinePoints(raw);
  }, [studioStops]);

  return (
    <div
      ref={mapContainerRef}
      className={`w-full min-h-[560px] h-[560px] relative rounded-[28px] overflow-hidden bg-muted ${isStudioActive ? 'cursor-crosshair' : ''}`}
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
          routePath={activePathPoints}
          center={defaultCenter}
          activeSnapshot={selectedBusSnapshot || activeSnapshot}
          isStudioActive={isStudioActive}
        />

        {showRoutes &&
          (multiRoutePaths || []).map((rp) => {
            if (!rp.isActive || !rp.splinePoints || rp.splinePoints.length < 2) return null;
            return (
              <Polyline
                key={`route-polyline-${rp.route.id}`}
                positions={rp.splinePoints}
                pathOptions={{
                  color: rp.color,
                  weight: rp.isActive ? 4.5 : 2,
                  opacity: rp.isActive ? 0.95 : 0.25,
                  lineJoin: 'round',
                  lineCap: 'round',
                }}
                interactive={false}
              />
            );
          })}

        {showRoutes &&
          (snapshots || [])
            .filter((b) => b && b.is_detour && b.detour_lat && b.detour_lng)
            .map((bus) => {
              const detourPath: LatLngTuple[] = (bus.detour_geometry && bus.detour_geometry.length > 0)
                ? bus.detour_geometry.map((pt) => [pt[0], pt[1]] as LatLngTuple)
                : getSplinePoints([
                    [bus.latitude, bus.longitude],
                    [bus.detour_lat!, bus.detour_lng!],
                    [bus.detour_lat! + 0.003, bus.detour_lng! + 0.003],
                  ]);
              return (
                <React.Fragment key={`bus-detour-${bus.bus_id}`}>
                  <Polyline
                    positions={detourPath}
                    pathOptions={{
                      color: '#D97706',
                      weight: 4,
                      dashArray: '8, 8',
                      opacity: 0.95,
                      lineJoin: 'round',
                      lineCap: 'round',
                    }}
                    interactive={false}
                  />
                  <CircleMarker
                    center={[bus.detour_lat!, bus.detour_lng!]}
                    radius={6}
                    pathOptions={{
                      color: '#D97706',
                      fillColor: '#FDE68A',
                      fillOpacity: 1,
                      weight: 2,
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -6]}>
                      <div className="text-center font-sans">
                        <p className="font-semibold text-xs leading-tight text-amber-900">Detour Waypoint</p>
                        <p className="text-[10px] text-amber-700 font-medium">+3.5 min traffic bypass</p>
                      </div>
                    </Tooltip>
                  </CircleMarker>
                </React.Fragment>
              );
            })}

        {showRoutes &&
          (multiRoutePaths || []).map((rp) => {
            if (!rp.isActive) return null;
            return (rp.stops || []).map((stop, sIdx) => {
              const isStopActive = activeSnapshot?.current_stop_sequence === sIdx + 1;
              const stopEta = safeEtas.find(
                (e) => e.stop_id === stop.id && (selectedRouteId === 'all' || e.route_id === selectedRouteId),
              );
              return (
                <CircleMarker
                  key={`stop-marker-${rp.route.id}-${stop.id}-${sIdx}`}
                  center={[stop.latitude, stop.longitude]}
                  radius={isStopActive ? 7 : 5.5}
                  pathOptions={{
                    fillColor: isStopActive ? '#162A22' : '#ffffff',
                    color: rp.color,
                    weight: 2.5,
                    fillOpacity: 1,
                  }}
                >
                  <Tooltip direction="top" offset={[0, -6]}>
                    <div className="text-center font-sans">
                      <p className="font-semibold text-xs leading-tight text-neutral-900">{stop.name}</p>
                      <p className="text-[10px] text-neutral-500 font-medium">
                        {stop.code} · {rp.route.code}
                      </p>
                      {stopEta && (
                        <p className="text-[10px] font-semibold text-[#162A22] mt-0.5">
                          {stopEta.eta_minutes <= 0 ? 'Due now' : `${Math.round(stopEta.eta_minutes)} min away`}
                        </p>
                      )}
                    </div>
                  </Tooltip>
                </CircleMarker>
              );
            });
          })}

        {studioMode && studioSplinePoints.length >= 2 && (
          <Polyline
            positions={studioSplinePoints}
            pathOptions={{
              color: '#4F46E5',
              weight: 4,
              dashArray: '6, 6',
              opacity: 0.9,
              lineJoin: 'round',
              lineCap: 'round',
            }}
            interactive={false}
          />
        )}

        {studioMode &&
          studioStops.map((st, idx) => {
            const isOrigin = idx === 0;
            const isDest = idx === studioStops.length - 1 && studioStops.length > 1;
            const pinColor = isOrigin ? '#059669' : isDest ? '#D97706' : '#4F46E5';
            const pinLabel = isOrigin ? '1 (Origin)' : isDest ? `${idx + 1} (Dest)` : `${idx + 1}`;

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

        {clusteredBuses.map((node) => {
          if (!node.isOffset) return null;
          return (
            <React.Fragment key={`connector-${node.bus.bus_id}`}>
              <Polyline
                positions={[
                  [node.realLat, node.realLng],
                  [node.displayLat, node.displayLng],
                ]}
                pathOptions={{
                  color: node.routeColor,
                  weight: 1.5,
                  dashArray: '3, 4',
                  opacity: 0.65,
                }}
                interactive={false}
              />
              <CircleMarker
                center={[node.realLat, node.realLng]}
                radius={3}
                pathOptions={{
                  color: node.routeColor,
                  fillColor: node.routeColor,
                  fillOpacity: 0.7,
                  weight: 1,
                }}
                interactive={false}
              />
            </React.Fragment>
          );
        })}

        {clusteredBuses.map((node) => (
          <BusMarkerNode
            key={`bus-marker-${node.bus.bus_id}`}
            node={node}
            selected={node.bus.bus_id === selectedBusId}
            onSelect={() => onSelectBus(node.bus.bus_id)}
          />
        ))}
      </MapContainer>

      {!selectedBusId && multiRoutePaths.length > 0 && !studioMode && (
        <div className="absolute bottom-4 right-4 z-[500] pointer-events-auto bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-black/10 shadow-lg font-sans flex flex-col gap-1.5">
          <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400">Campus Corridors</span>
          <div className="flex flex-col gap-1">
            {multiRoutePaths.map((rp) => (
              <div key={`legend-${rp.route.id}`} className="flex items-center gap-2 text-xs font-medium text-neutral-800">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: rp.color }} />
                <span className="truncate max-w-[150px]">{rp.route.code}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {studioMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[600] pointer-events-auto bg-[#162A22] text-white px-5 py-2.5 rounded-full shadow-lg border border-white/20 font-sans text-xs font-medium flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Interactive Studio Active · Click anywhere on the map to add ordered waypoints</span>
        </div>
      )}
    </div>
  );
}

interface BusMarkerNodeProps {
  node: ClusteredBusNode;
  selected: boolean;
  onSelect: () => void;
}

function BusMarkerNode({ node, selected, onSelect }: BusMarkerNodeProps) {
  const { bus, displayLat, displayLng, labelPositionClass, routeColor } = node;
  const isCompleted =
    bus.bus_status === 'COMPLETED' || bus.trip_status === 'JOURNEY_ENDED';
  const isDelayed = bus.speed_kmh < 15 && !isCompleted;
  const roundedHeading = Math.round((bus.heading_deg ?? 0) / 15) * 15;

  const markerIcon = useMemo(() => {
    const classes = [
      'bus-marker',
      isCompleted && 'bus-marker--completed',
      isDelayed && 'bus-marker--delayed',
      selected && 'bus-marker--selected',
    ]
      .filter(Boolean)
      .join(' ');

    const headingEl = isCompleted
      ? ''
      : `<span class="bus-marker__heading" style="rotate:${roundedHeading}deg"></span>`;

    const labelClass = labelPositionClass ? `bus-marker__label ${labelPositionClass}` : 'bus-marker__label';

    return L.divIcon({
      className: '',
      html: `<div class="${classes}" style="${!selected && !isCompleted && !isDelayed ? `background-color:${routeColor};` : ''}">${headingEl}${isCompleted ? CHECK_SVG : BUS_SVG}<span class="${labelClass}">${bus.fleet_code}</span></div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
  }, [bus.fleet_code, isCompleted, isDelayed, selected, roundedHeading, labelPositionClass, routeColor]);

  return (
    <Marker
      position={[displayLat, displayLng]}
      icon={markerIcon}
      zIndexOffset={selected ? 1000 : isCompleted ? -100 : 100}
      eventHandlers={{ click: onSelect }}
      title={`${bus.fleet_code} (${bus.plate_number}) · ${bus.speed_kmh} km/h · ${bus.route_code || ''}`}
    />
  );
}

interface FocusControllerProps {
  focusKey: string;
  routePath: LatLngTuple[];
  center: LatLngTuple;
  activeSnapshot: BusSnapshot | null;
  isStudioActive?: boolean;
}

function FocusController({
  focusKey,
  routePath,
  center,
  activeSnapshot,
  isStudioActive,
}: FocusControllerProps) {
  const map = useMap();

  useEffect(() => {
    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);
    const raf = requestAnimationFrame(() => {
      map.invalidateSize();
    });
    const timer1 = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    const timer2 = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(raf);
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [map, isStudioActive]);

  useEffect(() => {
    map.invalidateSize();
    if (activeSnapshot && typeof activeSnapshot.latitude === 'number' && typeof activeSnapshot.longitude === 'number' && !isNaN(activeSnapshot.latitude) && !isNaN(activeSnapshot.longitude)) {
      map.panTo([activeSnapshot.latitude, activeSnapshot.longitude], {
        animate: true,
        duration: 0.6,
      });
      return;
    }

    if (routePath && routePath.length > 0) {
      const validPoints = routePath.filter(
        (p) => Array.isArray(p) && typeof p[0] === 'number' && typeof p[1] === 'number' && !isNaN(p[0]) && !isNaN(p[1]),
      );
      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints).pad(0.18);
        map.flyToBounds(bounds, {
          duration: 0.8,
          maxZoom: 16,
        });
        return;
      }
    }

    if (center && typeof center[0] === 'number' && typeof center[1] === 'number' && !isNaN(center[0]) && !isNaN(center[1])) {
      map.setView(center, 14, { animate: true });
    }
  }, [focusKey, map, center, routePath, activeSnapshot]);

  return null;
}

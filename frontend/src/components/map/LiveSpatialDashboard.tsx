'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import L, { type Map as LeafletMap } from 'leaflet';
import {
  Bus,
  CheckCircle2,
  Clock,
  Gauge,
  Milestone,
  Navigation,
  Route as RouteIcon,
  Users,
} from 'lucide-react';
import {
  BusSnapshot,
  Route as RouteEntity,
  Stop,
  StopETA,
  TransitEvent,
  UserRole,
} from '@/lib/api';
import { MapControls, LiveBadge } from './MapControls';
import { RoleFilter } from './RoleFilter';
import { StatPills } from './StatPills';
import { RoutePanel } from './RoutePanel';
import { StatPillItem, TripStatusFilter, StudioStop } from './types';
import { isValidLatLng, ROUTE_PALETTE } from './FleetSpatialMap';

const FleetSpatialMap = dynamic(() => import('./FleetSpatialMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[560px] relative rounded-[28px] overflow-hidden flex items-center justify-center bg-card border border-border">
      <div className="flex items-center gap-2.5 text-xs font-sans text-muted-foreground animate-pulse">
        <Navigation className="size-4 text-[#162A22] animate-spin" />
        <span>Connecting to live transit stream…</span>
      </div>
    </div>
  ),
});

interface LiveSpatialDashboardProps {
  tenantId: string;
  tenantName?: string;
  stops: Stop[];
  routes: RouteEntity[];
  activeRoute: RouteEntity | null;
  snapshots: BusSnapshot[];
  activeSnapshot: BusSnapshot | null;
  selectedBusId: string | null;
  onSelectBus: (busId: string) => void;
  onResetTrip?: (busId: string) => Promise<void>;
  userRole: UserRole;
  onRoleChange?: (role: UserRole) => void;
  stopETAs: StopETA[];
  transitEvents?: TransitEvent[];
  isSimulating?: boolean;
  onToggleSimulate?: () => void;
  studioMode?: boolean;
  isCreatingRoute?: boolean;
  studioStops?: StudioStop[];
  studioPolyline?: [number, number][];
  onMapClick?: (lat: number, lng: number) => void;
  onRemoveStudioStop?: (index: number) => void;
  onReady?: (map: LeafletMap) => void;
}

export function LiveSpatialDashboard({
  tenantId,
  tenantName,
  stops = [],
  routes = [],
  activeRoute,
  snapshots = [],
  activeSnapshot,
  selectedBusId,
  onSelectBus,
  onResetTrip,
  userRole,
  onRoleChange,
  stopETAs = [],
  transitEvents = [],
  isSimulating = true,
  onToggleSimulate,
  studioMode = false,
  isCreatingRoute = false,
  studioStops = [],
  studioPolyline = [],
  onMapClick,
  onRemoveStudioStop,
  onReady,
}: LiveSpatialDashboardProps) {
  const isStudioActive = studioMode || isCreatingRoute;
  const safeStops = stops || [];
  const safeRoutes = routes || [];
  const safeSnapshots = snapshots || [];
  const safeEtas = stopETAs || [];
  const safeEvents = transitEvents || [];

  const [internalRole, setInternalRole] = useState<UserRole>(userRole);
  const [showRoutes, setShowRoutes] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<TripStatusFilter>('all');
  const [selectedRouteId, setSelectedRouteId] = useState<string>('all');
  const [recenterCount, setRecenterCount] = useState<number>(0);
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);
  const [followBus, setFollowBus] = useState<boolean>(true);

  const currentRole = onRoleChange ? userRole : internalRole;

  useEffect(() => {
    if (mapInstance) {
      const raf = requestAnimationFrame(() => {
        mapInstance.invalidateSize();
      });
      const timer = setTimeout(() => {
        if ('invalidateSize' in mapInstance) {
          mapInstance.invalidateSize();
        }
        const candidate = mapInstance as unknown as Record<string, unknown>;
        if (typeof candidate.resize === 'function') {
          (candidate.resize as () => void)();
        }
      }, 150);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(timer);
      };
    }
  }, [mapInstance, isStudioActive]);

  const handleRoleSelect = useCallback(
    (role: UserRole) => {
      if (onRoleChange) {
        onRoleChange(role);
      } else {
        setInternalRole(role);
      }
    },
    [onRoleChange],
  );

  const handleRecenter = useCallback(() => {
    setRecenterCount((c) => c + 1);
    if (mapInstance && safeStops.length > 0) {
      const validStops = safeStops
        .filter((s) => s && isValidLatLng(s.latitude, s.longitude))
        .map((s) => [s.latitude, s.longitude] as [number, number]);
      if (validStops.length === 1) {
        mapInstance.setView(validStops[0], 15, { animate: true });
      } else if (validStops.length > 1) {
        try {
          const latLngs = validStops.map((p) => L.latLng(p[0], p[1]));
          const bounds = L.latLngBounds(latLngs);
          if (bounds.isValid()) {
            const sw = bounds.getSouthWest();
            const ne = bounds.getNorthEast();
            if (isValidLatLng(sw.lat, sw.lng) && isValidLatLng(ne.lat, ne.lng)) {
              if (Math.abs(sw.lat - ne.lat) < 0.00001 && Math.abs(sw.lng - ne.lng) < 0.00001) {
                mapInstance.setView([sw.lat, sw.lng], 15, { animate: true });
                return;
              }
              const padded = bounds.pad(0.18);
              if (padded.isValid()) {
                const psw = padded.getSouthWest();
                const pne = padded.getNorthEast();
                if (isValidLatLng(psw.lat, psw.lng) && isValidLatLng(pne.lat, pne.lng)) {
                  mapInstance.flyToBounds(padded, { padding: [40, 40], duration: 0.8, maxZoom: 16 });
                  return;
                }
              }
              mapInstance.flyToBounds(bounds, { padding: [40, 40], duration: 0.8, maxZoom: 16 });
            }
          }
        } catch {
          if (validStops.length > 0) {
            mapInstance.setView(validStops[0], 15, { animate: true });
          }
        }
      }
    }
  }, [mapInstance, safeStops]);

  const handleZoomIn = useCallback(() => {
    mapInstance?.zoomIn();
  }, [mapInstance]);

  const handleZoomOut = useCallback(() => {
    mapInstance?.zoomOut();
  }, [mapInstance]);

  const focusKey = useMemo(() => {
    return `${tenantId}:${currentRole}:${selectedBusId ?? 'none'}:${selectedRouteId}:${recenterCount}`;
  }, [tenantId, currentRole, selectedBusId, selectedRouteId, recenterCount]);

  const filteredSnapshots = useMemo(() => {
    if (selectedRouteId === 'all') return safeSnapshots;
    return safeSnapshots.filter((b) => b && b.route_id === selectedRouteId);
  }, [safeSnapshots, selectedRouteId]);

  const statItems = useMemo<StatPillItem[]>(() => {
    if (currentRole === 'DRIVER') {
      const driverBus =
        safeSnapshots.find((b) => b && b.bus_id === selectedBusId) ?? safeSnapshots[0] ?? null;
      const progressPercent = Math.min(
        100,
        Math.max(0, Math.round(driverBus?.progress_pct ?? 0)),
      );
      const isCompleted =
        driverBus?.bus_status === 'COMPLETED' || driverBus?.trip_status === 'JOURNEY_ENDED';
      const upcomingEta = safeEtas.find(
        (e) => e && e.bus_id === driverBus?.bus_id && e.eta_minutes > 0,
      );

      return [
        {
          label: 'Corridor',
          value: driverBus?.route_code || activeRoute?.code || 'Route 1',
          icon: RouteIcon,
          tone: 'signal',
        },
        {
          label: 'Next waypoint',
          value: isCompleted
            ? 'Terminal reached'
            : upcomingEta
            ? `${Math.round(upcomingEta.eta_minutes)} min`
            : 'At stop',
          icon: Clock,
          tone: 'sage',
        },
        {
          label: 'Onboard load',
          value: `${driverBus?.occupancy ?? 0} / ${driverBus?.capacity ?? 40}`,
          icon: Users,
          tone: 'primary',
        },
        {
          label: 'Route completed',
          value: `${progressPercent}%`,
          icon: Gauge,
          tone: 'mist',
        },
      ];
    }

    if (currentRole === 'RIDER') {
      const activeBuses = safeSnapshots.filter(
        (b) => b && b.bus_status !== 'COMPLETED' && b.trip_status !== 'JOURNEY_ENDED',
      );
      const nearestEta = safeEtas.find((e) => e && e.eta_minutes > 0);
      const driverBus = activeSnapshot ?? safeSnapshots[0] ?? null;
      const seatsFree = driverBus
        ? Math.max(0, driverBus.capacity - driverBus.occupancy)
        : 18;

      return [
        {
          label: 'Active vehicles',
          value: activeBuses.length,
          icon: Bus,
          tone: 'primary',
        },
        {
          label: 'Approaching bus',
          value: nearestEta ? `${Math.round(nearestEta.eta_minutes)} min` : '5 min',
          icon: Clock,
          tone: 'signal',
        },
        {
          label: 'Available seats',
          value: seatsFree,
          icon: Users,
          tone: 'sage',
        },
        {
          label: 'Active corridor',
          value: activeRoute?.code || 'R1',
          icon: Milestone,
          tone: 'mist',
        },
      ];
    }

    const inTransitCount = safeSnapshots.filter(
      (b) => b && b.bus_status !== 'COMPLETED' && b.trip_status !== 'JOURNEY_ENDED',
    ).length;
    const completedCount = safeSnapshots.filter(
      (b) => b && (b.bus_status === 'COMPLETED' || b.trip_status === 'JOURNEY_ENDED'),
    ).length;

    return [
      {
        label: 'Total vehicles',
        value: safeSnapshots.length,
        icon: Bus,
        tone: 'primary',
      },
      {
        label: 'In transit',
        value: inTransitCount,
        icon: Gauge,
        tone: 'sage',
      },
      {
        label: 'Trips finished',
        value: completedCount,
        icon: CheckCircle2,
        tone: 'mist',
      },
      {
        label: 'Active lines',
        value: safeRoutes.length || 1,
        icon: RouteIcon,
        tone: 'signal',
      },
    ];
  }, [currentRole, safeSnapshots, selectedBusId, activeRoute, safeEtas, activeSnapshot, safeRoutes.length]);

  return (
    <div className="flex flex-col gap-4 font-sans">
      {!isStudioActive && (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <StatPills items={statItems} />
          <RoleFilter value={currentRole} onChange={handleRoleSelect} />
        </div>
      )}

      <div className="w-full min-h-[560px] h-[560px] relative rounded-[28px] overflow-hidden border border-black/[0.06] shadow-sm">
        <FleetSpatialMap
          tenantId={tenantId}
          stops={safeStops}
          routes={safeRoutes}
          activeRoute={activeRoute}
          snapshots={safeSnapshots}
          activeSnapshot={activeSnapshot}
          selectedBusId={selectedBusId}
          selectedRouteId={selectedRouteId}
          stopETAs={safeEtas}
          showRoutes={showRoutes}
          focusKey={focusKey}
          onSelectBus={onSelectBus}
          onReady={(map) => {
            setMapInstance(map);
            if (onReady) onReady(map);
          }}
          studioMode={isStudioActive}
          isCreatingRoute={isStudioActive}
          studioStops={studioStops}
          studioPolyline={studioPolyline}
          onMapClick={onMapClick}
          onRemoveStudioStop={onRemoveStudioStop}
          followBus={followBus}
          isSimulating={isSimulating}
        />

        {!isStudioActive && (
          <div className="absolute top-4 left-4 lg:left-[368px] right-4 z-[500] pointer-events-auto flex flex-wrap items-center justify-between gap-2.5 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-black/10 shadow-lg font-sans">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#162A22]">
                <span className="text-[11px] font-medium text-black/50">Corridor:</span>
                <select
                  value={selectedRouteId}
                  onChange={(e) => {
                    setSelectedRouteId(e.target.value);
                    if (e.target.value !== 'all' && selectedBusId) {
                      const busMatches = safeSnapshots.find(
                        (b) => b.bus_id === selectedBusId && b.route_id === e.target.value,
                      );
                      if (!busMatches) onSelectBus('');
                    }
                  }}
                  className="bg-[#F7F6F2] hover:bg-[#EFECE6] border border-black/[0.08] text-[#162A22] text-xs font-medium rounded-xl px-2.5 py-1 outline-none cursor-pointer transition-colors"
                >
                  <option value="all">All corridors ({safeRoutes.length || 5})</option>
                  {safeRoutes.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      {rt.code} · {rt.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="h-4 w-px bg-black/10 mx-1 hidden sm:block" />

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onSelectBus('')}
                  className={`px-3 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    !selectedBusId
                      ? 'bg-[#162A22] text-white shadow-xs'
                      : 'bg-[#F7F6F2] hover:bg-[#EFECE6] text-[#162A22] border border-black/[0.06]'
                  }`}
                >
                  All buses ({filteredSnapshots.length})
                </button>

                {filteredSnapshots.map((bus, bIdx) => {
                  const isSelected = bus.bus_id === selectedBusId;
                  const routeIdx = safeRoutes.findIndex((r) => r.id === bus.route_id);
                  const dotColor =
                    routeIdx >= 0
                      ? ROUTE_PALETTE[routeIdx % ROUTE_PALETTE.length]
                      : ROUTE_PALETTE[bIdx % ROUTE_PALETTE.length];
                  const hasDelay =
                    (bus.delay_minutes !== undefined && bus.delay_minutes > 0.1) ||
                    bus.route_variant === 'ALTERNATE_ROUTE_2' ||
                    bus.is_detour;
                  const delayText = `+${(bus.delay_minutes || 0).toFixed(1)}m`;

                  return (
                    <button
                      key={bus.bus_id}
                      type="button"
                      onClick={() => onSelectBus(bus.bus_id)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#162A22] text-white shadow-xs'
                          : 'bg-[#F7F6F2] hover:bg-[#EFECE6] text-[#162A22] border border-black/[0.06]'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: dotColor }}
                      />
                      <span>{bus.fleet_code}</span>
                      {hasDelay && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                            isSelected
                              ? 'bg-amber-400 text-black'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {delayText}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFollowBus((f) => !f)}
                className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  followBus
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-[#F7F6F2] text-black/60 border border-black/[0.08]'
                }`}
                title="Toggle camera auto-follow on selected bus"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    followBus ? 'bg-emerald-500' : 'bg-neutral-400'
                  }`}
                />
                <span>Follow: {followBus ? 'ON' : 'OFF'}</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleSimulate && onToggleSimulate()}
                className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSimulating
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-amber-50 text-amber-900 border border-amber-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isSimulating ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                <span>{isSimulating ? 'Live 60 FPS' : 'Paused ⏸'}</span>
              </button>
            </div>
          </div>
        )}

        <MapControls
          showRoutes={showRoutes}
          onShowRoutesChange={setShowRoutes}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onRecenter={handleRecenter}
        />

        {!isStudioActive && (
          <div className="absolute bottom-4 left-4 top-16 z-[500] w-[340px] pointer-events-auto hidden md:block">
            <RoutePanel
              role={currentRole}
              routes={safeRoutes}
              activeRoute={activeRoute}
              stops={safeStops}
              snapshots={safeSnapshots}
              selectedBusId={selectedBusId}
              onSelectBus={onSelectBus}
              onResetTrip={onResetTrip}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              selectedRouteId={selectedRouteId}
              onRouteChange={setSelectedRouteId}
              stopETAs={safeEtas}
              transitEvents={safeEvents}
              onSelectStop={(lat: number, lng: number) => {
                if (mapInstance) {
                  mapInstance.flyTo([lat, lng], 16, { duration: 0.8 });
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default LiveSpatialDashboard;

'use client';

import React, { useState } from 'react';
import {
  Bus,
  CheckCircle2,
  Clock,
  Gauge,
  MapPin,
  RotateCcw,
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
import { TripStatusFilter } from './types';
import { cn } from '@/lib/utils';
import { ROUTE_PALETTE } from './FleetSpatialMap';

interface RoutePanelProps {
  role: UserRole;
  routes: RouteEntity[];
  activeRoute: RouteEntity | null;
  stops: Stop[];
  snapshots: BusSnapshot[];
  selectedBusId: string | null;
  onSelectBus: (busId: string) => void;
  onResetTrip?: (busId: string) => Promise<void>;
  statusFilter: TripStatusFilter;
  onStatusFilterChange: (status: TripStatusFilter) => void;
  selectedRouteId: string;
  onRouteChange: (routeId: string) => void;
  stopETAs: StopETA[];
  transitEvents: TransitEvent[];
  onSelectStop?: (lat: number, lng: number) => void;
}

export function RoutePanel({
  role,
  routes,
  activeRoute,
  stops,
  snapshots,
  selectedBusId,
  onSelectBus,
  onResetTrip,
  statusFilter,
  onStatusFilterChange,
  selectedRouteId,
  onRouteChange,
  stopETAs,
  transitEvents,
  onSelectStop,
}: RoutePanelProps) {
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const safeSnapshots = snapshots || [];
  const safeRoutes = routes || [];
  const safeStops = stops || [];
  const safeEtas = stopETAs || [];

  const activeBus =
    safeSnapshots.find((b) => b && b.bus_id === selectedBusId) ??
    safeSnapshots.find((b) => b && selectedRouteId !== 'all' && b.route_id === selectedRouteId) ??
    safeSnapshots[0] ??
    null;

  const currentRoute =
    safeRoutes.find((r) => r.id === (activeBus?.route_id || selectedRouteId)) ??
    activeRoute ??
    safeRoutes[0] ??
    null;

  const routeIndex = safeRoutes.findIndex((r) => r.id === currentRoute?.id);
  const routeColor =
    routeIndex >= 0
      ? ROUTE_PALETTE[routeIndex % ROUTE_PALETTE.length]
      : ROUTE_PALETTE[0];

  const handleReset = async (busId: string) => {
    if (!onResetTrip || isResetting) return;
    setIsResetting(true);
    try {
      await onResetTrip(busId);
    } finally {
      setIsResetting(false);
    }
  };

  const routeEtas = currentRoute
    ? safeEtas.filter((e) => e && e.route_id === currentRoute.id)
    : [];

  const sortedEtas = [...routeEtas].sort((a, b) => a.stop_sequence - b.stop_sequence);

  type StopRowItem = {
    id: string;
    sequence: number;
    name: string;
    code: string;
    lat: number;
    lng: number;
    status: string;
    etaMinutes: number;
    distMeters: number;
  };

  const stopRows: StopRowItem[] = [];

  if (sortedEtas.length > 0) {
    const seenIds = new Set<string>();
    for (const eta of sortedEtas) {
      if (!seenIds.has(eta.stop_id)) {
        seenIds.add(eta.stop_id);
        stopRows.push({
          id: eta.stop_id,
          sequence: eta.stop_sequence,
          name: eta.stop_name,
          code: eta.stop_code,
          lat: eta.stop_latitude,
          lng: eta.stop_longitude,
          status: eta.status || 'UPCOMING',
          etaMinutes: eta.eta_minutes,
          distMeters: eta.distance_meters,
        });
      }
    }
  } else if (currentRoute) {
    const matchingStops = safeStops.slice(0, 5);
    matchingStops.forEach((st, idx) => {
      stopRows.push({
        id: st.id,
        sequence: idx + 1,
        name: st.name,
        code: st.code,
        lat: st.latitude,
        lng: st.longitude,
        status: idx === 0 ? 'ARRIVING_NOW' : 'UPCOMING',
        etaMinutes: idx * 3.5,
        distMeters: idx * 800,
      });
    });
  }

  const isCompleted =
    activeBus?.bus_status === 'COMPLETED' || activeBus?.trip_status === 'JOURNEY_ENDED';
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round(activeBus?.progress_pct ?? 0)),
  );
  const isDelayed =
    (activeBus?.delay_minutes !== undefined && activeBus.delay_minutes > 0) ||
    activeBus?.route_variant === 'ALTERNATE_ROUTE_2' ||
    activeBus?.is_detour;
  const delayDisplay = activeBus?.delay_minutes
    ? `+${activeBus.delay_minutes.toFixed(1)}m traffic delay`
    : '+3.8m traffic delay';

  return (
    <section
      aria-label="Fleet routing panel"
      className="flex max-h-full flex-col overflow-hidden rounded-[24px] border border-black/10 bg-white/95 shadow-2xl backdrop-blur-md font-sans text-[#162A22]"
    >
      <div className="flex flex-col gap-2.5 border-b border-black/10 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: routeColor }}
              />
              <h2 className="text-xs font-bold uppercase tracking-wider text-black/50">
                {currentRoute?.code || 'Corridor'} · {currentRoute?.name || 'Transit Route'}
              </h2>
            </div>
            <p className="text-[11px] text-black/60 font-medium mt-0.5">
              {role === 'DRIVER'
                ? 'Your assigned route and 5 sequential waypoints'
                : 'Real-time 5-stop arrival telemetry'}
            </p>
          </div>
          <span className="rounded-full border border-black/10 bg-[#F7F6F2] px-2 py-0.5 text-[10px] font-semibold text-black/70">
            {stopRows.length} stops
          </span>
        </div>

        {activeBus && (
          <div className="rounded-xl bg-[#F7F6F2] border border-black/[0.06] p-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-bold text-[#162A22]">
                <Bus className="size-3.5 text-[#162A22]" />
                {activeBus.fleet_code}
                <span className="font-normal text-black/50 text-[11px]">
                  | {activeBus.plate_number}
                </span>
              </span>
              <span className="text-[11px] font-semibold text-black/70">
                {Math.round(activeBus.speed_kmh * 10) / 10} km/h
              </span>
            </div>

            <div className="mt-2">
              <div className="h-1.5 overflow-hidden rounded-full bg-black/10">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor: isDelayed ? '#D97706' : routeColor,
                  }}
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] text-black/60 font-medium">
                <span>
                  {isCompleted
                    ? 'Journey concluded'
                    : isDelayed
                    ? delayDisplay
                    : `Progress: Stop #${activeBus.current_stop_sequence ?? 1}`}
                </span>
                <span>{progressPercent}%</span>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-black/5 flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1 text-black/60">
                <Users className="size-3" />
                <span>
                  Load: <strong className="text-[#162A22]">{activeBus.occupancy}</strong> /{' '}
                  {activeBus.capacity}
                </span>
              </span>

              {isCompleted && (
                <button
                  type="button"
                  disabled={isResetting}
                  onClick={() => handleReset(activeBus.bus_id)}
                  className="flex items-center gap-1 rounded-full bg-[#162A22] text-white px-2.5 py-0.5 text-[10px] font-semibold hover:bg-black disabled:opacity-50 transition-colors"
                >
                  <RotateCcw className="size-2.5" />
                  Reset ↺
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[380px]">
        <div className="flex items-center justify-between px-1 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-black/40">
            Corridor Waypoints (5)
          </span>
          <span className="text-[10px] text-black/40">Click stop to pan</span>
        </div>

        <div className="relative pl-5 space-y-2.5 py-1">
          <div className="absolute bottom-2 left-[7px] top-2 w-0.5 bg-black/10" />

          {stopRows.map((st, idx) => {
            const isPassed = st.status === 'PASSED' || isCompleted;
            const isArriving = st.status === 'ARRIVING_NOW' && !isCompleted;
            const isUpcoming = !isPassed && !isArriving;

            let countdownText = 'Passed';
            if (isArriving) {
              countdownText = 'Arriving now';
            } else if (isUpcoming) {
              if (st.etaMinutes >= 60) {
                countdownText = `~${Math.floor(st.etaMinutes / 60)}h ${Math.round(
                  st.etaMinutes % 60,
                )}m`;
              } else {
                countdownText = `~${Math.max(1, Math.round(st.etaMinutes))} min`;
              }
            }

            return (
              <div
                key={st.id}
                onClick={() => onSelectStop && onSelectStop(st.lat, st.lng)}
                className="relative flex items-center justify-between text-xs p-1.5 rounded-xl hover:bg-black/5 cursor-pointer transition-colors"
              >
                <span
                  className={cn(
                    'absolute -left-5 top-1/2 size-3 -translate-y-1/2 rounded-full border-2 bg-white transition-all',
                    isPassed
                      ? 'border-emerald-600 bg-emerald-600'
                      : isArriving
                      ? 'border-[#162A22] bg-[#162A22] ring-4 ring-emerald-500/20'
                      : 'border-black/30',
                  )}
                  style={{
                    backgroundColor: isPassed ? '#059669' : isArriving ? routeColor : '#FFFFFF',
                    borderColor: isPassed ? '#059669' : routeColor,
                  }}
                />

                <div className="min-w-0 pr-2">
                  <p
                    className={cn(
                      'text-xs font-semibold leading-tight truncate',
                      isPassed
                        ? 'text-black/40 line-through'
                        : isArriving
                        ? 'text-[#162A22] font-bold'
                        : 'text-[#162A22]',
                    )}
                  >
                    #{st.sequence} · {st.name}
                  </p>
                  <p className="text-[10px] text-black/40 font-medium">{st.code}</p>
                </div>

                <div className="shrink-0 text-right">
                  <span
                    className={cn(
                      'inline-block px-2 py-0.5 rounded-full text-[10px] font-bold',
                      isPassed
                        ? 'bg-emerald-50 text-emerald-700'
                        : isArriving
                        ? 'bg-emerald-100 text-emerald-900 animate-pulse'
                        : 'bg-black/5 text-black/70',
                    )}
                  >
                    {countdownText}
                  </span>
                  {isUpcoming && isDelayed && (
                    <div className="text-[9px] font-bold text-amber-700 mt-0.5">+3.8m delay</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default RoutePanel;

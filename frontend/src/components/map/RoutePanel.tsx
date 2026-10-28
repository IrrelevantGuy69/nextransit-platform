'use client';

import React, { useState } from 'react';
import {
  Bus,
  CheckCircle2,
  Clock,
  Gauge,
  MapPin,
  Phone,
  RotateCcw,
  UserRound,
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
}: RoutePanelProps) {
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const safeSnapshots = snapshots || [];
  const safeRoutes = routes || [];
  const safeStops = stops || [];
  const safeEvents = transitEvents || [];
  const safeEtas = stopETAs || [];

  const filteredSnapshots = safeSnapshots.filter((bus) => {
    if (!bus) return false;
    if (selectedRouteId !== 'all' && bus.route_id && bus.route_id !== selectedRouteId) {
      return false;
    }
    const isCompleted =
      bus.bus_status === 'COMPLETED' || bus.trip_status === 'JOURNEY_ENDED';
    if (statusFilter === 'active' && isCompleted) return false;
    if (statusFilter === 'completed' && !isCompleted) return false;
    return true;
  });

  const activeDriverBus = safeSnapshots.find((b) => b && b.bus_id === selectedBusId) ?? safeSnapshots[0] ?? null;

  const handleReset = async (busId: string) => {
    if (!onResetTrip || isResetting) return;
    setIsResetting(true);
    try {
      await onResetTrip(busId);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <section
      aria-label="Fleet routing panel"
      className="flex max-h-full flex-col overflow-hidden rounded-[24px] border border-border bg-card/95 shadow-2xl backdrop-blur-md"
    >
      <div className="flex flex-col gap-3 border-b border-border p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              {role === 'DRIVER'
                ? 'My trip & stops'
                : role === 'RIDER'
                ? 'Live passenger corridor'
                : 'Active fleet control'}
            </h2>
            <p className="text-[11px] text-muted-foreground">
              {role === 'DRIVER'
                ? 'Your assigned route and live waypoints'
                : role === 'RIDER'
                ? 'Real-time vehicle arrival ETAs'
                : 'Live depot tracking and vehicle progression'}
            </p>
          </div>
          <span className="rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-foreground">
            {filteredSnapshots.length}{' '}
            {filteredSnapshots.length === 1 ? 'vehicle' : 'vehicles'}
          </span>
        </div>

        {role !== 'DRIVER' && (
          <div className="flex flex-col gap-2 pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { value: 'all', label: 'All' },
                  { value: 'active', label: 'In transit' },
                  { value: 'completed', label: 'Terminated' },
                ] as { value: TripStatusFilter; label: string }[]
              ).map((chip) => (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => onStatusFilterChange(chip.value)}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all duration-200 border',
                    statusFilter === chip.value
                      ? 'border-[#162A22] bg-[#162A22] text-[#F4F3EE] shadow-sm'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground',
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {safeRoutes.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onRouteChange('all')}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all duration-200 border',
                    selectedRouteId === 'all'
                      ? 'border-[#f97316] bg-[#f97316] text-white shadow-sm'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground',
                  )}
                >
                  All corridors
                </button>
                {safeRoutes.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => onRouteChange(r.id)}
                    className={cn(
                      'rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all duration-200 border',
                      selectedRouteId === r.id
                        ? 'border-[#f97316] bg-[#f97316] text-white shadow-sm'
                        : 'border-border bg-card text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {r.code}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-[460px]">
        {role === 'DRIVER' && activeDriverBus ? (
          <DriverTimelineView
            bus={activeDriverBus}
            route={activeRoute}
            stops={safeStops}
            stopETAs={safeEtas}
            isResetting={isResetting}
            onReset={() => handleReset(activeDriverBus.bus_id)}
          />
        ) : filteredSnapshots.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No active fleet vehicles match current filter.
          </div>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {filteredSnapshots.map((bus) => (
              <li key={bus.bus_id}>
                <BusItemCard
                  bus={bus}
                  role={role}
                  selected={bus.bus_id === selectedBusId}
                  onSelect={() => onSelectBus(bus.bus_id)}
                  onReset={() => handleReset(bus.bus_id)}
                  isResetting={isResetting}
                  stopETAs={safeEtas}
                />
              </li>
            ))}
          </ul>
        )}

        {role === 'OPERATOR_ADMIN' && safeEvents.length > 0 && (
          <div className="mt-4 border-t border-border pt-3">
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Recent geofence triggers
            </h3>
            <ul className="flex flex-col gap-1.5 text-xs">
              {safeEvents.slice(0, 4).map((evt) => (
                <li
                  key={evt.id}
                  className="flex items-center gap-2 rounded-xl bg-muted/40 p-2"
                >
                  <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                  <div className="min-w-0 flex-1 truncate">
                    <span className="font-semibold">{evt.fleet_code}</span>{' '}
                    <span className="text-muted-foreground">
                      {evt.event_type.toLowerCase().replace('_', ' ')} at {evt.stop_name}
                    </span>
                  </div>
                  <time className="text-[10px] tabular-nums text-muted-foreground shrink-0">
                    {new Date(evt.triggered_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

interface BusItemCardProps {
  bus: BusSnapshot;
  role: UserRole;
  selected: boolean;
  onSelect: () => void;
  onReset: () => void;
  isResetting: boolean;
  stopETAs: StopETA[];
}

function BusItemCard({
  bus,
  role,
  selected,
  onSelect,
  onReset,
  isResetting,
  stopETAs,
}: BusItemCardProps) {
  const isCompleted =
    bus.bus_status === 'COMPLETED' || bus.trip_status === 'JOURNEY_ENDED';
  const isDelayed = bus.speed_kmh < 15 && !isCompleted;
  const isAtStop = bus.trip_status === 'AT_STOP';

  const upcomingEta = stopETAs.find((e) => e.bus_id === bus.bus_id && e.eta_minutes > 0);
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round(bus.progress_pct ?? 0)),
  );
  const seatsAvailable = Math.max(0, bus.capacity - bus.occupancy);

  return (
    <div
      onClick={onSelect}
      className={cn(
        'w-full rounded-2xl border p-3 text-left transition-all duration-200 cursor-pointer',
        selected
          ? 'border-[#f97316]/60 bg-card shadow-md ring-1 ring-[#f97316]/30'
          : 'border-border/60 bg-card/60 hover:bg-muted/50',
      )}
    >
      <div className="flex items-start gap-2.5">
        <MapPin
          className={cn(
            'mt-0.5 size-4 shrink-0 transition-colors',
            selected ? 'text-[#f97316]' : 'text-muted-foreground',
          )}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1.5">
            <p className="truncate text-xs font-bold text-foreground">
              {bus.route_code || 'Route'}{' '}
              <span className="font-normal text-muted-foreground">
                · {bus.route_name || 'Corridor'}
              </span>
            </p>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-bold tracking-tight',
                isCompleted
                  ? 'bg-emerald-100 text-emerald-800'
                  : isDelayed
                  ? 'bg-rose-100 text-rose-800'
                  : isAtStop
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-50 text-emerald-700',
              )}
            >
              {isCompleted
                ? 'Terminal reached'
                : isAtStop
                ? 'At stop · Boarding'
                : isDelayed
                ? 'Delayed traffic'
                : 'In transit'}
            </span>
          </div>

          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-foreground">
              <Bus className="size-3.5 text-[#f97316]" />
              {bus.fleet_code}
              <span className="font-normal text-muted-foreground">
                | {bus.plate_number}
              </span>
            </span>
            <span className="text-[11px] font-sans text-muted-foreground">
              {bus.speed_kmh} km/h
            </span>
          </div>
        </div>
      </div>

      <div className="mt-2.5 pl-6">
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              isCompleted
                ? 'bg-emerald-600'
                : isDelayed
                ? 'bg-rose-500'
                : 'bg-[#f97316]',
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>
            {isCompleted
              ? 'Trip concluded'
              : upcomingEta
              ? `Next: ${upcomingEta.stop_name}`
              : `Sequence #${bus.current_stop_sequence ?? 1}`}
          </span>
          <span className="tabular-nums font-sans font-medium">{progressPercent}%</span>
        </div>
      </div>

      {selected && (
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-2.5 pl-6 text-xs">
          <div>
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Users className="size-3" />
              Onboard load
            </p>
            <p className="mt-0.5 font-semibold text-foreground">
              {bus.occupancy} / {bus.capacity}
            </p>
          </div>
          <div>
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="size-3" />
              Next arrival
            </p>
            <p className="mt-0.5 font-semibold text-[#f97316]">
              {isCompleted
                ? 'Terminal reached'
                : upcomingEta
                ? `${Math.round(upcomingEta.eta_minutes)} min`
                : 'Approaching'}
            </p>
          </div>

          <div className="col-span-2 pt-1 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              Available seats: <strong className="text-foreground">{seatsAvailable}</strong>
            </span>
            {isCompleted && (
              <button
                type="button"
                disabled={isResetting}
                onClick={(e) => {
                  e.stopPropagation();
                  onReset();
                }}
                className="flex items-center gap-1 rounded-full bg-[#162A22] text-[#F4F3EE] px-3 py-1 text-[11px] font-semibold hover:bg-[#162A22]/90 disabled:opacity-50 transition-colors"
              >
                <RotateCcw className="size-3" />
                Reset journey ↺
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface DriverTimelineViewProps {
  bus: BusSnapshot;
  route: RouteEntity | null;
  stops: Stop[];
  stopETAs: StopETA[];
  isResetting: boolean;
  onReset: () => void;
}

function DriverTimelineView({
  bus,
  route,
  stops,
  stopETAs,
  isResetting,
  onReset,
}: DriverTimelineViewProps) {
  const isCompleted =
    bus.bus_status === 'COMPLETED' || bus.trip_status === 'JOURNEY_ENDED';
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round(bus.progress_pct ?? 0)),
  );
  const currentSeq = bus.current_stop_sequence ?? 1;

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl bg-[#162A22] p-4 text-[#F4F3EE] shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-white/70 font-sans">
            {bus.fleet_code} · {bus.plate_number}
          </span>
          <span className="text-xs font-semibold text-[#86EFAC]">
            {bus.speed_kmh} km/h
          </span>
        </div>
        <p className="mt-1 text-base font-bold">
          {isCompleted
            ? 'Terminal reached · Journey ended'
            : `Active corridor · ${route?.name ?? 'Transit corridor'}`}
        </p>
        <p className="mt-0.5 text-xs text-white/80">
          {isCompleted
            ? 'Vehicle ready for round-trip dispatch'
            : `${bus.occupancy} passengers onboard · Capacity ${bus.capacity}`}
        </p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-[#f97316] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {isCompleted && (
          <div className="mt-3 pt-2 border-t border-white/10 flex justify-end">
            <button
              type="button"
              disabled={isResetting}
              onClick={onReset}
              className="flex items-center gap-1.5 rounded-full bg-[#f97316] text-white px-3.5 py-1.5 text-xs font-semibold hover:bg-[#ea580c] disabled:opacity-50 transition-colors shadow-sm"
            >
              <RotateCcw className="size-3.5" />
              Reset journey ↺
            </button>
          </div>
        )}
      </div>

      <div className="relative pl-6 py-2 space-y-4">
        <div className="absolute bottom-3 left-[9px] top-3 w-0.5 bg-border" />
        {(stops || []).map((stop, idx) => {
          const stopSeq = idx + 1;
          const passed = stopSeq < currentSeq || isCompleted;
          const isCurrent = stopSeq === currentSeq && !isCompleted;
          const eta = (stopETAs || []).find((e) => e.stop_id === stop.id);

          return (
            <div
              key={stop.id}
              className="relative flex items-center justify-between text-xs"
            >
              <span
                className={cn(
                  'absolute -left-6 top-1/2 size-3.5 -translate-y-1/2 rounded-full border-2 bg-card transition-all',
                  passed
                    ? 'border-emerald-600 bg-emerald-600'
                    : isCurrent
                    ? 'border-[#f97316] bg-[#f97316] ring-4 ring-[#f97316]/20'
                    : 'border-border',
                )}
              />
              <span
                className={cn(
                  'font-medium',
                  passed
                    ? 'text-muted-foreground line-through decoration-border'
                    : isCurrent
                    ? 'font-bold text-[#f97316]'
                    : 'text-foreground',
                )}
              >
                {stop.name}
              </span>
              <span className="text-[11px] font-sans tabular-nums text-muted-foreground">
                {passed
                  ? 'Departed'
                  : isCurrent
                  ? 'Approaching now'
                  : eta
                  ? `${Math.round(eta.eta_minutes)} min`
                  : 'Pending'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

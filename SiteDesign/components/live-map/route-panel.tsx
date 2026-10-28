'use client'

import { Bus, CircleCheck, Clock, MapPin, Phone, UserRound, Users } from 'lucide-react'
import {
  etaMinutes,
  fleets,
  getRoute,
  nextStop,
  viewerProfiles,
  type ViewerRole,
} from '@/lib/transit-data'
import type { BusStatus, LiveBus, TripLogEntry } from '@/lib/use-fleet-simulation'
import { cn } from '@/lib/utils'

export type StatusFilter = 'all' | 'active' | 'completed'

type RoutePanelProps = {
  role: ViewerRole
  buses: LiveBus[]
  selectedBusId: string | null
  onSelectBus: (id: string) => void
  statusFilter: StatusFilter
  onStatusFilterChange: (s: StatusFilter) => void
  fleetFilter: string
  onFleetFilterChange: (f: string) => void
  log: TripLogEntry[]
}

const titles: Record<ViewerRole, { title: string; hint: string }> = {
  operator: { title: 'Live fleet', hint: 'Every bus across all depots' },
  driver: { title: 'My trip', hint: 'Your assigned bus and stops' },
  passenger: { title: 'My buses', hint: 'Buses on routes you follow' },
}

export function RoutePanel(props: RoutePanelProps) {
  const { role, buses, selectedBusId, onSelectBus, log } = props
  const { title, hint } = titles[role]

  return (
    <section
      aria-label={title}
      className="flex max-h-full flex-col overflow-hidden rounded-3xl border border-border bg-card/95 shadow-xl backdrop-blur"
    >
      <div className="flex flex-col gap-3 border-b border-border p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            <p className="text-xs text-muted-foreground">{hint}</p>
          </div>
          <span className="rounded-full border border-border px-2.5 py-1 text-xs font-medium tabular-nums">
            {buses.length} {buses.length === 1 ? 'bus' : 'buses'}
          </span>
        </div>
        {role !== 'driver' && <PanelFilters {...props} />}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {role === 'driver' && buses[0] ? (
          <DriverTrip bus={buses[0]} />
        ) : buses.length === 0 ? (
          <p className="px-2 py-8 text-center text-sm text-muted-foreground">No buses match these filters.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {buses.map((bus) => (
              <li key={bus.id}>
                <BusCard bus={bus} role={role} selected={bus.id === selectedBusId} onSelect={() => onSelectBus(bus.id)} />
              </li>
            ))}
          </ul>
        )}

        {role === 'operator' && log.length > 0 && (
          <div className="mt-4 border-t border-border px-1 pt-4">
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Recently completed</h3>
            <ul className="flex flex-col gap-2" aria-live="polite">
              {log.slice(0, 5).map((entry) => (
                <li key={entry.id} className="flex items-center gap-2 text-sm">
                  <CircleCheck className="size-4 text-chart-5" aria-hidden="true" />
                  <span className="font-medium">{entry.busCode}</span>
                  <span className="text-muted-foreground">finished route {getRoute(entry.routeId).number}</span>
                  <time className="ml-auto text-xs tabular-nums text-muted-foreground">
                    {entry.at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </time>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}

function PanelFilters({ role, statusFilter, onStatusFilterChange, fleetFilter, onFleetFilterChange }: RoutePanelProps) {
  const statuses: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'On route' },
    { value: 'completed', label: 'Completed' },
  ]
  return (
    <div className="flex flex-col gap-2">
      <Chips label="Trip status" options={statuses} value={statusFilter} onChange={onStatusFilterChange} />
      {role === 'operator' && (
        <Chips
          label="Fleet"
          options={[{ value: 'all', label: 'All fleets' }, ...fleets.map((f) => ({ value: f.id, label: f.name }))]}
          value={fleetFilter}
          onChange={onFleetFilterChange}
        />
      )}
    </div>
  )
}

function Chips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
            o.value === value
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border text-muted-foreground hover:text-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

const statusMeta: Record<BusStatus, { label: string; className: string }> = {
  'en-route': { label: 'On route', className: 'bg-sage text-primary' },
  delayed: { label: 'Delayed', className: 'bg-destructive/10 text-destructive' },
  completed: { label: 'Completed', className: 'bg-muted text-muted-foreground' },
}

function StatusChip({ status }: { status: BusStatus }) {
  const meta = statusMeta[status]
  return <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', meta.className)}>{meta.label}</span>
}

function ProgressBar({ value, status }: { value: number; status: BusStatus }) {
  return (
    <div
      role="progressbar"
      aria-label="Trip progress"
      aria-valuenow={Math.round(value * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-1.5 overflow-hidden rounded-full bg-muted"
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-300 ease-linear',
          status === 'completed' ? 'bg-chart-5' : status === 'delayed' ? 'bg-destructive' : 'bg-signal',
        )}
        style={{ width: `${value * 100}%` }}
      />
    </div>
  )
}

function BusCard({
  bus,
  role,
  selected,
  onSelect,
}: {
  bus: LiveBus
  role: ViewerRole
  selected: boolean
  onSelect: () => void
}) {
  const route = getRoute(bus.routeId)
  const upcoming = nextStop(route, bus.progress)
  const completed = bus.status === 'completed'
  const myStop = route.stops.find((s) => s.name === viewerProfiles.passenger.stopName)
  const passedMyStop = myStop ? bus.progress > myStop.at : true

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'w-full rounded-2xl border p-3 text-left transition-colors',
        selected ? 'border-signal/50 bg-card shadow-md ring-1 ring-signal/30' : 'border-transparent hover:bg-muted/60',
      )}
    >
      <div className="flex items-start gap-3">
        <MapPin className={cn('mt-0.5 size-4 shrink-0', selected ? 'text-signal' : 'text-muted-foreground')} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold">
              Route {route.number} <span className="font-normal text-muted-foreground">{'· '}{route.name}</span>
            </p>
            <StatusChip status={bus.status} />
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {route.from} {'→'} {route.to}
          </p>
          <p className={cn('mt-2 flex items-center gap-1.5 text-xs font-semibold', selected ? 'text-signal' : 'text-foreground')}>
            <Bus className="size-3.5" aria-hidden="true" />
            {bus.code}
            <span className="font-normal text-muted-foreground">| {bus.plate}</span>
          </p>
        </div>
      </div>

      <div className="mt-3 pl-7">
        <ProgressBar value={bus.progress} status={bus.status} />
        <p className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{completed ? `Layover · next trip in ${Math.ceil(bus.layover)}s` : `Next: ${upcoming.name}`}</span>
          <span className="tabular-nums">{Math.round(bus.progress * 100)}%</span>
        </p>
      </div>

      {selected && (
        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 pl-7 text-xs">
          {role === 'operator' ? (
            <>
              <Detail icon={UserRound} label="Driver" value={bus.driver.name} />
              <Detail icon={Phone} label="Phone" value={bus.driver.phone} />
              <Detail icon={Users} label="Onboard" value={`${bus.passengers}/${bus.capacity}`} />
              <Detail icon={CircleCheck} label="Trips today" value={String(bus.tripsCompleted)} />
            </>
          ) : (
            <>
              <Detail
                icon={Clock}
                label={myStop ? `To ${myStop.name}` : 'Next stop'}
                value={
                  completed
                    ? 'Next trip soon'
                    : myStop && !passedMyStop
                      ? `${etaMinutes(route.id, bus.progress, myStop.at)} min`
                      : myStop
                        ? 'Departed'
                        : `${etaMinutes(route.id, bus.progress, upcoming.at)} min`
                }
              />
              <Detail icon={Users} label="Seats free" value={String(bus.capacity - bus.passengers)} />
            </>
          )}
        </div>
      )}
    </button>
  )
}

function Detail({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div>
      <p className="flex items-center gap-1 text-muted-foreground">
        <Icon className="size-3" aria-hidden="true" />
        {label}
      </p>
      <p className="mt-0.5 font-medium text-foreground">{value}</p>
    </div>
  )
}

function DriverTrip({ bus }: { bus: LiveBus }) {
  const route = getRoute(bus.routeId)
  const upcoming = nextStop(route, bus.progress)
  const completed = bus.status === 'completed'

  return (
    <div className="flex flex-col gap-4 p-1">
      <div className="rounded-2xl bg-primary p-4 text-primary-foreground">
        <p className="text-xs opacity-75">
          Route {route.number} · {bus.code}
        </p>
        <p className="mt-1 text-lg font-semibold">{completed ? 'Trip complete' : `Next: ${upcoming.name}`}</p>
        <p className="mt-0.5 text-sm opacity-80">
          {completed
            ? `Layover · departing again in ${Math.ceil(bus.layover)}s`
            : `${etaMinutes(route.id, bus.progress, upcoming.at)} min away · ${bus.passengers} onboard`}
        </p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-primary-foreground/20">
          <div className="h-full rounded-full bg-signal transition-[width] duration-300 ease-linear" style={{ width: `${bus.progress * 100}%` }} />
        </div>
      </div>

      <ol className="relative flex flex-col gap-4 pl-6" aria-label="Stops">
        <span className="absolute bottom-2 left-[7px] top-2 w-0.5 bg-border" aria-hidden="true" />
        {route.stops.map((stop, i) => {
          const passed = bus.progress >= stop.at
          const isNext = !completed && stop === upcoming
          return (
            <li key={`${stop.name}-${i}`} className="relative flex items-center justify-between gap-2 text-sm">
              <span
                className={cn(
                  'absolute -left-6 top-1/2 size-4 -translate-y-1/2 rounded-full border-2 bg-card',
                  passed ? 'border-chart-5 bg-chart-5' : isNext ? 'border-signal' : 'border-border',
                )}
                aria-hidden="true"
              />
              <span className={cn(passed ? 'text-muted-foreground line-through decoration-border' : 'font-medium', isNext && 'text-signal')}>
                {stop.name}
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {passed ? 'Done' : `${etaMinutes(route.id, bus.progress, stop.at)} min`}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

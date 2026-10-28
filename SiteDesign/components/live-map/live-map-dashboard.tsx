'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import type { Map as LeafletMap } from 'leaflet'
import { Bus, CircleCheck, Clock, Gauge, Route as RouteIcon, Users } from 'lucide-react'
import { etaMinutes, getRoute, nextStop, routes, viewerProfiles, type ViewerRole } from '@/lib/transit-data'
import { useFleetSimulation } from '@/lib/use-fleet-simulation'
import { AppSidebar } from './app-sidebar'
import { LiveBadge, MapControls } from './map-controls'
import { RoleFilter } from './role-filter'
import { RoutePanel, type StatusFilter } from './route-panel'
import { StatPills, type StatPill } from './stat-pills'
import { TopBar } from './top-bar'

const FleetMap = dynamic(() => import('./fleet-map'), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-muted" aria-label="Loading map" />,
})

export function LiveMapDashboard() {
  const [role, setRole] = useState<ViewerRole>('operator')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [fleetFilter, setFleetFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null)
  const [showRoutes, setShowRoutes] = useState(true)
  const [paused, setPaused] = useState(false)
  const [recenterCount, setRecenterCount] = useState(0)
  const [map, setMap] = useState<LeafletMap | null>(null)

  const { fleet, log } = useFleetSimulation(paused)
  const profile = viewerProfiles[role]

  const roleBuses = fleet.filter((bus) => {
    if (role === 'driver') return bus.id === viewerProfiles.driver.busId
    if (role === 'passenger') return (viewerProfiles.passenger.routeIds as readonly string[]).includes(bus.routeId)
    return true
  })

  const q = query.trim().toLowerCase()
  const visibleBuses = roleBuses.filter((bus) => {
    if (role === 'operator' && fleetFilter !== 'all' && bus.fleetId !== fleetFilter) return false
    if (role !== 'driver') {
      if (statusFilter === 'active' && bus.status === 'completed') return false
      if (statusFilter === 'completed' && bus.status !== 'completed') return false
    }
    if (!q) return true
    const route = getRoute(bus.routeId)
    return [bus.code, bus.plate, bus.driver.name, route.name, `route ${route.number}`].some((s) =>
      s.toLowerCase().includes(q),
    )
  })

  const visibleRouteIds =
    role === 'operator' && fleetFilter === 'all' && !q
      ? routes.map((r) => r.id)
      : [...new Set(visibleBuses.map((b) => b.routeId))]

  const effectiveSelectedId =
    role === 'driver' ? viewerProfiles.driver.busId : visibleBuses.some((b) => b.id === selectedBusId) ? selectedBusId : null

  const selectedRouteId = visibleBuses.find((b) => b.id === effectiveSelectedId)?.routeId
  const focusKey = `${role}:${fleetFilter}:${selectedRouteId ?? 'all'}:${recenterCount}`

  const stats = buildStats(role, roleBuses, log.length)

  function changeRole(next: ViewerRole) {
    setRole(next)
    setSelectedBusId(null)
    setStatusFilter('all')
    setFleetFilter('all')
  }

  return (
    <div className="flex min-h-dvh bg-canvas p-0 md:p-6">
      <div className="flex w-full overflow-hidden bg-background md:rounded-[2rem] md:border md:border-border md:shadow-2xl">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar query={query} onQueryChange={setQuery} viewerName={profile.name} viewerSubtitle={profile.subtitle} />

          <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
            <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
              <ol className="flex items-center gap-1.5">
                <li>Overview</li>
                <li aria-hidden="true">{'>'}</li>
                <li className="font-medium text-foreground" aria-current="page">
                  Live map
                </li>
              </ol>
            </nav>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <StatPills items={stats} />
              <RoleFilter value={role} onChange={changeRole} />
            </div>

            <div className="relative flex flex-1 flex-col gap-4 md:block md:min-h-[560px]">
              <div className="relative h-[60vh] overflow-hidden rounded-3xl border border-border md:absolute md:inset-0 md:h-auto">
                <FleetMap
                  fleet={visibleBuses}
                  visibleRouteIds={visibleRouteIds}
                  selectedBusId={effectiveSelectedId}
                  showRoutes={showRoutes}
                  focusKey={focusKey}
                  onSelectBus={setSelectedBusId}
                  onReady={setMap}
                />
                <LiveBadge paused={paused} onToggle={() => setPaused((p) => !p)} />
                <MapControls
                  showRoutes={showRoutes}
                  onShowRoutesChange={setShowRoutes}
                  onZoomIn={() => map?.zoomIn()}
                  onZoomOut={() => map?.zoomOut()}
                  onRecenter={() => {
                    setSelectedBusId(null)
                    setRecenterCount((c) => c + 1)
                  }}
                />
              </div>

              <div className="md:absolute md:bottom-4 md:left-4 md:top-4 md:z-[500] md:w-[340px]">
                <RoutePanel
                  role={role}
                  buses={visibleBuses}
                  selectedBusId={effectiveSelectedId}
                  onSelectBus={(id) => setSelectedBusId((cur) => (cur === id ? null : id))}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  fleetFilter={fleetFilter}
                  onFleetFilterChange={setFleetFilter}
                  log={log}
                />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

function buildStats(role: ViewerRole, buses: ReturnType<typeof useFleetSimulation>['fleet'], completedTrips: number): StatPill[] {
  if (role === 'driver') {
    const bus = buses[0]
    const route = getRoute(bus.routeId)
    const upcoming = nextStop(route, bus.progress)
    return [
      { label: 'Route', value: route.number, icon: RouteIcon, tone: 'signal' },
      {
        label: 'Next stop',
        value: bus.status === 'completed' ? 'Layover' : `${etaMinutes(route.id, bus.progress, upcoming.at)} min`,
        icon: Clock,
        tone: 'sage',
      },
      { label: 'Onboard', value: `${bus.passengers}/${bus.capacity}`, icon: Users, tone: 'primary' },
      { label: 'Progress', value: `${Math.round(bus.progress * 100)}%`, icon: Gauge, tone: 'mist' },
    ]
  }

  const active = buses.filter((b) => b.status !== 'completed').length
  const routeCount = new Set(buses.map((b) => b.routeId)).size

  if (role === 'passenger') {
    const stopName = viewerProfiles.passenger.stopName
    const arrivals = buses
      .filter((b) => b.status !== 'completed')
      .map((b) => {
        const stop = getRoute(b.routeId).stops.find((s) => s.name === stopName)
        return stop && b.progress < stop.at ? etaMinutes(b.routeId, b.progress, stop.at) : null
      })
      .filter((m): m is number => m !== null)
    return [
      { label: 'My buses', value: buses.length, icon: Bus, tone: 'primary' },
      { label: `Next at ${stopName}`, value: arrivals.length ? `${Math.min(...arrivals)} min` : '—', icon: Clock, tone: 'signal' },
      { label: 'Routes followed', value: routeCount, icon: RouteIcon, tone: 'sage' },
    ]
  }

  return [
    { label: 'Total buses', value: buses.length, icon: Bus, tone: 'primary' },
    { label: 'On route', value: active, icon: Gauge, tone: 'sage' },
    { label: 'Trips done', value: completedTrips, icon: CircleCheck, tone: 'mist' },
    { label: 'Routes', value: routeCount, icon: RouteIcon, tone: 'signal' },
  ]
}

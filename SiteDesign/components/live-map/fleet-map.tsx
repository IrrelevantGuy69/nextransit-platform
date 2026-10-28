'use client'

import 'leaflet/dist/leaflet.css'
import L, { type Map as LeafletMap } from 'leaflet'
import { useEffect, useMemo } from 'react'
import { CircleMarker, MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet'
import { MAP_CENTER, positionAlong, routes, traveledPath, type Route } from '@/lib/transit-data'
import type { LiveBus } from '@/lib/use-fleet-simulation'

const BUS_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>'
const CHECK_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>'

type FleetMapProps = {
  fleet: LiveBus[]
  visibleRouteIds: string[]
  selectedBusId: string | null
  showRoutes: boolean
  focusKey: string
  onSelectBus: (id: string) => void
  onReady: (map: LeafletMap) => void
}

export default function FleetMap({
  fleet,
  visibleRouteIds,
  selectedBusId,
  showRoutes,
  focusKey,
  onSelectBus,
  onReady,
}: FleetMapProps) {
  const selectedBus = fleet.find((b) => b.id === selectedBusId) ?? null
  const activeRouteId = selectedBus?.routeId ?? null
  const visibleRoutes = routes.filter((r) => visibleRouteIds.includes(r.id))
  const focusRoutes = activeRouteId ? visibleRoutes.filter((r) => r.id === activeRouteId) : visibleRoutes

  return (
    <MapContainer
      center={MAP_CENTER}
      zoom={14}
      zoomControl={false}
      scrollWheelZoom
      ref={(map) => {
        if (map) onReady(map)
      }}
      className="size-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="map-tiles"
      />
      <FocusController focusKey={focusKey} routes={focusRoutes} />

      {showRoutes &&
        visibleRoutes.map((route) => (
          <RouteLayer
            key={route.id}
            route={route}
            active={route.id === activeRouteId}
            dimmed={activeRouteId !== null && route.id !== activeRouteId}
          />
        ))}

      {selectedBus && showRoutes && selectedBus.status !== 'completed' && (
        <Polyline
          positions={traveledPath(routes.find((r) => r.id === selectedBus.routeId)!, selectedBus.progress)}
          pathOptions={{ className: 'route-line route-line--progress', weight: 5, lineCap: 'round' }}
          interactive={false}
        />
      )}

      {fleet.map((bus) => (
        <BusMarker
          key={bus.id}
          bus={bus}
          selected={bus.id === selectedBusId}
          onSelect={() => onSelectBus(bus.id)}
        />
      ))}
    </MapContainer>
  )
}

function RouteLayer({ route, active, dimmed }: { route: Route; active: boolean; dimmed: boolean }) {
  const badgePosition = positionAlong(route, 0.5).latlng
  const badgeIcon = useMemo(
    () =>
      L.divIcon({
        className: '',
        html: `<span class="route-badge ${active ? 'route-badge--active' : ''}">${route.number}</span>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      }),
    [route.number, active],
  )
  const lineClass = `route-line ${active ? 'route-line--active' : ''} ${dimmed ? 'route-line--dim' : ''}`

  return (
    <>
      <Polyline
        positions={route.path}
        pathOptions={{ className: lineClass, weight: active ? 4 : 3, lineJoin: 'round', lineCap: 'round' }}
        interactive={false}
      />
      {(!dimmed || active) &&
        route.stops.map((stop, i) => (
          <CircleMarker
            key={`${stop.name}-${i}`}
            center={positionAlong(route, stop.at).latlng}
            radius={active ? 5 : 4}
            pathOptions={{ className: `stop-dot ${active ? 'stop-dot--active' : ''}`, weight: 2, fillOpacity: 1 }}
          >
            <Tooltip direction="top" offset={[0, -4]}>
              {stop.name}
            </Tooltip>
          </CircleMarker>
        ))}
      <Marker position={badgePosition} icon={badgeIcon} interactive={false} zIndexOffset={active ? 500 : 0} />
    </>
  )
}

function BusMarker({ bus, selected, onSelect }: { bus: LiveBus; selected: boolean; onSelect: () => void }) {
  const route = routes.find((r) => r.id === bus.routeId)!
  const { latlng, heading } = positionAlong(route, bus.progress)
  const roundedHeading = Math.round(heading / 15) * 15
  const completed = bus.status === 'completed'

  const icon = useMemo(() => {
    const classes = [
      'bus-marker',
      completed && 'bus-marker--completed',
      !completed && bus.status === 'delayed' && 'bus-marker--delayed',
      selected && 'bus-marker--selected',
    ]
      .filter(Boolean)
      .join(' ')
    const headingEl = completed
      ? ''
      : `<span class="bus-marker__heading" style="rotate:${roundedHeading}deg"></span>`
    return L.divIcon({
      className: '',
      html: `<div class="${classes}">${headingEl}${completed ? CHECK_SVG : BUS_SVG}<span class="bus-marker__label">${bus.code}</span></div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    })
  }, [bus.code, bus.status, completed, selected, roundedHeading])

  return (
    <Marker
      position={latlng}
      icon={icon}
      zIndexOffset={selected ? 1000 : completed ? -100 : 0}
      eventHandlers={{ click: onSelect }}
      title={`${bus.code} on route ${route.number}`}
      keyboard
    />
  )
}

function FocusController({ focusKey, routes: focusRoutes }: { focusKey: string; routes: Route[] }) {
  const map = useMap()

  useEffect(() => {
    if (focusRoutes.length === 0) return
    map.invalidateSize()
    const bounds = L.latLngBounds(focusRoutes.flatMap((r) => r.path))
    const wide = map.getContainer().clientWidth >= 768
    map.flyToBounds(bounds, {
      paddingTopLeft: [wide ? 380 : 24, 72],
      paddingBottomRight: [wide ? 80 : 24, 40],
      duration: 0.8,
      maxZoom: 16,
    })
    // Re-fit only when the focus target changes, not on every simulation tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey, map])

  return null
}

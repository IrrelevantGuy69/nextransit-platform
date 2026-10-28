export type LatLng = [number, number]

export type Stop = { name: string; at: number }

export type Route = {
  id: string
  number: number
  name: string
  from: string
  to: string
  path: LatLng[]
  stops: Stop[]
}

export type Fleet = { id: string; name: string }

export type Bus = {
  id: string
  code: string
  plate: string
  routeId: string
  fleetId: string
  driver: { name: string; phone: string }
  capacity: number
  passengers: number
  speed: number
  startProgress: number
  delayed?: boolean
}

export type ViewerRole = 'operator' | 'driver' | 'passenger'

export const fleets: Fleet[] = [
  { id: 'north', name: 'North Depot' },
  { id: 'harbor', name: 'Harbor Depot' },
]

export const routes: Route[] = [
  {
    id: 'r1',
    number: 1,
    name: 'Market Line',
    from: 'Ferry Terminal',
    to: 'Mission & 20th',
    path: [
      [37.7955, -122.3937],
      [37.7897, -122.401],
      [37.7845, -122.4075],
      [37.7793, -122.414],
      [37.7752, -122.4192],
      [37.77, -122.42],
      [37.7648, -122.4196],
      [37.7586, -122.4189],
    ],
    stops: [
      { name: 'Ferry Terminal', at: 0 },
      { name: 'Montgomery', at: 0.22 },
      { name: 'Powell', at: 0.42 },
      { name: 'Van Ness', at: 0.64 },
      { name: '16th Street', at: 0.84 },
      { name: 'Mission & 20th', at: 1 },
    ],
  },
  {
    id: 'r2',
    number: 2,
    name: 'Civic Loop',
    from: 'Civic Center',
    to: 'Japantown',
    path: [
      [37.7793, -122.4193],
      [37.7835, -122.417],
      [37.787, -122.4225],
      [37.7905, -122.4285],
      [37.788, -122.434],
      [37.7838, -122.433],
      [37.7808, -122.4262],
      [37.7793, -122.4193],
    ],
    stops: [
      { name: 'Civic Center', at: 0 },
      { name: 'Polk Street', at: 0.18 },
      { name: 'Pacific Heights', at: 0.45 },
      { name: 'Japantown', at: 0.68 },
      { name: 'Hayes Valley', at: 0.86 },
      { name: 'Civic Center', at: 1 },
    ],
  },
  {
    id: 'r3',
    number: 3,
    name: 'North Shore',
    from: 'North Beach',
    to: 'Embarcadero',
    path: [
      [37.8027, -122.4148],
      [37.8005, -122.41],
      [37.7975, -122.408],
      [37.794, -122.406],
      [37.792, -122.4],
      [37.788, -122.396],
    ],
    stops: [
      { name: 'North Beach', at: 0 },
      { name: 'Washington Sq', at: 0.3 },
      { name: 'Chinatown', at: 0.6 },
      { name: 'Embarcadero', at: 1 },
    ],
  },
  {
    id: 'r4',
    number: 4,
    name: 'SoMa Connector',
    from: 'Caltrain Depot',
    to: 'Potrero Hill',
    path: [
      [37.7765, -122.3945],
      [37.781, -122.3995],
      [37.7765, -122.4055],
      [37.772, -122.4],
      [37.769, -122.406],
      [37.7655, -122.411],
      [37.7618, -122.4085],
    ],
    stops: [
      { name: 'Caltrain Depot', at: 0 },
      { name: 'Moscone', at: 0.24 },
      { name: 'SoMa Yards', at: 0.5 },
      { name: 'Design District', at: 0.76 },
      { name: 'Potrero Hill', at: 1 },
    ],
  },
  {
    id: 'r5',
    number: 5,
    name: 'Duboce Shuttle',
    from: 'Lower Haight',
    to: 'Castro',
    path: [
      [37.773, -122.431],
      [37.7745, -122.425],
      [37.772, -122.424],
      [37.769, -122.429],
      [37.766, -122.43],
      [37.7625, -122.4348],
    ],
    stops: [
      { name: 'Lower Haight', at: 0 },
      { name: 'Duboce Park', at: 0.4 },
      { name: 'Church St', at: 0.7 },
      { name: 'Castro', at: 1 },
    ],
  },
]

export const buses: Bus[] = [
  {
    id: 'b1',
    code: 'VB-A1',
    plate: 'KX-5417',
    routeId: 'r2',
    fleetId: 'north',
    driver: { name: 'Marcus Lee', phone: '415-779-6588' },
    capacity: 40,
    passengers: 27,
    speed: 1 / 70,
    startProgress: 0.35,
  },
  {
    id: 'b2',
    code: 'VB-A2',
    plate: 'KX-2208',
    routeId: 'r1',
    fleetId: 'north',
    driver: { name: 'Priya Natarajan', phone: '415-310-4421' },
    capacity: 40,
    passengers: 33,
    speed: 1 / 80,
    startProgress: 0.12,
  },
  {
    id: 'b3',
    code: 'VB-B4',
    plate: 'HB-9031',
    routeId: 'r1',
    fleetId: 'harbor',
    driver: { name: 'Diego Alvarez', phone: '415-552-0193' },
    capacity: 52,
    passengers: 18,
    speed: 1 / 85,
    startProgress: 0.66,
  },
  {
    id: 'b4',
    code: 'VB-B7',
    plate: 'HB-4470',
    routeId: 'r3',
    fleetId: 'harbor',
    driver: { name: 'Hana Sato', phone: '415-208-7765' },
    capacity: 40,
    passengers: 12,
    speed: 1 / 50,
    startProgress: 0.86,
  },
  {
    id: 'b5',
    code: 'VB-C2',
    plate: 'KX-6612',
    routeId: 'r4',
    fleetId: 'north',
    driver: { name: 'Owen Brooks', phone: '415-874-3302' },
    capacity: 52,
    passengers: 41,
    speed: 1 / 110,
    startProgress: 0.48,
    delayed: true,
  },
  {
    id: 'b6',
    code: 'VB-C5',
    plate: 'HB-1184',
    routeId: 'r5',
    fleetId: 'harbor',
    driver: { name: 'Leila Haddad', phone: '415-617-9028' },
    capacity: 30,
    passengers: 9,
    speed: 1 / 45,
    startProgress: 0.93,
  },
  {
    id: 'b7',
    code: 'VB-A6',
    plate: 'KX-3049',
    routeId: 'r2',
    fleetId: 'north',
    driver: { name: 'Tom Becker', phone: '415-449-1276' },
    capacity: 40,
    passengers: 22,
    speed: 1 / 75,
    startProgress: 0.82,
  },
]

export const viewerProfiles = {
  operator: { name: 'Fleet Operations', subtitle: 'All depots' },
  driver: { name: 'Priya Natarajan', subtitle: 'Driving VB-A2', busId: 'b2' },
  passenger: {
    name: 'Alex Rivera',
    subtitle: 'Following 2 routes',
    routeIds: ['r1', 'r2'],
    stopName: 'Van Ness',
  },
} as const

export const MAP_CENTER: LatLng = [37.7815, -122.4155]

export function getRoute(id: string) {
  return routes.find((r) => r.id === id)!
}

function haversine([lat1, lng1]: LatLng, [lat2, lng2]: LatLng) {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

const routeMetrics = new Map(
  routes.map((r) => {
    const cumulative = [0]
    for (let i = 1; i < r.path.length; i++) {
      cumulative.push(cumulative[i - 1] + haversine(r.path[i - 1], r.path[i]))
    }
    return [r.id, { cumulative, length: cumulative[cumulative.length - 1] }]
  }),
)

export function routeLength(routeId: string) {
  return routeMetrics.get(routeId)!.length
}

export function positionAlong(route: Route, progress: number): { latlng: LatLng; heading: number } {
  const { cumulative, length } = routeMetrics.get(route.id)!
  const target = Math.min(Math.max(progress, 0), 1) * length
  let i = 1
  while (i < cumulative.length - 1 && cumulative[i] < target) i++
  const segStart = cumulative[i - 1]
  const segLen = cumulative[i] - segStart || 1
  const t = (target - segStart) / segLen
  const [aLat, aLng] = route.path[i - 1]
  const [bLat, bLng] = route.path[i]
  const heading = (Math.atan2(bLng - aLng, bLat - aLat) * 180) / Math.PI
  return { latlng: [aLat + (bLat - aLat) * t, aLng + (bLng - aLng) * t], heading }
}

export function traveledPath(route: Route, progress: number): LatLng[] {
  const { cumulative, length } = routeMetrics.get(route.id)!
  const target = Math.min(Math.max(progress, 0), 1) * length
  const points = route.path.filter((_, i) => cumulative[i] < target)
  return [...points, positionAlong(route, progress).latlng]
}

const CITY_BUS_SPEED_MS = 6.5

export function etaMinutes(routeId: string, fromProgress: number, toProgress: number) {
  const meters = Math.max(toProgress - fromProgress, 0) * routeLength(routeId)
  return Math.max(1, Math.round(meters / CITY_BUS_SPEED_MS / 60))
}

export function nextStop(route: Route, progress: number) {
  return route.stops.find((s) => s.at > progress + 0.001) ?? route.stops[route.stops.length - 1]
}

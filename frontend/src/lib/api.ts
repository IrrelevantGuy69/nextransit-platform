export type UserRole = 'RIDER' | 'DRIVER' | 'OPERATOR_ADMIN' | 'SUPER_ADMIN';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  sector_type?: 'UNIVERSITY_CAMPUS' | 'CORPORATE_SHUTTLE' | 'PRIVATE_CHARTER' | string;
  created_at: string;
}

export interface User {
  id: string;
  tenant_id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  oidc_sub?: string;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
  tenant_id?: string;
  tenant_slug?: string;
  workspace_slug?: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  tenant_id: string;
  role: UserRole;
  full_name?: string;
}

export interface Bus {
  id: string;
  tenant_id: string;
  fleet_code: string;
  plate_number: string;
  model: string;
  capacity: number;
  status: string;
  trip_status?: 'IN_TRANSIT' | 'AT_STOP' | 'JOURNEY_ENDED' | string;
  current_stop_sequence?: number;
  progress_pct?: number;
  trip_ended_at?: string;
  is_detour?: boolean;
  detour_reason?: string;
  detour_lat?: number;
  detour_lng?: number;
  bypassed_stop_sequences?: number[];
  route_variant?: 'PRIMARY_ROUTE_1' | 'ALTERNATE_ROUTE_2' | string;
  traffic_level?: 'NORMAL' | 'MODERATE' | 'HEAVY' | string;
  delay_minutes?: number;
  dwell_seconds?: number;
  segment_progress?: number;
  created_at: string;
}

export interface CreateBusRequest {
  tenant_id?: string;
  fleet_code: string;
  plate_number: string;
  model: string;
  capacity: number;
  status?: string;
  route_id?: string;
}

export interface Stop {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

export interface CreateStopRequest {
  tenant_id?: string;
  name: string;
  code: string;
  latitude: number;
  longitude: number;
}

export interface Route {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  origin: string;
  destination: string;
  distance_km: number;
  estimated_minutes: number;
  active: boolean;
  primary_polyline?: [number, number][];
  alternate_polyline?: [number, number][];
  created_at: string;
}

export interface BusTelemetry {
  recorded_at: string;
  tenant_id: string;
  bus_id: string;
  route_id?: string;
  latitude: number;
  longitude: number;
  speed_kmh: number;
  heading_deg: number;
  occupancy: number;
  trip_status?: string;
  progress_pct?: number;
  route_progress?: number;
}

export interface BusSnapshot {
  recorded_at: string;
  tenant_id: string;
  bus_id: string;
  fleet_code: string;
  plate_number: string;
  model: string;
  capacity: number;
  bus_status: string;
  trip_status?: 'IN_TRANSIT' | 'AT_STOP' | 'JOURNEY_ENDED' | string;
  current_stop_sequence?: number;
  progress_pct?: number;
  route_progress?: number;
  trip_ended_at?: string;
  route_id?: string;
  route_code: string;
  route_name: string;
  latitude: number;
  longitude: number;
  speed_kmh: number;
  heading_deg: number;
  occupancy: number;
  is_detour?: boolean;
  detour_reason?: string;
  detour_lat?: number;
  detour_lng?: number;
  bypassed_stop_sequences?: number[];
  detour_geometry?: [number, number][];
  detour_delay_sec?: number;
  detour_extra_km?: number;
  detour_step_index?: number;
  detour_waypoints?: [number, number][];
  route_variant?: 'PRIMARY_ROUTE_1' | 'ALTERNATE_ROUTE_2' | string;
  traffic_level?: 'NORMAL' | 'MODERATE' | 'HEAVY' | string;
  delay_minutes?: number;
  dwell_seconds?: number;
  segment_progress?: number;
  primary_polyline?: [number, number][];
  alternate_polyline?: [number, number][];
}

export interface IngestTelemetryRequest {
  tenant_id?: string;
  bus_id: string;
  route_id?: string;
  latitude: number;
  longitude: number;
  speed_kmh: number;
  heading_deg: number;
  occupancy: number;
}

export interface StopETA {
  route_id: string;
  stop_id: string;
  stop_name: string;
  stop_code: string;
  stop_latitude: number;
  stop_longitude: number;
  stop_sequence: number;
  bus_id: string;
  fleet_code: string;
  bus_speed_kmh: number;
  distance_meters: number;
  distance_km: number;
  eta_minutes: number;
  min_eta_minutes?: number;
  max_eta_minutes?: number;
  status?: 'PASSED' | 'ARRIVING_NOW' | 'ARRIVED' | 'UPCOMING' | 'TERMINAL_REACHED' | 'BYPASSED_DETOUR' | string;
  historical_avg_sec?: number;
  mae_minutes?: number;
  on_time_pct?: number;
  is_detour?: boolean;
  detour_delay_min?: number;
  bypassed?: boolean;
  detour_reason?: string;
  detour_lat?: number;
  detour_lng?: number;
  detour_delay_sec?: number;
  detour_extra_km?: number;
  route_variant?: string;
  traffic_level?: string;
  delay_minutes?: number;
  dwell_seconds?: number;
  next_loop_eta_minutes?: number;
}

export interface TransitEvent {
  id: string;
  tenant_id: string;
  bus_id: string;
  fleet_code: string;
  route_id?: string;
  route_code: string;
  stop_id?: string;
  stop_name: string;
  event_type: 'APPROACHING' | 'ARRIVED' | 'DEPARTED' | 'JOURNEY_COMPLETED' | 'TRIP_RESET' | string;
  triggered_at: string;
  distance_meters: number;
}

export interface ResetTripRequest {
  bus_id: string;
}

export interface Trip {
  id: string;
  tenant_id: string;
  bus_id: string;
  fleet_code: string;
  plate_number: string;
  route_id: string;
  route_code: string;
  route_name: string;
  departure_time: string;
  status: string;
  created_at: string;
}

export interface SeatInventory {
  id: string;
  tenant_id: string;
  trip_id: string;
  seat_number: string;
  status: 'AVAILABLE' | 'HELD' | 'BOOKED';
  held_by_user_id?: string;
  held_until?: string;
  booked_by_user_id?: string;
  booked_at?: string;
  qr_token?: string;
  checked_in?: boolean;
  checked_in_at?: string;
  remaining_sec: number;
}

export interface Booking {
  id: string;
  tenant_id: string;
  trip_id: string;
  user_id: string;
  seat_number: string;
  ticket_code: string;
  status: 'CONFIRMED' | 'CANCELLED';
  qr_payload: string;
  created_at: string;
}

export interface HoldSeatRequest {
  seat_number: string;
}

export interface BookSeatRequest {
  seat_number: string;
}

export interface ConcurrencyClashRequest {
  seat_number?: string;
  attempts?: number;
}

export interface ConcurrencyClashResult {
  target_seat: string;
  total_attempts: number;
  success_count: number;
  conflict_count: number;
  winner_user_id: string;
  conflict_errors: string[];
  execution_time_ms: number;
}

export interface DriverSyncPing {
  sequence: number;
  lat: number;
  lng: number;
  speed: number;
  timestamp: string;
}

export interface DriverSyncBatchRequest {
  batch_id: string;
  bus_id?: string;
  trip_id?: string;
  events: DriverSyncPing[];
}

export interface DriverSyncBatchResponse {
  synced_count: number;
  duplicate_count: number;
  server_time: string;
}

export interface AuditLog {
  id: string;
  tenant_id: string;
  actor_user_id?: string;
  action: string;
  target_entity: string;
  target_id?: string;
  metadata: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

export interface DemandSuggestion {
  route_id: string;
  route_name: string;
  route_code: string;
  segment: string;
  bottleneck_stop?: string;
  load_factor_pct?: number;
  booking_density_pct: number;
  current_headway_min?: number;
  current_headway_mins: number;
  recommended_headway_min?: number;
  recommended_headway_mins?: number;
  extra_buses_needed?: number;
  peak_window: string;
  optimization_reason?: string;
  recommendation: string;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  created_at: string;
}

export interface ApplySuggestionRequest {
  route_id: string;
  recommended_headway_min: number;
  extra_buses_needed: number;
}

export interface ApplySuggestionResponse {
  status: string;
  route_id: string;
  route_code: string;
  new_headway_min: number;
  extra_buses_dispatched: number;
  applied_at: string;
  message: string;
}

export interface WebhookTestRequest {
  event: 'trip.arrived' | 'seat.booked' | 'schedule.optimized';
}

export interface WebhookTestResponse {
  status: string;
  event: string;
  signature: string;
  delivery_status: number;
  payload: {
    event: string;
    timestamp: string;
    tenant_id: string;
    publisher: string;
    data: Record<string, string | number | boolean>;
  };
}

export type ChaosScenario = 'SCENARIO_LATENCY' | 'SCENARIO_PACKET_DROP' | 'SCENARIO_CONCURRENT_SPIKE';

export interface ChaosTestRequest {
  scenario: ChaosScenario;
  tenant_id?: string;
}

export interface ChaosTestReport {
  scenario: string;
  success: boolean;
  latency_p99_ms: number;
  message: string;
}

export interface GtfsRtHeader {
  gtfs_realtime_version: string;
  incrementality: string;
  timestamp: number;
}

export interface GtfsRtPosition {
  latitude: number;
  longitude: number;
  bearing: number;
  speed: number;
}

export interface GtfsRtTripDescriptor {
  trip_id: string;
  route_id: string;
  schedule_relationship?: string;
}

export interface GtfsRtVehicleDescriptor {
  id: string;
  label: string;
  license_plate?: string;
}

export interface GtfsRtVehiclePosition {
  trip?: GtfsRtTripDescriptor;
  position: GtfsRtPosition;
  current_stop_sequence: number;
  current_status: string;
  timestamp: number;
  congestion_level: string;
  occupancy_status: string;
  vehicle?: GtfsRtVehicleDescriptor;
}

export interface GtfsRtVehicleEntity {
  id: string;
  vehicle: GtfsRtVehiclePosition;
}

export interface GtfsRtVehicleFeed {
  header: GtfsRtHeader;
  entity: GtfsRtVehicleEntity[];
}

export interface GtfsRtStopTimeEvent {
  delay: number;
  time: number;
}

export interface GtfsRtStopTimeUpdate {
  stop_sequence: number;
  stop_id: string;
  arrival?: GtfsRtStopTimeEvent;
  departure?: GtfsRtStopTimeEvent;
}

export interface GtfsRtTripUpdate {
  trip: GtfsRtTripDescriptor;
  vehicle?: GtfsRtVehicleDescriptor;
  stop_time_update: GtfsRtStopTimeUpdate[];
  timestamp: number;
}

export interface GtfsRtTripEntity {
  id: string;
  trip_update: GtfsRtTripUpdate;
}

export interface GtfsRtTripFeed {
  header: GtfsRtHeader;
  entity: GtfsRtTripEntity[];
}

export interface PublicCatalogResponse {
  version: string;
  generated_at: string;
  tenants: Array<{ id: string; name: string; slug: string }>;
  routes: Array<{
    id: string;
    tenant_id: string;
    name: string;
    code: string;
    origin: string;
    destination: string;
    distance_km: number;
    estimated_minutes: number;
  }>;
  stops: Array<{
    id: string;
    tenant_id: string;
    name: string;
    code: string;
    latitude: number;
    longitude: number;
  }>;
}

export interface LoadTestResult {
  total_pings: number;
  duration_ms: number;
  throughput_pings_sec: number;
  errors: number;
}

export type SimulateStepResponse = BusTelemetry[] | { status: string; updated_buses?: number };

export interface CreateRouteStopRequest {
  name: string;
  code?: string;
  latitude: number;
  longitude: number;
  sequence: number;
}

export interface CreateRouteRequest {
  tenant_id?: string;
  name: string;
  code: string;
  origin?: string;
  destination?: string;
  distance_km?: number;
  estimated_minutes?: number;
  assign_bus_id?: string;
  stops?: CreateRouteStopRequest[];
  active?: boolean;
  primary_polyline?: [number, number][];
  alternate_polyline?: [number, number][];
}

export interface DevTokenRequest {
  sub?: string;
  tenant_id?: string;
  role: UserRole;
}

export interface DevTokenResponse {
  token: string;
  sub: string;
  tenant_id: string;
  role: UserRole;
}

export interface CreateTenantRequest {
  name: string;
  slug: string;
  sector_type?: 'UNIVERSITY_CAMPUS' | 'CORPORATE_SHUTTLE' | 'PRIVATE_CHARTER' | string;
}

export interface BusDetourRequest {
  bus_id: string;
  active?: boolean;
  is_detour: boolean;
  reason?: string;
  detour_reason?: string;
  bypass_next_stop?: boolean;
  detour_lat?: number;
  detour_lng?: number;
  bypassed_stops?: number[];
}

export interface BusDetourResponse {
  success: boolean;
  bus_id: string;
  is_detour: boolean;
  detour_reason: string;
  detour_lat?: number;
  detour_lng?: number;
  bypassed_stops: number[];
  geometry?: [number, number][];
  distance_meters?: number;
  duration_seconds?: number;
  detour_delay_sec?: number;
  detour_extra_km?: number;
  detour_step_index?: number;
  detour_waypoints?: [number, number][];
  message: string;
}

export interface SeatWaitlist {
  id: string;
  tenant_id: string;
  trip_id: string;
  route_id: string;
  rider_name: string;
  rider_email: string;
  preferred_seat?: string;
  boarding_stop_id?: string;
  status: 'WAITING' | 'CONFIRMED' | 'CANCELLED' | string;
  promoted_seat?: string;
  created_at: string;
  position?: number;
}

export interface JoinWaitlistRequest {
  trip_id: string;
  route_id?: string;
  rider_name: string;
  rider_email: string;
  preferred_seat?: string;
  boarding_stop_id?: string;
}

export interface CancelSeatRequest {
  trip_id: string;
  seat_number: string;
}

export interface CancelSeatResponse {
  success: boolean;
  trip_id: string;
  seat_number: string;
  promoted: boolean;
  promoted_rider?: string;
  promoted_email?: string;
  qr_token?: string;
  message: string;
}

export interface CheckInQRRequest {
  trip_id: string;
  seat_number: string;
  qr_token: string;
}

export interface CheckInQRResponse {
  success: boolean;
  trip_id: string;
  seat_number: string;
  checked_in: boolean;
  checked_in_at: string;
  message: string;
}

export interface CreateUserRequest {
  tenant_id?: string;
  email: string;
  role: UserRole;
  oidc_sub?: string;
}

export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
  }

  setToken(token: string | null): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('transit_auth_token', token);
        document.cookie = `transit_auth_token=${token}; path=/; max-age=86400; SameSite=Lax`;
        document.cookie = `auth_token=${token}; path=/; max-age=86400; SameSite=Lax`;
      } else {
        localStorage.removeItem('nextransit_auth');
        localStorage.removeItem('transit_auth_token');
        localStorage.removeItem('token');
        sessionStorage.clear();
        document.cookie = 'transit_auth_token=; path=/; max-age=0; SameSite=Lax';
        document.cookie = 'auth_token=; path=/; max-age=0; SameSite=Lax';
      }
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      const stored = localStorage.getItem('transit_auth_token');
      if (stored) {
        this.token = stored;
      } else {
        const nextAuth = localStorage.getItem('nextransit_auth');
        if (nextAuth) {
          try {
            const parsed = JSON.parse(nextAuth);
            if (parsed && typeof parsed.token === 'string') {
              this.token = parsed.token;
            }
          } catch {}
        }
      }
    }
    return this.token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const effectiveToken = this.getToken();
    if (effectiveToken) {
      headers['Authorization'] = `Bearer ${effectiveToken}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data.error || `HTTP ${response.status}: ${response.statusText}`;
      const error = new Error(message);
      (error as Error & { status?: number; data?: unknown }).status = response.status;
      (error as Error & { status?: number; data?: unknown }).data = data;
      throw error;
    }

    return data as T;
  }

  async login(req: LoginRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  async signUp(req: SignUpRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/v1/auth/signup', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  async logout(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/api/v1/auth/logout', {
      method: 'POST',
    });
  }

  async getAuthMe(): Promise<User> {
    const res = await this.request<User & { user?: User }>('/api/v1/auth/me');
    if (res && res.user && res.user.tenant_id) {
      return { ...res.user, ...res };
    }
    return res;
  }

  async getHealth(): Promise<{ status: string; time: string }> {
    return this.request<{ status: string; time: string }>('/health');
  }

  async mintDevToken(req: DevTokenRequest): Promise<DevTokenResponse> {
    return this.request<DevTokenResponse>('/api/v1/auth/dev-token', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  async getTenants(): Promise<Tenant[]> {
    return this.request<Tenant[]>('/api/v1/tenants');
  }

  async createTenant(req: CreateTenantRequest): Promise<Tenant> {
    return this.request<Tenant>('/api/v1/tenants', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  async getUsers(tenantHeader?: string): Promise<User[]> {
    const headers: Record<string, string> = {};
    if (tenantHeader) {
      headers['X-Tenant-ID'] = tenantHeader;
    }
    return this.request<User[]>('/api/v1/users', { headers });
  }

  async createUser(req: CreateUserRequest): Promise<User> {
    return this.request<User>('/api/v1/users', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  async getBuses(tenantHeader?: string): Promise<Bus[]> {
    const headers: Record<string, string> = {};
    if (tenantHeader) {
      headers['X-Tenant-ID'] = tenantHeader;
    }
    return this.request<Bus[]>('/api/v1/buses', { headers });
  }

  async createBus(req: CreateBusRequest): Promise<Bus> {
    return this.request<Bus>('/api/v1/buses', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  async getStops(tenantHeader?: string): Promise<Stop[]> {
    const headers: Record<string, string> = {};
    if (tenantHeader) {
      headers['X-Tenant-ID'] = tenantHeader;
    }
    return this.request<Stop[]>('/api/v1/stops', { headers });
  }

  async createStop(req: CreateStopRequest): Promise<Stop> {
    return this.request<Stop>('/api/v1/stops', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  async getRoutes(tenantHeader?: string): Promise<Route[]> {
    const headers: Record<string, string> = {};
    if (tenantHeader) {
      headers['X-Tenant-ID'] = tenantHeader;
    }
    return this.request<Route[]>('/api/v1/routes', { headers });
  }

  async createRoute(req: CreateRouteRequest): Promise<Route> {
    return this.request<Route>('/api/v1/routes', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  async ingestTelemetry(req: IngestTelemetryRequest, tenantHeader?: string): Promise<{ status: string }> {
    const headers: Record<string, string> = {};
    if (tenantHeader) {
      headers['X-Tenant-ID'] = tenantHeader;
    }
    return this.request<{ status: string }>('/api/v1/telemetry', {
      method: 'POST',
      headers,
      body: JSON.stringify(req),
    });
  }

  async getLatestTelemetry(tenantHeader?: string): Promise<BusSnapshot[]> {
    const headers: Record<string, string> = {};
    if (tenantHeader) {
      headers['X-Tenant-ID'] = tenantHeader;
    }
    return this.request<BusSnapshot[]>('/api/v1/telemetry/latest', { headers });
  }

  async getETAs(tenantHeader?: string, routeId?: string): Promise<StopETA[]> {
    const headers: Record<string, string> = {};
    if (tenantHeader) {
      headers['X-Tenant-ID'] = tenantHeader;
    }
    const path = routeId ? `/api/v1/telemetry/etas?route_id=${encodeURIComponent(routeId)}` : '/api/v1/telemetry/etas';
    return this.request<StopETA[]>(path, { headers });
  }

  async getRouteETAs(routeId: string, tenantHeader?: string): Promise<StopETA[]> {
    const headers: Record<string, string> = {};
    if (tenantHeader) {
      headers['X-Tenant-ID'] = tenantHeader;
    }
    return this.request<StopETA[]>(`/api/v1/routes/${routeId}/etas`, { headers });
  }

  async simulateTelemetryStep(
    tenantHeader?: string,
    routeId?: string,
    busId?: string,
  ): Promise<BusTelemetry[]> {
    const headers: Record<string, string> = {};
    if (tenantHeader) {
      headers['X-Tenant-ID'] = tenantHeader;
    }
    const body: { route_id?: string; bus_id?: string } = {};
    if (routeId) body.route_id = routeId;
    if (busId) body.bus_id = busId;

    return this.request<BusTelemetry[]>('/api/v1/telemetry/simulate-step', {
      method: 'POST',
      headers,
      body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
    });
  }

  async resetTrip(busId: string, tenantHeader?: string): Promise<{ status: string; bus_id: string }> {
    const headers: Record<string, string> = {};
    if (tenantHeader) {
      headers['X-Tenant-ID'] = tenantHeader;
    }
    return this.request<{ status: string; bus_id: string }>('/api/v1/telemetry/reset-trip', {
      method: 'POST',
      headers,
      body: JSON.stringify({ bus_id: busId }),
    });
  }

  async getEvents(limit: number = 20, tenantHeader?: string): Promise<TransitEvent[]> {
    const headers: Record<string, string> = {};
    if (tenantHeader) {
      headers['X-Tenant-ID'] = tenantHeader;
    }
    return this.request<TransitEvent[]>(`/api/v1/events?limit=${limit}`, { headers });
  }

  async seedDemoData(): Promise<{ tenants: Tenant[]; users: User[] }> {
    const superTokenRes = await this.mintDevToken({ role: 'SUPER_ADMIN' });
    this.setToken(superTokenRes.token);

    const suffix = Math.floor(Math.random() * 1000);
    const tenant1 = await this.createTenant({
      name: 'IIIT Una Transport',
      slug: `iiit-una-${suffix}`,
    });

    const tenant2 = await this.createTenant({
      name: 'Himachal Express',
      slug: `himachal-express-${suffix}`,
    });

    const t1TokenRes = await this.mintDevToken({
      tenant_id: tenant1.id,
      role: 'OPERATOR_ADMIN',
    });
    this.setToken(t1TokenRes.token);

    await this.createUser({
      tenant_id: tenant1.id,
      email: `admin@iiituna-${suffix}.ac.in`,
      role: 'OPERATOR_ADMIN',
    });
    await this.createUser({
      tenant_id: tenant1.id,
      email: `driver.ramesh@iiituna-${suffix}.ac.in`,
      role: 'DRIVER',
    });
    await this.createUser({
      tenant_id: tenant1.id,
      email: `student.aarav@iiituna-${suffix}.ac.in`,
      role: 'RIDER',
    });

    const t2TokenRes = await this.mintDevToken({
      tenant_id: tenant2.id,
      role: 'OPERATOR_ADMIN',
    });
    this.setToken(t2TokenRes.token);

    await this.createUser({
      tenant_id: tenant2.id,
      email: `ops@himachal-${suffix}.in`,
      role: 'OPERATOR_ADMIN',
    });
    await this.createUser({
      tenant_id: tenant2.id,
      email: `driver.vikram@himachal-${suffix}.in`,
      role: 'DRIVER',
    });
    await this.createUser({
      tenant_id: tenant2.id,
      email: `passenger.priya@himachal-${suffix}.in`,
      role: 'RIDER',
    });

    const allTenants = await this.getTenants();
    this.setToken(t1TokenRes.token);
    const users = await this.getUsers();

    return { tenants: allTenants, users };
  }

  async getTrips(tenantHeader?: string): Promise<Trip[]> {
    const headers: Record<string, string> = {};
    if (tenantHeader) {
      headers['X-Tenant-ID'] = tenantHeader;
    }
    return this.request<Trip[]>('/api/v1/trips', { headers });
  }

  async getTripSeats(tripID: string, tenantHeader?: string): Promise<SeatInventory[]> {
    const headers: Record<string, string> = {};
    if (tenantHeader) {
      headers['X-Tenant-ID'] = tenantHeader;
    }
    return this.request<SeatInventory[]>(`/api/v1/trips/${tripID}/seats`, { headers });
  }

  async holdSeat(tripID: string, req: HoldSeatRequest, tenantHeader?: string): Promise<SeatInventory> {
    const headers: Record<string, string> = {};
    if (tenantHeader) {
      headers['X-Tenant-ID'] = tenantHeader;
    }
    return this.request<SeatInventory>(`/api/v1/trips/${tripID}/hold-seat`, {
      method: 'POST',
      headers,
      body: JSON.stringify(req),
    });
  }

  async bookSeat(tripID: string, req: BookSeatRequest, tenantHeader?: string): Promise<Booking> {
    const headers: Record<string, string> = {};
    if (tenantHeader) {
      headers['X-Tenant-ID'] = tenantHeader;
    }
    return this.request<Booking>(`/api/v1/trips/${tripID}/book-seat`, {
      method: 'POST',
      headers,
      body: JSON.stringify(req),
    });
  }

  async simulateConcurrencyClash(tripID: string, req?: ConcurrencyClashRequest, tenantHeader?: string): Promise<ConcurrencyClashResult> {
    const headers: Record<string, string> = {};
    if (tenantHeader) {
      headers['X-Tenant-ID'] = tenantHeader;
    }
    return this.request<ConcurrencyClashResult>(`/api/v1/trips/${tripID}/simulate-concurrency-clash`, {
      method: 'POST',
      headers,
      body: JSON.stringify(req || { seat_number: '3A', attempts: 15 }),
    });
  }

  async syncDriverBatch(req: DriverSyncBatchRequest, tenantHeader?: string): Promise<DriverSyncBatchResponse> {
    const headers: Record<string, string> = {};
    if (tenantHeader) {
      headers['X-Tenant-ID'] = tenantHeader;
    }
    return this.request<DriverSyncBatchResponse>('/api/v1/driver/sync-batch', {
      method: 'POST',
      headers,
      body: JSON.stringify(req),
    });
  }

  async getAuditLogs(tenantHeader?: string): Promise<AuditLog[]> {
    const headers: Record<string, string> = {};
    if (tenantHeader) {
      headers['X-Tenant-ID'] = tenantHeader;
    }
    return this.request<AuditLog[]>('/api/v1/audit-logs', { headers });
  }

  async getGtfsVehiclePositions(tenantHeader?: string): Promise<GtfsRtVehicleFeed> {
    const headers: Record<string, string> = {};
    if (tenantHeader) {
      headers['X-Tenant-ID'] = tenantHeader;
    }
    return this.request<GtfsRtVehicleFeed>('/api/v1/gtfs-rt/vehicle-positions', { headers });
  }

  async getGtfsTripUpdates(tenantHeader?: string): Promise<GtfsRtTripFeed> {
    const headers: Record<string, string> = {};
    if (tenantHeader) {
      headers['X-Tenant-ID'] = tenantHeader;
    }
    return this.request<GtfsRtTripFeed>('/api/v1/gtfs-rt/trip-updates', { headers });
  }

  async getPublicCatalog(tenantHeader?: string): Promise<PublicCatalogResponse> {
    const headers: Record<string, string> = {};
    if (tenantHeader) {
      headers['X-Tenant-ID'] = tenantHeader;
    }
    return this.request<PublicCatalogResponse>('/api/v1/public/catalog', { headers });
  }

  async runLoadTest(tenantHeader?: string): Promise<LoadTestResult> {
    const headers: Record<string, string> = {};
    if (tenantHeader) {
      headers['X-Tenant-ID'] = tenantHeader;
    }
    return this.request<LoadTestResult>('/api/v1/system/load-test', {
      method: 'POST',
      headers,
    });
  }

  async getDemandSuggestions(tenantHeader?: string): Promise<DemandSuggestion[]> {
    const headers: Record<string, string> = {};
    if (tenantHeader) {
      headers['X-Tenant-ID'] = tenantHeader;
    }
    return this.request<DemandSuggestion[]>('/api/v1/analytics/demand-suggestions', { headers });
  }

  async getScheduleSuggestions(tenantHeader?: string): Promise<DemandSuggestion[]> {
    const headers: Record<string, string> = {};
    if (tenantHeader) {
      headers['X-Tenant-ID'] = tenantHeader;
    }
    return this.request<DemandSuggestion[]>('/api/v1/analytics/schedule-suggestions', { headers });
  }

  async applyScheduleSuggestion(req: ApplySuggestionRequest, tenantHeader?: string): Promise<ApplySuggestionResponse> {
    const headers: Record<string, string> = {};
    if (tenantHeader) {
      headers['X-Tenant-ID'] = tenantHeader;
    }
    return this.request<ApplySuggestionResponse>('/api/v1/analytics/apply-suggestion', {
      method: 'POST',
      headers,
      body: JSON.stringify(req),
    });
  }

  async triggerTestWebhook(req: WebhookTestRequest, tenantHeader?: string): Promise<WebhookTestResponse> {
    const headers: Record<string, string> = {};
    if (tenantHeader) {
      headers['X-Tenant-ID'] = tenantHeader;
    }
    return this.request<WebhookTestResponse>('/api/v1/webhooks/test', {
      method: 'POST',
      headers,
      body: JSON.stringify(req),
    });
  }

  async runChaosTest(req: ChaosTestRequest, tenantHeader?: string): Promise<ChaosTestReport> {
    const headers: Record<string, string> = {};
    if (tenantHeader) {
      headers['X-Tenant-ID'] = tenantHeader;
    }
    return this.request<ChaosTestReport>('/api/v1/system/chaos-test', {
      method: 'POST',
      headers,
      body: JSON.stringify(req),
    });
  }

  async getOpenApiSpec(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/api/v1/public/openapi.json');
  }

  async getPrometheusMetrics(): Promise<string> {
    const res = await fetch(`${this.baseUrl}/metrics`);
    if (!res.ok) {
      throw new Error(`Metrics HTTP error: ${res.status}`);
    }
    return res.text();
  }

  async triggerBusDetour(req: BusDetourRequest, tenantHeader?: string): Promise<BusDetourResponse> {
    const headers: Record<string, string> = {};
    if (tenantHeader) {
      headers['X-Tenant-ID'] = tenantHeader;
    }
    return this.request<BusDetourResponse>('/api/v1/buses/detour', {
      method: 'POST',
      headers,
      body: JSON.stringify(req),
    });
  }

  async joinSeatWaitlist(req: JoinWaitlistRequest, tenantHeader?: string): Promise<SeatWaitlist> {
    const headers: Record<string, string> = {};
    if (tenantHeader) {
      headers['X-Tenant-ID'] = tenantHeader;
    }
    return this.request<SeatWaitlist>('/api/v1/trips/waitlist', {
      method: 'POST',
      headers,
      body: JSON.stringify(req),
    });
  }

  async getSeatWaitlist(tripID: string, tenantHeader?: string): Promise<SeatWaitlist[]> {
    const headers: Record<string, string> = {};
    if (tenantHeader) {
      headers['X-Tenant-ID'] = tenantHeader;
    }
    return this.request<SeatWaitlist[]>(`/api/v1/trips/${tripID}/waitlist`, { headers });
  }

  async cancelSeatReservation(req: CancelSeatRequest, tenantHeader?: string): Promise<CancelSeatResponse> {
    const headers: Record<string, string> = {};
    if (tenantHeader) {
      headers['X-Tenant-ID'] = tenantHeader;
    }
    return this.request<CancelSeatResponse>('/api/v1/trips/cancel-seat', {
      method: 'POST',
      headers,
      body: JSON.stringify(req),
    });
  }

  async checkInBoardingQR(req: CheckInQRRequest, tenantHeader?: string): Promise<CheckInQRResponse> {
    const headers: Record<string, string> = {};
    if (tenantHeader) {
      headers['X-Tenant-ID'] = tenantHeader;
    }
    return this.request<CheckInQRResponse>('/api/v1/trips/check-in', {
      method: 'POST',
      headers,
      body: JSON.stringify(req),
    });
  }
}

export const api = new ApiClient();

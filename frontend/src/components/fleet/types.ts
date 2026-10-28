export type Tone = 'paper' | 'forest' | 'sage' | 'sand' | 'mist';
export type Tilt = 'none' | 'left' | 'right';
export type Span = 'sm' | 'wide' | 'tall' | 'hero';
export type Category = 'operations' | 'vehicles' | 'people' | 'health';
export type IconKey =
  | 'truck'
  | 'route'
  | 'fuel'
  | 'gauge'
  | 'wrench'
  | 'leaf'
  | 'shield'
  | 'thermometer'
  | 'battery'
  | 'timer';

type BaseCard = {
  id: string;
  category: Category;
  tone?: Tone;
  tilt?: Tilt;
  span?: Span;
};

export type StatCardData = BaseCard & {
  kind: 'stat';
  label: string;
  value: string;
  delta: number;
  caption: string;
  icon: IconKey;
};

export type VehicleCardData = BaseCard & {
  kind: 'vehicle';
  name: string;
  plate: string;
  image: string;
  status: 'moving' | 'idle' | 'service';
  speed: number;
  fuel: number;
  location: string;
  driver: string;
};

export type RouteCardData = BaseCard & {
  kind: 'route';
  code: string;
  origin: string;
  destination: string;
  eta: string;
  progress: number;
  stops: { name: string; time: string; done: boolean }[];
};

export type AlertCardData = BaseCard & {
  kind: 'alert';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  detail: string;
  vehicle: string;
  time: string;
};

export type DriverCardData = BaseCard & {
  kind: 'driver';
  name: string;
  initials: string;
  role: string;
  score: number;
  hours: number;
  trips: number;
  badges: string[];
};

export type MaintenanceCardData = BaseCard & {
  kind: 'maintenance';
  title: string;
  items: {
    icon: IconKey;
    task: string;
    vehicle: string;
    issue: string;
    assignee: string;
    priority: 'high' | 'medium' | 'low';
  }[];
};

export type FuelCardData = BaseCard & {
  kind: 'fuel';
  title: string;
  total: string;
  segments: { label: string; value: number; color: string }[];
};

export type UtilizationCardData = BaseCard & {
  kind: 'utilization';
  title: string;
  unit: string;
  highlight: number;
  days: { label: string; value: number }[];
};

export type FleetCardData =
  | StatCardData
  | VehicleCardData
  | RouteCardData
  | AlertCardData
  | DriverCardData
  | MaintenanceCardData
  | FuelCardData
  | UtilizationCardData;

export type FleetCardKind = FleetCardData['kind'];

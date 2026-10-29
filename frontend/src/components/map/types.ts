import { LucideIcon } from 'lucide-react';
import { UserRole } from '@/lib/api';

export type LatLngTuple = [number, number];

export function isValidLatLng(lat: unknown, lng: unknown): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

export interface MapStopNode {
  id: string;
  name: string;
  code: string;
  latitude: number;
  longitude: number;
  sequence: number;
}

export interface MapRouteNode {
  id: string;
  code: string;
  name: string;
  origin: string;
  destination: string;
  path: LatLngTuple[];
  stops: MapStopNode[];
}

export type LiveBusStatus = 'en-route' | 'delayed' | 'completed' | 'at-stop';

export interface MapBusNode {
  id: string;
  code: string;
  plate: string;
  routeId: string;
  model: string;
  capacity: number;
  occupancy: number;
  speedKmh: number;
  headingDeg: number;
  latitude: number;
  longitude: number;
  status: LiveBusStatus;
  tripStatus: string;
  progressPct: number;
  driverName: string;
  driverPhone: string;
}

export type ViewerRole = 'operator' | 'driver' | 'passenger';
export type TripStatusFilter = 'all' | 'active' | 'completed';

export interface StatPillItem {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone: 'primary' | 'sage' | 'signal' | 'mist';
}

export interface MapBoundsInfo {
  center: LatLngTuple;
  zoom: number;
}

export interface StudioStop {
  id: string;
  name: string;
  code?: string;
  latitude: number;
  longitude: number;
  sequence: number;
}

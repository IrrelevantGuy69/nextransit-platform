import type { ElementType, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { CardShell } from './card-shell';
import {
  AlertCard,
  DriverCard,
  FuelCard,
  MaintenanceCard,
  RouteCard,
  StatCard,
  UtilizationCard,
  VehicleCard,
} from './card-variants';
import type { FleetCardData, FleetCardKind, Span, Tone } from './types';

type Renderers = {
  [K in FleetCardKind]: (data: Extract<FleetCardData, { kind: K }>) => ReactNode;
};

const renderers: Renderers = {
  stat: StatCard,
  vehicle: VehicleCard,
  route: RouteCard,
  alert: AlertCard,
  driver: DriverCard,
  maintenance: MaintenanceCard,
  fuel: FuelCard,
  utilization: UtilizationCard,
};

const defaultTone: Record<FleetCardKind, Tone> = {
  stat: 'paper',
  vehicle: 'paper',
  route: 'forest',
  alert: 'sand',
  driver: 'paper',
  maintenance: 'paper',
  fuel: 'paper',
  utilization: 'paper',
};

const spanClass: Record<Span, string> = {
  sm: '',
  wide: 'sm:col-span-2',
  tall: 'lg:row-span-2',
  hero: 'sm:col-span-2 lg:row-span-2',
};

function render<K extends FleetCardKind>(data: Extract<FleetCardData, { kind: K }>) {
  return (renderers[data.kind] as (d: typeof data) => ReactNode)(data);
}

export function FleetCard({
  data,
  as,
  className,
}: {
  data: FleetCardData;
  as?: ElementType;
  className?: string;
}) {
  return (
    <CardShell
      as={as}
      tone={data.tone ?? defaultTone[data.kind]}
      tilt={data.tilt}
      data-kind={data.kind}
      aria-label={data.kind === 'stat' ? data.label : undefined}
      className={cn(spanClass[data.span ?? 'sm'], className)}
    >
      {render(data)}
    </CardShell>
  );
}

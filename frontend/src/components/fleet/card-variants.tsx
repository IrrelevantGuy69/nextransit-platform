import Image from 'next/image';
import {
  ArrowRight,
  ArrowUpRight,
  Battery,
  Clock,
  Ellipsis,
  Fuel,
  Gauge,
  Info,
  Leaf,
  MapPin,
  Route,
  ShieldCheck,
  Thermometer,
  Timer,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Truck,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  AlertCardData,
  DriverCardData,
  FuelCardData,
  IconKey,
  MaintenanceCardData,
  RouteCardData,
  StatCardData,
  UtilizationCardData,
  VehicleCardData,
} from './types';

export const iconMap: Record<IconKey, LucideIcon> = {
  truck: Truck,
  route: Route,
  fuel: Fuel,
  gauge: Gauge,
  wrench: Wrench,
  leaf: Leaf,
  shield: ShieldCheck,
  thermometer: Thermometer,
  battery: Battery,
  timer: Timer,
};

function IconBadge({ icon, className }: { icon: IconKey; className?: string }) {
  const Icon = iconMap[icon];
  return (
    <span
      className={cn(
        'grid size-10 shrink-0 place-items-center rounded-full bg-current/8 ring-1 ring-current/10',
        className,
      )}
    >
      <Icon className="size-[18px]" aria-hidden="true" />
    </span>
  );
}

function MoreButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      aria-label={`More options for ${label}`}
      className="grid size-8 shrink-0 place-items-center rounded-full ring-1 ring-current/15 transition-colors hover:bg-current/10"
    >
      <Ellipsis className="size-4" aria-hidden="true" />
    </button>
  );
}

function CardTitle({ children, action }: { children: React.ReactNode; action?: string }) {
  return (
    <header className="flex items-center justify-between gap-3">
      <h3 className="text-[15px] font-medium tracking-tight">{children}</h3>
      {action ? (
        <a href="#" className="text-xs font-medium opacity-60 transition-opacity hover:opacity-100">
          {action}
        </a>
      ) : null}
    </header>
  );
}

export function StatCard({ label, value, delta, caption, icon }: StatCardData) {
  const positive = delta >= 0;
  return (
    <>
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <IconBadge icon={icon} />
          <h3 className="text-[15px] font-medium tracking-tight">{label}</h3>
        </div>
        <MoreButton label={label} />
      </header>
      <div className="mt-auto flex flex-wrap items-end gap-x-3 gap-y-1 pt-8">
        <p className="text-4xl font-semibold tracking-tight tabular-nums">{value}</p>
        <span
          className={cn(
            'mb-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
            positive ? 'bg-chart-1/25 text-current' : 'bg-destructive/12 text-destructive',
          )}
        >
          {positive ? (
            <TrendingUp className="size-3" aria-hidden="true" />
          ) : (
            <TrendingDown className="size-3" aria-hidden="true" />
          )}
          {Math.abs(delta)}%
        </span>
      </div>
      <p className="mt-1 text-xs opacity-60">{caption}</p>
    </>
  );
}

const vehicleStatus = {
  moving: { label: 'In transit', dot: 'bg-chart-5', pill: 'bg-sage' },
  idle: { label: 'Idle', dot: 'bg-amber-600', pill: 'bg-sand' },
  service: { label: 'In service', dot: 'bg-destructive', pill: 'bg-destructive/12' },
} as const;

export function VehicleCard({
  name,
  plate,
  image,
  status,
  speed,
  fuel,
  location,
  driver,
}: VehicleCardData) {
  const s = vehicleStatus[status];
  return (
    <>
      <div className="relative -mx-2 -mt-2 min-h-48 flex-1 overflow-hidden rounded-[22px] bg-muted">
        <Image
          src={image || '/placeholder.svg'}
          alt={`${name} vehicle`}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover/card:scale-105"
        />
        <span
          className={cn(
            'absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium text-foreground',
            s.pill,
          )}
        >
          <span className={cn('size-1.5 rounded-full', s.dot)} aria-hidden="true" />
          {s.label}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-card/90 px-2.5 py-1 font-sans text-[11px] text-foreground backdrop-blur">
          {plate}
        </span>
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-medium tracking-tight">{name}</h3>
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs opacity-60">
            <MapPin className="size-3 shrink-0" aria-hidden="true" />
            {location}
          </p>
        </div>
        <p className="text-right">
          <span className="text-xl font-semibold tabular-nums">{speed}</span>
          <span className="ml-0.5 text-xs opacity-60">km/h</span>
        </p>
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 opacity-60">
            <Fuel className="size-3" aria-hidden="true" /> Fuel
          </span>
          <span className="font-medium tabular-nums">{fuel}%</span>
        </div>
        <div
          className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-current/10"
          role="progressbar"
          aria-valuenow={fuel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${name} fuel level`}
        >
          <div
            className={cn('h-full rounded-full', fuel < 25 ? 'bg-destructive' : 'bg-chart-5')}
            style={{ width: `${fuel}%` }}
          />
        </div>
      </div>
      <footer className="mt-4 flex items-center justify-between border-t border-current/10 pt-3 text-xs">
        <span className="opacity-60">Driver</span>
        <span className="font-medium">{driver}</span>
      </footer>
    </>
  );
}

export function RouteCard({ code, origin, destination, eta, progress, stops }: RouteCardData) {
  const safeStops = stops || [];
  return (
    <>
      <header className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-current/10 px-3 py-1 font-sans text-xs">
          <Route className="size-3.5" aria-hidden="true" />
          {code}
        </span>
        <span className="flex items-center gap-1.5 text-xs opacity-80">
          <Clock className="size-3.5" aria-hidden="true" /> ETA {eta}
        </span>
      </header>

      <div className="mt-6 flex items-center gap-3 sm:gap-5">
        <p className="min-w-0 flex-1">
          <span className="block text-[11px] uppercase tracking-[0.18em] opacity-60">From</span>
          <span className="block truncate font-serif text-3xl leading-tight sm:text-4xl">{origin}</span>
        </p>
        <ArrowRight className="size-5 shrink-0 opacity-60" aria-hidden="true" />
        <p className="min-w-0 flex-1 text-right">
          <span className="block text-[11px] uppercase tracking-[0.18em] opacity-60">To</span>
          <span className="block truncate font-serif text-3xl italic leading-tight sm:text-4xl">
            {destination}
          </span>
        </p>
      </div>

      <div className="relative mt-6 h-2 rounded-full bg-current/15" aria-hidden="true">
        <div className="h-full rounded-full bg-current/70" style={{ width: `${progress}%` }} />
        <span
          className="absolute top-1/2 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-sand text-foreground shadow-lg"
          style={{ left: `${progress}%` }}
        >
          <Truck className="size-4" />
        </span>
      </div>
      <p className="sr-only">{`Route ${progress}% complete`}</p>

      <ol className="mt-6 grid grid-cols-2 gap-3 @lg:grid-cols-4">
        {safeStops.map((stop, sIdx) => (
          <li key={`${stop.name}-${sIdx}`} className="flex items-start gap-2">
            <span
              className={cn(
                'mt-1 size-2.5 shrink-0 rounded-full ring-2 ring-current/30',
                stop.done ? 'bg-current' : 'bg-transparent',
              )}
              aria-hidden="true"
            />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{stop.name}</span>
              <span className="block text-xs opacity-60">
                {stop.time}
                <span className="sr-only">{stop.done ? ', completed' : ', upcoming'}</span>
              </span>
            </span>
          </li>
        ))}
      </ol>
    </>
  );
}

const severityStyles = {
  critical: { icon: TriangleAlert, label: 'Critical', chip: 'bg-destructive text-white', ping: 'bg-destructive' },
  warning: { icon: TriangleAlert, label: 'Warning', chip: 'bg-amber-200 text-amber-950', ping: 'bg-amber-500' },
  info: { icon: Info, label: 'Notice', chip: 'bg-mist text-foreground', ping: 'bg-sky-500' },
} as const;

export function AlertCard({ severity, title, detail, vehicle, time }: AlertCardData) {
  const s = severityStyles[severity];
  const Icon = s.icon;
  return (
    <>
      <header className="flex items-center justify-between gap-3">
        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold', s.chip)}>
          <Icon className="size-3.5" aria-hidden="true" />
          {s.label}
        </span>
        <span className="relative flex size-2.5" aria-hidden="true">
          <span className={cn('absolute inline-flex size-full animate-ping rounded-full opacity-60', s.ping)} />
          <span className={cn('relative inline-flex size-2.5 rounded-full', s.ping)} />
        </span>
      </header>
      <h3 className="mt-5 text-lg font-medium leading-snug tracking-tight text-pretty">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed opacity-70">{detail}</p>
      <footer className="mt-auto flex items-center justify-between gap-3 pt-5 text-xs">
        <span className="flex min-w-0 items-center gap-1.5 opacity-70">
          <Truck className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {vehicle} · {time}
          </span>
        </span>
        <button
          type="button"
          className="shrink-0 rounded-full bg-foreground px-3 py-1.5 font-medium text-background transition-opacity hover:opacity-85"
        >
          Acknowledge
        </button>
      </footer>
    </>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-16 shrink-0">
      <svg viewBox="0 0 64 64" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="32" cy="32" r={r} fill="none" strokeWidth="5" className="stroke-current/10" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (score / 100) * c}
          className="stroke-chart-5"
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-sm font-semibold tabular-nums">
        {score}
        <span className="sr-only"> out of 100 safety score</span>
      </span>
    </div>
  );
}

export function DriverCard({ name, initials, role, score, hours, trips, badges }: DriverCardData) {
  const safeBadges = badges || [];
  return (
    <>
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary font-serif text-lg text-primary-foreground">
            {initials}
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-medium tracking-tight">{name}</h3>
            <p className="truncate text-xs opacity-60">{role}</p>
          </div>
        </div>
        <ScoreRing score={score} />
      </header>
      <dl className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-current/5 p-3">
          <dt className="text-[11px] uppercase tracking-wider opacity-60">Drive hrs</dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums">{hours}</dd>
        </div>
        <div className="rounded-2xl bg-current/5 p-3">
          <dt className="text-[11px] uppercase tracking-wider opacity-60">Trips</dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums">{trips}</dd>
        </div>
      </dl>
      <ul className="mt-auto flex flex-wrap gap-1.5 pt-5" aria-label="Driver badges">
        {safeBadges.map((b, bIdx) => (
          <li key={`${b}-${bIdx}`} className="rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-current/15">
            {b}
          </li>
        ))}
      </ul>
    </>
  );
}

const priorityStyles = {
  high: 'bg-destructive/12 text-destructive',
  medium: 'bg-sand text-foreground',
  low: 'bg-sage text-foreground',
} as const;

export function MaintenanceCard({ title, items }: MaintenanceCardData) {
  const safeItems = items || [];
  return (
    <>
      <CardTitle action="See all">{title}</CardTitle>
      <ul className="mt-4 divide-y divide-current/10">
        {safeItems.map((item, mIdx) => (
          <li key={`${item.task}-${item.vehicle}-${mIdx}`} className="flex items-center gap-3 py-3">
            <IconBadge icon={item.icon} className="size-9" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.task}</p>
              <p className="truncate text-xs opacity-60">
                {item.vehicle} · {item.issue}
              </p>
            </div>
            <span className="hidden text-xs opacity-70 md:block">{item.assignee}</span>
            <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium capitalize', priorityStyles[item.priority])}>
              {item.priority}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

export function FuelCard({ title, total, segments }: FuelCardData) {
  const safeSegments = segments || [];
  const r = 52;
  const c = 2 * Math.PI * r;
  const sum = safeSegments.reduce((a, s) => a + s.value, 0) || 1;
  let offset = 0;
  return (
    <>
      <CardTitle action="Details">{title}</CardTitle>
      <div className="mt-4 flex flex-1 flex-col items-center gap-5 sm:flex-row lg:flex-col xl:flex-row">
        <div className="relative size-40 shrink-0">
          <svg viewBox="0 0 128 128" className="size-full -rotate-90" aria-hidden="true">
            {safeSegments.map((s, sIdx) => {
              const len = (s.value / sum) * c;
              const dash = `${Math.max(len - 4, 0)} ${c}`;
              const el = (
                <circle
                  key={`${s.label}-${sIdx}`}
                  cx="64"
                  cy="64"
                  r={r}
                  fill="none"
                  strokeWidth="18"
                  stroke={s.color}
                  strokeDasharray={dash}
                  strokeDashoffset={-offset}
                />
              );
              offset += len;
              return el;
            })}
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <p>
              <span className="block text-2xl font-semibold tabular-nums">{total}</span>
              <span className="block text-[11px] opacity-60">this month</span>
            </p>
          </div>
        </div>
        <ul className="grid w-full grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-1">
          {safeSegments.map((s, sIdx) => (
            <li key={`${s.label}-${sIdx}`} className="flex items-center gap-2 text-xs">
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} aria-hidden="true" />
              <span className="flex-1 opacity-70">{s.label}</span>
              <span className="font-medium tabular-nums">{Math.round((s.value / sum) * 100)}%</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export function UtilizationCard({ title, unit, highlight, days }: UtilizationCardData) {
  const safeDays = days || [];
  const max = safeDays.length > 0 ? Math.max(1, ...safeDays.map((d) => d.value)) : 100;
  return (
    <>
      <header className="flex items-center justify-between gap-3">
        <h3 className="text-[15px] font-medium tracking-tight">{title}</h3>
        <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs ring-1 ring-current/15">
          This week <ArrowUpRight className="size-3" aria-hidden="true" />
        </span>
      </header>
      <div className="mt-6 flex flex-1 items-end gap-2 sm:gap-3" role="list" aria-label={title}>
        {safeDays.map((d, i) => {
          const active = i === highlight;
          return (
            <div key={`${d.label}-${i}`} role="listitem" className="flex h-full min-h-44 flex-1 flex-col items-center justify-end gap-2">
              {active ? (
                <span className="whitespace-nowrap rounded-lg bg-card px-2 py-1 text-[11px] font-medium text-card-foreground shadow-md ring-1 ring-foreground/5">
                  {d.value}
                  {unit}
                </span>
              ) : null}
              <div
                className={cn(
                  'w-full max-w-12 rounded-xl transition-all duration-500',
                  active ? 'hatch bg-primary' : 'bg-sage/70 group-hover/card:bg-sage',
                )}
                style={{ height: `${(d.value / max) * 100}%` }}
              >
                <span className="sr-only">{`${d.label}: ${d.value}${unit}`}</span>
              </div>
              <span className={cn('text-xs', active ? 'font-semibold' : 'opacity-60')}>{d.label}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

import { Bell, CalendarDays, LayoutGrid, LogOut, MapPinned, MessageCircle, Search, Settings, Truck, Users, Wrench } from 'lucide-react'
import { FleetCard } from '@/components/fleet/fleet-card'
import { coverCards } from '@/lib/fleet-data'

const rail = [
  { icon: LayoutGrid, label: 'Overview', active: true },
  { icon: Truck, label: 'Vehicles' },
  { icon: MapPinned, label: 'Live map' },
  { icon: Users, label: 'Drivers' },
  { icon: Wrench, label: 'Maintenance' },
  { icon: CalendarDays, label: 'Schedule' },
]

function Rail() {
  return (
    <nav
      aria-label="Dashboard"
      className="hidden w-16 shrink-0 flex-col items-center gap-2 rounded-full bg-card py-3 shadow-sm ring-1 ring-foreground/5 lg:flex"
    >
      {rail.map(({ icon: Icon, label, active }) => (
        <a
          key={label}
          href="#"
          aria-label={label}
          aria-current={active ? 'page' : undefined}
          className={
            active
              ? 'grid size-11 place-items-center rounded-full bg-foreground text-background'
              : 'grid size-11 place-items-center rounded-full text-foreground/70 transition-colors hover:bg-muted hover:text-foreground'
          }
        >
          <Icon className="size-[18px]" aria-hidden="true" />
        </a>
      ))}
      <span className="my-2 h-px w-6 bg-border" aria-hidden="true" />
      <a href="#" aria-label="Settings" className="grid size-11 place-items-center rounded-full text-foreground/70 hover:bg-muted">
        <Settings className="size-[18px]" aria-hidden="true" />
      </a>
      <a href="#" aria-label="Log out" className="mt-auto grid size-11 place-items-center rounded-full text-foreground/70 hover:bg-muted">
        <LogOut className="size-[18px]" aria-hidden="true" />
      </a>
    </nav>
  )
}

export function CoverDashboard() {
  return (
    <section id="cover" aria-labelledby="cover-title" className="rounded-[40px] bg-canvas p-3 sm:p-5 lg:p-6">
      <div className="flex gap-5">
        <Rail />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-4 px-1 pb-5 pt-1 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 id="cover-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Good morning, <span className="font-serif font-normal italic">Dispatch.</span>
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Here&apos;s what&apos;s moving across your 14 depots today.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex h-12 flex-1 items-center gap-2 rounded-full bg-card pl-5 pr-1.5 shadow-sm ring-1 ring-foreground/5 md:w-80 md:flex-none">
                <span className="sr-only">Search fleet</span>
                <input
                  type="search"
                  placeholder="Search vehicle, driver, route…"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <span className="grid size-9 place-items-center rounded-full bg-foreground text-background" aria-hidden="true">
                  <Search className="size-4" />
                </span>
              </label>
              <button type="button" aria-label="Messages" className="relative grid size-12 place-items-center rounded-full bg-card shadow-sm ring-1 ring-foreground/5">
                <MessageCircle className="size-[18px]" aria-hidden="true" />
                <span className="absolute right-3 top-3 size-2 rounded-full bg-destructive" aria-hidden="true" />
              </button>
              <button type="button" aria-label="Notifications" className="grid size-12 place-items-center rounded-full bg-card shadow-sm ring-1 ring-foreground/5">
                <Bell className="size-[18px]" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FleetCard data={coverCards.active} />
            <FleetCard data={coverCards.ontime} />
            <FleetCard data={coverCards.idle} className="sm:col-span-2 lg:col-span-1" />
            <FleetCard data={coverCards.utilization} className="sm:col-span-2" />
            <FleetCard data={coverCards.fuel} className="sm:col-span-2 lg:col-span-1" />
            <FleetCard data={coverCards.route} className="sm:col-span-2 lg:col-span-1" />
            <FleetCard data={coverCards.maintenance} className="sm:col-span-2" />
          </div>
        </div>
      </div>
    </section>
  )
}

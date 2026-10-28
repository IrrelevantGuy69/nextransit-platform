import Link from 'next/link'
import { Bus, House, MapPinned, Power, Settings, Users } from 'lucide-react'
import { cn } from '@/site-design/lib/utils'

const items = [
  { label: 'Overview', icon: House, href: '/' },
  { label: 'Live map', icon: MapPinned, href: '/live-map', active: true },
  { label: 'Vehicles', icon: Bus, href: '#' },
  { label: 'Drivers', icon: Users, href: '#' },
]

export function AppSidebar() {
  return (
    <aside className="hidden w-20 shrink-0 flex-col items-center border-r border-border bg-card py-6 md:flex">
      <Link href="/" aria-label="Verdant home" className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
          <path d="M4 7l8 10 8-10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>

      <nav aria-label="App" className="mt-10 flex flex-1 flex-col items-center gap-3">
        {items.map(({ label, icon: Icon, href, active }) => (
          <Link
            key={label}
            href={href}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative grid size-11 place-items-center rounded-2xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
              active && 'bg-muted text-primary',
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
            {active && <span className="absolute -bottom-1 size-1.5 rounded-full bg-signal" aria-hidden="true" />}
          </Link>
        ))}
      </nav>

      <div className="flex flex-col items-center gap-3">
        <button type="button" aria-label="Settings" className="grid size-11 place-items-center rounded-2xl text-muted-foreground hover:bg-muted hover:text-foreground">
          <Settings className="size-5" aria-hidden="true" />
        </button>
        <button type="button" aria-label="Sign out" className="grid size-11 place-items-center rounded-2xl text-signal hover:bg-muted">
          <Power className="size-5" aria-hidden="true" />
        </button>
      </div>
    </aside>
  )
}

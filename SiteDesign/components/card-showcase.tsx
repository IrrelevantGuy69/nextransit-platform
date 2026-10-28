'use client'

import { useState } from 'react'
import { FleetCard } from '@/components/fleet/fleet-card'
import type { Category } from '@/components/fleet/types'
import { showcaseCards } from '@/lib/fleet-data'
import { cn } from '@/lib/utils'

const filters: { value: Category | 'all'; label: string }[] = [
  { value: 'all', label: 'All modules' },
  { value: 'operations', label: 'Operations' },
  { value: 'vehicles', label: 'Vehicles' },
  { value: 'people', label: 'Drivers' },
  { value: 'health', label: 'Health & alerts' },
]

const kinds = ['stat', 'vehicle', 'route', 'alert', 'driver', 'maintenance', 'fuel', 'utilization']

export function CardShowcase() {
  const [active, setActive] = useState<Category | 'all'>('all')
  const cards = active === 'all' ? showcaseCards : showcaseCards.filter((c) => c.category === active)

  return (
    <section id="cards" aria-labelledby="cards-title" className="py-20 lg:py-28">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-end">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Modular card system
          </p>
          <h2 id="cards-title" className="mt-4 text-4xl font-semibold leading-[1.02] tracking-[-0.03em] text-balance sm:text-5xl">
            One card.{' '}
            <span className="font-serif font-normal italic text-chart-5">Every shape of your fleet.</span>
          </h2>
        </div>
        <div>
          <p className="max-w-md text-base leading-relaxed text-foreground/70">
            Each module is a single polymorphic <code className="rounded bg-card px-1.5 py-0.5 font-mono text-[13px] ring-1 ring-foreground/10">{'<FleetCard />'}</code>{' '}
            that reads its data shape and renders the right layout, tone and span — drop any of them
            anywhere.
          </p>
          <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Supported card kinds">
            {kinds.map((k) => (
              <li key={k} className="rounded-full bg-card px-2.5 py-1 font-mono text-[11px] text-foreground/70 ring-1 ring-foreground/10">
                {k}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div role="tablist" aria-label="Filter card modules" className="mt-10 flex gap-1.5 overflow-x-auto rounded-full bg-card p-1.5 shadow-sm ring-1 ring-foreground/5 sm:inline-flex">
        {filters.map((f) => (
          <button
            key={f.value}
            type="button"
            role="tab"
            aria-selected={active === f.value}
            onClick={() => setActive(f.value)}
            className={cn(
              'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors',
              active === f.value ? 'bg-primary text-primary-foreground' : 'text-foreground/70 hover:bg-muted hover:text-foreground',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div
        key={active}
        className="mt-8 grid grid-flow-dense auto-rows-[minmax(230px,auto)] gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500 sm:grid-cols-2 lg:grid-cols-4"
      >
        {cards.map((card) => (
          <FleetCard key={card.id} data={card} />
        ))}
      </div>
    </section>
  )
}

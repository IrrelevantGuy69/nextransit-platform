'use client'

import { Bell, Search } from 'lucide-react'

type TopBarProps = {
  query: string
  onQueryChange: (q: string) => void
  viewerName: string
  viewerSubtitle: string
}

export function TopBar({ query, onQueryChange, viewerName, viewerSubtitle }: TopBarProps) {
  const initials = viewerName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)

  return (
    <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 md:px-6">
      <form role="search" className="flex min-w-0 flex-1 items-center rounded-2xl bg-muted pl-4" onSubmit={(e) => e.preventDefault()}>
        <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <label htmlFor="fleet-search" className="sr-only">
          Search buses, routes or drivers
        </label>
        <input
          id="fleet-search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search buses, routes, drivers…"
          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
        />
        <button type="submit" className="hidden rounded-xl bg-card px-4 py-1.5 mr-1 text-sm font-medium text-foreground shadow-sm sm:block">
          Search
        </button>
      </form>

      <button type="button" aria-label="Notifications" className="relative grid size-10 shrink-0 place-items-center rounded-full border border-border bg-card">
        <Bell className="size-4" aria-hidden="true" />
        <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-signal" aria-hidden="true" />
      </button>

      <div className="hidden items-center gap-3 rounded-full border border-border bg-card py-1 pl-4 pr-1 sm:flex">
        <div className="text-right leading-tight">
          <p className="text-sm font-medium">{viewerName}</p>
          <p className="text-xs text-muted-foreground">{viewerSubtitle}</p>
        </div>
        <span className="grid size-8 place-items-center rounded-full bg-sage text-xs font-semibold text-primary" aria-hidden="true">
          {initials}
        </span>
      </div>
    </header>
  )
}

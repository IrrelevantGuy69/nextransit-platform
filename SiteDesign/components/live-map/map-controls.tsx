'use client'

import { LocateFixed, Minus, Pause, Play, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

type MapControlsProps = {
  showRoutes: boolean
  onShowRoutesChange: (v: boolean) => void
  onZoomIn: () => void
  onZoomOut: () => void
  onRecenter: () => void
}

export function MapControls({ showRoutes, onShowRoutesChange, onZoomIn, onZoomOut, onRecenter }: MapControlsProps) {
  return (
    <div className="pointer-events-none absolute bottom-8 right-4 z-[500] flex items-end gap-3">
      <label className="pointer-events-auto flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-card px-4 py-2.5 text-sm font-medium shadow-lg">
        Routes
        <button
          type="button"
          role="switch"
          aria-checked={showRoutes}
          onClick={() => onShowRoutesChange(!showRoutes)}
          className={cn('relative h-6 w-11 rounded-full transition-colors', showRoutes ? 'bg-signal' : 'bg-border')}
        >
          <span
            className={cn(
              'absolute left-0.5 top-0.5 size-5 rounded-full bg-card shadow transition-transform',
              showRoutes && 'translate-x-5',
            )}
          />
        </button>
      </label>

      <div className="pointer-events-auto flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
        <IconButton label="Fit to routes" onClick={onRecenter}>
          <LocateFixed className="size-4" aria-hidden="true" />
        </IconButton>
        <IconButton label="Zoom in" onClick={onZoomIn}>
          <Plus className="size-4" aria-hidden="true" />
        </IconButton>
        <IconButton label="Zoom out" onClick={onZoomOut}>
          <Minus className="size-4" aria-hidden="true" />
        </IconButton>
      </div>
    </div>
  )
}

export function LiveBadge({ paused, onToggle }: { paused: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={!paused}
      className="absolute right-4 top-4 z-[500] flex items-center gap-2 rounded-full border border-border bg-card py-2 pl-3 pr-4 text-xs font-semibold shadow-lg"
    >
      <span className="relative flex size-2.5">
        {!paused && <span className="absolute inset-0 animate-ping rounded-full bg-signal opacity-60 motion-reduce:hidden" />}
        <span className={cn('relative size-2.5 rounded-full', paused ? 'bg-muted-foreground' : 'bg-signal')} />
      </span>
      {paused ? 'Paused' : 'Live tracking'}
      {paused ? <Play className="size-3.5" aria-hidden="true" /> : <Pause className="size-3.5" aria-hidden="true" />}
      <span className="sr-only">{paused ? 'Resume live updates' : 'Pause live updates'}</span>
    </button>
  )
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-10 place-items-center border-b border-border text-foreground transition-colors last:border-b-0 hover:bg-muted"
    >
      {children}
    </button>
  )
}

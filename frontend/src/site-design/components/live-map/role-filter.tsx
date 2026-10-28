'use client'

import { Building2, Navigation as SteeringWheel, UserRound } from 'lucide-react'
import type { ViewerRole } from '@/site-design/lib/transit-data'
import { cn } from '@/site-design/lib/utils'

const roles: { value: ViewerRole; label: string; icon: typeof UserRound }[] = [
  { value: 'operator', label: 'Operator', icon: Building2 },
  { value: 'driver', label: 'Driver', icon: SteeringWheel },
  { value: 'passenger', label: 'User', icon: UserRound },
]

export function RoleFilter({ value, onChange }: { value: ViewerRole; onChange: (r: ViewerRole) => void }) {
  return (
    <div role="group" aria-label="View map as" className="flex items-center gap-1 rounded-2xl border border-border bg-card p-1 shadow-sm">
      {roles.map(({ value: v, label, icon: Icon }) => {
        const active = v === value
        return (
          <button
            key={v}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(v)}
            className={cn(
              'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
              active ? 'bg-signal text-signal-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </button>
        )
      })}
    </div>
  )
}

import type { LucideIcon } from 'lucide-react'
import { cn } from '@/site-design/lib/utils'

export type StatPill = {
  label: string
  value: string | number
  icon: LucideIcon
  tone: 'primary' | 'sage' | 'signal' | 'mist'
}

const toneClasses: Record<StatPill['tone'], { icon: string; value: string }> = {
  primary: { icon: 'bg-primary text-primary-foreground', value: 'text-primary' },
  sage: { icon: 'bg-sage text-primary', value: 'text-chart-5' },
  signal: { icon: 'bg-signal text-signal-foreground', value: 'text-signal' },
  mist: { icon: 'bg-mist text-foreground', value: 'text-foreground' },
}

export function StatPills({ items }: { items: StatPill[] }) {
  return (
    <ul className="flex flex-wrap gap-3">
      {items.map(({ label, value, icon: Icon, tone }) => (
        <li key={label} className="flex items-center gap-3 rounded-2xl border border-border bg-card py-2 pl-2 pr-5 shadow-sm">
          <span className={cn('grid size-10 place-items-center rounded-full shadow-sm', toneClasses[tone].icon)}>
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className={cn('text-lg font-semibold tabular-nums', toneClasses[tone].value)}>{value}</span>
        </li>
      ))}
    </ul>
  )
}

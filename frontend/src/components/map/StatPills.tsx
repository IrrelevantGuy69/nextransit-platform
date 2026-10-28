'use client';

import React from 'react';
import { StatPillItem } from './types';
import { cn } from '@/lib/utils';

interface ToneStyle {
  icon: string;
  value: string;
}

const toneClasses: Record<StatPillItem['tone'], ToneStyle> = {
  primary: {
    icon: 'bg-[#162A22] text-[#F4F3EE]',
    value: 'text-[#162A22]',
  },
  sage: {
    icon: 'bg-emerald-100 text-emerald-800',
    value: 'text-emerald-700',
  },
  signal: {
    icon: 'bg-[#f97316] text-white',
    value: 'text-[#f97316]',
  },
  mist: {
    icon: 'bg-muted text-foreground',
    value: 'text-foreground',
  },
};

interface StatPillsProps {
  items: StatPillItem[];
}

export function StatPills({ items }: StatPillsProps) {
  return (
    <ul className="flex flex-wrap items-center gap-2.5">
      {items.map(({ label, value, icon: Icon, tone }) => {
        const toneStyle = toneClasses[tone] ?? toneClasses.mist;
        return (
          <li
            key={label}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card py-1.5 pl-2 pr-4 shadow-sm"
          >
            <span
              className={cn(
                'grid size-8 place-items-center rounded-full shadow-sm',
                toneStyle.icon,
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <div className="flex flex-col">
              <span className="text-[11px] text-muted-foreground leading-tight">{label}</span>
              <span className={cn('text-sm font-bold tabular-nums leading-tight', toneStyle.value)}>
                {value}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

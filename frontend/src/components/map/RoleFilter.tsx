'use client';

import React from 'react';
import { Building2, Navigation, UserRound } from 'lucide-react';
import { UserRole } from '@/lib/api';
import { cn } from '@/lib/utils';

interface RoleFilterOption {
  value: UserRole;
  label: string;
  icon: typeof UserRound;
}

const roleOptions: RoleFilterOption[] = [
  { value: 'OPERATOR_ADMIN', label: 'Operator', icon: Building2 },
  { value: 'DRIVER', label: 'Driver', icon: Navigation },
  { value: 'RIDER', label: 'Rider', icon: UserRound },
];

interface RoleFilterProps {
  value: UserRole;
  onChange: (role: UserRole) => void;
}

export function RoleFilter({ value, onChange }: RoleFilterProps) {
  return (
    <div
      role="group"
      aria-label="View map as"
      className="flex items-center gap-1 rounded-2xl border border-border bg-card p-1 shadow-sm"
    >
      {roleOptions.map(({ value: roleVal, label, icon: Icon }) => {
        const active = roleVal === value;
        return (
          <button
            key={roleVal}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(roleVal)}
            className={cn(
              'flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all duration-200',
              active
                ? 'bg-[#f97316] text-white shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

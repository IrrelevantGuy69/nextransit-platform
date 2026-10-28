'use client';

import React from 'react';
import { LocateFixed, Minus, Pause, Play, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MapControlsProps {
  showRoutes: boolean;
  onShowRoutesChange: (value: boolean) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRecenter: () => void;
}

export function MapControls({
  showRoutes,
  onShowRoutesChange,
  onZoomIn,
  onZoomOut,
  onRecenter,
}: MapControlsProps) {
  return (
    <div className="pointer-events-none absolute bottom-6 right-4 z-[500] flex items-end gap-3">
      <label className="pointer-events-auto flex cursor-pointer items-center gap-3 rounded-full border border-black/10 bg-white/95 backdrop-blur-md px-4 py-2 text-xs font-semibold shadow-md text-[#162A22] transition-all duration-200">
        Routes
        <button
          type="button"
          role="switch"
          aria-checked={showRoutes}
          onClick={() => onShowRoutesChange(!showRoutes)}
          className={cn(
            'relative h-5 w-10 rounded-full transition-colors duration-200',
            showRoutes ? 'bg-[#162A22]' : 'bg-black/10',
          )}
        >
          <span
            className={cn(
              'absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow transition-transform duration-200',
              showRoutes && 'translate-x-5',
            )}
          />
        </button>
      </label>

      <div className="pointer-events-auto flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white/95 backdrop-blur-md shadow-md text-[#162A22]">
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
  );
}

export function LiveBadge({
  paused,
  onToggle,
}: {
  paused: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={!paused}
      className="absolute right-4 top-4 z-[500] flex items-center gap-2 rounded-full border border-black/10 bg-white/95 backdrop-blur-md py-2 pl-3.5 pr-4 text-xs font-semibold shadow-md text-[#162A22] transition-all duration-200 hover:bg-white"
    >
      <span className="relative flex size-2.5">
        {!paused && (
          <span className="absolute inset-0 animate-ping rounded-full bg-[#10B981] opacity-75 motion-reduce:hidden" />
        )}
        <span
          className={cn(
            'relative size-2.5 rounded-full transition-colors',
            paused ? 'bg-black/30' : 'bg-[#10B981]',
          )}
        />
      </span>
      {paused ? 'Paused' : 'Live tracking'}
      {paused ? (
        <Play className="size-3.5 ml-1 text-[#162A22]/70" aria-hidden="true" />
      ) : (
        <Pause className="size-3.5 ml-1 text-[#162A22]/70" aria-hidden="true" />
      )}
      <span className="sr-only">
        {paused ? 'Resume live updates' : 'Pause live updates'}
      </span>
    </button>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-9 place-items-center border-b border-black/[0.06] text-[#162A22] transition-colors last:border-b-0 hover:bg-black/[0.04]"
    >
      {children}
    </button>
  );
}

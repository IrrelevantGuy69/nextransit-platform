'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Compass, Eye, Layers, LayoutGrid, MapPin, Sparkles } from 'lucide-react';
import { SiteHeader } from '@/site-design/components/site-header';
import { Hero } from '@/site-design/components/hero';
import { CoverDashboard } from '@/site-design/components/cover-dashboard';
import { CardShowcase } from '@/site-design/components/card-showcase';
import { CtaFooter } from '@/site-design/components/cta-footer';
import { LiveMapDashboard } from '@/site-design/components/live-map/live-map-dashboard';
import { FleetCard } from '@/site-design/components/fleet/fleet-card';
import { coverCards, showcaseCards } from '@/site-design/lib/fleet-data';
import { cn } from '@/site-design/lib/utils';

type PreviewTab = 'all' | 'landing' | 'live-map' | 'cards';

export default function DesignPreviewPage() {
  const [activeTab, setActiveTab] = useState<PreviewTab>('all');

  return (
    <div className="min-h-screen bg-canvas text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
      <div className="sticky top-0 z-50 border-b border-foreground/10 bg-background/90 backdrop-blur-md px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-card px-3.5 py-1.5 text-xs font-medium text-foreground border border-black/[0.08] shadow-xs hover:bg-muted transition-colors cursor-pointer"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to Transit Operations (/)</span>
            </Link>
            <span className="hidden sm:inline-block text-xs text-muted-foreground font-medium">·</span>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#E6F4EA] text-[#162A22] border border-[#162A22]/10">
                <Sparkles className="size-3 text-[#10B981]" />
                <span>Original SiteDesign System</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-muted/60 p-1 border border-foreground/5 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={cn(
                'px-3.5 py-1.5 rounded-full font-medium transition-all cursor-pointer',
                activeTab === 'all'
                  ? 'bg-foreground text-background shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              All Components
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('landing')}
              className={cn(
                'px-3.5 py-1.5 rounded-full font-medium transition-all cursor-pointer',
                activeTab === 'landing'
                  ? 'bg-foreground text-background shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Landing Showcase
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('live-map')}
              className={cn(
                'px-3.5 py-1.5 rounded-full font-medium transition-all cursor-pointer',
                activeTab === 'live-map'
                  ? 'bg-foreground text-background shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Interactive Live Map
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('cards')}
              className={cn(
                'px-3.5 py-1.5 rounded-full font-medium transition-all cursor-pointer',
                activeTab === 'cards'
                  ? 'bg-foreground text-background shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Fleet Card Gallery
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-8 space-y-16">
        {(activeTab === 'all' || activeTab === 'landing') && (
          <div className="space-y-16">
            <div className="rounded-[44px] bg-background px-6 sm:px-10 lg:px-14 shadow-sm border border-foreground/10 pb-16">
              <SiteHeader />
              <Hero />
              <CoverDashboard />
              <CardShowcase />
              <CtaFooter />
            </div>
          </div>
        )}

        {(activeTab === 'all' || activeTab === 'live-map') && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Original Telematics View
                </p>
                <h2 className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  Live Map <span className="font-serif font-normal italic text-chart-5">Dashboard.</span>
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-card border border-foreground/10 text-foreground">
                <Compass className="size-3.5 text-signal" />
                <span>San Francisco Transit Simulation</span>
              </span>
            </div>

            <div className="rounded-[36px] overflow-hidden border border-foreground/10 shadow-xl bg-background">
              <LiveMapDashboard />
            </div>
          </div>
        )}

        {(activeTab === 'all' || activeTab === 'cards') && (
          <div className="space-y-8 py-8 border-t border-foreground/10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Polymorphic Design Architecture
                </p>
                <h2 className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  Original Fleet Card <span className="font-serif font-normal italic text-chart-5">Matrix.</span>
                </h2>
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                {showcaseCards.length + Object.keys(coverCards).length} card tokens
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <LayoutGrid className="size-4 text-primary" />
                <h3 className="font-serif text-xl font-normal text-foreground">Cover Cards Set</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.values(coverCards).map((card) => (
                  <FleetCard key={card.id} data={card} />
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-6">
              <div className="flex items-center gap-2">
                <Layers className="size-4 text-primary" />
                <h3 className="font-serif text-xl font-normal text-foreground">Showcase Modular Cards Set</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {showcaseCards.map((card) => (
                  <FleetCard key={card.id} data={card} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
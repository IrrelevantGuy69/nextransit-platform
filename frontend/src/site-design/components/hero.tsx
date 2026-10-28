import Image from 'next/image'
import { ArrowRight, Gauge, Navigation, Play } from 'lucide-react'

const metrics = [
  { value: '1.2M', label: 'Miles tracked daily' },
  { value: '−18%', label: 'Average fuel spend' },
  { value: '99.9%', label: 'Telematics uptime' },
]

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="grid items-center gap-12 pb-16 pt-8 lg:grid-cols-[1fr_1.05fr] lg:gap-10 lg:pb-24 lg:pt-14">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
          Fleet intelligence platform
        </p>
        <h1 id="hero-title" className="mt-5 text-5xl font-semibold leading-[0.98] tracking-[-0.035em] text-balance sm:text-6xl lg:text-7xl">
          Control your fleet{' '}
          <span className="font-serif text-[1.08em] font-normal italic tracking-[-0.01em] text-chart-5">
            with calm clarity.
          </span>
        </h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-foreground/70 sm:text-lg">
          Real-time tracking, route intelligence and predictive maintenance — composed into modular
          cards your dispatch team actually enjoys using.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-6">
          <a
            href="#cards"
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground shadow-[0_12px_30px_-12px_oklch(0.3_0.05_160/0.7)] transition-transform hover:-translate-y-0.5"
          >
            Explore the platform <ArrowRight className="size-4" aria-hidden="true" />
          </a>
          <a href="#cover" className="group inline-flex items-center gap-3 text-sm font-medium">
            Watch the tour
            <span className="grid size-9 place-items-center rounded-full ring-1 ring-foreground/25 transition-colors group-hover:bg-foreground group-hover:text-background">
              <Play className="size-3.5 fill-current" aria-hidden="true" />
            </span>
          </a>
        </div>
        <dl className="mt-12 grid max-w-md grid-cols-3 gap-4 border-t border-foreground/10 pt-6">
          {metrics.map((m) => (
            <div key={m.label}>
              <dt className="sr-only">{m.label}</dt>
              <dd className="text-2xl font-semibold tracking-tight tabular-nums">{m.value}</dd>
              <dd className="mt-1 text-xs leading-snug text-muted-foreground">{m.label}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="relative">
        <div className="relative aspect-[4/3.6] overflow-hidden rounded-[56px] rounded-tl-[140px] rounded-br-[140px] bg-muted sm:rounded-[72px] sm:rounded-tl-[180px] sm:rounded-br-[180px]">
          <Image
            src="/images/hero-truck.png"
            alt="Green semi truck driving on a desert highway at golden hour"
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>

        <div className="absolute left-3 top-6 flex items-center gap-3 rounded-2xl bg-card/95 p-3 pr-4 shadow-xl ring-1 ring-foreground/5 backdrop-blur sm:-left-6 sm:top-16">
          <span className="grid size-10 place-items-center rounded-xl bg-sage text-foreground">
            <Navigation className="size-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium">TRK-118 · In transit</p>
            <p className="text-xs text-muted-foreground">I-80 E · ETA 14:20</p>
          </div>
        </div>

        <div className="absolute -bottom-6 right-2 grid size-40 place-items-center rounded-full bg-sage text-center shadow-[0_20px_40px_-20px_oklch(0.3_0.05_160/0.6)] ring-8 ring-background sm:-right-4 sm:size-44">
          <div>
            <Gauge className="mx-auto size-5 text-chart-5" aria-hidden="true" />
            <p className="mt-1.5 text-3xl font-semibold tracking-tight">98.6%</p>
            <p className="mt-0.5 px-6 text-xs leading-snug text-foreground/70">On-time deliveries this quarter</p>
          </div>
        </div>
      </div>
    </section>
  )
}

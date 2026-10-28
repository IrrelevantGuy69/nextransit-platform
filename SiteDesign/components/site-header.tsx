import { ArrowUpRight } from 'lucide-react'

const links = ['Platform', 'Solutions', 'Telematics', 'Pricing', 'Resources']

export function Logo() {
  return (
    <a href="#" className="flex items-center gap-2" aria-label="Verdant Fleet home">
      <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
          <path d="M4 7l8 10 8-10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="font-serif text-2xl leading-none tracking-tight">Verdant</span>
    </a>
  )
}

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between gap-6 py-5">
      <Logo />
      <nav aria-label="Main" className="hidden md:block">
        <ul className="flex items-center gap-8 text-sm">
          {links.map((l) => (
            <li key={l}>
              <a href="#" className="text-foreground/75 transition-colors hover:text-foreground">
                {l}
              </a>
            </li>
          ))}
          <li>
            <a href="/live-map" className="inline-flex items-center gap-1.5 font-medium text-foreground">
              <span className="size-1.5 rounded-full bg-signal" aria-hidden="true" />
              Live map
            </a>
          </li>
        </ul>
      </nav>
      <a
        href="#demo"
        className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
      >
        Book a demo <ArrowUpRight className="size-4" aria-hidden="true" />
      </a>
    </header>
  )
}

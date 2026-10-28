import type { ComponentPropsWithoutRef, ElementType } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/site-design/lib/utils'

export const shellVariants = cva(
  '@container group/card relative flex min-w-0 flex-col overflow-hidden rounded-[28px] p-5 transition-[transform,box-shadow] duration-300 ease-out will-change-transform hover:-translate-y-1 sm:p-6',
  {
    variants: {
      tone: {
        paper:
          'bg-card text-card-foreground shadow-[0_1px_0_oklch(0_0_0/0.02),0_18px_40px_-24px_oklch(0.3_0.05_160/0.35)] ring-1 ring-foreground/5 hover:shadow-[0_1px_0_oklch(0_0_0/0.02),0_28px_50px_-24px_oklch(0.3_0.05_160/0.45)]',
        forest:
          'bg-primary text-primary-foreground shadow-[0_24px_50px_-24px_oklch(0.3_0.05_160/0.7)]',
        sage: 'bg-sage text-foreground ring-1 ring-foreground/5',
        sand: 'bg-sand text-foreground ring-1 ring-foreground/5',
        mist: 'bg-mist text-foreground ring-1 ring-foreground/5',
      },
      tilt: {
        none: '',
        left: 'lg:-rotate-[1.6deg] lg:hover:rotate-0',
        right: 'lg:rotate-[1.6deg] lg:hover:rotate-0',
      },
    },
    defaultVariants: { tone: 'paper', tilt: 'none' },
  },
)

type ShellOwnProps<T extends ElementType> = {
  as?: T
} & VariantProps<typeof shellVariants>

export type CardShellProps<T extends ElementType = 'article'> = ShellOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof ShellOwnProps<T>>

export function CardShell<T extends ElementType = 'article'>({
  as,
  tone,
  tilt,
  className,
  ...props
}: CardShellProps<T>) {
  const Component: ElementType = as ?? 'article'
  return (
    <Component
      data-tone={tone ?? 'paper'}
      className={cn(shellVariants({ tone, tilt }), className)}
      {...props}
    />
  )
}

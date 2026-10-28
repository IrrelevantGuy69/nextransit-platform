'use client'

import { useEffect, useState } from 'react'
import { buses, type Bus } from './transit-data'

export type BusStatus = 'en-route' | 'delayed' | 'completed'

export type LiveBus = Bus & {
  progress: number
  status: BusStatus
  tripsCompleted: number
  /** Seconds remaining at the terminus before the next trip begins. */
  layover: number
}

export type TripLogEntry = { id: string; busCode: string; routeId: string; at: Date }

const TICK_MS = 250
const LAYOVER_SECONDS = 8

const initial: LiveBus[] = buses.map((b) => ({
  ...b,
  progress: b.startProgress,
  status: b.delayed ? 'delayed' : 'en-route',
  tripsCompleted: 0,
  layover: 0,
}))

export function useFleetSimulation(paused: boolean) {
  const [state, setState] = useState({ fleet: initial, log: [] as TripLogEntry[] })

  useEffect(() => {
    if (paused) return
    const dt = TICK_MS / 1000
    const timer = setInterval(() => {
      setState(({ fleet, log }) => {
        const finished: TripLogEntry[] = []
        const next = fleet.map((bus): LiveBus => {
          if (bus.status === 'completed') {
            const layover = bus.layover - dt
            return layover > 0
              ? { ...bus, layover }
              : { ...bus, layover: 0, progress: 0, status: bus.delayed ? 'delayed' : 'en-route' }
          }
          const progress = bus.progress + bus.speed * dt
          if (progress >= 1) {
            finished.push({
              id: `${bus.id}-${bus.tripsCompleted + 1}`,
              busCode: bus.code,
              routeId: bus.routeId,
              at: new Date(),
            })
            return {
              ...bus,
              progress: 1,
              status: 'completed',
              layover: LAYOVER_SECONDS,
              tripsCompleted: bus.tripsCompleted + 1,
            }
          }
          return { ...bus, progress }
        })
        return { fleet: next, log: finished.length ? [...finished, ...log].slice(0, 12) : log }
      })
    }, TICK_MS)
    return () => clearInterval(timer)
  }, [paused])

  return state
}

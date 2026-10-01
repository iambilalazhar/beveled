import { easingFn } from '@/mockup/timeline/easing'
import type { Layout2D, ShotsProject } from './types'

/** Length of the animation; a project without steps is a still that lasts `stillDuration` when exported as video. */
export function totalDuration(p: Pick<ShotsProject, 'steps' | 'export'>): number {
  const sum = p.steps.reduce((a, s) => a + s.duration, 0)
  return sum > 0 ? sum : p.export.stillDuration
}

/** Time at which step `index` has finished (−1 = the base layout, time 0). */
export function stepEnd(p: Pick<ShotsProject, 'steps'>, index: number): number {
  let t = 0
  for (let i = 0; i <= index && i < p.steps.length; i++) t += p.steps[i].duration
  return t
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k

export function mixLayout(a: Layout2D, b: Layout2D, k: number): Layout2D {
  return {
    zoom: lerp(a.zoom, b.zoom, k),
    x: lerp(a.x, b.x, k),
    y: lerp(a.y, b.y, k),
    rotateX: lerp(a.rotateX, b.rotateX, k),
    rotateY: lerp(a.rotateY, b.rotateY, k),
    rotateZ: lerp(a.rotateZ, b.rotateZ, k),
  }
}

/** Layout at time t: each step eases from the previous layout to its own. */
export function layoutAt(p: Pick<ShotsProject, 'base' | 'steps'>, t: number): Layout2D {
  let prev = p.base
  let start = 0
  for (const step of p.steps) {
    const end = start + step.duration
    if (t < end) {
      const k = step.duration > 0 ? Math.min(1, Math.max(0, (t - start) / step.duration)) : 1
      return mixLayout(prev, step.layout, easingFn(step.easing)(k))
    }
    prev = step.layout
    start = end
  }
  return prev
}

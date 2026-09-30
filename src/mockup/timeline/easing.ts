import type { EaseMode, EasePreset, Easing } from './types'

export const EASE_PRESETS: EasePreset[] = ['linear', 'quad', 'cubic', 'quart', 'quint', 'sine', 'expo', 'circ']

export const DEFAULT_EASING: Easing = { preset: 'cubic', mode: 'inOut', bezier: [0.65, 0, 0.35, 1] }
export const LINEAR_EASING: Easing = { preset: 'linear', mode: 'inOut', bezier: [0, 0, 1, 1] }

type Fn = (t: number) => number

/** "In" variants; out and in-out are derived. */
const IN: Record<Exclude<EasePreset, 'custom'>, Fn> = {
  linear: (t) => t,
  quad: (t) => t * t,
  cubic: (t) => t * t * t,
  quart: (t) => t * t * t * t,
  quint: (t) => t * t * t * t * t,
  sine: (t) => 1 - Math.cos((t * Math.PI) / 2),
  expo: (t) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
  circ: (t) => 1 - Math.sqrt(1 - Math.min(1, t * t)),
}

function withMode(fn: Fn, mode: EaseMode): Fn {
  if (mode === 'in') return fn
  if (mode === 'out') return (t) => 1 - fn(1 - t)
  return (t) => (t < 0.5 ? fn(t * 2) / 2 : 1 - fn((1 - t) * 2) / 2)
}

/** Evaluates a CSS-style cubic bezier (x1, y1, x2, y2) at x = t by Newton/bisection. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): Fn {
  const cx = 3 * x1
  const bx = 3 * (x2 - x1) - cx
  const ax = 1 - cx - bx
  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by
  const sampleX = (s: number) => ((ax * s + bx) * s + cx) * s
  const sampleY = (s: number) => ((ay * s + by) * s + cy) * s
  const sampleDX = (s: number) => (3 * ax * s + 2 * bx) * s + cx
  return (x: number) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let s = x
    for (let i = 0; i < 8; i++) {
      const err = sampleX(s) - x
      if (Math.abs(err) < 1e-5) return sampleY(s)
      const d = sampleDX(s)
      if (Math.abs(d) < 1e-6) break
      s -= err / d
    }
    let lo = 0
    let hi = 1
    s = x
    for (let i = 0; i < 30; i++) {
      const v = sampleX(s)
      if (Math.abs(v - x) < 1e-5) break
      if (v < x) lo = s
      else hi = s
      s = (lo + hi) / 2
    }
    return sampleY(s)
  }
}

const cache = new Map<string, Fn>()

export function easingFn(e: Easing): Fn {
  const key = e.preset === 'custom' ? `c:${e.bezier.join(',')}` : `${e.preset}:${e.mode}`
  let fn = cache.get(key)
  if (!fn) {
    fn = e.preset === 'custom' ? cubicBezier(...e.bezier) : withMode(IN[e.preset], e.mode)
    cache.set(key, fn)
  }
  return fn
}

/** Approximate bezier handles for a preset, for drawing it in the curve editor. */
export function presetBezier(preset: EasePreset, mode: EaseMode): [number, number, number, number] {
  const table: Record<Exclude<EasePreset, 'custom' | 'linear'>, [number, number, number, number]> = {
    quad: [0.11, 0, 0.5, 0],
    cubic: [0.32, 0, 0.67, 0],
    quart: [0.5, 0, 0.75, 0],
    quint: [0.64, 0, 0.78, 0],
    sine: [0.12, 0, 0.39, 0],
    expo: [0.7, 0, 0.84, 0],
    circ: [0.55, 0, 1, 0.45],
  }
  if (preset === 'linear' || preset === 'custom') return [0, 0, 1, 1]
  const [x1, y1, x2, y2] = table[preset]
  if (mode === 'in') return [x1, y1, x2, y2]
  if (mode === 'out') return [1 - x2, 1 - y2, 1 - x1, 1 - y1]
  // in-out: blend the in curve's first handle with the out curve's second handle
  return [x1 * 1.2 > 1 ? 1 : Math.min(1, x1 + 0.2), 0, 1 - Math.min(1, x1 + 0.2), 1]
}

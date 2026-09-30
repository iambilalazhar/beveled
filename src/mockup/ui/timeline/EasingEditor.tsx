import { cn } from '@/lib/utils'
import { useRef } from 'react'
import { easingFn, EASE_PRESETS, presetBezier } from '../../timeline/easing'
import type { EaseMode, Easing } from '../../timeline/types'

const SIZE = 168
const PAD = 12

function curvePath(e: Easing, w: number, h: number) {
  const fn = easingFn(e)
  const pts: string[] = []
  for (let i = 0; i <= 48; i++) {
    const x = i / 48
    const y = fn(x)
    pts.push(`${(PAD + x * w).toFixed(1)},${(PAD + (1 - y) * h).toFixed(1)}`)
  }
  return `M${pts.join(' L')}`
}

function MiniCurve({ easing }: { easing: Easing }) {
  const fn = easingFn(easing)
  const pts = Array.from({ length: 25 }, (_, i) => {
    const x = i / 24
    return `${(3 + x * 30).toFixed(1)},${(33 - fn(x) * 30).toFixed(1)}`
  })
  return (
    <svg viewBox="0 0 36 36" className="size-9">
      <path d={`M${pts.join(' L')}`} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

/** Bezier curve editor with In / In Out / Out modes and eight presets, like UltraMock. */
export function EasingEditor({ value, onChange }: { value: Easing; onChange: (e: Easing) => void }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const w = SIZE - PAD * 2
  const h = SIZE - PAD * 2
  const bez = value.preset === 'custom' ? value.bezier : presetBezier(value.preset, value.mode)
  const p1 = { x: PAD + bez[0] * w, y: PAD + (1 - bez[1]) * h }
  const p2 = { x: PAD + bez[2] * w, y: PAD + (1 - bez[3]) * h }

  const drag = (which: 0 | 1) => (e: React.PointerEvent<SVGCircleElement>) => {
    e.preventDefault()
    const svg = svgRef.current!
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    const start = [...bez] as Easing['bezier']
    const move = (ev: PointerEvent) => {
      const r = svg.getBoundingClientRect()
      const x = Math.min(1, Math.max(0, (ev.clientX - r.left - PAD) / w))
      const y = Math.min(1.5, Math.max(-0.5, 1 - (ev.clientY - r.top - PAD) / h))
      const next = [...start] as Easing['bezier']
      next[which * 2] = +x.toFixed(3)
      next[which * 2 + 1] = +y.toFixed(3)
      onChange({ ...value, preset: 'custom', bezier: next })
    }
    const up = () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
  }

  return (
    <div className="w-[196px] space-y-2">
      <svg ref={svgRef} width={SIZE + 12} height={SIZE} className="rounded-lg bg-black/40">
        {[0.25, 0.5, 0.75].map((g) => (
          <g key={g} stroke="rgba(255,255,255,0.06)">
            <line x1={PAD + g * w} y1={PAD} x2={PAD + g * w} y2={PAD + h} />
            <line x1={PAD} y1={PAD + g * h} x2={PAD + w} y2={PAD + g * h} />
          </g>
        ))}
        <rect x={PAD} y={PAD} width={w} height={h} fill="none" stroke="rgba(255,255,255,0.12)" />
        <line x1={PAD} y1={PAD + h} x2={p1.x} y2={p1.y} stroke="rgba(224,93,56,0.6)" />
        <line x1={PAD + w} y1={PAD} x2={p2.x} y2={p2.y} stroke="rgba(224,93,56,0.6)" />
        <path d={curvePath(value, w, h)} fill="none" stroke="white" strokeWidth={2} />
        <circle cx={PAD} cy={PAD + h} r={3} fill="white" />
        <circle cx={PAD + w} cy={PAD} r={3} fill="white" />
        <circle cx={p1.x} cy={p1.y} r={6} fill="#e05d38" className="cursor-grab" onPointerDown={drag(0)} />
        <circle cx={p2.x} cy={p2.y} r={6} fill="#e05d38" className="cursor-grab" onPointerDown={drag(1)} />
      </svg>
      <div className="grid grid-cols-3 gap-0.5 rounded-lg bg-white/[0.05] p-0.5">
        {(['in', 'inOut', 'out'] as EaseMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onChange({ ...value, mode: m, preset: value.preset === 'custom' ? 'cubic' : value.preset })}
            className={cn('h-7 rounded-md font-mono text-[9px] uppercase tracking-wider', value.mode === m && value.preset !== 'custom' ? 'bg-white text-black' : 'text-white/60 hover:text-white')}
          >
            {m === 'inOut' ? 'In out' : m}
          </button>
        ))}
      </div>
      <div className="font-mono text-[9px] uppercase tracking-wider text-white/40">Presets</div>
      <div className="grid grid-cols-4 gap-1">
        {EASE_PRESETS.map((p) => {
          const e: Easing = { preset: p, mode: value.mode, bezier: value.bezier }
          const active = value.preset === p
          return (
            <button
              key={p}
              type="button"
              onClick={() => onChange(e)}
              className={cn('flex flex-col items-center rounded-md border py-1', active ? 'border-primary text-primary' : 'border-white/[0.08] text-white/60 hover:border-white/25 hover:text-white')}
            >
              <MiniCurve easing={e} />
              <span className="font-mono text-[8px] lowercase">{p}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

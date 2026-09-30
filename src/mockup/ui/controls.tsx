import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { RotateCcw } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useEditor } from '../store'
import { useAnimState } from './useAnimState'
import type { AnimKey } from '../timeline/types'

/* ------------------------------------------------------------------ */
/* Typography helpers                                                  */
/* ------------------------------------------------------------------ */

export const labelClass = 'font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-white/60'
export const valueClass = 'font-mono text-[11px] tabular-nums text-white/85'

export function Section({ title, children, onReset, action }: { title: string; children: ReactNode; onReset?: () => void; action?: ReactNode }) {
  return (
    <section className="space-y-1.5">
      <div className="flex h-7 items-center justify-between">
        <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-white/50">{title}</h3>
        <div className="flex items-center gap-1">
          {action}
          {onReset && (
            <button type="button" onClick={onReset} className="rounded p-1 text-white/40 hover:bg-white/10 hover:text-white" title="Reset section">
              <RotateCcw className="size-3" />
            </button>
          )}
        </div>
      </div>
      <div className="space-y-1">{children}</div>
    </section>
  )
}

export function Hint({ children }: { children: ReactNode }) {
  return <span className="ml-1.5 rounded bg-white/[0.08] px-1 py-px font-mono text-[8px] uppercase tracking-wider text-white/40">{children}</span>
}

/* ------------------------------------------------------------------ */
/* Rows                                                                */
/* ------------------------------------------------------------------ */

export function Row({ label, children, className }: { label: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex h-9 items-center justify-between gap-2 rounded-lg bg-white/[0.05] px-3', className)}>
      <span className={labelClass}>{label}</span>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}

export type SliderRowProps = {
  label: ReactNode
  hint?: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  format?: (value: number) => string
  disabled?: boolean
}

/** Drag anywhere on the row to change the value; the number on the right is editable. */
export function SliderRow({ label, hint, value, min, max, step = 0.01, onChange, format, disabled }: SliderRowProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const decimals = step >= 1 ? 0 : step >= 0.1 ? 1 : step >= 0.01 ? 2 : 3
  const pct = ((value - min) / (max - min)) * 100
  const clampSnap = useCallback(
    (v: number) => {
      const snapped = Math.round(v / step) * step
      return Math.min(max, Math.max(min, Number(snapped.toFixed(decimals))))
    },
    [min, max, step, decimals]
  )
  const setFromPointer = useCallback(
    (clientX: number) => {
      const el = trackRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const t = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
      onChange(clampSnap(min + t * (max - min)))
    },
    [min, max, onChange, clampSnap]
  )
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return
    e.preventDefault()
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    setFromPointer(e.clientX)
    const move = (ev: PointerEvent) => setFromPointer(ev.clientX)
    const up = () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
  }
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const big = e.shiftKey ? 10 : 1
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault()
      onChange(clampSnap(value + step * big))
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault()
      onChange(clampSnap(value - step * big))
    }
  }
  const display = format ? format(value) : value.toFixed(decimals)
  return (
    <div className={cn('relative flex h-9 items-center overflow-hidden rounded-lg bg-white/[0.05] select-none', disabled && 'opacity-40')}>
      <div className="pointer-events-none absolute inset-y-0 left-0 bg-white/[0.08]" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
      <div
        ref={trackRef}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        className="relative flex h-full flex-1 cursor-ew-resize touch-none items-center px-3 outline-none focus-visible:ring-1 focus-visible:ring-primary/60"
        onPointerDown={onPointerDown}
        onKeyDown={onKeyDown}
      >
        <span className={labelClass}>{label}</span>
        {hint && <Hint>{hint}</Hint>}
      </div>
      <input
        className={cn(valueClass, 'relative h-full w-16 bg-transparent pr-3 text-right outline-none focus:text-primary')}
        value={editing ?? display}
        onFocus={(e) => {
          setEditing(String(value))
          e.currentTarget.select()
        }}
        onChange={(e) => setEditing(e.target.value)}
        onBlur={() => {
          if (editing !== null) {
            const n = parseFloat(editing)
            if (!Number.isNaN(n)) onChange(clampSnap(n))
          }
          setEditing(null)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur()
          if (e.key === 'Escape') {
            setEditing(null)
            ;(e.currentTarget as HTMLInputElement).blur()
          }
        }}
        disabled={disabled}
      />
    </div>
  )
}

export function SwitchRow({ label, checked, onChange, disabled }: { label: ReactNode; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <Row label={label} className={cn(disabled && 'opacity-40')}>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} className="data-[state=checked]:bg-primary" />
    </Row>
  )
}

export function SelectRow<T extends string>({ label, value, options, onChange }: { label: ReactNode; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as T)}>
      <SelectTrigger className="h-9 w-full justify-between rounded-lg border-0 bg-white/[0.05] px-3 shadow-none hover:bg-white/[0.08] focus-visible:ring-1 focus-visible:ring-primary/60 data-[size=default]:h-9">
        <span className={labelClass}>{label}</span>
        <span className="ml-auto flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-white/85">
          <SelectValue />
        </span>
      </SelectTrigger>
      <SelectContent className="border-white/10 bg-[#161618] font-mono text-[10px] uppercase tracking-wider">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} className="text-[10px] uppercase tracking-wider">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function SegmentRow<T extends string>({ value, options, onChange, className }: { value: T; options: { value: T; label: ReactNode; title?: string }[]; onChange: (v: T) => void; className?: string }) {
  return (
    <div className={cn('grid h-9 gap-0.5 rounded-lg bg-white/[0.05] p-0.5', className)} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          title={o.title}
          onClick={() => onChange(o.value)}
          className={cn(
            'flex items-center justify-center gap-1 rounded-md font-mono text-[10px] uppercase tracking-wider transition-colors',
            o.value === value ? 'bg-white/[0.12] text-white' : 'text-white/45 hover:bg-white/[0.06] hover:text-white/80'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function ColorRow({ label, value, onChange }: { label: ReactNode; value: string; onChange: (hex: string) => void }) {
  const [text, setText] = useState(value)
  useEffect(() => setText(value), [value])
  const commit = () => {
    const v = text.trim()
    if (/^#[0-9a-f]{6}$/i.test(v)) onChange(v.toLowerCase())
    else setText(value)
  }
  return (
    <Row label={label}>
      <input
        className={cn(valueClass, 'w-20 bg-transparent text-right uppercase outline-none focus:text-primary')}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
      />
      <label className="relative size-5 cursor-pointer overflow-hidden rounded-md ring-1 ring-white/20" style={{ background: value }}>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
      </label>
    </Row>
  )
}

/* ------------------------------------------------------------------ */
/* Tiles                                                               */
/* ------------------------------------------------------------------ */

export function TileGrid({ children, cols = 2 }: { children: ReactNode; cols?: number }) {
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {children}
    </div>
  )
}

export function Tile({ active, onClick, children, title, className }: { active?: boolean; onClick: () => void; children: ReactNode; title?: string; className?: string }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center gap-1.5 rounded-lg border p-2 text-center transition-colors',
        active ? 'border-primary/80 bg-primary/10 text-white' : 'border-white/[0.06] bg-white/[0.04] text-white/70 hover:border-white/20 hover:bg-white/[0.07]',
        className
      )}
    >
      {children}
    </button>
  )
}

export function TileLabel({ children }: { children: ReactNode }) {
  return <span className="font-mono text-[9px] uppercase tracking-wider">{children}</span>
}

export function PanelButton({ children, onClick, primary, disabled, className }: { children: ReactNode; onClick?: () => void; primary?: boolean; disabled?: boolean; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-9 w-full items-center justify-center gap-2 rounded-lg font-mono text-[10px] font-semibold uppercase tracking-[0.1em] transition-colors disabled:opacity-40',
        primary ? 'bg-primary text-white hover:bg-primary/90' : 'bg-white/[0.08] text-white/85 hover:bg-white/[0.12]',
        className
      )}
    >
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Keyframable slider                                                  */
/* ------------------------------------------------------------------ */

export function KeyframeButton({ animKey, animated, onKey }: { animKey: AnimKey; animated: boolean; onKey: boolean }) {
  const toggle = useEditor((s) => s.toggleKeyframe)
  return (
    <button
      type="button"
      onClick={() => toggle(animKey)}
      title={onKey ? 'Remove keyframe at playhead' : 'Add keyframe at playhead'}
      aria-label={onKey ? 'Remove keyframe at playhead' : 'Add keyframe at playhead'}
      className={cn(
        'flex h-9 w-7 shrink-0 items-center justify-center rounded-lg transition-colors',
        onKey ? 'bg-primary/20 text-primary' : animated ? 'bg-white/[0.05] text-primary/70 hover:text-primary' : 'bg-white/[0.05] text-white/30 hover:text-white/70'
      )}
    >
      <svg viewBox="0 0 10 10" className="size-2.5">
        <path d="M5 0.8 9.2 5 5 9.2 0.8 5Z" fill={onKey ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.2" />
      </svg>
    </button>
  )
}

/** SliderRow bound to an animatable property: shows the keyframed value and a keyframe diamond. */
export function AnimSliderRow({ animKey, onChange, ...rest }: Omit<SliderRowProps, 'value'> & { animKey: AnimKey }) {
  const { value, animated, onKey } = useAnimState(animKey)
  return (
    <div className="flex items-center gap-1">
      <div className={cn('min-w-0 flex-1', animated && '[&_input]:text-primary')}>
        <SliderRow {...rest} value={value} onChange={onChange} />
      </div>
      <KeyframeButton animKey={animKey} animated={animated} onKey={onKey} />
    </div>
  )
}

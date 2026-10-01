import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { formatTime } from '@/mockup/timeline/evaluate'
import { EasingEditor } from '@/mockup/ui/timeline/EasingEditor'
import { Pause, Play, Plus, Repeat, SkipBack, Spline, Trash2 } from 'lucide-react'
import { useLayoutEffect, useRef, useState } from 'react'
import { useShots } from '../store'
import { totalDuration } from '../timeline'

const mono = 'font-mono text-[10px] uppercase tracking-[0.1em]'
const HEAD = 116
/** Room at the start of the lanes for the base-layout chip. */
const ORIGIN = 52

function Btn({ onClick, title, children, active, className, disabled }: { onClick: () => void; title: string; children: React.ReactNode; active?: boolean; className?: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={cn('flex size-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-30', active && 'bg-primary text-white hover:bg-primary/90', className)}
    >
      {children}
    </button>
  )
}

export function Timeline2D() {
  const project = useShots((s) => s.project)
  const time = useShots((s) => s.time)
  const playing = useShots((s) => s.playing)
  const loop = useShots((s) => s.loop)
  const selected = useShots((s) => s.selected)
  const togglePlay = useShots((s) => s.togglePlay)
  const seek = useShots((s) => s.seek)
  const setLoop = useShots((s) => s.setLoop)
  const addStep = useShots((s) => s.addStep)
  const removeStep = useShots((s) => s.removeStep)
  const select = useShots((s) => s.select)
  const setStepDuration = useShots((s) => s.setStepDuration)
  const setStepEasing = useShots((s) => s.setStepEasing)
  const setExport = useShots((s) => s.setExport)
  const laneRef = useRef<HTMLDivElement>(null)
  const [laneW, setLaneW] = useState(800)
  useLayoutEffect(() => {
    const el = laneRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setLaneW(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const steps = project.steps
  const total = totalDuration(project)
  const pps = Math.max(30, Math.min(220, (laneW - ORIGIN - 24) / Math.max(1, total)))
  const step = steps.find((s) => s.id === selected)

  const scrub = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    const at = (x: number) => seek((x - el.getBoundingClientRect().left - ORIGIN) / pps)
    at(e.clientX)
    const move = (ev: PointerEvent) => at(ev.clientX)
    const up = () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
  }

  const resize = (id: string, start: number, e: React.PointerEvent) => {
    e.stopPropagation()
    const el = e.currentTarget as HTMLElement
    el.setPointerCapture(e.pointerId)
    const left = laneRef.current!.getBoundingClientRect().left
    const move = (ev: PointerEvent) => setStepDuration(id, (ev.clientX - left - ORIGIN) / pps - start)
    const up = () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
  }

  let cursor = 0
  const ticks = Array.from({ length: Math.floor(total) + 1 }, (_, i) => i)

  return (
    <div className="shrink-0 border-t border-white/[0.06] bg-[#0d0d0f]">
      <div className="flex h-12 items-center gap-2 overflow-x-auto px-3 [scrollbar-width:none] [&>*]:shrink-0">
        <button type="button" onClick={addStep} className={cn(mono, 'flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 font-semibold text-white hover:bg-primary/90')}>
          <Plus className="size-3.5" /> Add animation
        </button>
        {step && (
          <>
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className={cn(mono, 'flex h-8 items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 text-white/80 hover:bg-white/10')} title="Easing of this animation">
                  <Spline className="size-3.5" /> Ease · {step.easing.preset}
                </button>
              </PopoverTrigger>
              <PopoverContent side="top" className="w-auto border-white/10 bg-[#161618] p-3 text-white">
                <EasingEditor value={step.easing} onChange={(e) => setStepEasing(step.id, e)} />
              </PopoverContent>
            </Popover>
            <div className="flex h-8 items-center gap-1 rounded-lg bg-white/[0.05] px-2 font-mono text-[10px] text-white/70">
              <span className="text-white/40">DURATION</span>
              <input
                type="number"
                min={0.2}
                max={20}
                step={0.1}
                value={step.duration}
                onChange={(e) => setStepDuration(step.id, Number(e.target.value) || 1)}
                className="w-12 bg-transparent text-right outline-none focus:text-primary"
              />
              s
            </div>
            <Btn title="Delete this animation" onClick={() => removeStep(step.id)}>
              <Trash2 className="size-3.5" />
            </Btn>
          </>
        )}
        <div className="flex min-w-max flex-1 items-center justify-center gap-2">
          <div className="flex h-8 items-center gap-1 rounded-lg bg-white/[0.05] px-3 font-mono text-[11px] tabular-nums">
            <span className="text-white">{formatTime(time)}</span>
            <span className="text-white/30">/</span>
            <span className="text-white/60">{formatTime(total)}</span>
          </div>
          <Btn title="Back to start" onClick={() => seek(0)}>
            <SkipBack className="size-4" />
          </Btn>
          <Btn title={playing ? 'Pause (Space)' : 'Play (Space)'} onClick={togglePlay} className="w-10 bg-white/[0.08]">
            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          </Btn>
          <Btn title={loop ? 'Loop on' : 'Loop off'} onClick={() => setLoop(!loop)} active={loop}>
            <Repeat className="size-4" />
          </Btn>
        </div>
        {!steps.length && (
          <div className="flex h-8 items-center gap-1 rounded-lg bg-white/[0.05] px-2 font-mono text-[10px] text-white/60" title="Length of a video export when there is no animation">
            STILL CLIP
            <input type="number" min={1} max={30} step={0.5} value={project.export.stillDuration} onChange={(e) => setExport({ stillDuration: Math.max(1, Number(e.target.value) || 4) })} className="w-10 bg-transparent text-right outline-none focus:text-primary" />s
          </div>
        )}
      </div>

      <div className="flex border-t border-white/[0.04]">
        <div className="shrink-0 space-y-1 py-1" style={{ width: HEAD }}>
          <div className="h-6" />
          <div className="flex h-10 items-center px-3 font-mono text-[9px] uppercase tracking-[0.12em] text-white/45">Animations</div>
          <div className="flex h-8 items-center px-3 font-mono text-[9px] uppercase tracking-[0.12em] text-white/45">Mockup</div>
        </div>
        <div ref={laneRef} className="relative min-w-0 flex-1 space-y-1 overflow-hidden py-1 pr-3">
          {/* Ruler */}
          <div className="relative h-6 cursor-ew-resize touch-none border-b border-white/[0.06]" onPointerDown={scrub}>
            {ticks.map((t) => (
              <span key={t} className="absolute top-0 h-full border-l border-white/10 pl-1 font-mono text-[9px] text-white/35" style={{ left: ORIGIN + t * pps }}>
                {t}s
              </span>
            ))}
          </div>
          {/* Animation steps */}
          <div className="relative h-10">
            <button
              type="button"
              onClick={() => select('base')}
              title="Base layout"
              className={cn('absolute top-1 z-10 flex h-8 -translate-x-1/2 items-center rounded-md px-2 font-mono text-[9px] uppercase', selected === 'base' ? 'bg-white text-black' : 'bg-white/15 text-white/80 hover:bg-white/25')}
              style={{ left: ORIGIN / 2 }}
            >
              Start
            </button>
            {steps.map((s, i) => {
              const start = cursor
              cursor += s.duration
              const active = s.id === selected
              return (
                <div
                  key={s.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => select(s.id)}
                  className={cn('absolute top-1 flex h-8 items-center justify-between overflow-hidden rounded-md border pl-2 text-left', active ? 'border-primary bg-primary/25' : 'border-white/10 bg-white/[0.07] hover:bg-white/[0.12]')}
                  style={{ left: ORIGIN + start * pps + 2, width: Math.max(24, s.duration * pps - 4) }}
                >
                  <span className="truncate font-mono text-[9px] uppercase tracking-wider text-white/85">
                    Animation {i + 1} · {s.duration.toFixed(1)}s
                  </span>
                  <span className="h-full w-2 shrink-0 cursor-ew-resize bg-white/20 hover:bg-primary" onPointerDown={(e) => resize(s.id, start, e)} title="Drag to change duration" />
                </div>
              )
            })}
            {!steps.length && (
              <button type="button" onClick={addStep} style={{ left: ORIGIN + 4 }} className="absolute top-1 flex h-8 items-center gap-1.5 rounded-md border border-dashed border-white/15 px-3 font-mono text-[9px] uppercase tracking-wider text-white/45 hover:border-primary/60 hover:text-white">
                <Plus className="size-3" /> Add animation: pick a new zoom or tilt and it eases there
              </button>
            )}
          </div>
          {/* Mockup track */}
          <div className="relative h-8">
            <div className="absolute inset-y-1 rounded-md bg-gradient-to-r from-white/[0.1] to-white/[0.04]" style={{ left: ORIGIN, width: Math.max(40, total * pps) }} />
          </div>
          {/* Playhead */}
          <div className="pointer-events-none absolute inset-y-0 z-20 w-px bg-primary" style={{ left: ORIGIN + time * pps }}>
            <span className="absolute -left-1 top-0 size-2 rounded-full bg-primary" />
          </div>
        </div>
      </div>
    </div>
  )
}

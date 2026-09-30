import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Film,
  Minimize2,
  Maximize2,
  Music,
  Pause,
  Play,
  Plus,
  Repeat,
  SkipBack,
  Sparkles,
  Trash2,
  Type,
  WandSparkles,
  X,
  ZoomIn,
} from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { editShot, useEditor } from '../../store'
import { clipStarts, formatTime, sampleShot, totalDuration } from '../../timeline/evaluate'
import { ANIM_LABEL, ANIM_ORDER, MOTION_PRESETS } from '../../timeline/motionPresets'
import type { AnimKey, Clip, Keyframe, ShotClip } from '../../timeline/types'
import { cssBackground } from '../backgroundCss'
import { useAudioLoader, useMediaLoader } from '../useMediaLoader'
import { EasingEditor } from './EasingEditor'

const HEADER_W = 188
const ROW_H = 36
const LANE_H = 28
const RULER_H = 26
const END_PAD = 160

const mono = 'font-mono text-[10px] uppercase tracking-[0.08em]'

/* ------------------------------------------------------------------ */
/* Toolbar                                                             */
/* ------------------------------------------------------------------ */

function ToolButton({ onClick, title, children, active, className, disabled }: { onClick?: () => void; title: string; children: ReactNode; active?: boolean; className?: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-8 items-center justify-center gap-1.5 rounded-lg px-2 text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white disabled:opacity-30',
        active && 'bg-primary text-white hover:bg-primary/90',
        className
      )}
    >
      {children}
    </button>
  )
}

function AddMenu({ primary }: { primary?: boolean }) {
  const addClip = useEditor((s) => s.addClip)
  const { loadFiles } = useMediaLoader()
  const { loadAudioFile } = useAudioLoader()
  const mediaRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const items = [
    { icon: Film, label: 'Media', hint: 'New shot from image or video', run: () => mediaRef.current?.click() },
    { icon: Type, label: 'Text', hint: 'Title or caption card', run: () => addClip('text') },
    { icon: Sparkles, label: 'Logo', hint: 'Brand mark card', run: () => addClip('logo') },
    { icon: Music, label: 'Audio', hint: 'Music or voiceover track', run: () => audioRef.current?.click() },
  ]
  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {primary ? (
            <button type="button" className={cn(mono, 'flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 font-semibold text-white hover:bg-primary/90')}>
              <Plus className="size-3.5" /> Add
            </button>
          ) : (
            <button type="button" title="Add to timeline" className="flex h-8 w-10 items-center justify-center rounded-lg border border-dashed border-white/20 text-white/60 hover:border-primary hover:text-primary">
              <Plus className="size-4" />
            </button>
          )}
        </PopoverTrigger>
        <PopoverContent side="top" align="center" className="w-64 border-white/10 bg-[#161618] p-2 text-white">
          <div className={cn(mono, 'px-2 pb-1 text-white/40')}>Add to timeline</div>
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              onClick={() => {
                setOpen(false)
                it.run()
              }}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-white/[0.06]"
            >
              <span className="flex size-8 items-center justify-center rounded-md bg-white/[0.06]">
                <it.icon className="size-4" />
              </span>
              <span>
                <span className={cn(mono, 'block font-semibold text-white')}>{it.label}</span>
                <span className="block font-mono text-[9px] uppercase tracking-wider text-white/40">{it.hint}</span>
              </span>
            </button>
          ))}
        </PopoverContent>
      </Popover>
      <input
        ref={mediaRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          const files = e.target.files
          if (files?.length) {
            addClip('shot')
            loadFiles(files)
          }
          e.target.value = ''
        }}
      />
      <input
        ref={audioRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void loadAudioFile(f)
          e.target.value = ''
        }}
      />
    </>
  )
}

function PresetsMenu() {
  const apply = useEditor((s) => s.applyMotionPreset)
  const clear = useEditor((s) => s.clearMotion)
  const shotName = useEditor((s) => editShot(s.project, s.selectedClipId).name)
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={cn(mono, 'flex h-8 items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 text-white/80 hover:bg-white/10')}>
          <WandSparkles className="size-3.5" /> Presets <ChevronDown className="size-3 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-[440px] border-white/10 bg-[#161618] p-3 text-white">
        <div className="mb-2 flex items-center justify-between">
          <span className={cn(mono, 'text-white/50')}>Camera moves · applies to {shotName}</span>
          <button type="button" className={cn(mono, 'text-white/40 hover:text-white')} onClick={() => clear()}>
            Clear motion
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {MOTION_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              title={p.description}
              onClick={() => {
                apply(p.id)
                setOpen(false)
              }}
              className="group overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.03] text-left hover:border-primary/60"
            >
              <div className="relative flex h-16 items-center justify-center overflow-hidden bg-gradient-to-b from-white/[0.06] to-transparent [perspective:300px]">
                <div
                  className="h-9 w-14 rounded-[4px] border border-white/40 bg-white/10 shadow-lg"
                  style={{ animation: `bev-preset-${p.id} ${p.duration}s ease-in-out infinite alternate` }}
                />
                <style>{`@keyframes bev-preset-${p.id} { from { transform: ${p.preview[0]} } to { transform: ${p.preview[1]} } }`}</style>
              </div>
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="truncate font-mono text-[9px] uppercase tracking-wider text-white/80">{p.label}</span>
                <span className="font-mono text-[9px] text-white/40">{p.duration}s</span>
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function Timecode() {
  const time = useEditor((s) => s.time)
  const total = useEditor((s) => totalDuration(s.project.clips))
  return (
    <div className={cn('flex h-8 items-center gap-1 rounded-lg bg-white/[0.05] px-3 font-mono text-[11px] tabular-nums')}>
      <span className="text-white">{formatTime(time)}</span>
      <span className="text-white/30">/</span>
      <span className="text-white/60">{formatTime(total)}</span>
    </div>
  )
}

function Toolbar() {
  const mode = useEditor((s) => s.timelineMode)
  const setMode = useEditor((s) => s.setTimelineMode)
  const playing = useEditor((s) => s.playing)
  const togglePlay = useEditor((s) => s.togglePlay)
  const seek = useEditor((s) => s.seek)
  const loop = useEditor((s) => s.loop)
  const setLoop = useEditor((s) => s.setLoop)
  const record = useEditor((s) => s.recordKeyframes)
  const setRecord = useEditor((s) => s.setRecordKeyframes)
  const pps = useEditor((s) => s.pxPerSec)
  const setPps = useEditor((s) => s.setPxPerSec)
  const open = useEditor((s) => s.timelineOpen)
  const setOpen = useEditor((s) => s.setTimelineOpen)
  const selected = useEditor((s) => s.selectedClipId)
  const dup = useEditor((s) => s.duplicateClip)
  const remove = useEditor((s) => s.removeClip)
  const clipCount = useEditor((s) => s.project.clips.length)

  return (
    <div className="flex h-12 shrink-0 items-center gap-2 overflow-x-auto border-b border-white/[0.06] px-3 [scrollbar-width:none] [&>*]:shrink-0">
      <div className="grid grid-cols-2 gap-0.5 rounded-lg bg-white/[0.05] p-0.5">
        {(['simple', 'advanced'] as const).map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)} className={cn(mono, 'h-7 rounded-md px-2.5', mode === m ? 'bg-white/[0.14] text-white' : 'text-white/45 hover:text-white/80')}>
            {m}
          </button>
        ))}
      </div>
      <PresetsMenu />
      {mode === 'advanced' && (
        <button
          type="button"
          onClick={() => setRecord(!record)}
          title="Auto-keyframe: every change to an animatable value writes a keyframe at the playhead"
          className={cn(mono, 'flex h-8 items-center gap-1.5 rounded-lg px-3', record ? 'bg-primary/20 text-primary ring-1 ring-primary/50' : 'bg-white/[0.05] text-white/70 hover:bg-white/10')}
        >
          <span className={cn('size-2 rounded-full', record ? 'animate-pulse bg-primary' : 'bg-primary/70')} /> Record keyframes
        </button>
      )}
      <ToolButton title="Duplicate clip" onClick={() => dup(selected)}>
        <Copy className="size-3.5" />
      </ToolButton>
      <ToolButton title="Delete clip" onClick={() => remove(selected)} disabled={clipCount <= 1}>
        <Trash2 className="size-3.5" />
      </ToolButton>

      <div className="flex min-w-max flex-1 items-center justify-center gap-2">
        <AddMenu primary />
        <Timecode />
        <ToolButton title="Back to start (Home)" onClick={() => seek(0)}>
          <SkipBack className="size-4" />
        </ToolButton>
        <ToolButton title={playing ? 'Pause (Space)' : 'Play (Space)'} onClick={togglePlay} className="w-10 bg-white/[0.08]">
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </ToolButton>
        <ToolButton title={loop ? 'Loop on' : 'Loop off'} onClick={() => setLoop(!loop)} active={loop}>
          <Repeat className="size-4" />
        </ToolButton>
      </div>

      <div className="flex items-center gap-2 text-white/50">
        <ZoomIn className="size-3.5" />
        <input type="range" min={30} max={400} value={pps} onChange={(e) => setPps(Number(e.target.value))} className="h-1 w-24 accent-[#e05d38]" aria-label="Timeline zoom" />
      </div>
      <ToolButton title={open ? 'Minimise timeline' : 'Expand timeline'} onClick={() => setOpen(!open)}>
        {open ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
      </ToolButton>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Ruler and playhead                                                  */
/* ------------------------------------------------------------------ */

function useScrub(pps: number) {
  const seek = useEditor((s) => s.seek)
  return (e: React.PointerEvent<HTMLElement>, container: HTMLElement) => {
    e.preventDefault()
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    const at = (clientX: number) => {
      const r = container.getBoundingClientRect()
      seek(Math.max(0, (clientX - r.left) / pps))
    }
    at(e.clientX)
    const move = (ev: PointerEvent) => at(ev.clientX)
    const up = () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
  }
}

function Ruler({ width, pps, innerRef }: { width: number; pps: number; innerRef: React.RefObject<HTMLDivElement | null> }) {
  const scrub = useScrub(pps)
  const seconds = Math.ceil(width / pps)
  const step = pps < 45 ? 2 : 1
  return (
    <div className="relative h-[26px] cursor-ew-resize border-b border-white/[0.06] select-none" style={{ width }} onPointerDown={(e) => innerRef.current && scrub(e, innerRef.current)}>
      {Array.from({ length: seconds + 1 }, (_, s) => (
        <div key={s} className="absolute top-0 h-full" style={{ left: s * pps }}>
          {s % step === 0 && <span className="absolute left-1 top-1 font-mono text-[9px] text-white/40">{s}s</span>}
          <div className="absolute bottom-0 h-2.5 w-px bg-white/25" />
          {pps >= 60 &&
            [0.25, 0.5, 0.75].map((f) => <div key={f} className="absolute bottom-0 w-px bg-white/10" style={{ left: f * pps, height: f === 0.5 ? 7 : 4 }} />)}
        </div>
      ))}
    </div>
  )
}

function Playhead({ pps, height, innerRef }: { pps: number; height: number; innerRef: React.RefObject<HTMLDivElement | null> }) {
  const time = useEditor((s) => s.time)
  const scrub = useScrub(pps)
  return (
    <div className="pointer-events-none absolute top-0 z-30" style={{ left: time * pps, height }}>
      <div
        className="pointer-events-auto absolute -top-0 -translate-x-1/2 cursor-ew-resize rounded-md bg-white px-1.5 py-0.5 font-mono text-[9px] font-bold tabular-nums text-black shadow"
        onPointerDown={(e) => innerRef.current && scrub(e, innerRef.current)}
      >
        {time.toFixed(2)}
      </div>
      <div className="absolute left-0 top-0 h-full w-px -translate-x-1/2 bg-primary" />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Clips                                                               */
/* ------------------------------------------------------------------ */

const KIND_STYLE: Record<Clip['kind'], { base: string; selected: string; icon: typeof Film }> = {
  shot: { base: 'bg-[#3a2219] border-[#6b3a26] text-[#f3c6b3]', selected: 'bg-primary border-primary text-white', icon: Film },
  text: { base: 'bg-[#2a2140] border-[#4a3a77] text-[#cfc4f5]', selected: 'bg-[#7c5cf5] border-[#9a82ff] text-white', icon: Type },
  logo: { base: 'bg-[#2e2a1a] border-[#5c5125] text-[#efe0a6]', selected: 'bg-[#c9a227] border-[#e6c34a] text-black', icon: Sparkles },
}

function ClipThumb({ clip }: { clip: Clip }) {
  if (clip.kind === 'shot') {
    const m = clip.scene.media
    const bg = cssBackground(clip.scene.background.kind, clip.scene.background.colors, clip.scene.background.angle)
    return (
      <span className="relative size-5 shrink-0 overflow-hidden rounded-[4px] ring-1 ring-white/20" style={{ background: bg }}>
        {m.url && m.kind === 'image' && <img src={m.url} alt="" className="size-full object-cover" />}
      </span>
    )
  }
  const Icon = KIND_STYLE[clip.kind].icon
  return <Icon className="size-3.5 shrink-0" />
}

function ClipPill({ clip, index, x, width, pps, top, starts }: { clip: Clip; index: number; x: number; width: number; pps: number; top: number; starts: number[] }) {
  const selected = useEditor((s) => s.selectedClipId === clip.id)
  const select = useEditor((s) => s.selectClip)
  const setDuration = useEditor((s) => s.setClipDuration)
  const moveClip = useEditor((s) => s.moveClip)
  const clips = useEditor((s) => s.project.clips)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const style = KIND_STYLE[clip.kind]

  const onBodyDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    const startX = e.clientX
    let moved = false
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - startX
      if (!moved && Math.abs(dx) > 6) {
        moved = true
        setDragging(true)
      }
      if (moved) setDragX(dx)
    }
    const up = (ev: PointerEvent) => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      if (!moved) {
        select(clip.id)
        return
      }
      const center = (x + width / 2 + (ev.clientX - startX)) / pps
      let target = 0
      clips.forEach((c, i) => {
        if (c.id === clip.id) return
        const mid = starts[i] + c.duration / 2
        if (center > mid) target = i < index ? i + 1 : i
      })
      if (center <= starts[0] + clips[0].duration / 2) target = 0
      setDragging(false)
      setDragX(0)
      moveClip(clip.id, target)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
  }

  const onResize = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation()
    e.preventDefault()
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    const startX = e.clientX
    const startD = clip.duration
    const move = (ev: PointerEvent) => setDuration(clip.id, startD + (ev.clientX - startX) / pps)
    const up = () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
  }

  const fadeInW = clip.transitionIn.kind === 'fade' ? Math.min(width / 2, clip.transitionIn.duration * pps) : 0
  const fadeOutW = clip.transitionOut.kind === 'fade' ? Math.min(width / 2, clip.transitionOut.duration * pps) : 0

  return (
    <div
      className={cn(
        'group absolute flex items-center gap-1.5 overflow-hidden rounded-lg border px-2 select-none',
        selected ? style.selected : style.base,
        dragging ? 'z-20 cursor-grabbing opacity-90 shadow-2xl' : 'cursor-grab'
      )}
      style={{ left: x + 1 + dragX, width: Math.max(8, width - 2), top, height: ROW_H - 8 }}
      onPointerDown={onBodyDown}
      title={`${clip.name} · ${clip.duration.toFixed(1)}s`}
    >
      {fadeInW > 0 && <div className="pointer-events-none absolute inset-y-0 left-0 bg-gradient-to-r from-black/60 to-transparent" style={{ width: fadeInW }} />}
      {fadeOutW > 0 && <div className="pointer-events-none absolute inset-y-0 right-0 bg-gradient-to-l from-black/60 to-transparent" style={{ width: fadeOutW }} />}
      <ClipThumb clip={clip} />
      <span className={cn(mono, 'relative truncate font-semibold')}>{clip.name}</span>
      <span className="relative ml-auto shrink-0 font-mono text-[9px] opacity-60">{clip.duration.toFixed(1)}s</span>
      <div className="absolute inset-y-0 right-0 w-2 cursor-ew-resize bg-white/0 hover:bg-white/30" onPointerDown={onResize} title="Drag to change duration" />
    </div>
  )
}

function JunctionButton({ index, x, top }: { index: number; x: number; top: number }) {
  const clips = useEditor((s) => s.project.clips)
  const setJunction = useEditor((s) => s.setJunction)
  const tr = index < 0 ? clips[0].transitionIn : clips[index].transitionOut
  const label = index < 0 ? 'Start' : index === clips.length - 1 ? 'End' : 'Transition'
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={`${label}: ${tr.kind === 'fade' ? 'fade' : 'hard cut'}`}
          className={cn(
            'absolute z-10 flex size-5 -translate-x-1/2 items-center justify-center rounded-md border text-[9px] shadow',
            tr.kind === 'fade' ? 'border-primary bg-primary/30 text-primary' : 'border-white/20 bg-[#1b1b1e] text-white/60 hover:text-white'
          )}
          style={{ left: x, top: top + (ROW_H - 8) / 2 - 6 }}
        >
          <svg viewBox="0 0 10 10" className="size-2.5">
            <path d={index < 0 ? 'M1 9 L9 1 L9 9Z' : index === clips.length - 1 ? 'M1 1 L9 9 L1 9Z' : 'M1 1 L5 5 L1 9Z M9 1 L5 5 L9 9Z'} fill="currentColor" />
          </svg>
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" className="w-56 border-white/10 bg-[#161618] p-3 text-white">
        <div className={cn(mono, 'mb-2 text-white/50')}>{label}</div>
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-white/[0.05] p-0.5">
          {(['cut', 'fade'] as const).map((k) => (
            <button key={k} type="button" onClick={() => setJunction(index, k, tr.duration)} className={cn(mono, 'h-8 rounded-md', tr.kind === k ? 'bg-white/[0.14] text-white' : 'text-white/50 hover:text-white')}>
              {k}
            </button>
          ))}
        </div>
        {tr.kind === 'fade' && (
          <label className="mt-3 block">
            <span className={cn(mono, 'flex justify-between text-white/50')}>
              Duration <span className="text-white/80">{tr.duration.toFixed(2)}s</span>
            </span>
            <input type="range" min={0.1} max={1.5} step={0.05} value={tr.duration} onChange={(e) => setJunction(index, 'fade', Number(e.target.value))} className="mt-2 w-full accent-[#e05d38]" />
          </label>
        )}
      </PopoverContent>
    </Popover>
  )
}

/* ------------------------------------------------------------------ */
/* Keyframe lanes                                                      */
/* ------------------------------------------------------------------ */

function Diamond({ clip, animKey, kf, x, top }: { clip: ShotClip; animKey: AnimKey; kf: Keyframe; x: number; top: number }) {
  const selected = useEditor((s) => s.selectedKeyframe?.id === kf.id)
  const selectKf = useEditor((s) => s.selectKeyframe)
  const moveKf = useEditor((s) => s.moveKeyframe)
  const seek = useEditor((s) => s.seek)
  const starts = useEditor(useShallow((s) => clipStarts(s.project.clips)))
  const pps = useEditor((s) => s.pxPerSec)
  const clipStartT = starts[useEditor.getState().project.clips.findIndex((c) => c.id === clip.id)] ?? 0
  const ref = { clipId: clip.id, key: animKey, id: kf.id }

  const onDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    e.preventDefault()
    selectKf(ref)
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    const startX = e.clientX
    const startT = kf.t
    let moved = false
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - startX
      if (!moved && Math.abs(dx) < 3) return
      moved = true
      moveKf(ref, startT + dx / pps)
    }
    const up = () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      if (!moved) seek(clipStartT + kf.t)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
  }

  return (
    <button
      type="button"
      title={`${ANIM_LABEL[animKey]} = ${kf.value.toFixed(2)} at ${kf.t.toFixed(2)}s`}
      className="absolute z-10 -translate-x-1/2 p-1"
      style={{ left: x, top: top + LANE_H / 2 - 9 }}
      onPointerDown={onDown}
    >
      <svg viewBox="0 0 10 10" className="size-2.5">
        <path d="M5 0.5 9.5 5 5 9.5 0.5 5Z" fill={selected ? '#e05d38' : '#f4f4f5'} stroke={selected ? '#ffb199' : '#000'} strokeWidth="0.6" />
      </svg>
    </button>
  )
}

function EaseButton({ clip, animKey, kf, x, top }: { clip: ShotClip; animKey: AnimKey; kf: Keyframe; x: number; top: number }) {
  const setEasing = useEditor((s) => s.setKeyframeEasing)
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Easing"
          className="absolute z-10 flex size-4 -translate-x-1/2 items-center justify-center rounded border border-white/15 bg-[#1b1b1e] text-white/60 hover:border-primary hover:text-primary"
          style={{ left: x, top: top + LANE_H / 2 - 8 }}
        >
          <svg viewBox="0 0 10 10" className="size-2.5">
            <path d="M1 9 C5 9 5 1 9 1" fill="none" stroke="currentColor" strokeWidth="1.3" />
          </svg>
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" className="w-auto border-white/10 bg-[#161618] p-3 text-white">
        <EasingEditor value={kf.easing} onChange={(e) => setEasing({ clipId: clip.id, key: animKey, id: kf.id }, e)} />
      </PopoverContent>
    </Popover>
  )
}

function lanesOf(clip: Clip): AnimKey[] {
  if (clip.kind !== 'shot') return []
  return ANIM_ORDER.filter((k) => clip.tracks[k]?.length)
}

/* ------------------------------------------------------------------ */
/* Track headers (advanced)                                            */
/* ------------------------------------------------------------------ */

function LaneValue({ clip, animKey }: { clip: ShotClip; animKey: AnimKey }) {
  const v = useEditor((s) => {
    const idx = s.project.clips.findIndex((c) => c.id === clip.id)
    const start = clipStarts(s.project.clips)[idx] ?? 0
    return sampleShot(clip, animKey, Math.min(clip.duration, Math.max(0, s.time - start)))
  })
  return <span className="font-mono text-[10px] tabular-nums text-white/50">{v.toFixed(2)}</span>
}

function Headers({ clips }: { clips: Clip[] }) {
  const expanded = useEditor((s) => s.expanded)
  const toggle = useEditor((s) => s.toggleExpanded)
  const selected = useEditor((s) => s.selectedClipId)
  const select = useEditor((s) => s.selectClip)
  const clearTrack = useEditor((s) => s.clearTrack)
  const audio = useEditor((s) => s.project.audio)
  return (
    <div className="shrink-0 border-r border-white/[0.06]" style={{ width: HEADER_W }}>
      <div style={{ height: RULER_H }} className="border-b border-white/[0.06]" />
      {clips.map((c) => {
        const Icon = KIND_STYLE[c.kind].icon
        const lanes = lanesOf(c)
        const isOpen = expanded.includes(c.id)
        return (
          <div key={c.id}>
            <div
              className={cn('flex cursor-pointer items-center gap-1.5 px-2', selected === c.id ? 'bg-primary/10' : 'hover:bg-white/[0.03]')}
              style={{ height: ROW_H }}
              onClick={() => select(c.id)}
            >
              {c.kind === 'shot' ? (
                <button type="button" className="rounded p-0.5 text-white/50 hover:text-white" onClick={(e) => (e.stopPropagation(), toggle(c.id))} title={isOpen ? 'Collapse' : 'Show keyframes'}>
                  {isOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                </button>
              ) : (
                <Icon className="mx-0.5 size-3.5 text-white/50" />
              )}
              <span className={cn(mono, 'truncate font-semibold text-white/85')}>{c.name}</span>
              <span className="ml-auto font-mono text-[9px] text-white/40">{c.duration.toFixed(1)}s</span>
            </div>
            {c.kind === 'shot' &&
              isOpen &&
              (lanes.length ? (
                lanes.map((k) => (
                  <div key={k} className="group flex items-center gap-1 bg-black/20 pl-7 pr-2" style={{ height: LANE_H }}>
                    <span className={cn(mono, 'truncate text-[9px] text-white/60')}>{ANIM_LABEL[k]}</span>
                    <span className="ml-auto" />
                    <LaneValue clip={c} animKey={k} />
                    <button type="button" className="hidden rounded p-0.5 text-white/40 hover:text-white group-hover:block" title="Remove all keyframes" onClick={() => clearTrack(c.id, k)}>
                      <X className="size-3" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="flex items-center bg-black/20 pl-7 pr-2 font-mono text-[9px] text-white/35" style={{ height: LANE_H }}>
                  No keyframes — use ◇ or Presets
                </div>
              ))}
          </div>
        )
      })}
      {audio.url && (
        <div className="flex items-center gap-1.5 px-2" style={{ height: ROW_H }}>
          <Music className="mx-0.5 size-3.5 text-white/50" />
          <span className={cn(mono, 'truncate text-white/70')}>Audio</span>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

function AudioRow({ top, width }: { top: number; width: number }) {
  const audio = useEditor((s) => s.project.audio)
  const setAudio = useEditor((s) => s.setAudio)
  const pps = useEditor((s) => s.pxPerSec)
  if (!audio.url) return null
  const w = Math.min(width, Math.max(0, audio.duration - audio.offset) * pps)
  return (
    <div className="absolute left-0 flex items-center gap-2 overflow-hidden rounded-lg border border-[#2d5c4a] bg-[#16302a] px-2 text-[#9fe0c6]" style={{ top: top + 4, height: ROW_H - 8, width: w }}>
      <Music className="size-3.5 shrink-0" />
      <span className={cn(mono, 'truncate')}>{audio.name ?? 'Audio'}</span>
      <div className="flex h-4 flex-1 items-end gap-px opacity-50">
        {Array.from({ length: Math.max(0, Math.floor(w / 5)) }, (_, i) => (
          <span key={i} className="w-[3px] bg-current" style={{ height: `${25 + 70 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.31))}%` }} />
        ))}
      </div>
      <button type="button" className="shrink-0 rounded p-0.5 hover:bg-white/10" title="Remove audio" onClick={() => setAudio({ url: null, name: null, duration: 0 })}>
        <X className="size-3" />
      </button>
    </div>
  )
}

export function Timeline() {
  const clips = useEditor((s) => s.project.clips)
  const mode = useEditor((s) => s.timelineMode)
  const pps = useEditor((s) => s.pxPerSec)
  const open = useEditor((s) => s.timelineOpen)
  const expanded = useEditor((s) => s.expanded)
  const hasAudio = useEditor((s) => !!s.project.audio.url)
  const playing = useEditor((s) => s.playing)
  const height = useEditor((s) => s.timelineHeight)
  const setHeight = useEditor((s) => s.setTimelineHeight)
  const setPps = useEditor((s) => s.setPxPerSec)
  const clipCount = useEditor((s) => s.project.clips.length)
  const scrollRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [viewW, setViewW] = useState(800)

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setViewW(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [open])

  // Fit the whole timeline into view when clips are added or removed.
  useEffect(() => {
    if (viewW < 240) return
    const total = totalDuration(useEditor.getState().project.clips)
    setPps(Math.min(160, Math.max(30, (viewW - END_PAD) / Math.max(1, total))))
    // Only re-fit when clips are added or removed (or the timeline is reopened), not on every resize.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clipCount, open, viewW > 240])

  const onResize = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    const startY = e.clientY
    const startH = height
    const move = (ev: PointerEvent) => setHeight(startH - (ev.clientY - startY))
    const up = () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
  }

  // Keep the playhead in view while playing.
  useEffect(() => {
    if (!playing) return
    return useEditor.subscribe((s) => {
      const el = scrollRef.current
      if (!el) return
      const x = s.time * s.pxPerSec
      if (x > el.scrollLeft + el.clientWidth - 60) el.scrollLeft = x - 60
      else if (x < el.scrollLeft) el.scrollLeft = Math.max(0, x - 60)
    })
  }, [playing])

  const starts = useMemo(() => clipStarts(clips), [clips])
  const total = totalDuration(clips)
  const contentW = Math.max(viewW, total * pps + END_PAD)
  const scrub = useScrub(pps)

  // Row layout
  const rows: { clip: Clip; index: number; top: number; lanes: AnimKey[] }[] = []
  let y = 0
  if (mode === 'simple') {
    clips.forEach((clip, index) => rows.push({ clip, index, top: 0, lanes: [] }))
    y = ROW_H
  } else {
    clips.forEach((clip, index) => {
      const lanes = expanded.includes(clip.id) ? lanesOf(clip) : []
      rows.push({ clip, index, top: y, lanes })
      y += ROW_H + (expanded.includes(clip.id) && clip.kind === 'shot' ? Math.max(1, lanes.length) * LANE_H : 0)
    })
  }
  const audioTop = y
  const bodyH = y + (hasAudio ? ROW_H : 0)

  return (
    <section className="relative flex shrink-0 flex-col border-t border-white/[0.06] bg-[#0d0d0f]">
      {open && (
        <div className="group absolute inset-x-0 -top-1.5 z-40 flex h-3 cursor-ns-resize items-center justify-center" onPointerDown={onResize} title="Drag to resize the timeline">
          <div className="h-1 w-10 rounded-full bg-white/15 group-hover:bg-primary/70" />
        </div>
      )}
      <Toolbar />
      {open && (
        <div className="flex overflow-y-auto" style={{ height }}>
          {mode === 'advanced' && <Headers clips={clips} />}
          <div ref={scrollRef} className="relative min-w-0 flex-1 overflow-x-auto overflow-y-hidden [scrollbar-color:rgba(255,255,255,0.15)_transparent] [scrollbar-width:thin]">
            <div ref={innerRef} className="relative" style={{ width: contentW, minHeight: RULER_H + bodyH + 8 }}>
              <Ruler width={contentW} pps={pps} innerRef={innerRef} />
              <div
                className="relative"
                style={{ height: bodyH + 8 }}
                onPointerDown={(e) => {
                  if (e.target === e.currentTarget && innerRef.current) scrub(e, innerRef.current)
                }}
              >
                {rows.map(({ clip, index, top, lanes }) => (
                  <div key={clip.id}>
                    {mode === 'advanced' && <div className="pointer-events-none absolute inset-x-0 border-b border-white/[0.04]" style={{ top: top + ROW_H }} />}
                    <ClipPill clip={clip} index={index} x={starts[index] * pps} width={clip.duration * pps} pps={pps} top={top + 4} starts={starts} />
                    {clip.kind === 'shot' &&
                      lanes.map((k, li) => {
                        const laneTop = top + ROW_H + li * LANE_H
                        const keys = clip.tracks[k] ?? []
                        return (
                          <div key={k}>
                            <div className="absolute bg-black/20" style={{ left: 0, right: 0, top: laneTop, height: LANE_H }} />
                            <div
                              className="absolute h-px bg-white/20"
                              style={{ left: (starts[index] + (keys[0]?.t ?? 0)) * pps, width: ((keys[keys.length - 1]?.t ?? 0) - (keys[0]?.t ?? 0)) * pps, top: laneTop + LANE_H / 2 }}
                            />
                            {keys.map((kfr) => (
                              <Diamond key={kfr.id} clip={clip} animKey={k} kf={kfr} x={(starts[index] + kfr.t) * pps} top={laneTop} />
                            ))}
                            {keys.slice(0, -1).map((kfr, ki) =>
                              (keys[ki + 1].t - kfr.t) * pps > 28 ? (
                                <EaseButton key={`e${kfr.id}`} clip={clip} animKey={k} kf={kfr} x={(starts[index] + (kfr.t + keys[ki + 1].t) / 2) * pps} top={laneTop} />
                              ) : null
                            )}
                          </div>
                        )
                      })}
                  </div>
                ))}
                {mode === 'simple' && (
                  <>
                    <JunctionButton index={-1} x={4} top={4} />
                    {clips.map((c, i) => (
                      <JunctionButton key={c.id} index={i} x={(starts[i] + c.duration) * pps - (i === clips.length - 1 ? 4 : 0)} top={4} />
                    ))}
                    <div className="absolute" style={{ left: total * pps + 14, top: 4 }}>
                      <AddMenu />
                    </div>
                  </>
                )}
                {mode === 'advanced' &&
                  clips.slice(0, -1).map((c, i) => <JunctionButton key={c.id} index={i} x={(starts[i] + c.duration) * pps} top={rows[i].top + 4} />)}
                <AudioRow top={audioTop} width={contentW} />
              </div>
              <Playhead pps={pps} height={RULER_H + bodyH + 8} innerRef={innerRef} />
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

/** Plays the project's audio track in sync with the playhead while previewing. */
export function AudioPreview() {
  const audio = useEditor((s) => s.project.audio)
  const playing = useEditor((s) => s.playing)
  const ref = useRef<HTMLAudioElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !audio.url) return
    el.volume = Math.min(1, audio.volume)
    if (!playing) {
      el.pause()
      return
    }
    el.currentTime = useEditor.getState().time + audio.offset
    void el.play().catch(() => undefined)
    const unsub = useEditor.subscribe((s) => {
      if (Math.abs(el.currentTime - (s.time + audio.offset)) > 0.3) el.currentTime = s.time + audio.offset
    })
    return () => {
      unsub()
      el.pause()
    }
  }, [playing, audio.url, audio.offset, audio.volume])
  return audio.url ? <audio ref={ref} src={audio.url} preload="auto" className="hidden" /> : null
}

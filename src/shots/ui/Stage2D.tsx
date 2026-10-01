import { cn } from '@/lib/utils'
import { Upload } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ShotsScene } from '../scene/ShotsScene'
import { editedLayout, useShots } from '../store'
import { loadShotsFiles } from './useShotsMedia'

const PAD = 32
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** The 2-D canvas, letterboxed to the frame size. Drag moves, scroll zooms, shift-drag tilts. */
export function Stage2D() {
  const boxRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ width: 0, height: 0 })
  const frame = useShots((s) => s.project.frame)
  const hasMedia = useShots((s) => !!s.project.mockup.media[0]?.url)
  const setCanvasSize = useShots((s) => s.setCanvasSize)
  const [drop, setDrop] = useState(false)

  useLayoutEffect(() => {
    const el = boxRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setBox({ width: Math.floor(e.contentRect.width), height: Math.floor(e.contentRect.height) }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const ratio = frame.width / Math.max(1, frame.height)
  const availW = Math.max(0, box.width - PAD * 2)
  const availH = Math.max(0, box.height - PAD * 2)
  const w = availW / availH > ratio ? Math.round(availH * ratio) : availW
  const h = availW / availH > ratio ? availH : Math.round(availW / ratio)
  useEffect(() => {
    if (w > 0 && h > 0) setCanvasSize({ width: w, height: h })
  }, [w, h, setCanvasSize])

  useEffect(() => {
    const el = frameRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const s = useShots.getState()
      const l = editedLayout(s)
      s.setLayout({ zoom: clamp(l.zoom * Math.exp(-e.deltaY * 0.0015), 0.2, 4) })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    let lx = e.clientX
    let ly = e.clientY
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - lx
      const dy = ev.clientY - ly
      lx = ev.clientX
      ly = ev.clientY
      const s = useShots.getState()
      const l = editedLayout(s)
      const fine = ev.altKey ? 0.25 : 1
      if (ev.shiftKey) s.setLayout({ rotateY: clamp(l.rotateY + dx * 0.3 * fine, -75, 75), rotateX: clamp(l.rotateX - dy * 0.3 * fine, -75, 75) })
      else s.setLayout({ x: clamp(l.x + ((dx / Math.max(1, w)) * 2 * fine) / 1, -1.5, 1.5), y: clamp(l.y - (dy / Math.max(1, h)) * 2 * fine, -1.5, 1.5) })
    }
    const up = () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
  }

  return (
    <div
      ref={boxRef}
      className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[#0a0a0a]"
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('Files')) {
          e.preventDefault()
          setDrop(true)
        }
      }}
      onDragLeave={() => setDrop(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDrop(false)
        loadShotsFiles(e.dataTransfer.files)
      }}
    >
      <div
        ref={frameRef}
        onPointerDown={onPointerDown}
        className="relative cursor-grab touch-none overflow-hidden rounded-xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/10 active:cursor-grabbing"
        style={{ width: w, height: h, background: 'repeating-conic-gradient(#2a2a2e 0% 25%, #1c1c20 0% 50%) 50% / 16px 16px' }}
      >
        {w > 0 && h > 0 && <ShotsScene />}
        {!hasMedia && (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
            <label className="pointer-events-auto flex cursor-pointer items-center gap-3 rounded-full bg-black/70 py-1.5 pl-4 pr-1.5 text-[12px] text-white/85 shadow-lg backdrop-blur" onPointerDown={(e) => e.stopPropagation()}>
              Drop, paste or upload images and videos
              <span className="flex h-7 items-center gap-1.5 rounded-full bg-primary px-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-white">
                <Upload className="size-3" /> Upload
              </span>
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  loadShotsFiles(e.target.files)
                  e.target.value = ''
                }}
              />
            </label>
          </div>
        )}
        {drop && (
          <div className={cn('pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl border-2 border-dashed border-primary bg-primary/10')}>
            <span className="rounded-full bg-black/70 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-white">Drop to add</span>
          </div>
        )}
      </div>
      <span className="pointer-events-none absolute right-3 top-2 font-mono text-[9px] uppercase tracking-wider text-white/30">
        {frame.width}×{frame.height}
      </span>
    </div>
  )
}

import { cn } from '@/lib/utils'
import { Minus, Plus, RotateCcw, Upload } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ASPECTS, CAMERA_PRESETS, DEFAULT_SCENE } from '../presets'
import { MockupScene } from '../scene/Scene'
import { currentSection, editShot, useEditor, useScene } from '../store'
import { clipStart, sampleShot } from '../timeline/evaluate'
import { useAnimState } from './useAnimState'
import { useMediaLoader } from './useMediaLoader'

const PAD = 28

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ width: Math.floor(width), height: Math.floor(height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, size] as const
}

/** The stage: aspect-ratio frame around the WebGL canvas, camera gestures, drop zone and focus handle. */
export function Stage() {
  const [ref, box] = useElementSize<HTMLDivElement>()
  const frame = useScene('frame')
  const media = useScene('media')
  const depth = useScene('depth')
  const update = useEditor((s) => s.update)
  const setCanvasSize = useEditor((s) => s.setCanvasSize)
  const setDragging = useEditor((s) => s.setDragging)
  const { loadFiles } = useMediaLoader()
  const [dropActive, setDropActive] = useState(false)
  const frameRef = useRef<HTMLDivElement>(null)

  const ratio = frame.aspect === 'custom' ? frame.customWidth / Math.max(1, frame.customHeight) : ASPECTS.find((a) => a.id === frame.aspect)?.ratio ?? null
  const availW = Math.max(0, box.width - PAD * 2)
  const availH = Math.max(0, box.height - PAD * 2)
  let w = availW
  let h = availH
  if (ratio) {
    if (availW / availH > ratio) {
      h = availH
      w = Math.round(availH * ratio)
    } else {
      w = availW
      h = Math.round(availW / ratio)
    }
  }
  useEffect(() => {
    if (w > 0 && h > 0) setCanvasSize({ width: w, height: h })
  }, [w, h, setCanvasSize])

  /* ---------------- camera gestures ---------------- */
  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return
      const el = e.currentTarget
      el.setPointerCapture(e.pointerId)
      setDragging(true)
      let lastX = e.clientX
      let lastY = e.clientY
      const pan = e.shiftKey
      const move = (ev: PointerEvent) => {
        const dx = ev.clientX - lastX
        const dy = ev.clientY - lastY
        lastX = ev.clientX
        lastY = ev.clientY
        const cam = currentSection('camera')
        if (pan || ev.shiftKey) {
          update('camera', {
            panX: clamp(cam.panX - dx / 500, -1.5, 1.5),
            panY: clamp(cam.panY + dy / 500, -1.5, 1.5),
          })
        } else {
          update('camera', {
            yaw: wrap(cam.yaw - dx * 0.4),
            pitch: clamp(cam.pitch + dy * 0.4, -89, 89),
          })
        }
      }
      const up = () => {
        setDragging(false)
        el.removeEventListener('pointermove', move)
        el.removeEventListener('pointerup', up)
        el.removeEventListener('pointercancel', up)
      }
      el.addEventListener('pointermove', move)
      el.addEventListener('pointerup', up)
      el.addEventListener('pointercancel', up)
    },
    [update, setDragging]
  )

  useEffect(() => {
    const el = frameRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const cam = currentSection('camera')
      const factor = Math.exp(-e.deltaY * 0.0015)
      update('camera', { zoom: clamp(cam.zoom * factor, 0.3, 6) })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [update])

  /* ---------------- drag & drop ---------------- */
  const onDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
      if (!dropActive) setDropActive(true)
    }
  }
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDropActive(false)
    loadFiles(e.dataTransfer.files)
  }

  const showFocus = depth.mode === 'radial' || depth.mode === 'tilt-shift' || depth.mode === 'directional'

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#0a0a0a]">
    <div ref={ref} className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden" onDragOver={onDragOver} onDragLeave={() => setDropActive(false)} onDrop={onDrop}>
      <div
        ref={frameRef}
        className={cn(
          'relative overflow-hidden rounded-2xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/10',
          'cursor-grab active:cursor-grabbing touch-none'
        )}
        style={{
          width: w,
          height: h,
          background: 'repeating-conic-gradient(#2a2a2e 0% 25%, #1c1c20 0% 50%) 50% / 16px 16px',
        }}
        onPointerDown={onPointerDown}
      >
        {w > 0 && h > 0 && <MockupScene />}
        {showFocus && <FocusHandle width={w} height={h} />}
        {!media.url && (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
            <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-black/70 py-1.5 pl-4 pr-1.5 text-[12px] text-white/85 shadow-lg backdrop-blur">
              <span>Drop a screenshot or video here, or paste it</span>
              <label className="flex h-7 cursor-pointer items-center gap-1.5 rounded-full bg-primary px-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-white hover:bg-primary/90">
                <Upload className="size-3" /> Upload
                <input
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(e) => {
                    loadFiles(e.target.files)
                    e.target.value = ''
                  }}
                />
              </label>
            </div>
          </div>
        )}
        {dropActive && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl border-2 border-dashed border-primary bg-primary/10 backdrop-blur-[2px]">
            <span className="rounded-full bg-black/70 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-white">Drop to set the screen</span>
          </div>
        )}
      </div>
      {ratio && (
        <span className="pointer-events-none absolute right-3 top-2 font-mono text-[9px] uppercase tracking-wider text-white/30">
          {frame.aspect === 'custom' ? `${frame.customWidth}×${frame.customHeight}` : frame.aspect} · {w}×{h}
        </span>
      )}
    </div>
    <StageFooter />
    </div>
  )
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}
function wrap(deg: number) {
  return ((((deg + 180) % 360) + 360) % 360) - 180
}

/** Draggable focus point (and guide line) for the screen-space blur modes. */
function FocusHandle({ width, height }: { width: number; height: number }) {
  const depth = useScene('depth')
  const update = useEditor((s) => s.update)
  const focusX = useAnimState('depth.focusX').value
  const focusY = useAnimState('depth.focusY').value
  const x = focusX * width
  const y = focusY * height
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation()
    e.preventDefault()
    const el = e.currentTarget
    const parent = el.parentElement!
    el.setPointerCapture(e.pointerId)
    const move = (ev: PointerEvent) => {
      const rect = parent.getBoundingClientRect()
      update('depth', {
        focusX: clamp((ev.clientX - rect.left) / rect.width, 0, 1),
        focusY: clamp((ev.clientY - rect.top) / rect.height, 0, 1),
      })
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
  const a = (depth.angle * Math.PI) / 180
  // Band direction (tilt-shift) or boundary line (directional) in pixel space (y down).
  const dir = depth.mode === 'directional' ? { x: -Math.sin(a), y: -Math.cos(a) } : { x: Math.cos(a), y: -Math.sin(a) }
  const L = Math.hypot(width, height)
  const band = depth.mode === 'tilt-shift' ? depth.focusSize * height : 0
  const nx = -dir.y
  const ny = dir.x
  return (
    <>
      {depth.mode !== 'radial' && (
        <svg className="pointer-events-none absolute inset-0" width={width} height={height}>
          <line x1={x - dir.x * L} y1={y - dir.y * L} x2={x + dir.x * L} y2={y + dir.y * L} stroke="rgba(224,93,56,0.7)" strokeWidth={1} strokeDasharray="6 6" />
          {band > 0 && (
            <>
              <line x1={x - dir.x * L + nx * band} y1={y - dir.y * L + ny * band} x2={x + dir.x * L + nx * band} y2={y + dir.y * L + ny * band} stroke="rgba(224,93,56,0.35)" strokeWidth={1} />
              <line x1={x - dir.x * L - nx * band} y1={y - dir.y * L - ny * band} x2={x + dir.x * L - nx * band} y2={y + dir.y * L - ny * band} stroke="rgba(224,93,56,0.35)" strokeWidth={1} />
            </>
          )}
        </svg>
      )}
      {depth.mode === 'radial' && (
        <div
          className="pointer-events-none absolute rounded-full border border-primary/40"
          style={{ left: x - depth.focusSize * height, top: y - depth.focusSize * height, width: depth.focusSize * height * 2, height: depth.focusSize * height * 2 }}
        />
      )}
      <div
        role="slider"
        aria-label="Focus point"
        aria-valuenow={Math.round(depth.focusX * 100)}
        className="absolute z-10 flex size-6 -translate-x-1/2 -translate-y-1/2 cursor-move items-center justify-center rounded-full bg-primary/20 ring-2 ring-primary backdrop-blur-sm"
        style={{ left: x, top: y }}
        onPointerDown={onPointerDown}
      >
        <span className="size-1.5 rounded-full bg-primary" />
      </div>
    </>
  )
}

function StageFooter() {
  const cam = useScene('camera')
  const update = useEditor((s) => s.update)
  const activePreset = CAMERA_PRESETS.find((p) => p.yaw === cam.yaw && p.pitch === cam.pitch && p.roll === cam.roll && p.fov === cam.fov)?.id
  const zoom = useEditor((s) => currentZoom(s))
  const setZoom = (z: number) => update('camera', { zoom: Math.min(6, Math.max(0.3, Number(z.toFixed(2)))) })
  return (
    <div className="flex h-10 shrink-0 items-center gap-2 px-3">
      <div className="flex items-center gap-0.5 rounded-lg bg-white/[0.05] p-0.5">
        {CAMERA_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => update('camera', { yaw: p.yaw, pitch: p.pitch, roll: p.roll, fov: p.fov })}
            className={cn('h-7 rounded-md px-2.5 font-mono text-[9px] uppercase tracking-wider transition-colors', activePreset === p.id ? 'bg-white/[0.12] text-white' : 'text-white/50 hover:bg-white/[0.06] hover:text-white/85')}
          >
            {p.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => update('camera', { ...DEFAULT_SCENE.camera })}
        className="flex h-8 items-center gap-1.5 rounded-md px-2 font-mono text-[9px] uppercase tracking-wider text-white/55 hover:bg-white/[0.06] hover:text-white"
        title="Reset view"
      >
        <RotateCcw className="size-3" /> Reset view
      </button>
      <div className="flex-1 truncate text-center font-mono text-[9px] uppercase tracking-wider text-white/30">Drag to rotate · Scroll to zoom · Shift + drag to pan · Space to play</div>
      <div className="flex items-center gap-1 rounded-lg bg-white/[0.05] p-0.5">
        <button type="button" onClick={() => setZoom(zoom / 1.15)} className="flex size-7 items-center justify-center rounded-md text-white/60 hover:bg-white/[0.08] hover:text-white" title="Zoom out">
          <Minus className="size-3" />
        </button>
        <button type="button" onClick={() => setZoom(1)} className="w-12 text-center font-mono text-[10px] tabular-nums text-white/80" title="Reset zoom">
          {Math.round(zoom * 100)}%
        </button>
        <button type="button" onClick={() => setZoom(zoom * 1.15)} className="flex size-7 items-center justify-center rounded-md text-white/60 hover:bg-white/[0.08] hover:text-white" title="Zoom in">
          <Plus className="size-3" />
        </button>
      </div>
    </div>
  )
}

function currentZoom(s: ReturnType<typeof useEditor.getState>) {
  const shot = editShot(s.project, s.selectedClipId)
  return sampleShot(shot, 'camera.zoom', Math.min(shot.duration, Math.max(0, s.time - clipStart(s.project.clips, shot.id))))
}

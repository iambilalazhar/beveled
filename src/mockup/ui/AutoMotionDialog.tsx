import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Crosshair, Trash2, X } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { getPlaceholderTexture } from '../scene/media'
import { editShot, useEditor } from '../store'
import { DEFAULT_AUTO_MOTION, visibleMediaRect, type AutoMotionOptions } from '../timeline/autoMotion'
import { newId } from '../timeline/motionPresets'
import type { FocusArea } from '../timeline/types'
import { PanelButton, SliderRow, SwitchRow } from './controls'

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/** Image of the screen media the user draws focus areas on. Falls back to the placeholder wallpaper. */
function useMediaPreview(url: string | null, kind: string | null, aspect: number) {
  return useMemo(() => {
    if (url) return { src: url, video: kind === 'video' }
    const canvas = getPlaceholderTexture(aspect).image as HTMLCanvasElement
    return { src: canvas.toDataURL('image/jpeg', 0.85), video: false }
  }, [url, kind, aspect])
}

function AutoMotionBody() {
  const shot = useEditor((s) => editShot(s.project, s.selectedClipId))
  const apply = useEditor((s) => s.applyAutoMotion)
  const close = useEditor((s) => s.setAutoMotionOpen)
  const media = shot.scene.media
  const aspect = media.width && media.height ? media.width / media.height : 16 / 10
  const preview = useMediaPreview(media.url, media.kind, aspect)
  const visible = useMemo(() => visibleMediaRect(shot.scene), [shot.scene])
  const [areas, setAreas] = useState<FocusArea[]>(shot.focusAreas ?? [])
  const [opts, setOpts] = useState<AutoMotionOptions>(DEFAULT_AUTO_MOTION)
  const [draft, setDraft] = useState<FocusArea | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)

  // Fit the media into a 620×440 box.
  const maxW = 620
  const maxH = 440
  const w = aspect > maxW / maxH ? maxW : Math.round(maxH * aspect)
  const h = aspect > maxW / maxH ? Math.round(maxW / aspect) : maxH

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('button')) return
    const rect = boxRef.current!.getBoundingClientRect()
    const x0 = clamp01((e.clientX - rect.left) / rect.width)
    const y0 = clamp01((e.clientY - rect.top) / rect.height)
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    let current: FocusArea = { id: newId('fa'), x: x0, y: y0, w: 0, h: 0 }
    setDraft(current)
    const move = (ev: PointerEvent) => {
      const x1 = clamp01((ev.clientX - rect.left) / rect.width)
      const y1 = clamp01((ev.clientY - rect.top) / rect.height)
      current = { ...current, x: Math.min(x0, x1), y: Math.min(y0, y1), w: Math.abs(x1 - x0), h: Math.abs(y1 - y0) }
      setDraft(current)
    }
    const up = () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
      setDraft(null)
      // A click without a drag makes a default-sized area centred on the click.
      const area = current.w * w < 12 || current.h * h < 12 ? { ...current, x: clamp01(x0 - 0.12), y: clamp01(y0 - 0.08), w: 0.24, h: 0.16 } : current
      setAreas((list) => [...list, { ...area, w: Math.min(area.w, 1 - area.x), h: Math.min(area.h, 1 - area.y) }])
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
  }

  const total = (opts.overview ? 0.5 + opts.move + 0.4 : -opts.move) + areas.length * (opts.move + opts.hold)

  return (
    <div className="flex gap-5">
      <div className="space-y-2">
        <div
          ref={boxRef}
          className="relative cursor-crosshair touch-none select-none overflow-hidden rounded-lg bg-black ring-1 ring-white/10"
          style={{ width: w, height: h }}
          onPointerDown={onPointerDown}
        >
          {preview.video ? (
            <video src={preview.src} muted playsInline className="pointer-events-none absolute inset-0 size-full object-fill" />
          ) : (
            <img src={preview.src} alt="" draggable={false} className="pointer-events-none absolute inset-0 size-full object-fill" />
          )}
          {/* Dim the parts of the media that are cropped off the screen */}
          <div
            className="pointer-events-none absolute border border-white/30"
            style={{ left: `${visible.x * 100}%`, top: `${visible.y * 100}%`, width: `${visible.w * 100}%`, height: `${visible.h * 100}%`, boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)' }}
          />
          {areas.map((a, i) => (
            <div
              key={a.id}
              className="absolute rounded-md border-2 border-dashed border-primary bg-primary/10"
              style={{ left: `${a.x * 100}%`, top: `${a.y * 100}%`, width: `${a.w * 100}%`, height: `${a.h * 100}%` }}
            >
              <span className="absolute -left-px -top-px flex h-5 min-w-5 items-center justify-center rounded-br-md rounded-tl-md bg-primary px-1 font-mono text-[10px] font-bold text-white">{i + 1}</span>
              <button
                type="button"
                title="Remove area"
                onClick={() => setAreas((list) => list.filter((x) => x.id !== a.id))}
                className="absolute -right-2.5 -top-2.5 flex size-5 items-center justify-center rounded-full bg-black text-white ring-1 ring-white/30 hover:bg-primary"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
          {draft && (
            <div className="pointer-events-none absolute rounded-md border-2 border-dashed border-white bg-white/10" style={{ left: `${draft.x * 100}%`, top: `${draft.y * 100}%`, width: `${draft.w * 100}%`, height: `${draft.h * 100}%` }} />
          )}
          {!areas.length && !draft && (
            <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
              <span className="rounded-full bg-black/75 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-white/85">Drag on your image to add focus areas</span>
            </div>
          )}
        </div>
        <p className="font-mono text-[10px] text-white/40">The camera visits areas in order. The outlined region is what fits on the screen.</p>
      </div>

      <div className="flex w-60 flex-col gap-2">
        <SliderRow label="Move" value={opts.move} min={0.3} max={3} step={0.05} onChange={(move) => setOpts({ ...opts, move })} format={(v) => `${v.toFixed(2)}s`} />
        <SliderRow label="Hold" value={opts.hold} min={0} max={4} step={0.05} onChange={(hold) => setOpts({ ...opts, hold })} format={(v) => `${v.toFixed(2)}s`} />
        <SliderRow label="Zoom" value={opts.tightness} min={0} max={1} step={0.01} onChange={(tightness) => setOpts({ ...opts, tightness })} />
        <SliderRow label="Tilt" value={opts.tilt} min={0} max={25} step={1} onChange={(tilt) => setOpts({ ...opts, tilt })} format={(v) => `${v.toFixed(0)}°`} />
        <SwitchRow label="Start & end wide" checked={opts.overview} onChange={(overview) => setOpts({ ...opts, overview })} />
        <SwitchRow label="Slow push-in" checked={opts.drift} onChange={(drift) => setOpts({ ...opts, drift })} />
        <div className="mt-1 flex items-center justify-between px-1 font-mono text-[10px] uppercase tracking-wider text-white/50">
          <span>{areas.length} areas</span>
          <span>{Math.max(0, total).toFixed(1)}s</span>
        </div>
        <div className="mt-auto space-y-1.5">
          <PanelButton primary disabled={!areas.length} onClick={() => apply(areas, opts)}>
            <Crosshair className="size-3" /> Generate camera path
          </PanelButton>
          <div className="flex gap-1.5">
            <PanelButton className="flex-1" onClick={() => setAreas([])} disabled={!areas.length}>
              <Trash2 className="size-3" /> Clear
            </PanelButton>
            <PanelButton className="flex-1" onClick={() => close(false)}>
              Cancel
            </PanelButton>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Auto-motion: draw focus areas on the screenshot and get a camera path that visits each one. */
export function AutoMotionDialog() {
  const open = useEditor((s) => s.autoMotionOpen)
  const setOpen = useEditor((s) => s.setAutoMotionOpen)
  const shotName = useEditor((s) => editShot(s.project, s.selectedClipId).name)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-auto max-w-none border-white/10 bg-[#111114] text-white sm:max-w-none">
        <DialogHeader>
          <DialogTitle className="font-mono text-[12px] font-bold uppercase tracking-[0.14em]">Auto-motion · {shotName}</DialogTitle>
          <DialogDescription className="text-white/50">Click and drag on your image to create one or more focus areas. Beveled writes camera keyframes that glide between them.</DialogDescription>
        </DialogHeader>
        {open && <AutoMotionBody />}
      </DialogContent>
    </Dialog>
  )
}

import { cn } from '@/lib/utils'
import { SliderRow } from '@/mockup/ui/controls'
import { useShallow } from 'zustand/react/shallow'
import { LAYOUT_PRESETS } from '../presets'
import { editedLayout, useShots } from '../store'
import type { Layout2D } from '../types'

const mono = 'font-mono text-[10px] uppercase tracking-[0.1em]'

/** CSS version of a layout, for preset thumbnails. */
function layoutCss(l: Layout2D) {
  return `translate(${l.x * 50}%, ${-l.y * 50}%) scale(${l.zoom * 0.62}) rotateX(${l.rotateX}deg) rotateY(${l.rotateY}deg) rotateZ(${l.rotateZ}deg)`
}

function PresetThumb({ layout, image, active, onClick, label }: { layout: Layout2D; image: string | null; active: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" title={label} onClick={onClick} className={cn('group relative aspect-[4/3] overflow-hidden rounded-lg ring-1 [perspective:220px]', active ? 'ring-2 ring-primary' : 'ring-white/10 hover:ring-white/30')}>
      <span className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-white/[0.02]" />
      <span className="absolute inset-0 flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
        <span className="block h-[62%] w-[82%] overflow-hidden rounded-[4px] bg-white/80 shadow-[0_6px_14px_rgba(0,0,0,0.45)]" style={{ transform: layoutCss(layout) }}>
          {image && <img src={image} alt="" className="size-full object-cover" />}
        </span>
      </span>
      <span className="absolute inset-x-0 bottom-0 bg-black/55 py-0.5 text-center font-mono text-[7px] uppercase tracking-wider text-white/80 opacity-0 group-hover:opacity-100">{label}</span>
    </button>
  )
}

export function LayoutPanel() {
  const { layout, selected, steps, rightTab, count, media } = useShots(
    useShallow((s) => ({ layout: editedLayout(s), selected: s.selected, steps: s.project.steps, rightTab: s.rightTab, count: s.project.mockup.count, media: s.project.mockup.media[0] }))
  )
  const setLayout = useShots((s) => s.setLayout)
  const setRightTab = useShots((s) => s.setRightTab)
  const setMockup = useShots((s) => s.setMockup)
  const stepIndex = steps.findIndex((s) => s.id === selected)
  const image = media?.kind === 'image' ? media.url : null
  const same = (a: Layout2D) => (Object.keys(a) as (keyof Layout2D)[]).every((k) => Math.abs(a[k] - layout[k]) < 1e-3)

  return (
    <aside className="flex w-[264px] shrink-0 flex-col gap-4 overflow-y-auto border-l border-white/[0.06] bg-[#111114] p-3 [scrollbar-width:thin]">
      <div className="grid grid-cols-3 gap-0.5 rounded-lg bg-white/[0.05] p-0.5">
        {([1, 2, 3] as const).map((n) => (
          <button key={n} type="button" onClick={() => setMockup({ count: n })} className={cn(mono, 'flex h-8 items-center justify-center gap-1 rounded-md', count === n ? 'bg-white/[0.14] text-white' : 'text-white/50 hover:text-white')}>
            {Array.from({ length: n }, (_, i) => (
              <span key={i} className="h-3.5 w-2 rounded-[2px] border border-current" />
            ))}
          </button>
        ))}
      </div>

      <div className="rounded-lg bg-primary/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-primary">
        Editing · {stepIndex >= 0 ? `Animation ${stepIndex + 1}` : 'Base layout'}
      </div>

      <div className="grid grid-cols-2 gap-0.5 rounded-lg bg-white/[0.05] p-0.5">
        {(['zoom', 'tilt'] as const).map((t) => (
          <button key={t} type="button" onClick={() => setRightTab(t)} className={cn(mono, 'h-7 rounded-md', rightTab === t ? 'bg-white/[0.14] text-white' : 'text-white/50 hover:text-white')}>
            {t}
          </button>
        ))}
      </div>

      {rightTab === 'zoom' ? (
        <div className="space-y-1">
          <SliderRow label="Zoom" value={Math.round(layout.zoom * 100)} min={20} max={400} step={1} onChange={(v) => setLayout({ zoom: v / 100 })} format={(v) => `${v.toFixed(0)}%`} />
          <SliderRow label="Position X" value={layout.x} min={-1.5} max={1.5} step={0.01} onChange={(x) => setLayout({ x })} />
          <SliderRow label="Position Y" value={layout.y} min={-1.5} max={1.5} step={0.01} onChange={(y) => setLayout({ y })} />
        </div>
      ) : (
        <div className="space-y-1">
          <SliderRow label="Tilt X" value={layout.rotateX} min={-75} max={75} step={0.5} onChange={(rotateX) => setLayout({ rotateX })} format={(v) => `${v.toFixed(0)}°`} />
          <SliderRow label="Tilt Y" value={layout.rotateY} min={-75} max={75} step={0.5} onChange={(rotateY) => setLayout({ rotateY })} format={(v) => `${v.toFixed(0)}°`} />
          <SliderRow label="Rotation" value={layout.rotateZ} min={-180} max={180} step={0.5} onChange={(rotateZ) => setLayout({ rotateZ })} format={(v) => `${v.toFixed(0)}°`} />
        </div>
      )}
      <p className="-mt-2 px-1 font-mono text-[9px] text-white/35">Drag the canvas to move · scroll to zoom · ⇧ + drag to tilt</p>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-white/50">Layout presets</span>
          <button type="button" className="font-mono text-[9px] uppercase tracking-wider text-white/40 hover:text-white" onClick={() => setLayout({ zoom: 1, x: 0, y: 0, rotateX: 0, rotateY: 0, rotateZ: 0 })}>
            Reset
          </button>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {LAYOUT_PRESETS.map((p) => (
            <PresetThumb key={p.id} layout={p.layout} image={image} label={p.label} active={same(p.layout)} onClick={() => setLayout(p.layout)} />
          ))}
        </div>
      </div>
    </aside>
  )
}

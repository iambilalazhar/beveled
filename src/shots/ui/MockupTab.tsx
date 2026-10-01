import { cn } from '@/lib/utils'
import { FINISH_BY_ID } from '@/mockup/presets'
import { MODEL_BY_ID } from '@/mockup/scene/models'
import { ColorRow, Section, SegmentRow, SliderRow, SwitchRow } from '@/mockup/ui/controls'
import { ACCEPT } from '@/mockup/ui/useMediaLoader'
import { ChevronLeft, ChevronRight, ImagePlus, Sparkles, X } from 'lucide-react'
import { useRef } from 'react'
import { BG_LIBRARIES, CORNERS, FLAT_FAMILIES, LAYOUT_PRESETS, SCREENSHOT_STYLES, SHADOWS } from '../presets'
import { useShots } from '../store'
import type { FlatKind, MockupState, ScreenshotStyle } from '../types'
import { loadShotsFiles } from './useShotsMedia'

/** Tiny CSS preview of a screenshot style. */
function StylePreview({ id }: { id: ScreenshotStyle }) {
  const pad = id === 'default' || id === 'outline' ? 0 : 4
  const frame: Record<ScreenshotStyle, string> = {
    default: 'transparent',
    'glass-light': 'rgba(255,255,255,0.45)',
    'glass-dark': 'rgba(20,20,24,0.7)',
    'liquid-glass': 'linear-gradient(135deg, rgba(255,255,255,0.8), rgba(255,255,255,0.15), rgba(255,255,255,0.6))',
    'inset-light': '#f6f6f4',
    'inset-dark': '#1c1c1f',
    outline: 'transparent',
    border: '#ffffff',
  }
  return (
    <span className="flex h-9 w-full items-center justify-center rounded-md bg-gradient-to-br from-[#f0abfc] via-[#a5b4fc] to-[#93c5fd]">
      <span className={cn('flex h-6 w-9 rounded-[5px]', id === 'outline' && 'ring-1 ring-white')} style={{ background: frame[id], padding: pad }}>
        <span className="size-full rounded-[3px] bg-white/95 shadow-sm" />
      </span>
    </span>
  )
}

const MAGIC_LOOKS: { style: ScreenshotStyle; library: string; item: number; layout: string; shadow: MockupState['shadow'] }[] = [
  { style: 'glass-light', library: 'glass', item: 0, layout: 'center', shadow: 'spread' },
  { style: 'default', library: 'gradient', item: 1, layout: 'tilt-right', shadow: 'spread' },
  { style: 'liquid-glass', library: 'cosmic', item: 0, layout: 'float', shadow: 'adaptive' },
  { style: 'inset-dark', library: 'desktop', item: 0, layout: 'center', shadow: 'hug' },
  { style: 'border', library: 'gradient', item: 5, layout: 'tilt-left', shadow: 'spread' },
  { style: 'glass-dark', library: 'mystic', item: 1, layout: 'iso', shadow: 'spread' },
  { style: 'inset-light', library: 'texture', item: 1, layout: 'center', shadow: 'hug' },
  { style: 'default', library: 'abstract', item: 2, layout: 'hero-crop', shadow: 'adaptive' },
]
let magicIndex = -1

function MagicPreset() {
  const setMockup = useShots((s) => s.setMockup)
  const setFrame = useShots((s) => s.setFrame)
  const select = useShots((s) => s.select)
  const setLayout = useShots((s) => s.setLayout)
  const cycle = (dir: number) => {
    magicIndex = (magicIndex + dir + MAGIC_LOOKS.length) % MAGIC_LOOKS.length
    const look = MAGIC_LOOKS[magicIndex]
    const lib = BG_LIBRARIES.find((l) => l.id === look.library)!
    const kind = useShots.getState().project.mockup.kind
    setMockup({ style: look.style, shadow: look.shadow })
    setFrame({ background: lib.items[look.item % lib.items.length].bg })
    select('base')
    setLayout(LAYOUT_PRESETS.find((p) => p.id === (kind === 'screenshot' || kind === 'browser' ? look.layout : 'center'))!.layout)
  }
  return (
    <div className="flex h-10 items-center gap-1 rounded-lg bg-white/[0.05] px-1">
      <button type="button" onClick={() => cycle(-1)} className="flex size-8 items-center justify-center rounded-md text-white/60 hover:bg-white/10 hover:text-white" title="Previous look">
        <ChevronLeft className="size-4" />
      </button>
      <button type="button" onClick={() => cycle(1)} className="flex flex-1 items-center justify-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-white/80 hover:text-white">
        <Sparkles className="size-3.5 text-primary" /> Magic preset
      </button>
      <button type="button" onClick={() => cycle(1)} className="flex size-8 items-center justify-center rounded-md text-white/60 hover:bg-white/10 hover:text-white" title="Next look">
        <ChevronRight className="size-4" />
      </button>
    </div>
  )
}

function MediaSlots() {
  const mockup = useShots((s) => s.project.mockup)
  const setMedia = useShots((s) => s.setMedia)
  const inputRef = useRef<HTMLInputElement>(null)
  const slotRef = useRef(0)
  const pick = (slot: number) => {
    slotRef.current = slot
    inputRef.current?.click()
  }
  return (
    <Section title="Media">
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${mockup.count}, minmax(0, 1fr))` }}>
        {Array.from({ length: mockup.count }, (_, i) => {
          const m = mockup.media[i]
          const shown = m?.url ? m : i > 0 ? null : m
          return (
            <div key={i} className="relative">
              <button
                type="button"
                onClick={() => pick(i)}
                className="flex h-20 w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-lg border border-dashed border-white/15 bg-white/[0.03] text-white/60 hover:border-primary/60 hover:text-white"
              >
                {shown?.url && shown.kind === 'image' ? (
                  <img src={shown.url} alt="" className="size-full object-cover" />
                ) : shown?.url ? (
                  <span className="font-mono text-[9px] uppercase">Video</span>
                ) : (
                  <>
                    <ImagePlus className="size-4" />
                    <span className="px-1 text-center font-mono text-[8px] uppercase tracking-wider">{i === 0 ? 'Drop or paste' : `Device ${i + 1} · same`}</span>
                  </>
                )}
              </button>
              {m?.url && (
                <button type="button" title="Remove" onClick={() => setMedia(i, null)} className="absolute right-1 top-1 rounded-full bg-black/70 p-0.5 text-white/80 hover:text-white">
                  <X className="size-3" />
                </button>
              )}
            </div>
          )
        })}
      </div>
      <p className="px-1 font-mono text-[9px] text-white/35">Drop, click or paste images and videos. Several files fill several devices.</p>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => {
          loadShotsFiles(e.target.files, slotRef.current)
          e.target.value = ''
        }}
      />
    </Section>
  )
}

function DevicePicker() {
  const mockup = useShots((s) => s.project.mockup)
  const setMockup = useShots((s) => s.setMockup)
  const family = FLAT_FAMILIES.find((f) => f.kind === mockup.kind)!
  const choose = (kind: FlatKind) => {
    const fam = FLAT_FAMILIES.find((f) => f.kind === kind)!
    const model = fam.models?.includes(mockup.model) ? mockup.model : fam.models?.[0] ?? mockup.model
    const finishes = MODEL_BY_ID[model]?.finishes ?? []
    setMockup({ kind, model, finish: finishes.includes(mockup.finish) ? mockup.finish : MODEL_BY_ID[model]?.defaultFinish ?? mockup.finish })
  }
  const groups = [...new Set(FLAT_FAMILIES.map((f) => f.group))]
  const model = MODEL_BY_ID[mockup.model]
  return (
    <Section title="Mockup">
      <div className="space-y-2">
        {groups.map((g) => (
          <div key={g}>
            <div className="mb-1 px-1 font-mono text-[9px] uppercase tracking-[0.12em] text-white/35">{g}</div>
            <div className="grid grid-cols-2 gap-1">
              {FLAT_FAMILIES.filter((f) => f.group === g).map((f) => (
                <button
                  key={f.kind}
                  type="button"
                  onClick={() => choose(f.kind)}
                  className={cn('flex flex-col items-start rounded-lg border px-2.5 py-2 text-left', mockup.kind === f.kind ? 'border-primary/80 bg-primary/10' : 'border-white/[0.06] bg-white/[0.04] hover:border-white/20')}
                >
                  <span className="text-[11px] font-medium text-white/90">{f.label}</span>
                  <span className="font-mono text-[9px] text-white/35">{f.hint || `${f.models?.length} models`}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {family.models && (
        <div className="flex flex-wrap gap-1 pt-1">
          {family.models.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setMockup({ model: id, finish: MODEL_BY_ID[id].finishes.includes(mockup.finish) ? mockup.finish : MODEL_BY_ID[id].defaultFinish })}
              className={cn('rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider', mockup.model === id ? 'bg-white/[0.14] text-white' : 'bg-white/[0.04] text-white/55 hover:text-white')}
            >
              {MODEL_BY_ID[id].label}
            </button>
          ))}
        </div>
      )}
      {family.models && model && model.finishes.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {model.finishes.map((id) => (
            <button
              key={id}
              type="button"
              title={FINISH_BY_ID[id].label}
              onClick={() => setMockup({ finish: id })}
              className={cn('size-6 rounded-full ring-2 ring-offset-2 ring-offset-[#111114]', mockup.finish === id ? 'ring-primary' : 'ring-transparent hover:ring-white/30')}
              style={{ background: `radial-gradient(circle at 35% 30%, #ffffff88, ${FINISH_BY_ID[id].color} 50%)` }}
            />
          ))}
        </div>
      )}
    </Section>
  )
}

export function MockupTab() {
  const mockup = useShots((s) => s.project.mockup)
  const setMockup = useShots((s) => s.setMockup)
  const flat = mockup.kind === 'screenshot' || mockup.kind === 'browser'
  const corner = CORNERS.find((c) => c.radius === mockup.radius)?.id
  const main = mockup.media[0]
  return (
    <div className="space-y-5">
      <DevicePicker />
      <MagicPreset />
      <MediaSlots />

      {mockup.kind === 'screenshot' && (
        <Section title="Style">
          <div className="grid grid-cols-3 gap-1">
            {SCREENSHOT_STYLES.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setMockup({ style: st.id })}
                className={cn('flex flex-col items-center gap-1 rounded-lg border p-1', mockup.style === st.id ? 'border-primary/80 bg-primary/10' : 'border-white/[0.06] bg-white/[0.03] hover:border-white/20')}
              >
                <StylePreview id={st.id} />
                <span className="font-mono text-[8px] uppercase tracking-wider text-white/65">{st.label}</span>
              </button>
            ))}
          </div>
          {(mockup.style === 'border' || mockup.style === 'outline') && (
            <>
              {mockup.style === 'border' && <SliderRow label="Border width" value={mockup.borderWidth} min={2} max={60} step={1} onChange={(borderWidth) => setMockup({ borderWidth })} />}
              <ColorRow label="Colour" value={mockup.borderColor} onChange={(borderColor) => setMockup({ borderColor })} />
            </>
          )}
        </Section>
      )}

      {mockup.kind === 'browser' && (
        <Section title="Style">
          <div className="grid grid-cols-3 gap-1">
            {(['safari', 'chrome', 'arc'] as const).flatMap((b) =>
              [false, true].map((dark) => (
                <button
                  key={`${b}-${dark}`}
                  type="button"
                  onClick={() => setMockup({ browserStyle: b, browserDark: dark })}
                  className={cn(
                    'flex h-10 flex-col items-center justify-center rounded-lg border font-mono text-[8px] uppercase tracking-wider',
                    mockup.browserStyle === b && mockup.browserDark === dark ? 'border-primary/80 bg-primary/10 text-white' : 'border-white/[0.06] bg-white/[0.03] text-white/60 hover:border-white/20'
                  )}
                >
                  <span>{b}</span>
                  <span className="text-white/40">{dark ? 'Dark' : 'Light'}</span>
                </button>
              ))
            )}
          </div>
          <div className="flex h-9 items-center gap-2 rounded-lg bg-white/[0.05] px-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-white/60">Address</span>
            <input className="min-w-0 flex-1 bg-transparent text-right font-mono text-[11px] text-white/85 outline-none focus:text-primary" value={mockup.browserUrl} onChange={(e) => setMockup({ browserUrl: e.target.value })} />
          </div>
        </Section>
      )}

      {flat && (
        <Section title="Border">
          <SegmentRow value={corner ?? 'custom'} onChange={(id) => setMockup({ radius: CORNERS.find((c) => c.id === id)?.radius ?? mockup.radius })} options={CORNERS.map((c) => ({ value: c.id, label: c.label }))} />
          <SliderRow label="Radius" value={mockup.radius} min={0} max={80} step={1} onChange={(radius) => setMockup({ radius })} />
        </Section>
      )}

      {(mockup.kind === 'phone' || mockup.kind === 'android' || mockup.kind === 'tablet') && (
        <Section title="Orientation">
          <SegmentRow
            value={mockup.orientation}
            onChange={(orientation) => setMockup({ orientation })}
            options={[
              { value: 'portrait', label: 'Portrait' },
              { value: 'landscape', label: 'Landscape' },
            ]}
          />
        </Section>
      )}

      <Section title="Screen">
        <SegmentRow
          value={mockup.fit}
          onChange={(fit) => setMockup({ fit })}
          options={[
            { value: 'cover', label: 'Fill' },
            { value: 'contain', label: 'Fit' },
            { value: 'stretch', label: 'Stretch' },
          ]}
        />
        {mockup.fit === 'cover' && !flat && <SliderRow label="Scroll" value={mockup.scroll} min={0} max={1} step={0.001} onChange={(scroll) => setMockup({ scroll })} format={(v) => `${Math.round(v * 100)}%`} />}
      </Section>

      <Section title="Shadow">
        <SegmentRow value={mockup.shadow} onChange={(shadow) => setMockup({ shadow })} options={SHADOWS.map((s) => ({ value: s.id, label: s.label }))} />
        {mockup.shadow !== 'none' && (
          <>
            <SliderRow label="Opacity" value={Math.round(mockup.shadowOpacity * 100)} min={0} max={100} step={1} onChange={(v) => setMockup({ shadowOpacity: v / 100 })} />
            <SliderRow label="Light angle" value={mockup.lightAngle} min={-180} max={180} step={1} onChange={(lightAngle) => setMockup({ lightAngle })} format={(v) => `${v.toFixed(0)}°`} />
            <SliderRow label="Light distance" value={mockup.lightDistance} min={0} max={1} step={0.01} onChange={(lightDistance) => setMockup({ lightDistance })} />
          </>
        )}
      </Section>

      <Section title="Visibility">
        <SwitchRow label="Hide mockup" checked={mockup.hidden} onChange={(hidden) => setMockup({ hidden })} />
      </Section>

      <Section title="Details">
        <div className="space-y-1 rounded-lg bg-white/[0.04] p-2.5 font-mono text-[10px] text-white/55">
          <div className="flex justify-between">
            <span>Device</span>
            <span className="text-white/80">{flat ? FLAT_FAMILIES.find((f) => f.kind === mockup.kind)?.label : MODEL_BY_ID[mockup.model]?.label}</span>
          </div>
          <div className="flex justify-between">
            <span>Screen pixels</span>
            <span className="text-white/80">
              {(() => {
                const spec = MODEL_BY_ID[mockup.model]?.spec
                if (!flat && spec && 'res' in spec) return `${spec.res[0].toLocaleString()} × ${spec.res[1].toLocaleString()}`
                return main?.width ? `${main.width} × ${main.height}` : 'Adapts to media'
              })()}
            </span>
          </div>
        </div>
      </Section>
    </div>
  )
}

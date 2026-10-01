import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Eye, EyeOff, Minus, Plus } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { DEFAULT_SCENE } from '../../presets'
import { useEditor, useScene } from '../../store'
import type { AnimKey } from '../../timeline/types'
import type { EffectId, EffectsState, LightShadowPattern } from '../../types'
import { AnimSliderRow, Section, SegmentRow, SliderRow } from '../controls'

type Update = (patch: Partial<EffectsState>) => void

type EffectDef = {
  id: EffectId
  label: string
  /** Field that turns the effect on (0 = off) and the value it gets when added. */
  field: keyof EffectsState & EffectId
  add: number
  min: number
  max: number
  step: number
  description: string
  format?: (v: number) => string
  animKey?: AnimKey
  extra?: (fx: EffectsState, update: Update) => ReactNode
}

const pct = (v: number) => `${Math.round(v * 100)}%`

const EFFECTS: EffectDef[] = [
  { id: 'glassBorder', field: 'glassBorder', label: 'Glass border', add: 3, min: 0.5, max: 12, step: 0.1, description: 'Frosted glass rim around the frame', format: (v) => v.toFixed(1) },
  { id: 'sharpen', field: 'sharpen', label: 'Sharpen', add: 0.4, min: 0, max: 1, step: 0.01, description: 'Crisper edges and text' },
  { id: 'vignette', field: 'vignette', label: 'Vignette', add: 0.35, min: 0, max: 1, step: 0.01, description: 'Darken the corners', animKey: 'effects.vignette' },
  { id: 'grain', field: 'grain', label: 'Grain', add: 0.12, min: 0, max: 1, step: 0.01, description: 'Film grain' },
  { id: 'fisheye', field: 'fisheye', label: 'Fish eye', add: 0.3, min: 0, max: 1, step: 0.01, description: 'Barrel lens distortion' },
  { id: 'pixelGrid', field: 'pixelGrid', label: 'Pixel grid', add: 0.25, min: 0, max: 1, step: 0.01, description: 'LCD cells with RGB sub-pixels' },
  { id: 'chromatic', field: 'chromatic', label: 'Chromatic abb.', add: 0.3, min: 0, max: 1, step: 0.01, description: 'Colour fringing towards the edges' },
  {
    id: 'bloom',
    field: 'bloom',
    label: 'Bloom',
    add: 0.6,
    min: 0,
    max: 1.5,
    step: 0.01,
    description: 'Glow around bright areas',
    animKey: 'effects.bloom',
    extra: (fx, update) => (
      <>
        <SliderRow label="Threshold" value={fx.bloomThreshold} min={0} max={1} step={0.01} onChange={(bloomThreshold) => update({ bloomThreshold })} />
        <SliderRow label="Radius" value={fx.bloomRadius} min={0.05} max={1} step={0.01} onChange={(bloomRadius) => update({ bloomRadius })} />
      </>
    ),
  },
  {
    id: 'screenFade',
    field: 'screenFade',
    label: 'Screen fade',
    add: 0.45,
    min: 0,
    max: 1,
    step: 0.01,
    description: 'Fade the screen content along an angle',
    extra: (fx, update) => (
      <>
        <SliderRow label="Fade angle" value={fx.screenFadeAngle} min={0} max={360} step={1} onChange={(screenFadeAngle) => update({ screenFadeAngle })} format={(v) => `${v.toFixed(0)}°`} />
        <SliderRow label="Softness" value={fx.screenFadeSoftness} min={0} max={1} step={0.01} onChange={(screenFadeSoftness) => update({ screenFadeSoftness })} />
      </>
    ),
  },
  {
    id: 'liquidGlass',
    field: 'liquidGlass',
    label: 'Liquid glass',
    add: 0.5,
    min: 0,
    max: 1,
    step: 0.01,
    description: 'Refractive glass on the frame edges or the device body',
    extra: (fx, update) => (
      <>
        <SegmentRow
          value={fx.liquidGlassTarget}
          onChange={(liquidGlassTarget) => update({ liquidGlassTarget })}
          options={[
            { value: 'frame', label: 'Frame' },
            { value: 'mockup', label: 'Mockup' },
          ]}
        />
        <SliderRow label="Shine" value={fx.liquidGlassShine} min={0} max={1} step={0.01} onChange={(liquidGlassShine) => update({ liquidGlassShine })} />
      </>
    ),
  },
  {
    id: 'lightShadow',
    field: 'lightShadow',
    label: 'Light shadow',
    add: 0.5,
    min: 0,
    max: 1,
    step: 0.01,
    description: 'Sunlight through blinds, a window or leaves',
    format: pct,
    extra: (fx, update) => (
      <>
        <SegmentRow<LightShadowPattern>
          value={fx.lightShadowPattern}
          onChange={(lightShadowPattern) => update({ lightShadowPattern })}
          options={[
            { value: 'blinds', label: 'Blinds' },
            { value: 'window', label: 'Window' },
            { value: 'leaves', label: 'Leaves' },
            { value: 'palm', label: 'Palm' },
          ]}
        />
        <SliderRow label="Angle" value={fx.lightShadowAngle} min={-90} max={90} step={1} onChange={(lightShadowAngle) => update({ lightShadowAngle })} format={(v) => `${v.toFixed(0)}°`} />
        <SliderRow label="Softness" value={fx.lightShadowSoftness} min={0} max={1} step={0.01} onChange={(lightShadowSoftness) => update({ lightShadowSoftness })} />
      </>
    ),
  },
]

function EffectCard({ def, fx, update }: { def: EffectDef; fx: EffectsState; update: Update }) {
  const hidden = fx.hidden.includes(def.id)
  const value = fx[def.field] as number
  const setValue = (v: number) => update({ [def.field]: v } as Partial<EffectsState>)
  return (
    <div className={cn('space-y-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1.5', hidden && 'opacity-50')}>
      <div className="flex h-7 items-center gap-1 pl-1">
        <button
          type="button"
          title={hidden ? 'Show effect' : 'Hide effect'}
          onClick={() => update({ hidden: hidden ? fx.hidden.filter((h) => h !== def.id) : [...fx.hidden, def.id] })}
          className="flex size-6 items-center justify-center rounded text-white/50 hover:bg-white/10 hover:text-white"
        >
          {hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        </button>
        <span className="flex-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-white/85">{def.label}</span>
        <button
          type="button"
          title="Remove effect"
          onClick={() => update({ [def.field]: 0, hidden: fx.hidden.filter((h) => h !== def.id) } as Partial<EffectsState>)}
          className="flex size-6 items-center justify-center rounded text-white/40 hover:bg-white/10 hover:text-white"
        >
          <Minus className="size-3.5" />
        </button>
      </div>
      {def.animKey ? (
        <AnimSliderRow animKey={def.animKey} label="Amount" min={Math.max(def.min, def.step)} max={def.max} step={def.step} onChange={setValue} format={def.format} />
      ) : (
        <SliderRow label="Amount" value={value} min={Math.max(def.min, def.step)} max={def.max} step={def.step} onChange={setValue} format={def.format} />
      )}
      {def.extra?.(fx, update)}
    </div>
  )
}

function AddEffectMenu({ fx, update }: { fx: EffectsState; update: Update }) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" title="Add effect" className="flex size-6 items-center justify-center rounded-md bg-white/[0.06] text-white/70 hover:bg-white/15 hover:text-white">
          <Plus className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 border-white/10 bg-[#161618] p-1.5 text-white">
        {EFFECTS.map((def) => {
          const added = (fx[def.field] as number) > 0
          return (
            <button
              key={def.id}
              type="button"
              disabled={added}
              onClick={() => {
                update({ [def.field]: def.add, hidden: fx.hidden.filter((h) => h !== def.id) } as Partial<EffectsState>)
                setOpen(false)
              }}
              className="flex w-full flex-col items-start rounded-md px-2 py-1.5 text-left hover:bg-white/[0.06] disabled:opacity-35 disabled:hover:bg-transparent"
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/85">
                {def.label}
                {added ? ' · added' : ''}
              </span>
              <span className="text-[11px] text-white/45">{def.description}</span>
            </button>
          )
        })}
      </PopoverContent>
    </Popover>
  )
}

export function EffectsPanel() {
  const fx = useScene('effects')
  const update = useEditor((s) => s.update)
  const set: Update = (patch) => update('effects', patch)
  const active = EFFECTS.filter((d) => (fx[d.field] as number) > 0)

  return (
    <div className="space-y-5">
      <Section title="Effects" action={<AddEffectMenu fx={fx} update={set} />}>
        {active.length ? (
          active.map((def) => <EffectCard key={def.id} def={def} fx={fx} update={set} />)
        ) : (
          <p className="px-1 font-mono text-[10px] leading-relaxed text-white/45">No effects yet. Use + to add glass, bloom, grain, light shadows and more.</p>
        )}
      </Section>

      <Section title="Post processing" onReset={() => set({ exposure: 0, brightness: 0, contrast: 0, saturation: 0, hue: 0, shadows: 0, midtones: 0, highlights: 0 })}>
        <AnimSliderRow animKey="effects.exposure" label="Exposure" min={-2} max={2} step={0.01} onChange={(exposure) => set({ exposure })} />
        <SliderRow label="Brightness" value={fx.brightness} min={-0.5} max={0.5} step={0.01} onChange={(brightness) => set({ brightness })} />
        <SliderRow label="Contrast" value={fx.contrast} min={-0.5} max={0.5} step={0.01} onChange={(contrast) => set({ contrast })} />
        <SliderRow label="Shadows" value={fx.shadows} min={-1} max={1} step={0.01} onChange={(shadows) => set({ shadows })} />
        <SliderRow label="Midtones" value={fx.midtones} min={-1} max={1} step={0.01} onChange={(midtones) => set({ midtones })} />
        <SliderRow label="Highlights" value={fx.highlights} min={-1} max={1} step={0.01} onChange={(highlights) => set({ highlights })} />
        <AnimSliderRow animKey="effects.saturation" label="Saturation" min={-1} max={1} step={0.01} onChange={(saturation) => set({ saturation })} />
        <SliderRow label="Hue" value={fx.hue} min={-180} max={180} step={1} onChange={(hue) => set({ hue })} format={(v) => `${v.toFixed(0)}°`} />
      </Section>

      <button
        type="button"
        onClick={() => update('effects', { ...DEFAULT_SCENE.effects })}
        className="w-full rounded-lg py-2 font-mono text-[9px] uppercase tracking-wider text-white/35 hover:bg-white/[0.05] hover:text-white/70"
      >
        Reset all effects
      </button>
    </div>
  )
}

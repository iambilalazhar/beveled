import { DEFAULT_SCENE } from '../../presets'
import { useEditor, useScene } from '../../store'
import { AnimSliderRow, Section, SliderRow } from '../controls'

export function EffectsPanel() {
  const fx = useScene('effects')
  const update = useEditor((s) => s.update)

  return (
    <div className="space-y-5">
      <Section title="Glow" onReset={() => update('effects', { bloom: 0, bloomThreshold: DEFAULT_SCENE.effects.bloomThreshold })}>
        <AnimSliderRow animKey="effects.bloom" label="Bloom" min={0} max={1} step={0.01} onChange={(bloom) => update('effects', { bloom })} />
        <SliderRow label="Threshold" value={fx.bloomThreshold} min={0} max={1} step={0.01} onChange={(bloomThreshold) => update('effects', { bloomThreshold })} disabled={fx.bloom === 0} />
      </Section>

      <Section title="Lens" onReset={() => update('effects', { vignette: DEFAULT_SCENE.effects.vignette, grain: 0, chromatic: 0, sharpen: 0, fisheye: 0 })}>
        <AnimSliderRow animKey="effects.vignette" label="Vignette" min={0} max={1} step={0.01} onChange={(vignette) => update('effects', { vignette })} />
        <SliderRow label="Grain" value={fx.grain} min={0} max={1} step={0.01} onChange={(grain) => update('effects', { grain })} />
        <SliderRow label="Chromatic abb." value={fx.chromatic} min={0} max={1} step={0.01} onChange={(chromatic) => update('effects', { chromatic })} />
        <SliderRow label="Sharpen" value={fx.sharpen} min={0} max={1} step={0.01} onChange={(sharpen) => update('effects', { sharpen })} />
        <SliderRow label="Fish eye" value={fx.fisheye} min={0} max={1} step={0.01} onChange={(fisheye) => update('effects', { fisheye })} />
      </Section>

      <Section title="Post processing" onReset={() => update('effects', { exposure: 0, brightness: 0, contrast: 0, saturation: 0, hue: 0, shadows: 0, midtones: 0, highlights: 0 })}>
        <AnimSliderRow animKey="effects.exposure" label="Exposure" min={-2} max={2} step={0.01} onChange={(exposure) => update('effects', { exposure })} />
        <SliderRow label="Brightness" value={fx.brightness} min={-0.5} max={0.5} step={0.01} onChange={(brightness) => update('effects', { brightness })} />
        <SliderRow label="Contrast" value={fx.contrast} min={-0.5} max={0.5} step={0.01} onChange={(contrast) => update('effects', { contrast })} />
        <SliderRow label="Shadows" value={fx.shadows} min={-1} max={1} step={0.01} onChange={(shadows) => update('effects', { shadows })} />
        <SliderRow label="Midtones" value={fx.midtones} min={-1} max={1} step={0.01} onChange={(midtones) => update('effects', { midtones })} />
        <SliderRow label="Highlights" value={fx.highlights} min={-1} max={1} step={0.01} onChange={(highlights) => update('effects', { highlights })} />
        <AnimSliderRow animKey="effects.saturation" label="Saturation" min={-1} max={1} step={0.01} onChange={(saturation) => update('effects', { saturation })} />
        <SliderRow label="Hue" value={fx.hue} min={-180} max={180} step={1} onChange={(hue) => update('effects', { hue })} format={(v) => `${v.toFixed(0)}°`} />
      </Section>
    </div>
  )
}

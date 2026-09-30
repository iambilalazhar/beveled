import { DEFAULT_SCENE, LIGHT_PRESETS } from '../../presets'
import { useEditor, useScene } from '../../store'
import { AnimSliderRow, ColorRow, Section, SliderRow, SwitchRow, Tile, TileGrid, TileLabel } from '../controls'

export function LightingPanel() {
  const lighting = useScene('lighting')
  const update = useEditor((s) => s.update)

  return (
    <div className="space-y-5">
      <Section title="Environment" onReset={() => update('lighting', { preset: 'studio', intensity: 1, envIntensity: 1, rotation: 0, elevation: 0, keyColor: '#ffffff' })}>
        <TileGrid cols={4}>
          {LIGHT_PRESETS.map((p) => (
            <Tile key={p.id} active={lighting.preset === p.id} onClick={() => update('lighting', { preset: p.id })} title={p.description} className="h-12 gap-1 p-1">
              <span
                className="size-4 rounded-full"
                style={{
                  background: `radial-gradient(circle at 35% 30%, ${p.formers[0]?.color ?? '#fff'}, ${p.formers[1]?.color ?? '#888'} 70%, #111)`,
                }}
              />
              <TileLabel>{p.label}</TileLabel>
            </Tile>
          ))}
        </TileGrid>
        <AnimSliderRow animKey="lighting.envIntensity" label="Environment" min={0} max={3} step={0.01} onChange={(envIntensity) => update('lighting', { envIntensity })} />
        <AnimSliderRow animKey="lighting.rotation" label="Light rotation Y" min={0} max={360} step={1} onChange={(rotation) => update('lighting', { rotation })} format={(v) => `${v.toFixed(0)}°`} />
        <AnimSliderRow animKey="lighting.elevation" label="Light rotation X" min={-80} max={80} step={1} onChange={(elevation) => update('lighting', { elevation })} format={(v) => `${v.toFixed(0)}°`} />
      </Section>

      <Section title="Key light">
        <AnimSliderRow animKey="lighting.intensity" label="Intensity" min={0} max={4} step={0.01} onChange={(intensity) => update('lighting', { intensity })} />
        <ColorRow label="Colour" value={lighting.keyColor} onChange={(keyColor) => update('lighting', { keyColor })} />
        <SliderRow label="Screen glare" value={lighting.screenGlare} min={0} max={1.5} step={0.01} onChange={(screenGlare) => update('lighting', { screenGlare })} />
      </Section>

      <Section title="Contact shadow" onReset={() => update('lighting', { shadow: DEFAULT_SCENE.lighting.shadow, shadowOpacity: DEFAULT_SCENE.lighting.shadowOpacity, shadowBlur: DEFAULT_SCENE.lighting.shadowBlur })}>
        <SwitchRow label="Enabled" checked={lighting.shadow} onChange={(shadow) => update('lighting', { shadow })} />
        <SliderRow label="Opacity" value={lighting.shadowOpacity} min={0} max={1} step={0.01} onChange={(shadowOpacity) => update('lighting', { shadowOpacity })} disabled={!lighting.shadow} />
        <SliderRow label="Softness" value={lighting.shadowBlur} min={0.2} max={6} step={0.05} onChange={(shadowBlur) => update('lighting', { shadowBlur })} disabled={!lighting.shadow} />
      </Section>

      <Section title="Floor reflection">
        <SwitchRow label="Enabled" checked={lighting.reflection} onChange={(reflection) => update('lighting', { reflection })} />
        <SliderRow label="Opacity" value={lighting.reflectionOpacity} min={0} max={1} step={0.01} onChange={(reflectionOpacity) => update('lighting', { reflectionOpacity })} disabled={!lighting.reflection} />
        <SliderRow label="Blur" value={lighting.reflectionBlur} min={0} max={1} step={0.01} onChange={(reflectionBlur) => update('lighting', { reflectionBlur })} disabled={!lighting.reflection} />
      </Section>
    </div>
  )
}

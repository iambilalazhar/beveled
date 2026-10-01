import { cn } from '@/lib/utils'
import { ENVIRONMENT_BY_ID, ENVIRONMENTS } from '../../presets'
import { useEditor, useScene } from '../../store'
import { BackgroundEditor } from '../BackgroundEditor'
import { Section, SliderRow } from '../controls'

function EnvironmentSection() {
  const env = useScene('environment')
  const update = useEditor((s) => s.update)
  const updateMany = useEditor((s) => s.updateMany)
  const tiles = [{ id: 'none' as const, label: 'Custom scene', swatch: 'repeating-conic-gradient(#2a2a2e 0% 25%, #1c1c20 0% 50%) 50% / 10px 10px' }, ...ENVIRONMENTS]
  return (
    <Section title="Environment">
      <div className="grid grid-cols-2 gap-1.5">
        {tiles.map((t) => {
          const active = env.kind === t.id
          return (
            <button
              key={t.id}
              type="button"
              title={'description' in t ? t.description : 'Background only, no set'}
              onClick={() => {
                const preset = ENVIRONMENT_BY_ID[t.id]
                updateMany(preset ? { environment: { kind: t.id }, lighting: { preset: preset.lighting, shadow: true } } : { environment: { kind: t.id } })
              }}
              className={cn('overflow-hidden rounded-lg border text-left transition-colors', active ? 'border-primary/80' : 'border-white/[0.08] hover:border-white/25')}
            >
              <span className="block h-12" style={{ background: t.swatch }} />
              <span className={cn('block px-2 py-1.5 font-mono text-[9px] uppercase tracking-wider', active ? 'bg-primary/10 text-white' : 'text-white/70')}>{t.label}</span>
            </button>
          )
        })}
      </div>
      {env.kind !== 'none' && (
        <>
          <SliderRow label="Wall height" value={env.wall} min={0} max={2} step={0.01} onChange={(wall) => update('environment', { wall })} />
          <SliderRow label="Wall distance" value={env.depth} min={0} max={2} step={0.01} onChange={(depth) => update('environment', { depth })} />
          <SliderRow label="Fog" value={env.fog} min={0} max={1} step={0.01} onChange={(fog) => update('environment', { fog })} />
          <p className="px-1 font-mono text-[10px] leading-relaxed text-white/45">Sets replace the background. Pick “Custom scene” to go back to a backdrop.</p>
        </>
      )}
    </Section>
  )
}

export function BackgroundPanel() {
  const bg = useScene('background')
  const media = useScene('media')
  const env = useScene('environment')
  const update = useEditor((s) => s.update)
  return (
    <div className="space-y-5">
      <EnvironmentSection />
      {env.kind === 'none' && <BackgroundEditor bg={bg} onChange={(patch) => update('background', patch)} paletteSource={media.kind === 'image' ? media.url : null} />}
    </div>
  )
}

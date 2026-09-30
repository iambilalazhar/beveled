import { cn } from '@/lib/utils'
import { Upload } from 'lucide-react'
import { useRef } from 'react'
import { DEFAULT_SCENE, DEVICE_BY_KIND, FINISH_BY_ID } from '../../presets'
import { MODELS, modelFor } from '../../scene/models'
import { useEditor, useScene } from '../../store'
import { AnimSliderRow, ColorRow, PanelButton, Section, SegmentRow, SliderRow, SwitchRow } from '../controls'
import { DEVICE_ICONS } from '../deviceIcons'

const FAMILIES = [
  { kind: 'phone', label: 'iPhone' },
  { kind: 'android', label: 'Android' },
  { kind: 'tablet', label: 'iPad' },
  { kind: 'laptop', label: 'MacBook' },
  { kind: 'monitor', label: 'Displays' },
  { kind: 'watch', label: 'Watch' },
  { kind: 'browser', label: 'Browser' },
  { kind: 'screen', label: 'Flat' },
  { kind: 'custom', label: 'Custom model' },
] as const

export function DevicePanel() {
  const device = useScene('device')
  const update = useEditor((s) => s.update)
  const meta = DEVICE_BY_KIND[device.kind]
  const model = modelFor(device.kind, device.model)
  const glbRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-5">
      <Section title="Mockup" onReset={() => update('device', { ...DEFAULT_SCENE.device, kind: device.kind, model: model.id, finish: model.defaultFinish })}>
        <div className="space-y-3">
          {FAMILIES.map((fam) => {
            const Icon = DEVICE_ICONS[fam.kind]
            const models = MODELS.filter((m) => m.kind === fam.kind)
            return (
              <div key={fam.kind}>
                <div className="mb-1 flex items-center gap-1.5 px-1 font-mono text-[9px] uppercase tracking-[0.12em] text-white/35">
                  <Icon className="size-3" /> {fam.label}
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {models.map((m) => {
                    const active = model.id === m.id
                    const res = m.spec && 'res' in m.spec ? m.spec.res : null
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => update('device', { kind: m.kind, model: m.id, finish: m.finishes.includes(device.finish) ? device.finish : m.defaultFinish })}
                        className={cn(
                          'flex flex-col items-start rounded-lg border px-2.5 py-2 text-left transition-colors',
                          active ? 'border-primary/80 bg-primary/10' : 'border-white/[0.06] bg-white/[0.04] hover:border-white/20'
                        )}
                      >
                        <span className={cn('text-[11px] font-medium', active ? 'text-white' : 'text-white/80')}>{m.label}</span>
                        <span className="font-mono text-[9px] text-white/35">{res ? `${res[0].toLocaleString()} × ${res[1].toLocaleString()}` : 'Adapts to media'}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </Section>

      {model.finishes.length > 0 && (
        <Section title="Finish">
          <div className="flex flex-wrap gap-1.5">
            {model.finishes.map((id) => {
              const f = FINISH_BY_ID[id]
              const active = device.finish === id
              return (
                <button
                  key={id}
                  type="button"
                  title={f.label}
                  onClick={() => update('device', { finish: id })}
                  className={cn('flex items-center gap-2 rounded-full border py-1 pl-1 pr-3', active ? 'border-primary/80 bg-primary/10' : 'border-white/[0.08] bg-white/[0.04] hover:border-white/25')}
                >
                  <span className="size-5 rounded-full ring-1 ring-white/25" style={{ background: `radial-gradient(circle at 35% 30%, #ffffff66, ${f.color} 45%, ${f.color})` }} />
                  <span className="font-mono text-[9px] uppercase tracking-wider text-white/70">{f.label}</span>
                </button>
              )
            })}
          </div>
        </Section>
      )}

      {device.kind === 'custom' && (
        <Section title="Custom model">
          <PanelButton onClick={() => glbRef.current?.click()}>
            <Upload className="size-3" /> {device.customModelName ? `Replace ${device.customModelName}` : 'Load .glb model'}
          </PanelButton>
          <p className="px-1 font-mono text-[10px] leading-relaxed text-white/45">
            Use a self-contained .glb. The screenshot is mapped onto the mesh (or material) whose name contains “screen” or “display”. The model is scaled to fit and centred automatically.
          </p>
          <input
            ref={glbRef}
            type="file"
            accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) update('device', { customModel: URL.createObjectURL(f), customModelName: f.name })
              e.target.value = ''
            }}
          />
        </Section>
      )}

      <Section title="Geometry">
        {meta.supportsOrientation && (
          <SegmentRow
            value={device.orientation}
            onChange={(orientation) => update('device', { orientation })}
            options={[
              { value: 'portrait', label: 'Portrait' },
              { value: 'landscape', label: 'Landscape' },
            ]}
          />
        )}
        <AnimSliderRow animKey="device.scale" label="Scale" min={0.5} max={1.6} step={0.01} onChange={(scale) => update('device', { scale })} />
        <AnimSliderRow animKey="device.rotateY" label="Rotate Y" min={-180} max={180} step={1} onChange={(rotateY) => update('device', { rotateY })} format={(v) => `${v.toFixed(0)}°`} />
        <AnimSliderRow animKey="device.rotateX" label="Rotate X" min={-90} max={90} step={1} onChange={(rotateX) => update('device', { rotateX })} format={(v) => `${v.toFixed(0)}°`} />
        {meta.supportsLid && <AnimSliderRow animKey="device.lidAngle" label="Lid angle" min={0} max={135} step={1} onChange={(lidAngle) => update('device', { lidAngle })} format={(v) => `${v.toFixed(0)}°`} />}
        {(device.kind === 'phone' || device.kind === 'android') && <SwitchRow label="Status bar" checked={device.statusBar} onChange={(statusBar) => update('device', { statusBar })} />}
        {(device.kind === 'phone' || device.kind === 'android' || device.kind === 'tablet' || device.kind === 'laptop') && (
          <SwitchRow label={device.kind === 'android' ? 'Punch-hole camera' : device.kind === 'tablet' ? 'Front camera' : 'Notch'} checked={device.notch} onChange={(notch) => update('device', { notch })} />
        )}
        {device.kind === 'screen' && (
          <>
            <SliderRow label="Corner radius" value={device.screenRadius} min={0} max={0.3} step={0.005} onChange={(screenRadius) => update('device', { screenRadius })} />
            <SliderRow label="Border" value={device.border} min={0} max={0.2} step={0.005} onChange={(border) => update('device', { border })} />
            {device.border > 0 && <ColorRow label="Border colour" value={device.borderColor} onChange={(borderColor) => update('device', { borderColor })} />}
          </>
        )}
        {device.kind === 'browser' && (
          <>
            <SegmentRow
              value={device.browserStyle}
              onChange={(browserStyle) => update('device', { browserStyle })}
              options={[
                { value: 'safari', label: 'Safari' },
                { value: 'chrome', label: 'Chrome' },
                { value: 'arc', label: 'Arc' },
              ]}
            />
            <SegmentRow
              value={device.browserDark ? 'dark' : 'light'}
              onChange={(v) => update('device', { browserDark: v === 'dark' })}
              options={[
                { value: 'dark', label: 'Dark chrome' },
                { value: 'light', label: 'Light chrome' },
              ]}
            />
            <div className="flex h-9 items-center gap-2 rounded-lg bg-white/[0.05] px-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-white/60">URL</span>
              <input
                className="min-w-0 flex-1 bg-transparent text-right font-mono text-[11px] text-white/85 outline-none focus:text-primary"
                value={device.browserUrl}
                onChange={(e) => update('device', { browserUrl: e.target.value })}
                placeholder="beveled.app"
              />
            </div>
          </>
        )}
      </Section>
      <Section title="Screen">
        <SliderRow label="Padding" value={device.screenPadding} min={0} max={0.45} step={0.005} onChange={(screenPadding) => update('device', { screenPadding })} />
        <ColorRow label="Screen colour" value={device.screenBg} onChange={(screenBg) => update('device', { screenBg })} />
      </Section>
    </div>
  )
}

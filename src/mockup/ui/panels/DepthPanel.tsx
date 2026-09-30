import { DEFAULT_SCENE } from '../../presets'
import { useEditor, useScene } from '../../store'
import { AnimSliderRow, Section, SegmentRow, SelectRow, SwitchRow } from '../controls'

export function DepthPanel() {
  const depth = useScene('depth')
  const update = useEditor((s) => s.update)
  const mode = depth.mode

  return (
    <div className="space-y-5">
      <Section title="Blur" onReset={() => update('depth', { ...DEFAULT_SCENE.depth, mode: depth.mode })}>
        <SelectRow
          label="Mode"
          value={mode}
          onChange={(m) => update('depth', { mode: m })}
          options={[
            { value: 'off', label: 'None' },
            { value: 'radial', label: 'Radial' },
            { value: 'directional', label: 'Directional' },
            { value: 'tilt-shift', label: 'Tilt shift' },
            { value: 'lens', label: 'Lens (depth of field)' },
          ]}
        />
        {mode === 'off' && <p className="px-1 font-mono text-[10px] leading-relaxed text-white/45">Screen-space blurs (radial, directional, tilt shift) blur by position in the frame. Lens blur simulates a real camera and blurs by distance from the focus point.</p>}
      </Section>

      {(mode === 'radial' || mode === 'directional' || mode === 'tilt-shift') && (
        <Section title="Focus">
          <AnimSliderRow animKey="depth.strength" label="Strength" min={0} max={30} step={0.5} onChange={(strength) => update('depth', { strength })} format={(v) => `${v.toFixed(1)}px`} />
          <AnimSliderRow animKey="depth.falloff" label="Falloff" min={0} max={1} step={0.01} onChange={(falloff) => update('depth', { falloff })} />
          <AnimSliderRow animKey="depth.bokeh" label="Bokeh" min={0} max={2} step={0.01} onChange={(bokeh) => update('depth', { bokeh })} />
          {mode !== 'directional' && <AnimSliderRow animKey="depth.focusSize" label="Focus size" min={0} max={mode === 'tilt-shift' ? 0.6 : 1} step={0.005} onChange={(focusSize) => update('depth', { focusSize })} />}
          {mode !== 'radial' && <AnimSliderRow animKey="depth.angle" label="Angle" min={0} max={360} step={1} onChange={(angle) => update('depth', { angle })} format={(v) => `${v.toFixed(0)}°`} />}
          <AnimSliderRow animKey="depth.focusX" label="Focus X" hint="drag dot" min={0} max={1} step={0.005} onChange={(focusX) => update('depth', { focusX })} />
          <AnimSliderRow animKey="depth.focusY" label="Focus Y" hint="drag dot" min={0} max={1} step={0.005} onChange={(focusY) => update('depth', { focusY })} />
          <p className="px-1 font-mono text-[10px] leading-relaxed text-white/45">Drag the orange handle on the stage to move the focus point.</p>
        </Section>
      )}

      {mode === 'lens' && (
        <Section title="Lens">
          <SegmentRow
            value={depth.autoFocus ? 'auto' : 'manual'}
            onChange={(v) => update('depth', { autoFocus: v === 'auto' })}
            options={[
              { value: 'auto', label: 'Auto (screen)' },
              { value: 'manual', label: 'Manual' },
            ]}
          />
          <AnimSliderRow animKey="depth.bokeh" label="Strength" min={0} max={3} step={0.01} onChange={(bokeh) => update('depth', { bokeh })} />
          <AnimSliderRow animKey="depth.focalLength" label="Focus range" min={0.1} max={6} step={0.05} onChange={(focalLength) => update('depth', { focalLength })} />
          <AnimSliderRow animKey="depth.focusDistance" label="Focus distance" min={0.5} max={20} step={0.05} onChange={(focusDistance) => update('depth', { focusDistance })} disabled={depth.autoFocus} />
          <SwitchRow label="Autofocus on screen" checked={depth.autoFocus} onChange={(autoFocus) => update('depth', { autoFocus })} />
          <p className="px-1 font-mono text-[10px] leading-relaxed text-white/45">Lens blur is the most demanding mode. If the stage lags, lower the strength or switch to a screen-space blur.</p>
        </Section>
      )}
    </div>
  )
}

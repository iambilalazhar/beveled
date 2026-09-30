import { CAMERA_PRESETS, DEFAULT_SCENE } from '../../presets'
import { useEditor, useScene } from '../../store'
import { AnimSliderRow, Section, Tile, TileGrid, TileLabel } from '../controls'

const deg = (v: number) => `${v.toFixed(0)}°`

export function CameraPanel() {
  const cam = useScene('camera')
  const update = useEditor((s) => s.update)
  const activePreset = CAMERA_PRESETS.find((p) => p.yaw === cam.yaw && p.pitch === cam.pitch && p.roll === cam.roll && p.fov === cam.fov)?.id

  return (
    <div className="space-y-5">
      <Section title="Presets">
        <TileGrid cols={4}>
          {CAMERA_PRESETS.map((p) => (
            <Tile key={p.id} active={activePreset === p.id} onClick={() => update('camera', { yaw: p.yaw, pitch: p.pitch, roll: p.roll, fov: p.fov })} className="h-9 p-1">
              <TileLabel>{p.label}</TileLabel>
            </Tile>
          ))}
        </TileGrid>
      </Section>

      <Section title="Rotation" onReset={() => update('camera', { yaw: DEFAULT_SCENE.camera.yaw, pitch: DEFAULT_SCENE.camera.pitch, roll: 0 })}>
        <AnimSliderRow animKey="camera.yaw" label="Yaw" hint="drag" min={-180} max={180} step={1} onChange={(yaw) => update('camera', { yaw })} format={deg} />
        <AnimSliderRow animKey="camera.pitch" label="Pitch" hint="drag" min={-89} max={89} step={1} onChange={(pitch) => update('camera', { pitch })} format={deg} />
        <AnimSliderRow animKey="camera.roll" label="Roll" min={-180} max={180} step={1} onChange={(roll) => update('camera', { roll })} format={deg} />
      </Section>

      <Section title="Lens" onReset={() => update('camera', { fov: DEFAULT_SCENE.camera.fov, zoom: 1, panX: 0, panY: 0 })}>
        <AnimSliderRow animKey="camera.fov" label="FOV" min={10} max={100} step={1} onChange={(fov) => update('camera', { fov })} format={deg} />
        <AnimSliderRow animKey="camera.zoom" label="Zoom" hint="scroll" min={0.3} max={6} step={0.01} onChange={(zoom) => update('camera', { zoom })} format={(v) => `${v.toFixed(2)}×`} />
        <AnimSliderRow animKey="camera.panX" label="Pan X" hint="shift drag" min={-1.5} max={1.5} step={0.01} onChange={(panX) => update('camera', { panX })} />
        <AnimSliderRow animKey="camera.panY" label="Pan Y" hint="shift drag" min={-1.5} max={1.5} step={0.01} onChange={(panY) => update('camera', { panY })} />
      </Section>
      <p className="px-1 font-mono text-[10px] leading-relaxed text-white/45">
        The ◇ button keyframes a value at the playhead. Once a value has keyframes, changing it updates the keyframe under the playhead.
      </p>
    </div>
  )
}

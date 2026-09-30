import { cn } from '@/lib/utils'
import { Music, Orbit, Play, RefreshCw, Trash2, Upload, Waves, Wind } from 'lucide-react'
import { useRef } from 'react'
import { editShot, useEditor, useScene } from '../../store'
import { MOTION_PRESETS } from '../../timeline/motionPresets'
import { PanelButton, Row, Section, SliderRow, SwitchRow, Tile, TileGrid, TileLabel, valueClass } from '../controls'
import { useAudioLoader } from '../useMediaLoader'

const LOOPS = [
  { value: 'float', label: 'Float', icon: Wind, description: 'Gentle hover with a slow tilt' },
  { value: 'sway', label: 'Sway', icon: Waves, description: 'Pendulum turn left and right' },
  { value: 'spin', label: 'Spin', icon: RefreshCw, description: 'Full turntable rotation' },
  { value: 'orbit', label: 'Orbit', icon: Orbit, description: 'Camera circles the device' },
] as const

export function MotionPanel() {
  const motion = useScene('motion')
  const update = useEditor((s) => s.update)
  const apply = useEditor((s) => s.applyMotionPreset)
  const clear = useEditor((s) => s.clearMotion)
  const shot = useEditor((s) => editShot(s.project, s.selectedClipId))
  const togglePlay = useEditor((s) => s.togglePlay)
  const playing = useEditor((s) => s.playing)
  const audio = useEditor((s) => s.project.audio)
  const setAudio = useEditor((s) => s.setAudio)
  const { loadAudioFile } = useAudioLoader()
  const audioRef = useRef<HTMLInputElement>(null)
  const keyCount = Object.values(shot.tracks).reduce((n, k) => n + (k?.length ?? 0), 0)

  return (
    <div className="space-y-5">
      <Section title={`Camera moves · ${shot.name}`} action={keyCount ? <button type="button" onClick={() => clear()} title="Remove all keyframes from this shot" className="rounded p-1 text-white/40 hover:bg-white/10 hover:text-white"><Trash2 className="size-3" /></button> : null}>
        <div className="grid grid-cols-2 gap-1.5">
          {MOTION_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              title={p.description}
              onClick={() => apply(p.id)}
              className="group overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.04] text-left hover:border-primary/60"
            >
              <div className="flex h-12 items-center justify-center overflow-hidden [perspective:240px]">
                <div className="h-6 w-10 rounded-[3px] border border-white/40 bg-white/10" style={{ animation: `bev-preset-${p.id} ${p.duration}s ease-in-out infinite alternate` }} />
                <style>{`@keyframes bev-preset-${p.id} { from { transform: ${p.preview[0]} } to { transform: ${p.preview[1]} } }`}</style>
              </div>
              <div className="flex items-center justify-between px-2 pb-1.5">
                <span className="truncate font-mono text-[8px] uppercase tracking-wider text-white/75">{p.label}</span>
                <span className="font-mono text-[8px] text-white/35">{p.duration}s</span>
              </div>
            </button>
          ))}
        </div>
        <Row label="Keyframes on this shot">
          <span className={valueClass}>{keyCount}</span>
        </Row>
        <PanelButton onClick={togglePlay}>
          <Play className="size-3" /> {playing ? 'Pause' : 'Play timeline'}
        </PanelButton>
      </Section>

      <Section title="Idle loop">
        <SwitchRow label="Animate" checked={motion.enabled} onChange={(enabled) => update('motion', { enabled })} />
        <TileGrid cols={4}>
          {LOOPS.map((k) => (
            <Tile key={k.value} active={motion.enabled && motion.kind === k.value} onClick={() => update('motion', { kind: k.value, enabled: true })} title={k.description} className="h-14 p-1">
              <k.icon className="size-4" />
              <TileLabel>{k.label}</TileLabel>
            </Tile>
          ))}
        </TileGrid>
        <SliderRow label="Speed" value={motion.speed} min={0.1} max={3} step={0.05} onChange={(speed) => update('motion', { speed })} format={(v) => `${v.toFixed(2)}×`} disabled={!motion.enabled} />
        <SliderRow label="Intensity" value={motion.intensity} min={0} max={1.5} step={0.01} onChange={(intensity) => update('motion', { intensity })} disabled={!motion.enabled || motion.kind === 'spin'} />
        <SliderRow label="Cycle length" value={motion.duration} min={1} max={20} step={0.5} onChange={(duration) => update('motion', { duration })} format={(v) => `${v.toFixed(1)}s`} disabled={!motion.enabled} />
        <p className="px-1 font-mono text-[10px] leading-relaxed text-white/45">Idle loops run on top of keyframes while the timeline plays.</p>
      </Section>

      <Section title="Audio">
        {audio.url ? (
          <>
            <div className="flex items-center gap-2 rounded-lg bg-white/[0.05] px-3 py-2">
              <Music className="size-3.5 text-[#9fe0c6]" />
              <span className="min-w-0 flex-1 truncate text-[11px] text-white/85">{audio.name}</span>
              <span className={valueClass}>{audio.duration.toFixed(1)}s</span>
              <button type="button" onClick={() => setAudio({ url: null, name: null, duration: 0 })} className="rounded p-1 text-white/40 hover:bg-white/10 hover:text-white" title="Remove audio">
                <Trash2 className="size-3" />
              </button>
            </div>
            <SliderRow label="Volume" value={audio.volume} min={0} max={1.5} step={0.01} onChange={(volume) => setAudio({ volume })} format={(v) => `${Math.round(v * 100)}%`} />
            <SliderRow label="Start at" value={audio.offset} min={0} max={Math.max(0, audio.duration - 1)} step={0.1} onChange={(offset) => setAudio({ offset })} format={(v) => `${v.toFixed(1)}s`} />
            <SwitchRow label="Fade out at end" checked={audio.fadeOut} onChange={(fadeOut) => setAudio({ fadeOut })} />
          </>
        ) : (
          <PanelButton onClick={() => audioRef.current?.click()}>
            <Upload className="size-3" /> Add music or voiceover
          </PanelButton>
        )}
        <input
          ref={audioRef}
          type="file"
          accept="audio/*"
          className={cn('hidden')}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void loadAudioFile(f)
            e.target.value = ''
          }}
        />
      </Section>
    </div>
  )
}

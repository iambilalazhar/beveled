import { Download, Video } from 'lucide-react'
import { ASPECTS } from '../../presets'
import { totalDuration } from '../../timeline/evaluate'
import { useEditor, useScene } from '../../store'
import { PanelButton, Row, Section, SegmentRow, SliderRow, SwitchRow, valueClass } from '../controls'

const QUALITY = [
  { label: 'Low', mbps: 4 },
  { label: 'Med', mbps: 8 },
  { label: 'High', mbps: 16 },
  { label: 'Ultra', mbps: 32 },
]

function exportSize(canvas: { width: number; height: number }, frame: { aspect: string; customWidth: number; customHeight: number }, scale: number) {
  if (frame.aspect === 'custom') return { width: Math.round(frame.customWidth * scale), height: Math.round(frame.customHeight * scale) }
  return { width: Math.round(canvas.width * scale), height: Math.round(canvas.height * scale) }
}

export function ExportPanel() {
  const exp = useScene('export')
  const frame = useScene('frame')
  const update = useEditor((s) => s.update)
  const canvasSize = useEditor((s) => s.canvasSize)
  const exporting = useEditor((s) => s.exporting)
  const recording = useEditor((s) => s.recording)
  const requestExport = useEditor((s) => s.requestExport)
  const requestVideo = useEditor((s) => s.requestVideo)
  const cancelRecord = useEditor((s) => s.cancelRecord)
  const progress = useEditor((s) => s.recordingProgress)
  const total = useEditor((s) => totalDuration(s.project.clips))
  const hasAudio = useEditor((s) => !!s.project.audio.url)
  const size = exportSize(canvasSize, frame, exp.scale)
  const videoW = Math.round((exp.videoHeight * canvasSize.width) / Math.max(1, canvasSize.height) / 2) * 2
  const lossy = exp.format !== 'png'
  const transparentAllowed = exp.format !== 'jpeg'

  return (
    <div className="space-y-5">
      <Section title="Image">
        <SegmentRow
          value={exp.format}
          onChange={(format) => update('export', { format, transparent: format === 'jpeg' ? false : exp.transparent })}
          options={[
            { value: 'png', label: 'PNG' },
            { value: 'jpeg', label: 'JPG' },
            { value: 'webp', label: 'WebP' },
          ]}
        />
        <SegmentRow
          value={String(exp.scale)}
          onChange={(v) => update('export', { scale: Number(v) })}
          options={[
            { value: '1', label: '1×' },
            { value: '2', label: '2×' },
            { value: '3', label: '3×' },
            { value: '4', label: '4×' },
          ]}
        />
        {lossy && <SliderRow label="Quality" value={exp.quality} min={0.5} max={1} step={0.01} onChange={(quality) => update('export', { quality })} format={(v) => `${Math.round(v * 100)}%`} />}
        <SwitchRow label="Transparent background" checked={exp.transparent && transparentAllowed} onChange={(transparent) => update('export', { transparent })} disabled={!transparentAllowed} />
        <Row label="Output">
          <span className={valueClass}>
            {size.width} × {size.height}
          </span>
        </Row>
        <PanelButton primary onClick={() => requestExport()} disabled={exporting || recording}>
          <Download className="size-3" /> {exporting ? 'Rendering…' : `Export ${exp.format.toUpperCase()}`}
        </PanelButton>
        <p className="px-1 font-mono text-[10px] leading-relaxed text-white/45">
          Frame: {ASPECTS.find((a) => a.id === frame.aspect)?.label ?? frame.aspect}. Change it from the top bar. ⌘E exports with these settings.
        </p>
      </Section>

      <Section title="Video">
        <SegmentRow
          value={exp.videoFormat}
          onChange={(videoFormat) => update('export', { videoFormat })}
          options={[
            { value: 'mp4', label: 'MP4' },
            { value: 'webm', label: 'WebM' },
          ]}
        />
        <SegmentRow
          value={String(exp.videoHeight)}
          onChange={(v) => update('export', { videoHeight: Number(v) })}
          options={[
            { value: '720', label: '720p' },
            { value: '1080', label: '1080p' },
            { value: '1440', label: '1440p' },
            { value: '2160', label: '4K' },
          ]}
        />
        <SegmentRow
          value={String(exp.fps)}
          onChange={(v) => update('export', { fps: Number(v) })}
          options={[
            { value: '24', label: '24 fps' },
            { value: '30', label: '30 fps' },
            { value: '60', label: '60 fps' },
          ]}
        />
        <SegmentRow
          value={String(QUALITY.find((q) => q.mbps === exp.videoBitrate)?.mbps ?? 'custom')}
          onChange={(v) => update('export', { videoBitrate: Number(v) })}
          options={QUALITY.map((q) => ({ value: String(q.mbps), label: q.label }))}
        />
        <SliderRow label="Bitrate" value={exp.videoBitrate} min={2} max={60} step={1} onChange={(videoBitrate) => update('export', { videoBitrate })} format={(v) => `${v.toFixed(0)} Mbps`} />
        <div className="space-y-1">
          <div className="px-1 font-mono text-[9px] uppercase tracking-[0.12em] text-white/40">Motion blur</div>
          <SegmentRow
            value={String(exp.motionBlur)}
            onChange={(v) => update('export', { motionBlur: Number(v) })}
            options={[
              { value: '1', label: 'Off' },
              { value: '3', label: 'Low' },
              { value: '5', label: 'Med' },
              { value: '8', label: 'High' },
            ]}
          />
        </div>
        {exp.videoFormat === 'webm' && (
          <SwitchRow label="Transparent video" checked={exp.videoAlpha && exp.transparent} onChange={(videoAlpha) => update('export', { videoAlpha, transparent: videoAlpha ? true : exp.transparent })} />
        )}
        <Row label="Output">
          <span className={valueClass}>
            {videoW} × {exp.videoHeight} · {total.toFixed(1)}s · {Math.round(total * exp.fps)} frames{hasAudio ? ' · audio' : ''}
          </span>
        </Row>
        {recording ? (
          <>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-primary transition-[width]" style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
            <PanelButton onClick={cancelRecord}>Cancel</PanelButton>
          </>
        ) : (
          <PanelButton primary onClick={() => requestVideo('timeline')} disabled={exporting}>
            <Video className="size-3" /> Export {exp.videoFormat.toUpperCase()}
          </PanelButton>
        )}
        <p className="px-1 font-mono text-[10px] leading-relaxed text-white/45">
          Renders the whole timeline frame by frame, so the video is smooth even on a slow machine. Motion blur renders {exp.motionBlur}× the frames. Transparent video needs WebM (VP9) and a background set to None. Keep this tab open until it finishes.
        </p>
      </Section>
    </div>
  )
}

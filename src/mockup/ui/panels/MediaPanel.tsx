import { isExtensionRuntime } from '@/lib/env'
import { Clapperboard, ImageIcon, Trash2, Upload } from 'lucide-react'
import { useRef } from 'react'
import { useEditor, useScene } from '../../store'
import { AnimSliderRow, PanelButton, Row, Section, SegmentRow, labelClass, valueClass } from '../controls'
import { ACCEPT, useMediaLoader } from '../useMediaLoader'

export function MediaPanel() {
  const media = useScene('media')
  const device = useScene('device')
  const update = useEditor((s) => s.update)
  const { loadFiles, clear } = useMediaLoader()
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-5">
      <Section title="Source">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-28 w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/15 bg-white/[0.03] text-white/70 transition-colors hover:border-primary/60 hover:bg-primary/5 hover:text-white"
        >
          <Upload className="size-4" />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em]">Click to upload</span>
          <span className="font-mono text-[9px] uppercase tracking-wider text-white/40">Drag & drop on the stage or paste</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            loadFiles(e.target.files)
            e.target.value = ''
          }}
        />
        {media.url ? (
          <div className="space-y-1">
            <div className="flex items-center gap-3 rounded-lg bg-white/[0.05] p-2">
              <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-black/60">
                {media.kind === 'video' ? (
                  <Clapperboard className="size-5 text-white/60" />
                ) : (
                  <img src={media.url} alt="" className="size-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[11px] text-white/85">{media.name ?? (media.kind === 'video' ? 'Video' : 'Image')}</div>
                <div className={valueClass + ' text-white/50'}>
                  {media.width} × {media.height} · {media.kind}
                </div>
              </div>
              <button type="button" onClick={clear} className="rounded p-1.5 text-white/40 hover:bg-white/10 hover:text-white" title="Remove media">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <Row label="Screen">
            <span className={valueClass + ' flex items-center gap-1 text-white/50'}>
              <ImageIcon className="size-3" /> Placeholder
            </span>
          </Row>
        )}
      </Section>

      <Section title="Fit">
        <SegmentRow
          value={device.fit}
          onChange={(fit) => update('device', { fit })}
          options={[
            { value: 'cover', label: 'Cover' },
            { value: 'contain', label: 'Contain' },
            { value: 'stretch', label: 'Stretch' },
          ]}
        />
        {device.fit === 'cover' && (
          <AnimSliderRow animKey="device.scroll" label="Scroll" min={0} max={1} step={0.001} onChange={(scroll) => update('device', { scroll })} format={(v) => `${Math.round(v * 100)}%`} />
        )}
        <p className={labelClass + ' px-1 normal-case tracking-normal text-white/40'}>
          Scroll moves through screenshots taller than the screen (keyframe it for a scrolling video). Cover fills the screen and crops. Contain shows the whole image with black bars. Stretch ignores the aspect ratio.
        </p>
      </Section>

      {isExtensionRuntime() && (
        <Section title="Capture">
          <p className={labelClass + ' px-1 normal-case tracking-normal text-white/40'}>Your latest capture from the Beveled popup is loaded automatically when this tab opens.</p>
        </Section>
      )}

      <Section title="Tips">
        <div className="space-y-1 px-1 font-mono text-[10px] leading-relaxed text-white/45">
          <p>• Paste a screenshot with ⌘V / Ctrl+V.</p>
          <p>• Drop an MP4 or WebM to put a video on the screen.</p>
          <p>• Portrait screenshots look best on the phone and tablet.</p>
        </div>
        <PanelButton onClick={() => inputRef.current?.click()}>
          <Upload className="size-3" /> Choose file
        </PanelButton>
      </Section>
    </div>
  )
}

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { ImagePlus, Plus, Trash2 } from 'lucide-react'
import { useRef } from 'react'
import { selectedClip, useEditor } from '../../store'
import { FONT_FAMILIES, fontStack } from '../../timeline/cardRender'
import { PLACEHOLDER_LOGO } from '../../timeline/factory'
import type { LogoAnimEffect, LogoClip, LogoEffect, TextAnim, TextClip, TextEffect, TextUnit } from '../../timeline/types'
import { BackgroundEditor } from '../BackgroundEditor'
import { ColorRow, labelClass, Section, SegmentRow, SelectRow, SliderRow, Tile, TileGrid, TileLabel } from '../controls'

const TEXT_EFFECTS: { value: TextEffect; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'soft-blur', label: 'Soft blur' },
  { value: 'fade-up', label: 'Fade up' },
  { value: 'scale-up', label: 'Scale up' },
  { value: 'scale-down', label: 'Scale down' },
  { value: 'blur-scale-up', label: 'Blur scale up' },
  { value: 'blur-scale-down', label: 'Blur scale down' },
  { value: 'words-in-left', label: 'Words in left' },
  { value: 'words-in-right', label: 'Words in right' },
  { value: 'knock-left', label: 'Knock left' },
  { value: 'knock-right', label: 'Knock right' },
]

const UNITS: { value: TextUnit; label: string }[] = [
  { value: 'line', label: 'Line' },
  { value: 'word', label: 'Word' },
  { value: 'character', label: 'Character' },
]

function ClipHeader() {
  const clip = useEditor((s) => selectedClip(s))
  const rename = useEditor((s) => s.renameClip)
  const setDuration = useEditor((s) => s.setClipDuration)
  const remove = useEditor((s) => s.removeClip)
  return (
    <Section title="Clip" action={<button type="button" title="Delete clip" onClick={() => remove(clip.id)} className="rounded p-1 text-white/40 hover:bg-white/10 hover:text-white"><Trash2 className="size-3" /></button>}>
      <div className="flex h-9 items-center gap-2 rounded-lg bg-white/[0.05] px-3">
        <span className={labelClass}>Name</span>
        <input className="min-w-0 flex-1 bg-transparent text-right font-mono text-[11px] text-white/85 outline-none focus:text-primary" value={clip.name} onChange={(e) => rename(clip.id, e.target.value)} />
      </div>
      <SliderRow label="Duration" value={clip.duration} min={0.5} max={20} step={0.1} onChange={(d) => setDuration(clip.id, d)} format={(v) => `${v.toFixed(1)}s`} />
    </Section>
  )
}

function AnimControls({ title, value, onChange }: { title: string; value: TextAnim; onChange: (patch: Partial<TextAnim>) => void }) {
  return (
    <Section title={title}>
      <SegmentRow value={value.per} onChange={(per) => onChange({ per })} options={UNITS} />
      <SliderRow label="Duration" value={value.duration} min={0} max={4} step={0.05} onChange={(duration) => onChange({ duration })} format={(v) => `${v.toFixed(2)}s`} />
      <SelectRow label="Effect" value={value.effect} onChange={(effect) => onChange({ effect })} options={TEXT_EFFECTS} />
    </Section>
  )
}

function TextPanel({ clip }: { clip: TextClip }) {
  const updateText = useEditor((s) => s.updateText)
  const t = clip.text
  const set = (patch: Partial<TextClip['text']>) => updateText(clip.id, patch)
  const areaRef = useRef<HTMLTextAreaElement>(null)

  const addCycle = () => {
    // Turn the last word into a {word|…} cycle the first time; add another option afterwards.
    const text = t.text
    const m = text.match(/\{([^{}]*)\}\s*$/)
    if (m) set({ text: text.replace(/\{([^{}]*)\}\s*$/, `{${m[1]}|word}`) })
    else {
      const w = text.match(/(\S+)\s*$/)
      if (w) set({ text: text.slice(0, w.index) + `{${w[1]}|word}` })
    }
    areaRef.current?.focus()
  }

  return (
    <div className="space-y-5">
      <ClipHeader />
      <Section title="Text">
        <textarea
          ref={areaRef}
          value={t.text}
          onChange={(e) => set({ text: e.target.value })}
          rows={3}
          className="w-full resize-y rounded-lg bg-white/[0.05] px-3 py-2 text-[13px] text-white outline-none ring-primary/60 focus:ring-1"
          style={{ fontFamily: fontStack(t.font) }}
        />
      </Section>
      <Section title="Font">
        <Select value={t.font} onValueChange={(font) => set({ font })}>
          <SelectTrigger className="h-9 w-full justify-between rounded-lg border-0 bg-white/[0.05] px-3 shadow-none data-[size=default]:h-9">
            <span className={labelClass}>Family</span>
            <span className="ml-auto text-[12px] text-white/85">
              <SelectValue />
            </span>
          </SelectTrigger>
          <SelectContent className="max-h-80 border-white/10 bg-[#161618]">
            {FONT_FAMILIES.map((f) => (
              <SelectItem key={f} value={f} style={{ fontFamily: fontStack(f) }}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <SliderRow label="Weight" value={t.weight} min={100} max={900} step={100} onChange={(weight) => set({ weight })} />
        <SliderRow label="Size" value={t.size} min={1} max={20} step={0.1} onChange={(size) => set({ size })} />
        <SliderRow label="Spacing" value={t.spacing} min={-15} max={40} step={1} onChange={(spacing) => set({ spacing })} />
        <SliderRow label="Line height" value={t.lineHeight} min={0.8} max={2} step={0.01} onChange={(lineHeight) => set({ lineHeight })} />
        <SegmentRow
          value={t.align}
          onChange={(align) => set({ align })}
          options={[
            { value: 'left', label: 'Left' },
            { value: 'center', label: 'Center' },
            { value: 'right', label: 'Right' },
          ]}
        />
        <ColorRow label="Colour" value={t.color} onChange={(color) => set({ color })} />
      </Section>
      <AnimControls title="Enter" value={t.enter} onChange={(p) => set({ enter: { ...t.enter, ...p } })} />
      <AnimControls title="Exit" value={t.exit} onChange={(p) => set({ exit: { ...t.exit, ...p } })} />
      <Section
        title="Word cycle"
        action={
          <button type="button" onClick={addCycle} className="rounded p-1 text-white/40 hover:bg-white/10 hover:text-white" title="Cycle the last word">
            <Plus className="size-3" />
          </button>
        }
      >
        <p className="px-1 font-mono text-[10px] leading-relaxed text-white/45">Press + to cycle the last word through a list, or type {'{one|two|three}'} in the text.</p>
      </Section>
      <Section title="Background">
        <BackgroundEditor bg={t.background} onChange={(patch) => set({ background: { ...t.background, ...patch } })} allowTransparent={false} />
      </Section>
    </div>
  )
}

const LOGO_EFFECTS: { value: LogoEffect; label: string; css: string }[] = [
  { value: 'none', label: 'None', css: '#ffffff' },
  { value: 'liquid-metal', label: 'Liquid metal', css: 'linear-gradient(120deg,#6b6f78,#f5f7fa 25%,#9aa0aa 45%,#ffffff 60%,#7c828c 80%,#e9edf2)' },
  { value: 'gem-smoke', label: 'Gem smoke', css: 'radial-gradient(circle at 30% 30%,#fff,#bbb 40%,#555 70%,#eee)' },
  { value: 'heatmap', label: 'Heatmap', css: 'linear-gradient(90deg,#000004,#3b0f70,#8c2981,#de4968,#fe9f6d,#fcfdbf)' },
]

const LOGO_ANIMS: { value: LogoAnimEffect; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'fade', label: 'Fade' },
  { value: 'scale', label: 'Scale' },
  { value: 'blur', label: 'Blur' },
  { value: 'rise', label: 'Rise' },
]

function LogoPanel({ clip }: { clip: LogoClip }) {
  const updateLogo = useEditor((s) => s.updateLogo)
  const l = clip.logo
  const set = (patch: Partial<LogoClip['logo']>) => updateLogo(clip.id, patch)
  const fileRef = useRef<HTMLInputElement>(null)
  const src = l.url ?? PLACEHOLDER_LOGO
  return (
    <div className="space-y-5">
      <ClipHeader />
      <Section title="Source">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative flex h-28 w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-white/15 bg-white/[0.03] hover:border-primary/60"
        >
          <img src={src} alt="" className="max-h-16 max-w-[70%] object-contain" />
          <span className="absolute bottom-2 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-white/80">
            <ImagePlus className="size-3" /> {l.url ? 'Replace logo' : 'Upload logo (PNG / SVG)'}
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/svg+xml,image/webp,image/jpeg"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) {
              const reader = new FileReader()
              reader.onload = () => set({ url: String(reader.result), name: f.name })
              reader.readAsDataURL(f)
            }
            e.target.value = ''
          }}
        />
      </Section>
      <Section title="Effect">
        <TileGrid cols={2}>
          {LOGO_EFFECTS.map((e) => (
            <Tile key={e.value} active={l.effect === e.value} onClick={() => set({ effect: e.value })} className="h-20 gap-1 p-1.5">
              <span className={cn('h-10 w-full rounded-md')} style={{ background: e.css, WebkitMaskImage: `url(${src})`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center' }} />
              <TileLabel>{e.label}</TileLabel>
            </Tile>
          ))}
        </TileGrid>
      </Section>
      <Section title="Logo">
        <SliderRow label="Scale" value={l.scale} min={0.5} max={12} step={0.1} onChange={(scale) => set({ scale })} />
      </Section>
      <Section title="Enter">
        <SelectRow label="Effect" value={l.enter.effect} onChange={(effect) => set({ enter: { ...l.enter, effect } })} options={LOGO_ANIMS} />
        <SliderRow label="Duration" value={l.enter.duration} min={0} max={3} step={0.05} onChange={(duration) => set({ enter: { ...l.enter, duration } })} format={(v) => `${v.toFixed(2)}s`} />
      </Section>
      <Section title="Exit">
        <SelectRow label="Effect" value={l.exit.effect} onChange={(effect) => set({ exit: { ...l.exit, effect } })} options={LOGO_ANIMS} />
        <SliderRow label="Duration" value={l.exit.duration} min={0} max={3} step={0.05} onChange={(duration) => set({ exit: { ...l.exit, duration } })} format={(v) => `${v.toFixed(2)}s`} />
      </Section>
      <Section title="Background">
        <BackgroundEditor bg={l.background} onChange={(patch) => set({ background: { ...l.background, ...patch } })} allowTransparent={false} paletteSource={l.url} />
      </Section>
    </div>
  )
}

export function ClipPanel() {
  const clip = useEditor((s) => selectedClip(s))
  if (clip.kind === 'text') return <TextPanel clip={clip} />
  if (clip.kind === 'logo') return <LogoPanel clip={clip} />
  return <p className="px-1 font-mono text-[10px] text-white/45">Select a text or logo clip on the timeline.</p>
}

import { cn } from '@/lib/utils'
import { ensureFont, FONT_FAMILIES } from '@/mockup/timeline/cardRender'
import { useEffect } from 'react'
import { ColorRow, Section, SegmentRow, SelectRow, SliderRow, SwitchRow } from '@/mockup/ui/controls'
import { AlignCenter, AlignLeft, AlignRight } from 'lucide-react'
import { TEXT_STYLES } from '../presets'
import { useShots } from '../store'
import type { HighlightStyle, TextPlacement } from '../types'

const PLACEMENTS: { id: TextPlacement; label: string; box: string }[] = [
  { id: 'none', label: 'None', box: '' },
  { id: 'top', label: 'Top', box: 'inset-x-1 top-1 h-2' },
  { id: 'bottom', label: 'Bottom', box: 'inset-x-1 bottom-1 h-2' },
  { id: 'left', label: 'Left', box: 'inset-y-1 left-1 w-3' },
  { id: 'right', label: 'Right', box: 'inset-y-1 right-1 w-3' },
  { id: 'overlay', label: 'Over', box: 'inset-x-2 top-3 h-2' },
]

const field = 'w-full rounded-lg bg-white/[0.05] px-3 py-2 text-[12px] text-white/90 outline-none placeholder:text-white/30 focus:ring-1 focus:ring-primary/60'

export function TextTab() {
  const t = useShots((s) => s.project.text)
  const setText = useShots((s) => s.setText)
  const fonts = FONT_FAMILIES.map((f) => ({ value: f, label: f }))
  // Load the pairing fonts so the style buttons preview in their own typeface.
  useEffect(() => {
    for (const st of TEXT_STYLES) void ensureFont(st.patch.font!, st.patch.weight)
  }, [])
  return (
    <div className="space-y-5">
      <Section title="Placement">
        <div className="grid grid-cols-6 gap-1">
          {PLACEMENTS.map((p) => (
            <button
              key={p.id}
              type="button"
              title={p.label}
              onClick={() => setText({ placement: p.id })}
              className={cn('flex flex-col items-center gap-1 rounded-lg border py-1.5', t.placement === p.id ? 'border-primary/80 bg-primary/10' : 'border-white/[0.06] bg-white/[0.04] hover:border-white/20')}
            >
              <span className="relative block h-7 w-9 rounded-[4px] border border-white/25">
                {p.box && <span className={cn('absolute rounded-[2px] bg-primary/80', p.box)} />}
                {p.id !== 'none' && <span className="absolute left-1/2 top-1/2 h-3 w-2 -translate-x-1/2 -translate-y-1/2 rounded-[2px] border border-white/50" />}
              </span>
              <span className="font-mono text-[7px] uppercase tracking-wider text-white/60">{p.label}</span>
            </button>
          ))}
        </div>
        {t.placement !== 'none' && t.placement !== 'overlay' && (
          <SliderRow label="Text area" value={Math.round(t.area * 100)} min={12} max={70} step={1} onChange={(v) => setText({ area: v / 100 })} format={(v) => `${v.toFixed(0)}%`} />
        )}
      </Section>

      <Section title="Copy">
        <input className={field} placeholder="Eyebrow (small label)" value={t.eyebrow} onChange={(e) => setText({ eyebrow: e.target.value })} />
        <textarea className={cn(field, 'min-h-[72px] resize-y text-[14px] font-semibold')} placeholder="Headline" value={t.headline} onChange={(e) => setText({ headline: e.target.value })} />
        <textarea className={cn(field, 'min-h-[52px] resize-y')} placeholder="Subtitle" value={t.subtitle} onChange={(e) => setText({ subtitle: e.target.value })} />
        <input className={field} placeholder="Badge / call to action (optional)" value={t.badge} onChange={(e) => setText({ badge: e.target.value })} />
        <p className="px-1 font-mono text-[9px] leading-relaxed text-white/40">Wrap words in *stars* to highlight them. Press Enter in the headline for a line break.</p>
      </Section>

      <Section title="Type style">
        <div className="grid grid-cols-2 gap-1">
          {TEXT_STYLES.map((st) => {
            const active = st.patch.font === t.font && st.patch.weight === t.weight
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setText(st.patch)}
                className={cn('rounded-lg border px-2.5 py-2 text-left', active ? 'border-primary/80 bg-primary/10' : 'border-white/[0.06] bg-white/[0.04] hover:border-white/20')}
              >
                <span className="block truncate text-[15px] leading-tight text-white/90" style={{ fontFamily: `"${st.patch.font}", Inter, system-ui`, fontWeight: st.patch.weight, textTransform: st.patch.uppercase ? 'uppercase' : 'none' }}>
                  Aa {st.label}
                </span>
                <span className="font-mono text-[8px] uppercase tracking-wider text-white/40">{st.patch.font}</span>
              </button>
            )
          })}
        </div>
        <SelectRow label="Headline font" value={t.font} options={fonts} onChange={(font) => setText({ font })} />
        <SelectRow label="Body font" value={t.bodyFont} options={fonts} onChange={(bodyFont) => setText({ bodyFont })} />
        <SliderRow label="Weight" value={t.weight} min={300} max={900} step={100} onChange={(weight) => setText({ weight })} />
        <SliderRow label="Size" value={t.size} min={2} max={18} step={0.1} onChange={(size) => setText({ size })} />
        <SliderRow label="Spacing" value={t.spacing} min={-10} max={20} step={0.5} onChange={(spacing) => setText({ spacing })} />
        <SliderRow label="Line height" value={t.lineHeight} min={0.8} max={1.6} step={0.01} onChange={(lineHeight) => setText({ lineHeight })} />
        <SegmentRow
          value={t.align}
          onChange={(align) => setText({ align })}
          options={[
            { value: 'left', label: <AlignLeft className="size-3.5" />, title: 'Left' },
            { value: 'center', label: <AlignCenter className="size-3.5" />, title: 'Centre' },
            { value: 'right', label: <AlignRight className="size-3.5" />, title: 'Right' },
          ]}
        />
        <SwitchRow label="Uppercase headline" checked={t.uppercase} onChange={(uppercase) => setText({ uppercase })} />
      </Section>

      <Section title="Highlight">
        <SegmentRow<HighlightStyle>
          value={t.highlight}
          onChange={(highlight) => setText({ highlight })}
          options={[
            { value: 'color', label: 'Colour' },
            { value: 'marker', label: 'Marker' },
            { value: 'underline', label: 'Line' },
            { value: 'italic', label: 'Italic' },
          ]}
        />
      </Section>

      <Section title="Colours">
        <div className="grid grid-cols-2 gap-1">
          <button type="button" onClick={() => setText({ color: '#0a0a0a', subColor: '#52525b', badgeText: '#ffffff' })} className="h-8 rounded-lg bg-white font-mono text-[9px] uppercase tracking-wider text-black">
            Dark text
          </button>
          <button type="button" onClick={() => setText({ color: '#ffffff', subColor: 'rgba(255,255,255,0.72)', badgeText: '#ffffff' })} className="h-8 rounded-lg bg-black font-mono text-[9px] uppercase tracking-wider text-white ring-1 ring-white/20">
            Light text
          </button>
        </div>
        <ColorRow label="Headline" value={t.color} onChange={(color) => setText({ color })} />
        <ColorRow label="Subtitle" value={t.subColor.startsWith('#') ? t.subColor : '#bbbbbb'} onChange={(subColor) => setText({ subColor })} />
        <ColorRow label="Accent" value={t.accent} onChange={(accent) => setText({ accent })} />
        <ColorRow label="Badge text" value={t.badgeText} onChange={(badgeText) => setText({ badgeText })} />
      </Section>

      <Section title="Motion">
        <SwitchRow label="Fade text up in videos" checked={t.animate} onChange={(animate) => setText({ animate })} />
      </Section>
    </div>
  )
}

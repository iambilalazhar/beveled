import { cn } from '@/lib/utils'
import { FRAME_PRESETS } from '@/mockup/presets'
import type { BackgroundState, LightShadowPattern } from '@/mockup/types'
import { BackgroundEditor } from '@/mockup/ui/BackgroundEditor'
import { cssBackground } from '@/mockup/ui/backgroundCss'
import { Section, SegmentRow, SliderRow, SwitchRow } from '@/mockup/ui/controls'
import { extractPalette, paletteBackgrounds } from '@/mockup/ui/palette'
import { Shuffle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { BG_LIBRARIES, FRAME_RATIOS } from '../presets'
import { useShots } from '../store'
import type { SceneOverlay } from '../types'

function Thumb({ bg, active, onClick, label }: { bg: BackgroundState; active: boolean; onClick: () => void; label: string }) {
  const [failed, setFailed] = useState(false)
  const id = label
  const showImage = bg.kind === 'shader' && !failed
  return (
    <button type="button" title={label} onClick={onClick} className={cn('relative h-12 overflow-hidden rounded-md ring-1', active ? 'ring-2 ring-primary' : 'ring-white/10 hover:ring-white/30')} style={{ background: cssBackground(bg.kind === 'shader' ? 'linear' : bg.kind, bg.colors, bg.angle) }}>
      {showImage && <img src={`/backgrounds/${id}.jpg`} alt="" loading="lazy" onError={() => setFailed(true)} className="absolute inset-0 size-full object-cover" />}
      {bg.noise > 0.2 && <span className="absolute inset-0 opacity-30 mix-blend-overlay [background-image:repeating-radial-gradient(circle,#000_0_1px,transparent_1px_3px)]" />}
    </button>
  )
}

function Library() {
  const background = useShots((s) => s.project.frame.background)
  const setFrame = useShots((s) => s.setFrame)
  const media = useShots((s) => s.project.mockup.media[0])
  const [category, setCategory] = useState('magic')
  const [palette, setPalette] = useState<{ src: string; colors: string[] } | null>(null)
  const source = media?.kind === 'image' ? media.url : null
  useEffect(() => {
    if (!source) return
    let cancelled = false
    extractPalette(source)
      .then((colors) => !cancelled && setPalette({ src: source, colors }))
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [source])
  const magic = palette && palette.src === source ? paletteBackgrounds(palette.colors) : []
  const same = (bg: BackgroundState) => bg.kind === background.kind && bg.colors.join() === background.colors.join() && (bg.kind !== 'shader' || bg.shader === background.shader)
  const set = (bg: BackgroundState) => setFrame({ background: { ...background, ...bg } })
  const cats = [{ id: 'magic', label: 'Magic' }, ...BG_LIBRARIES.map((l) => ({ id: l.id, label: l.label }))]
  return (
    <Section title="Background">
      <div className="flex flex-wrap gap-1">
        {cats.map((c) => (
          <button key={c.id} type="button" onClick={() => setCategory(c.id)} className={cn('rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider', category === c.id ? 'bg-white text-black' : 'bg-white/[0.05] text-white/60 hover:text-white')}>
            {c.label}
          </button>
        ))}
      </div>
      {category === 'magic' ? (
        magic.length ? (
          <div className="grid grid-cols-4 gap-1">
            {magic.map((p, i) => {
              const bg: BackgroundState = { ...background, kind: p.kind, colors: p.colors, angle: p.angle, noise: 0, image: null }
              return <Thumb key={i} bg={bg} label={`Magic ${i + 1}`} active={same(bg)} onClick={() => set(bg)} />
            })}
            {palette && (
              <Thumb
                bg={{ ...background, kind: 'shader', shader: 'mesh', colors: palette.colors.slice(0, 3), speed: 0.4, image: null }}
                label="Magic mesh"
                active={background.kind === 'shader' && background.shader === 'mesh' && background.colors.join() === palette.colors.slice(0, 3).join()}
                onClick={() => set({ ...background, kind: 'shader', shader: 'mesh', colors: palette.colors.slice(0, 3), speed: 0.4, image: null })}
              />
            )}
          </div>
        ) : (
          <p className="px-1 font-mono text-[10px] leading-relaxed text-white/45">Uses the colours in your screenshot to generate backgrounds. Add an image to see them.</p>
        )
      ) : (
        <div className="grid grid-cols-4 gap-1">
          {BG_LIBRARIES.find((l) => l.id === category)!.items.map((item) => (
            <Thumb key={item.id} bg={item.bg} label={item.id} active={same(item.bg)} onClick={() => set(item.bg)} />
          ))}
        </div>
      )}
    </Section>
  )
}

export function FrameTab() {
  const frame = useShots((s) => s.project.frame)
  const setFrame = useShots((s) => s.setFrame)
  const ratio = FRAME_RATIOS.find((r) => r.w * frame.height === r.h * frame.width)
  return (
    <div className="space-y-5">
      <Section title="Size">
        <div className="flex h-9 items-center gap-2 rounded-lg bg-white/[0.05] px-3 font-mono text-[11px] text-white/85">
          <span className="text-white/45">W</span>
          <input className="w-16 bg-transparent outline-none focus:text-primary" type="number" min={128} max={8192} value={frame.width} onChange={(e) => setFrame({ width: Math.max(128, Math.min(8192, Number(e.target.value) || 128)) })} />
          <span className="text-white/45">H</span>
          <input className="w-16 bg-transparent outline-none focus:text-primary" type="number" min={128} max={8192} value={frame.height} onChange={(e) => setFrame({ height: Math.max(128, Math.min(8192, Number(e.target.value) || 128)) })} />
        </div>
        <div className="grid grid-cols-5 gap-1">
          {FRAME_RATIOS.map((r) => (
            <button key={r.label} type="button" onClick={() => setFrame({ width: r.w, height: r.h })} className={cn('h-7 rounded-md font-mono text-[9px]', ratio === r ? 'bg-white/[0.14] text-white' : 'bg-white/[0.04] text-white/55 hover:text-white')}>
              {r.label}
            </button>
          ))}
        </div>
        <select
          className="h-9 w-full rounded-lg bg-white/[0.05] px-2 font-mono text-[10px] uppercase tracking-wider text-white/75 outline-none"
          value=""
          onChange={(e) => {
            const p = FRAME_PRESETS[Number(e.target.value)]
            if (p) setFrame({ width: p.width, height: p.height })
          }}
        >
          <option value="">Social & App Store sizes…</option>
          {FRAME_PRESETS.map((p, i) => (
            <option key={i} value={i}>
              {p.group} · {p.label} ({p.width}×{p.height})
            </option>
          ))}
        </select>
      </Section>

      <Library />

      <Section title="Customise background">
        <BackgroundEditor compact bg={frame.background} onChange={(patch) => setFrame({ background: { ...frame.background, ...patch } })} />
      </Section>

      <Section title="Animation">
        <SegmentRow
          value={frame.parallax ? 'parallax' : 'static'}
          onChange={(v) => setFrame({ parallax: v === 'parallax' })}
          options={[
            { value: 'static', label: 'Static' },
            { value: 'parallax', label: 'Parallax' },
          ]}
        />
      </Section>

      <Section title="Scene">
        <SegmentRow<SceneOverlay>
          value={frame.scene}
          onChange={(scene) => setFrame({ scene })}
          options={[
            { value: 'none', label: 'None' },
            { value: 'shadow', label: 'Shadow' },
            { value: 'shapes', label: 'Shapes' },
          ]}
        />
        {frame.scene === 'shadow' && (
          <>
            <SegmentRow<LightShadowPattern>
              value={frame.lightShadowPattern}
              onChange={(lightShadowPattern) => setFrame({ lightShadowPattern })}
              options={[
                { value: 'leaves', label: 'Leaves' },
                { value: 'palm', label: 'Palm' },
                { value: 'blinds', label: 'Blinds' },
                { value: 'window', label: 'Window' },
              ]}
            />
            <SliderRow label="Opacity" value={frame.lightShadowOpacity} min={0.05} max={1} step={0.01} onChange={(lightShadowOpacity) => setFrame({ lightShadowOpacity })} />
          </>
        )}
        {frame.scene === 'shapes' && (
          <button type="button" onClick={() => setFrame({ shapesSeed: frame.shapesSeed + 1 })} className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-white/[0.05] font-mono text-[10px] uppercase tracking-wider text-white/75 hover:bg-white/10">
            <Shuffle className="size-3" /> Shuffle shapes
          </button>
        )}
      </Section>

      <Section title="Effects & watermark">
        <SliderRow label="Portrait blur" value={frame.portrait} min={0} max={1} step={0.01} onChange={(portrait) => setFrame({ portrait })} />
        <SliderRow label="Grain" value={frame.grain} min={0} max={0.6} step={0.01} onChange={(grain) => setFrame({ grain })} />
        <SliderRow label="Vignette" value={frame.vignette} min={0} max={1} step={0.01} onChange={(vignette) => setFrame({ vignette })} />
        <SliderRow label="Glow" value={frame.bloom} min={0} max={1.5} step={0.01} onChange={(bloom) => setFrame({ bloom })} />
        <SliderRow label="Chromatic" value={frame.chromatic} min={0} max={1} step={0.01} onChange={(chromatic) => setFrame({ chromatic })} />
        <SwitchRow label="Watermark" checked={frame.watermark} onChange={(watermark) => setFrame({ watermark })} />
        {frame.watermark && (
          <div className="flex h-9 items-center gap-2 rounded-lg bg-white/[0.05] px-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-white/60">Text</span>
            <input className="min-w-0 flex-1 bg-transparent text-right text-[12px] text-white/85 outline-none focus:text-primary" value={frame.watermarkText} onChange={(e) => setFrame({ watermarkText: e.target.value })} />
          </div>
        )}
      </Section>
    </div>
  )
}

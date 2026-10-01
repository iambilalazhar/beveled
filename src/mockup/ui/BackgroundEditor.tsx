import { ImagePlus, Plus, Wand2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { BACKGROUND_PRESETS, SHADER_PRESETS } from '../presets'
import type { BackgroundKind, BackgroundState, ShaderBgId } from '../types'
import { cssBackground } from './backgroundCss'
import { ColorRow, Section, SegmentRow, SliderRow, Tile, TileGrid } from './controls'
import { extractPalette, paletteBackgrounds } from './palette'

let bgObjectUrls: string[] = []

/**
 * Background controls shared by shots and text / logo cards: presets, a palette generated from
 * the screenshot, solid / gradient / image / transparent, colour stops, angle, blur and grain.
 */
export function BackgroundEditor({
  bg,
  onChange,
  paletteSource,
  allowTransparent = true,
}: {
  bg: BackgroundState
  onChange: (patch: Partial<BackgroundState>) => void
  /** Image to sample the "From your media" palette from. */
  paletteSource?: string | null
  allowTransparent?: boolean
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [palette, setPalette] = useState<{ src: string; colors: string[] } | null>(null)
  const activeShader = bg.kind === 'shader' ? SHADER_PRESETS.find((p) => p.shader === bg.shader && p.colors.join() === bg.colors.join())?.id : undefined
  const activePreset = BACKGROUND_PRESETS.find((p) => p.kind === bg.kind && p.colors.join() === bg.colors.join())?.id

  useEffect(() => {
    if (!paletteSource) return
    let cancelled = false
    extractPalette(paletteSource)
      .then((colors) => !cancelled && setPalette({ src: paletteSource, colors }))
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [paletteSource])

  const setColor = (i: number, hex: string) => {
    const colors = [...bg.colors]
    colors[i] = hex
    onChange({ colors })
  }
  const suggestions = palette && palette.src === paletteSource ? paletteBackgrounds(palette.colors) : []

  const kinds: { value: BackgroundKind; label: string }[] = [
    { value: 'solid', label: 'Solid' },
    { value: 'linear', label: 'Linear' },
    { value: 'radial', label: 'Radial' },
    { value: 'shader', label: 'Motion' },
    { value: 'image', label: 'Image' },
  ]
  if (allowTransparent) kinds.push({ value: 'transparent', label: 'None' })

  return (
    <div className="space-y-5">
      {suggestions.length > 0 && (
        <Section title="From your media">
          <TileGrid cols={6}>
            {suggestions.map((p, i) => (
              <Tile key={i} onClick={() => onChange({ kind: p.kind, colors: p.colors, angle: p.angle })} title="Palette background" className="h-10 p-1">
                <span className="size-full rounded-md ring-1 ring-white/10" style={{ background: cssBackground(p.kind, p.colors, p.angle) }} />
              </Tile>
            ))}
          </TileGrid>
          <div className="flex gap-1 px-1">
            {palette?.colors.map((c) => (
              <span key={c} className="h-2 flex-1 rounded-full" style={{ background: c }} title={c} />
            ))}
          </div>
        </Section>
      )}

      <Section title="Presets" action={<Wand2 className="size-3 text-white/30" />}>
        <TileGrid cols={4}>
          {BACKGROUND_PRESETS.map((p) => (
            <Tile key={p.id} active={activePreset === p.id} onClick={() => onChange({ kind: p.kind, colors: p.colors, angle: p.angle })} title={p.label} className="h-11 p-1">
              <span className="size-full rounded-md ring-1 ring-white/10" style={{ background: cssBackground(p.kind, p.colors, p.angle) }} />
            </Tile>
          ))}
        </TileGrid>
      </Section>

      <Section title="Library">
        <div className="grid grid-cols-4 gap-1">
          {SHADER_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              title={`${p.label} · animated`}
              onClick={() => onChange({ kind: 'shader', shader: p.shader, colors: p.colors, speed: p.speed })}
              className={`relative h-12 overflow-hidden rounded-md ring-1 transition ${activeShader === p.id ? 'ring-2 ring-primary' : 'ring-white/10 hover:ring-white/30'}`}
              style={{ background: cssBackground('linear', p.colors, 135) }}
            >
              <img src={`/backgrounds/${p.id}.jpg`} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
              <span className="absolute inset-x-0 bottom-0 bg-black/45 px-1 py-px text-left font-mono text-[7px] uppercase tracking-wider text-white/85">{p.label}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Type">
        <SegmentRow
          value={bg.kind}
          onChange={(kind) => {
            if (kind === 'image' && !bg.image) fileRef.current?.click()
            const colors =
              kind === 'solid'
                ? bg.colors.slice(0, 1)
                : kind === 'shader' && bg.colors.length < 3
                  ? [...bg.colors, '#e05d38', '#6366f1'].slice(0, 3)
                  : bg.colors.length < 2
                    ? [bg.colors[0] ?? '#111', '#000000']
                    : bg.colors
            onChange({ kind, colors })
          }}
          options={kinds}
        />
      </Section>

      {bg.kind === 'image' && (
        <Section title="Image">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative flex h-24 w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-white/15 bg-white/[0.03] text-white/60 hover:border-primary/60"
          >
            {bg.image ? <img src={bg.image} alt="" className="absolute inset-0 size-full object-cover opacity-80" /> : null}
            <span className="relative flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 font-mono text-[10px] uppercase tracking-wider">
              <ImagePlus className="size-3" /> {bg.image ? 'Replace image' : 'Choose image'}
            </span>
          </button>
          <SliderRow label="Blur" value={bg.imageBlur} min={0} max={1} step={0.01} onChange={(imageBlur) => onChange({ imageBlur })} />
          <SliderRow label="Grain" value={bg.noise} min={0} max={1} step={0.01} onChange={(noise) => onChange({ noise })} />
        </Section>
      )}

      {bg.kind === 'shader' && (
        <Section title="Motion background">
          <div className="grid grid-cols-5 gap-1">
            {(['aurora', 'silk', 'mesh', 'waves', 'prism', 'chrome', 'dunes', 'swirl', 'bokeh', 'grain'] as ShaderBgId[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => onChange({ shader: id, colors: bg.colors.length >= 3 ? bg.colors : [...bg.colors, '#ffffff', '#888888'].slice(0, 3) })}
                className={`h-7 rounded-md font-mono text-[8px] uppercase tracking-wider ${bg.shader === id ? 'bg-white/[0.14] text-white' : 'bg-white/[0.04] text-white/55 hover:text-white'}`}
              >
                {id}
              </button>
            ))}
          </div>
          <SliderRow label="Speed" value={bg.speed} min={0} max={2} step={0.01} onChange={(speed) => onChange({ speed })} />
        </Section>
      )}

      {bg.kind !== 'transparent' && bg.kind !== 'image' && (
        <Section
          title="Colours"
          action={
            bg.kind !== 'solid' && bg.kind !== 'shader' && bg.colors.length < 3 ? (
              <button type="button" className="rounded p-1 text-white/40 hover:bg-white/10 hover:text-white" onClick={() => onChange({ colors: [...bg.colors, '#000000'] })} title="Add colour stop">
                <Plus className="size-3" />
              </button>
            ) : null
          }
        >
          {(bg.kind === 'solid' ? bg.colors.slice(0, 1) : bg.colors).map((c, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="flex-1">
                <ColorRow label={bg.kind === 'solid' ? 'Colour' : `Stop ${i + 1}`} value={c} onChange={(hex) => setColor(i, hex)} />
              </div>
              {bg.kind !== 'solid' && bg.kind !== 'shader' && bg.colors.length > 2 && (
                <button type="button" className="rounded p-1 text-white/40 hover:bg-white/10 hover:text-white" onClick={() => onChange({ colors: bg.colors.filter((_, j) => j !== i) })} title="Remove stop">
                  <X className="size-3" />
                </button>
              )}
            </div>
          ))}
          {bg.kind === 'linear' && <SliderRow label="Angle" value={bg.angle} min={0} max={360} step={1} onChange={(angle) => onChange({ angle })} format={(v) => `${v.toFixed(0)}°`} />}
          <SliderRow label="Grain" value={bg.noise} min={0} max={1} step={0.01} onChange={(noise) => onChange({ noise })} />
        </Section>
      )}

      {bg.kind === 'transparent' && (
        <p className="px-1 font-mono text-[10px] leading-relaxed text-white/45">The stage shows a checkerboard. Export as PNG or WebP with “Transparent” on to keep the alpha channel.</p>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) {
            const url = URL.createObjectURL(f)
            bgObjectUrls = [...bgObjectUrls.slice(-20), url]
            onChange({ kind: 'image', image: url })
          }
          e.target.value = ''
        }}
      />
    </div>
  )
}

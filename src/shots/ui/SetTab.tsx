import { cn } from '@/lib/utils'
import { Section } from '@/mockup/ui/controls'
import { ACCEPT } from '@/mockup/ui/useMediaLoader'
import { ChevronDown, ChevronUp, ImagePlus, Layers, PackageOpen, Plus, Trash2 } from 'lucide-react'
import { useRef } from 'react'
import { useShots } from '../store'
import { fileToMedia } from './useShotsMedia'

const field = 'w-full rounded-md bg-white/[0.05] px-2 py-1.5 text-[11px] text-white/90 outline-none placeholder:text-white/30 focus:ring-1 focus:ring-primary/60'

/** One design, many screens: per-screen media and copy, exported together as a ZIP. */
export function SetTab() {
  const set = useShots((s) => s.project.set)
  const text = useShots((s) => s.project.text)
  const main = useShots((s) => s.project.mockup.media[0])
  const exp = useShots((s) => s.project.export)
  const frame = useShots((s) => s.project.frame)
  const active = useShots((s) => s.activeSetId)
  const batching = useShots((s) => s.batching)
  const status = useShots((s) => s.status)
  const addSetItems = useShots((s) => s.addSetItems)
  const updateSetItem = useShots((s) => s.updateSetItem)
  const removeSetItem = useShots((s) => s.removeSetItem)
  const moveSetItem = useShots((s) => s.moveSetItem)
  const activate = useShots((s) => s.activateSetItem)
  const requestBatch = useShots((s) => s.requestBatch)
  const fileRef = useRef<HTMLInputElement>(null)
  const replaceRef = useRef<HTMLInputElement>(null)
  const replaceId = useRef<string | null>(null)

  const addFiles = async (files: FileList | null) => {
    if (!files) return
    const medias = (await Promise.all(Array.from(files).map(fileToMedia))).filter((m) => !!m)
    addSetItems(medias.map((media) => ({ media, eyebrow: text.eyebrow, headline: text.headline, subtitle: text.subtitle })))
  }

  return (
    <div className="space-y-5">
      <Section title="Screens set">
        <p className="px-1 text-[11px] leading-relaxed text-white/50">
          One design, many screens. Add your screenshots, write a headline for each, then export them all at once. This is ideal for App Store and Play Store listings, carousels and changelogs.
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          <button type="button" onClick={() => fileRef.current?.click()} className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-primary font-mono text-[10px] font-semibold uppercase tracking-wider text-white hover:bg-primary/90">
            <ImagePlus className="size-3.5" /> Add screenshots
          </button>
          <button
            type="button"
            disabled={!main?.url}
            onClick={() => addSetItems([{ media: main, eyebrow: text.eyebrow, headline: text.headline, subtitle: text.subtitle }])}
            className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-white/[0.06] font-mono text-[10px] uppercase tracking-wider text-white/75 hover:bg-white/10 disabled:opacity-40"
          >
            <Plus className="size-3.5" /> Current screen
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => {
            void addFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </Section>

      {set.length > 0 && (
        <Section title={`${set.length} screen${set.length > 1 ? 's' : ''}`}>
          <div className="space-y-2">
            {set.map((it, i) => (
              <div key={it.id} className={cn('rounded-xl border p-2', active === it.id ? 'border-primary/70 bg-primary/[0.06]' : 'border-white/[0.07] bg-white/[0.02]')}>
                <div className="flex gap-2">
                  <button
                    type="button"
                    title="Show this screen on the canvas"
                    onClick={() => activate(it.id)}
                    className="relative h-20 w-14 shrink-0 overflow-hidden rounded-md bg-black/50 ring-1 ring-white/10 hover:ring-primary"
                  >
                    {it.media?.url && it.media.kind === 'image' ? <img src={it.media.url} alt="" className="size-full object-cover" /> : <span className="font-mono text-[8px] text-white/50">{it.media ? 'Video' : 'Main'}</span>}
                    <span className="absolute left-0.5 top-0.5 rounded bg-black/70 px-1 font-mono text-[8px] text-white">{i + 1}</span>
                  </button>
                  <div className="min-w-0 flex-1 space-y-1">
                    <input className={field} placeholder="Eyebrow" value={it.eyebrow} onChange={(e) => updateSetItem(it.id, { eyebrow: e.target.value })} onFocus={() => active !== it.id && activate(it.id)} />
                    <textarea className={cn(field, 'min-h-[44px] resize-y font-semibold')} placeholder="Headline (*stars* highlight)" value={it.headline} onChange={(e) => updateSetItem(it.id, { headline: e.target.value })} onFocus={() => active !== it.id && activate(it.id)} />
                    <input className={field} placeholder="Subtitle" value={it.subtitle} onChange={(e) => updateSetItem(it.id, { subtitle: e.target.value })} onFocus={() => active !== it.id && activate(it.id)} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <button type="button" title="Move up" disabled={i === 0} onClick={() => moveSetItem(it.id, -1)} className="rounded p-1 text-white/45 hover:bg-white/10 hover:text-white disabled:opacity-25">
                      <ChevronUp className="size-3" />
                    </button>
                    <button type="button" title="Move down" disabled={i === set.length - 1} onClick={() => moveSetItem(it.id, 1)} className="rounded p-1 text-white/45 hover:bg-white/10 hover:text-white disabled:opacity-25">
                      <ChevronDown className="size-3" />
                    </button>
                    <button
                      type="button"
                      title="Replace screenshot"
                      onClick={() => {
                        replaceId.current = it.id
                        replaceRef.current?.click()
                      }}
                      className="rounded p-1 text-white/45 hover:bg-white/10 hover:text-white"
                    >
                      <Layers className="size-3" />
                    </button>
                    <button type="button" title="Remove" onClick={() => removeSetItem(it.id)} className="rounded p-1 text-white/45 hover:bg-white/10 hover:text-white">
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <input
            ref={replaceRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0]
              const id = replaceId.current
              e.target.value = ''
              if (!f || !id) return
              const media = await fileToMedia(f)
              if (media) updateSetItem(id, { media })
            }}
          />
          <button
            type="button"
            disabled={batching}
            onClick={requestBatch}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-white font-mono text-[10px] font-semibold uppercase tracking-wider text-black hover:bg-white/90 disabled:opacity-60"
          >
            <PackageOpen className="size-4" /> {batching ? status ?? 'Exporting…' : `Export all ${set.length} as ZIP`}
          </button>
          <p className="px-1 font-mono text-[9px] text-white/40">
            {exp.format.toUpperCase()} at exactly {frame.width}×{frame.height} each (the frame size, as stores require). Change the format from the Export menu.
          </p>
        </Section>
      )}
    </div>
  )
}

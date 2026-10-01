import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { cssBackground } from '@/mockup/ui/backgroundCss'
import { Film, Search, Type } from 'lucide-react'
import { useState } from 'react'
import { useShots } from '../store'
import { ALL_TEMPLATES, TEMPLATE_CATEGORIES } from '../templates'
import type { ShotsTemplate } from '../types'

function Preview({ t }: { t: ShotsTemplate }) {
  const [failed, setFailed] = useState(false)
  const bg = t.frame?.background
  const w = t.frame?.width ?? 1600
  const h = t.frame?.height ?? 1000
  return (
    <div className="relative overflow-hidden" style={{ aspectRatio: `${w} / ${h}`, background: bg ? cssBackground(bg.kind === 'shader' ? 'linear' : bg.kind, bg.colors, bg.angle) : '#222' }}>
      {!failed && <img src={`/shots-templates/${t.id}.jpg`} alt="" loading="lazy" onError={() => setFailed(true)} className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />}
      <div className="absolute left-2 top-2 flex gap-1">
        {t.animated && (
          <span className="flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider text-white backdrop-blur">
            <Film className="size-2.5" /> Animated
          </span>
        )}
        {t.text?.placement && t.text.placement !== 'none' && (
          <span className="flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider text-white backdrop-blur">
            <Type className="size-2.5" /> Text
          </span>
        )}
      </div>
    </div>
  )
}

type Filter = 'all' | 'text' | 'animated' | NonNullable<ShotsTemplate['category']>

export function Templates2D() {
  const open = useShots((s) => s.templatesOpen)
  const setOpen = useShots((s) => s.setTemplatesOpen)
  const apply = useShots((s) => s.applyTemplate)
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const list = ALL_TEMPLATES.filter((t) => {
    if (filter === 'animated' && !t.animated) return false
    if (filter === 'text' && !(t.text?.placement && t.text.placement !== 'none')) return false
    if (filter !== 'all' && filter !== 'animated' && filter !== 'text' && t.category !== filter) return false
    if (q && !`${t.name} ${t.tag} ${t.description} ${t.text?.headline ?? ''}`.toLowerCase().includes(q)) return false
    return true
  })
  const chips: { id: Filter; label: string }[] = [{ id: 'all', label: `All ${ALL_TEMPLATES.length}` }, { id: 'text', label: 'With text' }, { id: 'animated', label: 'Animated' }, ...TEMPLATE_CATEGORIES]
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[#111114] text-white sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="font-mono text-[12px] font-bold uppercase tracking-[0.14em]">2D templates</DialogTitle>
          <DialogDescription className="text-white/50">App Store screenshots, social posts, launch images and more. Your screenshot is kept; edit the copy in the Text tab.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap items-center gap-1">
          {chips.map((c) => (
            <button key={c.id} type="button" onClick={() => setFilter(c.id)} className={cn('h-8 rounded-full px-3 font-mono text-[10px] uppercase tracking-wider', filter === c.id ? 'bg-white text-black' : 'bg-white/[0.06] text-white/60 hover:text-white')}>
              {c.label}
            </button>
          ))}
          <label className="ml-auto flex h-8 items-center gap-2 rounded-full bg-white/[0.06] px-3">
            <Search className="size-3 text-white/40" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="w-36 bg-transparent text-[12px] text-white outline-none placeholder:text-white/30" />
          </label>
        </div>
        <div className="columns-2 gap-3 sm:columns-3 lg:columns-4">
          {list.map((t) => (
            <button key={t.id} type="button" onClick={() => apply(t)} className="group mb-3 flex w-full break-inside-avoid flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] text-left hover:border-primary/60">
              <Preview t={t} />
              <div className="space-y-0.5 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-mono text-[10px] font-bold uppercase tracking-[0.08em]">{t.name}</span>
                  <span className="shrink-0 font-mono text-[8px] uppercase tracking-wider text-white/40">{t.tag}</span>
                </div>
                <div className="text-[11px] leading-snug text-white/50">{t.description}</div>
              </div>
            </button>
          ))}
          {!list.length && <p className="py-10 text-center text-[12px] text-white/40">No templates match.</p>}
        </div>
      </DialogContent>
    </Dialog>
  )
}

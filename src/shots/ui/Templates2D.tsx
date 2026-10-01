import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { cssBackground } from '@/mockup/ui/backgroundCss'
import { Film, ImageIcon, LayoutGrid } from 'lucide-react'
import { useState } from 'react'
import { SHOTS_TEMPLATES } from '../presets'
import { useShots } from '../store'
import type { ShotsTemplate } from '../types'

function Preview({ t }: { t: ShotsTemplate }) {
  const [failed, setFailed] = useState(false)
  const bg = t.frame?.background
  return (
    <div className="relative aspect-[16/10] overflow-hidden" style={{ background: bg ? cssBackground(bg.kind === 'shader' ? 'linear' : bg.kind, bg.colors, bg.angle) : '#222' }}>
      {!failed && <img src={`/shots-templates/${t.id}.jpg`} alt="" loading="lazy" onError={() => setFailed(true)} className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />}
      {t.animated && (
        <span className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider text-white backdrop-blur">
          <Film className="size-2.5" /> {t.steps?.length} steps
        </span>
      )}
    </div>
  )
}

export function Templates2D() {
  const open = useShots((s) => s.templatesOpen)
  const setOpen = useShots((s) => s.setTemplatesOpen)
  const apply = useShots((s) => s.applyTemplate)
  const [filter, setFilter] = useState<'all' | 'image' | 'animated'>('all')
  const list = SHOTS_TEMPLATES.filter((t) => filter === 'all' || (filter === 'animated' ? t.animated : !t.animated))
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[88vh] overflow-y-auto border-white/10 bg-[#111114] text-white sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-mono text-[12px] font-bold uppercase tracking-[0.14em]">2D templates</DialogTitle>
          <DialogDescription className="text-white/50">Looks and animated layouts. Your screenshot and frame size are kept.</DialogDescription>
        </DialogHeader>
        <div className="flex gap-1">
          {(
            [
              ['all', 'All', LayoutGrid],
              ['image', 'Image', ImageIcon],
              ['animated', 'Animated', Film],
            ] as const
          ).map(([id, label, Icon]) => (
            <button key={id} type="button" onClick={() => setFilter(id)} className={cn('flex h-8 items-center gap-1.5 rounded-full px-3 font-mono text-[10px] uppercase tracking-wider', filter === id ? 'bg-white text-black' : 'bg-white/[0.06] text-white/60 hover:text-white')}>
              <Icon className="size-3" /> {label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {list.map((t) => (
            <button key={t.id} type="button" onClick={() => apply(t)} className="group flex flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] text-left hover:border-primary/60">
              <Preview t={t} />
              <div className="space-y-0.5 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.1em]">{t.name}</span>
                  <span className="font-mono text-[8px] uppercase tracking-wider text-white/40">{t.tag}</span>
                </div>
                <div className="text-[11px] leading-snug text-white/50">{t.description}</div>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

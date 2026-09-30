import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { Film, ImageIcon, LayoutGrid } from 'lucide-react'
import { useState } from 'react'
import { TEMPLATES } from '../presets'
import { useEditor } from '../store'
import type { Template } from '../types'
import { DEVICE_ICONS } from './deviceIcons'

type Filter = 'all' | 'image' | 'animated'

function Preview({ t }: { t: Template }) {
  const [failed, setFailed] = useState(false)
  const Icon = DEVICE_ICONS[t.preview.deviceKind]
  return (
    <div className="relative aspect-[16/10] overflow-hidden" style={{ background: t.preview.background }}>
      {!failed ? (
        <img src={`/templates/${t.id}.jpg`} alt="" loading="lazy" onError={() => setFailed(true)} className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
      ) : (
        <div className="flex size-full items-center justify-center">
          <div className="flex size-14 items-center justify-center rounded-xl bg-black/40 text-white ring-1 ring-white/20 backdrop-blur-sm">
            <Icon className="size-7" />
          </div>
        </div>
      )}
      {t.animated && (
        <span className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider text-white backdrop-blur">
          <Film className="size-2.5" /> {t.clips?.length} clips
        </span>
      )}
    </div>
  )
}

export function TemplatesDialog() {
  const open = useEditor((s) => s.templatesOpen)
  const setOpen = useEditor((s) => s.setTemplatesOpen)
  const applyTemplate = useEditor((s) => s.applyTemplate)
  const [filter, setFilter] = useState<Filter>('all')
  const list = TEMPLATES.filter((t) => filter === 'all' || (filter === 'animated' ? t.animated : !t.animated))
  const tabs: { id: Filter; label: string; icon: typeof LayoutGrid }[] = [
    { id: 'all', label: 'All', icon: LayoutGrid },
    { id: 'image', label: 'Still', icon: ImageIcon },
    { id: 'animated', label: 'Animated', icon: Film },
  ]
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[88vh] overflow-y-auto border-white/10 bg-[#111114] text-white sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-mono text-[12px] font-bold uppercase tracking-[0.14em]">Templates</DialogTitle>
          <DialogDescription className="text-white/50">Start from a look or a full animated timeline. Your screenshot is carried into every shot.</DialogDescription>
        </DialogHeader>
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={cn(
                'flex h-8 items-center gap-1.5 rounded-full px-3 font-mono text-[10px] uppercase tracking-wider',
                filter === tab.id ? 'bg-white text-black' : 'bg-white/[0.06] text-white/60 hover:text-white'
              )}
            >
              <tab.icon className="size-3" /> {tab.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {list.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => applyTemplate(t)}
              className="group flex flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] text-left transition-colors hover:border-primary/60"
            >
              <Preview t={t} />
              <div className="space-y-0.5 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.1em]">{t.name}</span>
                  <span className="truncate font-mono text-[8px] uppercase tracking-wider text-white/40">{t.tag}</span>
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

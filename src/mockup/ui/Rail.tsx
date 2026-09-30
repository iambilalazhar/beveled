import { cn } from '@/lib/utils'
import { Sparkles, Type, X } from 'lucide-react'
import { selectedClip, useEditor } from '../store'
import { PANELS } from './panels'
import { ClipPanel } from './panels/ClipPanel'


export function Rail() {
  const panel = useEditor((s) => s.panel)
  const setPanel = useEditor((s) => s.setPanel)
  const kind = useEditor((s) => selectedClip(s).kind)
  const ClipIcon = kind === 'logo' ? Sparkles : Type
  return (
    <nav className="flex w-[60px] shrink-0 flex-col items-center gap-1 border-r border-white/[0.06] bg-[#0d0d0f] py-2" aria-label="Editor panels">
      {kind !== 'shot' && (
        <button
          type="button"
          onClick={() => setPanel(panel === 'clip' ? null : 'clip')}
          title={kind === 'logo' ? 'Logo clip' : 'Text clip'}
          aria-pressed={panel === 'clip'}
          className={cn(
            'mb-1 flex w-[52px] flex-col items-center gap-1 rounded-lg py-2 font-mono text-[8px] uppercase tracking-wider transition-colors',
            panel === 'clip' ? 'bg-[#7c5cf5]/20 text-[#b7a6ff]' : 'text-white/50 hover:bg-white/[0.06] hover:text-white/90'
          )}
        >
          <ClipIcon className="size-4" />
          <span>{kind}</span>
        </button>
      )}
      {PANELS.map((p) => {
        const active = panel === p.id
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => setPanel(active ? null : p.id)}
            title={p.label}
            aria-pressed={active}
            className={cn(
              'flex w-[52px] flex-col items-center gap-1 rounded-lg py-2 font-mono text-[8px] uppercase tracking-wider transition-colors',
              active ? 'bg-primary/15 text-primary' : 'text-white/50 hover:bg-white/[0.06] hover:text-white/90'
            )}
          >
            <p.icon className="size-4" />
            <span>{p.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export function PanelHost() {
  const panel = useEditor((s) => s.panel)
  const setPanel = useEditor((s) => s.setPanel)
  const clip = useEditor((s) => selectedClip(s))
  const entry = panel === 'clip' ? { label: clip.kind === 'logo' ? `Logo · ${clip.name}` : `Text · ${clip.name}`, component: ClipPanel } : PANELS.find((p) => p.id === panel)
  if (!entry) return null
  const Component = entry.component
  return (
    <aside className="flex w-[300px] shrink-0 flex-col border-r border-white/[0.06] bg-[#111114]">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-white/[0.06] px-4">
        <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-white/85">{entry.label}</h2>
        <button type="button" onClick={() => setPanel(null)} className="rounded p-1 text-white/40 hover:bg-white/10 hover:text-white" title="Close panel (Esc)">
          <X className="size-3.5" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 [scrollbar-color:rgba(255,255,255,0.15)_transparent] [scrollbar-width:thin]">
        <Component />
      </div>
    </aside>
  )
}

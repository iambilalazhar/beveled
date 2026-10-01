import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Check, ChevronDown, Download, Film, ImageIcon, LayoutTemplate, Redo2, Settings2, Undo2 } from 'lucide-react'
import { useState } from 'react'
import { ASPECTS, FRAME_PRESETS } from '../presets'
import { useEditor, useScene } from '../store'
import { totalDuration } from '../timeline/evaluate'
import { EditorMenu } from './EditorMenu'

function IconButton({ onClick, disabled, title, children, className }: { onClick?: () => void; disabled?: boolean; title: string; children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={cn('flex size-8 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent', className)}
    >
      {children}
    </button>
  )
}

const mono = 'font-mono text-[10px] uppercase tracking-[0.1em]'

function FrameMenu() {
  const frame = useScene('frame')
  const update = useEditor((s) => s.update)
  const [open, setOpen] = useState(false)
  const preset = frame.aspect === 'custom' ? FRAME_PRESETS.find((p) => p.width === frame.customWidth && p.height === frame.customHeight) : undefined
  const label = frame.aspect === 'custom' ? (preset ? `${preset.group} ${preset.label}` : `${frame.customWidth}×${frame.customHeight}`) : ASPECTS.find((a) => a.id === frame.aspect)?.label
  const groups = [...new Set(FRAME_PRESETS.map((p) => p.group))]
  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button type="button" className={cn(mono, 'flex h-8 items-center gap-2 rounded-md bg-white/[0.06] px-3 font-semibold text-white/85 hover:bg-white/10')}>
            <span className="text-white/45">Frame</span>
            {label}
            <ChevronDown className="size-3 opacity-60" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="center" className="max-h-[70vh] w-72 overflow-y-auto border-white/10 bg-[#161618] p-2 text-white">
          <div className="grid grid-cols-3 gap-1">
            {ASPECTS.filter((a) => a.id !== 'custom').map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  update('frame', { aspect: a.id })
                  setOpen(false)
                }}
                className={cn(mono, 'flex h-8 items-center justify-center gap-1 rounded-md', frame.aspect === a.id ? 'bg-white/[0.14] text-white' : 'text-white/60 hover:bg-white/[0.06]')}
              >
                {a.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => update('frame', { aspect: 'custom' })}
            className={cn(mono, 'mt-1 flex h-8 w-full items-center justify-center rounded-md', frame.aspect === 'custom' && !preset ? 'bg-white/[0.14] text-white' : 'text-white/60 hover:bg-white/[0.06]')}
          >
            Custom size
          </button>
          {groups.map((g) => (
            <div key={g} className="mt-2">
              <div className={cn(mono, 'px-2 py-1 text-[9px] text-white/35')}>{g}</div>
              {FRAME_PRESETS.filter((p) => p.group === g).map((p) => {
                const active = preset === p
                return (
                  <button
                    key={p.group + p.label}
                    type="button"
                    onClick={() => {
                      update('frame', { aspect: 'custom', customWidth: p.width, customHeight: p.height })
                      setOpen(false)
                    }}
                    className={cn('flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left hover:bg-white/[0.06]', active && 'bg-white/[0.08]')}
                  >
                    <span className="text-[12px] text-white/85">{p.label}</span>
                    <span className="flex items-center gap-1.5 font-mono text-[10px] text-white/40">
                      {p.width} × {p.height}
                      {active && <Check className="size-3 text-primary" />}
                    </span>
                  </button>
                )
              })}
            </div>
          ))}
        </PopoverContent>
      </Popover>
      {frame.aspect === 'custom' && (
        <div className="flex h-8 items-center gap-1 rounded-md bg-white/[0.06] px-2 font-mono text-[10px] text-white/80">
          <input
            className="w-12 bg-transparent text-right outline-none focus:text-primary"
            type="number"
            min={64}
            max={8192}
            value={frame.customWidth}
            onChange={(e) => update('frame', { customWidth: Math.max(64, Math.min(8192, Number(e.target.value) || 64)) })}
          />
          <span className="text-white/40">×</span>
          <input
            className="w-12 bg-transparent outline-none focus:text-primary"
            type="number"
            min={64}
            max={8192}
            value={frame.customHeight}
            onChange={(e) => update('frame', { customHeight: Math.max(64, Math.min(8192, Number(e.target.value) || 64)) })}
          />
        </div>
      )}
    </div>
  )
}

function ExportMenu() {
  const exp = useScene('export')
  const requestExport = useEditor((s) => s.requestExport)
  const requestVideo = useEditor((s) => s.requestVideo)
  const setPanel = useEditor((s) => s.setPanel)
  const busy = useEditor((s) => s.exporting || s.recording)
  const progress = useEditor((s) => s.recordingProgress)
  const recording = useEditor((s) => s.recording)
  const total = useEditor((s) => totalDuration(s.project.clips))
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={busy}
          className={cn(mono, 'flex h-8 items-center gap-1.5 rounded-full bg-primary px-4 font-semibold text-white shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90 disabled:opacity-60')}
        >
          <Download className="size-3.5" /> {recording ? `Rendering ${Math.round(progress * 100)}%` : busy ? 'Rendering…' : 'Export'} <ChevronDown className="size-3 opacity-70" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 border-white/10 bg-[#161618] p-2 text-white">
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            requestExport()
          }}
          className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left hover:bg-white/[0.06]"
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-white/[0.06]">
            <ImageIcon className="size-4" />
          </span>
          <span className="flex-1">
            <span className={cn(mono, 'block font-semibold')}>Image</span>
            <span className="block text-[11px] text-white/45">
              {exp.format.toUpperCase()} at {exp.scale}× · current frame · ⌘E
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            requestVideo('timeline')
          }}
          className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left hover:bg-white/[0.06]"
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <Film className="size-4" />
          </span>
          <span className="flex-1">
            <span className={cn(mono, 'block font-semibold')}>Video</span>
            <span className="block text-[11px] text-white/45">
              {exp.videoFormat.toUpperCase()} {exp.videoHeight}p · {exp.fps} fps · {total.toFixed(1)}s timeline
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            setPanel('export')
          }}
          className={cn(mono, 'mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-white/50 hover:bg-white/[0.06] hover:text-white')}
        >
          <Settings2 className="size-3" /> Export settings
        </button>
      </PopoverContent>
    </Popover>
  )
}

export function TopBar() {
  const canUndo = useEditor((s) => s.past.length > 0)
  const canRedo = useEditor((s) => s.future.length > 0)
  const undo = useEditor((s) => s.undo)
  const redo = useEditor((s) => s.redo)
  const setTemplatesOpen = useEditor((s) => s.setTemplatesOpen)
  const status = useEditor((s) => s.status)

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-white/[0.06] bg-[#0d0d0f] px-3">
      <EditorMenu />
      <a href="/" className="flex items-center gap-2 pr-2" title="Beveled home">
        <img src="/beveled_icon.png" alt="" width={20} height={20} />
        <span className="logo-wordmark text-[15px] lowercase">beveled</span>
        <span className="rounded bg-primary/15 px-1.5 py-px font-mono text-[9px] font-semibold uppercase tracking-wider text-primary">3D</span>
      </a>
      <div className="mx-1 h-5 w-px bg-white/10" />
      <IconButton onClick={undo} disabled={!canUndo} title="Undo (⌘Z)">
        <Undo2 className="size-4" />
      </IconButton>
      <IconButton onClick={redo} disabled={!canRedo} title="Redo (⇧⌘Z)">
        <Redo2 className="size-4" />
      </IconButton>
      <button
        type="button"
        onClick={() => setTemplatesOpen(true)}
        className={cn(mono, 'ml-1 flex h-8 items-center gap-1.5 rounded-md px-2.5 font-semibold text-white/75 transition-colors hover:bg-white/10 hover:text-white')}
      >
        <LayoutTemplate className="size-3.5" /> Templates
      </button>

      <div className="flex flex-1 items-center justify-center">
        <FrameMenu />
      </div>

      {status && <span className="hidden max-w-[260px] truncate font-mono text-[10px] uppercase tracking-wider text-white/50 md:block">{status}</span>}
      <a href="/classic" className="hidden font-mono text-[9px] uppercase tracking-wider text-white/35 hover:text-white/70 lg:block" title="Open the classic 2D editor">
        Classic editor
      </a>
      <ExportMenu />
    </header>
  )
}

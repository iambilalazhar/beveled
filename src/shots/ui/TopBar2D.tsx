import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { FRAME_PRESETS } from '@/mockup/presets'
import { ModeSwitch } from '@/studio/ModeSwitch'
import { ChevronDown, Download, Film, ImageIcon, LayoutTemplate, Redo2, RotateCcw, Undo2 } from 'lucide-react'
import { useState } from 'react'
import { FRAME_RATIOS } from '../presets'
import { useShots } from '../store'
import { totalDuration } from '../timeline'

const mono = 'font-mono text-[10px] uppercase tracking-[0.1em]'

function IconButton({ onClick, disabled, title, children }: { onClick: () => void; disabled?: boolean; title: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title} aria-label={title} className="flex size-8 items-center justify-center rounded-md text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-30">
      {children}
    </button>
  )
}

function FrameSizeMenu() {
  const frame = useShots((s) => s.project.frame)
  const setFrame = useShots((s) => s.setFrame)
  const [open, setOpen] = useState(false)
  const ratio = FRAME_RATIOS.find((r) => r.w * frame.height === r.h * frame.width)
  const preset = FRAME_PRESETS.find((p) => p.width === frame.width && p.height === frame.height)
  const groups = [...new Set(FRAME_PRESETS.map((p) => p.group))]
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={cn(mono, 'flex h-8 items-center gap-2 rounded-md bg-white/[0.06] px-3 font-semibold text-white/85 hover:bg-white/10')}>
          <span className="text-white/45">Frame</span>
          {preset ? `${preset.group} ${preset.label}` : ratio ? ratio.label : 'Custom'} · {frame.width}×{frame.height}
          <ChevronDown className="size-3 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="center" className="max-h-[70vh] w-72 overflow-y-auto border-white/10 bg-[#161618] p-2 text-white">
        <div className="grid grid-cols-3 gap-1">
          {FRAME_RATIOS.map((r) => (
            <button
              key={r.label}
              type="button"
              onClick={() => {
                setFrame({ width: r.w, height: r.h })
                setOpen(false)
              }}
              className={cn(mono, 'h-8 rounded-md', ratio === r ? 'bg-white/[0.14] text-white' : 'text-white/60 hover:bg-white/[0.06]')}
            >
              {r.label}
            </button>
          ))}
        </div>
        {groups.map((g) => (
          <div key={g} className="mt-2">
            <div className={cn(mono, 'px-2 py-1 text-[9px] text-white/35')}>{g}</div>
            {FRAME_PRESETS.filter((p) => p.group === g).map((p) => (
              <button
                key={p.group + p.label}
                type="button"
                onClick={() => {
                  setFrame({ width: p.width, height: p.height })
                  setOpen(false)
                }}
                className={cn('flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left hover:bg-white/[0.06]', preset === p && 'bg-white/[0.08]')}
              >
                <span className="text-[12px] text-white/85">{p.label}</span>
                <span className="font-mono text-[10px] text-white/40">
                  {p.width} × {p.height}
                </span>
              </button>
            ))}
          </div>
        ))}
      </PopoverContent>
    </Popover>
  )
}

function ExportMenu2D() {
  const exp = useShots((s) => s.project.export)
  const frame = useShots((s) => s.project.frame)
  const steps = useShots((s) => s.project.steps.length)
  const total = useShots((s) => totalDuration(s.project))
  const setExport = useShots((s) => s.setExport)
  const requestExport = useShots((s) => s.requestExport)
  const requestVideo = useShots((s) => s.requestVideo)
  const cancelVideo = useShots((s) => s.cancelVideo)
  const busy = useShots((s) => s.exporting || s.recording)
  const recording = useShots((s) => s.recording)
  const progress = useShots((s) => s.recordingProgress)
  const [open, setOpen] = useState(false)
  const seg = (active: boolean) => cn(mono, 'h-7 flex-1 rounded-md', active ? 'bg-white/[0.14] text-white' : 'text-white/55 hover:bg-white/[0.06]')
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={cn(mono, 'flex h-8 items-center gap-1.5 rounded-full bg-primary px-4 font-semibold text-white shadow-lg shadow-primary/25 hover:bg-primary/90')}>
          <Download className="size-3.5" /> {recording ? `Rendering ${Math.round(progress * 100)}%` : busy ? 'Rendering…' : 'Export'}
          <span className="text-white/70 normal-case">
            {exp.scale}x · {exp.format.toUpperCase()}
          </span>
          <ChevronDown className="size-3 opacity-70" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-3 border-white/10 bg-[#161618] p-3 text-white">
        <div className="space-y-1.5">
          <div className={cn(mono, 'flex items-center gap-1.5 text-white/50')}>
            <ImageIcon className="size-3" /> Image
          </div>
          <div className="flex gap-1 rounded-lg bg-white/[0.04] p-0.5">
            {(['png', 'jpeg', 'webp'] as const).map((f) => (
              <button key={f} type="button" className={seg(exp.format === f)} onClick={() => setExport({ format: f })}>
                {f === 'jpeg' ? 'JPG' : f}
              </button>
            ))}
          </div>
          <div className="flex gap-1 rounded-lg bg-white/[0.04] p-0.5">
            {[1, 2, 3, 4].map((k) => (
              <button key={k} type="button" className={seg(exp.scale === k)} onClick={() => setExport({ scale: k })}>
                {k}x
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setOpen(false)
              requestExport()
            }}
            className={cn(mono, 'flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-white font-semibold text-black hover:bg-white/90 disabled:opacity-50')}
          >
            Export {frame.width * exp.scale} × {frame.height * exp.scale} · ⌘E
          </button>
        </div>
        <div className="space-y-1.5 border-t border-white/10 pt-3">
          <div className={cn(mono, 'flex items-center gap-1.5 text-white/50')}>
            <Film className="size-3" /> Video · {steps ? `${steps} animation step${steps > 1 ? 's' : ''}` : 'still'} · {total.toFixed(1)}s
          </div>
          <div className="flex gap-1 rounded-lg bg-white/[0.04] p-0.5">
            {(['mp4', 'webm'] as const).map((f) => (
              <button key={f} type="button" className={seg(exp.videoFormat === f)} onClick={() => setExport({ videoFormat: f })}>
                {f}
              </button>
            ))}
            {[30, 60].map((f) => (
              <button key={f} type="button" className={seg(exp.fps === f)} onClick={() => setExport({ fps: f })}>
                {f} fps
              </button>
            ))}
          </div>
          {recording ? (
            <button type="button" onClick={cancelVideo} className={cn(mono, 'h-9 w-full rounded-lg bg-white/10 hover:bg-white/15')}>
              Cancel · {Math.round(progress * 100)}%
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setOpen(false)
                requestVideo()
              }}
              className={cn(mono, 'flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-primary font-semibold text-white hover:bg-primary/90 disabled:opacity-50')}
            >
              Export video
            </button>
          )}
          {!steps && <p className="text-[11px] text-white/45">No animation yet: add steps on the timeline, or export a {exp.stillDuration}s still clip (useful for video screens and animated backgrounds).</p>}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function TopBar2D() {
  const canUndo = useShots((s) => s.past.length > 0)
  const canRedo = useShots((s) => s.future.length > 0)
  const undo = useShots((s) => s.undo)
  const redo = useShots((s) => s.redo)
  const setTemplatesOpen = useShots((s) => s.setTemplatesOpen)
  const newProject = useShots((s) => s.newProject)
  const status = useShots((s) => s.status)
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-white/[0.06] bg-[#0d0d0f] px-3">
      <a href="/" className="flex items-center gap-2 pr-1" title="Beveled home">
        <img src="/beveled_icon.png" alt="" width={20} height={20} />
        <span className="logo-wordmark text-[15px] lowercase">beveled</span>
      </a>
      <ModeSwitch />
      <div className="mx-1 h-5 w-px bg-white/10" />
      <IconButton onClick={undo} disabled={!canUndo} title="Undo (⌘Z)">
        <Undo2 className="size-4" />
      </IconButton>
      <IconButton onClick={redo} disabled={!canRedo} title="Redo (⇧⌘Z)">
        <Redo2 className="size-4" />
      </IconButton>
      <button type="button" onClick={() => setTemplatesOpen(true)} className={cn(mono, 'ml-1 flex h-8 items-center gap-1.5 rounded-md px-2.5 font-semibold text-white/75 hover:bg-white/10 hover:text-white')}>
        <LayoutTemplate className="size-3.5" /> Templates
      </button>
      <button type="button" onClick={newProject} className={cn(mono, 'flex h-8 items-center gap-1.5 rounded-md px-2.5 text-white/55 hover:bg-white/10 hover:text-white')} title="Start over (keeps your screenshot)">
        <RotateCcw className="size-3.5" /> Start over
      </button>
      <div className="flex flex-1 items-center justify-center">
        <FrameSizeMenu />
      </div>
      {status && <span className="hidden max-w-[260px] truncate font-mono text-[10px] uppercase tracking-wider text-white/50 md:block">{status}</span>}
      <ExportMenu2D />
    </header>
  )
}

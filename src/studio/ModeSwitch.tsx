import { cn } from '@/lib/utils'
import { Box, Square } from 'lucide-react'
import { useStudioMode } from './mode'

/** 2D | 3D switch shown in both editors' top bars. */
export function ModeSwitch() {
  const mode = useStudioMode((s) => s.mode)
  const setMode = useStudioMode((s) => s.setMode)
  const item = (id: '2d' | '3d', label: string, Icon: typeof Box, title: string) => (
    <button
      type="button"
      title={title}
      aria-pressed={mode === id}
      onClick={() => setMode(id)}
      className={cn(
        'flex h-7 items-center gap-1.5 rounded-md px-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] transition-colors',
        mode === id ? 'bg-primary text-white shadow shadow-primary/30' : 'text-white/55 hover:text-white'
      )}
    >
      <Icon className="size-3" /> {label}
    </button>
  )
  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-white/[0.06] p-0.5">
      {item('2d', '2D', Square, '2-D screenshots and flat mockups (shots.so style)')}
      {item('3d', '3D', Box, '3-D device mockups and video (UltraMock style)')}
    </div>
  )
}

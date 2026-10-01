import { cn } from '@/lib/utils'
import { useEffect } from 'react'
import { useShots } from '../store'
import { FrameTab } from './FrameTab'
import { LayoutPanel } from './LayoutPanel'
import { MockupTab } from './MockupTab'
import { Stage2D } from './Stage2D'
import { Templates2D } from './Templates2D'
import { Timeline2D } from './Timeline2D'
import { TextTab } from './TextTab'
import { TopBar2D } from './TopBar2D'
import { useShotsMediaSources } from './useShotsMedia'

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)
}

function useKeyboard() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useShots.getState()
      const mod = e.metaKey || e.ctrlKey
      if (e.key === 'Escape' && s.templatesOpen) return s.setTemplatesOpen(false)
      if (isTyping(e.target)) return
      if (mod && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault()
        if (e.shiftKey) s.redo()
        else s.undo()
      } else if (mod && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault()
        s.requestExport()
      } else if (e.key === ' ' && !mod) {
        e.preventDefault()
        s.togglePlay()
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && s.selected !== 'base') {
        e.preventDefault()
        s.removeStep(s.selected)
      } else if (e.key === 'Home') {
        s.seek(0)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

function useDarkTheme() {
  useEffect(() => {
    const root = document.documentElement
    const had = root.classList.contains('dark')
    root.classList.add('dark')
    root.style.colorScheme = 'dark'
    return () => {
      if (!had) root.classList.remove('dark')
      root.style.colorScheme = ''
    }
  }, [])
}

/** shots.so-style 2-D studio: flat mockups, frames, backgrounds, layouts and layout animation. */
export function ShotsEditor({ initialMedia = null, loadInitial = true }: { initialMedia?: Blob | string | null; loadInitial?: boolean }) {
  useDarkTheme()
  useKeyboard()
  useShotsMediaSources(initialMedia, loadInitial)
  useEffect(() => {
    if (import.meta.env.DEV) (window as unknown as { __shotsStore?: unknown }).__shotsStore = useShots
  }, [])
  const tab = useShots((s) => s.tab)
  const setTab = useShots((s) => s.setTab)
  return (
    <div className="dark fixed inset-0 flex flex-col overflow-hidden bg-[#0a0a0a] text-white antialiased" style={{ colorScheme: 'dark' }}>
      <TopBar2D />
      <div className="flex min-h-0 flex-1">
        <aside className="flex w-[300px] shrink-0 flex-col border-r border-white/[0.06] bg-[#111114]">
          <div className="grid shrink-0 grid-cols-3 gap-0.5 p-2">
            {(['mockup', 'text', 'frame'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn('h-8 rounded-lg font-mono text-[10px] font-semibold uppercase tracking-[0.12em]', tab === t ? 'bg-white/[0.12] text-white' : 'text-white/45 hover:text-white')}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-6 pt-2 [scrollbar-color:rgba(255,255,255,0.15)_transparent] [scrollbar-width:thin]">{tab === 'mockup' ? <MockupTab /> : tab === 'text' ? <TextTab /> : <FrameTab />}</div>
        </aside>
        <main className="flex min-w-0 flex-1 flex-col">
          <Stage2D />
          <Timeline2D />
        </main>
        <LayoutPanel />
      </div>
      <Templates2D />
    </div>
  )
}

export default ShotsEditor

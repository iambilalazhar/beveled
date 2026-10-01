import { useEffect } from 'react'
import { useEditor } from '../store'
import { PanelHost, Rail } from './Rail'
import { Stage } from './Stage'
import { AutoMotionDialog } from './AutoMotionDialog'
import { ShortcutsDialog } from './EditorMenu'
import { pickProjectFile, saveProjectFile } from './projectFile'
import { TemplatesDialog } from './TemplatesDialog'
import { AudioPreview, Timeline } from './timeline/Timeline'
import { TopBar } from './TopBar'
import { useInitialMedia, useMediaLoader, usePasteMedia } from './useMediaLoader'

export type MockupEditorProps = {
  /** Media to load on mount (web app upload). Ignored inside the extension, which reads the latest capture instead. */
  initialMedia?: Blob | string | null
}

function isTypingTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
}

/** Forces the dark theme on <html> while the editor is mounted so portals (selects, dialogs) match. */
function useForcedDarkTheme() {
  useEffect(() => {
    const root = document.documentElement
    const hadDark = root.classList.contains('dark')
    const hadLight = root.classList.contains('light')
    root.classList.add('dark')
    root.classList.remove('light')
    root.style.colorScheme = 'dark'
    return () => {
      if (!hadDark) root.classList.remove('dark')
      if (hadLight) root.classList.add('light')
      root.style.colorScheme = ''
    }
  }, [])
}

function useEditorKeyboard() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      const s = useEditor.getState()
      if (e.key === 'Escape') {
        if (s.templatesOpen) s.setTemplatesOpen(false)
        else if (s.panel) s.setPanel(null)
        return
      }
      if (isTypingTarget(e.target)) return
      if (mod && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault()
        if (e.shiftKey) s.redo()
        else s.undo()
      } else if (mod && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault()
        s.redo()
      } else if (mod && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault()
        s.requestExport()
      } else if (mod && (e.key === 's' || e.key === 'S')) {
        e.preventDefault()
        void saveProjectFile()
      } else if (mod && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault()
        pickProjectFile()
      } else if (!mod && (e.key === 't' || e.key === 'T')) {
        s.setTimelineOpen(!s.timelineOpen)
      } else if (!mod && e.key === '?') {
        s.setShortcutsOpen(true)
      } else if (e.key === ' ' && !mod) {
        e.preventDefault()
        s.togglePlay()
      } else if (e.key === 'Home') {
        e.preventDefault()
        s.seek(0)
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && s.selectedKeyframe) {
        e.preventDefault()
        s.removeKeyframe(s.selectedKeyframe)
      } else if (e.key === ',' || e.key === '.') {
        e.preventDefault()
        s.seek(s.time + (e.key === '.' ? 1 : -1) / s.project.export.fps)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

export function MockupEditor({ initialMedia = null }: MockupEditorProps) {
  useForcedDarkTheme()
  useEffect(() => {
    // Dev-only hook so scripted visual checks can drive the store.
    if (import.meta.env.DEV) (window as unknown as { __beveledStore?: unknown }).__beveledStore = useEditor
  }, [])
  useEditorKeyboard()
  const { loadUrl, loadBlob, loadFiles } = useMediaLoader()
  usePasteMedia(loadFiles)
  useInitialMedia(initialMedia, loadUrl, loadBlob)

  return (
    <div className="dark fixed inset-0 flex flex-col overflow-hidden bg-[#0a0a0a] text-white antialiased" style={{ colorScheme: 'dark' }}>
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <Rail />
        <PanelHost />
        <main className="flex min-w-0 flex-1 flex-col">
          <Stage />
          <Timeline />
        </main>
      </div>
      <TemplatesDialog />
      <AutoMotionDialog />
      <ShortcutsDialog />
      <AudioPreview />
    </div>
  )
}

export default MockupEditor

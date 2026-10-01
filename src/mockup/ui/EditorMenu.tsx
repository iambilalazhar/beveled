import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { FilePlus2, FolderOpen, Keyboard, LayoutPanelTop, Menu, Redo2, Save, SquareStack, Undo2 } from 'lucide-react'
import { useRef } from 'react'
import { useEditor } from '../store'
import { openProjectFile, PROJECT_ACCEPT, saveProjectFile } from './projectFile'
import { useShallow } from 'zustand/react/shallow'

const SHORTCUTS: [string, string][] = [
  ['Space', 'Play / pause'],
  ['Home', 'Back to start'],
  [', and .', 'Step one frame'],
  ['T', 'Show / hide the timeline'],
  ['⌘Z / ⇧⌘Z', 'Undo / redo'],
  ['⌘E', 'Export image'],
  ['⌘S', 'Save project file'],
  ['⌘O', 'Open project file'],
  ['Delete', 'Remove the selected keyframe'],
  ['Drag', 'Orbit the camera'],
  ['Shift + drag', 'Pan'],
  ['Scroll', 'Zoom'],
  ['⌘V', 'Paste a screenshot'],
  ['?', 'This list'],
  ['Esc', 'Close panels and dialogs'],
]

export function ShortcutsDialog() {
  const open = useEditor((s) => s.shortcutsOpen)
  const setOpen = useEditor((s) => s.setShortcutsOpen)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="border-white/10 bg-[#111114] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-[12px] font-bold uppercase tracking-[0.14em]">Keyboard shortcuts</DialogTitle>
          <DialogDescription className="text-white/50">Use ⌘ on macOS and Ctrl elsewhere.</DialogDescription>
        </DialogHeader>
        <div className="divide-y divide-white/[0.06]">
          {SHORTCUTS.map(([keys, label]) => (
            <div key={keys} className="flex items-center justify-between py-2">
              <span className="text-[12px] text-white/75">{label}</span>
              <kbd className="rounded-md bg-white/[0.08] px-2 py-0.5 font-mono text-[10px] text-white/85">{keys}</kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function EditorMenu() {
  const s = useEditor(
    useShallow((st) => ({
      canUndo: st.past.length > 0,
      canRedo: st.future.length > 0,
      timelineOpen: st.timelineOpen,
      newProject: st.newProject,
      undo: st.undo,
      redo: st.redo,
      setTimelineOpen: st.setTimelineOpen,
      setTemplatesOpen: st.setTemplatesOpen,
      setShortcutsOpen: st.setShortcutsOpen,
    }))
  )
  const fileRef = useRef<HTMLInputElement>(null)
  const item = 'gap-2 font-mono text-[10px] uppercase tracking-[0.08em]'
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" title="Menu" aria-label="Menu" className="flex size-8 items-center justify-center rounded-md text-white/70 hover:bg-white/10 hover:text-white">
            <Menu className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-60 border-white/10 bg-[#161618] text-white">
          <DropdownMenuItem className={item} onSelect={() => s.newProject()}>
            <FilePlus2 className="size-3.5" /> New project
          </DropdownMenuItem>
          <DropdownMenuItem className={item} onSelect={() => fileRef.current?.click()}>
            <FolderOpen className="size-3.5" /> Open project… <DropdownMenuShortcut>⌘O</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem className={item} onSelect={() => void saveProjectFile()}>
            <Save className="size-3.5" /> Save project <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuItem className={item} disabled={!s.canUndo} onSelect={() => s.undo()}>
            <Undo2 className="size-3.5" /> Undo <DropdownMenuShortcut>⌘Z</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem className={item} disabled={!s.canRedo} onSelect={() => s.redo()}>
            <Redo2 className="size-3.5" /> Redo <DropdownMenuShortcut>⇧⌘Z</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem className={item} onSelect={() => s.setTimelineOpen(!s.timelineOpen)}>
            <LayoutPanelTop className="size-3.5" /> {s.timelineOpen ? 'Hide' : 'Show'} timeline <DropdownMenuShortcut>T</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem className={item} onSelect={() => s.setTemplatesOpen(true)}>
            <SquareStack className="size-3.5" /> Templates
          </DropdownMenuItem>
          <DropdownMenuItem className={item} onSelect={() => s.setShortcutsOpen(true)}>
            <Keyboard className="size-3.5" /> Keyboard shortcuts <DropdownMenuShortcut>?</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuItem className={item} asChild>
            <a href="/classic">Classic 2D editor</a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <input
        ref={fileRef}
        type="file"
        accept={PROJECT_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void openProjectFile(f)
          e.target.value = ''
        }}
      />
    </>
  )
}

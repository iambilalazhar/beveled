import { create } from 'zustand'
import { DEFAULT_SCENE } from './presets'
import type { ExportFormat, MediaState, PanelId, SceneSection, SceneState, Template } from './types'

const STORAGE_KEY = 'beveled.mockup.scene.v1'
const HISTORY_COALESCE_MS = 450
const MAX_HISTORY = 60

export type ExportRequest = {
  id: number
  format: ExportFormat
  scale: number
  quality: number
  transparent: boolean
}

export type ExportResult = { blob: Blob; width: number; height: number } | null

type EditorStore = {
  scene: SceneState
  past: SceneState[]
  future: SceneState[]
  panel: PanelId | null
  templatesOpen: boolean
  exportRequest: ExportRequest | null
  exporting: boolean
  recording: boolean
  recordingProgress: number
  canvasSize: { width: number; height: number }
  dragging: boolean

  update: <K extends SceneSection>(section: K, patch: Partial<SceneState[K]>) => void
  updateMany: (patch: Partial<{ [K in SceneSection]: Partial<SceneState[K]> }>) => void
  setMedia: (media: MediaState) => void
  clearMedia: () => void
  applyTemplate: (template: Template) => void
  resetScene: () => void
  undo: () => void
  redo: () => void
  setPanel: (panel: PanelId | null) => void
  setTemplatesOpen: (open: boolean) => void
  requestExport: (req?: Partial<Omit<ExportRequest, 'id'>>) => void
  finishExport: () => void
  setRecording: (recording: boolean, progress?: number) => void
  setCanvasSize: (size: { width: number; height: number }) => void
  setDragging: (dragging: boolean) => void
}

let lastHistoryPush = 0

function loadPersisted(): SceneState {
  if (typeof window === 'undefined') return DEFAULT_SCENE
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SCENE
    const saved = JSON.parse(raw) as Partial<SceneState>
    return mergeScene(DEFAULT_SCENE, { ...saved, media: undefined })
  } catch {
    return DEFAULT_SCENE
  }
}

function mergeScene(
  base: SceneState,
  patch: Partial<{ [K in SceneSection]: Partial<SceneState[K]> | undefined }>
): SceneState {
  const next = { ...base }
  for (const key of Object.keys(patch) as SceneSection[]) {
    const value = patch[key]
    if (!value) continue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(next as any)[key] = { ...base[key], ...value }
  }
  return next
}

let persistTimer: number | null = null
function persist(scene: SceneState) {
  if (typeof window === 'undefined') return
  if (persistTimer) window.clearTimeout(persistTimer)
  persistTimer = window.setTimeout(() => {
    try {
      const { media: _media, ...rest } = scene
      void _media
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rest))
    } catch {
      /* ignore quota errors */
    }
  }, 300)
}

function pushHistory(state: EditorStore, force = false): Pick<EditorStore, 'past' | 'future'> {
  const now = Date.now()
  if (!force && now - lastHistoryPush < HISTORY_COALESCE_MS) {
    return { past: state.past, future: state.future }
  }
  lastHistoryPush = now
  const past = [...state.past, state.scene].slice(-MAX_HISTORY)
  return { past, future: [] }
}

export const useEditor = create<EditorStore>((set, get) => ({
  scene: loadPersisted(),
  past: [],
  future: [],
  panel: 'device',
  templatesOpen: false,
  exportRequest: null,
  exporting: false,
  recording: false,
  recordingProgress: 0,
  canvasSize: { width: 1280, height: 720 },
  dragging: false,

  update: (section, patch) => {
    const state = get()
    const scene = { ...state.scene, [section]: { ...state.scene[section], ...patch } }
    persist(scene)
    set({ scene, ...pushHistory(state) })
  },

  updateMany: (patch) => {
    const state = get()
    const scene = mergeScene(state.scene, patch)
    persist(scene)
    set({ scene, ...pushHistory(state, true) })
  },

  setMedia: (media) => {
    const state = get()
    const scene = { ...state.scene, media }
    set({ scene, ...pushHistory(state, true) })
  },

  clearMedia: () => {
    const state = get()
    const scene = { ...state.scene, media: DEFAULT_SCENE.media }
    set({ scene, ...pushHistory(state, true) })
  },

  applyTemplate: (template) => {
    const state = get()
    // Templates start from defaults so stale settings do not leak between looks.
    const base = { ...DEFAULT_SCENE, media: state.scene.media, export: state.scene.export }
    const scene = mergeScene(base, template.scene)
    persist(scene)
    set({ scene, ...pushHistory(state, true), templatesOpen: false })
  },

  resetScene: () => {
    const state = get()
    const scene = { ...DEFAULT_SCENE, media: state.scene.media }
    persist(scene)
    set({ scene, ...pushHistory(state, true) })
  },

  undo: () => {
    const state = get()
    if (!state.past.length) return
    const previous = state.past[state.past.length - 1]
    const scene = { ...previous, media: state.scene.media }
    persist(scene)
    lastHistoryPush = 0
    set({ scene, past: state.past.slice(0, -1), future: [state.scene, ...state.future].slice(0, MAX_HISTORY) })
  },

  redo: () => {
    const state = get()
    if (!state.future.length) return
    const next = state.future[0]
    const scene = { ...next, media: state.scene.media }
    persist(scene)
    lastHistoryPush = 0
    set({ scene, past: [...state.past, state.scene].slice(-MAX_HISTORY), future: state.future.slice(1) })
  },

  setPanel: (panel) => set({ panel }),
  setTemplatesOpen: (open) => set({ templatesOpen: open }),

  requestExport: (req) => {
    const { scene, exporting } = get()
    if (exporting) return
    set({
      exporting: true,
      exportRequest: {
        id: Date.now(),
        format: req?.format ?? scene.export.format,
        scale: req?.scale ?? scene.export.scale,
        quality: req?.quality ?? scene.export.quality,
        transparent: req?.transparent ?? scene.export.transparent,
      },
    })
  },
  finishExport: () => set({ exporting: false, exportRequest: null }),
  setRecording: (recording, progress = 0) => set({ recording, recordingProgress: progress }),
  setCanvasSize: (canvasSize) => {
    const prev = get().canvasSize
    if (prev.width === canvasSize.width && prev.height === canvasSize.height) return
    set({ canvasSize })
  },
  setDragging: (dragging) => set({ dragging }),
}))

/** Convenience selector hooks */
export const useScene = <K extends SceneSection>(section: K) => useEditor((s) => s.scene[section])

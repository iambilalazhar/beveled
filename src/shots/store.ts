import { create } from 'zustand'
import { DEFAULT_EASING } from '@/mockup/timeline/easing'
import { newId } from '@/mockup/timeline/motionPresets'
import type { Easing } from '@/mockup/timeline/types'
import type { ExportFormat, MediaState } from '@/mockup/types'
import { BASE_LAYOUT, DEFAULT_SHOTS } from './presets'
import { layoutAt, stepEnd, totalDuration } from './timeline'
import type { FrameState2D, Layout2D, MockupState, ShotsExport, ShotsProject, ShotsTemplate, TextState2D } from './types'

const STORAGE_KEY = 'beveled.shots.project.v1'
const MAX_HISTORY = 80
const COALESCE_MS = 450

export type ShotsExportRequest = { id: number; format: ExportFormat; scale: number; quality: number }

type ShotsStore = {
  project: ShotsProject
  past: ShotsProject[]
  future: ShotsProject[]
  /** 'base' or the id of the animation step being edited. */
  selected: string
  time: number
  playing: boolean
  loop: boolean
  tab: 'mockup' | 'text' | 'frame'
  rightTab: 'zoom' | 'tilt'
  templatesOpen: boolean
  exportRequest: ShotsExportRequest | null
  exporting: boolean
  videoRequest: { id: number } | null
  recording: boolean
  recordingProgress: number
  status: string | null
  canvasSize: { width: number; height: number }

  setMockup: (patch: Partial<MockupState>) => void
  setFrame: (patch: Partial<FrameState2D>) => void
  setText: (patch: Partial<TextState2D>) => void
  setExport: (patch: Partial<ShotsExport>) => void
  setMedia: (index: number, media: MediaState | null) => void
  /** Edits the layout being edited (the base or the selected step). */
  setLayout: (patch: Partial<Layout2D>) => void
  addStep: () => void
  removeStep: (id: string) => void
  setStepDuration: (id: string, duration: number) => void
  setStepEasing: (id: string, easing: Easing) => void
  select: (id: string) => void
  applyTemplate: (t: ShotsTemplate) => void
  newProject: () => void
  undo: () => void
  redo: () => void

  seek: (t: number) => void
  setTimeFromPlayback: (t: number) => void
  setPlaying: (playing: boolean) => void
  togglePlay: () => void
  setLoop: (loop: boolean) => void
  setTab: (tab: 'mockup' | 'text' | 'frame') => void
  setRightTab: (tab: 'zoom' | 'tilt') => void
  setTemplatesOpen: (open: boolean) => void
  requestExport: (req?: Partial<Omit<ShotsExportRequest, 'id'>>) => void
  finishExport: () => void
  requestVideo: () => void
  cancelVideo: () => void
  setRecording: (recording: boolean, progress?: number) => void
  setStatus: (status: string | null) => void
  setCanvasSize: (size: { width: number; height: number }) => void
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

function fresh(): ShotsProject {
  return structuredClone(DEFAULT_SHOTS)
}

/** Fills fields added later and drops object URLs (they do not survive a reload). */
function hydrate(saved: Partial<ShotsProject>, keepMedia = false): ShotsProject {
  const base = fresh()
  const media = (saved.mockup?.media ?? base.mockup.media).map((m, i) => {
    if (!m) return i === 0 ? { ...base.mockup.media[0]! } : null
    if (!keepMedia && m.url?.startsWith('blob:')) return i === 0 ? { ...base.mockup.media[0]! } : null
    return m
  })
  while (media.length < 3) media.push(null)
  const frame = { ...base.frame, ...saved.frame }
  if (!keepMedia && frame.background.image?.startsWith('blob:')) frame.background = { ...frame.background, image: null, kind: 'linear' }
  return {
    mockup: { ...base.mockup, ...saved.mockup, media },
    frame: { ...frame, background: { ...base.frame.background, ...frame.background } },
    text: { ...base.text, ...saved.text },
    base: { ...BASE_LAYOUT, ...saved.base },
    steps: (saved.steps ?? []).map((s) => ({ ...s, layout: { ...BASE_LAYOUT, ...s.layout }, easing: s.easing ?? { ...DEFAULT_EASING } })),
    export: { ...base.export, ...saved.export },
  }
}

export { hydrate as hydrateShots }

function load(): ShotsProject {
  if (typeof window === 'undefined') return fresh()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? hydrate(JSON.parse(raw)) : fresh()
  } catch {
    return fresh()
  }
}

let persistTimer: number | null = null
function persist(p: ShotsProject) {
  if (typeof window === 'undefined') return
  if (persistTimer) window.clearTimeout(persistTimer)
  persistTimer = window.setTimeout(() => {
    try {
      const keep = (url: string | null) => (url && !url.startsWith('blob:') && url.length < 400_000 ? url : null)
      const slim: ShotsProject = {
        ...p,
        mockup: { ...p.mockup, media: p.mockup.media.map((m) => (m && keep(m.url) ? m : null)) },
        frame: { ...p.frame, background: { ...p.frame.background, image: keep(p.frame.background.image) } },
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slim))
    } catch {
      /* ignore quota errors */
    }
  }, 300)
}

let lastPush = 0
let lastTag = ''

const initial = load()

export const useShots = create<ShotsStore>((set, get) => {
  const commit = (project: ShotsProject, extra: Partial<ShotsStore> = {}, opts: { tag?: string; force?: boolean } = {}) => {
    const s = get()
    const now = Date.now()
    const tag = opts.tag ?? ''
    let past = s.past
    let future = s.future
    if (opts.force || tag !== lastTag || now - lastPush > COALESCE_MS) {
      past = [...s.past, s.project].slice(-MAX_HISTORY)
      future = []
    }
    lastPush = now
    lastTag = tag
    persist(project)
    const selected = extra.selected ?? s.selected
    const valid = selected === 'base' || project.steps.some((st) => st.id === selected)
    const time = Math.min(extra.time ?? s.time, totalDuration(project))
    set({ project, past, future, ...extra, selected: valid ? selected : 'base', time })
  }

  /** Time at which the selected layout is fully reached, so edits are previewed where they apply. */
  const timeOf = (p: ShotsProject, id: string) => (id === 'base' ? 0 : stepEnd(p, p.steps.findIndex((s) => s.id === id)))

  return {
    project: initial,
    past: [],
    future: [],
    selected: 'base',
    time: 0,
    playing: false,
    loop: true,
    tab: 'mockup',
    rightTab: 'zoom',
    templatesOpen: false,
    exportRequest: null,
    exporting: false,
    videoRequest: null,
    recording: false,
    recordingProgress: 0,
    status: null,
    canvasSize: { width: 1280, height: 720 },

    setMockup: (patch) => {
      const p = get().project
      commit({ ...p, mockup: { ...p.mockup, ...patch } }, {}, { tag: `m:${Object.keys(patch).join()}` })
    },
    setFrame: (patch) => {
      const p = get().project
      commit({ ...p, frame: { ...p.frame, ...patch } }, {}, { tag: `f:${Object.keys(patch).join()}` })
    },
    setText: (patch) => {
      const p = get().project
      commit({ ...p, text: { ...p.text, ...patch } }, {}, { tag: `t:${Object.keys(patch).join()}` })
    },
    setExport: (patch) => {
      const p = get().project
      commit({ ...p, export: { ...p.export, ...patch } }, {}, { tag: 'export' })
    },
    setMedia: (index, media) => {
      const p = get().project
      const list = [...p.mockup.media]
      list[index] = media ?? (index === 0 ? { ...DEFAULT_SHOTS.mockup.media[0]! } : null)
      commit({ ...p, mockup: { ...p.mockup, media: list } }, {}, { force: true })
    },
    setLayout: (patch) => {
      const s = get()
      const p = s.project
      if (s.selected === 'base') {
        commit({ ...p, base: { ...p.base, ...patch } }, { time: 0, playing: false }, { tag: `l:base:${Object.keys(patch).join()}` })
        return
      }
      const steps = p.steps.map((st) => (st.id === s.selected ? { ...st, layout: { ...st.layout, ...patch } } : st))
      const project = { ...p, steps }
      commit(project, { time: timeOf(project, s.selected), playing: false }, { tag: `l:${s.selected}:${Object.keys(patch).join()}` })
    },
    addStep: () => {
      const s = get()
      const p = s.project
      const idx = s.selected === 'base' ? -1 : p.steps.findIndex((st) => st.id === s.selected)
      const from = layoutAt(p, timeOf(p, s.selected))
      const step = { id: newId('st'), layout: { ...from }, duration: 1, easing: { ...DEFAULT_EASING } }
      const steps = [...p.steps]
      steps.splice(idx + 1, 0, step)
      const project = { ...p, steps }
      commit(project, { selected: step.id, time: timeOf(project, step.id), playing: false }, { force: true })
      get().setStatus('Added an animation step — change its zoom or tilt')
    },
    removeStep: (id) => {
      const p = get().project
      const idx = p.steps.findIndex((s) => s.id === id)
      const steps = p.steps.filter((s) => s.id !== id)
      const project = { ...p, steps }
      const next = steps[Math.min(idx, steps.length - 1)]?.id ?? 'base'
      commit(project, { selected: next, time: timeOf(project, next) }, { force: true })
    },
    setStepDuration: (id, duration) => {
      const p = get().project
      const d = Math.round(clamp(duration, 0.2, 20) * 20) / 20
      commit({ ...p, steps: p.steps.map((s) => (s.id === id ? { ...s, duration: d } : s)) }, {}, { tag: `dur:${id}` })
    },
    setStepEasing: (id, easing) => {
      const p = get().project
      commit({ ...p, steps: p.steps.map((s) => (s.id === id ? { ...s, easing } : s)) }, {}, { tag: `ease:${id}` })
    },
    select: (id) => {
      const p = get().project
      set({ selected: id, time: timeOf(p, id), playing: false })
    },
    applyTemplate: (t) => {
      const p = get().project
      const base = { ...BASE_LAYOUT, ...t.base }
      let prev = base
      const steps = (t.steps ?? []).map((s) => {
        const layout = { ...prev, ...s.layout }
        prev = layout
        return { id: newId('st'), layout, duration: s.duration ?? 1.2, easing: { ...DEFAULT_EASING } }
      })
      const fresh0 = fresh()
      const project: ShotsProject = {
        ...p,
        mockup: { ...fresh0.mockup, ...t.mockup, media: p.mockup.media },
        frame: { ...fresh0.frame, ...t.frame, width: t.frame?.width ?? p.frame.width, height: t.frame?.height ?? p.frame.height, background: { ...fresh0.frame.background, ...t.frame?.background } },
        text: { ...fresh0.text, ...t.text },
        base,
        steps,
      }
      commit(project, { selected: 'base', time: 0, templatesOpen: false, playing: false }, { force: true })
    },
    newProject: () => {
      const p = get().project
      const project = { ...fresh(), mockup: { ...fresh().mockup, media: [p.mockup.media[0], null, null] } }
      commit(project, { selected: 'base', time: 0, playing: false }, { force: true })
    },
    undo: () => {
      const s = get()
      if (!s.past.length) return
      const prev = s.past[s.past.length - 1]
      lastPush = 0
      persist(prev)
      set({ project: prev, past: s.past.slice(0, -1), future: [s.project, ...s.future].slice(0, MAX_HISTORY), selected: 'base', time: 0 })
    },
    redo: () => {
      const s = get()
      if (!s.future.length) return
      const next = s.future[0]
      lastPush = 0
      persist(next)
      set({ project: next, past: [...s.past, s.project].slice(-MAX_HISTORY), future: s.future.slice(1), selected: 'base', time: 0 })
    },

    seek: (t) => set({ time: clamp(t, 0, totalDuration(get().project)) }),
    setTimeFromPlayback: (time) => set({ time }),
    setPlaying: (playing) => {
      const s = get()
      if (playing && s.time >= totalDuration(s.project) - 0.02) set({ time: 0 })
      set({ playing })
    },
    togglePlay: () => get().setPlaying(!get().playing),
    setLoop: (loop) => set({ loop }),
    setTab: (tab) => set({ tab }),
    setRightTab: (rightTab) => set({ rightTab }),
    setTemplatesOpen: (templatesOpen) => set({ templatesOpen }),
    requestExport: (req) => {
      const s = get()
      if (s.exporting || s.recording) return
      const e = s.project.export
      set({ exporting: true, playing: false, exportRequest: { id: Date.now(), format: req?.format ?? e.format, scale: req?.scale ?? e.scale, quality: req?.quality ?? e.quality } })
    },
    finishExport: () => set({ exporting: false, exportRequest: null }),
    requestVideo: () => {
      const s = get()
      if (s.exporting || s.recording) return
      set({ recording: true, recordingProgress: 0, playing: false, videoRequest: { id: Date.now() } })
    },
    cancelVideo: () => set({ videoRequest: null }),
    setRecording: (recording, progress = 0) => set(recording ? { recording, recordingProgress: progress } : { recording, recordingProgress: progress, videoRequest: null }),
    setStatus: (status) => set({ status }),
    setCanvasSize: (size) => {
      const prev = get().canvasSize
      if (prev.width !== size.width || prev.height !== size.height) set({ canvasSize: size })
    },
  }
})

/** Layout being edited in the inspector. */
export function editedLayout(s: Pick<ShotsStore, 'project' | 'selected'>): Layout2D {
  if (s.selected === 'base') return s.project.base
  return s.project.steps.find((st) => st.id === s.selected)?.layout ?? s.project.base
}

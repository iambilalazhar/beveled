import { create } from 'zustand'
import { DEFAULT_SCENE } from './presets'
import { cloneClip, DEFAULT_AUDIO, defaultShotScene, FADE, CUT, makeLogo, makeShot, makeText, mergeShotScene, nextName } from './timeline/factory'
import { DEFAULT_EASING } from './timeline/easing'
import { clipIndexAt, clipStart, keyframeAt, MAX_CLIP, MIN_CLIP, resolveShotScene, sampleShot, totalDuration } from './timeline/evaluate'
import { ANIM_KEYS, kf, MOTION_PRESET_BY_ID } from './timeline/motionPresets'
import type {
  AnimKey,
  AudioState,
  Clip,
  ClipKind,
  Easing,
  KeyframeRef,
  LogoState,
  ShotClip,
  ShotScene,
  TextState,
  TimelineMode,
  TransitionKind,
} from './timeline/types'
import type { ExportFormat, ExportState, FrameState, MediaState, PanelId, ScenePatch, SceneSection, SceneState, Template } from './types'

const STORAGE_KEY = 'beveled.mockup.project.v1'
const HISTORY_COALESCE_MS = 450
const MAX_HISTORY = 80

export type Project = {
  clips: Clip[]
  frame: FrameState
  export: ExportState
  audio: AudioState
}

export type ExportRequest = {
  id: number
  format: ExportFormat
  scale: number
  quality: number
  transparent: boolean
}

export type VideoRequest = {
  id: number
  /** 'timeline' renders every clip frame by frame; 'realtime' records the stage as it plays (fallback). */
  mode: 'timeline' | 'realtime'
}

export type ExportResult = { blob: Blob; width: number; height: number } | null

type EditorStore = {
  project: Project
  past: Project[]
  future: Project[]

  /** Selected clip; the inspector edits it. */
  selectedClipId: string
  /** Playhead in seconds from the start of the timeline. */
  time: number
  playing: boolean
  loop: boolean
  timelineMode: TimelineMode
  timelineOpen: boolean
  /** Height of the timeline track area in px. */
  timelineHeight: number
  pxPerSec: number
  recordKeyframes: boolean
  expanded: string[]
  selectedKeyframe: KeyframeRef | null

  panel: PanelId | null
  templatesOpen: boolean
  exportRequest: ExportRequest | null
  exporting: boolean
  videoRequest: VideoRequest | null
  recording: boolean
  recordingProgress: number
  status: string | null
  canvasSize: { width: number; height: number }
  dragging: boolean

  /* scene editing (selected shot) */
  update: <K extends SceneSection>(section: K, patch: Partial<SceneState[K]>) => void
  updateMany: (patch: Partial<{ [K in SceneSection]: Partial<SceneState[K]> }>) => void
  setMedia: (media: MediaState) => void
  clearMedia: () => void
  applyTemplate: (template: Template) => void
  resetScene: () => void
  /** Replaces the timeline with a single default shot, keeping the current media. */
  newProject: () => void
  undo: () => void
  redo: () => void

  /* clips */
  selectClip: (id: string, seek?: boolean) => void
  addClip: (kind: ClipKind, opts?: { afterId?: string; media?: MediaState }) => string
  duplicateClip: (id: string) => void
  removeClip: (id: string) => void
  moveClip: (id: string, toIndex: number) => void
  setClipDuration: (id: string, duration: number, scaleKeys?: boolean) => void
  renameClip: (id: string, name: string) => void
  setJunction: (index: number, kind: TransitionKind, duration?: number) => void
  updateText: (id: string, patch: Partial<TextState>) => void
  updateLogo: (id: string, patch: Partial<LogoState>) => void
  setAudio: (patch: Partial<AudioState>) => void

  /* keyframes */
  toggleKeyframe: (key: AnimKey) => void
  setKeyframe: (clipId: string, key: AnimKey, t: number, value: number) => void
  moveKeyframe: (ref: KeyframeRef, t: number) => void
  removeKeyframe: (ref: KeyframeRef) => void
  setKeyframeEasing: (ref: KeyframeRef, easing: Easing) => void
  clearTrack: (clipId: string, key: AnimKey) => void
  selectKeyframe: (ref: KeyframeRef | null) => void
  applyMotionPreset: (presetId: string, clipId?: string) => void
  clearMotion: (clipId?: string) => void

  /* playback / timeline UI */
  seek: (t: number) => void
  setTimeFromPlayback: (t: number) => void
  setPlaying: (playing: boolean) => void
  togglePlay: () => void
  setLoop: (loop: boolean) => void
  setTimelineMode: (mode: TimelineMode) => void
  setTimelineOpen: (open: boolean) => void
  setTimelineHeight: (h: number) => void
  setPxPerSec: (pps: number) => void
  setRecordKeyframes: (on: boolean) => void
  toggleExpanded: (id: string) => void

  /* misc UI */
  setPanel: (panel: PanelId | null) => void
  setTemplatesOpen: (open: boolean) => void
  requestExport: (req?: Partial<Omit<ExportRequest, 'id'>>) => void
  finishExport: () => void
  requestVideo: (mode?: VideoRequest['mode']) => void
  /** @deprecated alias kept for older callers */
  requestRecord: () => void
  cancelRecord: () => void
  setRecording: (recording: boolean, progress?: number) => void
  setStatus: (status: string | null) => void
  setCanvasSize: (size: { width: number; height: number }) => void
  setDragging: (dragging: boolean) => void
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const round = (v: number, step = 0.01) => Math.round(v / step) * step

function defaultProject(): Project {
  return {
    clips: [makeShot(defaultShotScene(), 'Shot 1')],
    frame: { ...DEFAULT_SCENE.frame },
    export: { ...DEFAULT_SCENE.export },
    audio: { ...DEFAULT_AUDIO },
  }
}

/** Fills fields added after a project was saved. */
function hydrateProject(saved: Partial<Project>): Project {
  const base = defaultProject()
  const shotDefaults = defaultShotScene()
  const clips = (saved.clips ?? base.clips).map((c) => {
    if (c.kind === 'shot') {
      const scene = mergeShotScene(shotDefaults, c.scene as ScenePatch)
      scene.media = { ...DEFAULT_SCENE.media }
      if (scene.background.image?.startsWith('blob:')) scene.background = { ...scene.background, image: null, kind: 'radial' }
      return { ...c, scene, tracks: c.tracks ?? {} } as ShotClip
    }
    if (c.kind === 'logo' && c.logo.url?.startsWith('blob:')) return { ...c, logo: { ...c.logo, url: null } }
    return c
  })
  return {
    clips: clips.length ? clips : base.clips,
    frame: { ...base.frame, ...saved.frame },
    export: { ...base.export, ...saved.export },
    audio: { ...DEFAULT_AUDIO },
  }
}

function loadPersisted(): Project {
  if (typeof window === 'undefined') return defaultProject()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultProject()
    return hydrateProject(JSON.parse(raw) as Partial<Project>)
  } catch {
    return defaultProject()
  }
}

let persistTimer: number | null = null
function persist(project: Project) {
  if (typeof window === 'undefined') return
  if (persistTimer) window.clearTimeout(persistTimer)
  persistTimer = window.setTimeout(() => {
    try {
      const slim: Project = {
        ...project,
        audio: { ...DEFAULT_AUDIO },
        clips: project.clips.map((c) => {
          if (c.kind === 'shot') {
            const bgImage = c.scene.background.image
            return {
              ...c,
              scene: {
                ...c.scene,
                media: { ...DEFAULT_SCENE.media },
                background: { ...c.scene.background, image: bgImage && bgImage.length < 400_000 && !bgImage.startsWith('blob:') ? bgImage : null },
              },
            }
          }
          if (c.kind === 'logo') {
            const url = c.logo.url
            return { ...c, logo: { ...c.logo, url: url && url.length < 400_000 && !url.startsWith('blob:') ? url : null } }
          }
          return c
        }),
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slim))
    } catch {
      /* ignore quota errors */
    }
  }, 300)
}

let lastHistoryPush = 0
let lastHistoryTag = ''

/** Clip whose scene the inspector edits: the selection if it is a shot, otherwise the nearest shot. */
export function editShot(project: Project, selectedId: string): ShotClip {
  const idx = project.clips.findIndex((c) => c.id === selectedId)
  const sel = project.clips[idx]
  if (sel?.kind === 'shot') return sel
  for (let i = idx - 1; i >= 0; i--) if (project.clips[i].kind === 'shot') return project.clips[i] as ShotClip
  const any = project.clips.find((c) => c.kind === 'shot') as ShotClip | undefined
  return any ?? (project.clips[0] as ShotClip)
}

export function selectedClip(s: Pick<EditorStore, 'project' | 'selectedClipId'>): Clip {
  return s.project.clips.find((c) => c.id === s.selectedClipId) ?? s.project.clips[0]
}

/** Clip showing at the playhead. */
export function activeClip(s: Pick<EditorStore, 'project' | 'time'>): Clip {
  const i = clipIndexAt(s.project.clips, s.time)
  return s.project.clips[Math.max(0, i)]
}

function replaceClip(project: Project, id: string, fn: (c: Clip) => Clip): Project {
  return { ...project, clips: project.clips.map((c) => (c.id === id ? fn(c) : c)) }
}

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

const initialProject = loadPersisted()

export const useEditor = create<EditorStore>((set, get) => {
  /** Commits a new project with undo history. `tag` coalesces rapid edits of the same thing. */
  const commit = (project: Project, extra: Partial<EditorStore> = {}, opts: { force?: boolean; tag?: string } = {}) => {
    const state = get()
    const now = Date.now()
    const tag = opts.tag ?? ''
    let past = state.past
    let future = state.future
    if (opts.force || tag !== lastHistoryTag || now - lastHistoryPush > HISTORY_COALESCE_MS) {
      past = [...state.past, state.project].slice(-MAX_HISTORY)
      future = []
    }
    lastHistoryPush = now
    lastHistoryTag = tag
    persist(project)
    const total = totalDuration(project.clips)
    const time = Math.min(state.time, Math.max(0, total - 1e-3))
    const selectedClipId = project.clips.some((c) => c.id === (extra.selectedClipId ?? state.selectedClipId))
      ? (extra.selectedClipId ?? state.selectedClipId)
      : project.clips[0].id
    set({ project, past, future, time, ...extra, selectedClipId })
  }

  /** Local time of the playhead inside a clip, clamped to the clip. */
  const localTime = (clipId: string) => {
    const s = get()
    const clip = s.project.clips.find((c) => c.id === clipId)
    if (!clip) return 0
    return clamp(s.time - clipStart(s.project.clips, clipId), 0, clip.duration)
  }

  const writeShot = (fn: (shot: ShotClip) => ShotClip, tag: string, force = false) => {
    const s = get()
    const shot = editShot(s.project, s.selectedClipId)
    commit(replaceClip(s.project, shot.id, (c) => fn(c as ShotClip)), {}, { tag: `${shot.id}:${tag}`, force })
  }

  return {
    project: initialProject,
    past: [],
    future: [],
    selectedClipId: initialProject.clips[0].id,
    time: 0,
    playing: false,
    loop: true,
    timelineMode: 'simple',
    timelineOpen: true,
    timelineHeight: 150,
    pxPerSec: 110,
    recordKeyframes: false,
    expanded: [],
    selectedKeyframe: null,

    panel: 'device',
    templatesOpen: false,
    exportRequest: null,
    exporting: false,
    videoRequest: null,
    recording: false,
    recordingProgress: 0,
    status: null,
    canvasSize: { width: 1280, height: 720 },
    dragging: false,

    /* ---------------- scene editing ---------------- */

    update: (section, patch) => {
      const s = get()
      if (section === 'frame' || section === 'export') {
        const key = section as 'frame' | 'export'
        commit({ ...s.project, [key]: { ...s.project[key], ...(patch as object) } }, {}, { tag: key })
        return
      }
      const shot = editShot(s.project, s.selectedClipId)
      const t = localTime(shot.id)
      let tracks = shot.tracks
      const staticPatch: Record<string, unknown> = {}
      for (const [field, value] of Object.entries(patch as object)) {
        const key = `${section}.${field}` as AnimKey
        if (ANIM_KEYS.has(key) && typeof value === 'number') {
          const existing = tracks[key]
          if ((existing && existing.length) || s.recordKeyframes) {
            const list = [...(existing ?? [])]
            const hit = keyframeAt(list, t)
            if (hit) list[list.indexOf(hit)] = { ...hit, value }
            else {
              list.push(kf(round(t, 0.01), value))
              list.sort((a, b) => a.t - b.t)
            }
            tracks = { ...tracks, [key]: list }
            // Keep the static value in sync when the track is new, so removing it later feels natural.
            if (!existing || !existing.length) staticPatch[field] = value
            continue
          }
        }
        staticPatch[field] = value
      }
      const next: ShotClip = {
        ...shot,
        tracks,
        scene: Object.keys(staticPatch).length
          ? { ...shot.scene, [section]: { ...(shot.scene[section as keyof ShotScene] as object), ...staticPatch } }
          : shot.scene,
      }
      commit(replaceClip(s.project, shot.id, () => next), {}, { tag: `${shot.id}:${section}:${Object.keys(patch as object).join(',')}` })
    },

    updateMany: (patch) => {
      const s = get()
      let project = s.project
      if (patch.frame) project = { ...project, frame: { ...project.frame, ...patch.frame } }
      if (patch.export) project = { ...project, export: { ...project.export, ...patch.export } }
      const shot = editShot(project, s.selectedClipId)
      const { frame: _f, export: _e, media, ...rest } = patch
      void _f
      void _e
      let scene = mergeShotScene(shot.scene, rest as ScenePatch)
      if (media) scene = { ...scene, media: { ...scene.media, ...media } }
      project = replaceClip(project, shot.id, (c) => ({ ...(c as ShotClip), scene }))
      commit(project, {}, { force: true })
    },

    setMedia: (media) => writeShot((shot) => ({ ...shot, scene: { ...shot.scene, media } }), 'media', true),
    clearMedia: () => writeShot((shot) => ({ ...shot, scene: { ...shot.scene, media: { ...DEFAULT_SCENE.media } } }), 'media', true),

    applyTemplate: (template) => {
      const s = get()
      const current = editShot(s.project, s.selectedClipId)
      const media = current.scene.media
      const frame = { ...s.project.frame, ...(template.scene.frame ?? {}) }
      if (template.clips?.length) {
        const clips: Clip[] = []
        for (const tc of template.clips) {
          let clip: Clip
          if (tc.kind === 'shot') {
            const scene = { ...mergeShotScene(defaultShotScene(), tc.scene), media }
            clip = makeShot(scene, tc.name ?? nextName(clips, 'shot'), tc.duration ?? 3)
            if (tc.preset && MOTION_PRESET_BY_ID[tc.preset]) {
              const preset = MOTION_PRESET_BY_ID[tc.preset]
              clip.duration = tc.duration ?? preset.duration
              clip.tracks = preset.build(scene, clip.duration)
            }
          } else if (tc.kind === 'text') {
            clip = makeText(tc.text, tc.name ?? nextName(clips, 'text'), tc.duration ?? 3)
          } else {
            clip = makeLogo(tc.logo, tc.name ?? nextName(clips, 'logo'), tc.duration ?? 3)
          }
          if (tc.transitionIn) clip.transitionIn = tc.transitionIn === 'fade' ? FADE : CUT
          if (tc.transitionOut) clip.transitionOut = tc.transitionOut === 'fade' ? FADE : CUT
          clips.push(clip)
        }
        const firstShot = clips.find((c) => c.kind === 'shot') ?? clips[0]
        commit({ ...s.project, clips, frame }, { templatesOpen: false, selectedClipId: firstShot.id, time: 0, selectedKeyframe: null }, { force: true })
        return
      }
      const { frame: _frame, ...scenePatch } = template.scene
      void _frame
      const scene = { ...mergeShotScene(defaultShotScene(), scenePatch), media }
      const project = replaceClip({ ...s.project, frame }, current.id, (c) => ({ ...(c as ShotClip), scene, tracks: {} }))
      commit(project, { templatesOpen: false, selectedClipId: current.id }, { force: true })
    },

    resetScene: () =>
      writeShot((shot) => ({ ...shot, scene: { ...defaultShotScene(), media: shot.scene.media }, tracks: {} }), 'reset', true),

    newProject: () => {
      const s = get()
      const media = editShot(s.project, s.selectedClipId).scene.media
      const clip = makeShot({ ...defaultShotScene(), media }, 'Shot 1')
      commit({ ...s.project, clips: [clip], audio: { ...DEFAULT_AUDIO } }, { selectedClipId: clip.id, time: 0, selectedKeyframe: null, expanded: [], panel: 'device' }, { force: true })
    },

    undo: () => {
      const s = get()
      if (!s.past.length) return
      const previous = s.past[s.past.length - 1]
      lastHistoryPush = 0
      persist(previous)
      const selectedClipId = previous.clips.some((c) => c.id === s.selectedClipId) ? s.selectedClipId : previous.clips[0].id
      set({ project: previous, past: s.past.slice(0, -1), future: [s.project, ...s.future].slice(0, MAX_HISTORY), selectedClipId, selectedKeyframe: null })
    },

    redo: () => {
      const s = get()
      if (!s.future.length) return
      const next = s.future[0]
      lastHistoryPush = 0
      persist(next)
      const selectedClipId = next.clips.some((c) => c.id === s.selectedClipId) ? s.selectedClipId : next.clips[0].id
      set({ project: next, past: [...s.past, s.project].slice(-MAX_HISTORY), future: s.future.slice(1), selectedClipId, selectedKeyframe: null })
    },

    /* ---------------- clips ---------------- */

    selectClip: (id, seek = true) => {
      const s = get()
      const clip = s.project.clips.find((c) => c.id === id)
      if (!clip) return
      const start = clipStart(s.project.clips, id)
      const inside = s.time >= start && s.time < start + clip.duration
      const panel = clip.kind === 'shot' ? (s.panel === 'clip' ? 'device' : s.panel) : 'clip'
      set({ selectedClipId: id, time: seek && !inside ? start : s.time, panel, selectedKeyframe: null })
    },

    addClip: (kind, opts = {}) => {
      const s = get()
      const clips = [...s.project.clips]
      const afterIdx = opts.afterId ? clips.findIndex((c) => c.id === opts.afterId) : clips.length - 1
      let clip: Clip
      if (kind === 'shot') {
        const look = editShot(s.project, s.selectedClipId).scene
        const scene: ShotScene = { ...structuredClone({ ...look, media: DEFAULT_SCENE.media }), media: opts.media ?? { ...DEFAULT_SCENE.media } }
        clip = makeShot(scene, nextName(clips, 'shot'))
      } else if (kind === 'text') clip = makeText({}, nextName(clips, 'text'))
      else clip = makeLogo({}, nextName(clips, 'logo'))
      clips.splice(afterIdx + 1, 0, clip)
      const time = clipStart(clips, clip.id)
      commit({ ...s.project, clips }, { selectedClipId: clip.id, time, panel: kind === 'shot' ? 'media' : 'clip', selectedKeyframe: null }, { force: true })
      return clip.id
    },

    duplicateClip: (id) => {
      const s = get()
      const idx = s.project.clips.findIndex((c) => c.id === id)
      if (idx < 0) return
      const copy = cloneClip(s.project.clips[idx], s.project.clips)
      const clips = [...s.project.clips]
      clips.splice(idx + 1, 0, copy)
      commit({ ...s.project, clips }, { selectedClipId: copy.id, time: clipStart(clips, copy.id) }, { force: true })
    },

    removeClip: (id) => {
      const s = get()
      if (s.project.clips.length <= 1) {
        get().setStatus('A timeline needs at least one clip')
        return
      }
      const idx = s.project.clips.findIndex((c) => c.id === id)
      const clips = s.project.clips.filter((c) => c.id !== id)
      const next = clips[Math.min(idx, clips.length - 1)]
      commit({ ...s.project, clips }, { selectedClipId: next.id, time: clipStart(clips, next.id), selectedKeyframe: null, panel: next.kind === 'shot' ? 'device' : 'clip' }, { force: true })
    },

    moveClip: (id, toIndex) => {
      const s = get()
      const from = s.project.clips.findIndex((c) => c.id === id)
      if (from < 0) return
      const clips = [...s.project.clips]
      const [clip] = clips.splice(from, 1)
      const to = clamp(toIndex, 0, clips.length)
      if (to === from) return
      clips.splice(to, 0, clip)
      commit({ ...s.project, clips }, { time: clipStart(clips, id) }, { force: true })
    },

    setClipDuration: (id, duration, scaleKeys = true) => {
      const s = get()
      const d = round(clamp(duration, MIN_CLIP, MAX_CLIP), 0.05)
      const project = replaceClip(s.project, id, (c) => {
        if (c.kind !== 'shot' || !scaleKeys || c.duration === d) return { ...c, duration: d }
        const k = d / c.duration
        const tracks = Object.fromEntries(Object.entries(c.tracks).map(([key, list]) => [key, list?.map((f) => ({ ...f, t: round(f.t * k, 0.01) }))]))
        return { ...c, duration: d, tracks }
      })
      commit(project, {}, { tag: `dur:${id}` })
    },

    renameClip: (id, name) => commit(replaceClip(get().project, id, (c) => ({ ...c, name })), {}, { tag: `name:${id}` }),

    setJunction: (index, kind, duration) => {
      // index -1 = start of timeline, clips.length - 1 = end of timeline, otherwise the junction after clip `index`.
      const s = get()
      const clips = [...s.project.clips]
      const tr = { kind, duration: duration ?? 0.4 }
      if (index < 0) clips[0] = { ...clips[0], transitionIn: tr }
      else {
        clips[index] = { ...clips[index], transitionOut: tr }
        if (index + 1 < clips.length) clips[index + 1] = { ...clips[index + 1], transitionIn: tr }
      }
      commit({ ...s.project, clips }, {}, { tag: `junction:${index}` })
    },

    updateText: (id, patch) =>
      commit(replaceClip(get().project, id, (c) => (c.kind === 'text' ? { ...c, text: { ...c.text, ...patch } } : c)), {}, { tag: `text:${id}:${Object.keys(patch).join()}` }),

    updateLogo: (id, patch) =>
      commit(replaceClip(get().project, id, (c) => (c.kind === 'logo' ? { ...c, logo: { ...c.logo, ...patch } } : c)), {}, { tag: `logo:${id}:${Object.keys(patch).join()}` }),

    setAudio: (patch) => {
      const s = get()
      commit({ ...s.project, audio: { ...s.project.audio, ...patch } }, {}, { tag: 'audio' })
    },

    /* ---------------- keyframes ---------------- */

    toggleKeyframe: (key) => {
      const s = get()
      const shot = editShot(s.project, s.selectedClipId)
      const t = localTime(shot.id)
      const list = [...(shot.tracks[key] ?? [])]
      const hit = keyframeAt(list, t)
      if (hit) list.splice(list.indexOf(hit), 1)
      else {
        list.push(kf(round(t, 0.01), sampleShot(shot, key, t)))
        list.sort((a, b) => a.t - b.t)
      }
      const tracks = { ...shot.tracks, [key]: list }
      if (!list.length) delete tracks[key]
      commit(replaceClip(s.project, shot.id, () => ({ ...shot, tracks })), {}, { force: true })
    },

    setKeyframe: (clipId, key, t, value) => {
      const s = get()
      const project = replaceClip(s.project, clipId, (c) => {
        if (c.kind !== 'shot') return c
        const list = [...(c.tracks[key] ?? [])]
        const hit = keyframeAt(list, t)
        if (hit) list[list.indexOf(hit)] = { ...hit, value }
        else list.push(kf(t, value))
        list.sort((a, b) => a.t - b.t)
        return { ...c, tracks: { ...c.tracks, [key]: list } }
      })
      commit(project, {}, { tag: `kf:${clipId}:${key}` })
    },

    moveKeyframe: (ref, t) => {
      const s = get()
      const project = replaceClip(s.project, ref.clipId, (c) => {
        if (c.kind !== 'shot') return c
        const list = (c.tracks[ref.key] ?? []).map((k) => (k.id === ref.id ? { ...k, t: round(clamp(t, 0, c.duration), 0.01) } : k))
        list.sort((a, b) => a.t - b.t)
        return { ...c, tracks: { ...c.tracks, [ref.key]: list } }
      })
      commit(project, {}, { tag: `kfmove:${ref.id}` })
    },

    removeKeyframe: (ref) => {
      const s = get()
      const project = replaceClip(s.project, ref.clipId, (c) => {
        if (c.kind !== 'shot') return c
        const list = (c.tracks[ref.key] ?? []).filter((k) => k.id !== ref.id)
        const tracks = { ...c.tracks, [ref.key]: list }
        if (!list.length) delete tracks[ref.key]
        return { ...c, tracks }
      })
      commit(project, { selectedKeyframe: null }, { force: true })
    },

    setKeyframeEasing: (ref, easing) => {
      const s = get()
      const project = replaceClip(s.project, ref.clipId, (c) => {
        if (c.kind !== 'shot') return c
        const list = (c.tracks[ref.key] ?? []).map((k) => (k.id === ref.id ? { ...k, easing } : k))
        return { ...c, tracks: { ...c.tracks, [ref.key]: list } }
      })
      commit(project, {}, { tag: `ease:${ref.id}` })
    },

    clearTrack: (clipId, key) => {
      const s = get()
      const project = replaceClip(s.project, clipId, (c) => {
        if (c.kind !== 'shot') return c
        const tracks = { ...c.tracks }
        delete tracks[key]
        return { ...c, tracks }
      })
      commit(project, { selectedKeyframe: null }, { force: true })
    },

    selectKeyframe: (ref) => set({ selectedKeyframe: ref }),

    applyMotionPreset: (presetId, clipId) => {
      const s = get()
      const preset = MOTION_PRESET_BY_ID[presetId]
      if (!preset) return
      const shot = clipId ? (s.project.clips.find((c) => c.id === clipId) as ShotClip | undefined) : editShot(s.project, s.selectedClipId)
      if (!shot || shot.kind !== 'shot') return
      const tracks = preset.build(shot.scene, preset.duration)
      const project = replaceClip(s.project, shot.id, () => ({ ...shot, duration: preset.duration, tracks }))
      commit(project, { selectedClipId: shot.id, time: clipStart(project.clips, shot.id), expanded: [...new Set([...s.expanded, shot.id])] }, { force: true })
      get().setStatus(`Applied “${preset.label}” — press play`)
    },

    clearMotion: (clipId) => {
      const s = get()
      const shot = clipId ? (s.project.clips.find((c) => c.id === clipId) as ShotClip | undefined) : editShot(s.project, s.selectedClipId)
      if (!shot || shot.kind !== 'shot') return
      commit(replaceClip(s.project, shot.id, () => ({ ...shot, tracks: {} })), { selectedKeyframe: null }, { force: true })
    },

    /* ---------------- playback ---------------- */

    seek: (t) => {
      const s = get()
      const total = totalDuration(s.project.clips)
      const time = clamp(t, 0, Math.max(0, total - 1e-3))
      const clip = s.project.clips[clipIndexAt(s.project.clips, time)]
      const panel = clip.kind === 'shot' ? (s.panel === 'clip' ? 'device' : s.panel) : s.panel === null ? null : 'clip'
      set({ time, selectedClipId: s.playing ? s.selectedClipId : clip.id, panel: s.playing ? s.panel : panel })
    },
    setTimeFromPlayback: (time) => set({ time }),
    setPlaying: (playing) => {
      const s = get()
      if (playing && s.time >= totalDuration(s.project.clips) - 0.05) set({ time: 0 })
      set({ playing })
      if (!playing) {
        const clip = activeClip(get())
        set({ selectedClipId: clip.id })
      }
    },
    togglePlay: () => get().setPlaying(!get().playing),
    setLoop: (loop) => set({ loop }),
    setTimelineMode: (timelineMode) => {
      const s = get()
      set({ timelineMode, expanded: timelineMode === 'advanced' && !s.expanded.length ? [editShot(s.project, s.selectedClipId).id] : s.expanded })
    },
    setTimelineOpen: (timelineOpen) => set({ timelineOpen }),
    setTimelineHeight: (h) => set({ timelineHeight: clamp(Math.round(h), 80, 520) }),
    setPxPerSec: (pxPerSec) => set({ pxPerSec: clamp(pxPerSec, 30, 400) }),
    setRecordKeyframes: (recordKeyframes) => set({ recordKeyframes }),
    toggleExpanded: (id) => {
      const s = get()
      set({ expanded: s.expanded.includes(id) ? s.expanded.filter((e) => e !== id) : [...s.expanded, id] })
    },

    /* ---------------- misc ---------------- */

    setPanel: (panel) => {
      const s = get()
      if (panel && panel !== 'clip' && panel !== 'export' && selectedClip(s).kind !== 'shot') {
        const shot = editShot(s.project, s.selectedClipId)
        const start = clipStart(s.project.clips, shot.id)
        set({ panel, selectedClipId: shot.id, time: start })
        return
      }
      set({ panel })
    },
    setTemplatesOpen: (open) => set({ templatesOpen: open }),

    requestExport: (req) => {
      const { project, exporting, recording } = get()
      if (exporting || recording) return
      set({
        exporting: true,
        playing: false,
        exportRequest: {
          id: Date.now(),
          format: req?.format ?? project.export.format,
          scale: req?.scale ?? project.export.scale,
          quality: req?.quality ?? project.export.quality,
          transparent: req?.transparent ?? project.export.transparent,
        },
      })
    },
    finishExport: () => set({ exporting: false, exportRequest: null }),
    requestVideo: (mode = 'timeline') => {
      const { recording, exporting } = get()
      if (recording || exporting) return
      set({ recording: true, recordingProgress: 0, playing: false, videoRequest: { id: Date.now(), mode } })
    },
    requestRecord: () => get().requestVideo('timeline'),
    cancelRecord: () => set({ videoRequest: null }),
    setRecording: (recording, progress = 0) =>
      set(recording ? { recording, recordingProgress: progress } : { recording, recordingProgress: progress, videoRequest: null }),
    setStatus: (status) => set({ status }),
    setCanvasSize: (canvasSize) => {
      const prev = get().canvasSize
      if (prev.width === canvasSize.width && prev.height === canvasSize.height) return
      set({ canvasSize })
    },
    setDragging: (dragging) => set({ dragging }),
  }
})

/* ------------------------------------------------------------------ */
/* Selector hooks                                                      */
/* ------------------------------------------------------------------ */

/** Section of the edited shot (or the project-level frame / export settings). */
export function useScene<K extends SceneSection>(section: K): SceneState[K] {
  return useEditor((s) => {
    if (section === 'frame') return s.project.frame as SceneState[K]
    if (section === 'export') return s.project.export as SceneState[K]
    return editShot(s.project, s.selectedClipId).scene[section as keyof ShotScene] as SceneState[K]
  })
}

/** Resolved (keyframed) values of a section of the edited shot at the playhead. Imperative. */
export function currentSection<K extends keyof ShotScene>(section: K): ShotScene[K] {
  const s = useEditor.getState()
  const shot = editShot(s.project, s.selectedClipId)
  const local = Math.min(shot.duration, Math.max(0, s.time - clipStart(s.project.clips, shot.id)))
  return resolveShotScene(shot, local)[section]
}

export const useEditShot = () => useEditor((s) => editShot(s.project, s.selectedClipId))
export const useSelectedClip = () => useEditor((s) => selectedClip(s))
export const useActiveClip = () => useEditor((s) => activeClip(s))

export { DEFAULT_EASING }

import { DEFAULT_SCENE } from '../presets'
import type { BackgroundState, ScenePatch } from '../types'
import { newId } from './motionPresets'
import type { AudioState, Clip, LogoClip, LogoState, ShotClip, ShotScene, TextClip, TextState, Transition } from './types'

export const CUT: Transition = { kind: 'cut', duration: 0.4 }
export const FADE: Transition = { kind: 'fade', duration: 0.4 }

export const DEFAULT_SHOT_DURATION = 3
/** Shown on logo cards until the user uploads their own mark. */
export const PLACEHOLDER_LOGO = '/beveled_icon.png'

export function defaultShotScene(): ShotScene {
  const { frame: _f, export: _e, ...rest } = DEFAULT_SCENE
  void _f
  void _e
  return structuredClone(rest)
}

export function mergeShotScene(base: ShotScene, patch: ScenePatch | undefined): ShotScene {
  if (!patch) return base
  const next = { ...base }
  for (const key of Object.keys(patch) as (keyof ScenePatch)[]) {
    const value = patch[key]
    if (!value || !(key in base)) continue
    ;(next as Record<string, unknown>)[key] = { ...(base[key as keyof ShotScene] as object), ...(value as object) }
  }
  return next
}

const DARK_BG: BackgroundState = { kind: 'solid', colors: ['#0a0a0a'], angle: 0, noise: 0, image: null, imageBlur: 0.4 }

export const DEFAULT_TEXT: TextState = {
  text: 'Your text here',
  font: 'Inter',
  weight: 600,
  size: 6,
  spacing: -3,
  lineHeight: 1.15,
  align: 'center',
  color: '#ffffff',
  background: DARK_BG,
  enter: { per: 'line', duration: 1.2, effect: 'soft-blur' },
  exit: { per: 'line', duration: 1.2, effect: 'soft-blur' },
}

export const DEFAULT_LOGO: LogoState = {
  url: null,
  name: null,
  width: 0,
  height: 0,
  effect: 'none',
  scale: 3.5,
  background: DARK_BG,
  enter: { effect: 'fade', duration: 0.4 },
  exit: { effect: 'fade', duration: 0.4 },
}

export const DEFAULT_AUDIO: AudioState = { url: null, name: null, duration: 0, volume: 0.9, offset: 0, fadeOut: true }

export function makeShot(scene: ShotScene = defaultShotScene(), name = 'Shot', duration = DEFAULT_SHOT_DURATION): ShotClip {
  return { id: newId('c'), kind: 'shot', name, duration, transitionIn: CUT, transitionOut: CUT, scene, tracks: {} }
}

export function makeText(text: Partial<TextState> = {}, name = 'Text', duration = 3): TextClip {
  return {
    id: newId('c'),
    kind: 'text',
    name,
    duration,
    transitionIn: CUT,
    transitionOut: CUT,
    text: { ...structuredClone(DEFAULT_TEXT), ...text },
  }
}

export function makeLogo(logo: Partial<LogoState> = {}, name = 'Logo', duration = 3): LogoClip {
  return {
    id: newId('c'),
    kind: 'logo',
    name,
    duration,
    transitionIn: CUT,
    transitionOut: CUT,
    logo: { ...structuredClone(DEFAULT_LOGO), ...logo },
  }
}

/** Next free "Shot N" / "Text N" / "Logo N" name. */
export function nextName(clips: Clip[], kind: Clip['kind']) {
  const base = kind === 'shot' ? 'Shot' : kind === 'text' ? 'Text' : 'Logo'
  let n = 1
  const names = new Set(clips.map((c) => c.name))
  while (names.has(`${base} ${n}`)) n++
  return `${base} ${n}`
}

export function cloneClip(clip: Clip, clips: Clip[]): Clip {
  const copy = structuredClone(clip) as Clip
  copy.id = newId('c')
  copy.name = nextName(clips, clip.kind)
  if (copy.kind === 'shot') {
    for (const keys of Object.values(copy.tracks)) keys?.forEach((k) => (k.id = newId()))
  }
  return copy
}

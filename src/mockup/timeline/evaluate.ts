import { easingFn } from './easing'
import type { AnimKey, Clip, Keyframe, ShotClip, ShotScene, Tracks } from './types'

export const MIN_CLIP = 0.5
export const MAX_CLIP = 60

export function clipStarts(clips: Clip[]): number[] {
  const starts: number[] = []
  let t = 0
  for (const c of clips) {
    starts.push(t)
    t += c.duration
  }
  return starts
}

export function totalDuration(clips: Clip[]): number {
  return clips.reduce((sum, c) => sum + c.duration, 0)
}

/** Index of the clip that is showing at time `t` (end-exclusive, the last clip keeps its final frame). */
export function clipIndexAt(clips: Clip[], t: number): number {
  if (!clips.length) return -1
  let start = 0
  for (let i = 0; i < clips.length; i++) {
    const end = start + clips[i].duration
    if (t < end - 1e-6) return i
    start = end
  }
  return clips.length - 1
}

export function clipStart(clips: Clip[], id: string): number {
  let t = 0
  for (const c of clips) {
    if (c.id === id) return t
    t += c.duration
  }
  return 0
}

/* ------------------------------------------------------------------ */
/* Sampling                                                            */
/* ------------------------------------------------------------------ */

export function sampleKeyframes(keys: Keyframe[], t: number): number {
  if (keys.length === 1 || t <= keys[0].t) return keys[0].value
  const last = keys[keys.length - 1]
  if (t >= last.t) return last.value
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i]
    const b = keys[i + 1]
    if (t >= a.t && t <= b.t) {
      const span = Math.max(1e-6, b.t - a.t)
      const p = easingFn(a.easing)((t - a.t) / span)
      return a.value + (b.value - a.value) * p
    }
  }
  return last.value
}

export function baseValue(scene: ShotScene, key: AnimKey): number {
  const [section, field] = key.split('.') as [keyof ShotScene, string]
  return (scene[section] as unknown as Record<string, number>)[field]
}

/** Value of `key` on a shot at clip-local time `t`: keyframed if the track has keys, otherwise the static value. */
export function sampleShot(clip: ShotClip, key: AnimKey, t: number): number {
  const keys = clip.tracks[key]
  if (keys && keys.length) return sampleKeyframes(keys, t)
  return baseValue(clip.scene, key)
}

export function hasTrack(tracks: Tracks, key: AnimKey) {
  const k = tracks[key]
  return !!k && k.length > 0
}

export function keyframeAt(keys: Keyframe[] | undefined, t: number, eps = 0.02): Keyframe | undefined {
  return keys?.find((k) => Math.abs(k.t - t) <= eps)
}

/** Scene of a shot with every animated value resolved at clip-local time `t`. */
export function resolveShotScene(clip: ShotClip, t: number): ShotScene {
  const keys = Object.keys(clip.tracks) as AnimKey[]
  if (!keys.length) return clip.scene
  const scene: ShotScene = { ...clip.scene }
  for (const key of keys) {
    const k = clip.tracks[key]
    if (!k || !k.length) continue
    const [section, field] = key.split('.') as [keyof ShotScene, string]
    scene[section] = { ...(scene[section] as object), [field]: sampleKeyframes(k, t) } as never
  }
  return scene
}

/* ------------------------------------------------------------------ */
/* Transitions                                                         */
/* ------------------------------------------------------------------ */

const smooth = (x: number) => {
  const t = Math.min(1, Math.max(0, x))
  return t * t * (3 - 2 * t)
}

/** 0 = fully visible, 1 = fully covered by the fade colour. */
export function fadeAmount(clip: Clip, localT: number): number {
  let a = 0
  if (clip.transitionIn.kind === 'fade') {
    const d = Math.max(0.05, Math.min(clip.transitionIn.duration, clip.duration / 2))
    a = Math.max(a, 1 - smooth(localT / d))
  }
  if (clip.transitionOut.kind === 'fade') {
    const d = Math.max(0.05, Math.min(clip.transitionOut.duration, clip.duration / 2))
    a = Math.max(a, 1 - smooth((clip.duration - localT) / d))
  }
  return a
}

export function formatTime(t: number, withMs = true) {
  const m = Math.floor(t / 60)
  const s = t - m * 60
  const ss = withMs ? s.toFixed(2).padStart(5, '0') : Math.floor(s).toString().padStart(2, '0')
  return `${String(m).padStart(2, '0')}:${ss}`
}

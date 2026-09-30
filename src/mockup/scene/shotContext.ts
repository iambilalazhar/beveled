import { createContext, useContext } from 'react'
import { useEditor } from '../store'
import { clipStart, sampleShot } from '../timeline/evaluate'
import type { AnimKey, Clip, ShotClip, ShotScene } from '../timeline/types'

export const ShotContext = createContext<ShotClip | null>(null)

export function useShotClip(): ShotClip {
  const clip = useContext(ShotContext)
  if (!clip) throw new Error('useShotClip must be used inside a shot')
  return clip
}

export function useShotScene<K extends keyof ShotScene>(section: K): ShotScene[K] {
  return useShotClip().scene[section]
}

/** Clip-local playhead time, read imperatively (for use inside useFrame). */
export function localTimeOf(clip: Clip): number {
  const s = useEditor.getState()
  return Math.min(clip.duration, Math.max(0, s.time - clipStart(s.project.clips, clip.id)))
}

/** Current (possibly keyframed) value of an animatable property, read imperatively each frame. */
export function sampleNow(clip: ShotClip, key: AnimKey): number {
  return sampleShot(clip, key, localTimeOf(clip))
}

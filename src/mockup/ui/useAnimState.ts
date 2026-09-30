import { useShallow } from 'zustand/react/shallow'
import { editShot, useEditor } from '../store'
import { clipStart, keyframeAt, sampleShot } from '../timeline/evaluate'
import type { AnimKey } from '../timeline/types'

/** Live value of an animatable property at the playhead plus its keyframe state. */
export function useAnimState(key: AnimKey) {
  return useEditor(
    useShallow((s) => {
      const shot = editShot(s.project, s.selectedClipId)
      const local = Math.min(shot.duration, Math.max(0, s.time - clipStart(s.project.clips, shot.id)))
      const keys = shot.tracks[key]
      return {
        value: sampleShot(shot, key, local),
        animated: !!keys?.length,
        onKey: !!keyframeAt(keys, local),
      }
    })
  )
}


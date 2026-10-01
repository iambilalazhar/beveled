import { createContext, useContext } from 'react'
import type { MediaState } from '../types'
import { useShotScene } from './shotContext'

/** Which copy of the device is rendering (multi-device shots) and the media it shows. */
export const DeviceSlotContext = createContext<{ index: number; media: MediaState | null }>({ index: 0, media: null })

/** Media for the device currently rendering: its own screen in a group, otherwise the shot's media. */
export function useSlotMedia(): MediaState {
  const slot = useContext(DeviceSlotContext)
  const media = useShotScene('media')
  return slot.media?.url ? slot.media : media
}

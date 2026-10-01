import { create } from 'zustand'

export type StudioMode = '2d' | '3d'

const KEY = 'beveled.studio.mode'

function initialMode(): StudioMode {
  if (typeof window === 'undefined') return '3d'
  try {
    const param = new URLSearchParams(window.location.search).get('mode')
    if (param === '2d' || param === '3d') return param
    const saved = window.localStorage.getItem(KEY)
    return saved === '2d' ? '2d' : '3d'
  } catch {
    return '3d'
  }
}

/** Which studio is showing: the shots.so-style 2-D studio or the UltraMock-style 3-D editor. */
export const useStudioMode = create<{ mode: StudioMode; setMode: (m: StudioMode) => void }>((set) => ({
  mode: initialMode(),
  setMode: (mode) => {
    try {
      window.localStorage.setItem(KEY, mode)
      const url = new URL(window.location.href)
      url.searchParams.set('mode', mode)
      window.history.replaceState({}, '', url)
    } catch {
      /* ignore */
    }
    set({ mode })
  },
}))

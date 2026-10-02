import { useCallback, useEffect } from 'react'
import type { MediaKind, MediaState } from '@/mockup/types'
import { probeImage, probeVideo, useInitialMedia } from '@/mockup/ui/useMediaLoader'
import { useShots } from '../store'

const objectUrls: Record<number, string> = {}

/** Loads images / videos onto a device slot of the 2-D studio. */
export async function loadShotsUrl(url: string, kind: MediaKind, name: string | null, slot = 0, objectUrl = false) {
  const { setMedia, setStatus } = useShots.getState()
  try {
    const dims = kind === 'video' ? await probeVideo(url) : await probeImage(url)
    if (objectUrl) {
      const prev = objectUrls[slot]
      objectUrls[slot] = url
      if (prev) window.setTimeout(() => URL.revokeObjectURL(prev), 5000)
    }
    setMedia(slot, { url, kind, width: dims.width, height: dims.height, name })
    setStatus(null)
  } catch (err) {
    if (objectUrl) URL.revokeObjectURL(url)
    setStatus(err instanceof Error ? err.message : 'Could not load media')
  }
}

export function loadShotsFile(file: Blob, slot = 0) {
  if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
    useShots.getState().setStatus('Unsupported file type')
    return
  }
  const kind: MediaKind = file.type.startsWith('video/') ? 'video' : 'image'
  void loadShotsUrl(URL.createObjectURL(file), kind, file instanceof File ? file.name : null, slot, true)
}

export function loadShotsFiles(files: FileList | File[] | null | undefined, slot = 0) {
  if (!files) return
  const list = Array.from(files).filter((f) => f.type.startsWith('image/') || f.type.startsWith('video/'))
  // Several files at once fill the device slots in order.
  list.slice(0, 3).forEach((f, i) => loadShotsFile(f, slot + i))
  if (list.length > 1 && slot === 0) useShots.getState().setMockup({ count: Math.min(3, list.length) as 1 | 2 | 3 })
}

/** Paste, initial media (web upload, extension capture, ?media= link). */
export function useShotsMediaSources(initial: Blob | string | null | undefined, loadInitial: boolean) {
  const loadUrl = useCallback((url: string, kind: MediaKind, name: string | null) => loadShotsUrl(url, kind, name), [])
  const loadBlob = useCallback((blob: Blob) => loadShotsFile(blob), [])
  useInitialMedia(initial, loadUrl, loadBlob, loadInitial)
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
      const files: File[] = []
      for (const item of e.clipboardData?.items ?? []) {
        const f = item.kind === 'file' ? item.getAsFile() : null
        if (f && (f.type.startsWith('image/') || f.type.startsWith('video/'))) files.push(f)
      }
      if (files.length) {
        e.preventDefault()
        loadShotsFiles(files)
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [])
}


/** Reads an image or video file into a MediaState (object URL plus dimensions). */
export async function fileToMedia(file: File): Promise<MediaState | null> {
  if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) return null
  const kind: MediaKind = file.type.startsWith('video/') ? 'video' : 'image'
  const url = URL.createObjectURL(file)
  try {
    const dims = kind === 'video' ? await probeVideo(url) : await probeImage(url)
    return { url, kind, width: dims.width, height: dims.height, name: file.name }
  } catch {
    URL.revokeObjectURL(url)
    return null
  }
}

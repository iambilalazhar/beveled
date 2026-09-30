import { getChromeSafe, isExtensionRuntime } from '@/lib/env'
import { useCallback, useEffect } from 'react'
import { useEditor } from '../store'
import type { MediaKind } from '../types'

let currentObjectUrl: string | null = null

function releaseObjectUrl() {
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl)
    currentObjectUrl = null
  }
}

function probeImage(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => reject(new Error('Could not decode image'))
    img.src = url
  })
}

function probeVideo(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.onloadedmetadata = () => resolve({ width: video.videoWidth, height: video.videoHeight })
    video.onerror = () => reject(new Error('Could not decode video'))
    video.src = url
  })
}

export const ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime'

/** Loads images / videos from files, data URLs or object URLs into the store. */
export function useMediaLoader() {
  const setMedia = useEditor((s) => s.setMedia)
  const setStatus = useEditor((s) => s.setStatus)

  const loadUrl = useCallback(
    async (url: string, kind: MediaKind, name: string | null, isObjectUrl = false) => {
      try {
        const dims = kind === 'video' ? await probeVideo(url) : await probeImage(url)
        if (isObjectUrl) {
          releaseObjectUrl()
          currentObjectUrl = url
        }
        setMedia({ url, kind, width: dims.width, height: dims.height, name })
        setStatus(null)
      } catch (err) {
        if (isObjectUrl) URL.revokeObjectURL(url)
        setStatus(err instanceof Error ? err.message : 'Could not load media')
      }
    },
    [setMedia, setStatus]
  )

  const loadBlob = useCallback(
    async (blob: Blob, name?: string) => {
      const kind: MediaKind = blob.type.startsWith('video/') ? 'video' : 'image'
      if (!blob.type.startsWith('image/') && !blob.type.startsWith('video/')) {
        setStatus('Unsupported file type')
        return
      }
      const url = URL.createObjectURL(blob)
      await loadUrl(url, kind, name ?? (blob instanceof File ? blob.name : null), true)
    },
    [loadUrl, setStatus]
  )

  const loadFiles = useCallback(
    (files: FileList | File[] | null | undefined) => {
      if (!files) return
      const file = Array.from(files).find((f) => f.type.startsWith('image/') || f.type.startsWith('video/'))
      if (file) void loadBlob(file)
    },
    [loadBlob]
  )

  const clear = useCallback(() => {
    releaseObjectUrl()
    useEditor.getState().clearMedia()
  }, [])

  return { loadUrl, loadBlob, loadFiles, clear }
}

/** Global paste listener: pasting an image or video file sets the screen media. */
export function usePasteMedia(loadFiles: (files: FileList | File[]) => void) {
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
      const items = e.clipboardData?.items
      if (!items) return
      const files: File[] = []
      for (const item of items) {
        if (item.kind === 'file') {
          const f = item.getAsFile()
          if (f && (f.type.startsWith('image/') || f.type.startsWith('video/'))) files.push(f)
        }
      }
      if (files.length) {
        e.preventDefault()
        loadFiles(files)
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [loadFiles])
}

/** Initial media: the extension's latest capture, or whatever the host app handed us. */
export function useInitialMedia(initial: Blob | string | null | undefined, loadUrl: ReturnType<typeof useMediaLoader>['loadUrl'], loadBlob: ReturnType<typeof useMediaLoader>['loadBlob']) {
  useEffect(() => {
    if (isExtensionRuntime()) {
      const ch = getChromeSafe()
      ch?.storage?.local.get('latestCapture', (res) => {
        const capture = res?.latestCapture
        if (typeof capture === 'string' && capture) void loadUrl(capture, 'image', 'Latest capture')
      })
      return
    }
    if (initial) {
      if (typeof initial === 'string') void loadUrl(initial, 'image', null)
      else void loadBlob(initial)
      return
    }
    // Deep link: /editor?media=<image or video url>
    try {
      const param = new URLSearchParams(window.location.search).get('media')
      if (param) {
        const kind: MediaKind = /\.(mp4|webm|mov|m4v)(\?|$)/i.test(param) ? 'video' : 'image'
        void loadUrl(param, kind, param.split('/').pop() ?? null)
      }
    } catch {
      /* ignore malformed URLs */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial])
}

let audioObjectUrl: string | null = null

/** Loads a music / voiceover file as the project's audio track. */
export function useAudioLoader() {
  const setAudio = useEditor((s) => s.setAudio)
  const setStatus = useEditor((s) => s.setStatus)
  const loadAudioFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('audio/') && !/\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(file.name)) {
        setStatus('Unsupported audio file')
        return
      }
      const url = URL.createObjectURL(file)
      const duration = await new Promise<number>((resolve) => {
        const a = new Audio()
        a.preload = 'metadata'
        a.onloadedmetadata = () => resolve(a.duration || 0)
        a.onerror = () => resolve(0)
        a.src = url
      })
      if (!duration) {
        URL.revokeObjectURL(url)
        setStatus('Could not read that audio file')
        return
      }
      if (audioObjectUrl) URL.revokeObjectURL(audioObjectUrl)
      audioObjectUrl = url
      setAudio({ url, name: file.name, duration, offset: 0 })
      setStatus(`Added audio · ${file.name}`)
    },
    [setAudio, setStatus]
  )
  return { loadAudioFile }
}

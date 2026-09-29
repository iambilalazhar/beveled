import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import type { MediaState, ScreenFit } from '../types'

const placeholderCache = new Map<string, THREE.CanvasTexture>()

/** Renders a tasteful default wallpaper so an empty scene still looks like a product shot. */
export function getPlaceholderTexture(aspect: number): THREE.CanvasTexture {
  const key = aspect.toFixed(3)
  const cached = placeholderCache.get(key)
  if (cached) return cached
  const w = aspect >= 1 ? 1600 : Math.round(1600 * aspect)
  const h = aspect >= 1 ? Math.round(1600 / aspect) : 1600
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  const base = ctx.createLinearGradient(0, 0, w, h)
  base.addColorStop(0, '#111827')
  base.addColorStop(0.5, '#1f2937')
  base.addColorStop(1, '#0b1020')
  ctx.fillStyle = base
  ctx.fillRect(0, 0, w, h)
  const blobs: [number, number, number, string][] = [
    [0.2, 0.25, 0.55, 'rgba(224,93,56,0.75)'],
    [0.8, 0.3, 0.5, 'rgba(99,102,241,0.65)'],
    [0.55, 0.85, 0.6, 'rgba(14,165,233,0.55)'],
    [0.15, 0.85, 0.45, 'rgba(236,72,153,0.45)'],
  ]
  for (const [cx, cy, r, color] of blobs) {
    const g = ctx.createRadialGradient(cx * w, cy * h, 0, cx * w, cy * h, r * Math.max(w, h))
    g.addColorStop(0, color)
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  }
  // Subtle UI hint: a card with the wordmark
  const cardW = Math.min(w, h) * 0.62
  const cardH = cardW * 0.42
  const cx = w / 2
  const cy = h / 2
  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'
  ctx.lineWidth = 3
  roundRect(ctx, cx - cardW / 2, cy - cardH / 2, cardW, cardH, cardW * 0.06)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `700 ${Math.round(cardW * 0.11)}px Poppins, Inter, system-ui, sans-serif`
  ctx.fillText('beveled', cx, cy - cardH * 0.12)
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.font = `500 ${Math.round(cardW * 0.045)}px Inter, system-ui, sans-serif`
  ctx.fillText('Drop a screenshot or video to begin', cx, cy + cardH * 0.2)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  placeholderCache.set(key, texture)
  return texture
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export type MediaTexture = { texture: THREE.Texture; aspect: number; isPlaceholder: boolean }

/** Loads the current media (image or video) into a texture. Falls back to the placeholder wallpaper. */
export function useMediaTexture(media: MediaState, fallbackAspect: number): MediaTexture {
  const [loaded, setLoaded] = useState<{ url: string; texture: THREE.Texture; aspect: number } | null>(null)

  useEffect(() => {
    if (!media.url) {
      setLoaded(null)
      return
    }
    let cancelled = false
    let texture: THREE.Texture | null = null
    let video: HTMLVideoElement | null = null
    if (media.kind === 'video') {
      video = document.createElement('video')
      video.src = media.url
      video.crossOrigin = 'anonymous'
      video.loop = true
      video.muted = true
      video.playsInline = true
      video.autoplay = true
      const vt = new THREE.VideoTexture(video)
      vt.colorSpace = THREE.SRGBColorSpace
      vt.minFilter = THREE.LinearFilter
      vt.magFilter = THREE.LinearFilter
      vt.generateMipmaps = false
      texture = vt
      const onReady = () => {
        if (cancelled || !video) return
        setLoaded({ url: media.url!, texture: vt, aspect: video.videoWidth / Math.max(1, video.videoHeight) })
        void video.play().catch(() => undefined)
      }
      video.addEventListener('loadedmetadata', onReady, { once: true })
      video.load()
    } else {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        if (cancelled) return
        const t = new THREE.Texture(img)
        t.colorSpace = THREE.SRGBColorSpace
        t.anisotropy = 8
        t.generateMipmaps = true
        t.minFilter = THREE.LinearMipmapLinearFilter
        t.needsUpdate = true
        texture = t
        setLoaded({ url: media.url!, texture: t, aspect: img.naturalWidth / Math.max(1, img.naturalHeight) })
      }
      img.src = media.url
    }
    return () => {
      cancelled = true
      if (video) {
        video.pause()
        video.removeAttribute('src')
        video.load()
      }
      texture?.dispose()
    }
  }, [media.url, media.kind])

  return useMemo(() => {
    if (loaded && loaded.url === media.url) {
      return { texture: loaded.texture, aspect: loaded.aspect, isPlaceholder: false }
    }
    return { texture: getPlaceholderTexture(fallbackAspect), aspect: fallbackAspect, isPlaceholder: true }
  }, [loaded, media.url, fallbackAspect])
}

export type FitResult = {
  /** Plane size in local screen coordinates (x = short side in portrait). */
  planeW: number
  planeH: number
  repeat: [number, number]
  rotation: number
}

/**
 * Computes how to place a media texture on a screen of `screenW`×`screenH`.
 * When `rotated` (landscape orientation of a portrait device) the image is rotated 90°.
 */
export function computeFit(
  screenW: number,
  screenH: number,
  mediaAspect: number,
  fit: ScreenFit,
  rotated: boolean
): FitResult {
  const effW = rotated ? screenH : screenW
  const effH = rotated ? screenW : screenH
  const screenAspect = effW / effH
  const rotation = rotated ? -Math.PI / 2 : 0
  if (fit === 'stretch') {
    return { planeW: screenW, planeH: screenH, repeat: [1, 1], rotation }
  }
  if (fit === 'contain') {
    let fw = effW
    let fh = effH
    if (mediaAspect > screenAspect) fh = fw / mediaAspect
    else fw = fh * mediaAspect
    return { planeW: rotated ? fh : fw, planeH: rotated ? fw : fh, repeat: [1, 1], rotation }
  }
  // cover
  if (mediaAspect > screenAspect) {
    return { planeW: screenW, planeH: screenH, repeat: [screenAspect / mediaAspect, 1], rotation }
  }
  return { planeW: screenW, planeH: screenH, repeat: [1, mediaAspect / screenAspect], rotation }
}

import { useEffect } from 'react'

export function useHiDPICanvas(
  canvas: HTMLCanvasElement | null,
  cssWidth: number,
  cssHeight: number
) {
  useEffect(() => {
    if (!canvas) return
    const dpr = Math.max(1, Math.round(window.devicePixelRatio || 1))
    canvas.width = Math.max(1, Math.floor(cssWidth * dpr))
    canvas.height = Math.max(1, Math.floor(cssHeight * dpr))
    canvas.style.width = `${Math.max(1, Math.floor(cssWidth))}px`
    canvas.style.height = `${Math.max(1, Math.floor(cssHeight))}px`
    const ctx = canvas.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }, [canvas, cssWidth, cssHeight])
}


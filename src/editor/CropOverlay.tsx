import React from 'react'
import type { Rect } from './types'

export function CropOverlay({
  canvas,
  stage,
  selection,
  setSelection,
  bounds,
  aspectLocked,
  baseAspect,
  scale = 1,
}: {
  canvas: HTMLCanvasElement | null
  stage: HTMLDivElement | null
  selection: Rect
  setSelection: (r: Rect) => void
  bounds: Rect // clamp to content area (CSS px)
  aspectLocked: boolean
  baseAspect: number // w/h when locking
  scale?: number
}) {
  if (!canvas || !stage) return null
  const sRect = stage.getBoundingClientRect()
  const cRect = canvas.getBoundingClientRect()
  const left = cRect.left - sRect.left + selection.x * scale
  const top = cRect.top - sRect.top + selection.y * scale
  const canvasLeft = cRect.left - sRect.left
  const canvasTop = cRect.top - sRect.top

  const clampToBounds = (r: Rect): Rect => {
    const x = Math.min(Math.max(r.x, bounds.x), bounds.x + bounds.w - r.w)
    const y = Math.min(Math.max(r.y, bounds.y), bounds.y + bounds.h - r.h)
    const w = Math.min(Math.max(r.w, 10), bounds.w - (x - bounds.x))
    const h = Math.min(Math.max(r.h, 10), bounds.h - (y - bounds.y))
    return { x, y, w, h }
  }

  const onDrag = (e: React.PointerEvent) => {
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    const startX = e.clientX
    const startY = e.clientY
    const start = { ...selection }
    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) / scale
      const dy = (ev.clientY - startY) / scale
      setSelection(clampToBounds({ ...start, x: start.x + dx, y: start.y + dy }))
    }
    const up = () => {
      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const handle = (pos: 'n' | 's' | 'w' | 'e' | 'nw' | 'ne' | 'sw' | 'se') => (e: React.PointerEvent) => {
    e.stopPropagation()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    const startX = e.clientX
    const startY = e.clientY
    const s = { ...selection }
    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) / scale
      const dy = (ev.clientY - startY) / scale
      let x = s.x
      let y = s.y
      let w = s.w
      let h = s.h
      if (pos.includes('e')) w = Math.max(10, s.w + dx)
      if (pos.includes('s')) h = Math.max(10, s.h + dy)
      if (pos.includes('w')) { x = s.x + dx; w = Math.max(10, s.w - dx) }
      if (pos.includes('n')) { y = s.y + dy; h = Math.max(10, s.h - dy) }
      if (aspectLocked) {
        const target = baseAspect
        // adjust w/h to maintain aspect around the moving corner/edge
        if (pos === 'e' || pos === 'w') h = Math.round(w / target)
        else if (pos === 'n' || pos === 's') w = Math.round(h * target)
        else {
          // corner: choose dominant delta
          const byWidth = Math.abs(dx) >= Math.abs(dy)
          if (byWidth) h = Math.round(w / target)
          else w = Math.round(h * target)
          // adjust origin if shrinking from north/west
          if (pos.includes('w')) x = s.x + (s.w - w)
          if (pos.includes('n')) y = s.y + (s.h - h)
        }
      }
      setSelection(clampToBounds({ x, y, w, h }))
    }
    const up = () => {
      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <>
      {/* dim outside area with four rects around selection */}
      <div className="absolute bg-black/40 pointer-events-none" style={{ left: canvasLeft + bounds.x * scale, top: canvasTop + bounds.y * scale, width: selection.x * scale - bounds.x * scale, height: bounds.h * scale }} />
      <div className="absolute bg-black/40 pointer-events-none" style={{ left: canvasLeft + (selection.x + selection.w) * scale, top: canvasTop + bounds.y * scale, width: (bounds.x + bounds.w - (selection.x + selection.w)) * scale, height: bounds.h * scale }} />
      <div className="absolute bg-black/40 pointer-events-none" style={{ left: canvasLeft + selection.x * scale, top: canvasTop + bounds.y * scale, width: selection.w * scale, height: (selection.y - bounds.y) * scale }} />
      <div className="absolute bg-black/40 pointer-events-none" style={{ left: canvasLeft + selection.x * scale, top: canvasTop + (selection.y + selection.h) * scale, width: selection.w * scale, height: (bounds.y + bounds.h - (selection.y + selection.h)) * scale }} />

      <div
        className="absolute border-2 border-blue-500/80 bg-blue-500/5"
        style={{ left, top, width: selection.w * scale, height: selection.h * scale }}
        onPointerDown={onDrag}
      >
        {/* edge handles */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-2 h-4 w-4 rounded-full bg-blue-500 border border-white/80 cursor-n-resize" onPointerDown={handle('n')} />
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 h-4 w-4 rounded-full bg-blue-500 border border-white/80 cursor-s-resize" onPointerDown={handle('s')} />
        <div className="absolute top-1/2 -translate-y-1/2 -left-2 h-4 w-4 rounded-full bg-blue-500 border border-white/80 cursor-w-resize" onPointerDown={handle('w')} />
        <div className="absolute top-1/2 -translate-y-1/2 -right-2 h-4 w-4 rounded-full bg-blue-500 border border-white/80 cursor-e-resize" onPointerDown={handle('e')} />
      <div className="absolute -top-2 -left-2 h-4 w-4 rounded-full bg-blue-500 border border-white/80 cursor-nw-resize" onPointerDown={handle('nw')} />
      <div className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-blue-500 border border-white/80 cursor-ne-resize" onPointerDown={handle('ne')} />
      <div className="absolute -bottom-2 -left-2 h-4 w-4 rounded-full bg-blue-500 border border-white/80 cursor-sw-resize" onPointerDown={handle('sw')} />
      <div className="absolute -bottom-2 -right-2 h-4 w-4 rounded-full bg-blue-500 border border-white/80 cursor-se-resize" onPointerDown={handle('se')} />
      </div>
    </>
  )
}

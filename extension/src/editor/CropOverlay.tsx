import React from 'react'
import type { Rect } from './types'

export function CropOverlay({
  canvas,
  stage,
  selection,
  setSelection,
}: {
  canvas: HTMLCanvasElement | null
  stage: HTMLDivElement | null
  selection: Rect
  setSelection: (r: Rect) => void
}) {
  if (!canvas || !stage) return null
  const sRect = stage.getBoundingClientRect()
  const cRect = canvas.getBoundingClientRect()
  const left = cRect.left - sRect.left + selection.x
  const top = cRect.top - sRect.top + selection.y

  const onDrag = (e: React.PointerEvent) => {
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    const startX = e.clientX
    const startY = e.clientY
    const start = { ...selection }
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      setSelection({ ...start, x: start.x + dx, y: start.y + dy })
    }
    const up = () => {
      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const handle = (pos: 'nw' | 'ne' | 'sw' | 'se') => (e: React.PointerEvent) => {
    e.stopPropagation()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    const startX = e.clientX
    const startY = e.clientY
    const s = { ...selection }
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      if (pos === 'se') setSelection({ x: s.x, y: s.y, w: Math.max(10, s.w + dx), h: Math.max(10, s.h + dy) })
      if (pos === 'nw') setSelection({ x: s.x + dx, y: s.y + dy, w: Math.max(10, s.w - dx), h: Math.max(10, s.h - dy) })
      if (pos === 'ne') setSelection({ x: s.x, y: s.y + dy, w: Math.max(10, s.w + dx), h: Math.max(10, s.h - dy) })
      if (pos === 'sw') setSelection({ x: s.x + dx, y: s.y, w: Math.max(10, s.w - dx), h: Math.max(10, s.h + dy) })
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
    <div
      className="absolute border-2 border-blue-500/80 bg-blue-500/10"
      style={{ left, top, width: selection.w, height: selection.h }}
      onPointerDown={onDrag}
    >
      <div className="absolute -top-2 -left-2 h-4 w-4 rounded-full bg-blue-500 border border-white/80 cursor-nw-resize" onPointerDown={handle('nw')} />
      <div className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-blue-500 border border-white/80 cursor-ne-resize" onPointerDown={handle('ne')} />
      <div className="absolute -bottom-2 -left-2 h-4 w-4 rounded-full bg-blue-500 border border-white/80 cursor-sw-resize" onPointerDown={handle('sw')} />
      <div className="absolute -bottom-2 -right-2 h-4 w-4 rounded-full bg-blue-500 border border-white/80 cursor-se-resize" onPointerDown={handle('se')} />
    </div>
  )
}


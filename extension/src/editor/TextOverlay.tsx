import React from 'react'
import type { TextNode } from './types'

export function TextOverlay({
  canvas,
  stage,
  scale = 1,
  texts,
  selectedId,
  onSelect,
  onChange,
  // onCreate is reserved for future add-on creation gestures
}: {
  canvas: HTMLCanvasElement | null
  stage: HTMLDivElement | null
  scale?: number
  texts: TextNode[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onChange: (id: string, patch: Partial<TextNode>) => void
  onCreate?: (x: number, y: number) => void
}) {
  if (!canvas || !stage) return null
  const sRect = stage.getBoundingClientRect()
  const cRect = canvas.getBoundingClientRect()
  const baseLeft = cRect.left - sRect.left
  const baseTop = cRect.top - sRect.top

  return (
    <>
      {texts.map((t) => {
        const left = baseLeft + t.x * scale
        const top = baseTop + t.y * scale
        const isSel = t.id === selectedId
        const onDrag = (e: React.PointerEvent) => {
          ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
          const startX = e.clientX
          const startY = e.clientY
          const sx = t.x
          const sy = t.y
          const move = (ev: PointerEvent) => {
            const dx = (ev.clientX - startX) / scale
            const dy = (ev.clientY - startY) / scale
            onChange(t.id, { x: sx + dx, y: sy + dy })
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
            key={t.id}
            className={`absolute ${isSel ? 'ring-2 ring-blue-500/70' : ''}`}
            style={{ left, top, cursor: 'move' }}
            onPointerDown={(e) => {
              e.stopPropagation()
              onSelect(t.id)
              // Do not start drag when pressing inside the editable content to allow typing
              if ((e.target as HTMLElement).getAttribute('data-editable') === 'true') return
              onDrag(e as any)
            }}
          >
            <div
              contentEditable
              suppressContentEditableWarning
              data-editable="true"
              className="min-w-10 min-h-5 px-1 outline-none bg-transparent text-white"
              style={{
                fontFamily: t.fontFamily,
                fontSize: t.fontSize * scale,
                fontWeight: t.bold ? 700 : 400,
                fontStyle: t.italic ? 'italic' : 'normal',
                textAlign: t.align as any,
                WebkitTextStroke: t.outline ? `${Math.max(0, t.outlineWidth * scale)}px ${t.outlineColor}` : undefined,
                color: t.color,
                whiteSpace: 'pre',
              }}
              onBlur={(e) => onChange(t.id, { text: e.currentTarget.innerText })}
              onInput={(e) => onChange(t.id, { text: (e.currentTarget as HTMLElement).innerText })}
            >
              {t.text}
            </div>
          </div>
        )
      })}
    </>
  )
}

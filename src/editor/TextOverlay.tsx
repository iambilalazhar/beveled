import * as React from 'react'
import type { TextNode } from './types'

const TEXT_CLIP = 'text' as unknown as React.CSSProperties['backgroundClip']
const WEBKIT_TEXT_CLIP = 'text'

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const parse = (s: string) => parseInt(s, 16)
  const r = h.length === 3 ? parse(h[0] + h[0]) : parse(h.slice(0, 2))
  const g = h.length === 3 ? parse(h[1] + h[1]) : parse(h.slice(2, 4))
  const b = h.length === 3 ? parse(h[2] + h[2]) : parse(h.slice(4, 6))
  const a = Math.min(1, Math.max(0, alpha))
  return `rgba(${r}, ${g}, ${b}, ${a})`
}
import LexicalText from './LexicalText'

export function TextOverlay({
  canvas,
  stage,
  scale = 1,
  texts,
  selectedId,
  onSelect,
  onChange,
  // onCreate is reserved for future add-on creation gestures
  contentOrigin,
}: {
  canvas: HTMLCanvasElement | null
  stage: HTMLDivElement | null
  scale?: number
  texts: TextNode[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onChange: (id: string, patch: Partial<TextNode>) => void
  onCreate?: (x: number, y: number) => void
  contentOrigin: { x: number; y: number }
}) {
  if (!canvas || !stage) return null
  const sRect = stage.getBoundingClientRect()
  const cRect = canvas.getBoundingClientRect()
  const baseLeft = cRect.left - sRect.left
  const baseTop = cRect.top - sRect.top

  return (
    <>
      {texts.map((t) => {
        const isContentAnchored = (t.positionAnchor ?? 'content') === 'content'
        const left = isContentAnchored
          ? baseLeft + (contentOrigin.x + t.x) * scale
          : baseLeft + t.x * scale
        const top = isContentAnchored
          ? baseTop + (contentOrigin.y + t.y) * scale
          : baseTop + t.y * scale
        const isSel = t.id === selectedId
        const shadowCol = hexToRgba(t.shadowColor ?? '#000000', t.shadow ? (t.shadowAlpha ?? 0.5) : 0)
        return (
          <div
            key={t.id}
            className={`absolute ${isSel ? 'ring-2 ring-blue-500/70' : ''}`}
            data-text-id={t.id}
            style={{
              left,
              top,
              cursor: 'move',
              // Align the wrapper around the anchor X so centered/right-aligned
              // texts are truly centered relative to t.x (matches canvas rendering)
              transform: t.align === 'center' ? 'translate(-50%, 0)' : (t.align === 'right' ? 'translate(-100%, 0)' : 'none'),
              // Visual background/shadow mirror for live editing
              background: t.background
                ? (t.backgroundType === 'linear'
                    ? undefined
                    : hexToRgba(t.backgroundColor ?? '#000000', t.backgroundAlpha ?? 0.8))
                : 'transparent',
              backgroundImage: t.background && t.backgroundType === 'linear'
                ? `linear-gradient(${t.backgroundAngle ?? 90}deg, ${hexToRgba(t.backgroundColor ?? '#111827', t.backgroundAlpha ?? 0.8)}, ${hexToRgba(t.backgroundColor2 ?? '#374151', t.backgroundAlpha ?? 0.8)})`
                : undefined,
              borderRadius: t.background ? (t.backgroundRadius ?? 6) : undefined,
              paddingLeft: t.background ? (t.backgroundPaddingX ?? 6) : undefined,
              paddingRight: t.background ? (t.backgroundPaddingX ?? 6) : undefined,
              paddingTop: t.background ? (t.backgroundPaddingY ?? 2) : undefined,
              paddingBottom: t.background ? (t.backgroundPaddingY ?? 2) : undefined,
              boxShadow: t.shadow && t.background ? `${t.shadowOffsetX ?? 0}px ${t.shadowOffsetY ?? 2}px ${t.shadowBlur ?? 8}px ${shadowCol}` : undefined,
            }}
            onPointerDown={(e) => {
              e.stopPropagation()
              onSelect(t.id)
              const isEditable = (e.target as HTMLElement).getAttribute('data-editable') === 'true'
              if (isEditable && document.activeElement === e.target) {
                // Already editing: allow native text selection and caret movement
                return
              }
              // Drag threshold so click focuses editor, drag moves element
              const wrapper = e.currentTarget as HTMLElement
              wrapper.setPointerCapture(e.pointerId)
              const startX = e.clientX
              const startY = e.clientY
              const sx = t.x
              const sy = t.y
              let moved = false
              const move = (ev: PointerEvent) => {
                const dx = (ev.clientX - startX) / scale
                const dy = (ev.clientY - startY) / scale
                if (!moved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) moved = true
                if (moved) onChange(t.id, { x: sx + dx, y: sy + dy })
              }
              const up = () => {
                wrapper.releasePointerCapture(e.pointerId)
                window.removeEventListener('pointermove', move)
                window.removeEventListener('pointerup', up)
                if (!moved) {
                  // Focus editable on click
                  const editable = wrapper.querySelector('[data-editable="true"]') as HTMLElement | null
                  editable?.focus()
                }
              }
              window.addEventListener('pointermove', move)
              window.addEventListener('pointerup', up)
            }}
          >
            <LexicalText
              value={t.text}
              onChange={(val) => onChange(t.id, { text: val })}
              className="min-w-10 min-h-5 px-1 outline-none bg-transparent text-white"
              style={{
                fontFamily: t.fontFamily,
                fontSize: t.fontSize * scale,
                fontWeight: t.bold ? 700 : 400,
                fontStyle: t.italic ? 'italic' : 'normal',
                textAlign: t.align,
                WebkitTextStroke: t.outline ? `${Math.max(0, t.outlineWidth * scale)}px ${t.outlineColor}` : undefined,
                color: (t.fillType ?? 'solid') === 'solid' ? t.color : undefined,
                backgroundImage: (t.fillType ?? 'solid') === 'linear' ? `linear-gradient(${t.backgroundAngle ?? 0}deg, ${t.color}, ${t.fillColor2 ?? t.color})` : undefined,
                WebkitBackgroundClip: (t.fillType ?? 'solid') === 'linear' ? WEBKIT_TEXT_CLIP : undefined,
                backgroundClip: (t.fillType ?? 'solid') === 'linear' ? TEXT_CLIP : undefined,
                WebkitTextFillColor: (t.fillType ?? 'solid') === 'linear' ? 'transparent' : undefined,
                textShadow: t.shadow && !t.background ? `${t.shadowOffsetX ?? 0}px ${t.shadowOffsetY ?? 2}px ${t.shadowBlur ?? 8}px ${shadowCol}` : undefined,
                whiteSpace: 'pre',
              }}
              singleLine={t.id === 'title' || t.id === 'subtitle'}
            />
          </div>
        )
      })}
    </>
  )
}


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
        const left = baseLeft + (contentOrigin.x + t.x) * scale
        const top = baseTop + (contentOrigin.y + t.y) * scale
        const isSel = t.id === selectedId
        return (
          <div
            key={t.id}
            className={`absolute ${isSel ? 'ring-2 ring-blue-500/70' : ''}`}
            style={{ left, top, cursor: 'move' }}
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
            <div
              contentEditable
              suppressContentEditableWarning
              data-editable="true"
              dir="ltr"
              className="min-w-10 min-h-5 px-1 outline-none bg-transparent text-white"
              style={{
                fontFamily: t.fontFamily,
                fontSize: t.fontSize * scale,
                fontWeight: t.bold ? 700 : 400,
                fontStyle: t.italic ? 'italic' : 'normal',
                textAlign: t.align as any,
                direction: 'ltr',
                unicodeBidi: 'bidi-override',
                writingMode: 'horizontal-tb',
                WebkitTextStroke: t.outline ? `${Math.max(0, t.outlineWidth * scale)}px ${t.outlineColor}` : undefined,
                color: t.color,
                whiteSpace: 'pre',
              }}
              onBlur={(e) => onChange(t.id, { text: e.currentTarget.innerText.replace(/^\u200E/, '') })}
              onInput={(e) => onChange(t.id, { text: (e.currentTarget as HTMLElement).innerText.replace(/^\u200E/, '') })}
              onKeyDown={(e) => {
                // Prevent any RTL shortcuts
                if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
                  e.preventDefault()
                }
              }}
            >
              {'\u200E' + t.text}
            </div>
          </div>
        )
      })}
    </>
  )
}

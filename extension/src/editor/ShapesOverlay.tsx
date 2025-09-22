import React from 'react'
import type { ShapeNode } from './types'

type Handle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

function getCursor(handle: Handle): string {
  switch (handle) {
    case 'n': return 'ns-resize'
    case 's': return 'ns-resize'
    case 'e': return 'ew-resize'
    case 'w': return 'ew-resize'
    case 'ne': return 'nesw-resize'
    case 'sw': return 'nesw-resize'
    case 'nw': return 'nwse-resize'
    case 'se': return 'nwse-resize'
  }
}

export function ShapesOverlay({
  canvas,
  stage,
  scale = 1,
  shapes,
  selectedId,
  onSelect,
  onChange,
  onRemove,
  snapToGrid = false,
  contentOrigin,
}: {
  canvas: HTMLCanvasElement | null
  stage: HTMLDivElement | null
  scale?: number
  shapes: ShapeNode[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onChange: (id: string, patch: Partial<ShapeNode>) => void
  onRemove: (id: string) => void
  snapToGrid?: boolean
  contentOrigin: { x: number; y: number }
}) {
  if (!canvas || !stage) return null
  const sRect = stage.getBoundingClientRect()
  const cRect = canvas.getBoundingClientRect()
  const baseLeft = cRect.left - sRect.left
  const baseTop = cRect.top - sRect.top

  const handles: Handle[] = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se']
  const GRID = 8
  const snap = (v: number) => (snapToGrid ? Math.round(v / GRID) * GRID : v)

  return (
    <>
      {shapes.map((s) => {
        const isContentAnchored = (s.positionAnchor ?? 'content') === 'content'
        const baseX = isContentAnchored
          ? baseLeft + (contentOrigin.x + s.x) * scale
          : baseLeft + s.x * scale
        const baseY = isContentAnchored
          ? baseTop + (contentOrigin.y + s.y) * scale
          : baseTop + s.y * scale
        const width = Math.abs(s.w * scale)
        const height = Math.abs(s.h * scale)
        const left = s.w >= 0 ? baseX : baseX + s.w * scale
        const top = s.h >= 0 ? baseY : baseY + s.h * scale
        const isSel = s.id === selectedId
        // For line/arrow, expose a simple bbox to drag/resize; endpoints at nw and se
        return (
          <div
            key={s.id}
            className={`absolute border ${isSel ? 'border-blue-500/70' : 'border-transparent'} select-none`}
            data-shape-id={s.id}
            style={{ left, top, width, height, outline: isSel ? '2px solid rgba(59,130,246,0.5)' : undefined, cursor: 'move' }}
            onPointerDown={(e) => {
              e.stopPropagation()
              const target = e.currentTarget as HTMLElement
              target.setPointerCapture(e.pointerId)
              onSelect(s.id)
              const startX = e.clientX
              const startY = e.clientY
              const sx = s.x
              const sy = s.y
              const move = (ev: PointerEvent) => {
                const dx = (ev.clientX - startX) / scale
                const dy = (ev.clientY - startY) / scale
                onChange(s.id, { x: snap(sx + dx), y: snap(sy + dy) })
              }
              const up = () => {
                target.releasePointerCapture(e.pointerId)
                window.removeEventListener('pointermove', move)
                window.removeEventListener('pointerup', up)
              }
              window.addEventListener('pointermove', move)
              window.addEventListener('pointerup', up)
            }}
          >
            {/* Rotate handle */}
            {isSel && (
              <div
                title="Rotate"
                style={{ position: 'absolute', left: '50%', top: -16, transform: 'translate(-50%, -50%)', width: 12, height: 12, background: '#10b981', border: '1px solid white', borderRadius: 9999, cursor: 'grab' }}
                onPointerDown={(e) => {
                  e.stopPropagation()
                  const target = e.currentTarget as HTMLElement
                  target.setPointerCapture(e.pointerId)
                  const cx = left + width / 2
                  const cy = top + height / 2
                  // screen coords
                  const startAngle = Math.atan2(e.clientY - (sRect.top + cy), e.clientX - (sRect.left + cx))
                  const baseRot = s.rotation ?? 0
                  const baseVec = { w: s.w, h: s.h }
                  const center = { x: s.x + s.w / 2, y: s.y + s.h / 2 }
                  const move = (ev: PointerEvent) => {
                    const curAngle = Math.atan2(ev.clientY - (sRect.top + cy), ev.clientX - (sRect.left + cx))
                    let delta = curAngle - startAngle
                    if (ev.shiftKey) {
                      const step = (15 * Math.PI) / 180
                      delta = Math.round(delta / step) * step
                    }
                    if (s.type === 'line' || s.type === 'arrow') {
                      // rotate vector around center
                      const lenW = baseVec.w / 2
                      const lenH = baseVec.h / 2
                      const cos = Math.cos(delta)
                      const sin = Math.sin(delta)
                      const rx = lenW * cos - lenH * sin
                      const ry = lenW * sin + lenH * cos
                      const newW = rx * 2
                      const newH = ry * 2
                      onChange(s.id, {
                        x: center.x - newW / 2,
                        y: center.y - newH / 2,
                        w: newW,
                        h: newH,
                      })
                    } else {
                      let deg = baseRot + (delta * 180) / Math.PI
                      // normalize
                      if (!isFinite(deg)) deg = 0
                      while (deg <= -180) deg += 360
                      while (deg > 180) deg -= 360
                      onChange(s.id, { rotation: deg })
                    }
                  }
                  const up = () => {
                    target.releasePointerCapture(e.pointerId)
                    window.removeEventListener('pointermove', move)
                    window.removeEventListener('pointerup', up)
                  }
                  window.addEventListener('pointermove', move)
                  window.addEventListener('pointerup', up)
                }}
              />
            )}
            {isSel && (!s.rotation || s.rotation === 0 || s.type === 'line' || s.type === 'arrow') && handles.map((h) => {
              const size = 8
              const style: React.CSSProperties = { position: 'absolute', width: size, height: size, background: '#3b82f6', border: '1px solid white', borderRadius: 2, transform: 'translate(-50%, -50%)', cursor: getCursor(h) }
              switch (h) {
                case 'nw': style.left = 0; style.top = 0; break
                case 'n': style.left = '50%'; style.top = 0; break
                case 'ne': style.left = '100%'; style.top = 0; break
                case 'w': style.left = 0; style.top = '50%'; break
                case 'e': style.left = '100%'; style.top = '50%'; break
                case 'sw': style.left = 0; style.top = '100%'; break
                case 's': style.left = '50%'; style.top = '100%'; break
                case 'se': style.left = '100%'; style.top = '100%'; break
              }
              return (
                <div
                  key={h}
                  data-handle={h}
                  style={style}
                  onPointerDown={(e) => {
                    e.stopPropagation()
                    const target = e.currentTarget as HTMLElement
                    target.setPointerCapture(e.pointerId)
                    onSelect(s.id)
                    const startX = e.clientX
                    const startY = e.clientY
                    const sx = s.x
                    const sy = s.y
                    const sw = s.w
                    const sh = s.h
                    const move = (ev: PointerEvent) => {
                      const dx = (ev.clientX - startX) / scale
                      const dy = (ev.clientY - startY) / scale
                      let nx = sx
                      let ny = sy
                      let nw = sw
                      let nh = sh
                      if (h.includes('w')) { nx = sx + dx; nw = sw - dx }
                      if (h.includes('e')) { nw = sw + dx }
                      if (h.includes('n')) { ny = sy + dy; nh = sh - dy }
                      if (h.includes('s')) { nh = sh + dy }

                      if (ev.shiftKey) {
                        if (s.type === 'rectangle' || s.type === 'circle' || s.type === 'triangle') {
                          const ratio = s.type === 'circle' ? 1 : (Math.abs(sw) / Math.max(1e-6, Math.abs(sh)))
                          // adjust nw/nh to maintain ratio from the anchor side
                          if (h === 'e' || h === 'w') {
                            nh = Math.sign(nh) * Math.abs(nw) / Math.max(1e-6, ratio)
                            ny = sy + (sh - nh) * (h === 'w' ? 1 : 0)
                          } else if (h === 'n' || h === 's') {
                            nw = Math.sign(nw) * Math.abs(nh) * ratio
                            nx = sx + (sw - nw) * (h === 'n' ? 1 : 0)
                          } else {
                            // corner: compute based on larger delta
                            const useW = Math.abs(nw - sw) > Math.abs(nh - sh)
                            if (useW) nh = Math.sign(nh) * Math.abs(nw) / Math.max(1e-6, ratio)
                            else nw = Math.sign(nw) * Math.abs(nh) * ratio
                            // adjust origin to keep the correct anchor behavior
                            nx = (h.includes('w')) ? sx + (sw - nw) : sx
                            ny = (h.includes('n')) ? sy + (sh - nh) : sy
                          }
                        }
                      }

                      if (s.type === 'line' || s.type === 'arrow') {
                        // For lines/arrows, allow angle snapping with Shift
                        const cx = sx + sw / 2
                        const cy = sy + sh / 2
                        const anchorX = h.includes('w') ? nx : sx
                        const anchorY = h.includes('n') ? ny : sy
                        let vx = (anchorX === sx ? nx + nw : anchorX) - cx
                        let vy = (anchorY === sy ? ny + nh : anchorY) - cy
                        const len = Math.hypot(vx, vy)
                        if (ev.shiftKey && len > 0) {
                          const ang = Math.atan2(vy, vx)
                          const snap = Math.round(ang / (Math.PI / 4)) * (Math.PI / 4)
                          vx = Math.cos(snap) * len
                          vy = Math.sin(snap) * len
                          nw = vx * 2
                          nh = vy * 2
                          nx = cx - nw / 2
                          ny = cy - nh / 2
                        }
                      }

                      onChange(s.id, { x: snap(nx), y: snap(ny), w: snap(nw), h: snap(nh) })
                    }
                    const up = () => {
                      target.releasePointerCapture(e.pointerId)
                      window.removeEventListener('pointermove', move)
                      window.removeEventListener('pointerup', up)
                    }
                    window.addEventListener('pointermove', move)
                    window.addEventListener('pointerup', up)
                  }}
                />
              )
            })}
            {isSel && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRemove(s.id) }}
                title="Delete"
                className="absolute -top-3 -right-3 z-10 w-6 h-6 rounded-full bg-destructive text-destructive-foreground text-xs leading-6 text-center shadow"
              >
                ×
              </button>
            )}
          </div>
        )
      })}
    </>
  )
}

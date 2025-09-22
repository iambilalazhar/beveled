import { drawRoundedRect, clipRect } from './canvas-utils'
import type { BgPreset, LinearGradient, Pattern, WindowStyle } from '@/components/app-sidebar'
import type { TextNode, ShapeNode } from './types'

type RenderParams = {
  bgPreset: BgPreset
  padding: { x: number; y: number }
  shadowEnabled: boolean
  shadowColor: string
  shadowOpacity: number
  shadowBlur: number
  shadowOffsetX: number
  shadowOffsetY: number
  showWindow: boolean
  windowStyle: WindowStyle
  windowBarColor: string
  windowBar: number
  cornerRadius: number
  image: HTMLImageElement
  cropRect: { x: number; y: number; w: number; h: number } | null
  scaledW: number
  scaledH: number
  offsetX: number
  offsetY: number
  shapes?: ShapeNode[]
  texts?: TextNode[]
}

export type LayoutInfo = {
  contentX: number
  contentY: number
  scaledW: number
  scaledH: number
}

export function renderComposition(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  p: RenderParams
): LayoutInfo {
  const { bgPreset, padding, shadowEnabled, shadowColor, shadowOpacity, shadowBlur, shadowOffsetX, shadowOffsetY, showWindow, windowStyle, windowBarColor, windowBar, cornerRadius, image, cropRect, scaledW, scaledH, offsetX, offsetY, shapes, texts } = p

  // Clear
  ctx.clearRect(0, 0, canvasW, canvasH)

  // Background
  if (bgPreset.type === 'solid') {
    ctx.fillStyle = bgPreset.color
    ctx.fillRect(0, 0, canvasW, canvasH)
  } else if (bgPreset.type === 'linear') {
    const g = createLinearGrad(ctx, canvasW, canvasH, bgPreset)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, canvasW, canvasH)
  } else {
    fillPattern(ctx, canvasW, canvasH, bgPreset)
  }

  const extraTop = showWindow ? windowBar : 0
  const contentX = padding.x + offsetX
  const contentY = padding.y + extraTop + offsetY

  if (showWindow) {
    const winX = padding.x + offsetX
    const winY = padding.y + offsetY
    const winW = scaledW
    const winH = scaledH + windowBar
    
    // Draw window shadow
    if (shadowEnabled) {
      ctx.save()
      ctx.shadowColor = hexToRgba(shadowColor, Math.min(1, Math.max(0, shadowOpacity)))
      ctx.shadowBlur = Math.max(0, shadowBlur)
      ctx.shadowOffsetX = shadowOffsetX
      ctx.shadowOffsetY = shadowOffsetY
      ctx.fillStyle = '#ffffff'
      drawRoundedRect(ctx, winX, winY, winW, winH, cornerRadius)
      ctx.fill()
      ctx.restore()
    }
    ctx.save()
    drawRoundedRect(ctx, winX, winY, winW, winH, cornerRadius)
    ctx.clip()
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(winX, winY, winW, winH)
    // Title bar
    ctx.fillStyle = windowBarColor
    ctx.fillRect(winX, winY, winW, windowBar)
    // Traffic lights
    if (windowStyle !== 'title') {
      const tlY = winY + windowBar / 2
      const tlXs = [winX + 18, winX + 42, winX + 66]
      const colors = ['#ff5f57', '#febc2e', '#28c840']
      tlXs.forEach((x, i) => {
        ctx.beginPath()
        ctx.fillStyle = colors[i]
        ctx.arc(x, tlY, 6, 0, Math.PI * 2)
        ctx.fill()
      })
    }
    // Notch option
    if (windowStyle === 'notch') {
      ctx.save()
      ctx.fillStyle = windowBarColor
      const notchW = Math.min(180, winW * 0.25)
      const notchH = 18
      const notchR = 8
      const nx = winX + winW / 2 - notchW / 2
      const ny = winY + windowBar - notchH
      drawRoundedRect(ctx, nx, ny, notchW, notchH, notchR)
      ctx.fill()
      ctx.restore()
    }
    ctx.restore()
  }

  // When window frame is hidden, draw shadow around the image itself
  if (!showWindow && shadowEnabled) {
    ctx.save()
    ctx.shadowColor = hexToRgba(shadowColor, Math.min(1, Math.max(0, shadowOpacity)))
    ctx.shadowBlur = Math.max(0, shadowBlur)
    ctx.shadowOffsetX = shadowOffsetX
    ctx.shadowOffsetY = shadowOffsetY
    ctx.fillStyle = '#ffffff'
    // Use smaller corner radius for frameless images
    const imageRadius = Math.min(cornerRadius, 8)
    drawRoundedRect(ctx, contentX, contentY, scaledW, scaledH, imageRadius)
    ctx.fill()
    ctx.restore()
  }

  // Image draw
  ctx.save()
  if (showWindow) clipRect(ctx, contentX, contentY, scaledW, scaledH)
  const sx = cropRect ? cropRect.x : 0
  const sy = cropRect ? cropRect.y : 0
  const sw = cropRect ? cropRect.w : image.width
  const sh = cropRect ? cropRect.h : image.height
  ctx.drawImage(image, sx, sy, sw, sh, contentX, contentY, scaledW, scaledH)
  ctx.restore()

  // Shapes (drawn above image)
  if (shapes && shapes.length) {
    shapes.forEach((s) => drawShape(ctx, s, contentX, contentY))
  }

  // Text overlays (drawn above image/frame)
  if (texts && texts.length) {
    texts.forEach((t) => {
      const fontParts = [] as string[]
      if (t.italic) fontParts.push('italic')
      if (t.bold) fontParts.push('700')
      else fontParts.push('400')
      fontParts.push(`${Math.max(1, Math.round(t.fontSize))}px`)
      fontParts.push(t.fontFamily)
      ctx.font = fontParts.join(' ')
      ctx.direction = 'ltr' as CanvasDirection
      ctx.textAlign = t.align
      ctx.textBaseline = 'top'
      const isContentAnchored = (t.positionAnchor ?? 'content') === 'content'
      const tx = (isContentAnchored ? contentX : 0) + t.x
      let y = (isContentAnchored ? contentY : 0) + t.y
      const lines = t.text.split(/\n/)

      // Measure block for background and compute per-line height
      const lineHeights: number[] = []
      let maxWidth = 0
      for (const line of lines) {
        const metrics = ctx.measureText(line)
        const lineH = Math.max(t.fontSize, (metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) || t.fontSize) * 1.2
        lineHeights.push(lineH)
        maxWidth = Math.max(maxWidth, metrics.width)
      }

      // Draw background rounded rect if enabled
      if (t.background) {
        const padX = Math.max(0, t.backgroundPaddingX ?? 6)
        const padY = Math.max(0, t.backgroundPaddingY ?? 2)
        const radius = Math.max(0, t.backgroundRadius ?? 6)
        const totalH = lineHeights.reduce((a, b) => a + b, 0)
        const bgX = tx - (t.align === 'center' ? maxWidth / 2 : t.align === 'right' ? maxWidth : 0) - padX
        const bgY = y - padY
        const bgW = maxWidth + padX * 2
        const bgH = totalH + padY * 2
        ctx.save()
        const alpha = Math.min(1, Math.max(0, (t.backgroundAlpha ?? 0.8)))
        ctx.globalAlpha = alpha
        if ((t.backgroundType ?? 'solid') === 'linear') {
          const angleRad = ((t.backgroundAngle ?? 90) * Math.PI) / 180
          const cos = Math.cos(angleRad)
          const sin = Math.sin(angleRad)
          const cx = bgX + bgW / 2
          const cy = bgY + bgH / 2
          const r = Math.max(bgW, bgH)
          const g = ctx.createLinearGradient(cx - cos * r, cy - sin * r, cx + cos * r, cy + sin * r)
          g.addColorStop(0, t.backgroundColor ?? '#111827')
          g.addColorStop(1, t.backgroundColor2 ?? '#374151')
          ctx.fillStyle = g
        } else {
          ctx.fillStyle = t.backgroundColor || 'rgba(0,0,0,1)'
        }
        drawRoundedRect(ctx, bgX, bgY, bgW, bgH, radius)
        ctx.fill()
        ctx.restore()
      }

      // Apply shadow if enabled (for filled text)
      const origShadowColor = ctx.shadowColor
      const origShadowBlur = ctx.shadowBlur
      const origShadowOffsetX = ctx.shadowOffsetX
      const origShadowOffsetY = ctx.shadowOffsetY
      if (t.shadow) {
        const alpha = Math.min(1, Math.max(0, t.shadowAlpha ?? 0.5))
        ctx.shadowColor = hexToRgba(t.shadowColor || '#000000', alpha)
        ctx.shadowBlur = Math.max(0, t.shadowBlur ?? 8)
        ctx.shadowOffsetX = t.shadowOffsetX ?? 0
        ctx.shadowOffsetY = t.shadowOffsetY ?? 2
      }

      for (const line of lines) {
        if (t.outline && t.outlineWidth > 0) {
          ctx.lineWidth = t.outlineWidth
          ctx.strokeStyle = t.outlineColor
          ctx.strokeText(line, tx, y)
        }
        if ((t.fillType ?? 'solid') === 'linear') {
          const angleRad = ((t.fillAngle ?? 0) * Math.PI) / 180
          const cos = Math.cos(angleRad)
          const sin = Math.sin(angleRad)
          const r = Math.max(maxWidth, t.fontSize)
          const gx = tx - (t.align === 'center' ? maxWidth / 2 : t.align === 'right' ? maxWidth : 0)
          const gy = y
          const g = ctx.createLinearGradient(gx - cos * r, gy - sin * r, gx + cos * r, gy + sin * r)
          g.addColorStop(0, t.color)
          g.addColorStop(1, t.fillColor2 ?? t.color)
          ctx.fillStyle = g
        } else {
          ctx.fillStyle = t.color
        }
        ctx.fillText(line, tx, y)
        const metrics = ctx.measureText(line)
        const lineH = Math.max(t.fontSize, (metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) || t.fontSize) * 1.2
        y += lineH
      }

      // Restore shadow defaults
      if (t.shadow) {
        ctx.shadowColor = origShadowColor
        ctx.shadowBlur = origShadowBlur
        ctx.shadowOffsetX = origShadowOffsetX
        ctx.shadowOffsetY = origShadowOffsetY
      }
    })
  }

  return { contentX, contentY, scaledW, scaledH }
}

function createLinearGrad(ctx: CanvasRenderingContext2D, w: number, h: number, g: LinearGradient) {
  const angleRad = (g.angle * Math.PI) / 180
  const cx = w / 2
  const cy = h / 2
  const r = Math.max(w, h)
  const dx = Math.cos(angleRad)
  const dy = Math.sin(angleRad)
  const grad = ctx.createLinearGradient(cx - dx * r, cy - dy * r, cx + dx * r, cy + dy * r)
  for (const s of g.stops) grad.addColorStop(Math.min(1, Math.max(0, s.pos)), s.color)
  return grad
}

function fillPattern(ctx: CanvasRenderingContext2D, w: number, h: number, p: Pattern) {
  const tile = document.createElement('canvas')
  const t = Math.max(8, Math.min(128, Math.floor(p.scale)))
  tile.width = t
  tile.height = t
  const tctx = tile.getContext('2d')!
  tctx.fillStyle = p.bg
  tctx.fillRect(0, 0, t, t)
  tctx.fillStyle = p.fg
  tctx.strokeStyle = p.fg
  tctx.lineWidth = Math.max(1, Math.round(t * 0.06))
  switch (p.name) {
    case 'dots': {
      const rdot = Math.max(1, Math.round(t * 0.12))
      tctx.beginPath()
      tctx.arc(t / 2, t / 2, rdot, 0, Math.PI * 2)
      tctx.fill()
      break
    }
    case 'grid': {
      tctx.beginPath()
      tctx.moveTo(0, 0)
      tctx.lineTo(0, t)
      tctx.moveTo(0, 0)
      tctx.lineTo(t, 0)
      tctx.stroke()
      break
    }
    case 'cross': {
      // plus sign centered in tile
      const c = t / 2
      tctx.beginPath()
      tctx.moveTo(c, 0)
      tctx.lineTo(c, t)
      tctx.moveTo(0, c)
      tctx.lineTo(t, c)
      tctx.stroke()
      break
    }
    case 'crosshatch': {
      // both diagonals per tile
      tctx.beginPath()
      tctx.moveTo(0, 0)
      tctx.lineTo(t, t)
      tctx.moveTo(0, t)
      tctx.lineTo(t, 0)
      tctx.stroke()
      break
    }
    case 'diagonal': {
      tctx.beginPath()
      tctx.moveTo(0, t)
      tctx.lineTo(t, 0)
      tctx.stroke()
      break
    }
    case 'zigzag': {
      const amp = t * 0.25
      const step = Math.max(2, Math.round(t / 4))
      tctx.beginPath()
      let up = true
      tctx.moveTo(0, t / 2)
      for (let x = 0; x <= t; x += step) {
        const y = up ? (t / 2 - amp) : (t / 2 + amp)
        tctx.lineTo(x, y)
        up = !up
      }
      tctx.stroke()
      break
    }
    case 'wave': {
      const amp = t * 0.15
      const period = t
      tctx.beginPath()
      for (let x = 0; x <= t; x++) {
        const y = t / 2 + Math.sin((x / period) * 2 * Math.PI) * amp
        if (x === 0) tctx.moveTo(x, y)
        else tctx.lineTo(x, y)
      }
      tctx.stroke()
      break
    }
    case 'plus': {
      const len = t * 0.3
      const c = t / 2
      tctx.beginPath()
      tctx.moveTo(c - len / 2, c)
      tctx.lineTo(c + len / 2, c)
      tctx.moveTo(c, c - len / 2)
      tctx.lineTo(c, c + len / 2)
      tctx.stroke()
      break
    }
    case 'hex': {
      const r = t * 0.32
      const cx = t / 2
      const cy = t / 2
      tctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i
        const x = cx + r * Math.cos(a)
        const y = cy + r * Math.sin(a)
        if (i === 0) tctx.moveTo(x, y)
        else tctx.lineTo(x, y)
      }
      tctx.closePath()
      tctx.stroke()
      break
    }
    case 'noise': {
      // deterministic pseudo-random tiny dots
      const n = 10
      const seed = 1337
      const rand = (i: number) => {
        const x = Math.sin(i * 12.9898 + seed) * 43758.5453
        return x - Math.floor(x)
      }
      const dot = Math.max(1, Math.round(t * 0.06))
      tctx.globalAlpha = 0.45
      for (let i = 0; i < n; i++) {
        const x = Math.floor(rand(i) * t)
        const y = Math.floor(rand(i + 1) * t)
        tctx.fillRect(x, y, dot, dot)
      }
      tctx.globalAlpha = 1
      break
    }
    case 'icons': {
      const s = Math.round(t * 0.3)
      const r = Math.round(s * 0.25)
      tctx.beginPath()
      tctx.moveTo(r, 0)
      tctx.arcTo(s, 0, s, s, r)
      tctx.arcTo(s, s, 0, s, r)
      tctx.arcTo(0, s, 0, 0, r)
      tctx.arcTo(0, 0, s, 0, r)
      tctx.closePath()
      tctx.fill()
      break
    }
    case 'circuit': {
      // simple circuit traces: a rectangle trace with a via dot
      const pad = Math.round(t * 0.2)
      const via = Math.max(1, Math.round(t * 0.08))
      tctx.lineCap = 'round'
      tctx.beginPath()
      tctx.strokeRect(pad, pad, t - pad * 2, t - pad * 2)
      tctx.beginPath()
      tctx.arc(t - pad * 1.2, t / 2, via, 0, Math.PI * 2)
      tctx.fill()
      break
    }
    case 'chevron': {
      const off = Math.round(t * 0.2)
      tctx.beginPath()
      tctx.moveTo(0, off)
      tctx.lineTo(t / 2, t - off)
      tctx.lineTo(t, off)
      tctx.stroke()
      break
    }
    case 'stars': {
      const c = t / 2
      const r = t * 0.18
      tctx.beginPath()
      for (let k = 0; k < 5; k++) {
        const a = (Math.PI * 2 * k) / 5
        const x = c + Math.cos(a) * r
        const y = c + Math.sin(a) * r
        if (k === 0) tctx.moveTo(x, y)
        else tctx.lineTo(x, y)
      }
      tctx.closePath()
      tctx.stroke()
      break
    }
    case 'sprinkles': {
      const n = 6
      for (let i = 0; i < n; i++) {
        const x = Math.floor((i * 97) % t)
        const y = Math.floor(((i + 3) * 53) % t)
        const len = Math.max(2, Math.round(t * 0.18))
        const ang = (i * Math.PI) / 3
        tctx.beginPath()
        tctx.moveTo(x, y)
        tctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len)
        tctx.stroke()
      }
      break
    }
    case 'herringbone': {
      const step = Math.max(2, Math.round(t / 4))
      tctx.beginPath()
      for (let y = 0; y <= t; y += step) {
        tctx.moveTo(0, y)
        tctx.lineTo(t / 2, y - step)
        tctx.moveTo(t / 2, y)
        tctx.lineTo(t, y - step)
      }
      tctx.stroke()
      break
    }
  }
  const pattern = ctx.createPattern(tile, 'repeat')
  ctx.fillStyle = pattern ?? '#000000'
  ctx.fillRect(0, 0, w, h)
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const parse = (s: string) => parseInt(s, 16)
  const r = h.length === 3 ? parse(h[0] + h[0]) : parse(h.slice(0, 2))
  const g = h.length === 3 ? parse(h[1] + h[1]) : parse(h.slice(2, 4))
  const b = h.length === 3 ? parse(h[2] + h[2]) : parse(h.slice(4, 6))
  const a = Math.min(1, Math.max(0, alpha))
  return `rgba(${r},${g},${b},${a})`
}

function drawShape(ctx: CanvasRenderingContext2D, s: ShapeNode, contentX: number, contentY: number) {
  const originX = (s.positionAnchor ?? 'content') === 'content' ? contentX : 0
  const originY = (s.positionAnchor ?? 'content') === 'content' ? contentY : 0
  const x = originX + s.x
  const y = originY + s.y
  const w = s.w
  const h = s.h

  ctx.save()
  // Shadow
  if (s.shadow) {
    const alpha = Math.min(1, Math.max(0, s.shadowAlpha ?? 0.5))
    ctx.shadowColor = hexToRgba(s.shadowColor || '#000000', alpha)
    ctx.shadowBlur = Math.max(0, s.shadowBlur ?? 8)
    ctx.shadowOffsetX = s.shadowOffsetX ?? 0
    ctx.shadowOffsetY = s.shadowOffsetY ?? 2
  }
  ctx.lineWidth = Math.max(1, s.strokeWidth)
  ctx.strokeStyle = s.strokeColor
  if (s.fill && s.fillColor) ctx.fillStyle = s.fillColor

  const applyRotation = (drawFn: () => void) => {
    const cx = x + w / 2
    const cy = y + h / 2
    const rotDeg = s.rotation ?? 0
    if (!rotDeg) return drawFn()
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate((rotDeg * Math.PI) / 180)
    ctx.translate(-cx, -cy)
    drawFn()
    ctx.restore()
  }

  switch (s.type) {
    case 'rectangle': {
      applyRotation(() => {
        if (s.fill && s.fillColor) {
          ctx.fillRect(x, y, w, h)
        }
        ctx.strokeRect(x, y, w, h)
      })
      break
    }
    case 'circle': {
      applyRotation(() => {
        ctx.beginPath()
        ctx.ellipse(x + w / 2, y + h / 2, Math.abs(w) / 2, Math.abs(h) / 2, 0, 0, Math.PI * 2)
        if (s.fill && s.fillColor) ctx.fill()
        ctx.stroke()
      })
      break
    }
    case 'triangle': {
      applyRotation(() => {
        ctx.beginPath()
        ctx.moveTo(x + w / 2, y)
        ctx.lineTo(x + w, y + h)
        ctx.lineTo(x, y + h)
        ctx.closePath()
        if (s.fill && s.fillColor) ctx.fill()
        ctx.stroke()
      })
      break
    }
    case 'line': {
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + w, y + h)
      ctx.stroke()
      break
    }
    case 'arrow': {
      // main line
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + w, y + h)
      ctx.stroke()
      // arrow head
      const head = Math.max(4, s.arrowHeadSize ?? 12)
      const angle = Math.atan2(h, w)
      const endX = x + w
      const endY = y + h
      ctx.beginPath()
      ctx.moveTo(endX, endY)
      ctx.lineTo(endX - head * Math.cos(angle - Math.PI / 6), endY - head * Math.sin(angle - Math.PI / 6))
      ctx.moveTo(endX, endY)
      ctx.lineTo(endX - head * Math.cos(angle + Math.PI / 6), endY - head * Math.sin(angle + Math.PI / 6))
      ctx.stroke()
      break
    }
  }
  ctx.restore()
}

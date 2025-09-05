import { drawRoundedRect, clipRect } from './canvas-utils'
import type { BgPreset, LinearGradient, Pattern, ShadowStrength, WindowStyle } from '@/components/app-sidebar'

type RenderParams = {
  bgPreset: BgPreset
  padding: { x: number; y: number }
  shadowStrength: ShadowStrength
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
  const { bgPreset, padding, shadowStrength, showWindow, windowStyle, windowBarColor, windowBar, cornerRadius, image, cropRect, scaledW, scaledH, offsetX, offsetY } = p

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
    if (shadowStrength !== 'off') {
      ctx.save()
      const config: Record<ShadowStrength, { blur: number; offsetY: number; alpha: number }> = {
        off: { blur: 0, offsetY: 0, alpha: 0 },
        subtle: { blur: 12, offsetY: 4, alpha: 0.12 },
        medium: { blur: 28, offsetY: 8, alpha: 0.18 },
        strong: { blur: 48, offsetY: 16, alpha: 0.25 },
      }
      const s = config[shadowStrength]
      ctx.shadowColor = `rgba(0,0,0,${s.alpha})`
      ctx.shadowBlur = s.blur
      ctx.shadowOffsetY = s.offsetY
      drawRoundedRect(ctx, winX, winY, winW, winH, cornerRadius)
      ctx.fillStyle = '#ffffff'
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

  // Image draw
  ctx.save()
  if (showWindow) clipRect(ctx, contentX, contentY, scaledW, scaledH)
  const sx = cropRect ? cropRect.x : 0
  const sy = cropRect ? cropRect.y : 0
  const sw = cropRect ? cropRect.w : image.width
  const sh = cropRect ? cropRect.h : image.height
  ctx.drawImage(image, sx, sy, sw, sh, contentX, contentY, scaledW, scaledH)
  ctx.restore()

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
    case 'diagonal': {
      tctx.beginPath()
      tctx.moveTo(0, t)
      tctx.lineTo(t, 0)
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
  }
  const pattern = ctx.createPattern(tile, 'repeat')!
  ctx.fillStyle = pattern as any
  ctx.fillRect(0, 0, w, h)
}


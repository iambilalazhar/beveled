import { FINISH_BY_ID } from '@/mockup/presets'
import { MODEL_BY_ID } from '@/mockup/scene/models'
import type { LaptopSpec, MonitorSpec, PhoneSpec, TabletSpec, WatchSpec } from '@/mockup/scene/models'
import type { MockupState } from '../types'

/**
 * Flat mockup "cards": the device (or window / screenshot frame) drawn front-on into a canvas,
 * with the screen area left transparent. The media is drawn underneath by a separate mesh, so
 * screenshots and videos stay at full resolution and the frame only has to be redrawn on change.
 */

export type ScreenRect = { x: number; y: number; w: number; h: number; rTop: number; rBottom: number }

export type CardSpec = {
  width: number
  height: number
  screen: ScreenRect
  /** Draws the frame. The screen rectangle must stay transparent. */
  draw: (ctx: CanvasRenderingContext2D) => void
}

const LONG = 2000

/* ------------------------------------------------------------------ */
/* Drawing helpers                                                     */
/* ------------------------------------------------------------------ */

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number | [number, number, number, number]) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

function hex(c: string, k: number): string {
  // k > 0 lightens towards white, k < 0 darkens towards black.
  const n = parseInt(c.replace('#', ''), 16)
  let r = (n >> 16) & 255
  let g = (n >> 8) & 255
  let b = n & 255
  const t = k > 0 ? 255 : 0
  const a = Math.abs(k)
  r = Math.round(r + (t - r) * a)
  g = Math.round(g + (t - g) * a)
  b = Math.round(b + (t - b) * a)
  return `rgb(${r},${g},${b})`
}

/** Brushed-metal edge: dark at the rims, a soft highlight near the top-left. */
function metal(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number) {
  const g = ctx.createLinearGradient(x, y, x + w * 0.35, y + h)
  g.addColorStop(0, hex(color, 0.45))
  g.addColorStop(0.18, hex(color, 0.1))
  g.addColorStop(0.5, hex(color, -0.08))
  g.addColorStop(0.82, hex(color, 0.12))
  g.addColorStop(1, hex(color, -0.3))
  return g
}

function cutScreen(ctx: CanvasRenderingContext2D, s: ScreenRect) {
  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  rr(ctx, s.x, s.y, s.w, s.h, [s.rTop, s.rTop, s.rBottom, s.rBottom])
  ctx.fillStyle = '#000'
  ctx.fill()
  ctx.restore()
}

/** Rotates a portrait card 90° counter-clockwise into a landscape one. */
function landscape(card: CardSpec): CardSpec {
  const { width: W, height: H, screen: s } = card
  return {
    width: H,
    height: W,
    screen: { x: s.y, y: W - (s.x + s.w), w: s.h, h: s.w, rTop: s.rTop, rBottom: s.rBottom },
    draw: (ctx) => {
      ctx.save()
      ctx.translate(0, W)
      ctx.rotate(-Math.PI / 2)
      card.draw(ctx)
      ctx.restore()
    },
  }
}

/* ------------------------------------------------------------------ */
/* Screenshot and browser                                              */
/* ------------------------------------------------------------------ */

function screenshotCard(m: MockupState, aspect: number): CardSpec {
  const sw = aspect >= 1 ? LONG : Math.round(LONG * aspect)
  const sh = aspect >= 1 ? Math.round(LONG / aspect) : LONG
  const k = Math.max(sw, sh) / 1000
  const r = m.radius * k
  const short = Math.min(sw, sh)
  const pad =
    m.style === 'border'
      ? m.borderWidth * k
      : m.style === 'outline'
        ? 5 * k
        : m.style === 'default'
          ? 0
          : m.style === 'inset-light' || m.style === 'inset-dark'
            ? Math.max(14 * k, short * 0.03)
            : Math.max(16 * k, short * 0.034)
  const W = sw + pad * 2
  const H = sh + pad * 2
  const screen: ScreenRect = { x: pad, y: pad, w: sw, h: sh, rTop: r, rBottom: r }
  const outerR = r + pad
  return {
    width: W,
    height: H,
    screen,
    draw: (ctx) => {
      const style = m.style
      if (style === 'default') {
        rr(ctx, 0.5, 0.5, W - 1, H - 1, r)
        ctx.strokeStyle = 'rgba(0,0,0,0.08)'
        ctx.lineWidth = 2 * k
        ctx.stroke()
        return
      }
      if (style === 'outline') {
        rr(ctx, 1.5 * k, 1.5 * k, W - 3 * k, H - 3 * k, outerR)
        ctx.strokeStyle = m.borderColor
        ctx.lineWidth = 3 * k
        ctx.stroke()
        return
      }
      if (style === 'border') {
        rr(ctx, 0, 0, W, H, outerR)
        ctx.fillStyle = m.borderColor
        ctx.fill()
        cutScreen(ctx, screen)
        return
      }
      const dark = style === 'glass-dark' || style === 'inset-dark'
      rr(ctx, 0, 0, W, H, outerR)
      if (style === 'inset-light' || style === 'inset-dark') {
        ctx.fillStyle = dark ? '#1c1c1f' : '#f6f6f4'
        ctx.fill()
      } else if (style === 'liquid-glass') {
        const g = ctx.createLinearGradient(0, 0, W, H)
        g.addColorStop(0, 'rgba(255,255,255,0.42)')
        g.addColorStop(0.45, 'rgba(255,255,255,0.12)')
        g.addColorStop(1, 'rgba(255,255,255,0.28)')
        ctx.fillStyle = g
        ctx.fill()
      } else {
        ctx.fillStyle = dark ? 'rgba(18,18,22,0.5)' : 'rgba(255,255,255,0.32)'
        ctx.fill()
        // Frosted sheen across the top
        const sheen = ctx.createLinearGradient(0, 0, 0, H * 0.5)
        sheen.addColorStop(0, dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.35)')
        sheen.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = sheen
        ctx.fill()
      }
      cutScreen(ctx, screen)
      // Edges
      rr(ctx, 1 * k, 1 * k, W - 2 * k, H - 2 * k, outerR)
      if (style === 'liquid-glass') {
        const edge = ctx.createLinearGradient(0, 0, W, H)
        edge.addColorStop(0, 'rgba(255,255,255,0.95)')
        edge.addColorStop(0.5, 'rgba(255,255,255,0.25)')
        edge.addColorStop(1, 'rgba(255,255,255,0.75)')
        ctx.strokeStyle = edge
        ctx.lineWidth = 3 * k
        ctx.stroke()
        rr(ctx, 4 * k, 4 * k, W - 8 * k, H - 8 * k, outerR - 3 * k)
        ctx.strokeStyle = 'rgba(140,190,255,0.35)'
        ctx.lineWidth = 1.5 * k
        ctx.stroke()
      } else {
        ctx.strokeStyle = dark ? 'rgba(255,255,255,0.16)' : style.startsWith('inset') ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.75)'
        ctx.lineWidth = 2 * k
        ctx.stroke()
      }
      rr(ctx, screen.x, screen.y, screen.w, screen.h, r)
      ctx.strokeStyle = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
      ctx.lineWidth = 1.5 * k
      ctx.stroke()
    },
  }
}

function trafficLights(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ;['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => {
    ctx.beginPath()
    ctx.arc(x + i * s * 1.65, y, s * 0.5, 0, Math.PI * 2)
    ctx.fillStyle = c
    ctx.fill()
  })
}

function browserCard(m: MockupState, aspect: number): CardSpec {
  const W = LONG
  const u = W / 1280
  const style = m.browserStyle
  const dark = m.browserDark
  const r = Math.max(6, m.radius) * u * 0.9
  const frame = style === 'arc' ? 10 * u : 0
  const barH = style === 'chrome' ? 82 * u : style === 'arc' ? 34 * u : 52 * u
  const sw = W - frame * 2
  const sh = Math.round(sw / Math.max(0.3, aspect))
  const H = barH + sh + frame
  const screen: ScreenRect = { x: frame, y: barH, w: sw, h: sh, rTop: style === 'arc' ? 8 * u : 0, rBottom: style === 'arc' ? 8 * u : Math.max(0, r - frame) }
  const ink = dark ? 'rgba(255,255,255,0.78)' : 'rgba(0,0,0,0.62)'
  const faint = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'
  const font = (size: number, weight = 500) => `${weight} ${size * u}px -apple-system, "SF Pro Text", Inter, system-ui, sans-serif`
  return {
    width: W,
    height: H,
    screen,
    draw: (ctx) => {
      rr(ctx, 0, 0, W, H, r)
      if (style === 'arc') {
        const g = ctx.createLinearGradient(0, 0, W, H)
        g.addColorStop(0, dark ? '#3a2f5c' : '#e9defa')
        g.addColorStop(1, dark ? '#1d2a44' : '#d3e6fb')
        ctx.fillStyle = g
      } else {
        ctx.fillStyle = dark ? '#2b2b2e' : '#f4f4f5'
      }
      ctx.fill()
      cutScreen(ctx, screen)
      if (style === 'safari') {
        trafficLights(ctx, 22 * u, barH / 2, 12 * u)
        ctx.strokeStyle = ink
        ctx.lineWidth = 2 * u
        // back / forward chevrons
        for (const [x, dir] of [[96, -1], [122, 1]] as const) {
          ctx.beginPath()
          ctx.moveTo((x - dir * 4) * u, barH / 2 - 7 * u)
          ctx.lineTo((x + dir * 4) * u, barH / 2)
          ctx.lineTo((x - dir * 4) * u, barH / 2 + 7 * u)
          ctx.stroke()
        }
        const pw = 460 * u
        rr(ctx, W / 2 - pw / 2, barH / 2 - 15 * u, pw, 30 * u, 8 * u)
        ctx.fillStyle = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'
        ctx.fill()
        ctx.fillStyle = ink
        ctx.font = font(13)
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(m.browserUrl || 'beveled.app', W / 2, barH / 2 + 1 * u)
      } else if (style === 'chrome') {
        trafficLights(ctx, 20 * u, 20 * u, 12 * u)
        // active tab
        rr(ctx, 84 * u, 8 * u, 230 * u, 32 * u, [10 * u, 10 * u, 0, 0])
        ctx.fillStyle = dark ? '#3c3c40' : '#ffffff'
        ctx.fill()
        ctx.fillStyle = ink
        ctx.font = font(12)
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        ctx.fillText(m.browserUrl || 'beveled.app', 106 * u, 24 * u)
        // toolbar
        ctx.fillStyle = dark ? '#3c3c40' : '#ffffff'
        ctx.fillRect(0, 40 * u, W, 42 * u)
        rr(ctx, 110 * u, 47 * u, W - 220 * u, 28 * u, 14 * u)
        ctx.fillStyle = dark ? '#28282b' : '#f1f3f4'
        ctx.fill()
        ctx.fillStyle = ink
        ctx.font = font(13)
        ctx.fillText(m.browserUrl || 'beveled.app', 132 * u, 61 * u)
        ctx.fillStyle = faint
        ctx.fillRect(0, barH - 1 * u, W, 1 * u)
      } else {
        trafficLights(ctx, 22 * u, barH / 2 + 1 * u, 11 * u)
      }
      rr(ctx, 0.5, 0.5, W - 1, H - 1, r)
      ctx.strokeStyle = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'
      ctx.lineWidth = 1.5 * u
      ctx.stroke()
    },
  }
}

/* ------------------------------------------------------------------ */
/* Devices (front views from real specs)                               */
/* ------------------------------------------------------------------ */

function phoneCard(spec: PhoneSpec, color: string): CardSpec {
  const k = (LONG * 0.96) / spec.h
  const margin = 1.4 * k
  const bw = spec.w * k
  const bh = spec.h * k
  const W = bw + margin * 2
  const H = bh
  const sw = (spec.w - spec.bezel * 2) * k
  const sh = sw * (spec.res[1] / spec.res[0])
  const sx = margin + (bw - sw) / 2
  const sy = (bh - sh) / 2
  const sr = spec.screenCorner * k
  const screen: ScreenRect = { x: sx, y: sy, w: sw, h: sh, rTop: sr, rBottom: sr }
  return {
    width: W,
    height: H,
    screen,
    draw: (ctx) => {
      // Side buttons first so the body overlaps their inner edge.
      for (const b of spec.buttons) {
        const y = b.from * bh
        const len = b.len * bh
        const x = b.side === 'left' ? margin - 1.1 * k : margin + bw - 0.6 * k
        rr(ctx, x, y, 1.7 * k, len, 0.8 * k)
        ctx.fillStyle = metal(ctx, color, x, y, 1.7 * k, len)
        ctx.fill()
      }
      rr(ctx, margin, 0, bw, bh, spec.corner * k)
      ctx.fillStyle = metal(ctx, color, margin, 0, bw, bh)
      ctx.fill()
      // Black glass up to the screen edge
      const rim = (spec.frame === 'flat' ? 0.75 : 0.95) * k
      rr(ctx, margin + rim, rim, bw - rim * 2, bh - rim * 2, spec.corner * k - rim)
      ctx.fillStyle = '#050506'
      ctx.fill()
      // Thin glass highlight
      rr(ctx, margin + rim + 0.5, rim + 0.5, bw - rim * 2 - 1, bh - rim * 2 - 1, spec.corner * k - rim)
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'
      ctx.lineWidth = 0.25 * k
      ctx.stroke()
      cutScreen(ctx, screen)
      ctx.fillStyle = '#000'
      if (spec.cutout === 'island') {
        const iw = sw * 0.3
        const ih = sh * 0.041
        rr(ctx, sx + sw / 2 - iw / 2, sy + sh * 0.0125, iw, ih, ih / 2)
        ctx.fill()
      } else {
        ctx.beginPath()
        ctx.arc(sx + sw / 2, sy + sh * 0.022, sw * 0.017, 0, Math.PI * 2)
        ctx.fill()
      }
    },
  }
}

function tabletCard(spec: TabletSpec, color: string): CardSpec {
  const k = (LONG * 0.98) / spec.h
  const W = spec.w * k
  const H = spec.h * k
  const sw = (spec.w - spec.bezel * 2) * k
  const sh = sw * (spec.res[1] / spec.res[0])
  const screen: ScreenRect = { x: (W - sw) / 2, y: (H - sh) / 2, w: sw, h: sh, rTop: spec.screenCorner * k, rBottom: spec.screenCorner * k }
  return {
    width: W,
    height: H,
    screen,
    draw: (ctx) => {
      rr(ctx, 0, 0, W, H, spec.corner * k)
      ctx.fillStyle = metal(ctx, color, 0, 0, W, H)
      ctx.fill()
      const rim = 0.9 * k
      rr(ctx, rim, rim, W - rim * 2, H - rim * 2, spec.corner * k - rim)
      ctx.fillStyle = '#060607'
      ctx.fill()
      cutScreen(ctx, screen)
      ctx.beginPath()
      ctx.arc(W / 2, screen.y / 2, 1.1 * k, 0, Math.PI * 2)
      ctx.fillStyle = '#1b1d24'
      ctx.fill()
    },
  }
}

function laptopCard(spec: LaptopSpec, color: string, notch: boolean): CardSpec {
  const k = (LONG * 0.94) / spec.w
  const [side, top, chin] = spec.bezel
  const lidW = spec.w * k
  const sw = (spec.w - side * 2) * k
  const sh = sw * (spec.res[1] / spec.res[0])
  const lidH = sh + (top + chin) * k
  const baseW = lidW * 1.08
  const baseH = Math.max(6.5, spec.baseThick * 0.62) * k
  const W = baseW
  const H = lidH + baseH
  const ox = (W - lidW) / 2
  const screen: ScreenRect = { x: ox + side * k, y: top * k, w: sw, h: sh, rTop: 1.2 * k, rBottom: 0 }
  return {
    width: W,
    height: H,
    screen,
    draw: (ctx) => {
      // Lid
      rr(ctx, ox, 0, lidW, lidH + 2 * k, [spec.corner * k, spec.corner * k, 2 * k, 2 * k])
      ctx.fillStyle = metal(ctx, color, ox, 0, lidW, lidH)
      ctx.fill()
      const rim = 1.1 * k
      rr(ctx, ox + rim, rim, lidW - rim * 2, lidH - rim, [spec.corner * k - rim, spec.corner * k - rim, 0, 0])
      ctx.fillStyle = '#060607'
      ctx.fill()
      cutScreen(ctx, screen)
      if (notch) {
        const nw = sw * 0.07
        const nh = sh * 0.02
        rr(ctx, screen.x + sw / 2 - nw / 2, screen.y - 1, nw, nh + 1, [0, 0, nh * 0.5, nh * 0.5])
        ctx.fillStyle = '#060607'
        ctx.fill()
        ctx.beginPath()
        ctx.arc(screen.x + sw / 2, screen.y + nh * 0.45, nh * 0.18, 0, Math.PI * 2)
        ctx.fillStyle = '#1b1d24'
        ctx.fill()
      }
      // Hinge shadow and base
      ctx.fillStyle = hex(color, -0.55)
      ctx.fillRect(ox + 4 * k, lidH - 0.6 * k, lidW - 8 * k, 1.2 * k)
      rr(ctx, 0, lidH, baseW, baseH, [1.5 * k, 1.5 * k, baseH * 0.9, baseH * 0.9])
      const g = ctx.createLinearGradient(0, lidH, 0, lidH + baseH)
      g.addColorStop(0, hex(color, 0.35))
      g.addColorStop(0.25, hex(color, 0.05))
      g.addColorStop(1, hex(color, -0.45))
      ctx.fillStyle = g
      ctx.fill()
      // Thumb scoop
      const tw = baseW * 0.13
      rr(ctx, W / 2 - tw / 2, lidH, tw, baseH * 0.35, [0, 0, baseH * 0.3, baseH * 0.3])
      ctx.fillStyle = hex(color, -0.25)
      ctx.fill()
    },
  }
}

function monitorCard(spec: MonitorSpec, color: string): CardSpec {
  const k = (LONG * 0.96) / spec.w
  const dw = spec.w * k
  const dh = spec.h * k
  const neckH = spec.standH * k * 0.62
  const footH = 7 * k
  const W = dw
  const H = dh + neckH + footH
  const sw = (spec.w - spec.bezel * 2) * k
  const sh = sw * (spec.res[1] / spec.res[0])
  const screen: ScreenRect = { x: (dw - sw) / 2, y: (dh - sh) / 2, w: sw, h: sh, rTop: 0, rBottom: 0 }
  return {
    width: W,
    height: H,
    screen,
    draw: (ctx) => {
      // Stand
      const nw = dw * (spec.stand === 'pro' ? 0.2 : 0.16)
      ctx.fillStyle = metal(ctx, color, W / 2 - nw / 2, dh, nw, neckH)
      ctx.fillRect(W / 2 - nw / 2, dh - 2 * k, nw, neckH + 2 * k)
      const g = ctx.createLinearGradient(0, dh, 0, dh + neckH)
      g.addColorStop(0, 'rgba(0,0,0,0.35)')
      g.addColorStop(0.3, 'rgba(0,0,0,0)')
      ctx.fillStyle = g
      ctx.fillRect(W / 2 - nw / 2, dh, nw, neckH)
      const fw = dw * (spec.stand === 'pro' ? 0.34 : 0.28)
      rr(ctx, W / 2 - fw / 2, dh + neckH, fw, footH, footH / 2)
      ctx.fillStyle = metal(ctx, color, W / 2 - fw / 2, dh + neckH, fw, footH)
      ctx.fill()
      // Display
      rr(ctx, 0, 0, dw, dh, spec.corner * k)
      ctx.fillStyle = metal(ctx, color, 0, 0, dw, dh)
      ctx.fill()
      const rim = 1.6 * k
      rr(ctx, rim, rim, dw - rim * 2, dh - rim * 2, spec.corner * k - rim)
      ctx.fillStyle = '#060607'
      ctx.fill()
      cutScreen(ctx, screen)
    },
  }
}

function watchCard(spec: WatchSpec, color: string): CardSpec {
  const k = (LONG * 0.5) / spec.h
  const band = spec.h * 0.62 * k
  const cw = spec.w * k
  const ch = spec.h * k
  const crown = 3.2 * k
  const W = cw + crown * 2
  const H = ch + band * 2
  const ox = crown
  const sw = (spec.w - spec.bezel * 2) * k
  const sh = sw * (spec.res[1] / spec.res[0])
  const screen: ScreenRect = { x: ox + (cw - sw) / 2, y: band + (ch - sh) / 2, w: sw, h: sh, rTop: spec.screenCorner * k, rBottom: spec.screenCorner * k }
  return {
    width: W,
    height: H,
    screen,
    draw: (ctx) => {
      const bw = cw * (spec.style === 'ultra' ? 0.86 : 0.8)
      const strap = spec.style === 'ultra' ? '#e66a25' : '#2a2d33'
      for (const [y, flip] of [[0, 1], [band + ch, -1]] as const) {
        const g = ctx.createLinearGradient(0, y, 0, y + band)
        const fade = 'rgba(0,0,0,0)'
        g.addColorStop(flip === 1 ? 0 : 1, fade)
        g.addColorStop(flip === 1 ? 0.35 : 0.65, strap)
        g.addColorStop(flip === 1 ? 1 : 0, hex(strap, -0.2))
        rr(ctx, ox + (cw - bw) / 2, y, bw, band + 4 * k * flip, 4 * k)
        ctx.fillStyle = g
        ctx.fill()
      }
      // Crown and side button
      rr(ctx, ox + cw - 1 * k, band + ch * 0.3, crown + 1 * k, ch * 0.2, 1.5 * k)
      ctx.fillStyle = spec.style === 'ultra' ? metal(ctx, color, ox + cw, band, crown, ch) : hex(color, 0.1)
      ctx.fill()
      if (spec.style === 'ultra') {
        rr(ctx, ox - crown, band + ch * 0.32, crown + 1 * k, ch * 0.16, 1.2 * k)
        ctx.fillStyle = '#ff6a13'
        ctx.fill()
      }
      rr(ctx, ox, band, cw, ch, spec.corner * k)
      ctx.fillStyle = metal(ctx, color, ox, band, cw, ch)
      ctx.fill()
      const rim = (spec.style === 'ultra' ? 1.8 : 1) * k
      rr(ctx, ox + rim, band + rim, cw - rim * 2, ch - rim * 2, spec.corner * k - rim)
      ctx.fillStyle = '#040405'
      ctx.fill()
      cutScreen(ctx, screen)
    },
  }
}

/** Builds the card for the current mockup. `aspect` is the media aspect, used by screenshots and browsers. */
export function cardSpec(m: MockupState, aspect: number): CardSpec {
  const a = aspect || 16 / 10
  if (m.kind === 'screenshot') return screenshotCard(m, a)
  if (m.kind === 'browser') return browserCard(m, a)
  const model = MODEL_BY_ID[m.model]
  const spec = model?.spec
  const color = (FINISH_BY_ID[m.finish] ?? FINISH_BY_ID['space-black']).color
  let card: CardSpec | null = null
  let rotatable = false
  if (spec?.family === 'phone' || spec?.family === 'android') {
    card = phoneCard(spec, color)
    rotatable = true
  } else if (spec?.family === 'tablet') {
    card = tabletCard(spec, color)
    rotatable = true
  } else if (spec?.family === 'laptop') card = laptopCard(spec, color, spec.notch)
  else if (spec?.family === 'monitor') card = monitorCard(spec, color)
  else if (spec?.family === 'watch') card = watchCard(spec, color)
  if (!card) return screenshotCard(m, a)
  return rotatable && m.orientation === 'landscape' ? landscape(card) : card
}

/** Draws a card's frame into a new canvas (screen area transparent). */
export function renderCard(card: CardSpec): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = Math.ceil(card.width)
  c.height = Math.ceil(card.height)
  const ctx = c.getContext('2d')!
  card.draw(ctx)
  return c
}

/** Silhouette of the whole card (frame plus screen) for shadows. */
export function renderSilhouette(card: CardSpec, frame: HTMLCanvasElement, scale: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = Math.max(2, Math.ceil(card.width * scale))
  c.height = Math.max(2, Math.ceil(card.height * scale))
  const ctx = c.getContext('2d')!
  ctx.scale(scale, scale)
  ctx.drawImage(frame, 0, 0)
  const s = card.screen
  rr(ctx, s.x, s.y, s.w, s.h, [s.rTop, s.rTop, s.rBottom, s.rBottom])
  ctx.fillStyle = '#000'
  ctx.fill()
  return c
}

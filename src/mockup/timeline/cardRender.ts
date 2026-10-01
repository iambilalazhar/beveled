import type { LogoAnim, LogoState, TextAnim, TextEffect, TextState } from './types'

/* ------------------------------------------------------------------ */
/* Fonts                                                               */
/* ------------------------------------------------------------------ */

export const FONT_FAMILIES = [
  'System',
  'Serif',
  'Display',
  'Mono',
  'Geist',
  'Geist Mono',
  'Inter',
  'Roboto',
  'Open Sans',
  'Montserrat',
  'Poppins',
  'Lato',
  'Raleway',
  'Playfair Display',
  'Merriweather',
  'Oswald',
  'Bebas Neue',
  'Nunito',
  'Work Sans',
  'DM Sans',
  'Space Grotesk',
  'Sora',
  'Manrope',
  'Archivo',
  'Libre Baskerville',
  'Lora',
  'Source Serif 4',
  'Instrument Serif',
  'JetBrains Mono',
  'IBM Plex Mono',
]

const GENERIC: Record<string, string> = {
  System: '-apple-system, "SF Pro Display", "Segoe UI", system-ui, sans-serif',
  Serif: '"New York", Georgia, "Times New Roman", serif',
  Display: '"SF Pro Display", "Helvetica Neue", Arial, sans-serif',
  Mono: '"SF Mono", Menlo, Consolas, monospace',
}

export function fontStack(family: string) {
  return GENERIC[family] ?? `"${family}", Inter, system-ui, sans-serif`
}

const stylesheets = new Map<string, Promise<void>>()

/** Lazily loads a Google Font. Rendering falls back to system fonts until it arrives (or if it is blocked). */
export function ensureFont(family: string, weight = 400): Promise<void> {
  if (GENERIC[family] || typeof document === 'undefined') return Promise.resolve()
  let sheet = stylesheets.get(family)
  if (!sheet) {
    sheet = new Promise<void>((resolve) => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      // The v1 CSS API returns whichever of these weights exist; css2 with a weight range fails for static fonts.
      link.href = `https://fonts.googleapis.com/css?family=${family.replace(/ /g, '+')}:300,400,500,600,700,800,900,400i,700i&display=swap`
      link.onload = () => resolve()
      link.onerror = () => resolve()
      document.head.appendChild(link)
    })
    stylesheets.set(family, sheet)
  }
  // Wait for the @font-face rules before asking the browser to fetch the actual font file.
  return sheet
    .then(() => document.fonts.load(`${weight} 32px "${family}"`))
    .then(() => undefined)
    .catch(() => undefined)
}

/* ------------------------------------------------------------------ */
/* Animation helpers                                                   */
/* ------------------------------------------------------------------ */

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3)

/** Progress 0..1 of unit `i` of `n` entering over `duration` seconds, staggered. */
function staggered(t: number, i: number, n: number, duration: number) {
  if (duration <= 0) return 1
  const a = n > 1 ? duration * 0.6 : duration
  const delay = n > 1 ? (i * (duration - a)) / (n - 1) : 0
  return clamp01((t - delay) / a)
}

type UnitStyle = { alpha: number; dx: number; dy: number; scale: number; blur: number; rot: number }

function unitStyle(effect: TextEffect, p: number, px: number): UnitStyle {
  const e = easeOut(p)
  const s: UnitStyle = { alpha: 1, dx: 0, dy: 0, scale: 1, blur: 0, rot: 0 }
  switch (effect) {
    case 'none':
      s.alpha = p > 0 ? 1 : 0
      break
    case 'soft-blur':
      s.alpha = e
      s.blur = (1 - e) * px * 0.35
      break
    case 'fade-up':
      s.alpha = e
      s.dy = (1 - e) * px * 0.45
      break
    case 'scale-up':
      s.alpha = e
      s.scale = 0.6 + 0.4 * e
      break
    case 'scale-down':
      s.alpha = e
      s.scale = 1.45 - 0.45 * e
      break
    case 'blur-scale-up':
      s.alpha = e
      s.scale = 0.7 + 0.3 * e
      s.blur = (1 - e) * px * 0.3
      break
    case 'blur-scale-down':
      s.alpha = e
      s.scale = 1.35 - 0.35 * e
      s.blur = (1 - e) * px * 0.3
      break
    case 'words-in-left':
      s.alpha = e
      s.dx = -(1 - e) * px * 1.4
      break
    case 'words-in-right':
      s.alpha = e
      s.dx = (1 - e) * px * 1.4
      break
    case 'knock-left':
      s.alpha = clamp01(e * 2)
      s.rot = -(1 - e) * 0.6
      s.dy = -(1 - e) * px * 0.9
      break
    case 'knock-right':
      s.alpha = clamp01(e * 2)
      s.rot = (1 - e) * 0.6
      s.dy = -(1 - e) * px * 0.9
      break
  }
  return s
}

/** Resolves `{a|b|c}` word cycles for time t (seconds into a clip of `duration`). */
export function resolveCycles(text: string, t: number, duration: number): string {
  return text.replace(/\{([^{}]+)\}/g, (_m, body: string) => {
    const options = body.split('|').map((o) => o.trim()).filter(Boolean)
    if (!options.length) return ''
    const idx = Math.min(options.length - 1, Math.floor((t / Math.max(0.01, duration)) * options.length))
    return options[Math.max(0, idx)]
  })
}

/* ------------------------------------------------------------------ */
/* Text card                                                           */
/* ------------------------------------------------------------------ */

type Unit = { text: string; x: number; y: number; w: number; line: number }

function layoutUnits(ctx: CanvasRenderingContext2D, text: string, per: TextAnim['per'], maxW: number, lineH: number, align: TextState['align']) {
  const units: Unit[] = []
  const rawLines = text.split('\n')
  const lines: string[] = []
  for (const raw of rawLines) {
    const words = raw.split(/(\s+)/)
    let cur = ''
    for (const w of words) {
      const test = cur + w
      if (cur && ctx.measureText(test).width > maxW && w.trim()) {
        lines.push(cur.trimEnd())
        cur = w.trimStart()
      } else cur = test
    }
    lines.push(cur)
  }
  const totalH = lines.length * lineH
  lines.forEach((line, li) => {
    const lw = ctx.measureText(line).width
    const x0 = align === 'left' ? -maxW / 2 : align === 'right' ? maxW / 2 - lw : -lw / 2
    const y = -totalH / 2 + lineH * (li + 0.5)
    if (per === 'line') {
      units.push({ text: line, x: x0, y, w: lw, line: li })
      return
    }
    const parts = per === 'word' ? line.split(/(\s+)/) : Array.from(line)
    let x = x0
    for (const part of parts) {
      const w = ctx.measureText(part).width
      if (part.trim()) units.push({ text: part, x, y, w, line: li })
      x += w
    }
  })
  return units
}

export function drawTextCard(ctx: CanvasRenderingContext2D, w: number, h: number, text: TextState, t: number, duration: number) {
  ctx.clearRect(0, 0, w, h)
  const px = Math.max(4, (text.size / 60) * h)
  ctx.font = `${text.weight} ${px}px ${fontStack(text.font)}`
  ;(ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${(text.spacing / 100) * px}px`
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.fillStyle = text.color
  const content = resolveCycles(text.text, t, duration)
  const maxW = w * 0.86
  const lineH = px * text.lineHeight
  // Enter and exit may use different unit splits; lay out both.
  const enterUnits = layoutUnits(ctx, content, text.enter.per, maxW, lineH, text.align)
  const exitUnits = text.exit.per === text.enter.per ? enterUnits : layoutUnits(ctx, content, text.exit.per, maxW, lineH, text.align)
  const exitStart = duration - text.exit.duration
  const exiting = text.exit.effect !== 'none' && t > exitStart
  const units = exiting ? exitUnits : enterUnits
  ctx.save()
  ctx.translate(w / 2, h / 2)
  units.forEach((u, i) => {
    const n = units.length
    const p = exiting ? staggered(duration - t, n - 1 - i, n, text.exit.duration) : staggered(t, i, n, text.enter.duration)
    const st = unitStyle(exiting ? text.exit.effect : text.enter.effect, p, px)
    if (st.alpha <= 0.001) return
    ctx.save()
    ctx.globalAlpha = st.alpha
    ctx.filter = st.blur > 0.3 ? `blur(${st.blur}px)` : 'none'
    const cx = u.x + u.w / 2 + st.dx
    const cy = u.y + st.dy
    ctx.translate(cx, cy)
    if (st.rot) ctx.rotate(st.rot)
    if (st.scale !== 1) ctx.scale(st.scale, st.scale)
    ctx.fillText(u.text, -u.w / 2, 0)
    ctx.restore()
  })
  ctx.restore()
  ctx.filter = 'none'
  ctx.globalAlpha = 1
}

/* ------------------------------------------------------------------ */
/* Logo card                                                           */
/* ------------------------------------------------------------------ */

function logoStyle(anim: LogoAnim, p: number) {
  const e = easeOut(p)
  switch (anim.effect) {
    case 'none':
      return { alpha: p > 0 ? 1 : 0, scale: 1, blur: 0, dy: 0 }
    case 'fade':
      return { alpha: e, scale: 1, blur: 0, dy: 0 }
    case 'scale':
      return { alpha: e, scale: 0.75 + 0.25 * e, blur: 0, dy: 0 }
    case 'blur':
      return { alpha: e, scale: 1.05 - 0.05 * e, blur: (1 - e) * 24, dy: 0 }
    case 'rise':
      return { alpha: e, scale: 1, blur: 0, dy: (1 - e) * 0.08 }
  }
}

let scratch: HTMLCanvasElement | null = null
function scratchCanvas(w: number, h: number) {
  if (!scratch) scratch = document.createElement('canvas')
  if (scratch.width !== w || scratch.height !== h) {
    scratch.width = w
    scratch.height = h
  }
  return scratch
}

function fillEffect(ctx: CanvasRenderingContext2D, effect: LogoState['effect'], w: number, h: number, t: number) {
  if (effect === 'liquid-metal') {
    const off = (t * 0.35) % 1
    const g = ctx.createLinearGradient(-w * 0.2 + off * w * 1.4, 0, w * 0.4 + off * w * 1.4, h)
    const stops: [number, string][] = [
      [0, '#6b6f78'],
      [0.18, '#f5f7fa'],
      [0.32, '#9aa0aa'],
      [0.5, '#ffffff'],
      [0.62, '#7c828c'],
      [0.8, '#e9edf2'],
      [1, '#5b5f67'],
    ]
    for (const [s, c] of stops) g.addColorStop(s, c)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  } else if (effect === 'heatmap') {
    const a = t * 0.8
    const g = ctx.createLinearGradient(w * (0.5 + 0.5 * Math.cos(a)), 0, w * (0.5 - 0.5 * Math.cos(a)), h)
    ;['#000004', '#3b0f70', '#8c2981', '#de4968', '#fe9f6d', '#fcfdbf'].forEach((c, i, arr) => g.addColorStop(i / (arr.length - 1), c))
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  } else if (effect === 'gem-smoke') {
    ctx.fillStyle = '#e8e8ee'
    ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 6; i++) {
      const x = w * (0.5 + 0.45 * Math.sin(t * 0.7 + i * 1.7))
      const y = h * (0.5 + 0.45 * Math.cos(t * 0.5 + i * 2.3))
      const r = Math.max(w, h) * (0.35 + 0.15 * Math.sin(t + i))
      const g = ctx.createRadialGradient(x, y, 0, x, y, r)
      g.addColorStop(0, i % 2 ? 'rgba(40,40,52,0.55)' : 'rgba(255,255,255,0.8)')
      g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
    }
  }
}

export function drawLogoCard(ctx: CanvasRenderingContext2D, w: number, h: number, logo: LogoState, image: HTMLImageElement | null, t: number, duration: number) {
  ctx.clearRect(0, 0, w, h)
  if (!image || !image.naturalWidth) return
  const exitStart = duration - logo.exit.duration
  const exiting = t > exitStart && logo.exit.effect !== 'none'
  const p = exiting ? clamp01((duration - t) / Math.max(0.01, logo.exit.duration)) : clamp01(t / Math.max(0.01, logo.enter.duration))
  const st = logoStyle(exiting ? logo.exit : logo.enter, p)
  const lh = (logo.scale / 20) * h
  const aspect = image.naturalWidth / image.naturalHeight
  let lw = lh * aspect
  let lhh = lh
  if (lw > w * 0.8) {
    lw = w * 0.8
    lhh = lw / aspect
  }
  const dw = Math.ceil(lw)
  const dh = Math.ceil(lhh)
  let source: CanvasImageSource = image
  if (logo.effect !== 'none') {
    const c = scratchCanvas(dw, dh)
    const sctx = c.getContext('2d')!
    sctx.globalCompositeOperation = 'source-over'
    sctx.clearRect(0, 0, dw, dh)
    fillEffect(sctx, logo.effect, dw, dh, t)
    sctx.globalCompositeOperation = 'destination-in'
    sctx.drawImage(image, 0, 0, dw, dh)
    sctx.globalCompositeOperation = 'source-over'
    source = c
  }
  ctx.save()
  ctx.globalAlpha = st.alpha
  ctx.filter = st.blur > 0.3 ? `blur(${(st.blur * h) / 1080}px)` : 'none'
  ctx.translate(w / 2, h / 2 + st.dy * h)
  ctx.scale(st.scale, st.scale)
  ctx.drawImage(source, -dw / 2, -dh / 2, dw, dh)
  ctx.restore()
  ctx.filter = 'none'
  ctx.globalAlpha = 1
}

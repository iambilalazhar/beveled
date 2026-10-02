import { fontStack } from '@/mockup/timeline/cardRender'
import type { TextPlacement, TextState2D } from '../types'

export type Region = { x: number; y: number; w: number; h: number }

/** Normalised (0..1, y down) regions for the text and the mockup for a placement. */
export function splitRegions(placement: TextPlacement, area: number): { text: Region; mockup: Region } {
  const a = Math.min(0.7, Math.max(0.12, area))
  switch (placement) {
    case 'top':
      return { text: { x: 0, y: 0, w: 1, h: a }, mockup: { x: 0, y: a, w: 1, h: 1 - a } }
    case 'bottom':
      return { text: { x: 0, y: 1 - a, w: 1, h: a }, mockup: { x: 0, y: 0, w: 1, h: 1 - a } }
    case 'left':
      return { text: { x: 0, y: 0, w: a, h: 1 }, mockup: { x: a, y: 0, w: 1 - a, h: 1 } }
    case 'right':
      return { text: { x: 1 - a, y: 0, w: a, h: 1 }, mockup: { x: 0, y: 0, w: 1 - a, h: 1 } }
    case 'overlay':
      return { text: { x: 0.06, y: 0.06, w: 0.88, h: 0.88 }, mockup: { x: 0, y: 0, w: 1, h: 1 } }
    default:
      return { text: { x: 0, y: 0, w: 0, h: 0 }, mockup: { x: 0, y: 0, w: 1, h: 1 } }
  }
}

type Token = { text: string; hl: boolean; width: number; space: number }
type Line = { tokens: Token[]; width: number }
type Block = { kind: 'eyebrow' | 'headline' | 'subtitle' | 'badge'; lines: Line[]; size: number; lineHeight: number; gapAfter: number; height: number; width: number }

function fontFor(t: TextState2D, kind: Block['kind'], size: number, hl: boolean) {
  const family = kind === 'headline' ? t.font : t.bodyFont
  const weight = kind === 'headline' ? t.weight : kind === 'subtitle' ? 400 : 600
  const italic = hl && t.highlight === 'italic' ? 'italic ' : ''
  return `${italic}${weight} ${size}px ${fontStack(family)}`
}

/** Splits "a *highlighted* phrase" into tokens; newlines force a break. */
function tokenize(text: string): { words: { text: string; hl: boolean }[]; breaks: Set<number> } {
  const words: { text: string; hl: boolean }[] = []
  const breaks = new Set<number>()
  let hl = false
  text.split('\n').forEach((line, li) => {
    if (li > 0) breaks.add(words.length)
    const parts = line.split('*')
    parts.forEach((part, pi) => {
      if (pi > 0) hl = !hl
      for (const w of part.split(/\s+/).filter(Boolean)) words.push({ text: w, hl })
    })
  })
  return { words, breaks }
}

function setSpacing(ctx: CanvasRenderingContext2D, px: number) {
  const c = ctx as CanvasRenderingContext2D & { letterSpacing?: string }
  if ('letterSpacing' in c) c.letterSpacing = `${px}px`
}

function layoutBlock(ctx: CanvasRenderingContext2D, t: TextState2D, kind: Block['kind'], raw: string, size: number, maxW: number, lineHeight: number, gapAfter: number): Block | null {
  const text = kind === 'eyebrow' ? raw.toUpperCase() : kind === 'headline' && t.uppercase ? raw.toUpperCase() : raw
  if (!text.trim()) return null
  const { words, breaks } = tokenize(kind === 'headline' ? text : text.replace(/\*/g, ''))
  const spacing = kind === 'headline' ? (t.spacing / 100) * size : kind === 'eyebrow' ? size * 0.14 : 0
  setSpacing(ctx, spacing)
  const tokens: Token[] = words.map((w) => {
    ctx.font = fontFor(t, kind, size, w.hl)
    return { text: w.text, hl: w.hl, width: ctx.measureText(w.text).width, space: ctx.measureText(' ').width }
  })
  setSpacing(ctx, 0)
  const lines: Line[] = []
  let cur: Line = { tokens: [], width: 0 }
  tokens.forEach((tok, i) => {
    const add = (cur.tokens.length ? tok.space : 0) + tok.width
    if (cur.tokens.length && (breaks.has(i) || cur.width + add > maxW)) {
      lines.push(cur)
      cur = { tokens: [], width: 0 }
    }
    cur.width += (cur.tokens.length ? tok.space : 0) + tok.width
    cur.tokens.push(tok)
  })
  if (cur.tokens.length) lines.push(cur)
  const lh = size * lineHeight
  const padY = kind === 'badge' ? size * 0.7 : 0
  return { kind, lines, size, lineHeight: lh, gapAfter, height: lines.length * lh + padY * 2, width: Math.max(...lines.map((l) => l.width)) }
}

export type Bounds = { x: number; y: number; w: number; h: number }

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const easeOut = (v: number) => 1 - Math.pow(1 - clamp01(v), 3)

/** Entrance progress (0..1) of unit i of n at time t, staggered over `duration`. */
export function unitProgress(t: number, i: number, n: number, duration: number) {
  if (duration <= 0) return 1
  if (n <= 1) return easeOut(t / duration)
  const each = duration * 0.45
  const delay = (i / Math.max(1, n - 1)) * (duration - each)
  return easeOut((t - delay) / each)
}

/**
 * Draws the eyebrow / headline / subtitle / badge stack into `region` (pixels), shrinking it until it fits.
 * `time` (seconds since the entrance started) animates it; pass null for the final state.
 * Returns the bounds of the block in pixels.
 */
export function drawTextBlock(ctx: CanvasRenderingContext2D, W: number, H: number, t: TextState2D, region: Region, time: number | null = null): Bounds | null {
  const short = Math.min(W, H)
  const vertical = t.placement === 'left' || t.placement === 'right'
  const padX = vertical ? region.w * 0.12 : Math.max(region.w * 0.07, short * 0.05)
  const maxW = Math.max(10, region.w - padX * 2)
  let k = 1
  let blocks: Block[] = []
  let total = 0
  for (let attempt = 0; attempt < 14; attempt++) {
    const hs = (t.size / 100) * short * k
    blocks = [
      layoutBlock(ctx, t, 'eyebrow', t.eyebrow, Math.max(10, hs * 0.26), maxW, 1.2, hs * 0.32),
      layoutBlock(ctx, t, 'headline', t.headline, hs, maxW, t.lineHeight, hs * 0.32),
      layoutBlock(ctx, t, 'subtitle', t.subtitle, Math.max(10, hs * 0.38), maxW * (vertical ? 1 : 0.86), 1.35, hs * 0.5),
      layoutBlock(ctx, t, 'badge', t.badge, Math.max(10, hs * 0.27), maxW, 1.1, 0),
    ].filter((b): b is Block => !!b)
    if (blocks.length) blocks[blocks.length - 1].gapAfter = 0
    total = blocks.reduce((a, b) => a + b.height + b.gapAfter, 0)
    if (total <= region.h * 0.86) break
    k *= 0.9
  }
  if (!blocks.length) return null
  const ox = t.offsetX * W
  const oy = t.offsetY * H
  let y = region.y + (region.h - total) / 2 + oy
  const lineX = (w: number) => ox + (t.align === 'left' ? region.x + padX : t.align === 'right' ? region.x + region.w - padX - w : region.x + region.w / 2 - w / 2)

  // Entrance: count animation units for the chosen granularity.
  const mode = t.animate === false ? 'none' : t.enter
  const animating = time !== null && mode !== 'none'
  const per = mode === 'lines' ? 'line' : mode === 'words' || mode === 'pop' ? 'word' : mode === 'letters' ? 'char' : 'block'
  let units = 0
  for (const b of blocks) {
    if (b.kind === 'badge') units += 1
    else if (per === 'line') units += b.lines.length
    else if (per === 'word') units += b.lines.reduce((a, l) => a + l.tokens.length, 0)
    else if (per === 'char') units += b.lines.reduce((a, l) => a + l.tokens.reduce((c, tk) => c + tk.text.length, 0), 0)
  }
  if (per === 'block') units = 1
  let unit = 0
  const blockProgress = animating ? unitProgress(time!, 0, 1, t.enterDuration) : 1
  /** Applies the entrance transform for one unit; returns false when the unit is invisible. */
  const enter = (cx: number, cy: number, size: number, progress: number) => {
    if (!animating) return true
    const p = per === 'block' ? blockProgress : progress
    if (p <= 0.001) return false
    ctx.globalAlpha = p
    if (mode === 'rise' || mode === 'lines' || mode === 'words') ctx.translate(0, (1 - p) * size * 0.55)
    if (mode === 'pop') {
      const sc = 0.6 + 0.4 * p + Math.sin(p * Math.PI) * 0.08
      ctx.translate(cx, cy)
      ctx.scale(sc, sc)
      ctx.translate(-cx, -cy)
    }
    if ((mode === 'blur' || mode === 'words') && p < 1) ctx.filter = `blur(${(1 - p) * size * (mode === 'blur' ? 0.25 : 0.12)}px)`
    return true
  }
  const nextProgress = () => (animating ? unitProgress(time!, unit++, units, t.enterDuration) : 1)

  let minX = Infinity
  let maxX = -Infinity
  const top = y
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'
  for (const b of blocks) {
    if (b.kind === 'badge') {
      const padH = b.size * 1.1
      const w = b.width + padH * 2
      const x = lineX(w)
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x + w)
      const p = nextProgress()
      ctx.save()
      if (enter(x + w / 2, y + b.height / 2, b.size, p)) {
        ctx.fillStyle = t.accent
        ctx.beginPath()
        ctx.roundRect(x, y, w, b.height, b.height / 2)
        ctx.fill()
        ctx.fillStyle = t.badgeText
        ctx.font = fontFor(t, 'badge', b.size, false)
        ctx.fillText(b.lines[0].tokens.map((tk) => tk.text).join(' '), x + padH, y + b.height / 2 + b.size * 0.36)
      }
      ctx.restore()
      y += b.height + b.gapAfter
      continue
    }
    const color = b.kind === 'eyebrow' ? t.accent : b.kind === 'subtitle' ? t.subColor : t.color
    const spacing = b.kind === 'headline' ? (t.spacing / 100) * b.size : b.kind === 'eyebrow' ? b.size * 0.14 : 0
    for (const line of b.lines) {
      let x = lineX(line.width)
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x + line.width)
      const baseline = y + b.lineHeight * 0.5 + b.size * 0.35
      const lineP = per === 'line' ? nextProgress() : 1
      line.tokens.forEach((tok, i) => {
        if (i > 0) x += tok.space
        const hl = tok.hl && b.kind === 'headline'
        const wordP = per === 'word' ? nextProgress() : lineP
        const drawToken = (text: string, tx: number, tw: number, p: number, withDecor: boolean) => {
          ctx.save()
          if (enter(tx + tw / 2, baseline - b.size * 0.35, b.size, p)) {
            ctx.font = fontFor(t, b.kind, b.size, tok.hl)
            setSpacing(ctx, spacing)
            if (withDecor && hl && t.highlight === 'marker') {
              const pad = b.size * 0.1
              ctx.fillStyle = t.accent
              ctx.beginPath()
              ctx.roundRect(tx - pad, baseline - b.size * 0.8, tw + pad * 2 + (line.tokens[i + 1]?.hl ? tok.space : 0), b.size * 1.0, b.size * 0.14)
              ctx.fill()
            }
            ctx.fillStyle = hl ? (t.highlight === 'marker' ? t.badgeText : t.accent) : color
            if (withDecor && hl && t.highlight === 'underline') ctx.fillRect(tx, baseline + b.size * 0.1, tw + (line.tokens[i + 1]?.hl ? tok.space : 0), Math.max(2, b.size * 0.07))
            ctx.fillText(text, tx, baseline)
          }
          ctx.restore()
        }
        if (per === 'char' && animating) {
          ctx.font = fontFor(t, b.kind, b.size, tok.hl)
          setSpacing(ctx, spacing)
          let cx = x
          // Decorations ride on the first character.
          for (let ci = 0; ci < tok.text.length; ci++) {
            const ch = tok.text[ci]
            const cw = ctx.measureText(ch).width
            drawToken(ch, cx, ci === 0 ? tok.width : cw, nextProgress(), ci === 0)
            ctx.font = fontFor(t, b.kind, b.size, tok.hl)
            setSpacing(ctx, spacing)
            cx += cw
          }
        } else {
          if (per === 'char') unit += tok.text.length
          drawToken(tok.text, x, tok.width, wordP, true)
        }
        x += tok.width
      })
      setSpacing(ctx, 0)
      y += b.lineHeight
    }
    y += b.gapAfter
  }
  return { x: minX, y: top, w: maxX - minX, h: y - top }
}

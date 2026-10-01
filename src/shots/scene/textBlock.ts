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

/** Draws the eyebrow / headline / subtitle / badge stack into `region` (pixels), shrinking it until it fits. */
export function drawTextBlock(ctx: CanvasRenderingContext2D, W: number, H: number, t: TextState2D, region: Region) {
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
  let y = region.y + (region.h - total) / 2
  const lineX = (w: number) => (t.align === 'left' ? region.x + padX : t.align === 'right' ? region.x + region.w - padX - w : region.x + region.w / 2 - w / 2)
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'
  for (const b of blocks) {
    if (b.kind === 'badge') {
      const padH = b.size * 1.1
      const w = b.width + padH * 2
      const x = lineX(w)
      ctx.fillStyle = t.accent
      ctx.beginPath()
      ctx.roundRect(x, y, w, b.height, b.height / 2)
      ctx.fill()
      ctx.fillStyle = t.badgeText
      ctx.font = fontFor(t, 'badge', b.size, false)
      ctx.fillText(b.lines[0].tokens.map((tk) => tk.text).join(' '), x + padH, y + b.height / 2 + b.size * 0.36)
      y += b.height + b.gapAfter
      continue
    }
    const color = b.kind === 'eyebrow' ? t.accent : b.kind === 'subtitle' ? t.subColor : t.color
    const spacing = b.kind === 'headline' ? (t.spacing / 100) * b.size : b.kind === 'eyebrow' ? b.size * 0.14 : 0
    for (const line of b.lines) {
      let x = lineX(line.width)
      const baseline = y + b.lineHeight * 0.5 + b.size * 0.35
      line.tokens.forEach((tok, i) => {
        if (i > 0) x += tok.space
        ctx.font = fontFor(t, b.kind, b.size, tok.hl)
        setSpacing(ctx, spacing)
        if (tok.hl && b.kind === 'headline' && t.highlight === 'marker') {
          const pad = b.size * 0.1
          ctx.fillStyle = t.accent
          ctx.beginPath()
          ctx.roundRect(x - pad, baseline - b.size * 0.8, tok.width + pad * 2 + (line.tokens[i + 1]?.hl ? tok.space : 0), b.size * 1.0, b.size * 0.14)
          ctx.fill()
          ctx.fillStyle = t.badgeText
        } else ctx.fillStyle = tok.hl && b.kind === 'headline' ? t.accent : color
        if (tok.hl && b.kind === 'headline' && t.highlight === 'underline') {
          ctx.fillRect(x, baseline + b.size * 0.1, tok.width + (line.tokens[i + 1]?.hl ? tok.space : 0), Math.max(2, b.size * 0.07))
        }
        ctx.fillText(tok.text, x, baseline)
        x += tok.width
      })
      setSpacing(ctx, 0)
      y += b.lineHeight
    }
    y += b.gapAfter
  }
}

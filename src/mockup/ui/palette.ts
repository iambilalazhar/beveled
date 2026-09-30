/** Extracts a small palette of dominant, reasonably saturated colours from an image URL. */
export async function extractPalette(url: string, count = 5): Promise<string[]> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image()
    el.crossOrigin = 'anonymous'
    el.onload = () => resolve(el)
    el.onerror = () => reject(new Error('palette: image failed'))
    el.src = url
  })
  const size = 48
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0, size, size)
  const data = ctx.getImageData(0, 0, size, size).data
  // Bucket by quantised colour, weight by saturation so accent colours win over greys.
  const buckets = new Map<number, { r: number; g: number; b: number; n: number; w: number }>()
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const sat = max === 0 ? 0 : (max - min) / max
    const key = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5)
    const e = buckets.get(key) ?? { r: 0, g: 0, b: 0, n: 0, w: 0 }
    e.r += r
    e.g += g
    e.b += b
    e.n += 1
    e.w += 0.25 + sat * 2
    buckets.set(key, e)
  }
  const sorted = [...buckets.values()].sort((a, b) => b.w - a.w)
  const out: [number, number, number][] = []
  for (const e of sorted) {
    const c3: [number, number, number] = [e.r / e.n, e.g / e.n, e.b / e.n]
    if (out.every((o) => Math.hypot(o[0] - c3[0], o[1] - c3[1], o[2] - c3[2]) > 60)) out.push(c3)
    if (out.length >= count) break
  }
  return out.map(([r, g, b]) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join(''))
}

const hexToRgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number]
const rgbToHex = (r: number, g: number, b: number) => '#' + [r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')

export function shade(hex: string, k: number) {
  const [r, g, b] = hexToRgb(hex)
  return k < 0 ? rgbToHex(r * (1 + k), g * (1 + k), b * (1 + k)) : rgbToHex(r + (255 - r) * k, g + (255 - g) * k, b + (255 - b) * k)
}

/** Background suggestions built from a palette. */
export function paletteBackgrounds(p: string[]) {
  if (!p.length) return []
  const a = p[0]
  const b = p[1] ?? shade(a, -0.5)
  const c = p[2] ?? shade(a, 0.4)
  return [
    { kind: 'linear' as const, colors: [a, b, c], angle: 135 },
    { kind: 'radial' as const, colors: [shade(a, 0.1), shade(a, -0.75)], angle: 0 },
    { kind: 'linear' as const, colors: [shade(b, 0.55), shade(a, 0.35)], angle: 160 },
    { kind: 'radial' as const, colors: [shade(c, -0.1), shade(b, -0.8)], angle: 0 },
    { kind: 'linear' as const, colors: [shade(a, -0.7), shade(b, -0.2), shade(c, 0.2)], angle: 120 },
    { kind: 'solid' as const, colors: [shade(a, 0.82)], angle: 0 },
  ]
}

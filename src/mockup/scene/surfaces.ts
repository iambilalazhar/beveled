import * as THREE from 'three'
import type { SurfaceKind } from '../presets'

/* Procedural surface textures for the 3-D sets. Grey-scale detail maps, tinted by the material colour. */

function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

/** Tileable value noise: a lattice of `cells` random values, smoothly interpolated with wrap-around. */
function valueNoise(size: number, cells: number, seed: number): Float32Array {
  const rand = rng(seed)
  const lattice = new Float32Array(cells * cells).map(() => rand())
  const out = new Float32Array(size * size)
  const fade = (t: number) => t * t * (3 - 2 * t)
  for (let y = 0; y < size; y++) {
    const fy = (y / size) * cells
    const y0 = Math.floor(fy)
    const ty = fade(fy - y0)
    const y1 = (y0 + 1) % cells
    for (let x = 0; x < size; x++) {
      const fx = (x / size) * cells
      const x0 = Math.floor(fx)
      const tx = fade(fx - x0)
      const x1 = (x0 + 1) % cells
      const a = lattice[y0 * cells + x0]
      const b = lattice[y0 * cells + x1]
      const c = lattice[y1 * cells + x0]
      const d = lattice[y1 * cells + x1]
      out[y * size + x] = (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty
    }
  }
  return out
}

function fbm(size: number, octaves: [number, number][], seed: number): Float32Array {
  const out = new Float32Array(size * size)
  let total = 0
  octaves.forEach(([cells, weight], i) => {
    const n = valueNoise(size, cells, seed + i * 101)
    for (let j = 0; j < out.length; j++) out[j] += n[j] * weight
    total += weight
  })
  for (let j = 0; j < out.length; j++) out[j] /= total
  return out
}

function toCanvas(size: number, pixel: (i: number, x: number, y: number) => number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  const ctx = c.getContext('2d')!
  const img = ctx.createImageData(size, size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x
      const v = Math.max(0, Math.min(255, Math.round(pixel(i, x, y) * 255)))
      img.data[i * 4] = v
      img.data[i * 4 + 1] = v
      img.data[i * 4 + 2] = v
      img.data[i * 4 + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return c
}

export type SurfaceMaps = { map: THREE.Texture; roughnessMap: THREE.Texture; emissiveMap: THREE.Texture | null }

const cache = new Map<SurfaceKind, SurfaceMaps>()

function texture(canvas: HTMLCanvasElement, srgb: boolean) {
  const t = new THREE.CanvasTexture(canvas)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.anisotropy = 8
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  return t
}

function build(kind: SurfaceKind): SurfaceMaps {
  const size = 512
  if (kind === 'concrete' || kind === 'plaster') {
    const base = fbm(size, [[4, 0.6], [8, 0.6], [16, 0.45], [64, 0.35]], kind === 'concrete' ? 11 : 37)
    const pores = valueNoise(size, 128, 5)
    const rand = rng(91)
    const speck = new Float32Array(size * size).map(() => (rand() > 0.985 ? rand() : 0))
    const plaster = kind === 'plaster'
    const albedo = toCanvas(size, (i) => (plaster ? 0.86 + (base[i] - 0.5) * 0.12 : 0.76 + (base[i] - 0.5) * 0.32 - speck[i] * 0.3 + (pores[i] - 0.5) * 0.08))
    const rough = toCanvas(size, (i) => 0.6 + (base[i] - 0.5) * 0.5 + speck[i] * 0.3)
    return { map: texture(albedo, true), roughnessMap: texture(rough, false), emissiveMap: null }
  }
  if (kind === 'wood') {
    const grain = fbm(size, [[2, 1], [6, 0.4]], 21)
    const fine = valueNoise(size, 96, 3)
    const planks = 6
    const albedo = toCanvas(size, (i, x, y) => {
      const plank = Math.floor((y / size) * planks)
      const tone = 0.82 + ((plank * 37) % 7) / 40
      const v = y / size + grain[i] * 0.08 + plank * 0.13
      const rings = 0.5 + 0.5 * Math.sin(v * 160 + Math.sin(x / size * Math.PI * 4 + plank) * 2.2)
      const seam = (y % (size / planks)) < 2 ? 0.55 : 1
      return (tone - rings * 0.13 - (fine[i] - 0.5) * 0.05) * seam
    })
    const rough = toCanvas(size, (i) => 0.45 + (fine[i] - 0.5) * 0.25)
    return { map: texture(albedo, true), roughnessMap: texture(rough, false), emissiveMap: null }
  }
  if (kind === 'grid') {
    const n = fbm(size, [[8, 1], [32, 0.4]], 13)
    const line = (p: number, every: number, w: number) => (p % every < w ? 1 : 0)
    const albedo = toCanvas(size, (i, x, y) => 0.92 + (n[i] - 0.5) * 0.08 + Math.max(line(x, 32, 1), line(y, 32, 1)) * 1.2)
    const emissive = toCanvas(size, (_i, x, y) => Math.max(line(x, 32, 1), line(y, 32, 1)) * 0.45 + Math.max(line(x, 256, 2), line(y, 256, 2)) * 0.35)
    const rough = toCanvas(size, (i) => 0.4 + (n[i] - 0.5) * 0.3)
    return { map: texture(albedo, true), roughnessMap: texture(rough, false), emissiveMap: texture(emissive, true) }
  }
  // matte
  const n = fbm(size, [[8, 1], [32, 0.5], [128, 0.25]], 17)
  const albedo = toCanvas(size, (i) => 0.95 + (n[i] - 0.5) * 0.03)
  const rough = toCanvas(size, (i) => 0.7 + (n[i] - 0.5) * 0.15)
  return { map: texture(albedo, true), roughnessMap: texture(rough, false), emissiveMap: null }
}

export function surfaceMaps(kind: SurfaceKind): SurfaceMaps {
  let maps = cache.get(kind)
  if (!maps) {
    maps = build(kind)
    cache.set(kind, maps)
  }
  return maps
}

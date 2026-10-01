import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { FINISH_BY_ID } from '../presets'
import type { FinishId } from '../types'
import { effectOn } from './effectState'
import { useShotScene } from './shotContext'

/* ------------------------------------------------------------------ */
/* Materials                                                           */
/* ------------------------------------------------------------------ */

export type DeviceMaterials = {
  frame: THREE.MeshPhysicalMaterial
  back: THREE.MeshPhysicalMaterial
  glass: THREE.MeshPhysicalMaterial
  lens: THREE.MeshPhysicalMaterial
  darkMetal: THREE.MeshPhysicalMaterial
  rubber: THREE.MeshStandardMaterial
  port: THREE.MeshStandardMaterial
  keycap: THREE.MeshStandardMaterial
  trackpad: THREE.MeshPhysicalMaterial
  accent: THREE.MeshPhysicalMaterial
}

function mix(hex: string, towards: string, k: number) {
  return new THREE.Color(hex).lerp(new THREE.Color(towards), k)
}

/** Physically based materials for a finish. Shared by every part of a device; disposed on change. */
export function useDeviceMaterials(finishId: FinishId, envIntensity: number): DeviceMaterials {
  const finish = FINISH_BY_ID[finishId] ?? FINISH_BY_ID['space-black']
  const fx = useShotScene('effects')
  // Liquid glass on the mockup turns the body into clear, refractive glass tinted by the finish.
  const glassOn = effectOn(fx, 'liquidGlass', fx.liquidGlass) && fx.liquidGlassTarget === 'mockup'
  const glassStrength = glassOn ? Math.round(fx.liquidGlass * 100) / 100 : -1
  const glassShine = glassOn ? Math.round(fx.liquidGlassShine * 100) / 100 : 0
  const mats = useMemo<DeviceMaterials>(() => {
    const base = new THREE.Color(finish.color)
    const light = base.getHSL({ h: 0, s: 0, l: 0 }).l > 0.6
    const out: DeviceMaterials = {
      frame: new THREE.MeshPhysicalMaterial({ color: base, metalness: light ? 0.7 : 0.88, roughness: light ? 0.3 : Math.max(0.2, finish.roughness - 0.08), clearcoat: 0.35, clearcoatRoughness: 0.25 }),
      back: new THREE.MeshPhysicalMaterial({ color: mix(finish.color, light ? '#ffffff' : '#9a9a9a', 0.12), metalness: 0.35, roughness: 0.62, clearcoat: 0.6, clearcoatRoughness: 0.55 }),
      glass: new THREE.MeshPhysicalMaterial({ color: '#030304', metalness: 0, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.03, reflectivity: 0.6 }),
      lens: new THREE.MeshPhysicalMaterial({ color: '#050608', metalness: 0.2, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.02, iridescence: 1, iridescenceIOR: 1.8, iridescenceThicknessRange: [180, 520] }),
      darkMetal: new THREE.MeshPhysicalMaterial({ color: '#1b1c1f', metalness: 0.85, roughness: 0.28, clearcoat: 0.4 }),
      rubber: new THREE.MeshStandardMaterial({ color: '#141416', metalness: 0, roughness: 0.92 }),
      port: new THREE.MeshStandardMaterial({ color: '#060607', metalness: 0.2, roughness: 0.7 }),
      keycap: new THREE.MeshStandardMaterial({ color: '#0c0c0e', metalness: 0.05, roughness: 0.55 }),
      trackpad: new THREE.MeshPhysicalMaterial({ color: mix(finish.color, '#808080', 0.08), metalness: 0.55, roughness: 0.32, clearcoat: 0.8, clearcoatRoughness: 0.2 }),
      accent: new THREE.MeshPhysicalMaterial({ color: '#ff6a13', metalness: 0.4, roughness: 0.35, clearcoat: 0.6 }),
    }
    if (glassStrength >= 0) {
      const glass = { strength: glassStrength, shine: glassShine }
      const make = () =>
        new THREE.MeshPhysicalMaterial({
          color: mix(finish.color, '#ffffff', 0.55),
          metalness: 0,
          roughness: 0.04 + (1 - glass.strength) * 0.12,
          transmission: 0.55 + glass.strength * 0.45,
          thickness: 0.35,
          ior: 1.5,
          clearcoat: 1,
          clearcoatRoughness: 0.02,
          iridescence: glass.shine,
          iridescenceIOR: 1.6,
          specularIntensity: 1,
          attenuationColor: new THREE.Color(finish.color),
          attenuationDistance: 1.2,
        })
      out.frame = make()
      out.back = make()
      out.trackpad = make()
    }
    return out
  }, [finish, glassStrength, glassShine])
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats])
  for (const m of Object.values(mats)) (m as THREE.MeshStandardMaterial).envMapIntensity = envIntensity
  return mats
}

/* ------------------------------------------------------------------ */
/* Textures                                                            */
/* ------------------------------------------------------------------ */

const textureCache = new Map<string, THREE.CanvasTexture>()

function canvasTexture(key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void, repeat?: [number, number]) {
  let t = textureCache.get(key)
  if (t) return t
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d')!)
  t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(repeat[0], repeat[1])
  }
  textureCache.set(key, t)
  return t
}

/** Perforated speaker grille alpha map (white = hole). */
export function grilleTexture() {
  return canvasTexture('grille', 128, 128, (ctx) => {
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, 128, 128)
    ctx.fillStyle = '#fff'
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        ctx.beginPath()
        ctx.arc(x * 8 + 4 + (y % 2) * 4, y * 8 + 4, 1.7, 0, Math.PI * 2)
        ctx.fill()
      }
  })
}

/** Pro Display XDR style lattice (spheres machined into the back). */
export function latticeTexture() {
  return canvasTexture('lattice', 256, 256, (ctx) => {
    ctx.fillStyle = '#b9bcc2'
    ctx.fillRect(0, 0, 256, 256)
    const step = 32
    for (let y = 0; y <= 8; y++)
      for (let x = 0; x <= 8; x++) {
        const cx = x * step + (y % 2) * (step / 2)
        const cy = y * step
        const g = ctx.createRadialGradient(cx - 4, cy - 4, 1, cx, cy, 15)
        g.addColorStop(0, '#f4f5f7')
        g.addColorStop(0.55, '#8d9097')
        g.addColorStop(1, '#3b3d42')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(cx, cy, 14, 0, Math.PI * 2)
        ctx.fill()
      }
  })
}

/** Knurled crown / band texture (vertical ridges). */
export function ridgeTexture() {
  return canvasTexture('ridges', 128, 16, (ctx) => {
    for (let x = 0; x < 128; x++) {
      const v = 120 + Math.round(90 * Math.abs(Math.sin((x / 128) * Math.PI * 24)))
      ctx.fillStyle = `rgb(${v},${v},${v})`
      ctx.fillRect(x, 0, 1, 16)
    }
  })
}

/* ------------------------------------------------------------------ */
/* Laptop keyboard                                                     */
/* ------------------------------------------------------------------ */

type Key = { x: number; y: number; w: number; h: number }

/** MacBook-style key layout in key units (1u = one alpha key incl. gap). */
export function keyboardLayout(): { keys: Key[]; width: number; height: number } {
  const rows: { h: number; keys: number[] }[] = [
    { h: 0.55, keys: [1.5, ...Array(12).fill(1), 1] },
    { h: 1, keys: [...Array(13).fill(1), 1.5] },
    { h: 1, keys: [1.5, ...Array(12).fill(1), 1] },
    { h: 1, keys: [1.75, ...Array(11).fill(1), 1.75] },
    { h: 1, keys: [2.25, ...Array(10).fill(1), 2.25] },
  ]
  const keys: Key[] = []
  let y = 0
  for (const row of rows) {
    let x = 0
    for (const w of row.keys) {
      keys.push({ x: x + w / 2, y: y + row.h / 2, w, h: row.h })
      x += w
    }
    y += row.h
  }
  // Bottom row: fn ctrl opt cmd space cmd opt ← ↑↓ →
  const bottom = [1, 1, 1, 1.25, 5, 1.25, 1]
  let x = 0
  for (const w of bottom) {
    keys.push({ x: x + w / 2, y: y + 0.5, w, h: 1 })
    x += w
  }
  keys.push({ x: x + 0.5, y: y + 0.75, w: 1, h: 0.5 })
  keys.push({ x: x + 1.5, y: y + 0.25, w: 1, h: 0.5 })
  keys.push({ x: x + 1.5, y: y + 0.75, w: 1, h: 0.5 })
  keys.push({ x: x + 2.5, y: y + 0.75, w: 1, h: 0.5 })
  return { keys, width: 14.5, height: y + 1 }
}

export function keyboardDepth(width: number) {
  const l = keyboardLayout()
  return (l.height / l.width) * width
}

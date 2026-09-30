import type { DeviceState } from '../types'
import { MM, modelFor, type DeviceModel } from './models'

export type DeviceLayout = {
  kind: DeviceState['kind']
  model: DeviceModel
  /** Body dimensions in scene units (portrait frame; for laptops the lid). */
  bodyW: number
  bodyH: number
  bodyD: number
  bodyRadius: number
  screenW: number
  screenH: number
  screenRadius: number
  /** Screen centre offset (local, before orientation) */
  screenOffsetY: number
  /** Effective aspect used for the media (after orientation). */
  screenAspect: number
  rotated: boolean
  /** World-space bottom of the device (for floor/shadows) */
  bottomY: number
  /** World-space vertical centre of the visual mass */
  centerY: number
  /** Radius of a sphere that comfortably contains the device (used for shadows, floor, pan) */
  fitRadius: number
  /** Half extents used by the camera rig to frame the device horizontally / vertically */
  fitW: number
  fitH: number
  /** World-space screen centre */
  screenCenter: [number, number, number]
  /** Browser title bar height, when applicable */
  barH: number
  /** Laptop base size */
  baseDepth: number
  baseThick: number
  /** Monitor stand height, watch band length */
  standH: number
}

export const WATCH_BAND_LENGTH = 0.34

const clampAspect = (a: number) => Math.min(2.6, Math.max(0.45, a || 16 / 9))

type Core = Omit<DeviceLayout, 'screenAspect' | 'rotated' | 'bottomY' | 'centerY' | 'fitRadius' | 'fitW' | 'fitH' | 'screenCenter' | 'baseDepth' | 'baseThick' | 'standH'> &
  Partial<Pick<DeviceLayout, 'baseDepth' | 'baseThick' | 'standH'>>

function slab(p: Core, rotated: boolean, scale: number): DeviceLayout {
  const w = rotated ? p.bodyH : p.bodyW
  const h = rotated ? p.bodyW : p.bodyH
  return {
    baseDepth: 0,
    baseThick: 0,
    standH: 0,
    ...p,
    screenAspect: rotated ? p.screenH / p.screenW : p.screenW / p.screenH,
    rotated,
    bottomY: (-h / 2) * scale,
    centerY: 0,
    fitRadius: Math.hypot(w / 2, h / 2) * 1.06 * scale,
    fitW: Math.hypot(w / 2, p.bodyD) * 1.08 * scale,
    fitH: Math.hypot(h / 2, p.bodyD) * 1.08 * scale,
    screenCenter: [0, 0, (p.bodyD / 2) * scale],
  }
}

export function computeDeviceLayout(device: DeviceState, mediaAspect: number): DeviceLayout {
  const model = modelFor(device.kind, device.model)
  const spec = model.spec
  const s = device.scale
  const rotatable = device.kind === 'phone' || device.kind === 'android' || device.kind === 'tablet'
  const rotated = rotatable && device.orientation === 'landscape'

  if (spec && (spec.family === 'phone' || spec.family === 'android' || spec.family === 'tablet')) {
    const bodyW = spec.w * MM
    const bodyH = spec.h * MM
    const screenW = (spec.w - spec.bezel * 2) * MM
    // Height follows the real screen aspect so screenshots map pixel-perfectly.
    const screenH = screenW * (spec.res[1] / spec.res[0])
    return slab(
      { kind: device.kind, model, bodyW, bodyH, bodyD: spec.d * MM, bodyRadius: spec.corner * MM, screenW, screenH, screenRadius: spec.screenCorner * MM, screenOffsetY: 0, barH: 0 },
      rotated,
      s
    )
  }

  if (spec && spec.family === 'watch') {
    const bodyW = spec.w * MM
    const bodyH = spec.h * MM
    const screenW = (spec.w - spec.bezel * 2) * MM
    const screenH = screenW * (spec.res[1] / spec.res[0])
    const l = slab(
      { kind: device.kind, model, bodyW, bodyH, bodyD: spec.d * MM, bodyRadius: spec.corner * MM, screenW, screenH, screenRadius: spec.screenCorner * MM, screenOffsetY: 0, barH: 0, standH: WATCH_BAND_LENGTH },
      false,
      s
    )
    return {
      ...l,
      bottomY: l.bottomY - WATCH_BAND_LENGTH * s,
      fitRadius: (bodyH / 2 + WATCH_BAND_LENGTH) * 0.9 * s,
      fitW: (bodyW / 2) * 1.9 * s,
      fitH: (bodyH / 2 + WATCH_BAND_LENGTH * 0.55) * 1.05 * s,
    }
  }

  if (spec && spec.family === 'laptop') {
    const [side, top, chin] = spec.bezel
    const bodyW = spec.w * MM
    const screenW = (spec.w - side * 2) * MM
    const screenH = screenW * (spec.res[1] / spec.res[0])
    const bodyH = screenH + (top + chin) * MM
    const bodyD = spec.lidThick * MM
    const baseDepth = spec.depth * MM
    const baseThick = spec.baseThick * MM
    const angle = (device.lidAngle * Math.PI) / 180
    const lidTopY = baseThick + Math.sin(angle) * bodyH
    const screenOffsetY = ((chin - top) / 2) * MM
    return {
      kind: device.kind,
      model,
      bodyW,
      bodyH,
      bodyD,
      bodyRadius: spec.corner * MM,
      screenW,
      screenH,
      screenRadius: 0.1 * spec.corner * MM,
      screenOffsetY,
      screenAspect: screenW / screenH,
      rotated: false,
      bottomY: 0,
      centerY: (lidTopY / 2) * s,
      fitRadius: Math.max(bodyW / 2, baseDepth / 2, lidTopY / 2) * 1.12 * s,
      fitW: Math.hypot(bodyW / 2, baseDepth / 2) * 0.98 * s,
      fitH: Math.max(lidTopY, baseDepth * 0.9) * 0.62 * s,
      screenCenter: [0, (baseThick + Math.sin(angle) * (bodyH / 2 + screenOffsetY)) * s, (-baseDepth / 2 + Math.cos(angle) * (bodyH / 2)) * s],
      barH: 0,
      baseDepth,
      baseThick,
      standH: 0,
    }
  }

  if (spec && spec.family === 'monitor') {
    const bodyW = spec.w * MM
    const bodyH = spec.h * MM
    const screenW = (spec.w - spec.bezel * 2) * MM
    const screenH = screenW * (spec.res[1] / spec.res[0])
    const standH = spec.standH * MM
    const footThick = 0.06
    const bottom = -(bodyH / 2 + standH + footThick)
    return {
      kind: device.kind,
      model,
      bodyW,
      bodyH,
      bodyD: spec.d * MM,
      bodyRadius: spec.corner * MM,
      screenW,
      screenH,
      screenRadius: 0.004,
      screenOffsetY: 0,
      screenAspect: screenW / screenH,
      rotated: false,
      bottomY: bottom * s,
      centerY: (-standH / 2) * s,
      fitRadius: Math.hypot(bodyW / 2, (bodyH + standH) / 2) * 1.02 * s,
      fitW: (bodyW / 2) * 1.1 * s,
      fitH: ((bodyH + standH + footThick) / 2) * 1.12 * s,
      screenCenter: [0, 0, (spec.d * MM * 0.5) * s],
      barH: 0,
      baseDepth: 0,
      baseThick: 0,
      standH,
    }
  }

  if (device.kind === 'browser') {
    const aspect = clampAspect(mediaAspect)
    const screenW = 3.0
    const screenH = screenW / aspect
    const barH = 0.17
    return slab(
      { kind: device.kind, model, bodyW: screenW, bodyH: screenH + barH, bodyD: 0.035, bodyRadius: Math.max(0.02, device.screenRadius), screenW, screenH, screenRadius: 0, screenOffsetY: -barH / 2, barH },
      false,
      s
    )
  }

  if (device.kind === 'custom') {
    // Custom models are normalised to fit a 1.6-unit box (see CustomModel).
    return slab({ kind: device.kind, model, bodyW: 1.6, bodyH: 1.6, bodyD: 0.3, bodyRadius: 0.05, screenW: 1.2, screenH: 1.2, screenRadius: 0, screenOffsetY: 0, barH: 0 }, false, s)
  }

  // bare screen
  const aspect = clampAspect(mediaAspect)
  const screenW = 3.0
  const screenH = screenW / aspect
  const border = device.border
  const r = device.screenRadius
  return slab({ kind: device.kind, model, bodyW: screenW + border * 2, bodyH: screenH + border * 2, bodyD: 0.025, bodyRadius: r + border, screenW, screenH, screenRadius: r, screenOffsetY: 0, barH: 0 }, false, s)
}

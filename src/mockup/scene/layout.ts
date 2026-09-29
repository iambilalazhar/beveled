import { DEVICE_BY_KIND } from '../presets'
import type { DeviceState } from '../types'

export type DeviceLayout = {
  kind: DeviceState['kind']
  /** Body dimensions in scene units (portrait frame). */
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
  /** Radius of a sphere that comfortably contains the device */
  fitRadius: number
  /** World-space screen centre */
  screenCenter: [number, number, number]
  /** Browser title bar height, when applicable */
  barH: number
}

const clampAspect = (a: number) => Math.min(2.6, Math.max(0.45, a || 16 / 9))

export function computeDeviceLayout(device: DeviceState, mediaAspect: number): DeviceLayout {
  const meta = DEVICE_BY_KIND[device.kind]
  const rotated = meta.supportsOrientation && device.orientation === 'landscape'

  switch (device.kind) {
    case 'phone': {
      const screenW = 0.7
      const screenH = screenW / meta.screenAspect!
      const bezel = 0.032
      const bodyW = screenW + bezel * 2
      const bodyH = screenH + bezel * 2
      const bodyD = 0.082
      return finish({ kind: device.kind, bodyW, bodyH, bodyD, bodyRadius: 0.125, screenW, screenH, screenRadius: 0.095, screenOffsetY: 0, barH: 0 }, rotated, device.scale)
    }
    case 'android': {
      const screenW = 0.72
      const screenH = screenW / meta.screenAspect!
      const bezel = 0.026
      return finish({ kind: device.kind, bodyW: screenW + bezel * 2, bodyH: screenH + bezel * 2, bodyD: 0.08, bodyRadius: 0.1, screenW, screenH, screenRadius: 0.075, screenOffsetY: 0, barH: 0 }, rotated, device.scale)
    }
    case 'tablet': {
      const screenW = 1.5
      const screenH = screenW / meta.screenAspect!
      const bezel = 0.085
      return finish({ kind: device.kind, bodyW: screenW + bezel * 2, bodyH: screenH + bezel * 2, bodyD: 0.06, bodyRadius: 0.11, screenW, screenH, screenRadius: 0.05, screenOffsetY: 0, barH: 0 }, rotated, device.scale)
    }
    case 'laptop': {
      const screenW = 2.9
      const screenH = screenW / meta.screenAspect!
      const side = 0.07
      const top = 0.07
      const chin = 0.12
      const bodyW = screenW + side * 2
      const bodyH = screenH + top + chin
      const bodyD = 0.05
      const s = device.scale
      const baseDepth = 2.15
      const baseThick = 0.09
      // Lid pivots at the back edge of the base; visual centre is roughly mid-screen.
      const angle = (device.lidAngle * Math.PI) / 180
      const lidTopY = baseThick + Math.sin(angle) * bodyH
      const centerY = ((lidTopY + 0) / 2) * s
      return {
        kind: device.kind,
        bodyW, bodyH, bodyD, bodyRadius: 0.09,
        screenW, screenH, screenRadius: 0.045,
        screenOffsetY: (chin - top) / 2,
        screenAspect: screenW / screenH,
        rotated: false,
        bottomY: 0,
        centerY,
        fitRadius: Math.max(bodyW / 2, baseDepth / 2, lidTopY / 2) * 1.12 * s,
        screenCenter: [0, (baseThick + Math.sin(angle) * (bodyH / 2 + (chin - top) / 2)) * s, (-baseDepth / 2 + Math.cos(angle) * (bodyH / 2)) * s],
        barH: 0,
      }
    }
    case 'monitor': {
      const screenW = 3.2
      const screenH = screenW / meta.screenAspect!
      const bezel = 0.06
      const bodyW = screenW + bezel * 2
      const bodyH = screenH + bezel * 2
      const s = device.scale
      const standH = 0.62
      const footThick = 0.03
      const bottom = -(bodyH / 2 + standH + footThick)
      return {
        kind: device.kind,
        bodyW, bodyH, bodyD: 0.09, bodyRadius: 0.06,
        screenW, screenH, screenRadius: 0.02,
        screenOffsetY: 0,
        screenAspect: screenW / screenH,
        rotated: false,
        bottomY: bottom * s,
        centerY: (-standH / 2) * s,
        fitRadius: Math.hypot(bodyW / 2, (bodyH + standH) / 2) * 1.02 * s,
        screenCenter: [0, 0, 0.05 * s],
        barH: 0,
      }
    }
    case 'browser': {
      const aspect = clampAspect(mediaAspect)
      const screenW = 3.0
      const screenH = screenW / aspect
      const barH = 0.17
      const bodyW = screenW
      const bodyH = screenH + barH
      return finish({ kind: device.kind, bodyW, bodyH, bodyD: 0.035, bodyRadius: 0.075, screenW, screenH, screenRadius: 0, screenOffsetY: -barH / 2, barH }, false, device.scale)
    }
    case 'screen': {
      const aspect = clampAspect(mediaAspect)
      const screenW = 3.0
      const screenH = screenW / aspect
      const border = device.border
      const r = device.screenRadius
      return finish({ kind: device.kind, bodyW: screenW + border * 2, bodyH: screenH + border * 2, bodyD: 0.025, bodyRadius: r + border, screenW, screenH, screenRadius: r, screenOffsetY: 0, barH: 0 }, false, device.scale)
    }
    case 'watch': {
      const screenW = 0.34
      const screenH = screenW / meta.screenAspect!
      const bezel = 0.05
      const bodyW = screenW + bezel * 2
      const bodyH = screenH + bezel * 2
      const l = finish({ kind: device.kind, bodyW, bodyH, bodyD: 0.11, bodyRadius: 0.15, screenW, screenH, screenRadius: 0.11, screenOffsetY: 0, barH: 0 }, false, device.scale)
      const bandLen = 0.5 * device.scale
      return { ...l, bottomY: l.bottomY - bandLen, fitRadius: (bodyH / 2 + bandLen / device.scale) * 0.85 * device.scale }
    }
  }
}

type Partial = Omit<DeviceLayout, 'screenAspect' | 'rotated' | 'bottomY' | 'centerY' | 'fitRadius' | 'screenCenter'>

function finish(p: Partial, rotated: boolean, scale: number): DeviceLayout {
  const w = rotated ? p.bodyH : p.bodyW
  const h = rotated ? p.bodyW : p.bodyH
  return {
    ...p,
    screenAspect: rotated ? p.screenH / p.screenW : p.screenW / p.screenH,
    rotated,
    bottomY: (-h / 2) * scale,
    centerY: 0,
    fitRadius: Math.hypot(w / 2, h / 2) * 1.06 * scale,
    screenCenter: [0, 0, (p.bodyD / 2) * scale],
  }
}

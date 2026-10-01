import type { GroupState } from '../types'
import type { DeviceLayout } from './layout'

export type DeviceSlot = {
  /** 0 = main media, 1 = media2, 2 = media3 */
  mediaIndex: number
  position: [number, number, number]
  rotation: [number, number, number]
}

const D2R = Math.PI / 180

/** Where each copy of the device sits in a multi-device shot. The main device is centred when there are three. */
export function groupSlots(layout: DeviceLayout, group: GroupState): DeviceSlot[] {
  const n = group.count
  if (n <= 1) return [{ mediaIndex: 0, position: [0, 0, 0], rotation: [0, 0, 0] }]
  const W = layout.fitW * 2
  const H = layout.fitH * 2
  const gap = group.spacing * W * 0.5
  const mid = (n - 1) / 2
  // The main device sits in the middle of a trio, or in front for cascades.
  const order = n === 3 && group.arrangement !== 'cascade' ? [1, 0, 2] : n === 3 ? [0, 1, 2] : [0, 1]
  return order.map((mediaIndex, i) => {
    const k = i - mid
    let position: [number, number, number] = [0, 0, 0]
    let rotation: [number, number, number] = [0, 0, 0]
    switch (group.arrangement) {
      case 'row':
        position = [k * (W * 0.9 + gap), 0, 0]
        break
      case 'fan':
        position = [k * (W * 0.62 + gap * 0.6), 0, -Math.abs(k) * W * 0.3]
        rotation = [0, -k * 22 * D2R, -k * 3 * D2R]
        break
      case 'cascade':
        position = [k * (W * 0.42 + gap * 0.5), -k * H * 0.04, -k * W * 0.42]
        rotation = [0, -16 * D2R, 0]
        break
      case 'stack':
        position = [k * (W * 0.5 + gap * 0.4), 0, -Math.abs(k) * W * 0.55]
        break
      case 'tilt':
        position = [k * (W * 0.72 + gap * 0.6), 0, k * W * 0.3]
        rotation = [0, -28 * D2R, 0]
        break
    }
    return { mediaIndex, position, rotation }
  })
}

/** Expands the framing extents so the camera fits the whole group. */
export function groupLayout(layout: DeviceLayout, slots: DeviceSlot[]): DeviceLayout {
  if (slots.length <= 1) return layout
  let dx = 0
  let dy = 0
  let r = 0
  for (const s of slots) {
    const [x, y, z] = s.position
    dx = Math.max(dx, Math.abs(x) + Math.abs(z) * 0.5)
    dy = Math.max(dy, Math.abs(y))
    r = Math.max(r, Math.hypot(x, y, z))
  }
  return {
    ...layout,
    fitW: layout.fitW + dx,
    fitH: layout.fitH + dy,
    fitRadius: layout.fitRadius + r,
  }
}

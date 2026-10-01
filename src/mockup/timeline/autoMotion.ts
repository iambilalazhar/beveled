import * as THREE from 'three'
import { groupLayout, groupSlots } from '../scene/group'
import { computeDeviceLayout, type DeviceLayout } from '../scene/layout'
import { computeFit } from '../scene/media'
import { DEFAULT_EASING } from './easing'
import { kf } from './motionPresets'
import type { AnimKey, FocusArea, Keyframe, ShotScene, Tracks } from './types'

export type AutoMotionOptions = {
  /** Seconds spent travelling between areas. */
  move: number
  /** Seconds spent on each area. */
  hold: number
  /** 0 = loose framing around each area, 1 = tight. */
  tightness: number
  /** Degrees of alternating yaw added per area, for parallax. */
  tilt: number
  /** Start and end on the shot's own framing. */
  overview: boolean
  /** Slow push-in while holding on an area. */
  drift: boolean
}

export const DEFAULT_AUTO_MOTION: AutoMotionOptions = { move: 1.1, hold: 1, tightness: 0.6, tilt: 8, overview: true, drift: true }

const D2R = THREE.MathUtils.degToRad

/** Visible part of the media on the screen, in normalised media coordinates (y down). */
export function visibleMediaRect(scene: ShotScene): { x: number; y: number; w: number; h: number } {
  const { device, media } = scene
  const layout = computeDeviceLayout(device, media.width && media.height ? media.width / media.height : 16 / 9)
  const aspect = media.width && media.height ? media.width / media.height : layout.screenAspect
  const fit = computeFit(layout.screenW, layout.screenH, aspect, device.fit, layout.rotated)
  const w = Math.min(1, fit.fitScale[0])
  const h = Math.min(1, fit.fitScale[1])
  const scrollShift = h < 1 ? (0.5 - h / 2) * (1 - 2 * device.scroll) : 0
  // Shader space has y up; media space has y down.
  const centerY = 1 - (0.5 + scrollShift)
  return { x: 0.5 - w / 2, y: centerY - h / 2, w, h }
}

/** Device-local position (before scale) of a point on the screen, given in normalised media coordinates (y down). */
function screenPointLocal(layout: DeviceLayout, scene: ShotScene, u: number, v: number): THREE.Vector3 {
  const { device, media } = scene
  const aspect = media.width && media.height ? media.width / media.height : layout.screenAspect
  const fit = computeFit(layout.screenW, layout.screenH, aspect, device.fit, layout.rotated)
  const pad = device.screenPadding * Math.min(fit.effW, fit.effH)
  const innerW = Math.max(1e-3, fit.effW - 2 * pad)
  const innerH = Math.max(1e-3, fit.effH - 2 * pad)
  const scrollShift = fit.fitScale[1] < 1 ? (0.5 - fit.fitScale[1] / 2) * (1 - 2 * device.scroll) : 0
  const qx = u
  const qy = 1 - v
  const px = ((qx - 0.5) / fit.fitScale[0]) * innerW
  const py = ((qy - 0.5 - scrollShift) / fit.fitScale[1]) * innerH
  if (layout.model.spec?.family === 'laptop') {
    const a = D2R(device.lidAngle)
    const up = new THREE.Vector3(0, Math.sin(a), Math.cos(a))
    const along = layout.bodyH / 2 + layout.screenOffsetY
    const center = new THREE.Vector3(0, layout.baseThick + Math.sin(a) * along, -layout.baseDepth / 2 + Math.cos(a) * along)
    return center.add(new THREE.Vector3(px, 0, 0)).add(up.multiplyScalar(py))
  }
  if (device.kind === 'custom') return new THREE.Vector3(px * 0.75, py * 0.75, 0.15)
  return new THREE.Vector3(px, layout.screenOffsetY + py, layout.bodyD / 2)
}

/** World position of a media point on the main device, following the same transforms as the scene graph. */
function screenPointWorld(layout: DeviceLayout, scene: ShotScene, u: number, v: number): THREE.Vector3 {
  const p = screenPointLocal(layout, scene, u, v).multiplyScalar(scene.device.scale)
  const slot = groupSlots(layout, scene.group).find((s) => s.mediaIndex === 0)
  if (slot) {
    p.applyEuler(new THREE.Euler(...slot.rotation))
    p.add(new THREE.Vector3(...slot.position))
  }
  const pivot = new THREE.Vector3(0, layout.centerY, 0)
  p.sub(pivot)
  p.applyEuler(new THREE.Euler(D2R(scene.device.rotateX), D2R(scene.device.rotateY), 0, 'YXZ'))
  return p.add(pivot)
}

type CameraKey = { yaw: number; pitch: number; zoom: number; panX: number; panY: number }

/** Camera values that centre `area` in the frame from the given viewing angle. */
function frameArea(scene: ShotScene, layout: DeviceLayout, frame: DeviceLayout, aspect: number, area: FocusArea, yaw: number, pitch: number, tightness: number): CameraKey {
  const yawR = D2R(yaw)
  const pitchR = D2R(THREE.MathUtils.clamp(pitch, -89, 89))
  const R = new THREE.Vector3(Math.cos(yawR), 0, -Math.sin(yawR))
  const U = new THREE.Vector3(0, 1, 0)
  const toCam = new THREE.Vector3(Math.sin(yawR) * Math.cos(pitchR), Math.sin(pitchR), Math.cos(yawR) * Math.cos(pitchR))
  const camUp = new THREE.Vector3().crossVectors(toCam, R).normalize()
  const center = screenPointWorld(layout, scene, area.x + area.w / 2, area.y + area.h / 2)
  let hw = 0
  let hh = 0
  for (const [u, v] of [
    [area.x, area.y],
    [area.x + area.w, area.y],
    [area.x, area.y + area.h],
    [area.x + area.w, area.y + area.h],
  ]) {
    const d = screenPointWorld(layout, scene, u, v).sub(center)
    hw = Math.max(hw, Math.abs(d.dot(R)))
    hh = Math.max(hh, Math.abs(d.dot(camUp)))
  }
  const V1 = Math.max(frame.fitH, frame.fitW / aspect)
  const margin = 1.12 + (1 - tightness) * 0.9
  const zoom = THREE.MathUtils.clamp((1.04 * V1) / Math.max(hh * margin, (hw * margin) / aspect, 1e-3), 1, 8)
  // Move the orbit target within the plane spanned by the camera's right and world up so the area sits on the view axis.
  const c0 = new THREE.Vector3(0, frame.centerY, 0)
  const m = new THREE.Matrix3().set(R.x, U.x, toCam.x, R.y, U.y, toCam.y, R.z, U.z, toCam.z)
  const coeff = center.clone().sub(c0).applyMatrix3(m.invert())
  const panX = THREE.MathUtils.clamp((-coeff.x * zoom) / V1, -3, 3)
  const panY = THREE.MathUtils.clamp((-coeff.y * zoom) / V1, -3, 3)
  return { yaw, pitch, zoom, panX, panY }
}

/** Builds a camera path that visits each focus area in order. Returns keyframe tracks and the clip duration. */
export function buildAutoMotion(scene: ShotScene, areas: FocusArea[], opts: AutoMotionOptions, aspect: number): { tracks: Tracks; duration: number } {
  const mediaAspect = scene.media.width && scene.media.height ? scene.media.width / scene.media.height : 16 / 9
  const layout = computeDeviceLayout(scene.device, mediaAspect)
  const frame = groupLayout(layout, groupSlots(layout, scene.group))
  const base: CameraKey = { yaw: scene.camera.yaw, pitch: scene.camera.pitch, zoom: scene.camera.zoom, panX: scene.camera.panX, panY: scene.camera.panY }
  const keys: Record<keyof CameraKey, Keyframe[]> = { yaw: [], pitch: [], zoom: [], panX: [], panY: [] }
  const push = (t: number, k: CameraKey) => {
    for (const name of Object.keys(keys) as (keyof CameraKey)[]) keys[name].push(kf(Math.round(t * 100) / 100, Number(k[name].toFixed(4)), DEFAULT_EASING))
  }
  // Areas outside the visible part of the screen are pulled onto it, so the camera never frames empty space.
  const vis = visibleMediaRect(scene)
  const clampArea = (a: FocusArea): FocusArea => {
    const w = Math.min(a.w, vis.w)
    const h = Math.min(a.h, vis.h)
    return { ...a, w, h, x: THREE.MathUtils.clamp(a.x, vis.x, vis.x + vis.w - w), y: THREE.MathUtils.clamp(a.y, vis.y, vis.y + vis.h - h) }
  }
  let t = 0
  if (opts.overview) {
    push(0, base)
    t = Math.min(0.5, opts.hold * 0.5)
    push(t, base)
  }
  areas.forEach((area, i) => {
    const side = i % 2 === 0 ? -1 : 1
    const k = frameArea(scene, layout, frame, aspect, clampArea(area), base.yaw + side * opts.tilt, base.pitch + opts.tilt * 0.35, opts.tightness)
    t += i === 0 && !opts.overview ? 0 : opts.move
    push(t, k)
    t += opts.hold
    push(t, opts.drift ? { ...k, zoom: k.zoom * 1.05 } : k)
  })
  if (opts.overview && areas.length) {
    t += opts.move
    push(t, base)
    t += 0.4
    push(t, base)
  }
  const tracks: Tracks = {}
  const map: Record<keyof CameraKey, AnimKey> = { yaw: 'camera.yaw', pitch: 'camera.pitch', zoom: 'camera.zoom', panX: 'camera.panX', panY: 'camera.panY' }
  for (const name of Object.keys(keys) as (keyof CameraKey)[]) tracks[map[name]] = keys[name]
  return { tracks, duration: Math.max(1, Math.round(t * 20) / 20) }
}

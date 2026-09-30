import { DEFAULT_EASING, LINEAR_EASING } from './easing'
import type { AnimKey, Easing, Keyframe, ShotScene, Tracks } from './types'

let seq = 0
export const newId = (prefix = 'k') => `${prefix}${Date.now().toString(36)}${(seq++).toString(36)}${Math.random().toString(36).slice(2, 6)}`

export function kf(t: number, value: number, easing: Easing = DEFAULT_EASING): Keyframe {
  return { id: newId(), t, value, easing }
}

export type MotionPreset = {
  id: string
  label: string
  description: string
  duration: number
  /** Tiny CSS keyframes used for the card preview: [from, to] transforms of a mock screen. */
  preview: [string, string]
  build: (scene: ShotScene, duration: number) => Tracks
}

const track = (pairs: [number, number][], easing: Easing = DEFAULT_EASING) => pairs.map(([t, v]) => kf(t, v, easing))

export const MOTION_PRESETS: MotionPreset[] = [
  {
    id: 'scan-lr',
    label: 'Scan left to right',
    description: 'Close-up pan across the screen',
    duration: 4,
    preview: ['translateX(18%) scale(1.5) rotateY(18deg)', 'translateX(-18%) scale(1.5) rotateY(-18deg)'],
    build: (s, d) => ({
      'camera.yaw': track([[0, -22], [d, 22]]),
      'camera.pitch': track([[0, Math.max(4, s.camera.pitch)], [d, Math.max(4, s.camera.pitch)]]),
      'camera.panX': track([[0, 0.28], [d, -0.28]]),
      'camera.zoom': track([[0, 1.55], [d, 1.55]]),
    }),
  },
  {
    id: 'scan-tb',
    label: 'Left – top to bottom',
    description: 'Tilted close-up travelling down the screen',
    duration: 4,
    preview: ['translateY(22%) scale(1.6) rotateX(-12deg)', 'translateY(-22%) scale(1.6) rotateX(12deg)'],
    build: (_s, d) => ({
      'camera.yaw': track([[0, -28], [d, -18]]),
      'camera.pitch': track([[0, 16], [d, 4]]),
      'camera.panY': track([[0, -0.35], [d, 0.35]]),
      'camera.zoom': track([[0, 1.7], [d, 1.7]]),
    }),
  },
  {
    id: 'low-pan-up',
    label: 'Low-angle pan up',
    description: 'Rise from below the device',
    duration: 4,
    preview: ['translateY(-12%) rotateX(28deg)', 'translateY(6%) rotateX(4deg)'],
    build: (s, d) => ({
      'camera.pitch': track([[0, -24], [d, 8]]),
      'camera.yaw': track([[0, s.camera.yaw - 6], [d, s.camera.yaw + 6]]),
      'camera.panY': track([[0, 0.18], [d, -0.05]]),
    }),
  },
  {
    id: 'slow-zoom-out',
    label: 'Slow zoom out',
    description: 'Start tight, settle on the hero framing',
    duration: 4,
    preview: ['scale(1.45)', 'scale(1)'],
    build: (s, d) => ({ 'camera.zoom': track([[0, s.camera.zoom * 1.35], [d, s.camera.zoom]]) }),
  },
  {
    id: 'push-in',
    label: 'Push in',
    description: 'Slow dolly towards the screen',
    duration: 4,
    preview: ['scale(0.9)', 'scale(1.35)'],
    build: (s, d) => ({ 'camera.zoom': track([[0, s.camera.zoom * 0.9], [d, s.camera.zoom * 1.3]]) }),
  },
  {
    id: 'overhead-pan',
    label: 'Overhead pan',
    description: 'Top-down drift across the device',
    duration: 4,
    preview: ['rotateX(48deg) translateX(10%)', 'rotateX(48deg) translateX(-10%)'],
    build: (_s, d) => ({
      'camera.pitch': track([[0, 62], [d, 52]]),
      'camera.yaw': track([[0, -18], [d, 18]]),
      'camera.roll': track([[0, 0], [d, 0]]),
    }),
  },
  {
    id: 'out-and-back',
    label: 'Out and back',
    description: 'Pull away and return',
    duration: 4,
    preview: ['scale(1.15)', 'scale(0.8)'],
    build: (s, d) => ({
      'camera.zoom': track([[0, s.camera.zoom * 1.15], [d / 2, s.camera.zoom * 0.8], [d, s.camera.zoom * 1.15]]),
      'camera.yaw': track([[0, s.camera.yaw], [d / 2, s.camera.yaw + 10], [d, s.camera.yaw]]),
    }),
  },
  {
    id: 'fold-up',
    label: 'Fold up',
    description: 'Laptops open their lid, others rise from flat',
    duration: 4,
    preview: ['rotateX(80deg)', 'rotateX(10deg)'],
    build: (s, d) =>
      s.device.kind === 'laptop'
        ? {
            'device.lidAngle': track([[0, 12], [d * 0.75, 108]]),
            'camera.pitch': track([[0, 32], [d, 14]]),
            'camera.yaw': track([[0, -34], [d, -22]]),
          }
        : {
            'device.rotateX': track([[0, -80], [d * 0.75, 0]]),
            'camera.pitch': track([[0, 30], [d, 10]]),
          },
  },
  {
    id: 'flat-truck',
    label: 'Flat truck',
    description: 'Straight-on slide across',
    duration: 4,
    preview: ['translateX(-20%)', 'translateX(20%)'],
    build: (_s, d) => ({
      'camera.yaw': track([[0, 0], [d, 0]], LINEAR_EASING),
      'camera.pitch': track([[0, 0], [d, 0]], LINEAR_EASING),
      'camera.panX': track([[0, -0.45], [d, 0.45]], LINEAR_EASING),
      'camera.zoom': track([[0, 1.25], [d, 1.25]], LINEAR_EASING),
    }),
  },
  {
    id: 'orbit',
    label: 'Orbit',
    description: 'Half orbit around the device',
    duration: 5,
    preview: ['rotateY(-40deg)', 'rotateY(40deg)'],
    build: (s, d) => ({ 'camera.yaw': track([[0, -45], [d, 45]]), 'camera.pitch': track([[0, s.camera.pitch], [d, s.camera.pitch]]) }),
  },
  {
    id: 'hero-reveal',
    label: 'Hero reveal',
    description: 'Swing in from above to the hero angle',
    duration: 4,
    preview: ['rotateX(40deg) rotateY(-30deg) scale(0.8)', 'rotateX(8deg) rotateY(-14deg) scale(1.05)'],
    build: (_s, d) => ({
      'camera.pitch': track([[0, 38], [d, 12]]),
      'camera.yaw': track([[0, -55], [d, -24]]),
      'camera.zoom': track([[0, 0.82], [d, 1.05]]),
      'device.rotateY': track([[0, -12], [d, 0]]),
    }),
  },
  {
    id: 'spin-reveal',
    label: 'Spin reveal',
    description: 'Device turns to face the camera',
    duration: 3,
    preview: ['rotateY(160deg)', 'rotateY(0deg)'],
    build: (_s, d) => ({ 'device.rotateY': track([[0, -160], [d * 0.8, 0]]) }),
  },
]

export const MOTION_PRESET_BY_ID = Object.fromEntries(MOTION_PRESETS.map((p) => [p.id, p])) as Record<string, MotionPreset>

/** Keys listed on the timeline in this order. */
export const ANIM_ORDER: AnimKey[] = [
  'camera.yaw',
  'camera.pitch',
  'camera.roll',
  'camera.fov',
  'camera.zoom',
  'camera.panX',
  'camera.panY',
  'device.rotateX',
  'device.rotateY',
  'device.lidAngle',
  'device.scale',
  'lighting.rotation',
  'lighting.elevation',
  'lighting.intensity',
  'lighting.envIntensity',
  'depth.strength',
  'depth.focusX',
  'depth.focusY',
  'depth.focusSize',
  'depth.falloff',
  'depth.angle',
  'depth.bokeh',
  'depth.focalLength',
  'depth.focusDistance',
  'effects.vignette',
  'effects.bloom',
  'effects.exposure',
  'effects.saturation',
]

export const ANIM_LABEL: Record<AnimKey, string> = {
  'camera.yaw': 'Yaw',
  'camera.pitch': 'Pitch',
  'camera.roll': 'Roll',
  'camera.fov': 'FOV',
  'camera.zoom': 'Zoom',
  'camera.panX': 'Pan X',
  'camera.panY': 'Pan Y',
  'device.rotateX': 'Rotate X',
  'device.rotateY': 'Rotate Y',
  'device.lidAngle': 'Lid angle',
  'device.scale': 'Scale',
  'lighting.rotation': 'Light rot. Y',
  'lighting.elevation': 'Light rot. X',
  'lighting.intensity': 'Key light',
  'lighting.envIntensity': 'Environment',
  'depth.strength': 'Blur',
  'depth.focusX': 'Focus X',
  'depth.focusY': 'Focus Y',
  'depth.focusSize': 'Focus size',
  'depth.falloff': 'Falloff',
  'depth.angle': 'Blur angle',
  'depth.bokeh': 'Bokeh',
  'depth.focalLength': 'Focus range',
  'depth.focusDistance': 'Focus dist.',
  'effects.vignette': 'Vignette',
  'effects.bloom': 'Bloom',
  'effects.exposure': 'Exposure',
  'effects.saturation': 'Saturation',
}

export const ANIM_KEYS = new Set<string>(ANIM_ORDER)

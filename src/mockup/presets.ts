import type {
  AspectId,
  DeviceKind,
  FinishId,
  LightPresetId,
  SceneState,
  Template,
} from './types'

/* ------------------------------------------------------------------ */
/* Devices                                                             */
/* ------------------------------------------------------------------ */

export type DeviceMeta = {
  kind: DeviceKind
  label: string
  description: string
  /** Screen aspect (w/h) in portrait. null = follows the media. */
  screenAspect: number | null
  supportsOrientation: boolean
  supportsLid: boolean
  supportsFinish: boolean
}

export const DEVICES: DeviceMeta[] = [
  { kind: 'phone', label: 'iPhone', description: 'Dynamic Island, titanium rails', screenAspect: 1179 / 2556, supportsOrientation: true, supportsLid: false, supportsFinish: true },
  { kind: 'android', label: 'Android', description: 'Punch-hole camera, flat display', screenAspect: 1080 / 2400, supportsOrientation: true, supportsLid: false, supportsFinish: true },
  { kind: 'tablet', label: 'iPad Pro', description: 'Thin bezels, squared edges', screenAspect: 2064 / 2752, supportsOrientation: true, supportsLid: false, supportsFinish: true },
  { kind: 'laptop', label: 'MacBook', description: 'Open lid with notch display', screenAspect: 3024 / 1964, supportsOrientation: false, supportsLid: true, supportsFinish: true },
  { kind: 'monitor', label: 'Display', description: 'Studio display on a stand', screenAspect: 5120 / 2880, supportsOrientation: false, supportsLid: false, supportsFinish: true },
  { kind: 'browser', label: 'Browser', description: 'Floating window with title bar', screenAspect: null, supportsOrientation: false, supportsLid: false, supportsFinish: false },
  { kind: 'screen', label: 'Screen', description: 'Bare rounded panel, no chrome', screenAspect: null, supportsOrientation: false, supportsLid: false, supportsFinish: false },
  { kind: 'watch', label: 'Watch', description: 'Squircle case with crown', screenAspect: 396 / 484, supportsOrientation: false, supportsLid: false, supportsFinish: true },
]

export const DEVICE_BY_KIND: Record<DeviceKind, DeviceMeta> = Object.fromEntries(
  DEVICES.map((d) => [d.kind, d])
) as Record<DeviceKind, DeviceMeta>

/* ------------------------------------------------------------------ */
/* Finishes                                                            */
/* ------------------------------------------------------------------ */

export type Finish = {
  id: FinishId
  label: string
  color: string
  metalness: number
  roughness: number
  bezel: string
}

export const FINISHES: Finish[] = [
  { id: 'space-black', label: 'Space Black', color: '#1d1d1f', metalness: 0.85, roughness: 0.35, bezel: '#050505' },
  { id: 'graphite', label: 'Graphite', color: '#3a3a3c', metalness: 0.8, roughness: 0.4, bezel: '#050505' },
  { id: 'titanium', label: 'Natural Titanium', color: '#8e8a83', metalness: 0.9, roughness: 0.45, bezel: '#050505' },
  { id: 'silver', label: 'Silver', color: '#d6d6d9', metalness: 0.9, roughness: 0.3, bezel: '#0a0a0a' },
  { id: 'starlight', label: 'Starlight', color: '#e8e2d6', metalness: 0.75, roughness: 0.35, bezel: '#0a0a0a' },
  { id: 'midnight', label: 'Midnight', color: '#1f2a3a', metalness: 0.85, roughness: 0.35, bezel: '#050505' },
  { id: 'deep-blue', label: 'Deep Blue', color: '#2b3e63', metalness: 0.85, roughness: 0.35, bezel: '#050505' },
  { id: 'white', label: 'White', color: '#f4f4f5', metalness: 0.4, roughness: 0.45, bezel: '#0a0a0a' },
]

export const FINISH_BY_ID: Record<FinishId, Finish> = Object.fromEntries(
  FINISHES.map((f) => [f.id, f])
) as Record<FinishId, Finish>

/* ------------------------------------------------------------------ */
/* Lighting                                                            */
/* ------------------------------------------------------------------ */

export type LightFormer = {
  form: 'rect' | 'circle' | 'ring'
  color: string
  intensity: number
  position: [number, number, number]
  rotation?: [number, number, number]
  scale: [number, number]
}

export type LightPreset = {
  id: LightPresetId
  label: string
  description: string
  ambient: number
  key: { position: [number, number, number]; intensity: number }
  formers: LightFormer[]
}

export const LIGHT_PRESETS: LightPreset[] = [
  {
    id: 'studio',
    label: 'Studio',
    description: 'Balanced three-point softbox setup',
    ambient: 0.35,
    key: { position: [4, 6, 6], intensity: 1.6 },
    formers: [
      { form: 'rect', color: '#ffffff', intensity: 3, position: [0, 6, 2], rotation: [-Math.PI / 2, 0, 0], scale: [8, 4] },
      { form: 'rect', color: '#ffffff', intensity: 1.6, position: [-6, 2, 3], rotation: [0, Math.PI / 2.4, 0], scale: [3, 6] },
      { form: 'rect', color: '#dfe8ff', intensity: 1.2, position: [6, 1, 3], rotation: [0, -Math.PI / 2.4, 0], scale: [3, 6] },
    ],
  },
  {
    id: 'soft',
    label: 'Soft',
    description: 'Large diffuse wrap, minimal contrast',
    ambient: 0.6,
    key: { position: [2, 5, 6], intensity: 0.9 },
    formers: [
      { form: 'rect', color: '#ffffff', intensity: 1.8, position: [0, 5, 4], rotation: [-Math.PI / 3, 0, 0], scale: [14, 10] },
      { form: 'rect', color: '#ffffff', intensity: 0.8, position: [0, -3, 5], rotation: [Math.PI / 3, 0, 0], scale: [14, 6] },
    ],
  },
  {
    id: 'dramatic',
    label: 'Dramatic',
    description: 'Single hard key light from the side',
    ambient: 0.12,
    key: { position: [7, 4, 3], intensity: 3 },
    formers: [
      { form: 'rect', color: '#ffffff', intensity: 6, position: [7, 3, 2], rotation: [0, -Math.PI / 2.2, 0], scale: [2, 5] },
      { form: 'rect', color: '#334155', intensity: 0.6, position: [-6, 1, 2], rotation: [0, Math.PI / 2.2, 0], scale: [3, 5] },
    ],
  },
  {
    id: 'neon',
    label: 'Neon',
    description: 'Magenta and cyan rim lights',
    ambient: 0.2,
    key: { position: [0, 5, 6], intensity: 0.8 },
    formers: [
      { form: 'rect', color: '#ff2d95', intensity: 5, position: [-6, 2, 1], rotation: [0, Math.PI / 2.2, 0], scale: [2, 6] },
      { form: 'rect', color: '#22d3ee', intensity: 5, position: [6, 2, 1], rotation: [0, -Math.PI / 2.2, 0], scale: [2, 6] },
      { form: 'rect', color: '#a78bfa', intensity: 1.2, position: [0, 6, -2], rotation: [-Math.PI / 2, 0, 0], scale: [6, 3] },
    ],
  },
  {
    id: 'sunset',
    label: 'Sunset',
    description: 'Warm golden key with violet fill',
    ambient: 0.3,
    key: { position: [-5, 3, 6], intensity: 1.8 },
    formers: [
      { form: 'rect', color: '#ffb36b', intensity: 4, position: [-5, 3, 3], rotation: [0, Math.PI / 2.6, 0], scale: [3, 5] },
      { form: 'rect', color: '#8b5cf6', intensity: 1.5, position: [6, 0, 2], rotation: [0, -Math.PI / 2.6, 0], scale: [3, 6] },
      { form: 'rect', color: '#fde68a', intensity: 1.2, position: [0, 6, 0], rotation: [-Math.PI / 2, 0, 0], scale: [6, 3] },
    ],
  },
  {
    id: 'cool',
    label: 'Cool',
    description: 'Icy blue overhead with dark surround',
    ambient: 0.25,
    key: { position: [0, 7, 4], intensity: 1.5 },
    formers: [
      { form: 'rect', color: '#bfdbfe', intensity: 3.5, position: [0, 6, 1], rotation: [-Math.PI / 2, 0, 0], scale: [6, 6] },
      { form: 'rect', color: '#1e3a8a', intensity: 1, position: [0, -2, 6], rotation: [Math.PI / 4, 0, 0], scale: [10, 4] },
    ],
  },
  {
    id: 'top',
    label: 'Overhead',
    description: 'Bright top light, crisp reflections',
    ambient: 0.3,
    key: { position: [0, 8, 2], intensity: 2 },
    formers: [
      { form: 'ring', color: '#ffffff', intensity: 6, position: [0, 6, 1], rotation: [-Math.PI / 2, 0, 0], scale: [5, 5] },
      { form: 'rect', color: '#ffffff', intensity: 0.8, position: [0, 0, 8], rotation: [0, 0, 0], scale: [12, 6] },
    ],
  },
]

export const LIGHT_PRESET_BY_ID: Record<LightPresetId, LightPreset> = Object.fromEntries(
  LIGHT_PRESETS.map((p) => [p.id, p])
) as Record<LightPresetId, LightPreset>

/* ------------------------------------------------------------------ */
/* Backgrounds                                                         */
/* ------------------------------------------------------------------ */

export type BackgroundPreset = {
  id: string
  label: string
  kind: 'solid' | 'linear' | 'radial'
  colors: string[]
  angle: number
}

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  { id: 'onyx', label: 'Onyx', kind: 'radial', colors: ['#2a2a30', '#0a0a0c'], angle: 0 },
  { id: 'graphite', label: 'Graphite', kind: 'linear', colors: ['#3b3b42', '#141416'], angle: 160 },
  { id: 'aurora', label: 'Aurora', kind: 'linear', colors: ['#0f172a', '#4c1d95', '#0ea5e9'], angle: 135 },
  { id: 'ember', label: 'Ember', kind: 'linear', colors: ['#f97316', '#be123c', '#1e0b3b'], angle: 150 },
  { id: 'lagoon', label: 'Lagoon', kind: 'linear', colors: ['#06b6d4', '#2563eb', '#1e1b4b'], angle: 135 },
  { id: 'peach', label: 'Peach', kind: 'linear', colors: ['#fecaca', '#fdba74', '#fde68a'], angle: 120 },
  { id: 'mint', label: 'Mint', kind: 'linear', colors: ['#a7f3d0', '#67e8f9', '#e0f2fe'], angle: 135 },
  { id: 'lilac', label: 'Lilac', kind: 'linear', colors: ['#e9d5ff', '#c4b5fd', '#fbcfe8'], angle: 135 },
  { id: 'midnight', label: 'Midnight', kind: 'radial', colors: ['#1e3a8a', '#020617'], angle: 0 },
  { id: 'forest', label: 'Forest', kind: 'linear', colors: ['#14532d', '#052e16'], angle: 160 },
  { id: 'crimson', label: 'Crimson', kind: 'radial', colors: ['#7f1d1d', '#1c0505'], angle: 0 },
  { id: 'tangerine', label: 'Tangerine', kind: 'linear', colors: ['#fb923c', '#e05d38', '#7c2d12'], angle: 135 },
  { id: 'paper', label: 'Paper', kind: 'solid', colors: ['#f4f4f5'], angle: 0 },
  { id: 'cloud', label: 'Cloud', kind: 'linear', colors: ['#ffffff', '#e2e8f0'], angle: 180 },
  { id: 'black', label: 'Black', kind: 'solid', colors: ['#000000'], angle: 0 },
  { id: 'white', label: 'White', kind: 'solid', colors: ['#ffffff'], angle: 0 },
]

/* ------------------------------------------------------------------ */
/* Camera presets                                                      */
/* ------------------------------------------------------------------ */

export type CameraPreset = {
  id: string
  label: string
  yaw: number
  pitch: number
  roll: number
  fov: number
}

export const CAMERA_PRESETS: CameraPreset[] = [
  { id: 'front', label: 'Front', yaw: 0, pitch: 0, roll: 0, fov: 30 },
  { id: 'hero-left', label: 'Hero L', yaw: -28, pitch: 12, roll: 0, fov: 35 },
  { id: 'hero-right', label: 'Hero R', yaw: 28, pitch: 12, roll: 0, fov: 35 },
  { id: 'low', label: 'Low', yaw: -18, pitch: -14, roll: 0, fov: 40 },
  { id: 'top', label: 'Top', yaw: 10, pitch: 55, roll: 0, fov: 35 },
  { id: 'iso', label: 'Iso', yaw: 45, pitch: 30, roll: 0, fov: 24 },
  { id: 'tilt', label: 'Tilt', yaw: -35, pitch: 8, roll: -12, fov: 45 },
]

/* ------------------------------------------------------------------ */
/* Frame aspects                                                       */
/* ------------------------------------------------------------------ */

export const ASPECTS: { id: AspectId; label: string; ratio: number | null }[] = [
  { id: 'auto', label: 'Auto', ratio: null },
  { id: '16:9', label: '16:9', ratio: 16 / 9 },
  { id: '1:1', label: '1:1', ratio: 1 },
  { id: '4:5', label: '4:5', ratio: 4 / 5 },
  { id: '9:16', label: '9:16', ratio: 9 / 16 },
  { id: '3:2', label: '3:2', ratio: 3 / 2 },
  { id: '4:3', label: '4:3', ratio: 4 / 3 },
  { id: '21:9', label: '21:9', ratio: 21 / 9 },
  { id: 'custom', label: 'Custom', ratio: null },
]

/* ------------------------------------------------------------------ */
/* Default scene                                                       */
/* ------------------------------------------------------------------ */

export const DEFAULT_SCENE: SceneState = {
  media: { url: null, kind: null, width: 0, height: 0, name: null },
  device: {
    kind: 'laptop',
    finish: 'space-black',
    fit: 'cover',
    orientation: 'portrait',
    scale: 1,
    lidAngle: 105,
    screenRadius: 0.06,
    browserDark: true,
    browserUrl: 'beveled.app',
    border: 0,
    borderColor: '#ffffff',
  },
  camera: { yaw: -24, pitch: 14, roll: 0, fov: 32, zoom: 1, panX: 0, panY: 0 },
  background: { kind: 'radial', colors: ['#2a2a30', '#0a0a0c'], angle: 0, noise: 0 },
  lighting: {
    preset: 'studio',
    intensity: 1,
    envIntensity: 1,
    keyColor: '#ffffff',
    shadow: true,
    shadowOpacity: 0.55,
    shadowBlur: 2.2,
    reflection: false,
    reflectionOpacity: 0.35,
    reflectionBlur: 0.6,
    screenGlare: 0.35,
  },
  depth: {
    mode: 'off',
    strength: 12,
    falloff: 0.35,
    bokeh: 0.5,
    focusX: 0.5,
    focusY: 0.5,
    focusSize: 0.18,
    angle: 0,
    autoFocus: true,
    focusDistance: 6,
    focalLength: 0.04,
  },
  effects: {
    bloom: 0,
    bloomThreshold: 0.85,
    vignette: 0.25,
    grain: 0,
    chromatic: 0,
    sharpen: 0,
    brightness: 0,
    contrast: 0,
    saturation: 0,
    hue: 0,
  },
  motion: { enabled: false, kind: 'float', speed: 1, intensity: 0.5, duration: 5 },
  frame: { aspect: 'auto', customWidth: 1920, customHeight: 1080 },
  export: { format: 'png', scale: 2, quality: 0.92, transparent: false },
}

/* ------------------------------------------------------------------ */
/* Templates                                                           */
/* ------------------------------------------------------------------ */

export const TEMPLATES: Template[] = [
  {
    id: 'keynote',
    name: 'Keynote',
    tag: 'Laptop',
    description: 'Dark stage, soft key light, gentle hero angle',
    preview: { background: 'radial-gradient(circle at 50% 40%, #2a2a30, #0a0a0c)', deviceKind: 'laptop' },
    scene: {
      device: { kind: 'laptop', finish: 'space-black', lidAngle: 105 },
      camera: { yaw: -24, pitch: 14, roll: 0, fov: 32, zoom: 1, panX: 0, panY: 0 },
      background: { kind: 'radial', colors: ['#2a2a30', '#0a0a0c'], angle: 0 },
      lighting: { preset: 'studio', shadow: true, reflection: false },
      depth: { mode: 'off' },
      effects: { vignette: 0.3, bloom: 0, grain: 0 },
    },
  },
  {
    id: 'launch-post',
    name: 'Launch Post',
    tag: 'Phone',
    description: 'Aurora gradient, tilt-shift focus, square frame',
    preview: { background: 'linear-gradient(135deg, #0f172a, #4c1d95, #0ea5e9)', deviceKind: 'phone' },
    scene: {
      device: { kind: 'phone', finish: 'titanium', orientation: 'portrait' },
      camera: { yaw: -22, pitch: 10, roll: -6, fov: 30, zoom: 1, panX: 0, panY: 0 },
      background: { kind: 'linear', colors: ['#0f172a', '#4c1d95', '#0ea5e9'], angle: 135 },
      lighting: { preset: 'neon', shadow: true, reflection: false },
      depth: { mode: 'tilt-shift', strength: 14, falloff: 0.3, focusSize: 0.16, angle: 0, bokeh: 0.6 },
      effects: { vignette: 0.35, bloom: 0.25, grain: 0.08 },
      frame: { aspect: '1:1' },
    },
  },
  {
    id: 'cinematic',
    name: 'Cinematic',
    tag: 'Laptop',
    description: 'Wide 21:9, lens depth of field, dramatic light and grain',
    preview: { background: 'linear-gradient(160deg, #3b3b42, #141416)', deviceKind: 'laptop' },
    scene: {
      device: { kind: 'laptop', finish: 'graphite', lidAngle: 100 },
      camera: { yaw: -42, pitch: 6, roll: 0, fov: 40, zoom: 1.15, panX: 0, panY: 0 },
      background: { kind: 'linear', colors: ['#3b3b42', '#141416'], angle: 160 },
      lighting: { preset: 'dramatic', shadow: true, reflection: true, reflectionOpacity: 0.3 },
      depth: { mode: 'lens', autoFocus: true, focalLength: 0.06, bokeh: 1.2, strength: 12 },
      effects: { vignette: 0.5, grain: 0.18, bloom: 0.15, chromatic: 0.15, contrast: 0.08 },
      frame: { aspect: '21:9' },
    },
  },
  {
    id: 'app-store',
    name: 'App Store',
    tag: 'Phone',
    description: 'Clean pastel backdrop, front-facing, 9:16 story frame',
    preview: { background: 'linear-gradient(120deg, #fecaca, #fdba74, #fde68a)', deviceKind: 'phone' },
    scene: {
      device: { kind: 'phone', finish: 'starlight', orientation: 'portrait' },
      camera: { yaw: 0, pitch: 0, roll: 0, fov: 26, zoom: 1.05, panX: 0, panY: 0 },
      background: { kind: 'linear', colors: ['#fecaca', '#fdba74', '#fde68a'], angle: 120 },
      lighting: { preset: 'soft', shadow: true, reflection: false },
      depth: { mode: 'off' },
      effects: { vignette: 0.1, bloom: 0, grain: 0 },
      frame: { aspect: '9:16' },
    },
  },
  {
    id: 'product-hunt',
    name: 'Product Hunt',
    tag: 'Browser',
    description: 'Floating browser window on a tangerine gradient',
    preview: { background: 'linear-gradient(135deg, #fb923c, #e05d38, #7c2d12)', deviceKind: 'browser' },
    scene: {
      device: { kind: 'browser', browserDark: true },
      camera: { yaw: -14, pitch: 10, roll: 0, fov: 30, zoom: 1, panX: 0, panY: 0 },
      background: { kind: 'linear', colors: ['#fb923c', '#e05d38', '#7c2d12'], angle: 135 },
      lighting: { preset: 'studio', shadow: true, reflection: false },
      depth: { mode: 'off' },
      effects: { vignette: 0.25, bloom: 0.1, grain: 0 },
      frame: { aspect: '16:9' },
    },
  },
  {
    id: 'top-down',
    name: 'Top Down',
    tag: 'Tablet',
    description: 'Flat lay tablet with overhead light and radial focus',
    preview: { background: 'linear-gradient(135deg, #a7f3d0, #67e8f9, #e0f2fe)', deviceKind: 'tablet' },
    scene: {
      device: { kind: 'tablet', finish: 'silver', orientation: 'landscape' },
      camera: { yaw: 12, pitch: 58, roll: -8, fov: 34, zoom: 1, panX: 0, panY: 0 },
      background: { kind: 'linear', colors: ['#a7f3d0', '#67e8f9', '#e0f2fe'], angle: 135 },
      lighting: { preset: 'top', shadow: true, reflection: false },
      depth: { mode: 'radial', strength: 10, falloff: 0.4, focusSize: 0.25, bokeh: 0.4 },
      effects: { vignette: 0.2, bloom: 0, grain: 0 },
      frame: { aspect: '4:3' },
    },
  },
  {
    id: 'desk-setup',
    name: 'Desk Setup',
    tag: 'Display',
    description: 'Studio display, midnight backdrop, reflective floor',
    preview: { background: 'radial-gradient(circle at 50% 40%, #1e3a8a, #020617)', deviceKind: 'monitor' },
    scene: {
      device: { kind: 'monitor', finish: 'silver' },
      camera: { yaw: -18, pitch: 8, roll: 0, fov: 30, zoom: 1, panX: 0, panY: 0 },
      background: { kind: 'radial', colors: ['#1e3a8a', '#020617'], angle: 0 },
      lighting: { preset: 'cool', shadow: true, reflection: true, reflectionOpacity: 0.4 },
      depth: { mode: 'off' },
      effects: { vignette: 0.35, bloom: 0.2, grain: 0.05 },
      frame: { aspect: '16:9' },
    },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    tag: 'Screen',
    description: 'Bare screen on paper white, contact shadow only',
    preview: { background: 'linear-gradient(180deg, #ffffff, #e2e8f0)', deviceKind: 'screen' },
    scene: {
      device: { kind: 'screen', screenRadius: 0.08, border: 0 },
      camera: { yaw: -10, pitch: 6, roll: 0, fov: 28, zoom: 1, panX: 0, panY: 0 },
      background: { kind: 'linear', colors: ['#ffffff', '#e2e8f0'], angle: 180 },
      lighting: { preset: 'soft', shadow: true, shadowOpacity: 0.35, reflection: false },
      depth: { mode: 'off' },
      effects: { vignette: 0, bloom: 0, grain: 0 },
      frame: { aspect: '16:9' },
    },
  },
  {
    id: 'ember-spin',
    name: 'Ember Motion',
    tag: 'Phone · Video',
    description: 'Sway animation on an ember gradient, ready to record',
    preview: { background: 'linear-gradient(150deg, #f97316, #be123c, #1e0b3b)', deviceKind: 'android' },
    scene: {
      device: { kind: 'android', finish: 'midnight' },
      camera: { yaw: 0, pitch: 8, roll: 0, fov: 32, zoom: 1, panX: 0, panY: 0 },
      background: { kind: 'linear', colors: ['#f97316', '#be123c', '#1e0b3b'], angle: 150 },
      lighting: { preset: 'sunset', shadow: true, reflection: false },
      depth: { mode: 'off' },
      effects: { vignette: 0.3, bloom: 0.2, grain: 0.06 },
      motion: { enabled: true, kind: 'sway', speed: 0.8, intensity: 0.6, duration: 6 },
      frame: { aspect: '1:1' },
    },
  },
  {
    id: 'wrist',
    name: 'On the Wrist',
    tag: 'Watch',
    description: 'Watch face close-up with crimson glow',
    preview: { background: 'radial-gradient(circle at 50% 40%, #7f1d1d, #1c0505)', deviceKind: 'watch' },
    scene: {
      device: { kind: 'watch', finish: 'space-black' },
      camera: { yaw: -30, pitch: 18, roll: 0, fov: 28, zoom: 1, panX: 0, panY: 0 },
      background: { kind: 'radial', colors: ['#7f1d1d', '#1c0505'], angle: 0 },
      lighting: { preset: 'dramatic', shadow: true, reflection: false },
      depth: { mode: 'lens', autoFocus: true, focalLength: 0.05, bokeh: 1 },
      effects: { vignette: 0.45, bloom: 0.3, grain: 0.1 },
      frame: { aspect: '4:5' },
    },
  },
]

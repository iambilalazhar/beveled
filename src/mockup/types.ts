export type DeviceKind =
  | 'phone'
  | 'android'
  | 'tablet'
  | 'laptop'
  | 'monitor'
  | 'browser'
  | 'screen'
  | 'watch'

export type FinishId =
  | 'space-black'
  | 'silver'
  | 'titanium'
  | 'midnight'
  | 'starlight'
  | 'deep-blue'
  | 'graphite'
  | 'white'

export type Orientation = 'portrait' | 'landscape'
export type ScreenFit = 'cover' | 'contain' | 'stretch'
export type BlurMode = 'off' | 'lens' | 'tilt-shift' | 'radial' | 'directional'
export type BackgroundKind = 'solid' | 'linear' | 'radial' | 'transparent'
export type MotionKind = 'float' | 'orbit' | 'sway' | 'spin'
export type AspectId = 'auto' | '1:1' | '16:9' | '4:5' | '9:16' | '3:2' | '4:3' | '21:9' | 'custom'
export type ExportFormat = 'png' | 'jpeg' | 'webp'
export type MediaKind = 'image' | 'video'
export type LightPresetId = 'studio' | 'soft' | 'dramatic' | 'neon' | 'sunset' | 'cool' | 'top'

export type MediaState = {
  url: string | null
  kind: MediaKind | null
  width: number
  height: number
  name: string | null
}

export type DeviceState = {
  kind: DeviceKind
  finish: FinishId
  fit: ScreenFit
  orientation: Orientation
  scale: number
  lidAngle: number
  screenRadius: number
  browserDark: boolean
  browserUrl: string
  border: number
  borderColor: string
}

export type CameraState = {
  yaw: number
  pitch: number
  roll: number
  fov: number
  zoom: number
  panX: number
  panY: number
}

export type BackgroundState = {
  kind: BackgroundKind
  colors: string[]
  angle: number
  noise: number
}

export type LightingState = {
  preset: LightPresetId
  intensity: number
  envIntensity: number
  keyColor: string
  shadow: boolean
  shadowOpacity: number
  shadowBlur: number
  reflection: boolean
  reflectionOpacity: number
  reflectionBlur: number
  screenGlare: number
}

export type DepthState = {
  mode: BlurMode
  strength: number
  falloff: number
  bokeh: number
  focusX: number
  focusY: number
  focusSize: number
  angle: number
  autoFocus: boolean
  focusDistance: number
  focalLength: number
}

export type EffectsState = {
  bloom: number
  bloomThreshold: number
  vignette: number
  grain: number
  chromatic: number
  sharpen: number
  brightness: number
  contrast: number
  saturation: number
  hue: number
}

export type MotionState = {
  enabled: boolean
  kind: MotionKind
  speed: number
  intensity: number
  duration: number
}

export type FrameState = {
  aspect: AspectId
  customWidth: number
  customHeight: number
}

export type ExportState = {
  format: ExportFormat
  scale: number
  quality: number
  transparent: boolean
}

export type SceneState = {
  media: MediaState
  device: DeviceState
  camera: CameraState
  background: BackgroundState
  lighting: LightingState
  depth: DepthState
  effects: EffectsState
  motion: MotionState
  frame: FrameState
  export: ExportState
}

export type SceneSection = keyof SceneState

export type PanelId =
  | 'media'
  | 'device'
  | 'camera'
  | 'background'
  | 'lighting'
  | 'depth'
  | 'effects'
  | 'motion'
  | 'export'

export type Template = {
  id: string
  name: string
  tag: string
  description: string
  preview: { background: string; deviceKind: DeviceKind }
  scene: Partial<{ [K in Exclude<SceneSection, 'media'>]: Partial<SceneState[K]> }>
}

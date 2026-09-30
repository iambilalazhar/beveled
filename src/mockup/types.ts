export type DeviceKind =
  | 'phone'
  | 'android'
  | 'tablet'
  | 'laptop'
  | 'monitor'
  | 'browser'
  | 'screen'
  | 'watch'
  | 'custom'

export type FinishId =
  | 'space-black'
  | 'silver'
  | 'titanium'
  | 'midnight'
  | 'starlight'
  | 'deep-blue'
  | 'graphite'
  | 'white'
  | 'cosmic-orange'
  | 'lavender'
  | 'sage'
  | 'mist-blue'
  | 'sky-blue'
  | 'light-gold'

export type Orientation = 'portrait' | 'landscape'
export type BrowserStyle = 'safari' | 'chrome' | 'arc'
export type ScreenFit = 'cover' | 'contain' | 'stretch'
export type BlurMode = 'off' | 'lens' | 'tilt-shift' | 'radial' | 'directional'
export type BackgroundKind = 'solid' | 'linear' | 'radial' | 'image' | 'transparent'
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
  /** Specific model within the family, e.g. 'iphone-17-pro'. */
  model: string
  finish: FinishId
  fit: ScreenFit
  orientation: Orientation
  scale: number
  /** Laptop lid opening angle in degrees (90 = upright). */
  lidAngle: number
  /** Corner radius for the bare screen / browser window (scene units). */
  screenRadius: number
  /** Dynamic Island / punch-hole / laptop notch visible. */
  notch: boolean
  /** Draw an iOS-style status bar over the top of phone screens. */
  statusBar: boolean
  /** Device rotation in degrees, independent of the camera. */
  rotateX: number
  rotateY: number
  /** Colour behind letterboxed / padded media. */
  screenBg: string
  /** Inset of the media inside the screen, 0..0.45 of the short side. */
  screenPadding: number
  browserStyle: BrowserStyle
  browserDark: boolean
  browserUrl: string
  border: number
  borderColor: string
  /** Your own glTF / GLB model (object URL) for the 'custom' device. */
  customModel: string | null
  customModelName: string | null
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
  /** Image background (object URL or data URL). */
  image: string | null
  imageBlur: number
}

export type LightingState = {
  preset: LightPresetId
  /** Key light intensity multiplier. */
  intensity: number
  /** Environment (Lightformer) intensity multiplier. */
  envIntensity: number
  /** Environment rotation around Y in degrees. */
  rotation: number
  /** Environment tilt around X in degrees. */
  elevation: number
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
  /** Blur radius in pixels at 1x (tilt-shift / radial / directional) or bokeh scale for lens. */
  strength: number
  falloff: number
  bokeh: number
  focusX: number
  focusY: number
  focusSize: number
  angle: number
  autoFocus: boolean
  focusDistance: number
  /** Lens depth of field focus range in scene units. */
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
  exposure: number
  shadows: number
  midtones: number
  highlights: number
  fisheye: number
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

export type VideoFormat = 'mp4' | 'webm'

export type ExportState = {
  format: ExportFormat
  scale: number
  quality: number
  transparent: boolean
  fps: number
  videoFormat: VideoFormat
  /** Output height in pixels for video (width follows the frame aspect). */
  videoHeight: number
  /** Video bitrate in megabits per second. */
  videoBitrate: number
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
  | 'clip'
  | 'media'
  | 'device'
  | 'camera'
  | 'background'
  | 'lighting'
  | 'depth'
  | 'effects'
  | 'motion'
  | 'export'

export type ScenePatch = Partial<{ [K in Exclude<SceneSection, 'media' | 'frame' | 'export'>]: Partial<SceneState[K]> }>

export type TemplateClip =
  | { kind: 'shot'; name?: string; duration?: number; scene: ScenePatch; preset?: string; transitionIn?: 'cut' | 'fade'; transitionOut?: 'cut' | 'fade' }
  | { kind: 'text'; name?: string; duration?: number; text: Partial<import('./timeline/types').TextState>; transitionIn?: 'cut' | 'fade'; transitionOut?: 'cut' | 'fade' }
  | { kind: 'logo'; name?: string; duration?: number; logo: Partial<import('./timeline/types').LogoState>; transitionIn?: 'cut' | 'fade'; transitionOut?: 'cut' | 'fade' }

export type Template = {
  id: string
  name: string
  tag: string
  description: string
  animated?: boolean
  preview: { background: string; deviceKind: DeviceKind }
  scene: ScenePatch & { frame?: Partial<FrameState> }
  /** Multi-clip timeline. When present, applying the template replaces the whole timeline. */
  clips?: TemplateClip[]
}

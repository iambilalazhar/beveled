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
export type BackgroundKind = 'solid' | 'linear' | 'radial' | 'image' | 'shader' | 'transparent'
/** Procedural, animated backgrounds rendered in a shader (resolution independent). */
export type ShaderBgId = 'aurora' | 'silk' | 'mesh' | 'waves' | 'prism' | 'chrome' | 'dunes' | 'swirl' | 'bokeh' | 'grain'
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
  /** Scroll position of media taller than the screen: 0 = top, 1 = bottom (keyframable). */
  scroll: number
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
  /** Pattern used when kind is 'shader'. */
  shader: ShaderBgId
  /** Animation speed of shader backgrounds (0 = still). */
  speed: number
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
  bloomRadius: number
  /** Frosted glass border around the frame, % of the short side (0 = off). */
  glassBorder: number
  /** LCD pixel grid, 0..1 (0 = off). */
  pixelGrid: number
  /** Gradient fade across the device screen. */
  screenFade: number
  screenFadeAngle: number
  screenFadeSoftness: number
  /** Liquid glass refraction (0 = off) applied to the frame edges or the device body. */
  liquidGlass: number
  liquidGlassShine: number
  liquidGlassTarget: 'frame' | 'mockup'
  /** Light-through-a-window shadow overlay (0 = off). */
  lightShadow: number
  lightShadowPattern: LightShadowPattern
  lightShadowAngle: number
  lightShadowSoftness: number
  /** Effects switched off with the eye toggle but kept in the stack. */
  hidden: EffectId[]
}

export type LightShadowPattern = 'blinds' | 'window' | 'leaves' | 'palm'

export type EffectId =
  | 'glassBorder'
  | 'sharpen'
  | 'vignette'
  | 'grain'
  | 'fisheye'
  | 'pixelGrid'
  | 'chromatic'
  | 'bloom'
  | 'screenFade'
  | 'liquidGlass'
  | 'lightShadow'

export type EnvironmentId = 'none' | 'concrete-desk' | 'wood-desk' | 'dark-room' | 'dark-grid' | 'concrete-dark' | 'bright-studio'

/** A 3-D set around the device: floor / desk, back wall, fog. */
export type EnvironmentState = {
  kind: EnvironmentId
  /** Height of the back wall relative to the device, 0 = no wall. */
  wall: number
  /** Distance of the wall behind the device. */
  depth: number
  /** Fog density blending the set into its backdrop colour. */
  fog: number
}

export type GroupArrangement = 'row' | 'fan' | 'cascade' | 'stack' | 'tilt'

/** Two or three copies of the device in one shot, each with its own screen. */
export type GroupState = {
  count: 1 | 2 | 3
  arrangement: GroupArrangement
  spacing: number
  /** Screens of devices 2 and 3; null shows the main media. */
  media2: MediaState | null
  media3: MediaState | null
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
  /** Sub-frame samples per frame for video motion blur (1 = off). */
  motionBlur: number
  /** Keep the alpha channel in WebM video (transparent background only). */
  videoAlpha: boolean
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
  environment: EnvironmentState
  group: GroupState
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

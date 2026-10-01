import type { Easing } from '@/mockup/timeline/types'
import type { BackgroundState, BrowserStyle, ExportFormat, FinishId, LightShadowPattern, MediaState, Orientation, ScreenFit, VideoFormat } from '@/mockup/types'

/** Flat (2-D) mockup families, modelled on shots.so. Physical devices reuse the 3-D editor's model specs. */
export type FlatKind = 'screenshot' | 'browser' | 'phone' | 'android' | 'tablet' | 'laptop' | 'monitor' | 'watch'

export type ScreenshotStyle = 'default' | 'glass-light' | 'glass-dark' | 'liquid-glass' | 'inset-light' | 'inset-dark' | 'outline' | 'border'
export type ShadowStyle = 'none' | 'spread' | 'hug' | 'adaptive'
export type SceneOverlay = 'none' | 'shadow' | 'shapes'
export type CornerPreset = 'sharp' | 'curved' | 'round'

export type MockupState = {
  kind: FlatKind
  /** Model id from the 3-D editor's MODELS (phones, tablets, laptops, displays, watches). */
  model: string
  finish: FinishId
  /** Screenshot style (also used as the window treatment of browser mockups). */
  style: ScreenshotStyle
  /** Corner radius of the screenshot / window, in px at a 1000 px wide mockup. */
  radius: number
  borderWidth: number
  borderColor: string
  browserStyle: BrowserStyle
  browserDark: boolean
  browserUrl: string
  orientation: Orientation
  fit: ScreenFit
  /** 0 = top of a tall screenshot, 1 = bottom. */
  scroll: number
  shadow: ShadowStyle
  shadowOpacity: number
  /** Direction the light comes from, degrees (0 = from the top). */
  lightAngle: number
  /** How far the shadow falls, 0..1. */
  lightDistance: number
  hidden: boolean
  count: 1 | 2 | 3
  gap: number
  /** Media per device; index 0 is the main screen. Null slots show the main media. */
  media: (MediaState | null)[]
}

export type FrameState2D = {
  width: number
  height: number
  background: BackgroundState
  scene: SceneOverlay
  lightShadowPattern: LightShadowPattern
  lightShadowOpacity: number
  /** Seed for the decorative shapes scene. */
  shapesSeed: number
  /** Background blur around the device (0 = off). */
  portrait: number
  watermark: boolean
  watermarkText: string
  grain: number
  vignette: number
  bloom: number
  chromatic: number
  /** Gentle idle tilt animation. */
  parallax: boolean
}

export type Layout2D = {
  /** 1 = the mockup fits the frame with breathing room. */
  zoom: number
  /** Offsets in fractions of the frame (−1..1). */
  x: number
  y: number
  rotateX: number
  rotateY: number
  rotateZ: number
}

export type AnimStep = { id: string; layout: Layout2D; duration: number; easing: Easing }

export type ShotsExport = {
  format: ExportFormat
  scale: number
  quality: number
  videoFormat: VideoFormat
  fps: number
  videoBitrate: number
  /** Seconds of a static (non-animated) video. */
  stillDuration: number
}

export type ShotsProject = {
  mockup: MockupState
  frame: FrameState2D
  base: Layout2D
  steps: AnimStep[]
  export: ShotsExport
}

export type ShotsTemplate = {
  id: string
  name: string
  tag: string
  description: string
  animated?: boolean
  mockup?: Partial<MockupState>
  frame?: Partial<FrameState2D>
  base?: Partial<Layout2D>
  steps?: { layout: Partial<Layout2D>; duration?: number }[]
}

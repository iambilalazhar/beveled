import type { BackgroundState, SceneState } from '../types'

/* ------------------------------------------------------------------ */
/* Easing                                                              */
/* ------------------------------------------------------------------ */

export type EasePreset = 'linear' | 'quad' | 'cubic' | 'quart' | 'quint' | 'sine' | 'expo' | 'circ' | 'custom'
export type EaseMode = 'in' | 'out' | 'inOut'

export type Easing = {
  preset: EasePreset
  mode: EaseMode
  /** Cubic bezier control points, used when preset is 'custom'. */
  bezier: [number, number, number, number]
}

/* ------------------------------------------------------------------ */
/* Keyframes                                                           */
/* ------------------------------------------------------------------ */

export type Keyframe = {
  id: string
  /** Seconds from the start of the clip. */
  t: number
  value: number
  /** Easing of the segment that starts at this keyframe. */
  easing: Easing
}

/** Animatable scalar properties, addressed as `section.field`. */
export type AnimKey =
  | 'camera.yaw'
  | 'camera.pitch'
  | 'camera.roll'
  | 'camera.fov'
  | 'camera.zoom'
  | 'camera.panX'
  | 'camera.panY'
  | 'device.rotateX'
  | 'device.rotateY'
  | 'device.lidAngle'
  | 'device.scale'
  | 'device.scroll'
  | 'lighting.rotation'
  | 'lighting.elevation'
  | 'lighting.intensity'
  | 'lighting.envIntensity'
  | 'depth.strength'
  | 'depth.focusX'
  | 'depth.focusY'
  | 'depth.focusSize'
  | 'depth.falloff'
  | 'depth.angle'
  | 'depth.bokeh'
  | 'depth.focalLength'
  | 'depth.focusDistance'
  | 'effects.vignette'
  | 'effects.bloom'
  | 'effects.exposure'
  | 'effects.saturation'

export type Tracks = Partial<Record<AnimKey, Keyframe[]>>

/* ------------------------------------------------------------------ */
/* Clips                                                               */
/* ------------------------------------------------------------------ */

export type TransitionKind = 'cut' | 'fade'
export type Transition = { kind: TransitionKind; duration: number }

export type ShotScene = Omit<SceneState, 'frame' | 'export'>

type ClipBase = {
  id: string
  name: string
  /** Seconds. */
  duration: number
  transitionIn: Transition
  transitionOut: Transition
}

export type TextEffect =
  | 'none'
  | 'soft-blur'
  | 'fade-up'
  | 'scale-up'
  | 'scale-down'
  | 'blur-scale-up'
  | 'blur-scale-down'
  | 'words-in-left'
  | 'words-in-right'
  | 'knock-left'
  | 'knock-right'

export type TextUnit = 'line' | 'word' | 'character'
export type TextAnim = { per: TextUnit; duration: number; effect: TextEffect }

export type TextState = {
  text: string
  font: string
  weight: number
  /** Font size in 1/60ths of the frame height. */
  size: number
  /** Letter spacing in 1/100ths of an em. */
  spacing: number
  lineHeight: number
  align: 'left' | 'center' | 'right'
  color: string
  background: BackgroundState
  enter: TextAnim
  exit: TextAnim
}

export type LogoEffect = 'none' | 'liquid-metal' | 'gem-smoke' | 'heatmap'
export type LogoAnimEffect = 'none' | 'fade' | 'scale' | 'blur' | 'rise'
export type LogoAnim = { effect: LogoAnimEffect; duration: number }

export type LogoState = {
  url: string | null
  name: string | null
  width: number
  height: number
  effect: LogoEffect
  /** Logo height in 1/20ths of the frame height. */
  scale: number
  background: BackgroundState
  enter: LogoAnim
  exit: LogoAnim
}

/** A focus area for auto-motion, in normalised media coordinates (y down). */
export type FocusArea = { id: string; x: number; y: number; w: number; h: number }

export type ShotClip = ClipBase & { kind: 'shot'; scene: ShotScene; tracks: Tracks; focusAreas?: FocusArea[] }
export type TextClip = ClipBase & { kind: 'text'; text: TextState }
export type LogoClip = ClipBase & { kind: 'logo'; logo: LogoState }
export type Clip = ShotClip | TextClip | LogoClip
export type ClipKind = Clip['kind']

export type AudioState = {
  url: string | null
  name: string | null
  /** Seconds of the audio file. */
  duration: number
  volume: number
  /** Seconds skipped at the start of the audio file. */
  offset: number
  fadeOut: boolean
}

export type TimelineMode = 'simple' | 'advanced'

export type KeyframeRef = { clipId: string; key: AnimKey; id: string }

import { DEFAULT_EASING } from '@/mockup/timeline/easing'
import type { BackgroundState } from '@/mockup/types'
import type { CornerPreset, FlatKind, Layout2D, ScreenshotStyle, ShadowStyle, ShotsProject, ShotsTemplate } from './types'

export const FLAT_FAMILIES: { kind: FlatKind; label: string; group: string; models?: string[]; hint: string }[] = [
  { kind: 'screenshot', label: 'Screenshot', group: 'Essentials', hint: 'Adapts to media' },
  { kind: 'browser', label: 'Browser', group: 'Essentials', hint: 'Adapts to media' },
  { kind: 'phone', label: 'iPhone', group: 'Phones', models: ['iphone-17-pro', 'iphone-17-pro-max', 'iphone-17', 'iphone-air'], hint: '' },
  { kind: 'android', label: 'Android', group: 'Phones', models: ['pixel-10-pro', 'galaxy-s25-ultra'], hint: '' },
  { kind: 'tablet', label: 'iPad', group: 'Tablets', models: ['ipad-pro-13', 'ipad-pro-11', 'ipad-air'], hint: '' },
  { kind: 'laptop', label: 'MacBook', group: 'Laptops', models: ['macbook-pro-14', 'macbook-pro-16', 'macbook-air-13'], hint: '' },
  { kind: 'monitor', label: 'Display', group: 'Desktops', models: ['studio-display', 'pro-display-xdr'], hint: '' },
  { kind: 'watch', label: 'Watch', group: 'Wearables', models: ['watch-ultra', 'watch-series'], hint: '' },
]

export const SCREENSHOT_STYLES: { id: ScreenshotStyle; label: string }[] = [
  { id: 'default', label: 'Default' },
  { id: 'glass-light', label: 'Glass Light' },
  { id: 'glass-dark', label: 'Glass Dark' },
  { id: 'liquid-glass', label: 'Liquid Glass' },
  { id: 'inset-light', label: 'Inset Light' },
  { id: 'inset-dark', label: 'Inset Dark' },
  { id: 'outline', label: 'Outline' },
  { id: 'border', label: 'Border' },
]

export const CORNERS: { id: CornerPreset; label: string; radius: number }[] = [
  { id: 'sharp', label: 'Sharp', radius: 0 },
  { id: 'curved', label: 'Curved', radius: 20 },
  { id: 'round', label: 'Round', radius: 44 },
]

export const SHADOWS: { id: ShadowStyle; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'spread', label: 'Spread' },
  { id: 'hug', label: 'Hug' },
  { id: 'adaptive', label: 'Adaptive' },
]

export const BASE_LAYOUT: Layout2D = { zoom: 1, x: 0, y: 0, rotateX: 0, rotateY: 0, rotateZ: 0 }

/** Framings of the same shot, like shots.so's layout presets. */
export const LAYOUT_PRESETS: { id: string; label: string; layout: Layout2D }[] = [
  { id: 'center', label: 'Centred', layout: BASE_LAYOUT },
  { id: 'tilt-left', label: 'Tilt left', layout: { ...BASE_LAYOUT, zoom: 0.95, rotateX: 6, rotateY: 24 } },
  { id: 'tilt-right', label: 'Tilt right', layout: { ...BASE_LAYOUT, zoom: 0.95, rotateX: 6, rotateY: -24 } },
  { id: 'lay-back', label: 'Lay back', layout: { ...BASE_LAYOUT, zoom: 0.95, rotateX: 32 } },
  { id: 'iso', label: 'Isometric', layout: { ...BASE_LAYOUT, zoom: 0.85, rotateX: 40, rotateZ: 32 } },
  { id: 'float', label: 'Float', layout: { ...BASE_LAYOUT, zoom: 0.9, rotateX: -8, rotateY: 16, rotateZ: -5 } },
  { id: 'zoom-top', label: 'Zoom top-left', layout: { ...BASE_LAYOUT, zoom: 1.9, x: 0.42, y: -0.42 } },
  { id: 'zoom-bottom', label: 'Zoom bottom-right', layout: { ...BASE_LAYOUT, zoom: 1.9, x: -0.42, y: 0.42 } },
  { id: 'hero-crop', label: 'Hero crop', layout: { ...BASE_LAYOUT, zoom: 1.35, y: -0.25 } },
  { id: 'tilted-zoom', label: 'Tilted zoom', layout: { ...BASE_LAYOUT, zoom: 1.5, x: 0.2, y: -0.15, rotateX: 18, rotateY: -18, rotateZ: 6 } },
]

const bg = (patch: Partial<BackgroundState>): BackgroundState => ({ kind: 'linear', colors: ['#000000'], angle: 135, noise: 0, image: null, imageBlur: 0.4, shader: 'mesh', speed: 0.3, ...patch })

export type LibraryItem = { id: string; label: string; bg: BackgroundState; thumb?: string }

/** Background libraries (shots.so: Solid, Gradient, Glass, Cosmic, Mystic, Desktop, Abstract, Earth, Radiant, Texture). */
export const BG_LIBRARIES: { id: string; label: string; items: LibraryItem[] }[] = [
  {
    id: 'solid',
    label: 'Solid',
    items: ['#ffffff', '#f4f4f5', '#e7e5e4', '#fde68a', '#fecaca', '#bfdbfe', '#bbf7d0', '#ddd6fe', '#e05d38', '#18181b', '#0a0a0a', '#1e3a8a'].map((c) => ({
      id: `solid-${c}`,
      label: c,
      bg: bg({ kind: 'solid', colors: [c] }),
    })),
  },
  {
    id: 'gradient',
    label: 'Gradient',
    items: [
      ['peach', ['#fecaca', '#fdba74', '#fde68a'], 120],
      ['lilac', ['#f5d0fe', '#c4b5fd', '#93c5fd'], 135],
      ['mint', ['#a7f3d0', '#67e8f9', '#e0f2fe'], 135],
      ['sunset', ['#f97316', '#db2777', '#7c3aed'], 135],
      ['ocean', ['#06b6d4', '#2563eb', '#1e1b4b'], 160],
      ['tangerine', ['#fb923c', '#e05d38', '#7c2d12'], 135],
      ['night', ['#1e293b', '#0f172a', '#020617'], 180],
      ['sky', ['#e0f2fe', '#bae6fd', '#ffffff'], 180],
    ].map(([id, colors, angle]) => ({ id: `grad-${id}`, label: String(id), bg: bg({ kind: 'linear', colors: colors as string[], angle: angle as number }) })),
  },
  {
    id: 'glass',
    label: 'Glass',
    items: [
      { id: 'glass-pastel', label: 'Pastel glass', bg: bg({ kind: 'shader', shader: 'mesh', colors: ['#fbcfe8', '#c7d2fe', '#a5f3fc'], speed: 0.3 }) },
      { id: 'glass-warm', label: 'Warm glass', bg: bg({ kind: 'shader', shader: 'mesh', colors: ['#fed7aa', '#fecdd3', '#fef08a'], speed: 0.3 }) },
      { id: 'glass-satin', label: 'Satin', bg: bg({ kind: 'shader', shader: 'silk', colors: ['#e7e5e4', '#fafaf9', '#d6d3d1'], speed: 0.2 }) },
      { id: 'glass-lagoon', label: 'Lagoon', bg: bg({ kind: 'shader', shader: 'mesh', colors: ['#0ea5e9', '#14b8a6', '#1e3a8a'], speed: 0.4 }) },
    ],
  },
  {
    id: 'cosmic',
    label: 'Cosmic',
    items: [
      { id: 'aurora', label: 'Aurora', bg: bg({ kind: 'shader', shader: 'aurora', colors: ['#050816', '#22d3a6', '#7c3aed'], speed: 0.3 }) },
      { id: 'borealis', label: 'Borealis', bg: bg({ kind: 'shader', shader: 'aurora', colors: ['#0b0614', '#e05d38', '#f59e0b'], speed: 0.3 }) },
      { id: 'prism', label: 'Prism', bg: bg({ kind: 'shader', shader: 'prism', colors: ['#020617', '#111827', '#ffffff'], speed: 0.3 }) },
      { id: 'bokeh', label: 'Bokeh', bg: bg({ kind: 'shader', shader: 'bokeh', colors: ['#0b1020', '#f59e0b', '#ec4899'], speed: 0.3 }) },
    ],
  },
  {
    id: 'mystic',
    label: 'Mystic',
    items: [
      { id: 'swirl', label: 'Swirl', bg: bg({ kind: 'shader', shader: 'swirl', colors: ['#0c0a09', '#e05d38', '#fde047'], speed: 0.3 }) },
      { id: 'silk', label: 'Silk', bg: bg({ kind: 'shader', shader: 'silk', colors: ['#1e1b4b', '#7c3aed', '#f0abfc'], speed: 0.25 }) },
      { id: 'mystic-violet', label: 'Violet swirl', bg: bg({ kind: 'shader', shader: 'swirl', colors: ['#0b0614', '#7c3aed', '#f0abfc'], speed: 0.3 }) },
    ],
  },
  {
    id: 'desktop',
    label: 'Desktop',
    items: [
      { id: 'waves', label: 'Waves', bg: bg({ kind: 'shader', shader: 'waves', colors: ['#0f172a', '#334155', '#e05d38'], speed: 0.35 }) },
      { id: 'pastel-waves', label: 'Pastel waves', bg: bg({ kind: 'shader', shader: 'waves', colors: ['#fde68a', '#fbcfe8', '#c4b5fd'], speed: 0.35 }) },
      { id: 'desktop-blue', label: 'Blue hills', bg: bg({ kind: 'shader', shader: 'waves', colors: ['#0c4a6e', '#0284c7', '#7dd3fc'], speed: 0.3 }) },
    ],
  },
  {
    id: 'abstract',
    label: 'Abstract',
    items: [
      { id: 'chrome', label: 'Chrome', bg: bg({ kind: 'shader', shader: 'chrome', colors: ['#0a0a0a', '#d4d4d8', '#93c5fd'], speed: 0.25 }) },
      { id: 'gold', label: 'Gold', bg: bg({ kind: 'shader', shader: 'chrome', colors: ['#1c1206', '#f5c26b', '#fff7e6'], speed: 0.25 }) },
      { id: 'mesh', label: 'Mesh', bg: bg({ kind: 'shader', shader: 'mesh', colors: ['#fb7185', '#818cf8', '#fcd34d'], speed: 0.4 }) },
    ],
  },
  {
    id: 'earth',
    label: 'Earth',
    items: [
      { id: 'dunes', label: 'Dunes', bg: bg({ kind: 'shader', shader: 'dunes', colors: ['#7c2d12', '#fb923c', '#fde68a'], speed: 0.2 }) },
      { id: 'night-dunes', label: 'Night dunes', bg: bg({ kind: 'shader', shader: 'dunes', colors: ['#020617', '#1e293b', '#6366f1'], speed: 0.2 }) },
      { id: 'earth-moss', label: 'Moss', bg: bg({ kind: 'shader', shader: 'dunes', colors: ['#14532d', '#4d7c0f', '#d9f99d'], speed: 0.2 }) },
    ],
  },
  {
    id: 'radiant',
    label: 'Radiant',
    items: [
      { id: 'radiant-pop', label: 'Pop', bg: bg({ kind: 'shader', shader: 'mesh', colors: ['#f43f5e', '#8b5cf6', '#22d3ee'], speed: 0.45 }) },
      { id: 'radiant-sun', label: 'Sun', bg: bg({ kind: 'radial', colors: ['#fde047', '#f97316', '#9f1239'] }) },
      { id: 'radiant-ice', label: 'Ice', bg: bg({ kind: 'radial', colors: ['#ffffff', '#bae6fd', '#3b82f6'] }) },
    ],
  },
  {
    id: 'texture',
    label: 'Texture',
    items: [
      { id: 'grain', label: 'Grain', bg: bg({ kind: 'shader', shader: 'grain', colors: ['#f97316', '#db2777', '#4f46e5'], speed: 0.2 }) },
      { id: 'texture-paper', label: 'Paper', bg: bg({ kind: 'solid', colors: ['#f1ece4'], noise: 0.35 }) },
      { id: 'texture-ink', label: 'Ink', bg: bg({ kind: 'solid', colors: ['#111111'], noise: 0.4 }) },
      { id: 'texture-mint', label: 'Mint grain', bg: bg({ kind: 'shader', shader: 'grain', colors: ['#a7f3d0', '#67e8f9', '#c4b5fd'], speed: 0.2 }) },
    ],
  },
]

const DEFAULT_MEDIA = { url: null, kind: null, width: 0, height: 0, name: null }

export const DEFAULT_SHOTS: ShotsProject = {
  mockup: {
    kind: 'screenshot',
    model: 'iphone-17-pro',
    finish: 'silver',
    style: 'default',
    radius: 20,
    borderWidth: 14,
    borderColor: '#ffffff',
    browserStyle: 'safari',
    browserDark: false,
    browserUrl: 'beveled.app',
    orientation: 'portrait',
    fit: 'cover',
    scroll: 0,
    shadow: 'spread',
    shadowOpacity: 0.5,
    lightAngle: 0,
    lightDistance: 0.5,
    hidden: false,
    count: 1,
    gap: 0.06,
    media: [{ ...DEFAULT_MEDIA }, null, null],
  },
  frame: {
    width: 1920,
    height: 1080,
    background: bg({ kind: 'linear', colors: ['#f5d0fe', '#c4b5fd', '#93c5fd'], angle: 135 }),
    scene: 'none',
    lightShadowPattern: 'leaves',
    lightShadowOpacity: 0.45,
    shapesSeed: 7,
    portrait: 0,
    watermark: false,
    watermarkText: 'Made with Beveled',
    grain: 0,
    vignette: 0,
    bloom: 0,
    chromatic: 0,
    parallax: false,
  },
  base: BASE_LAYOUT,
  steps: [],
  export: { format: 'png', scale: 2, quality: 0.92, videoFormat: 'mp4', fps: 30, videoBitrate: 12, stillDuration: 4 },
}

export const FRAME_RATIOS: { label: string; w: number; h: number }[] = [
  { label: '16:9', w: 1920, h: 1080 },
  { label: '3:2', w: 1920, h: 1280 },
  { label: '4:3', w: 1920, h: 1440 },
  { label: '5:4', w: 1600, h: 1280 },
  { label: '1:1', w: 1600, h: 1600 },
  { label: '4:5', w: 1080, h: 1350 },
  { label: '3:4', w: 1200, h: 1600 },
  { label: '2:3', w: 1280, h: 1920 },
  { label: '9:16', w: 1080, h: 1920 },
]

export const SHOTS_TEMPLATES: ShotsTemplate[] = [
  {
    id: 's-clean',
    name: 'Clean',
    tag: 'Image',
    description: 'Screenshot on a soft lilac gradient',
    mockup: { kind: 'screenshot', style: 'default', radius: 20, shadow: 'spread', count: 1 },
    frame: { background: bg({ kind: 'linear', colors: ['#f5d0fe', '#c4b5fd', '#93c5fd'], angle: 135 }), scene: 'none' },
    base: BASE_LAYOUT,
  },
  {
    id: 's-glass',
    name: 'Glass',
    tag: 'Image',
    description: 'Frosted glass window over a mesh gradient',
    mockup: { kind: 'screenshot', style: 'glass-light', radius: 26, shadow: 'spread' },
    frame: { background: bg({ kind: 'shader', shader: 'mesh', colors: ['#fb7185', '#818cf8', '#fcd34d'], speed: 0.4 }) },
    base: { ...BASE_LAYOUT, zoom: 0.92 },
  },
  {
    id: 's-safari',
    name: 'Safari',
    tag: 'Image',
    description: 'Safari window on warm paper',
    mockup: { kind: 'browser', browserStyle: 'safari', browserDark: false, radius: 18, shadow: 'spread' },
    frame: { background: bg({ kind: 'solid', colors: ['#f1ece4'], noise: 0.3 }) },
  },
  {
    id: 's-arc-dark',
    name: 'Arc Night',
    tag: 'Image',
    description: 'Arc window, aurora behind, tilted',
    mockup: { kind: 'browser', browserStyle: 'arc', browserDark: true, shadow: 'adaptive', shadowOpacity: 0.6 },
    frame: { background: bg({ kind: 'shader', shader: 'aurora', colors: ['#050816', '#22d3a6', '#7c3aed'], speed: 0.3 }) },
    base: { ...BASE_LAYOUT, zoom: 0.92, rotateX: 6, rotateY: -20 },
  },
  {
    id: 's-iphone-trio',
    name: 'iPhone Trio',
    tag: 'Image',
    description: 'Three iPhones on peach',
    mockup: { kind: 'phone', model: 'iphone-17-pro', finish: 'cosmic-orange', count: 3, gap: 0.05, shadow: 'spread' },
    frame: { background: bg({ kind: 'linear', colors: ['#fecaca', '#fdba74', '#fde68a'], angle: 120 }) },
  },
  {
    id: 's-sunlit',
    name: 'Sunlit',
    tag: 'Image',
    description: 'iPhone with leafy light on sand',
    mockup: { kind: 'phone', model: 'iphone-air', finish: 'light-gold', shadow: 'hug', shadowOpacity: 0.5 },
    frame: { background: bg({ kind: 'solid', colors: ['#efe2d0'], noise: 0.15 }), scene: 'shadow', lightShadowPattern: 'leaves', lightShadowOpacity: 0.5 },
    base: { ...BASE_LAYOUT, rotateZ: -8, zoom: 0.95 },
  },
  {
    id: 's-macbook-iso',
    name: 'MacBook Iso',
    tag: 'Image',
    description: 'MacBook laid back isometric on night blue',
    mockup: { kind: 'laptop', model: 'macbook-pro-14', finish: 'space-black', shadow: 'spread', shadowOpacity: 0.55 },
    frame: { background: bg({ kind: 'shader', shader: 'waves', colors: ['#0f172a', '#334155', '#e05d38'], speed: 0.35 }) },
    base: { ...BASE_LAYOUT, zoom: 0.85, rotateX: 40, rotateZ: 32 },
  },
  {
    id: 's-shapes',
    name: 'Shapes',
    tag: 'Image',
    description: 'iPad among soft shapes',
    mockup: { kind: 'tablet', model: 'ipad-pro-11', finish: 'silver', shadow: 'spread' },
    frame: { background: bg({ kind: 'solid', colors: ['#f4f4f5'] }), scene: 'shapes', shapesSeed: 11 },
    base: { ...BASE_LAYOUT, rotateZ: 6, zoom: 0.92 },
  },
  {
    id: 's-zoom-tour',
    name: 'Zoom Tour',
    tag: 'Animated',
    animated: true,
    description: 'Start wide, zoom into two corners, settle back',
    mockup: { kind: 'browser', browserStyle: 'chrome', browserDark: false, shadow: 'spread' },
    frame: { background: bg({ kind: 'shader', shader: 'mesh', colors: ['#fbcfe8', '#c7d2fe', '#a5f3fc'], speed: 0.3 }) },
    base: BASE_LAYOUT,
    steps: [
      { layout: { zoom: 1.9, x: 0.42, y: -0.42 }, duration: 1.4 },
      { layout: { zoom: 1.9, x: -0.42, y: 0.42 }, duration: 1.6 },
      { layout: { zoom: 1 }, duration: 1.4 },
    ],
  },
  {
    id: 's-tilt-reveal',
    name: 'Tilt Reveal',
    tag: 'Animated',
    animated: true,
    description: 'iPhone swings from a tilt to face the camera',
    mockup: { kind: 'phone', model: 'iphone-17-pro', finish: 'deep-blue', shadow: 'spread' },
    frame: { background: bg({ kind: 'shader', shader: 'aurora', colors: ['#050816', '#22d3a6', '#7c3aed'], speed: 0.3 }) },
    base: { ...BASE_LAYOUT, zoom: 0.8, rotateX: 18, rotateY: 40, rotateZ: -6 },
    steps: [{ layout: { zoom: 1.05, rotateX: 0, rotateY: 0, rotateZ: 0 }, duration: 2 }, { layout: { zoom: 1.4, y: -0.25 }, duration: 1.6 }],
  },
  {
    id: 's-iso-spin',
    name: 'Iso Spin',
    tag: 'Animated',
    animated: true,
    description: 'MacBook turns from isometric to flat',
    mockup: { kind: 'laptop', model: 'macbook-air-13', finish: 'starlight', shadow: 'spread' },
    frame: { background: bg({ kind: 'linear', colors: ['#e0f2fe', '#bae6fd', '#ffffff'], angle: 180 }) },
    base: { ...BASE_LAYOUT, zoom: 0.85, rotateX: 40, rotateZ: 32 },
    steps: [{ layout: { zoom: 1, rotateX: 0, rotateZ: 0 }, duration: 2.2 }],
  },
]

export const newStepEasing = () => ({ ...DEFAULT_EASING })

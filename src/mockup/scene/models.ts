import type { DeviceKind, FinishId } from '../types'

/**
 * Real-world device specs in millimetres. Geometry is built procedurally from these numbers
 * (1 scene unit = 100 mm), so proportions, bezels, corner radii and camera layouts match the
 * real products closely without shipping any third-party 3D assets.
 */

export type CameraLayout =
  | { kind: 'plateau-bar'; lenses: number; height: number; flash: boolean }
  | { kind: 'square'; lenses: 2 | 3; size: number }
  | { kind: 'visor'; lenses: number; height: number }
  | { kind: 'column'; lenses: number }
  | { kind: 'single'; size: number }

export type PhoneSpec = {
  family: 'phone' | 'android'
  w: number
  h: number
  d: number
  corner: number
  bezel: number
  screenCorner: number
  /** Screen resolution (portrait) used for the screen aspect. */
  res: [number, number]
  cutout: 'island' | 'punch-hole'
  camera: CameraLayout
  buttons: { side: 'left' | 'right'; from: number; len: number; kind?: 'action' | 'control' }[]
  frame: 'flat' | 'rounded'
}

export type TabletSpec = { family: 'tablet'; w: number; h: number; d: number; corner: number; bezel: number; screenCorner: number; res: [number, number]; camera: CameraLayout }

export type LaptopSpec = {
  family: 'laptop'
  w: number
  depth: number
  baseThick: number
  lidThick: number
  corner: number
  /** Display bezels (side, top, chin). */
  bezel: [number, number, number]
  res: [number, number]
  diagonalIn: number
  speakers: boolean
  notch: boolean
}

export type MonitorSpec = {
  family: 'monitor'
  w: number
  h: number
  d: number
  corner: number
  bezel: number
  res: [number, number]
  stand: 'studio' | 'pro'
  standH: number
  back: 'grille' | 'lattice'
}

export type WatchSpec = {
  family: 'watch'
  w: number
  h: number
  d: number
  corner: number
  bezel: number
  screenCorner: number
  res: [number, number]
  style: 'ultra' | 'series'
}

export type ModelSpec = PhoneSpec | TabletSpec | LaptopSpec | MonitorSpec | WatchSpec

export type DeviceModel = { id: string; label: string; kind: DeviceKind; spec: ModelSpec | null; finishes: FinishId[]; defaultFinish: FinishId }

const IPHONE_BUTTONS: PhoneSpec['buttons'] = [
  { side: 'left', from: 0.2, len: 0.045, kind: 'action' },
  { side: 'left', from: 0.29, len: 0.07 },
  { side: 'left', from: 0.38, len: 0.07 },
  { side: 'right', from: 0.3, len: 0.1 },
  { side: 'right', from: 0.62, len: 0.06, kind: 'control' },
]

export const MODELS: DeviceModel[] = [
  {
    id: 'iphone-17-pro',
    label: 'iPhone 17 Pro',
    kind: 'phone',
    finishes: ['silver', 'cosmic-orange', 'deep-blue'],
    defaultFinish: 'cosmic-orange',
    spec: {
      family: 'phone',
      w: 71.9,
      h: 150,
      d: 8.75,
      corner: 11.8,
      bezel: 1.6,
      screenCorner: 10.2,
      res: [1206, 2622],
      cutout: 'island',
      camera: { kind: 'plateau-bar', lenses: 3, height: 0.26, flash: true },
      buttons: IPHONE_BUTTONS,
      frame: 'flat',
    },
  },
  {
    id: 'iphone-17-pro-max',
    label: 'iPhone 17 Pro Max',
    kind: 'phone',
    finishes: ['silver', 'cosmic-orange', 'deep-blue'],
    defaultFinish: 'deep-blue',
    spec: {
      family: 'phone',
      w: 78,
      h: 163.4,
      d: 8.75,
      corner: 12.5,
      bezel: 1.6,
      screenCorner: 10.8,
      res: [1320, 2868],
      cutout: 'island',
      camera: { kind: 'plateau-bar', lenses: 3, height: 0.25, flash: true },
      buttons: IPHONE_BUTTONS,
      frame: 'flat',
    },
  },
  {
    id: 'iphone-17',
    label: 'iPhone 17',
    kind: 'phone',
    finishes: ['lavender', 'sage', 'mist-blue', 'white', 'space-black'],
    defaultFinish: 'lavender',
    spec: {
      family: 'phone',
      w: 71.5,
      h: 149.6,
      d: 7.95,
      corner: 11.6,
      bezel: 1.7,
      screenCorner: 10,
      res: [1206, 2622],
      cutout: 'island',
      camera: { kind: 'square', lenses: 2, size: 0.4 },
      buttons: IPHONE_BUTTONS,
      frame: 'flat',
    },
  },
  {
    id: 'iphone-air',
    label: 'iPhone Air',
    kind: 'phone',
    finishes: ['sky-blue', 'light-gold', 'white', 'space-black'],
    defaultFinish: 'sky-blue',
    spec: {
      family: 'phone',
      w: 74.7,
      h: 156.2,
      d: 5.64,
      corner: 12,
      bezel: 1.6,
      screenCorner: 10.5,
      res: [1260, 2736],
      cutout: 'island',
      camera: { kind: 'plateau-bar', lenses: 1, height: 0.2, flash: true },
      buttons: IPHONE_BUTTONS,
      frame: 'flat',
    },
  },
  {
    id: 'pixel-10-pro',
    label: 'Pixel 10 Pro',
    kind: 'android',
    finishes: ['graphite', 'white', 'mist-blue', 'sage'],
    defaultFinish: 'graphite',
    spec: {
      family: 'android',
      w: 72,
      h: 152.8,
      d: 8.6,
      corner: 11,
      bezel: 1.9,
      screenCorner: 9.4,
      res: [1280, 2856],
      cutout: 'punch-hole',
      camera: { kind: 'visor', lenses: 3, height: 0.17 },
      buttons: [
        { side: 'right', from: 0.23, len: 0.08 },
        { side: 'right', from: 0.36, len: 0.14 },
      ],
      frame: 'rounded',
    },
  },
  {
    id: 'galaxy-s25-ultra',
    label: 'Galaxy S25 Ultra',
    kind: 'android',
    finishes: ['titanium', 'space-black', 'silver', 'deep-blue'],
    defaultFinish: 'titanium',
    spec: {
      family: 'android',
      w: 77.6,
      h: 162.8,
      d: 8.2,
      corner: 7,
      bezel: 1.5,
      screenCorner: 5.8,
      res: [1440, 3120],
      cutout: 'punch-hole',
      camera: { kind: 'column', lenses: 3 },
      buttons: [
        { side: 'right', from: 0.25, len: 0.12 },
        { side: 'right', from: 0.42, len: 0.07 },
      ],
      frame: 'flat',
    },
  },
  {
    id: 'ipad-pro-13',
    label: 'iPad Pro 13"',
    kind: 'tablet',
    finishes: ['space-black', 'silver'],
    defaultFinish: 'space-black',
    spec: { family: 'tablet', w: 215.5, h: 281.6, d: 5.1, corner: 17, bezel: 8.6, screenCorner: 12, res: [2064, 2752], camera: { kind: 'single', size: 0.16 } },
  },
  {
    id: 'ipad-pro-11',
    label: 'iPad Pro 11"',
    kind: 'tablet',
    finishes: ['space-black', 'silver'],
    defaultFinish: 'silver',
    spec: { family: 'tablet', w: 177.5, h: 249.7, d: 5.3, corner: 16, bezel: 8.4, screenCorner: 11, res: [1668, 2420], camera: { kind: 'single', size: 0.18 } },
  },
  {
    id: 'ipad-air',
    label: 'iPad Air',
    kind: 'tablet',
    finishes: ['silver', 'starlight', 'deep-blue', 'midnight'],
    defaultFinish: 'starlight',
    spec: { family: 'tablet', w: 178.5, h: 247.6, d: 6.1, corner: 16, bezel: 9.7, screenCorner: 11, res: [1640, 2360], camera: { kind: 'single', size: 0.12 } },
  },
  {
    id: 'macbook-pro-14',
    label: 'MacBook Pro 14"',
    kind: 'laptop',
    finishes: ['space-black', 'silver'],
    defaultFinish: 'space-black',
    spec: { family: 'laptop', w: 312.6, depth: 221.2, baseThick: 11.5, lidThick: 4, corner: 11, bezel: [6.5, 7.5, 13], res: [3024, 1964], diagonalIn: 14.2, speakers: true, notch: true },
  },
  {
    id: 'macbook-pro-16',
    label: 'MacBook Pro 16"',
    kind: 'laptop',
    finishes: ['space-black', 'silver'],
    defaultFinish: 'silver',
    spec: { family: 'laptop', w: 355.7, depth: 248.1, baseThick: 12.3, lidThick: 4.5, corner: 12, bezel: [6.5, 7.5, 13.5], res: [3456, 2234], diagonalIn: 16.2, speakers: true, notch: true },
  },
  {
    id: 'macbook-air-13',
    label: 'MacBook Air 13"',
    kind: 'laptop',
    finishes: ['midnight', 'starlight', 'silver', 'deep-blue'],
    defaultFinish: 'midnight',
    spec: { family: 'laptop', w: 304.1, depth: 215, baseThick: 7.5, lidThick: 3.8, corner: 10, bezel: [6.5, 7.5, 12.5], res: [2560, 1664], diagonalIn: 13.6, speakers: false, notch: true },
  },
  {
    id: 'studio-display',
    label: 'Studio Display',
    kind: 'monitor',
    finishes: ['silver'],
    defaultFinish: 'silver',
    spec: { family: 'monitor', w: 623, h: 362, d: 30, corner: 14, bezel: 13, res: [5120, 2880], stand: 'studio', standH: 150, back: 'grille' },
  },
  {
    id: 'pro-display-xdr',
    label: 'Pro Display XDR',
    kind: 'monitor',
    finishes: ['silver'],
    defaultFinish: 'silver',
    spec: { family: 'monitor', w: 718, h: 412, d: 27, corner: 10, bezel: 9, res: [6016, 3384], stand: 'pro', standH: 170, back: 'lattice' },
  },
  { id: 'browser', label: 'Browser window', kind: 'browser', spec: null, finishes: [], defaultFinish: 'space-black' },
  { id: 'screen', label: 'Flat screen', kind: 'screen', spec: null, finishes: [], defaultFinish: 'space-black' },
  { id: 'custom', label: 'Your .glb model', kind: 'custom', spec: null, finishes: [], defaultFinish: 'space-black' },
  {
    id: 'watch-ultra',
    label: 'Watch Ultra 3',
    kind: 'watch',
    finishes: ['titanium', 'space-black'],
    defaultFinish: 'titanium',
    spec: { family: 'watch', w: 44, h: 49, d: 12, corner: 10.5, bezel: 2.6, screenCorner: 8.2, res: [422, 514], style: 'ultra' },
  },
  {
    id: 'watch-series',
    label: 'Watch Series 11',
    kind: 'watch',
    finishes: ['space-black', 'silver', 'white', 'midnight'],
    defaultFinish: 'space-black',
    spec: { family: 'watch', w: 39, h: 46, d: 9.7, corner: 11, bezel: 1.8, screenCorner: 9.5, res: [416, 496], style: 'series' },
  },
]

export const MODEL_BY_ID: Record<string, DeviceModel> = Object.fromEntries(MODELS.map((m) => [m.id, m]))

export const DEFAULT_MODEL: Record<DeviceKind, string> = {
  phone: 'iphone-17-pro',
  android: 'pixel-10-pro',
  tablet: 'ipad-pro-13',
  laptop: 'macbook-pro-14',
  monitor: 'studio-display',
  browser: 'browser',
  screen: 'screen',
  watch: 'watch-ultra',
  custom: 'custom',
}

export function modelFor(kind: DeviceKind, id: string | undefined): DeviceModel {
  const m = id ? MODEL_BY_ID[id] : undefined
  return m && m.kind === kind ? m : MODEL_BY_ID[DEFAULT_MODEL[kind]]
}

/** mm → scene units */
export const MM = 0.01

import type { BackgroundKind } from '../types'

/** CSS equivalent of the scene background, used for preview tiles. */
export function cssBackground(kind: BackgroundKind, colors: string[], angle: number) {
  if (kind === 'transparent') return 'repeating-conic-gradient(#3a3a3a 0% 25%, #222 0% 50%) 50% / 12px 12px'
  if (kind === 'solid' || colors.length < 2) return colors[0] ?? '#000'
  if (kind === 'radial') return `radial-gradient(circle at 50% 50%, ${colors.join(', ')})`
  return `linear-gradient(${angle}deg, ${colors.join(', ')})`
}

export type Padding = { x: number; y: number }
export type Rect = { x: number; y: number; w: number; h: number }
export type ActiveTool = 'none' | 'select' | 'crop' | 'text' | 'shape'

export type TextAlign = 'left' | 'center' | 'right'
export type TextNode = {
  id: string
  x: number
  y: number
  // Whether the position is anchored to the overall canvas (stage) or the screenshot content area
  positionAnchor?: 'stage' | 'content'
  text: string
  fontFamily: string
  fontSize: number
  bold: boolean
  italic: boolean
  align: TextAlign
  // Text fill
  fillType?: 'solid' | 'linear' | 'pattern'
  color: string // solid
  fillColor2?: string // linear
  fillAngle?: number // degrees for linear
  fillPattern?: 'dots' | 'grid' | 'diagonal' | 'wave' | 'icons'
  outline: boolean
  outlineColor: string
  outlineWidth: number
  // Background block behind text
  background?: boolean
  backgroundType?: 'solid' | 'linear'
  backgroundColor?: string
  backgroundColor2?: string
  backgroundAngle?: number
  backgroundAlpha?: number
  backgroundPaddingX?: number
  backgroundPaddingY?: number
  backgroundRadius?: number
  // Drop shadow for filled text
  shadow?: boolean
  shadowColor?: string
  shadowAlpha?: number
  shadowBlur?: number
  shadowOffsetX?: number
  shadowOffsetY?: number
}

export type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'line' | 'arrow'

export type ShapeNode = {
  id: string
  type: ShapeType
  // Anchor to stage or content similar to text
  positionAnchor?: 'stage' | 'content'
  x: number
  y: number
  w: number
  h: number
  rotation?: number // degrees, for rectangle/circle/triangle
  strokeColor: string
  strokeWidth: number
  fill?: boolean
  fillColor?: string
  // Shape-specific extras
  // For line/arrow, w/h define dx/dy; arrow has head size
  arrowHeadSize?: number
  // Shadow
  shadow?: boolean
  shadowColor?: string
  shadowAlpha?: number
  shadowBlur?: number
  shadowOffsetX?: number
  shadowOffsetY?: number
}

export type Padding = { x: number; y: number }
export type Rect = { x: number; y: number; w: number; h: number }
export type ActiveTool = 'none' | 'crop' | 'text'

export type TextAlign = 'left' | 'center' | 'right'
export type TextNode = {
  id: string
  x: number
  y: number
  text: string
  fontFamily: string
  fontSize: number
  bold: boolean
  italic: boolean
  align: TextAlign
  color: string
  outline: boolean
  outlineColor: string
  outlineWidth: number
}

import { useEffect, useRef, useState } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'
import { AppSidebar, type BgPreset, type LinearGradient, type WindowStyle } from '@/components/app-sidebar'
import { renderComposition } from './renderer'
import type { LayoutInfo } from './renderer'

import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
// Toolbar buttons are encapsulated in Toolbar component
import { Toolbar } from './Toolbar'
import { CropOverlay } from './CropOverlay'
import { FloatingTextToolbar } from './FloatingTextToolbar'
import type { Rect, TextNode, ShapeNode, ShapeType } from './types'
import { TextOverlay } from './TextOverlay'
import { FloatingShapeToolbar } from './FloatingShapeToolbar'
import { ShapesOverlay } from './ShapesOverlay'
import { TemplatesDropdown } from './TemplatesDropdown'
import { TemplateProperties } from './TemplateProperties'
import { TEMPLATES, type EditorTemplate } from './templates'
import { getChromeSafe, isExtensionRuntime } from '@/lib/env'

type Padding = { x: number; y: number }

export default function Editor(props: { initialImageSource?: Blob | string | null } = {}) {

  const SOLID_PRESETS: string[] = [
    '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', '#0f172a', '#111827',
    '#1d4ed8', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#f472b6', '#00000000'
  ]
  const GRADIENT_PRESETS: LinearGradient[] = [
    // Modern Tech Gradients
    { type: 'linear', angle: 135, stops: [ { color: '#667eea', pos: 0 }, { color: '#764ba2', pos: 1 } ] }, // Cosmic Purple
    { type: 'linear', angle: 120, stops: [ { color: '#f093fb', pos: 0 }, { color: '#f5576c', pos: 1 } ] }, // Pink Flamingo
    { type: 'linear', angle: 45, stops: [ { color: '#4facfe', pos: 0 }, { color: '#00f2fe', pos: 1 } ] }, // Ocean Blue
    
    // Warm & Professional
    { type: 'linear', angle: 135, stops: [ { color: '#fa709a', pos: 0 }, { color: '#fee140', pos: 1 } ] }, // Sunset Glow
    { type: 'linear', angle: 90, stops: [ { color: '#ff9a9e', pos: 0 }, { color: '#fecfef', pos: 1 } ] }, // Soft Pink
    { type: 'linear', angle: 135, stops: [ { color: '#a8edea', pos: 0 }, { color: '#fed6e3', pos: 1 } ] }, // Mint to Rose
    
    // Bold & Dynamic
    { type: 'linear', angle: 45, stops: [ { color: '#d299c2', pos: 0 }, { color: '#fef9d7', pos: 1 } ] }, // Lavender Dream
    { type: 'linear', angle: 135, stops: [ { color: '#89f7fe', pos: 0 }, { color: '#66a6ff', pos: 1 } ] }, // Sky Gradient
    
    // Dark & Sophisticated
    { type: 'linear', angle: 135, stops: [ { color: '#2c3e50', pos: 0 }, { color: '#4a6741', pos: 1 } ] }, // Dark Forest
    { type: 'linear', angle: 90, stops: [ { color: '#232526', pos: 0 }, { color: '#414345', pos: 1 } ] }, // Charcoal
    
    // Vibrant & Creative
    { type: 'linear', angle: 135, stops: [ { color: '#ff6b6b', pos: 0 }, { color: '#feca57', pos: 1 } ] }, // Coral Sunset
    { type: 'linear', angle: 45, stops: [ { color: '#48c6ef', pos: 0 }, { color: '#6f86d6', pos: 1 } ] }, // Electric Blue
  ]

  const [bgPreset, setBgPreset] = useState<BgPreset>({ type: 'solid', color: '#ffffff' })
  const [padding, setPadding] = useState<Padding>({ x: 64, y: 64 })
  const [shadowEnabled, setShadowEnabled] = useState(true)
  const [shadowColor, setShadowColor] = useState('#000000')
  const [shadowOpacity, setShadowOpacity] = useState(0.15)
  const [shadowBlur, setShadowBlur] = useState(24)
  const [shadowOffsetX, setShadowOffsetX] = useState(0)
  const [shadowOffsetY, setShadowOffsetY] = useState(4)
  const [showWindow, setShowWindow] = useState(true)
  const [windowStyle, setWindowStyle] = useState<WindowStyle>('regular')
  const [windowBarColor, setWindowBarColor] = useState<string>('#1f2937')
  const [cornerRadius, setCornerRadius] = useState(16)
  const [imageScale, setImageScale] = useState(1)
  const [targetWidth, setTargetWidth] = useState<number | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const [handlePos, setHandlePos] = useState<{ left: number; top: number }>({ left: 0, top: 0 })
  const [isResizing, setIsResizing] = useState(false)
  const [imageOffset, setImageOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  // Canvas base size independent of scale/target width
  const baseSizeRef = useRef<{ w: number; h: number } | null>(null)
  const layoutKeyRef = useRef<string>("")
  const [viewScale, setViewScale] = useState(1)
  const viewScaleRef = useRef(1)
  // Crop states
  const [cropRect, setCropRect] = useState<Rect | null>(null) // in source image pixels
  const [cropSelection, setCropSelection] = useState<Rect | null>(null) // in canvas pixels
  const [activeTool, setActiveTool] = useState<'none' | 'select' | 'crop' | 'text' | 'shape'>('select')
  const textArmedRef = useRef(false)
  const [activeShapeType, setActiveShapeType] = useState<ShapeType | null>(null)
  const [aspectLocked, setAspectLocked] = useState(false)
  const baseAspectRef = useRef(1)
  const [texts, setTexts] = useState<TextNode[]>([])
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null)
  const [shapes, setShapes] = useState<ShapeNode[]>([])
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null)
  const [isPlacingShape, setIsPlacingShape] = useState(false)
  const [keepPlacingShapes, setKeepPlacingShapes] = useState(true)
  const [snapToGrid, setSnapToGrid] = useState(false)
  const [contentLayout, setContentLayout] = useState<LayoutInfo | null>(null)
  const didAutoFitRef = useRef(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [exportSettings, setExportSettings] = useState<{ format: 'png' | 'jpeg'; quality: number; scale: number }>({ format: 'png', quality: 0.92, scale: 1 })
  // Preserve canvas size for layout; do not change on scale/targetWidth
  // (declared above)

  const windowBarHeights: Record<WindowStyle, number> = { regular: 44, notch: 44, title: 28 }
  const windowBar = windowStyle ? windowBarHeights[windowStyle] : 44
  // preview background now solid; checkerboard removed

  const BASE_CONTENT_WIDTH = 1280

  function applyTemplate(t: EditorTemplate) {
    // Frame
    setBgPreset(t.bg)
    setPadding({ x: t.padding.x, y: t.padding.y })
    setShowWindow(t.showWindow)
    setWindowStyle(t.windowStyle)
    setWindowBarColor(t.windowBarColor)
    setCornerRadius(t.cornerRadius)
    // Apply shadow settings from template
    setShadowEnabled(t.shadow !== 'off')
    setShadowOffsetX(0) // Always center horizontally
    if (t.shadow === 'subtle') {
      setShadowBlur(8)
      setShadowOffsetY(2)
      setShadowOpacity(0.1)
    } else if (t.shadow === 'medium') {
      setShadowBlur(16)
      setShadowOffsetY(4)
      setShadowOpacity(0.15)
    } else if (t.shadow === 'strong') {
      setShadowBlur(24)
      setShadowOffsetY(8)
      setShadowOpacity(0.2)
    }

    // Compute helpful layout numbers up front
    const tplWindowBar = t.windowStyle ? windowBarHeights[t.windowStyle] : 44
    const stageLeft = t.padding.x
    const stageTop = t.padding.y + (t.showWindow ? tplWindowBar : 0)

    // Compute planned source region and scaled preview size using template hints
    const srcW0 = img?.width ?? 1280
    const srcH0 = img?.height ?? 720
    let cropW = srcW0
    let cropH = srcH0
    if (t.cropAspect) {
      const a = t.cropAspect
      let w = srcW0
      let h = Math.round(srcW0 / a)
      if (h > srcH0) { h = srcH0; w = Math.round(srcH0 * a) }
      cropW = w; cropH = h
    }
    const scaledW0 = typeof t.targetWidth === 'number'
      ? Math.max(200, Math.round(t.targetWidth))
      : Math.max(200, Math.round((t.imageScale ?? 0.4) * cropW))
    const scaledH0 = Math.max(1, Math.round(cropH * (scaledW0 / Math.max(1, cropW))))
    // Content height for a canonical 1280 base width (used for anchoring to bottom)
    const contentHeightBase = Math.round(cropH * (BASE_CONTENT_WIDTH / Math.max(1, cropW)))

    // Constrain preview to fit inside content with margins
    const edgeMargin = 80
    const maxPreviewW = Math.max(200, BASE_CONTENT_WIDTH - edgeMargin * 2)
    const scaledW = Math.min(scaledW0, maxPreviewW)
    const scaledH = Math.max(1, Math.round(scaledH0 * (scaledW / scaledW0)))

    // Prepare text nodes and auto-avoid overlaps for stage-anchored tag/title/subtitle
    const preparedTexts = (t.texts ?? []).map((tx) => {
      // Enforce single-line for title/subtitle by normalizing any newlines to spaces
      const shouldSingleLine = tx.id === 'title' || tx.id === 'subtitle'
      const normalizedText = shouldSingleLine
        ? (tx.text || '').replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ').trim()
        : tx.text
      // Respect template positions exactly
      return { ...tx, text: normalizedText }
    })

    const estimateBlockH = (tx: TextNode) => {
      const lines = (tx.text || '').split(/\n/).length
      const lh = Math.round(Math.max(1, tx.fontSize) * 1.2)
      return Math.max(lh, lines * lh)
    }
    // Only adjust stage-anchored common ids in a predictable order
    const orderWeight = (id?: string) => id === 'tag' ? 0 : id === 'title' ? 1 : id === 'subtitle' ? 2 : 3
    const stageTexts = preparedTexts
      .filter(tx => (tx.positionAnchor ?? 'content') === 'stage')
      .slice()
      .sort((a, b) => orderWeight(a.id) - orderWeight(b.id) || a.y - b.y)

    let prevBottom = -Infinity
    const spaced: Record<string, number> = {}
    for (let i = 0; i < stageTexts.length; i++) {
      const tx = stageTexts[i]
      const h = estimateBlockH(tx)
      let gap = 16
      if (tx.id === 'title') gap = 24 // usually more space above title when following tag
      if (tx.id === 'subtitle') gap = 16
      const minY = prevBottom < 0 ? tx.y : prevBottom + gap
      const y = Math.max(tx.y, minY)
      spaced[tx.id] = y
      prevBottom = y + h
    }
    const adjustedTexts = preparedTexts.map((tx) => {
      if ((tx.positionAnchor ?? 'content') === 'stage' && spaced[tx.id] !== undefined) {
        return { ...tx, y: spaced[tx.id] }
      }
      return tx
    })

    setTexts(adjustedTexts)
    setSelectedTextId(adjustedTexts[0]?.id ?? null)
    const baseShapes = [...(t.shapes ?? [])]
    // Dim content layer for contrast if requested
    if (t.dimContent && t.dimContent > 0) {
      const alpha = Math.min(0.6, Math.max(0.01, t.dimContent))
      let overlayH = 720
      if (t.cropAspect) overlayH = Math.round(BASE_CONTENT_WIDTH / t.cropAspect)
      else if (img) overlayH = Math.round(img.height * (BASE_CONTENT_WIDTH / Math.max(1, img.width)))
      baseShapes.unshift({
        id: `dim-${Math.random().toString(36).slice(2)}`,
        type: 'rectangle',
        positionAnchor: 'content',
        x: 0,
        y: 0,
        w: BASE_CONTENT_WIDTH,
        h: overlayH,
        strokeColor: 'transparent',
        strokeWidth: 0,
        fill: true,
        fillColor: `rgba(0,0,0,${alpha})`,
        shadow: false,
      })
    }
    setShapes(baseShapes)
    setSelectedShapeId(null)
    setSelectedTemplateId(t.id)

    // Crop to aspect if defined
    if (t.cropAspect && img) {
      const srcW = img.width
      const srcH = img.height
      const targetA = t.cropAspect
      let w = srcW
      let h = Math.round(srcW / targetA)
      if (h > srcH) { h = srcH; w = Math.round(srcH * targetA) }
      const x = Math.round((srcW - w) / 2)
      const y = Math.round((srcH - h) / 2)
      setCropRect({ x, y, w, h })
    }

    // Optional image scale/width — set after we used hints for placement calculations
    if (typeof t.targetWidth === 'number') setTargetWidth(Math.max(200, Math.round(t.targetWidth)))
    if (typeof t.imageScale === 'number') setImageScale(t.imageScale)

    // Determine default image placement with presets; compute offsets relative to content origin
    let defaultOffsetX = t.imageOffsetX ?? 0
    let defaultOffsetY = t.imageOffsetY ?? 0
    if (t.layoutPreset) {
      const margin = edgeMargin
      let stageX = stageLeft
      let stageY = stageTop

      // Compute title/subtitle bottom to avoid collisions
      const title = adjustedTexts.find(tx => tx.id === 'title' && (tx.positionAnchor ?? 'content') === 'stage')
      const subtitle = adjustedTexts.find(tx => tx.id === 'subtitle' && (tx.positionAnchor ?? 'content') === 'stage')
      const lastTextBottom = (() => {
        const t1 = title ? title.y + estimateBlockH(title) : -Infinity
        const t2 = subtitle ? subtitle.y + estimateBlockH(subtitle) : -Infinity
        return Math.max(t1, t2)
      })()

      if (t.layoutPreset === 'bottom-center') {
        stageX = stageLeft + Math.round((BASE_CONTENT_WIDTH - scaledW) / 2)
        stageY = stageTop + Math.max(0, contentHeightBase - scaledH - 48)
        // Ensure the preview sits below last text block
        if (Number.isFinite(lastTextBottom)) stageY = Math.max(stageY, (lastTextBottom as number) + 64)
      } else if (t.layoutPreset === 'right-accent') {
        stageX = stageLeft + Math.max(0, BASE_CONTENT_WIDTH - scaledW - margin)
        stageY = stageTop + Math.round(contentHeightBase * 0.6 - scaledH / 2)
        if (Number.isFinite(lastTextBottom)) stageY = Math.max(stageY, lastTextBottom + 56)
      } else if (t.layoutPreset === 'right-below-title') {
        stageX = stageLeft + Math.max(0, BASE_CONTENT_WIDTH - scaledW - margin)
        stageY = stageTop + 160
        if (Number.isFinite(lastTextBottom)) stageY = Math.max(stageY, lastTextBottom + 64)
      } else if (t.layoutPreset === 'left-accent') {
        stageX = stageLeft + margin
        stageY = stageTop + Math.round(contentHeightBase * 0.6 - scaledH / 2)
      }

      // Nudge the screenshot a little lower for additional breathing room
      stageY += 16

      // Clamp inside content bounds with margins and enforce space below subtitle
      const minX = stageLeft + margin
      const maxX = stageLeft + BASE_CONTENT_WIDTH - margin - scaledW
      const desiredGapBelowText = 64
      const minYFromText = Number.isFinite(lastTextBottom)
        ? Math.max(stageTop + margin, (lastTextBottom as number) + desiredGapBelowText)
        : stageTop + margin
      const minY = minYFromText
      const maxY = stageTop + contentHeightBase - margin - scaledH
      stageX = Math.max(minX, Math.min(maxX, stageX))
      stageY = Math.max(minY, Math.min(maxY, stageY))

      defaultOffsetX = Math.round(stageX - stageLeft)
      defaultOffsetY = Math.round(stageY - stageTop)
    }

    setImageOffset({ x: defaultOffsetX, y: defaultOffsetY })
    setCropSelection(null)

    // Ensure the preview width we set does not exceed allowed max
    const finalTargetW = typeof t.targetWidth === 'number' ? Math.round(Math.min(t.targetWidth, maxPreviewW)) : Math.round(scaledW)
    if (typeof t.targetWidth === 'number') setTargetWidth(Math.max(200, finalTargetW))
    else setTargetWidth(Math.max(200, Math.round(scaledW)))
    if (typeof t.imageScale === 'number') setImageScale(t.imageScale)
  }

  // Track and revoke any created object URLs for web runtime
  const objectUrlRef = useRef<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isDraggingFile, setIsDraggingFile] = useState(false)

  const setImageFromBlob = (blob: Blob) => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    const url = URL.createObjectURL(blob)
    objectUrlRef.current = url
    setImageUrl(url)
  }
  useEffect(() => {
    if (isExtensionRuntime()) {
      const ch = getChromeSafe()
      ch?.storage?.local.get('latestCapture', (res) => {
        if (res?.latestCapture) setImageUrl(res.latestCapture as string)
      })
      return
    }
    // Web runtime: use provided initial image source if present
    if (props.initialImageSource) {
      if (typeof props.initialImageSource === 'string') {
        setImageUrl(props.initialImageSource)
      } else {
        const url = URL.createObjectURL(props.initialImageSource)
        objectUrlRef.current = url
        setImageUrl(url)
      }
    } else {
      setImageUrl(null)
    }
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.initialImageSource])

  const [img, setImg] = useState<HTMLImageElement | null>(null)
  useEffect(() => {
    if (!imageUrl) return setImg(null)
    const im = new Image()
    im.onload = () => setImg(im)
    im.src = imageUrl
  }, [imageUrl])

  useEffect(() => {
    if (!img) return
    const c = canvasRef.current!
    const ctx = c.getContext('2d')!

    // compute scaled image dimensions based on source crop or full image
    const srcW = cropRect ? cropRect.w : img.width
    const srcH = cropRect ? cropRect.h : img.height
    const scale = targetWidth ? Math.max(1, targetWidth) / srcW : imageScale
    const scaledW = Math.round(srcW * scale)
    const scaledH = Math.round(srcH * scale)

    const extraTop = showWindow ? windowBar : 0
    const stageHasOverlays = texts.some(t => (t.positionAnchor ?? 'content') === 'stage')
      || shapes.some(s => (s.positionAnchor ?? 'content') === 'stage')
    const baseWidth = stageHasOverlays ? BASE_CONTENT_WIDTH : Math.max(1, scaledW)
    const baseHeight = stageHasOverlays
      ? Math.round(srcH * (BASE_CONTENT_WIDTH / Math.max(1, srcW)))
      : Math.max(1, scaledH)
    const baseTotalW = Math.max(1, Math.round(baseWidth + padding.x * 2))
    const baseTotalH = Math.max(1, Math.round(baseHeight + padding.y * 2 + extraTop))

    const layoutKey = JSON.stringify({
      sw: showWindow,
      ws: windowStyle,
      wb: windowBar,
      cr: cornerRadius,
      px: padding.x,
      py: padding.y,
      iw: srcW,
      ih: srcH,
      tw: targetWidth ?? null,
      is: imageScale,
      ov: stageHasOverlays,
    })
    if (!baseSizeRef.current || layoutKeyRef.current !== layoutKey) {
      baseSizeRef.current = { w: baseTotalW, h: baseTotalH }
      layoutKeyRef.current = layoutKey
    }
    // HiDPI setup: size the backing store to device pixels, draw in CSS pixels
    const cssW = baseSizeRef.current.w
    const cssH = baseSizeRef.current.h
    const dpr = Math.max(1, Math.round(window.devicePixelRatio || 1))
    c.width = Math.max(1, Math.floor(cssW * dpr))
    c.height = Math.max(1, Math.floor(cssH * dpr))
    c.style.width = `${cssW}px`
    c.style.height = `${cssH}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // compute view scale to fit stage without scroll
    const stage = stageRef.current
    if (stage) {
      const sRect = stage.getBoundingClientRect()
      const margin = 48
      const maxW = Math.max(1, sRect.width - margin)
      const maxH = Math.max(1, sRect.height - margin)
      const vs = Math.min(1, maxW / cssW, maxH / cssH)
      setViewScale(vs)
      viewScaleRef.current = vs
    }

    // Clear
    ctx.clearRect(0, 0, cssW, cssH)

    // Render full composition using renderer
    const layout = renderComposition(ctx, cssW, cssH, {
      bgPreset,
      padding,
      shadowEnabled,
      shadowColor,
      shadowOpacity,
      shadowBlur,
      shadowOffsetX,
      shadowOffsetY,
      showWindow,
      windowStyle,
      windowBarColor,
      windowBar,
      cornerRadius,
      image: img,
      cropRect,
      scaledW,
      scaledH,
      offsetX: imageOffset.x,
      offsetY: imageOffset.y,
      shapes,
      texts: undefined,
    })
    setContentLayout(layout)

    // position resize handle at the screenshot's bottom-right corner (CSS pixels)
    queueMicrotask(() => {
      const stage = stageRef.current
      if (!stage || !c) return
      const sRect = stage.getBoundingClientRect()
      const cRect = c.getBoundingClientRect()
      const imgRight = (layout.contentX + layout.scaledW) * viewScaleRef.current
      const imgBottom = (layout.contentY + layout.scaledH) * viewScaleRef.current
      setHandlePos({
        left: cRect.left - sRect.left + imgRight,
        top: cRect.top - sRect.top + imgBottom,
      })
    })
  }, [img, bgPreset, padding, padding.x, padding.y, shadowEnabled, shadowColor, shadowOpacity, shadowBlur, shadowOffsetX, shadowOffsetY, showWindow, windowStyle, windowBarColor, windowBar, imageScale, targetWidth, cornerRadius, imageOffset.x, imageOffset.y, cropRect, cropRect?.x, cropRect?.y, cropRect?.w, cropRect?.h, texts, shapes])

  // Reset image offset when a new image loads
  useEffect(() => {
    setImageOffset({ x: 0, y: 0 })
    setCropRect(null)
    setCropSelection(null)
    didAutoFitRef.current = false
  }, [img])

  // Global key handlers for quick editing UX
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null
      const isTypingContext = !!activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.isContentEditable ||
        activeEl.getAttribute('data-editable') === 'true' ||
        activeEl.getAttribute('role') === 'textbox'
      )

      if (e.key === 'Escape') {
        // cancel current tool or clear selection
        if (activeTool === 'shape') {
          setActiveTool('select')
          setActiveShapeType(null)
        }
        setSelectedShapeId(null)
        setSelectedTextId(null)
        if (isTypingContext) activeEl?.blur()
      } else if ((e.key === 'Delete' || e.key === 'Backspace')) {
        if (isTypingContext) return
        if (selectedShapeId) {
          setShapes(ss => ss.filter(s => s.id !== selectedShapeId))
          setSelectedShapeId(null)
        } else if (selectedTextId) {
          setTexts(ts => ts.filter(t => t.id !== selectedTextId))
          setSelectedTextId(null)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeTool, selectedShapeId, selectedTextId])

  // Auto-fit the screenshot to the base content width on first load
  useEffect(() => {
    if (!img || didAutoFitRef.current) return
    const BASE_CONTENT_WIDTH = 1280
    const fit = Math.min(1, BASE_CONTENT_WIDTH / Math.max(1, img.width))
    setTargetWidth(null)
    setImageScale(fit)
    didAutoFitRef.current = true
  }, [img])

  const download = async () => {
    const c = canvasRef.current
    if (!c || !img || !baseSizeRef.current) return

    const cssW = baseSizeRef.current.w
    const cssH = baseSizeRef.current.h
    const multiplier = Math.max(0.5, Math.min(4, exportSettings.scale))
    const exportCanvas = document.createElement('canvas')
    exportCanvas.width = Math.max(1, Math.round(cssW * multiplier))
    exportCanvas.height = Math.max(1, Math.round(cssH * multiplier))
    const ctx = exportCanvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(multiplier, 0, 0, multiplier, 0, 0)

    const srcW = cropRect ? cropRect.w : img.width
    const srcH = cropRect ? cropRect.h : img.height
    const scale = targetWidth ? Math.max(1, targetWidth) / srcW : imageScale
    const scaledW = Math.round(srcW * scale)
    const scaledH = Math.round(srcH * scale)

    renderComposition(ctx, cssW, cssH, {
      bgPreset,
      padding,
      shadowEnabled,
      shadowColor,
      shadowOpacity,
      shadowBlur,
      shadowOffsetX,
      shadowOffsetY,
      showWindow,
      windowStyle,
      windowBarColor,
      windowBar,
      cornerRadius,
      image: img,
      cropRect,
      scaledW,
      scaledH,
      offsetX: imageOffset.x,
      offsetY: imageOffset.y,
      shapes,
      texts: texts.map(t => ({ ...t })),
    })

    const format = exportSettings.format === 'jpeg' ? 'image/jpeg' : 'image/png'
    const quality = exportSettings.format === 'jpeg'
      ? Math.min(1, Math.max(0.6, exportSettings.quality))
      : undefined
    const blob = await new Promise<Blob | null>((resolve) => {
      exportCanvas.toBlob((val) => resolve(val), format, quality)
    })
    if (!blob) return

    const fileName = `screenshot.${exportSettings.format === 'jpeg' ? 'jpg' : 'png'}`
    const ch = getChromeSafe()
    if (ch?.downloads?.download) {
      const url = URL.createObjectURL(blob)
      ch.downloads.download({ url, filename: fileName })
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
      return
    }
    // Web fallback: trigger a download via anchor element
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <div className="text-sm text-muted-foreground">Editor</div>
          <TemplatesDropdown
            templates={TEMPLATES}
            value={selectedTemplateId}
            onChange={(id) => {
              const tpl = TEMPLATES.find(t => t.id === id)
              if (tpl) applyTemplate(tpl)
            }}
          />
          {selectedTemplateId && (
            <TemplateProperties
              texts={texts}
              onChangeText={(id, patch) => setTexts(ts => ts.map(t => t.id === id ? { ...t, ...patch } : t))}
            />
          )}
          <Toolbar
            activeTool={activeTool}
            onToggleCrop={() => {
              if (activeTool === 'crop') { setActiveTool('none'); setCropSelection(null) }
              else setActiveTool('crop')
            }}
            onApplyCrop={() => {
              if (!img || !cropSelection) return
              const extraTop = showWindow ? windowBar : 0
              const srcW = cropRect ? cropRect.w : img.width
              const srcH = cropRect ? cropRect.h : img.height
              const scale = targetWidth ? Math.max(1, targetWidth) / srcW : imageScale
              const contentX = padding.x + imageOffset.x
              const contentY = padding.y + extraTop + imageOffset.y
              const sx = Math.max(0, Math.round((cropSelection.x - contentX) / Math.max(1e-6, scale)))
              const sy = Math.max(0, Math.round((cropSelection.y - contentY) / Math.max(1e-6, scale)))
              const sw = Math.min(srcW, Math.round(cropSelection.w / Math.max(1e-6, scale)))
              const sh = Math.min(srcH, Math.round(cropSelection.h / Math.max(1e-6, scale)))
              setCropRect({ x: sx, y: sy, w: Math.max(1, sw), h: Math.max(1, sh) })
              setActiveTool('none')
              setCropSelection(null)
            }}
            onCancelCrop={() => { setActiveTool('none'); setCropSelection(null) }}
            cropEnabled={!!cropSelection}
            aspectLocked={aspectLocked}
            onToggleAspect={() => setAspectLocked(v => !v)}
            onToggleText={() => {
              setActiveTool(t => {
                const next = (t === 'text' ? 'none' : 'text')
                textArmedRef.current = next === 'text'
                return next
              })
            }}
            onToggleSelect={() => setActiveTool('select')}
            onChooseShape={(type) => { setActiveTool('shape'); setActiveShapeType(type) }}
            keepPlacingShapes={keepPlacingShapes}
            onToggleKeepPlacingShapes={() => setKeepPlacingShapes(v => !v)}
            snapToGrid={snapToGrid}
            onToggleSnapToGrid={() => setSnapToGrid(v => !v)}
          />
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <SidebarTrigger className="-mr-1 rotate-180" />
          </div>
        </header>
        <div
          ref={stageRef}
          className="relative flex flex-1 items-center justify-center bg-neutral-900 select-none overflow-hidden"
          onDragOver={(e) => {
            if (!isExtensionRuntime()) { e.preventDefault(); setIsDraggingFile(true) }
          }}
          onDragLeave={() => { if (!isExtensionRuntime()) setIsDraggingFile(false) }}
          onDrop={(e) => {
            if (!isExtensionRuntime()) {
              e.preventDefault()
              setIsDraggingFile(false)
              const file = e.dataTransfer?.files?.[0]
              if (file && file.type.startsWith('image/')) setImageFromBlob(file)
            }
          }}
        >
          {imageUrl ? (
            <>
              <canvas
                ref={canvasRef}
                style={{ cursor: activeTool === 'crop' ? 'crosshair' : activeTool === 'text' ? 'text' : isDragging ? 'grabbing' : 'grab', transform: `scale(${viewScale})` }}
                onPointerDown={(e) => {
                  // Begin drag to reposition the screenshot (avoid if starting on handle)
                  if (!(e.target instanceof HTMLCanvasElement)) return
                  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
                  const c = canvasRef.current!
                  const rect = c.getBoundingClientRect()
                  const startCX = (e.clientX - rect.left) / viewScaleRef.current
                  const startCY = (e.clientY - rect.top) / viewScaleRef.current
                  // helper: current content rect (window content area)
                  const srcW = cropRect ? cropRect.w : img!.width
                  const srcH = cropRect ? cropRect.h : img!.height
                  const scale = targetWidth ? Math.max(1, targetWidth) / srcW : imageScale
                  const extraTop = showWindow ? windowBar : 0
                  const contentX = padding.x + imageOffset.x
                  const contentY = padding.y + extraTop + imageOffset.y
                  const contentRect = { x: contentX, y: contentY, w: Math.round(srcW * scale), h: Math.round(srcH * scale) }
                  // Clicking canvas (outside overlays) clears selections
                  setSelectedTextId(null)
                  setSelectedShapeId(null)
                  if (activeTool === 'crop') {
                    // start drawing crop selection
                    // clamp start inside content rect
                    const sx = Math.max(contentRect.x, Math.min(startCX, contentRect.x + contentRect.w))
                    const sy = Math.max(contentRect.y, Math.min(startCY, contentRect.y + contentRect.h))
                    setCropSelection({ x: sx, y: sy, w: 0, h: 0 })
                    baseAspectRef.current = srcW / Math.max(1, srcH)
                    const move = (ev: PointerEvent) => {
                      const cx0 = (ev.clientX - rect.left) / viewScaleRef.current
                      const cy0 = (ev.clientY - rect.top) / viewScaleRef.current
                      const cx = Math.max(contentRect.x, Math.min(cx0, contentRect.x + contentRect.w))
                      const cy = Math.max(contentRect.y, Math.min(cy0, contentRect.y + contentRect.h))
                      let x = Math.min(startCX, cx)
                      let y = Math.min(startCY, cy)
                      let w = Math.abs(cx - startCX)
                      let h = Math.abs(cy - startCY)
                      if (aspectLocked) {
                        const target = baseAspectRef.current
                        if (w / Math.max(1, h) > target) {
                          h = Math.round(w / target)
                          if (cy < startCY) y = startCY - h
                        } else {
                          w = Math.round(h * target)
                          if (cx < startCX) x = startCX - w
                        }
                      }
                      setCropSelection({ x, y, w, h })
                    }
                    const up = () => {
                      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
                      window.removeEventListener('pointermove', move)
                      window.removeEventListener('pointerup', up)
                    }
                    window.addEventListener('pointermove', move)
                    window.addEventListener('pointerup', up)
                  } else if (activeTool === 'shape' && activeShapeType) {
                    // start drawing a shape anchored to content
                    setIsPlacingShape(true)
                    const id = Math.random().toString(36).slice(2)
                    // convert start to content-relative coords
                    const startXContent = startCX - contentX
                    const startYContent = startCY - contentY
                    const newShape: ShapeNode = {
                      id,
                      type: activeShapeType,
                      positionAnchor: 'content',
                      x: startXContent,
                      y: startYContent,
                      w: 0,
                      h: 0,
                      strokeColor: '#ef4444',
                      strokeWidth: 3,
                      fill: false,
                      fillColor: '#00000000',
                      arrowHeadSize: 12,
                      rotation: 0,
                    }
                    setShapes(prev => [...prev, newShape])
                    setSelectedShapeId(id)
                    const GRID = 8
                    const snap = (v: number) => (snapToGrid ? Math.round(v / GRID) * GRID : v)
                    const move = (ev: PointerEvent) => {
                      const cx = (ev.clientX - rect.left) / viewScaleRef.current
                      const cy = (ev.clientY - rect.top) / viewScaleRef.current
                      let dx = (cx - startCX)
                      let dy = (cy - startCY)
                      let x = dx >= 0 ? startXContent : startXContent + dx
                      let y = dy >= 0 ? startYContent : startYContent + dy
                      let w = Math.abs(dx)
                      let h = Math.abs(dy)

                      if (ev.shiftKey) {
                        if (activeShapeType === 'rectangle' || activeShapeType === 'circle' || activeShapeType === 'triangle') {
                          const size = Math.max(w, h)
                          w = size
                          h = size
                          x = (cx >= startCX) ? startXContent : startXContent - w
                          y = (cy >= startCY) ? startYContent : startYContent - h
                        } else if (activeShapeType === 'line' || activeShapeType === 'arrow') {
                          const len = Math.hypot(dx, dy)
                          if (len > 0) {
                            const ang = Math.atan2(dy, dx)
                            const snapAng = Math.round(ang / (Math.PI / 4)) * (Math.PI / 4)
                            dx = Math.cos(snapAng) * len
                            dy = Math.sin(snapAng) * len
                            x = dx >= 0 ? startXContent : startXContent + dx
                            y = dy >= 0 ? startYContent : startYContent + dy
                            w = Math.abs(dx)
                            h = Math.abs(dy)
                          }
                        }
                      }

                      setShapes(prev => prev.map(s => s.id === id ? {
                        ...s,
                        x: snap(x),
                        y: snap(y),
                        w: snap(w),
                        h: snap(h),
                      } : s))
                    }
                    const up = () => {
                      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
                      window.removeEventListener('pointermove', move)
                      window.removeEventListener('pointerup', up)
                      setIsPlacingShape(false)
                      if (!keepPlacingShapes) {
                        setActiveTool('select')
                        setActiveShapeType(null)
                      }
                    }
                    window.addEventListener('pointermove', move)
                    window.addEventListener('pointerup', up)
                  } else if (activeTool === 'text' && textArmedRef.current) {
                    // create a new text node where clicked
                    const id = Math.random().toString(36).slice(2)
                    const defaultText: TextNode = {
                      id,
                      // Anchor to content area so text moves with screenshot unless user chooses stage
                      positionAnchor: 'content',
                      x: startCX - (padding.x + imageOffset.x),
                      y: startCY - (padding.y + (showWindow ? windowBar : 0) + imageOffset.y),
                      text: 'Edit me',
                      fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
                      fontSize: 24,
                      bold: false,
                      italic: false,
                      align: 'left',
                      fillType: 'solid',
                      color: '#ffffff',
                      outline: false,
                      outlineColor: '#000000',
                      outlineWidth: 0,
                      background: true,
                      backgroundType: 'linear',
                      backgroundColor: '#111827',
                      backgroundColor2: '#374151',
                      backgroundAngle: 90,
                      backgroundAlpha: 0.9,
                      backgroundPaddingX: 8,
                      backgroundPaddingY: 4,
                      backgroundRadius: 8,
                      shadow: false,
                      shadowColor: '#000000',
                      shadowAlpha: 0.5,
                      shadowBlur: 8,
                      shadowOffsetX: 0,
                      shadowOffsetY: 2,
                    }
                    setTexts((arr) => [...arr, defaultText])
                    setSelectedTextId(id)
                    // Disarm text tool until user toggles it again
                    textArmedRef.current = false
                  } else {
                    setIsDragging(true)
                    const start = { ...imageOffset }
                    const move = (ev: PointerEvent) => {
                      const dx = (ev.clientX - e.clientX) / viewScaleRef.current
                      const dy = (ev.clientY - e.clientY) / viewScaleRef.current
                      setImageOffset({ x: start.x + dx, y: start.y + dy })
                    }
                    const up = () => {
                      setIsDragging(false)
                      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
                      window.removeEventListener('pointermove', move)
                      window.removeEventListener('pointerup', up)
                    }
                    window.addEventListener('pointermove', move)
                    window.addEventListener('pointerup', up)
                  }
                }}
              />
              {activeTool === 'crop' && img && cropSelection && (() => {
                const extraTop = showWindow ? windowBar : 0
                const srcW = cropRect ? cropRect.w : img.width
                const srcH = cropRect ? cropRect.h : img.height
                const scale = targetWidth ? Math.max(1, targetWidth) / srcW : imageScale
                const contentX = (contentLayout?.contentX ?? (padding.x + imageOffset.x))
                const contentY = (contentLayout?.contentY ?? (padding.y + extraTop + imageOffset.y))
                const contentRect = { x: contentX, y: contentY, w: Math.round(srcW * scale), h: Math.round(srcH * scale) }
                return (
                  <CropOverlay
                    canvas={canvasRef.current}
                    stage={stageRef.current}
                    selection={cropSelection}
                    setSelection={(r) => setCropSelection(r)}
                    bounds={contentRect}
                    aspectLocked={aspectLocked}
                    baseAspect={baseAspectRef.current}
                    scale={viewScale}
                  />
                )
              })()}
              {/* Text overlays */}
              {!!texts.length && contentLayout && (
                <TextOverlay
                  canvas={canvasRef.current}
                  stage={stageRef.current}
                  scale={viewScale}
                  texts={texts}
                  selectedId={selectedTextId}
                  onSelect={setSelectedTextId}
                  onChange={(id, patch) => setTexts(ts => ts.map(t => t.id === id ? { ...t, ...patch } : t))}
                  onCreate={(x, y) => {
                    const id = Math.random().toString(36).slice(2)
                    setTexts(ts => [...ts, { id, x, y, text: 'Text', fontFamily: 'Inter, system-ui, Arial, sans-serif', fontSize: 24, bold: false, italic: false, align: 'left', color: '#ffffff', outline: true, outlineColor: '#000000', outlineWidth: 2, background: false, backgroundColor: '#000000', backgroundAlpha: 0.65, backgroundPaddingX: 6, backgroundPaddingY: 2, backgroundRadius: 6, shadow: false, shadowColor: '#000000', shadowAlpha: 0.5, shadowBlur: 8, shadowOffsetX: 0, shadowOffsetY: 2 }])
                    setSelectedTextId(id)
                  }}
                  // supply bounds so overlay can add content origin
                  contentOrigin={{ x: contentLayout.contentX, y: contentLayout.contentY }}
                />
              )}
              {/* Shape overlays */}
              {!!shapes.length && contentLayout && (
                <div style={{ pointerEvents: activeTool === 'crop' ? 'none' : 'auto' }}>
                  <ShapesOverlay
                    canvas={canvasRef.current}
                    stage={stageRef.current}
                    scale={viewScale}
                    shapes={shapes}
                    selectedId={selectedShapeId}
                    onSelect={setSelectedShapeId}
                    onChange={(id, patch) => setShapes(ss => ss.map(s => s.id === id ? { ...s, ...patch } : s))}
                    onRemove={(id) => { setShapes(ss => ss.filter(s => s.id !== id)); if (selectedShapeId === id) setSelectedShapeId(null) }}
                    snapToGrid={snapToGrid}
                    contentOrigin={{ x: contentLayout.contentX, y: contentLayout.contentY }}
                  />
                </div>
              )}
              {/* Floating Text Toolbar */}
              {selectedTextId && (() => {
                const selectedText = texts.find(t => t.id === selectedTextId)
                if (!selectedText) return null

                const stage = stageRef.current
                if (!stage) return null
                const wrapper = stage.querySelector(`[data-text-id="${selectedTextId}"]`) as HTMLElement | null
                if (!wrapper) return null

                const sRect = stage.getBoundingClientRect()
                const wRect = wrapper.getBoundingClientRect()

                // Prefer placing 8px above; if too close to top, place 8px below
                const centerX = wRect.left - sRect.left + wRect.width / 2
                const aboveY = wRect.top - sRect.top - 8
                const belowY = wRect.bottom - sRect.top + 8
                const y = (wRect.top - sRect.top > 80) ? aboveY : belowY

                return (
                  <FloatingTextToolbar
                    value={selectedText}
                    onChange={(patch) => {
                      setTexts(ts => ts.map(t => t.id === selectedTextId ? { ...t, ...patch } : t))
                    }}
                    onRemove={() => {
                      setTexts(ts => ts.filter(t => t.id !== selectedTextId))
                      setSelectedTextId(null)
                    }}
                    position={{ x: centerX, y }}
                  />
                )
              })()}
              {/* Floating Shape Toolbar */}
              {selectedShapeId && !isPlacingShape && (() => {
                const selectedShape = shapes.find(s => s.id === selectedShapeId)
                if (!selectedShape || !contentLayout) return null
                const sRect = stageRef.current!.getBoundingClientRect()
                const cRect = canvasRef.current!.getBoundingClientRect()
                const baseLeft = cRect.left - sRect.left
                const baseTop = cRect.top - sRect.top
                const originX = (selectedShape.positionAnchor ?? 'content') === 'content' ? contentLayout.contentX : 0
                const originY = (selectedShape.positionAnchor ?? 'content') === 'content' ? contentLayout.contentY : 0
                const normLeft = Math.min(selectedShape.x, selectedShape.x + selectedShape.w)
                const normTop = Math.min(selectedShape.y, selectedShape.y + selectedShape.h)
                const normW = Math.abs(selectedShape.w)
                const normH = Math.abs(selectedShape.h)
                const left = baseLeft + (originX + normLeft + normW / 2) * viewScale
                const top = baseTop + (originY + normTop) * viewScale
                const y = (top - 8 > 80) ? top - 8 : top + Math.max(24, normH * viewScale) + 8
                return (
                  <FloatingShapeToolbar
                    value={selectedShape}
                    onChange={(patch) => setShapes(ss => ss.map(s => s.id === selectedShapeId ? { ...s, ...patch } : s))}
                    onRemove={() => { setShapes(ss => ss.filter(s => s.id !== selectedShapeId)); setSelectedShapeId(null) }}
                    position={{ x: left, y }}
                  />
                )
              })()}
              {/* drag handle */}
              {img && (
                <div
                  onPointerDown={(e) => {
                    e.stopPropagation()
                    if (!img) return
                    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
                    setIsResizing(true)
                    const startX = e.clientX
                    const srcW = cropRect ? cropRect.w : img.width
                    const scale = targetWidth ? Math.max(1, targetWidth) / srcW : imageScale
                    const startW = Math.round(srcW * scale)
                    const move = (ev: PointerEvent) => {
                      const dx = ev.clientX - startX
                      const newW = Math.max(50, startW + dx)
                      setTargetWidth(newW)
                    }
                    const up = () => {
                      setIsResizing(false)
                      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
                      window.removeEventListener('pointermove', move)
                      window.removeEventListener('pointerup', up)
                    }
                    window.addEventListener('pointermove', move)
                    window.addEventListener('pointerup', up)
                  }}
                  style={{ left: handlePos.left, top: handlePos.top, transform: 'translate(-50%, -50%)' }}
                  className={`absolute z-10 h-4 w-4 rounded-full border border-white/70 bg-blue-500 shadow ${isResizing ? 'scale-110' : ''}`}
                  title="Drag to resize"
                />
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-neutral-400 text-center">
                <div className="mb-4">{isExtensionRuntime() ? 'No capture found. Use the popup to capture.' : 'Drop an image here or upload from your device to start in Beveled'}</div>
                {!isExtensionRuntime() && (
                  <>
                    <button
                      className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Upload image
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f && f.type.startsWith('image/')) setImageFromBlob(f)
                      }}
                    />
                  </>
                )}
              </div>
              {isDraggingFile && !isExtensionRuntime() && (
                <div className="absolute inset-4 rounded-xl border-2 border-dashed border-blue-500/70"></div>
              )}
            </div>
          )}
        </div>
      </SidebarInset>
      <AppSidebar
        side="right"
        solidPresets={SOLID_PRESETS}
        gradientPresets={GRADIENT_PRESETS}
        defaultPattern={{ type: 'pattern', name: 'dots', fg: '#00000010', bg: '#ffffff', scale: 24 }}
        bgPreset={bgPreset}
        setBgPreset={setBgPreset}
        padding={padding}
        setPadding={(fn) => setPadding((p) => fn(p))}
        windowStyle={windowStyle}
        setWindowStyle={setWindowStyle}
        windowBarColor={windowBarColor}
        setWindowBarColor={setWindowBarColor}
        showWindow={showWindow}
        setShowWindow={setShowWindow}
        shadowEnabled={shadowEnabled}
        setShadowEnabled={setShadowEnabled}
        shadowColor={shadowColor}
        setShadowColor={setShadowColor}
        shadowOpacity={shadowOpacity}
        setShadowOpacity={setShadowOpacity}
        shadowBlur={shadowBlur}
        setShadowBlur={setShadowBlur}
        shadowOffsetX={shadowOffsetX}
        setShadowOffsetX={setShadowOffsetX}
        shadowOffsetY={shadowOffsetY}
        setShadowOffsetY={setShadowOffsetY}
        cornerRadius={cornerRadius}
        setCornerRadius={setCornerRadius}
        imageScale={imageScale}
        setImageScale={setImageScale}
        targetWidth={targetWidth}
        setTargetWidth={setTargetWidth}
        onDownload={download}
        exportSettings={exportSettings}
        onChangeExportSettings={(patch) => setExportSettings((prev) => ({ ...prev, ...patch }))}
      />
    </SidebarProvider>
  )
}

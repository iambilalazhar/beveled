import { useEffect, useRef, useState } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'
import { AppSidebar, type BgPreset, type LinearGradient, type WindowStyle, type ShadowStrength } from '@/components/app-sidebar'
import { renderComposition } from './renderer'
import type { LayoutInfo } from './renderer'

import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
// Toolbar buttons are encapsulated in Toolbar component
import { Toolbar } from './Toolbar'
import { CropOverlay } from './CropOverlay'
import { TextInspector } from './TextInspector'
import type { Rect, TextNode } from './types'
import { TextOverlay } from './TextOverlay'

type Padding = { x: number; y: number }

export default function Editor() {

  const SOLID_PRESETS: string[] = [
    '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', '#0f172a', '#111827',
    '#1d4ed8', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#f472b6', '#00000000'
  ]
  const GRADIENT_PRESETS: LinearGradient[] = [
    { type: 'linear', angle: 45, stops: [ { color: '#ff7e5f', pos: 0 }, { color: '#feb47b', pos: 1 } ] },
    { type: 'linear', angle: 45, stops: [ { color: '#00c6ff', pos: 0 }, { color: '#0072ff', pos: 1 } ] },
    { type: 'linear', angle: 45, stops: [ { color: '#a18cd1', pos: 0 }, { color: '#fbc2eb', pos: 1 } ] },
    { type: 'linear', angle: 45, stops: [ { color: '#34d399', pos: 0 }, { color: '#06b6d4', pos: 1 } ] },
    { type: 'linear', angle: 60, stops: [ { color: '#f472b6', pos: 0 }, { color: '#8b5cf6', pos: 1 } ] },
    { type: 'linear', angle: 120, stops: [ { color: '#f59e0b', pos: 0 }, { color: '#ef4444', pos: 1 } ] },
  ]

  const [bgPreset, setBgPreset] = useState<BgPreset>({ type: 'solid', color: '#ffffff' })
  const [padding, setPadding] = useState<Padding>({ x: 64, y: 64 })
  const [shadowStrength, setShadowStrength] = useState<ShadowStrength>('medium')
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
  const [activeTool, setActiveTool] = useState<'none' | 'crop' | 'text'>('none')
  const [aspectLocked, setAspectLocked] = useState(false)
  const baseAspectRef = useRef(1)
  const [texts, setTexts] = useState<TextNode[]>([])
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null)
  const [contentLayout, setContentLayout] = useState<LayoutInfo | null>(null)
  const didAutoFitRef = useRef(false)
  // Preserve canvas size for layout; do not change on scale/targetWidth
  // (declared above)

  const windowBarHeights: Record<WindowStyle, number> = { regular: 44, notch: 44, title: 28 }
  const windowBar = windowStyle ? windowBarHeights[windowStyle] : 44
  // preview background now solid; checkerboard removed

  useEffect(() => {
    chrome.storage.local.get('latestCapture', (res) => {
      if (res?.latestCapture) setImageUrl(res.latestCapture as string)
    })
  }, [])

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
    // Fixed canvas width baseline (keeps UI consistent), height follows ORIGINAL image aspect only
    const BASE_CONTENT_WIDTH = 1280
    const layoutKey = JSON.stringify({
      sw: showWindow,
      ws: windowStyle,
      wb: windowBar,
      cr: cornerRadius,
      px: padding.x,
      py: padding.y,
      iw: img.width,
      ih: img.height,
    })
    if (!baseSizeRef.current || layoutKeyRef.current !== layoutKey) {
      const baseScaledW = BASE_CONTENT_WIDTH
      const baseScaledH = Math.round(img.height * (BASE_CONTENT_WIDTH / Math.max(1, img.width)))
      const baseTotalW = baseScaledW + padding.x * 2
      const baseTotalH = baseScaledH + padding.y * 2 + extraTop
      baseSizeRef.current = { w: Math.max(1, baseTotalW), h: Math.max(1, baseTotalH) }
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
      shadowStrength,
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
      texts: texts.map(t => ({ ...t })),
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
  }, [img, bgPreset, padding.x, padding.y, shadowStrength, showWindow, windowStyle, windowBarColor, imageScale, targetWidth, cornerRadius, imageOffset.x, imageOffset.y, cropRect?.x, cropRect?.y, cropRect?.w, cropRect?.h])

  // Reset image offset when a new image loads
  useEffect(() => {
    setImageOffset({ x: 0, y: 0 })
    setCropRect(null)
    setCropSelection(null)
    didAutoFitRef.current = false
  }, [img])

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
    if (!c) return
    c.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      chrome.downloads.download({ url, filename: 'screenshot.png' })
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
    })
  }

  return (
    <SidebarProvider>
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <div className="text-sm text-muted-foreground">Editor</div>
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
            onToggleText={() => setActiveTool(t => (t === 'text' ? 'none' : 'text'))}
          />
          <TextInspector
            value={texts.find(t => t.id === selectedTextId) ?? null}
            onChange={(patch) => {
              if (!selectedTextId) return
              setTexts(ts => ts.map(t => t.id === selectedTextId ? { ...t, ...patch } : t))
            }}
            onRemove={() => {
              if (!selectedTextId) return
              setTexts(ts => ts.filter(t => t.id !== selectedTextId))
              setSelectedTextId(null)
            }}
          />
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <SidebarTrigger className="-mr-1 rotate-180" />
          </div>
        </header>
        <div ref={stageRef} className="relative flex flex-1 items-center justify-center bg-neutral-900 select-none overflow-hidden">
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
                  } else if (activeTool === 'text') {
                    // create a new text node where clicked
                    const id = Math.random().toString(36).slice(2)
                    const defaultText: TextNode = {
                      id,
                      x: startCX - (padding.x + imageOffset.x),
                      y: startCY - (padding.y + (showWindow ? windowBar : 0) + imageOffset.y),
                      text: 'Edit me',
                      fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
                      fontSize: 24,
                      bold: false,
                      italic: false,
                      align: 'left',
                      color: '#ffffff',
                      outline: true,
                      outlineColor: '#000000',
                      outlineWidth: 2,
                    }
                    setTexts((arr) => [...arr, defaultText])
                    setSelectedTextId(id)
                    // Exit text tool so subsequent clicks don't create more text
                    setActiveTool('none')
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
                    setTexts(ts => [...ts, { id, x, y, text: 'Text', fontFamily: 'Inter, system-ui, Arial, sans-serif', fontSize: 24, bold: false, italic: false, align: 'left', color: '#ffffff', outline: true, outlineColor: '#000000', outlineWidth: 2 }])
                    setSelectedTextId(id)
                  }}
                  // supply bounds so overlay can add content origin
                  contentOrigin={{ x: contentLayout.contentX, y: contentLayout.contentY }}
                />
              )}
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
                    const up = (_ev: PointerEvent) => {
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
            <div className="text-neutral-500">No capture found. Use the popup to capture.</div>
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
        shadowStrength={shadowStrength}
        setShadowStrength={setShadowStrength}
        cornerRadius={cornerRadius}
        setCornerRadius={setCornerRadius}
        imageScale={imageScale}
        setImageScale={setImageScale}
        targetWidth={targetWidth}
        setTargetWidth={setTargetWidth}
        onDownload={download}
      />
    </SidebarProvider>
  )
}

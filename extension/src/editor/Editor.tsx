import { useEffect, useRef, useState } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'
import { AppSidebar, type BgPreset, type LinearGradient, type WindowStyle, type ShadowStrength, type Pattern } from '@/components/app-sidebar'
import { drawRoundedRect, clipRect } from './canvas-utils'

import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Crop, Type as TypeIcon, Square, Circle } from 'lucide-react'

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
  // Crop states
  type Rect = { x: number; y: number; w: number; h: number }
  const [cropRect, setCropRect] = useState<Rect | null>(null) // in source image pixels
  const [cropSelection, setCropSelection] = useState<Rect | null>(null) // in canvas pixels
  const [activeTool, setActiveTool] = useState<'none' | 'crop'>('none')
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

    // Clear
    ctx.clearRect(0, 0, cssW, cssH)

    // Background (solid | linear | pattern)
    if (bgPreset.type === 'solid') {
      ctx.fillStyle = bgPreset.color
      ctx.fillRect(0, 0, cssW, cssH)
    } else if (bgPreset.type === 'linear') {
      const angleRad = (bgPreset.angle * Math.PI) / 180
      const cx = cssW / 2
      const cy = cssH / 2
      const r = Math.max(cssW, cssH)
      const dx = Math.cos(angleRad)
      const dy = Math.sin(angleRad)
      const g = ctx.createLinearGradient(cx - dx * r, cy - dy * r, cx + dx * r, cy + dy * r)
      for (const s of bgPreset.stops) g.addColorStop(Math.min(1, Math.max(0, s.pos)), s.color)
      ctx.fillStyle = g
      ctx.fillRect(0, 0, cssW, cssH)
    } else {
      const p = bgPreset as Pattern
      const tile = document.createElement('canvas')
      const t = Math.max(8, Math.min(128, Math.floor(p.scale)))
      tile.width = t
      tile.height = t
      const tctx = tile.getContext('2d')!
      tctx.fillStyle = p.bg
      tctx.fillRect(0, 0, t, t)
      tctx.fillStyle = p.fg
      tctx.strokeStyle = p.fg
      tctx.lineWidth = Math.max(1, Math.round(t * 0.06))
      switch (p.name) {
        case 'dots': {
          const rdot = Math.max(1, Math.round(t * 0.12))
          tctx.beginPath()
          tctx.arc(t / 2, t / 2, rdot, 0, Math.PI * 2)
          tctx.fill()
          break
        }
        case 'grid': {
          tctx.beginPath()
          tctx.moveTo(0, 0)
          tctx.lineTo(0, t)
          tctx.moveTo(0, 0)
          tctx.lineTo(t, 0)
          tctx.stroke()
          break
        }
        case 'diagonal': {
          tctx.beginPath()
          tctx.moveTo(0, t)
          tctx.lineTo(t, 0)
          tctx.stroke()
          break
        }
        case 'wave': {
          const amp = t * 0.15
          const period = t
          tctx.beginPath()
          for (let x = 0; x <= t; x++) {
            const y = t / 2 + Math.sin((x / period) * 2 * Math.PI) * amp
            if (x === 0) tctx.moveTo(x, y)
            else tctx.lineTo(x, y)
          }
          tctx.stroke()
          break
        }
        case 'icons': {
          const s = Math.round(t * 0.3)
          const r = Math.round(s * 0.25)
          tctx.beginPath()
          tctx.moveTo(r, 0)
          tctx.arcTo(s, 0, s, s, r)
          tctx.arcTo(s, s, 0, s, r)
          tctx.arcTo(0, s, 0, 0, r)
          tctx.arcTo(0, 0, s, 0, r)
          tctx.closePath()
          tctx.fill()
          break
        }
      }
      const pattern = ctx.createPattern(tile, 'repeat')!
      ctx.fillStyle = pattern as any
      ctx.fillRect(0, 0, c.width, c.height)
    }

    const contentX = padding.x + imageOffset.x
    const contentY = padding.y + extraTop + imageOffset.y

    // Window frame + shadow and content clipping
    if (showWindow) {
      const winX = padding.x + imageOffset.x
      const winY = padding.y + imageOffset.y
      const winW = scaledW
      const winH = scaledH + windowBar
      if (shadowStrength !== 'off') {
        ctx.save()
        const config: Record<ShadowStrength, { blur: number; offsetY: number; alpha: number }> = {
          off: { blur: 0, offsetY: 0, alpha: 0 },
          subtle: { blur: 12, offsetY: 4, alpha: 0.12 },
          medium: { blur: 28, offsetY: 8, alpha: 0.18 },
          strong: { blur: 48, offsetY: 16, alpha: 0.25 },
        }
        const s = config[shadowStrength]
        ctx.shadowColor = `rgba(0,0,0,${s.alpha})`
        ctx.shadowBlur = s.blur
        ctx.shadowOffsetY = s.offsetY
        drawRoundedRect(ctx, winX, winY, winW, winH, cornerRadius)
        ctx.fillStyle = '#ffffff'
        ctx.fill()
        ctx.restore()
      }
      ctx.save()
      drawRoundedRect(ctx, winX, winY, winW, winH, cornerRadius)
      ctx.clip()
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(winX, winY, winW, winH)
      // Title bar
      ctx.fillStyle = windowBarColor
      ctx.fillRect(winX, winY, winW, windowBar)
      // Traffic lights (hidden for title-only minimal style)
      if (windowStyle !== 'title') {
        const tlY = winY + windowBar / 2
        const tlXs = [winX + 18, winX + 42, winX + 66]
        const colors = ['#ff5f57', '#febc2e', '#28c840']
        tlXs.forEach((x, i) => {
          ctx.beginPath()
          ctx.fillStyle = colors[i]
          ctx.arc(x, tlY, 6, 0, Math.PI * 2)
          ctx.fill()
        })
      }

      // Optional notch style
      if (windowStyle === 'notch') {
        ctx.save()
        ctx.fillStyle = windowBarColor
        const notchW = Math.min(180, winW * 0.25)
        const notchH = 18
        const notchR = 8
        const nx = winX + winW / 2 - notchW / 2
        const ny = winY + windowBar - notchH
        drawRoundedRect(ctx, nx, ny, notchW, notchH, notchR)
        ctx.fill()
        ctx.restore()
      }
      ctx.restore()
    }

    // Screenshot image
    ctx.save()
    // Clip strictly to the content area (below the window bar) so the bar never overlays the image.
    if (showWindow) {
      clipRect(ctx, contentX, contentY, scaledW, scaledH)
    }
    const sx = cropRect ? cropRect.x : 0
    const sy = cropRect ? cropRect.y : 0
    const sw = cropRect ? cropRect.w : img.width
    const sh = cropRect ? cropRect.h : img.height
    ctx.drawImage(img, sx, sy, sw, sh, contentX, contentY, scaledW, scaledH)
    ctx.restore()

    // position resize handle at the screenshot's bottom-right corner
    queueMicrotask(() => {
      const stage = stageRef.current
      if (!stage || !c) return
      const sRect = stage.getBoundingClientRect()
      const cRect = c.getBoundingClientRect()
      const scaleX = cRect.width / c.width
      const scaleY = cRect.height / c.height
      const imgRight = (contentX + scaledW) * scaleX
      const imgBottom = (contentY + scaledH) * scaleY
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
          <div className="ml-4 flex items-center gap-2">
            <Button
              variant={activeTool === 'crop' ? 'default' : 'outline'}
              size="icon"
              title="Crop"
              onClick={() => {
                if (activeTool === 'crop') {
                  setActiveTool('none')
                  setCropSelection(null)
                } else {
                  setActiveTool('crop')
                }
              }}
            >
              <Crop />
            </Button>
            <Button variant="outline" size="icon" title="Text" disabled>
              <TypeIcon />
            </Button>
            <Button variant="outline" size="icon" title="Rectangle" disabled>
              <Square />
            </Button>
            <Button variant="outline" size="icon" title="Circle" disabled>
              <Circle />
            </Button>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {activeTool === 'crop' && (
              <>
                <Button
                  size="sm"
                  onClick={() => {
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
                >
                  Apply
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setActiveTool('none'); setCropSelection(null) }}>
                  Cancel
                </Button>
              </>
            )}
            <ThemeToggle />
            <SidebarTrigger className="-mr-1 rotate-180" />
          </div>
        </header>
        <div ref={stageRef} className="relative flex flex-1 items-center justify-center bg-neutral-900 select-none">
          {imageUrl ? (
            <>
              <canvas
                ref={canvasRef}
                style={{ cursor: activeTool === 'crop' ? 'crosshair' : isDragging ? 'grabbing' : 'grab' }}
                onPointerDown={(e) => {
                  // Begin drag to reposition the screenshot (avoid if starting on handle)
                  if (!(e.target instanceof HTMLCanvasElement)) return
                  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
                  const c = canvasRef.current!
                  const rect = c.getBoundingClientRect()
                  const startCX = e.clientX - rect.left
                  const startCY = e.clientY - rect.top
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
                    const move = (ev: PointerEvent) => {
                      const cx0 = ev.clientX - rect.left
                      const cy0 = ev.clientY - rect.top
                      const cx = Math.max(contentRect.x, Math.min(cx0, contentRect.x + contentRect.w))
                      const cy = Math.max(contentRect.y, Math.min(cy0, contentRect.y + contentRect.h))
                      const x = Math.min(startCX, cx)
                      const y = Math.min(startCY, cy)
                      const w = Math.abs(cx - startCX)
                      const h = Math.abs(cy - startCY)
                      setCropSelection({ x, y, w, h })
                    }
                    const up = () => {
                      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
                      window.removeEventListener('pointermove', move)
                      window.removeEventListener('pointerup', up)
                    }
                    window.addEventListener('pointermove', move)
                    window.addEventListener('pointerup', up)
                  } else {
                    setIsDragging(true)
                    const start = { ...imageOffset }
                    const move = (ev: PointerEvent) => {
                      const dx = ev.clientX - e.clientX
                      const dy = ev.clientY - e.clientY
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
              {activeTool === 'crop' && img && cropSelection && (
                <div
                  className="absolute border-2 border-blue-500/80 bg-blue-500/10"
                  style={(() => {
                    const c = canvasRef.current
                    const stage = stageRef.current
                    if (!c || !stage) return {}
                    const sRect = stage.getBoundingClientRect()
                    const cRect = c.getBoundingClientRect()
                    const scaleX = 1
                    const scaleY = 1
                    return {
                      left: cRect.left - sRect.left + cropSelection.x * scaleX,
                      top: cRect.top - sRect.top + cropSelection.y * scaleY,
                      width: cropSelection.w * scaleX,
                      height: cropSelection.h * scaleY,
                    } as React.CSSProperties
                  })()}
                  onPointerDown={(e) => {
                    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
                    const startX = e.clientX
                    const startY = e.clientY
                    const start = { ...cropSelection }
                    const move = (ev: PointerEvent) => {
                      const dx = ev.clientX - startX
                      const dy = ev.clientY - startY
                      setCropSelection((sel) => sel ? { ...sel, x: start.x + dx, y: start.y + dy } : sel)
                    }
                    const up = () => {
                      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
                      window.removeEventListener('pointermove', move)
                      window.removeEventListener('pointerup', up)
                    }
                    window.addEventListener('pointermove', move)
                    window.addEventListener('pointerup', up)
                  }}
                >
                  {/* top-left handle */}
                  <div
                    className="absolute -top-2 -left-2 h-4 w-4 rounded-full bg-blue-500 border border-white/80 cursor-nw-resize"
                    onPointerDown={(e) => {
                      e.stopPropagation()
                      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
                      const startX = e.clientX
                      const startY = e.clientY
                      const start = { ...cropSelection! }
                      const move = (ev: PointerEvent) => {
                        const dx = ev.clientX - startX
                        const dy = ev.clientY - startY
                        const nx = start.x + dx
                        const ny = start.y + dy
                        const nw = Math.max(10, start.w - dx)
                        const nh = Math.max(10, start.h - dy)
                        setCropSelection({ x: Math.min(nx, start.x + start.w - 10), y: Math.min(ny, start.y + start.h - 10), w: nw, h: nh })
                      }
                      const up = () => {
                        ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
                        window.removeEventListener('pointermove', move)
                        window.removeEventListener('pointerup', up)
                      }
                      window.addEventListener('pointermove', move)
                      window.addEventListener('pointerup', up)
                    }}
                  />
                  {/* top-right handle */}
                  <div
                    className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-blue-500 border border-white/80 cursor-ne-resize"
                    onPointerDown={(e) => {
                      e.stopPropagation()
                      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
                      const startX = e.clientX
                      const startY = e.clientY
                      const start = { ...cropSelection! }
                      const move = (ev: PointerEvent) => {
                        const dx = ev.clientX - startX
                        const dy = ev.clientY - startY
                        const ny = start.y + dy
                        const nw = Math.max(10, start.w + dx)
                        const nh = Math.max(10, start.h - dy)
                        setCropSelection({ x: start.x, y: Math.min(ny, start.y + start.h - 10), w: nw, h: nh })
                      }
                      const up = () => {
                        ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
                        window.removeEventListener('pointermove', move)
                        window.removeEventListener('pointerup', up)
                      }
                      window.addEventListener('pointermove', move)
                      window.addEventListener('pointerup', up)
                    }}
                  />
                  {/* bottom-left handle */}
                  <div
                    className="absolute -bottom-2 -left-2 h-4 w-4 rounded-full bg-blue-500 border border-white/80 cursor-sw-resize"
                    onPointerDown={(e) => {
                      e.stopPropagation()
                      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
                      const startX = e.clientX
                      const startY = e.clientY
                      const start = { ...cropSelection! }
                      const move = (ev: PointerEvent) => {
                        const dx = ev.clientX - startX
                        const dy = ev.clientY - startY
                        const nx = start.x + dx
                        const nw = Math.max(10, start.w - dx)
                        const nh = Math.max(10, start.h + dy)
                        setCropSelection({ x: Math.min(nx, start.x + start.w - 10), y: start.y, w: nw, h: nh })
                      }
                      const up = () => {
                        ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
                        window.removeEventListener('pointermove', move)
                        window.removeEventListener('pointerup', up)
                      }
                      window.addEventListener('pointermove', move)
                      window.addEventListener('pointerup', up)
                    }}
                  />
                  <div
                    className="absolute -bottom-2 -right-2 h-4 w-4 rounded-full bg-blue-500 border border-white/80 cursor-se-resize"
                    onPointerDown={(e) => {
                      e.stopPropagation()
                      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
                      const startX = e.clientX
                      const startY = e.clientY
                      const start = { ...cropSelection! }
                      const move = (ev: PointerEvent) => {
                        const dx = ev.clientX - startX
                        const dy = ev.clientY - startY
                        setCropSelection((sel) => sel ? { ...sel, w: Math.max(10, start.w + dx), h: Math.max(10, start.h + dy) } : sel)
                      }
                      const up = () => {
                        ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
                        window.removeEventListener('pointermove', move)
                        window.removeEventListener('pointerup', up)
                      }
                      window.addEventListener('pointermove', move)
                      window.addEventListener('pointerup', up)
                    }}
                  />
                </div>
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

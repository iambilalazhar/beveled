import { useEffect, useMemo, useRef, useState } from 'react'
//
import { ThemeToggle } from '@/components/theme-toggle'
import { AppSidebar, type BgPreset, type LinearGradient, type WindowStyle, type ShadowStrength } from '@/components/app-sidebar'
 
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

type Padding = { x: number; y: number }

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

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
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const windowBarHeights: Record<WindowStyle, number> = { regular: 44, notch: 44, title: 28 }
  const windowBar = windowStyle ? windowBarHeights[windowStyle] : 44
  const cornerRadius = 16

  useEffect(() => {
    chrome.storage.local.get('latestCapture', (res) => {
      if (res?.latestCapture) setImageUrl(res.latestCapture as string)
    })
  }, [])

  const img = useMemo(() => {
    if (!imageUrl) return null
    const im = new Image()
    im.src = imageUrl
    return im
  }, [imageUrl])

  useEffect(() => {
    if (!img) return
    const c = canvasRef.current!
    const ctx = c.getContext('2d')!

    const extraTop = showWindow ? windowBar : 0
    const totalW = img.width + padding.x * 2
    const totalH = img.height + padding.y * 2 + extraTop

    c.width = Math.max(1, totalW)
    c.height = Math.max(1, totalH)

    // Clear
    ctx.clearRect(0, 0, c.width, c.height)

    // Background
    if (bgPreset.type === 'solid') {
      ctx.fillStyle = bgPreset.color
      ctx.fillRect(0, 0, c.width, c.height)
    } else {
      const angleRad = (bgPreset.angle * Math.PI) / 180
      const cx = c.width / 2
      const cy = c.height / 2
      const r = Math.max(c.width, c.height)
      const dx = Math.cos(angleRad)
      const dy = Math.sin(angleRad)
      const g = ctx.createLinearGradient(cx - dx * r, cy - dy * r, cx + dx * r, cy + dy * r)
      for (const s of bgPreset.stops) g.addColorStop(Math.min(1, Math.max(0, s.pos)), s.color)
      ctx.fillStyle = g
      ctx.fillRect(0, 0, c.width, c.height)
    }

    const contentX = padding.x
    const contentY = padding.y + extraTop

    // Optional window chrome shadow block
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
      drawRoundedRect(
        ctx,
        contentX - 8,
        (showWindow ? padding.y : contentY) - 8,
        img.width + 16,
        img.height + (showWindow ? windowBar : 0) + 16,
        cornerRadius + 2
      )
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      ctx.restore()
    }

    // Window chrome
    if (showWindow) {
      ctx.save()
      drawRoundedRect(
        ctx,
        contentX,
        padding.y,
        img.width,
        windowBar,
        cornerRadius
      )
      ctx.fillStyle = windowBarColor
      ctx.fill()
      // Traffic lights (hidden for title-only minimal style)
      if (windowStyle !== 'title') {
        const tlY = padding.y + windowBar / 2
        const tlXs = [contentX + 18, contentX + 42, contentX + 66]
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
        const notchW = Math.min(180, img.width * 0.25)
        const notchH = 18
        const notchR = 8
        const nx = contentX + img.width / 2 - notchW / 2
        const ny = padding.y + windowBar - notchH
        drawRoundedRect(ctx, nx, ny, notchW, notchH, notchR)
        ctx.fill()
        ctx.restore()
      }
      ctx.restore()
    }

    // Screenshot image
    ctx.save()
    ctx.drawImage(img, contentX, contentY)
    ctx.restore()
  }, [img, bgPreset, padding.x, padding.y, shadowStrength, showWindow, windowStyle, windowBarColor])

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
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <SidebarTrigger className="-mr-1 rotate-180" />
          </div>
        </header>
        <div
          className="flex flex-1 items-center justify-center"
          style={{ background: 'repeating-conic-gradient(#eee 0% 25%, #fff 0% 50%) 50% / 24px 24px' }}
        >
          {imageUrl ? (
            <canvas ref={canvasRef} className="max-h-[95%] max-w-[95%]" />
          ) : (
            <div className="text-neutral-500">No capture found. Use the popup to capture.</div>
          )}
        </div>
      </SidebarInset>
      <AppSidebar
        side="right"
        solidPresets={SOLID_PRESETS}
        gradientPresets={GRADIENT_PRESETS}
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
        onDownload={download}
      />
    </SidebarProvider>
  )
}

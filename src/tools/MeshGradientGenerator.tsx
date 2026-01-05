import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Copy, Check, Download, ArrowLeft, Shuffle, Plus, Trash2 } from 'lucide-react'

interface MeshPoint {
  id: string
  x: number
  y: number
  color: string
}

const PRESET_PALETTES = [
  ['#667eea', '#764ba2', '#f093fb', '#f5576c'],
  ['#11998e', '#38ef7d', '#43cea2', '#185a9d'],
  ['#ff6b6b', '#feca57', '#ff9ff3', '#54a0ff'],
  ['#00c6fb', '#005bea', '#6a11cb', '#2575fc'],
  ['#f12711', '#f5af19', '#ee0979', '#ff6a00'],
  ['#e0c3fc', '#8ec5fc', '#a1c4fd', '#c2e9fb'],
  ['#232526', '#414345', '#636e72', '#2d3436'],
  ['#fc466b', '#3f5efb', '#a29bfe', '#fd79a8'],
]

function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

function randomColor() {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
}

export default function MeshGradientGenerator({ goTo }: { goTo: (path: string) => void }) {
  const [points, setPoints] = useState<MeshPoint[]>([
    { id: generateId(), x: 20, y: 20, color: '#667eea' },
    { id: generateId(), x: 80, y: 20, color: '#764ba2' },
    { id: generateId(), x: 20, y: 80, color: '#f093fb' },
    { id: generateId(), x: 80, y: 80, color: '#f5576c' },
  ])
  const [blur, setBlur] = useState(40)
  const [backgroundColor, setBackgroundColor] = useState('#ffffff')
  const [copied, setCopied] = useState(false)
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.title = 'Mesh Gradient Generator - Create Beautiful Mesh Gradients | Beveled'
  }, [])

  const gradientCSS = useMemo(() => {
    const blobs = points.map(p =>
      `radial-gradient(at ${p.x}% ${p.y}%, ${p.color} 0px, transparent 50%)`
    ).join(',\n    ')

    return `background-color: ${backgroundColor};
background-image:
    ${blobs};`
  }, [points, backgroundColor])

  const fullCSS = useMemo(() => {
    return `${gradientCSS}
filter: blur(${blur}px);`
  }, [gradientCSS, blur])

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(fullCSS)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [fullCSS])

  const addPoint = useCallback(() => {
    setPoints(prev => [...prev, {
      id: generateId(),
      x: 30 + Math.random() * 40,
      y: 30 + Math.random() * 40,
      color: randomColor()
    }])
  }, [])

  const removePoint = useCallback((id: string) => {
    if (points.length <= 2) return
    setPoints(prev => prev.filter(p => p.id !== id))
  }, [points.length])

  const updatePoint = useCallback((id: string, updates: Partial<MeshPoint>) => {
    setPoints(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
  }, [])

  const randomize = useCallback(() => {
    const palette = PRESET_PALETTES[Math.floor(Math.random() * PRESET_PALETTES.length)]
    const numPoints = 3 + Math.floor(Math.random() * 3)
    const newPoints: MeshPoint[] = []

    for (let i = 0; i < numPoints; i++) {
      newPoints.push({
        id: generateId(),
        x: 10 + Math.random() * 80,
        y: 10 + Math.random() * 80,
        color: palette[i % palette.length]
      })
    }

    setPoints(newPoints)
    setBlur(30 + Math.floor(Math.random() * 40))
    setBackgroundColor(palette[0] + '40')
  }, [])

  const applyPalette = useCallback((palette: string[]) => {
    setPoints(prev => prev.map((p, i) => ({
      ...p,
      color: palette[i % palette.length]
    })))
    setBackgroundColor(palette[0] + '20')
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent, pointId: string) => {
    e.preventDefault()
    setDragging(pointId)
    setSelectedPoint(pointId)
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || !previewRef.current) return

    const rect = previewRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100))

    updatePoint(dragging, { x, y })
  }, [dragging, updatePoint])

  const handleMouseUp = useCallback(() => {
    setDragging(null)
  }, [])

  const downloadAsPNG = useCallback(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1920
    canvas.height = 1080
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Fill background
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw each color blob
    points.forEach(point => {
      const x = (point.x / 100) * canvas.width
      const y = (point.y / 100) * canvas.height
      const radius = Math.max(canvas.width, canvas.height) * 0.5

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
      gradient.addColorStop(0, point.color)
      gradient.addColorStop(1, point.color + '00')

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    })

    // Apply blur by re-drawing with lower resolution and scaling up
    const blurCanvas = document.createElement('canvas')
    const blurFactor = blur / 10
    blurCanvas.width = canvas.width / blurFactor
    blurCanvas.height = canvas.height / blurFactor
    const blurCtx = blurCanvas.getContext('2d')
    if (blurCtx) {
      blurCtx.drawImage(canvas, 0, 0, blurCanvas.width, blurCanvas.height)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(blurCanvas, 0, 0, canvas.width, canvas.height)
    }

    const link = document.createElement('a')
    link.download = 'mesh-gradient.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, [points, backgroundColor, blur])

  const previewStyle = useMemo(() => ({
    backgroundColor,
    backgroundImage: points.map(p =>
      `radial-gradient(at ${p.x}% ${p.y}%, ${p.color} 0px, transparent 50%)`
    ).join(', '),
  }), [points, backgroundColor])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => goTo('/')}>
              <ArrowLeft className="size-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <img src="/beveled_icon.png" alt="Beveled" width={24} height={24} />
              <span className="font-semibold">Mesh Gradient Generator</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={downloadAsPNG}>
              <Download className="size-4 mr-2" />
              Download PNG
            </Button>
            <Button size="sm" onClick={copyToClipboard}>
              {copied ? <Check className="size-4 mr-2" /> : <Copy className="size-4 mr-2" />}
              {copied ? 'Copied!' : 'Copy CSS'}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Preview */}
          <div className="space-y-4">
            <div
              ref={previewRef}
              className="aspect-video rounded-xl shadow-2xl border overflow-hidden relative cursor-crosshair"
              style={{ ...previewStyle, filter: `blur(${blur}px)` }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />

            {/* Point Handles Overlay */}
            <div
              className="aspect-video rounded-xl relative -mt-[calc(56.25%+1rem)]"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {points.map(point => (
                <button
                  key={point.id}
                  className={`absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-lg cursor-move transition-transform hover:scale-110 ${selectedPoint === point.id ? 'ring-2 ring-primary scale-110' : ''}`}
                  style={{
                    left: `${point.x}%`,
                    top: `${point.y}%`,
                    backgroundColor: point.color
                  }}
                  onMouseDown={(e) => handleMouseDown(e, point.id)}
                  onClick={() => setSelectedPoint(point.id)}
                />
              ))}
            </div>

            <p className="text-sm text-muted-foreground text-center">
              Drag the color points to adjust the mesh gradient
            </p>

            {/* Code Preview */}
            <div className="bg-muted rounded-lg p-4 font-mono text-sm max-h-48 overflow-auto">
              <pre className="whitespace-pre-wrap break-all">{fullCSS}</pre>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Randomize */}
            <div className="flex gap-2">
              <Button className="flex-1" onClick={randomize}>
                <Shuffle className="size-4 mr-2" />
                Generate Random Mesh
              </Button>
              <Button variant="outline" onClick={addPoint}>
                <Plus className="size-4" />
              </Button>
            </div>

            {/* Color Palettes */}
            <div className="space-y-3">
              <Label>Color Palettes</Label>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_PALETTES.map((palette, i) => (
                  <button
                    key={i}
                    className="aspect-square rounded-lg border hover:scale-105 transition-transform overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${palette[0]} 25%, ${palette[1]} 25%, ${palette[1]} 50%, ${palette[2]} 50%, ${palette[2]} 75%, ${palette[3]} 75%)`
                    }}
                    onClick={() => applyPalette(palette)}
                  />
                ))}
              </div>
            </div>

            {/* Blur */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Blur Amount</Label>
                <span className="text-sm text-muted-foreground">{blur}px</span>
              </div>
              <Slider
                value={[blur]}
                onValueChange={([v]) => setBlur(v)}
                min={0}
                max={100}
                step={1}
              />
            </div>

            {/* Background Color */}
            <div className="space-y-3">
              <Label>Background Color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={backgroundColor.slice(0, 7)}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border-0"
                />
                <Input
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>

            {/* Color Points */}
            <div className="space-y-3">
              <Label>Color Points ({points.length})</Label>
              <div className="space-y-2 max-h-64 overflow-auto">
                {points.map((point) => (
                  <div
                    key={point.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${selectedPoint === point.id ? 'bg-primary/10 border border-primary' : 'bg-muted'}`}
                    onClick={() => setSelectedPoint(point.id)}
                  >
                    <input
                      type="color"
                      value={point.color}
                      onChange={(e) => updatePoint(point.id, { color: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer border-0"
                    />
                    <Input
                      value={point.color}
                      onChange={(e) => updatePoint(point.id, { color: e.target.value })}
                      className="font-mono w-24 h-8 text-sm"
                    />
                    <div className="flex-1 text-xs text-muted-foreground">
                      {Math.round(point.x)}%, {Math.round(point.y)}%
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); removePoint(point.id) }}
                      disabled={points.length <= 2}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SEO Content */}
        <section className="mt-16 prose prose-gray dark:prose-invert max-w-none">
          <h1>Mesh Gradient Generator</h1>
          <p>
            Create stunning mesh gradients with our free online generator. Mesh gradients are modern, organic-looking color blends that add depth and visual interest to your designs. Perfect for backgrounds, hero sections, and UI elements.
          </p>

          <h2>What are Mesh Gradients?</h2>
          <p>
            Unlike linear or radial gradients, mesh gradients use multiple color points that blend together organically. This creates a more natural, fluid appearance that's become popular in modern web and app design. Companies like Apple, Stripe, and Figma use mesh gradients extensively in their branding.
          </p>

          <h2>Features</h2>
          <ul>
            <li><strong>Interactive Editor:</strong> Drag color points directly on the preview</li>
            <li><strong>Multiple Color Points:</strong> Add as many colors as you need</li>
            <li><strong>Adjustable Blur:</strong> Control the smoothness of color blending</li>
            <li><strong>Preset Palettes:</strong> Start with curated color combinations</li>
            <li><strong>One-Click Copy:</strong> Copy CSS code instantly</li>
            <li><strong>PNG Export:</strong> Download high-resolution images</li>
          </ul>

          <h2>Use Cases</h2>
          <ul>
            <li>Hero section backgrounds</li>
            <li>App launch screens</li>
            <li>Social media graphics</li>
            <li>Presentation slides</li>
            <li>Card and button backgrounds</li>
          </ul>
        </section>
      </main>
    </div>
  )
}

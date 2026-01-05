import { useState, useCallback, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Copy, Check, Download, ArrowLeft, Shuffle } from 'lucide-react'

type BlobStyle = 'solid' | 'gradient' | 'outline'
type ExportFormat = 'svg' | 'css' | 'react'

interface BlobConfig {
  complexity: number
  contrast: number
  seed: number
  color1: string
  color2: string
  style: BlobStyle
  strokeWidth: number
  size: number
}

// Generate organic blob path using Perlin-like noise
function generateBlobPath(config: BlobConfig): string {
  const { complexity, contrast, seed, size } = config
  const numPoints = Math.max(3, Math.floor(complexity * 10))
  const center = size / 2
  const baseRadius = size * 0.35

  // Simple seeded random
  const seededRandom = (s: number) => {
    const x = Math.sin(s * 9999) * 10000
    return x - Math.floor(x)
  }

  const points: { x: number; y: number }[] = []

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2
    const noise = seededRandom(seed + i * 0.1) * contrast * baseRadius
    const radius = baseRadius + noise

    points.push({
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius
    })
  }

  // Create smooth bezier curve through points
  const smoothPoints = points.map((point, i) => {
    const prev = points[(i - 1 + points.length) % points.length]
    const next = points[(i + 1) % points.length]

    const smoothing = 0.2
    const cp1x = point.x - (next.x - prev.x) * smoothing
    const cp1y = point.y - (next.y - prev.y) * smoothing
    const cp2x = point.x + (next.x - prev.x) * smoothing
    const cp2y = point.y + (next.y - prev.y) * smoothing

    return { point, cp1: { x: cp1x, y: cp1y }, cp2: { x: cp2x, y: cp2y } }
  })

  let path = `M ${smoothPoints[0].point.x.toFixed(2)} ${smoothPoints[0].point.y.toFixed(2)}`

  for (let i = 0; i < smoothPoints.length; i++) {
    const current = smoothPoints[i]
    const next = smoothPoints[(i + 1) % smoothPoints.length]

    path += ` C ${current.cp2.x.toFixed(2)} ${current.cp2.y.toFixed(2)}, ${next.cp1.x.toFixed(2)} ${next.cp1.y.toFixed(2)}, ${next.point.x.toFixed(2)} ${next.point.y.toFixed(2)}`
  }

  path += ' Z'
  return path
}

const COLOR_PRESETS = [
  { c1: '#667eea', c2: '#764ba2' },
  { c1: '#f093fb', c2: '#f5576c' },
  { c1: '#4facfe', c2: '#00f2fe' },
  { c1: '#43e97b', c2: '#38f9d7' },
  { c1: '#fa709a', c2: '#fee140' },
  { c1: '#a8edea', c2: '#fed6e3' },
  { c1: '#ff0844', c2: '#ffb199' },
  { c1: '#30cfd0', c2: '#330867' },
]

export default function BlobGenerator({ goTo }: { goTo: (path: string) => void }) {
  const [config, setConfig] = useState<BlobConfig>({
    complexity: 0.6,
    contrast: 0.5,
    seed: Math.random() * 1000,
    color1: '#667eea',
    color2: '#764ba2',
    style: 'gradient',
    strokeWidth: 2,
    size: 400
  })
  const [copied, setCopied] = useState(false)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('svg')

  useEffect(() => {
    document.title = 'SVG Blob Generator - Create Organic Shapes | Beveled'
  }, [])

  const blobPath = useMemo(() => generateBlobPath(config), [config])

  const gradientId = 'blob-gradient'

  const svgContent = useMemo(() => {
    const { color1, color2, style, strokeWidth, size } = config

    let fill = ''
    let stroke = ''
    let defs = ''

    switch (style) {
      case 'solid':
        fill = color1
        break
      case 'gradient':
        fill = `url(#${gradientId})`
        defs = `<defs><linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${color1}"/><stop offset="100%" style="stop-color:${color2}"/></linearGradient></defs>`
        break
      case 'outline':
        fill = 'none'
        stroke = color1
        break
    }

    return `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">${defs}<path d="${blobPath}" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="${strokeWidth}"` : ''}/></svg>`
  }, [config, blobPath])

  const exportCode = useMemo(() => {
    switch (exportFormat) {
      case 'svg':
        return svgContent
      case 'css':
        const encoded = encodeURIComponent(svgContent)
        return `background-image: url("data:image/svg+xml,${encoded}");
background-size: contain;
background-repeat: no-repeat;
background-position: center;`
      case 'react':
        return `const Blob = () => (
  ${svgContent.replace('<svg', '<svg className="blob"')}
);

export default Blob;`
      default:
        return svgContent
    }
  }, [exportFormat, svgContent])

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(exportCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [exportCode])

  const updateConfig = useCallback((updates: Partial<BlobConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }, [])

  const randomize = useCallback(() => {
    const preset = COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)]
    setConfig(prev => ({
      ...prev,
      seed: Math.random() * 1000,
      complexity: 0.3 + Math.random() * 0.7,
      contrast: 0.2 + Math.random() * 0.6,
      color1: preset.c1,
      color2: preset.c2
    }))
  }, [])

  const downloadSVG = useCallback(() => {
    const blob = new Blob([svgContent], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = 'blob.svg'
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
  }, [svgContent])

  const downloadPNG = useCallback(() => {
    const canvas = document.createElement('canvas')
    canvas.width = config.size * 2
    canvas.height = config.size * 2

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(svgBlob)

    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)

      const link = document.createElement('a')
      link.download = 'blob.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
    }

    img.src = url
  }, [svgContent, config.size])

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
              <span className="font-semibold">Blob Generator</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={downloadSVG}>
              <Download className="size-4 mr-2" />
              SVG
            </Button>
            <Button variant="outline" size="sm" onClick={downloadPNG}>
              <Download className="size-4 mr-2" />
              PNG
            </Button>
            <Button size="sm" onClick={copyToClipboard}>
              {copied ? <Check className="size-4 mr-2" /> : <Copy className="size-4 mr-2" />}
              {copied ? 'Copied!' : 'Copy Code'}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Preview */}
          <div className="space-y-4">
            <div className="aspect-square rounded-xl shadow-2xl border bg-muted/30 flex items-center justify-center p-8">
              <div
                className="w-full h-full"
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />
            </div>

            {/* Export Format */}
            <Tabs value={exportFormat} onValueChange={(v) => setExportFormat(v as ExportFormat)}>
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="svg">SVG</TabsTrigger>
                <TabsTrigger value="css">CSS</TabsTrigger>
                <TabsTrigger value="react">React</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Code Preview */}
            <div className="bg-muted rounded-lg p-4 font-mono text-xs max-h-48 overflow-auto">
              <pre className="whitespace-pre-wrap break-all">{exportCode}</pre>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Randomize */}
            <div className="flex gap-2">
              <Button className="flex-1" onClick={randomize}>
                <Shuffle className="size-4 mr-2" />
                Generate Random Blob
              </Button>
            </div>

            {/* Style */}
            <div className="space-y-3">
              <Label>Style</Label>
              <Tabs value={config.style} onValueChange={(v) => updateConfig({ style: v as BlobStyle })}>
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="solid">Solid</TabsTrigger>
                  <TabsTrigger value="gradient">Gradient</TabsTrigger>
                  <TabsTrigger value="outline">Outline</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Colors */}
            <div className="space-y-3">
              <Label>Colors</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    {config.style === 'gradient' ? 'Start Color' : 'Color'}
                  </Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={config.color1}
                      onChange={(e) => updateConfig({ color1: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer border-0"
                    />
                    <Input
                      value={config.color1}
                      onChange={(e) => updateConfig({ color1: e.target.value })}
                      className="font-mono"
                    />
                  </div>
                </div>
                {config.style === 'gradient' && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">End Color</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={config.color2}
                        onChange={(e) => updateConfig({ color2: e.target.value })}
                        className="w-10 h-10 rounded cursor-pointer border-0"
                      />
                      <Input
                        value={config.color2}
                        onChange={(e) => updateConfig({ color2: e.target.value })}
                        className="font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Color Presets */}
              <div className="flex gap-2 flex-wrap">
                {COLOR_PRESETS.map((preset, i) => (
                  <button
                    key={i}
                    className="w-8 h-8 rounded-full border hover:scale-110 transition-transform"
                    style={{
                      background: `linear-gradient(135deg, ${preset.c1}, ${preset.c2})`
                    }}
                    onClick={() => updateConfig({ color1: preset.c1, color2: preset.c2 })}
                  />
                ))}
              </div>
            </div>

            {/* Complexity */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Complexity</Label>
                <span className="text-sm text-muted-foreground">{Math.round(config.complexity * 100)}%</span>
              </div>
              <Slider
                value={[config.complexity]}
                onValueChange={([v]) => updateConfig({ complexity: v })}
                min={0.1}
                max={1}
                step={0.01}
              />
            </div>

            {/* Contrast */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Contrast</Label>
                <span className="text-sm text-muted-foreground">{Math.round(config.contrast * 100)}%</span>
              </div>
              <Slider
                value={[config.contrast]}
                onValueChange={([v]) => updateConfig({ contrast: v })}
                min={0}
                max={1}
                step={0.01}
              />
            </div>

            {/* Stroke Width (for outline) */}
            {config.style === 'outline' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Stroke Width</Label>
                  <span className="text-sm text-muted-foreground">{config.strokeWidth}px</span>
                </div>
                <Slider
                  value={[config.strokeWidth]}
                  onValueChange={([v]) => updateConfig({ strokeWidth: v })}
                  min={1}
                  max={10}
                  step={0.5}
                />
              </div>
            )}

            {/* Seed */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Seed</Label>
                <Button variant="ghost" size="sm" onClick={() => updateConfig({ seed: Math.random() * 1000 })}>
                  <Shuffle className="size-4" />
                </Button>
              </div>
              <Slider
                value={[config.seed]}
                onValueChange={([v]) => updateConfig({ seed: v })}
                min={0}
                max={1000}
                step={1}
              />
            </div>
          </div>
        </div>

        {/* SEO Content */}
        <section className="mt-16 prose prose-gray dark:prose-invert max-w-none">
          <h1>SVG Blob Generator</h1>
          <p>
            Create beautiful, organic blob shapes with our free online SVG generator. Generate unique, smooth blobs perfect for backgrounds, illustrations, and modern web design. Export as SVG, CSS, or React components.
          </p>

          <h2>Features</h2>
          <ul>
            <li><strong>Organic Shapes:</strong> Generate smooth, natural-looking blob shapes</li>
            <li><strong>Multiple Styles:</strong> Solid colors, gradients, or outline mode</li>
            <li><strong>Full Customization:</strong> Control complexity, contrast, and colors</li>
            <li><strong>Multiple Export Formats:</strong> SVG, CSS background, or React component</li>
            <li><strong>Color Presets:</strong> Beautiful gradient presets to get started</li>
            <li><strong>Randomize:</strong> Generate endless unique blob variations</li>
          </ul>

          <h2>How to Use Blobs</h2>
          <ul>
            <li><strong>Hero Backgrounds:</strong> Add visual interest to landing pages</li>
            <li><strong>Image Masks:</strong> Create unique image shapes</li>
            <li><strong>Decorative Elements:</strong> Add organic shapes to illustrations</li>
            <li><strong>Loading Animations:</strong> Animate blob shapes for engaging loaders</li>
            <li><strong>Card Backgrounds:</strong> Make UI components more dynamic</li>
          </ul>
        </section>
      </main>
    </div>
  )
}

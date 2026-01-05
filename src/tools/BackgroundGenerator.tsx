import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Copy, Check, Download, ArrowLeft, Shuffle } from 'lucide-react'

type PatternType =
  | 'dots' | 'grid' | 'diagonal-lines' | 'cross' | 'zigzag'
  | 'waves' | 'hexagons' | 'triangles' | 'circles' | 'squares'
  | 'plus' | 'chevrons' | 'diamonds' | 'stars' | 'noise'

interface PatternConfig {
  type: PatternType
  foreground: string
  background: string
  size: number
  opacity: number
  strokeWidth: number
}

const PATTERNS: { type: PatternType; name: string }[] = [
  { type: 'dots', name: 'Dots' },
  { type: 'grid', name: 'Grid' },
  { type: 'diagonal-lines', name: 'Diagonal' },
  { type: 'cross', name: 'Cross' },
  { type: 'zigzag', name: 'Zigzag' },
  { type: 'waves', name: 'Waves' },
  { type: 'hexagons', name: 'Hexagons' },
  { type: 'triangles', name: 'Triangles' },
  { type: 'circles', name: 'Circles' },
  { type: 'squares', name: 'Squares' },
  { type: 'plus', name: 'Plus' },
  { type: 'chevrons', name: 'Chevrons' },
  { type: 'diamonds', name: 'Diamonds' },
  { type: 'stars', name: 'Stars' },
  { type: 'noise', name: 'Noise' },
]

const COLOR_PRESETS = [
  { bg: '#ffffff', fg: '#e5e5e5' },
  { bg: '#f8fafc', fg: '#cbd5e1' },
  { bg: '#0f172a', fg: '#1e293b' },
  { bg: '#fef3c7', fg: '#fbbf24' },
  { bg: '#dbeafe', fg: '#3b82f6' },
  { bg: '#fce7f3', fg: '#ec4899' },
  { bg: '#d1fae5', fg: '#10b981' },
  { bg: '#ede9fe', fg: '#8b5cf6' },
]

function generatePatternSVG(config: PatternConfig): string {
  const { type, foreground, size, opacity, strokeWidth } = config
  const s = size

  switch (type) {
    case 'dots':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><circle cx="${s/2}" cy="${s/2}" r="${Math.max(1, s/8)}" fill="${foreground}" opacity="${opacity}"/></svg>`

    case 'grid':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><path d="M${s} 0L${s} ${s}M0 ${s}L${s} ${s}" stroke="${foreground}" stroke-width="${strokeWidth}" opacity="${opacity}" fill="none"/></svg>`

    case 'diagonal-lines':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><path d="M0 ${s}L${s} 0M-${s/4} ${s/4}L${s/4} -${s/4}M${s*3/4} ${s+s/4}L${s+s/4} ${s*3/4}" stroke="${foreground}" stroke-width="${strokeWidth}" opacity="${opacity}"/></svg>`

    case 'cross':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><path d="M${s/2} 0L${s/2} ${s}M0 ${s/2}L${s} ${s/2}" stroke="${foreground}" stroke-width="${strokeWidth}" opacity="${opacity}"/></svg>`

    case 'zigzag':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><path d="M0 ${s/2}L${s/4} 0L${s/2} ${s/2}L${s*3/4} 0L${s} ${s/2}" stroke="${foreground}" stroke-width="${strokeWidth}" opacity="${opacity}" fill="none"/></svg>`

    case 'waves':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><path d="M0 ${s/2}Q${s/4} 0 ${s/2} ${s/2}T${s} ${s/2}" stroke="${foreground}" stroke-width="${strokeWidth}" opacity="${opacity}" fill="none"/></svg>`

    case 'hexagons':
      const hex = s / 2
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s * 0.866}"><path d="M${hex/2} 0L${hex*1.5} 0L${hex*2} ${hex*0.433}L${hex*1.5} ${hex*0.866}L${hex/2} ${hex*0.866}L0 ${hex*0.433}Z" stroke="${foreground}" stroke-width="${strokeWidth}" opacity="${opacity}" fill="none"/></svg>`

    case 'triangles':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><path d="M${s/2} 0L${s} ${s}L0 ${s}Z" stroke="${foreground}" stroke-width="${strokeWidth}" opacity="${opacity}" fill="none"/></svg>`

    case 'circles':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><circle cx="${s/2}" cy="${s/2}" r="${s/3}" stroke="${foreground}" stroke-width="${strokeWidth}" opacity="${opacity}" fill="none"/></svg>`

    case 'squares':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><rect x="${s/4}" y="${s/4}" width="${s/2}" height="${s/2}" stroke="${foreground}" stroke-width="${strokeWidth}" opacity="${opacity}" fill="none"/></svg>`

    case 'plus':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><path d="M${s/2} ${s/4}V${s*3/4}M${s/4} ${s/2}H${s*3/4}" stroke="${foreground}" stroke-width="${strokeWidth}" opacity="${opacity}"/></svg>`

    case 'chevrons':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><path d="M0 ${s}L${s/2} ${s/2}L${s} ${s}" stroke="${foreground}" stroke-width="${strokeWidth}" opacity="${opacity}" fill="none"/></svg>`

    case 'diamonds':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><path d="M${s/2} 0L${s} ${s/2}L${s/2} ${s}L0 ${s/2}Z" stroke="${foreground}" stroke-width="${strokeWidth}" opacity="${opacity}" fill="none"/></svg>`

    case 'stars':
      const cx = s / 2, cy = s / 2, r = s / 3
      const points = Array.from({ length: 5 }, (_, i) => {
        const angle = (i * 72 - 90) * Math.PI / 180
        const outerX = cx + r * Math.cos(angle)
        const outerY = cy + r * Math.sin(angle)
        const innerAngle = angle + 36 * Math.PI / 180
        const innerX = cx + r * 0.5 * Math.cos(innerAngle)
        const innerY = cy + r * 0.5 * Math.sin(innerAngle)
        return `${outerX},${outerY} ${innerX},${innerY}`
      }).join(' ')
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><polygon points="${points}" stroke="${foreground}" stroke-width="${strokeWidth}" opacity="${opacity}" fill="none"/></svg>`

    case 'noise':
      // Create a noise pattern using multiple small rectangles
      const noiseElements = Array.from({ length: Math.floor(s * s / 16) }, () => {
        const x = Math.random() * s
        const y = Math.random() * s
        return `<rect x="${x}" y="${y}" width="1" height="1" fill="${foreground}" opacity="${Math.random() * opacity}"/>`
      }).join('')
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}">${noiseElements}</svg>`

    default:
      return ''
  }
}

export default function BackgroundGenerator({ goTo }: { goTo: (path: string) => void }) {
  const [config, setConfig] = useState<PatternConfig>({
    type: 'dots',
    foreground: '#e5e5e5',
    background: '#ffffff',
    size: 20,
    opacity: 1,
    strokeWidth: 1
  })
  const [copied, setCopied] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    document.title = 'Background Pattern Generator - Create CSS Patterns | Beveled'
  }, [])

  const svgPattern = useMemo(() => generatePatternSVG(config), [config])

  const cssCode = useMemo(() => {
    const encodedSVG = encodeURIComponent(svgPattern)
    return `background-color: ${config.background};
background-image: url("data:image/svg+xml,${encodedSVG}");
background-repeat: repeat;`
  }, [svgPattern, config.background])

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(cssCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [cssCode])

  const updateConfig = useCallback((updates: Partial<PatternConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }, [])

  const randomize = useCallback(() => {
    const randomPattern = PATTERNS[Math.floor(Math.random() * PATTERNS.length)]
    const randomColors = COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)]
    setConfig({
      type: randomPattern.type,
      foreground: randomColors.fg,
      background: randomColors.bg,
      size: 10 + Math.floor(Math.random() * 40),
      opacity: 0.3 + Math.random() * 0.7,
      strokeWidth: 1 + Math.floor(Math.random() * 3)
    })
  }, [])

  const downloadAsPNG = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = 1920
    canvas.height = 1080

    // Fill background
    ctx.fillStyle = config.background
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Create pattern image
    const img = new Image()
    const svgBlob = new Blob([svgPattern], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(svgBlob)

    img.onload = () => {
      const pattern = ctx.createPattern(img, 'repeat')
      if (pattern) {
        ctx.fillStyle = pattern
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
      URL.revokeObjectURL(url)

      const link = document.createElement('a')
      link.download = 'pattern-background.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
    }

    img.src = url
  }, [config.background, svgPattern])

  const previewStyle = useMemo(() => ({
    backgroundColor: config.background,
    backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svgPattern)}")`,
    backgroundRepeat: 'repeat'
  }), [config.background, svgPattern])

  return (
    <div className="min-h-screen bg-background">
      <canvas ref={canvasRef} className="hidden" />

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
              <span className="font-semibold">Background Generator</span>
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
              className="aspect-video rounded-xl shadow-2xl border overflow-hidden"
              style={previewStyle}
            />

            {/* Code Preview */}
            <div className="bg-muted rounded-lg p-4 font-mono text-sm">
              <pre className="whitespace-pre-wrap break-all">{cssCode}</pre>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Pattern Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Pattern Type</Label>
                <Button variant="outline" size="sm" onClick={randomize}>
                  <Shuffle className="size-4 mr-2" />
                  Random
                </Button>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {PATTERNS.map(pattern => (
                  <button
                    key={pattern.type}
                    className={`aspect-square rounded-lg border text-xs flex items-center justify-center transition-all ${config.type === pattern.type ? 'border-primary ring-2 ring-primary bg-primary/5' : 'hover:border-primary/50'}`}
                    style={{
                      backgroundColor: config.background,
                      backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(generatePatternSVG({ ...config, type: pattern.type }))}")`,
                      backgroundRepeat: 'repeat'
                    }}
                    onClick={() => updateConfig({ type: pattern.type })}
                    title={pattern.name}
                  />
                ))}
              </div>
            </div>

            {/* Colors */}
            <div className="space-y-3">
              <Label>Colors</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Background</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={config.background}
                      onChange={(e) => updateConfig({ background: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer border-0"
                    />
                    <Input
                      value={config.background}
                      onChange={(e) => updateConfig({ background: e.target.value })}
                      className="font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Foreground</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={config.foreground}
                      onChange={(e) => updateConfig({ foreground: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer border-0"
                    />
                    <Input
                      value={config.foreground}
                      onChange={(e) => updateConfig({ foreground: e.target.value })}
                      className="font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Color Presets */}
              <div className="flex gap-2 flex-wrap">
                {COLOR_PRESETS.map((preset, i) => (
                  <button
                    key={i}
                    className="w-8 h-8 rounded border hover:scale-110 transition-transform"
                    style={{
                      background: `linear-gradient(135deg, ${preset.bg} 50%, ${preset.fg} 50%)`
                    }}
                    onClick={() => updateConfig({ background: preset.bg, foreground: preset.fg })}
                  />
                ))}
              </div>
            </div>

            {/* Size */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Pattern Size</Label>
                <span className="text-sm text-muted-foreground">{config.size}px</span>
              </div>
              <Slider
                value={[config.size]}
                onValueChange={([v]) => updateConfig({ size: v })}
                min={5}
                max={100}
                step={1}
              />
            </div>

            {/* Opacity */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Opacity</Label>
                <span className="text-sm text-muted-foreground">{Math.round(config.opacity * 100)}%</span>
              </div>
              <Slider
                value={[config.opacity]}
                onValueChange={([v]) => updateConfig({ opacity: v })}
                min={0.1}
                max={1}
                step={0.05}
              />
            </div>

            {/* Stroke Width */}
            {config.type !== 'dots' && config.type !== 'noise' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Stroke Width</Label>
                  <span className="text-sm text-muted-foreground">{config.strokeWidth}px</span>
                </div>
                <Slider
                  value={[config.strokeWidth]}
                  onValueChange={([v]) => updateConfig({ strokeWidth: v })}
                  min={0.5}
                  max={5}
                  step={0.5}
                />
              </div>
            )}
          </div>
        </div>

        {/* SEO Content */}
        <section className="mt-16 prose prose-gray dark:prose-invert max-w-none">
          <h1>CSS Background Pattern Generator</h1>
          <p>
            Create beautiful, seamless CSS background patterns with our free online generator. Choose from 15 different pattern types including dots, grids, waves, hexagons, and more. Perfect for adding subtle texture to your website designs.
          </p>

          <h2>Features</h2>
          <ul>
            <li><strong>15 Pattern Types:</strong> Dots, grids, diagonal lines, waves, hexagons, triangles, and more</li>
            <li><strong>Full Customization:</strong> Control colors, size, opacity, and stroke width</li>
            <li><strong>Color Presets:</strong> Quick-start with beautiful color combinations</li>
            <li><strong>Pure CSS Output:</strong> No images required - patterns are generated with inline SVG</li>
            <li><strong>PNG Export:</strong> Download patterns as high-resolution images</li>
            <li><strong>Randomize:</strong> Generate random pattern combinations for inspiration</li>
          </ul>

          <h2>Why Use CSS Patterns?</h2>
          <p>
            CSS patterns offer several advantages over image-based backgrounds:
          </p>
          <ul>
            <li>Infinitely scalable without quality loss</li>
            <li>Smaller file sizes for faster page loads</li>
            <li>Easy to customize colors and properties</li>
            <li>No additional HTTP requests needed</li>
            <li>Perfect for responsive designs</li>
          </ul>
        </section>
      </main>
    </div>
  )
}

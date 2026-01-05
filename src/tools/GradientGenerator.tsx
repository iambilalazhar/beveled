import { useState, useCallback, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Copy,
  Check,
  Plus,
  Trash2,
  Shuffle,
  Download,
  ArrowLeft
} from 'lucide-react'

interface ColorStop {
  id: string
  color: string
  position: number
}

type GradientType = 'linear' | 'radial' | 'conic'

const PRESET_GRADIENTS = [
  { name: 'Sunset', stops: [{ color: '#ff6b6b', position: 0 }, { color: '#feca57', position: 100 }], angle: 135 },
  { name: 'Ocean', stops: [{ color: '#667eea', position: 0 }, { color: '#764ba2', position: 100 }], angle: 135 },
  { name: 'Forest', stops: [{ color: '#11998e', position: 0 }, { color: '#38ef7d', position: 100 }], angle: 135 },
  { name: 'Flamingo', stops: [{ color: '#f093fb', position: 0 }, { color: '#f5576c', position: 100 }], angle: 135 },
  { name: 'Midnight', stops: [{ color: '#232526', position: 0 }, { color: '#414345', position: 100 }], angle: 180 },
  { name: 'Cosmic', stops: [{ color: '#ff00cc', position: 0 }, { color: '#333399', position: 100 }], angle: 135 },
  { name: 'Peach', stops: [{ color: '#ffecd2', position: 0 }, { color: '#fcb69f', position: 100 }], angle: 135 },
  { name: 'Aurora', stops: [{ color: '#00c6fb', position: 0 }, { color: '#005bea', position: 50 }, { color: '#6a11cb', position: 100 }], angle: 135 },
  { name: 'Fire', stops: [{ color: '#f12711', position: 0 }, { color: '#f5af19', position: 100 }], angle: 45 },
  { name: 'Lavender', stops: [{ color: '#e0c3fc', position: 0 }, { color: '#8ec5fc', position: 100 }], angle: 120 },
  { name: 'Mojave', stops: [{ color: '#1e3c72', position: 0 }, { color: '#2a5298', position: 50 }, { color: '#e65c00', position: 100 }], angle: 180 },
  { name: 'Northern Lights', stops: [{ color: '#43cea2', position: 0 }, { color: '#185a9d', position: 100 }], angle: 135 },
]

function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

function randomColor() {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
}

export default function GradientGenerator({ goTo }: { goTo: (path: string) => void }) {
  const [gradientType, setGradientType] = useState<GradientType>('linear')
  const [angle, setAngle] = useState(135)
  const [colorStops, setColorStops] = useState<ColorStop[]>([
    { id: generateId(), color: '#667eea', position: 0 },
    { id: generateId(), color: '#764ba2', position: 100 }
  ])
  const [copied, setCopied] = useState(false)
  const [selectedStop, setSelectedStop] = useState<string | null>(null)

  useEffect(() => {
    document.title = 'CSS Gradient Generator - Create Beautiful Gradients | Beveled'
  }, [])

  const gradientCSS = useMemo(() => {
    const sortedStops = [...colorStops].sort((a, b) => a.position - b.position)
    const stopsStr = sortedStops.map(s => `${s.color} ${s.position}%`).join(', ')

    switch (gradientType) {
      case 'linear':
        return `linear-gradient(${angle}deg, ${stopsStr})`
      case 'radial':
        return `radial-gradient(circle, ${stopsStr})`
      case 'conic':
        return `conic-gradient(from ${angle}deg, ${stopsStr})`
      default:
        return `linear-gradient(${angle}deg, ${stopsStr})`
    }
  }, [gradientType, angle, colorStops])

  const fullCSS = useMemo(() => {
    return `background: ${colorStops[0]?.color || '#667eea'};\nbackground: ${gradientCSS};`
  }, [gradientCSS, colorStops])

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(fullCSS)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [fullCSS])

  const addColorStop = useCallback(() => {
    const newPosition = colorStops.length > 0
      ? Math.min(100, Math.max(0, (colorStops[colorStops.length - 1].position + 50) / 2))
      : 50
    setColorStops(prev => [...prev, {
      id: generateId(),
      color: randomColor(),
      position: newPosition
    }])
  }, [colorStops])

  const removeColorStop = useCallback((id: string) => {
    if (colorStops.length <= 2) return
    setColorStops(prev => prev.filter(s => s.id !== id))
  }, [colorStops.length])

  const updateColorStop = useCallback((id: string, updates: Partial<ColorStop>) => {
    setColorStops(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
  }, [])

  const randomizeGradient = useCallback(() => {
    const numStops = 2 + Math.floor(Math.random() * 3)
    const newStops: ColorStop[] = []
    for (let i = 0; i < numStops; i++) {
      newStops.push({
        id: generateId(),
        color: randomColor(),
        position: Math.round((i / (numStops - 1)) * 100)
      })
    }
    setColorStops(newStops)
    setAngle(Math.floor(Math.random() * 360))
  }, [])

  const applyPreset = useCallback((preset: typeof PRESET_GRADIENTS[0]) => {
    setColorStops(preset.stops.map(s => ({ ...s, id: generateId() })))
    setAngle(preset.angle)
    setGradientType('linear')
  }, [])

  const downloadAsPNG = useCallback(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1920
    canvas.height = 1080
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const sortedStops = [...colorStops].sort((a, b) => a.position - b.position)

    let gradient: CanvasGradient
    if (gradientType === 'linear') {
      const angleRad = (angle - 90) * Math.PI / 180
      const x1 = canvas.width / 2 - Math.cos(angleRad) * canvas.width
      const y1 = canvas.height / 2 - Math.sin(angleRad) * canvas.height
      const x2 = canvas.width / 2 + Math.cos(angleRad) * canvas.width
      const y2 = canvas.height / 2 + Math.sin(angleRad) * canvas.height
      gradient = ctx.createLinearGradient(x1, y1, x2, y2)
    } else if (gradientType === 'radial') {
      gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
      )
    } else {
      // Conic gradient approximation
      gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    }

    sortedStops.forEach(stop => {
      gradient.addColorStop(stop.position / 100, stop.color)
    })

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const link = document.createElement('a')
    link.download = 'gradient.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, [gradientType, angle, colorStops])

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
              <span className="font-semibold">Gradient Generator</span>
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
              style={{ background: gradientCSS }}
            />

            {/* Gradient Bar with Stops */}
            <div className="relative h-12 rounded-lg overflow-hidden border" style={{ background: gradientCSS }}>
              {colorStops.map(stop => (
                <button
                  key={stop.id}
                  className={`absolute top-0 w-4 h-full -translate-x-1/2 border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform ${selectedStop === stop.id ? 'ring-2 ring-primary' : ''}`}
                  style={{
                    left: `${stop.position}%`,
                    backgroundColor: stop.color
                  }}
                  onClick={() => setSelectedStop(stop.id)}
                />
              ))}
            </div>

            {/* Code Preview */}
            <div className="bg-muted rounded-lg p-4 font-mono text-sm">
              <pre className="whitespace-pre-wrap break-all">{fullCSS}</pre>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Gradient Type */}
            <Tabs value={gradientType} onValueChange={(v) => setGradientType(v as GradientType)}>
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="linear">Linear</TabsTrigger>
                <TabsTrigger value="radial">Radial</TabsTrigger>
                <TabsTrigger value="conic">Conic</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Angle Control */}
            {(gradientType === 'linear' || gradientType === 'conic') && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Angle</Label>
                  <span className="text-sm text-muted-foreground">{angle}°</span>
                </div>
                <Slider
                  value={[angle]}
                  onValueChange={([v]) => setAngle(v)}
                  max={360}
                  step={1}
                />
              </div>
            )}

            {/* Color Stops */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Color Stops</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={randomizeGradient}>
                    <Shuffle className="size-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={addColorStop}>
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {colorStops.map((stop) => (
                  <div key={stop.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <input
                      type="color"
                      value={stop.color}
                      onChange={(e) => updateColorStop(stop.id, { color: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer border-0"
                    />
                    <Input
                      value={stop.color}
                      onChange={(e) => updateColorStop(stop.id, { color: e.target.value })}
                      className="font-mono w-28"
                    />
                    <div className="flex-1">
                      <Slider
                        value={[stop.position]}
                        onValueChange={([v]) => updateColorStop(stop.id, { position: v })}
                        max={100}
                        step={1}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-12 text-right">{stop.position}%</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeColorStop(stop.id)}
                      disabled={colorStops.length <= 2}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Presets */}
            <div className="space-y-3">
              <Label>Presets</Label>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_GRADIENTS.map((preset, idx) => (
                  <button
                    key={idx}
                    className="aspect-square rounded-lg border hover:scale-105 transition-transform shadow-sm"
                    style={{
                      background: `linear-gradient(${preset.angle}deg, ${preset.stops.map(s => `${s.color} ${s.position}%`).join(', ')})`
                    }}
                    onClick={() => applyPreset(preset)}
                    title={preset.name}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SEO Content */}
        <section className="mt-16 prose prose-gray dark:prose-invert max-w-none">
          <h1>CSS Gradient Generator</h1>
          <p>
            Create beautiful CSS gradients with our free online gradient generator. Build linear, radial, and conic gradients with an intuitive visual editor. Perfect for web designers and developers looking to add stunning color transitions to their projects.
          </p>

          <h2>Features</h2>
          <ul>
            <li><strong>Multiple Gradient Types:</strong> Create linear, radial, and conic gradients</li>
            <li><strong>Unlimited Color Stops:</strong> Add as many colors as you need</li>
            <li><strong>Preset Library:</strong> Start with beautiful pre-made gradients</li>
            <li><strong>One-Click Copy:</strong> Copy CSS code instantly to your clipboard</li>
            <li><strong>Download as PNG:</strong> Export your gradient as a high-resolution image</li>
            <li><strong>Random Generator:</strong> Get creative inspiration with random gradients</li>
          </ul>

          <h2>How to Use</h2>
          <ol>
            <li>Choose your gradient type (linear, radial, or conic)</li>
            <li>Adjust the angle using the slider</li>
            <li>Click on color stops to modify colors and positions</li>
            <li>Add or remove color stops as needed</li>
            <li>Copy the CSS code or download as an image</li>
          </ol>
        </section>
      </main>
    </div>
  )
}

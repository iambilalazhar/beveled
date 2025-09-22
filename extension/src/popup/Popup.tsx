import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ThemeToggle } from '@/components/theme-toggle'
import { Camera, Monitor, Smartphone, Tablet, Globe } from 'lucide-react'

interface CaptureOptions {
  type: 'visible' | 'fullpage' | 'viewport'
  viewport?: {
    width: number
    height: number
    deviceScaleFactor?: number
    isMobile?: boolean
  }
}

interface ViewportPreset {
  name: string
  width: number
  height: number
  deviceScaleFactor: number
  isMobile: boolean
  icon: React.ComponentType<{ className?: string }>
}

const VIEWPORT_PRESETS: Record<string, ViewportPreset> = {
  'mobile-portrait': {
    name: 'Mobile Portrait (375×812)',
    width: 375,
    height: 812,
    deviceScaleFactor: 3,
    isMobile: true,
    icon: Smartphone
  },
  'mobile-landscape': {
    name: 'Mobile Landscape (812×375)', 
    width: 812,
    height: 375,
    deviceScaleFactor: 3,
    isMobile: true,
    icon: Smartphone
  },
  'tablet-portrait': {
    name: 'Tablet Portrait (768×1024)',
    width: 768,
    height: 1024,
    deviceScaleFactor: 2,
    isMobile: true,
    icon: Tablet
  },
  'tablet-landscape': {
    name: 'Tablet Landscape (1024×768)',
    width: 1024,
    height: 768,
    deviceScaleFactor: 2,
    isMobile: true,
    icon: Tablet
  },
  'desktop-small': {
    name: 'Desktop Small (1366×768)',
    width: 1366,
    height: 768,
    deviceScaleFactor: 1,
    isMobile: false,
    icon: Monitor
  },
  'desktop-medium': {
    name: 'Desktop Medium (1920×1080)',
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    isMobile: false,
    icon: Monitor
  },
  'desktop-large': {
    name: 'Desktop Large (2560×1440)',
    width: 2560,
    height: 1440,
    deviceScaleFactor: 1,
    isMobile: false,
    icon: Monitor
  }
}

export default function Popup() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [captureType, setCaptureType] = useState<'visible' | 'fullpage' | 'viewport'>('visible')
  const [selectedPreset, setSelectedPreset] = useState<string>('mobile-portrait')

  const onCapture = async (options?: CaptureOptions) => {
    setError(null)
    setLoading(true)
    try {
      const captureOptions = options || { type: captureType }
      
      if (captureType === 'viewport' && !options) {
        const preset = VIEWPORT_PRESETS[selectedPreset]
        captureOptions.viewport = {
          width: preset.width,
          height: preset.height,
          deviceScaleFactor: preset.deviceScaleFactor,
          isMobile: preset.isMobile
        }
      }

      const res = await chrome.runtime.sendMessage({ 
        type: 'CAPTURE_SCREENSHOT',
        options: captureOptions
      })
      if (!res?.ok) throw new Error(res?.error || 'Unknown error')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const getCaptureButtonText = () => {
    if (loading) return 'Capturing…'
    
    switch (captureType) {
      case 'visible':
        return 'Capture Visible Area'
      case 'fullpage':
        return 'Capture Full Page'
      case 'viewport': {
        const preset = VIEWPORT_PRESETS[selectedPreset]
        return `Capture ${preset.name.split(' (')[0]}`
      }
      default:
        return 'Capture Screenshot'
    }
  }

  const getIcon = () => {
    switch (captureType) {
      case 'fullpage':
        return Globe
      case 'viewport':
        return VIEWPORT_PRESETS[selectedPreset]?.icon || Camera
      default:
        return Camera
    }
  }

  const Icon = getIcon()

  return (
    <div className="w-[380px] p-3">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="size-4 text-blue-600" />
              <CardTitle className="text-base">Good Screenshots</CardTitle>
            </div>
            <ThemeToggle />
          </div>
          <CardDescription>
            Choose capture type and device resolution.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Capture Type</label>
            <Select value={captureType} onValueChange={(value: 'visible' | 'fullpage' | 'viewport') => setCaptureType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="visible">
                  <div className="flex items-center gap-2">
                    <Camera className="size-4" />
                    <span>Visible Area</span>
                  </div>
                </SelectItem>
                <SelectItem value="fullpage">
                  <div className="flex items-center gap-2">
                    <Globe className="size-4" />
                    <span>Full Page</span>
                  </div>
                </SelectItem>
                <SelectItem value="viewport">
                  <div className="flex items-center gap-2">
                    <Monitor className="size-4" />
                    <span>Device Viewport</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {captureType === 'viewport' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Device Resolution</label>
              <Select value={selectedPreset} onValueChange={setSelectedPreset}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(VIEWPORT_PRESETS).map(([key, preset]) => {
                    const PresetIcon = preset.icon
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <PresetIcon className="size-4" />
                          <span>{preset.name}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button onClick={() => onCapture()} disabled={loading} className="w-full">
            <Icon className="size-4 mr-2" />
            {getCaptureButtonText()}
          </Button>

          {error && (
            <div className="mt-2 p-2 text-sm text-red-600 bg-red-50 rounded border">
              {error}
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground font-medium">Quick Actions</p>
            <div className="grid grid-cols-3 gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onCapture({ type: 'viewport', viewport: { width: 375, height: 812, deviceScaleFactor: 3, isMobile: true } })}
                disabled={loading}
                className="text-xs"
              >
                <Smartphone className="size-3 mr-1" />
                Mobile
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onCapture({ type: 'viewport', viewport: { width: 768, height: 1024, deviceScaleFactor: 2, isMobile: true } })}
                disabled={loading}
                className="text-xs"
              >
                <Tablet className="size-3 mr-1" />
                Tablet
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCapture({ type: 'viewport', viewport: { width: 1920, height: 1080, deviceScaleFactor: 1, isMobile: false } })}
                disabled={loading}
                className="text-xs"
              >
                <Monitor className="size-3 mr-1" />
                Desktop
              </Button>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Tip: Ensure the tab you want is focused before capturing.
          </p>
        </CardContent>
        <CardFooter className="justify-between text-[11px] text-muted-foreground">
          <span>v0.2</span>
          <a href="https://ui.shadcn.com" target="_blank" rel="noreferrer" className="hover:underline">Powered by shadcn/ui</a>
        </CardFooter>
      </Card>
    </div>
  )
}

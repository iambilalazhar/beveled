import * as React from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, Download } from 'lucide-react'

type ShadowPreset = {
  id: string
  label: string
  description: string
  config: {
    enabled: boolean
    color: string
    opacity: number
    blur: number
    offsetX: number
    offsetY: number
  }
}

const SHADOW_PRESETS: ShadowPreset[] = [
  {
    id: 'off',
    label: 'No Shadow',
    description: 'Keep things flat and minimal.',
    config: { enabled: false, color: '#000000', opacity: 0.1, blur: 0, offsetX: 0, offsetY: 0 },
  },
  {
    id: 'soft',
    label: 'Soft Lift',
    description: 'Feathered ambient glow ideal for UI shots.',
    config: { enabled: true, color: '#0f172a', opacity: 0.22, blur: 40, offsetX: 0, offsetY: 22 },
  },
  {
    id: 'dramatic',
    label: 'Studio Drop',
    description: 'Directional light with crisp edges.',
    config: { enabled: true, color: '#0b1120', opacity: 0.28, blur: 28, offsetX: 8, offsetY: 32 },
  },
  {
    id: 'glow',
    label: 'Vivid Glow',
    description: 'Colorful halo for marketing shots.',
    config: { enabled: true, color: '#38bdf8', opacity: 0.35, blur: 48, offsetX: 0, offsetY: 12 },
  },
  {
    id: 'long',
    label: 'Long Shadow',
    description: 'Stylized cinematic stretch.',
    config: { enabled: true, color: '#0f172a', opacity: 0.2, blur: 26, offsetX: 40, offsetY: 60 },
  },
]

const hexToRgba = (hex: string, alpha: number): string => {
  const normalized = hex.replace('#', '')
  const parse = (segment: string) => parseInt(segment, 16)
  const r = normalized.length === 3 ? parse(normalized[0] + normalized[0]) : parse(normalized.slice(0, 2))
  const g = normalized.length === 3 ? parse(normalized[1] + normalized[1]) : parse(normalized.slice(2, 4))
  const b = normalized.length === 3 ? parse(normalized[2] + normalized[2]) : parse(normalized.slice(4, 6))
  return `rgba(${r}, ${g}, ${b}, ${Math.min(1, Math.max(0, alpha))})`
}

export type LinearGradient = { type: 'linear'; angle: number; stops: { color: string; pos: number }[] }
export type Solid = { type: 'solid'; color: string }
export type Pattern = {
  type: 'pattern'
  name: 'dots' | 'grid' | 'diagonal' | 'wave' | 'icons' | 'cross' | 'crosshatch' | 'hex' | 'zigzag' | 'plus' | 'noise' | 'circuit' | 'chevron' | 'stars' | 'sprinkles' | 'herringbone'
  fg: string
  bg: string
  scale: number
}
export type BgPreset = LinearGradient | Solid | Pattern
export type WindowStyle = 'regular' | 'notch' | 'title'
export type ShadowStrength = 'off' | 'subtle' | 'medium' | 'strong'
export type CanvasPresetId = 'auto' | 'square-1080' | 'desktop-1600x900' | 'hd-1920x1080' | 'custom'
export type CanvasSize = { width: number; height: number }

export function AppSidebar({
  solidPresets,
  gradientPresets,
  defaultPattern,
  bgPreset,
  setBgPreset,
  padding,
  setPadding,
  windowStyle,
  setWindowStyle,
  windowBarColor,
  setWindowBarColor,
  showWindow,
  setShowWindow,
  shadowEnabled,
  setShadowEnabled,
  shadowColor,
  setShadowColor,
  shadowOpacity,
  setShadowOpacity,
  shadowBlur,
  setShadowBlur,
  shadowOffsetX,
  setShadowOffsetX,
  shadowOffsetY,
  setShadowOffsetY,
  cornerRadius,
  setCornerRadius,
  imageScale,
  setImageScale,
  targetWidth,
  setTargetWidth,
  canvasPreset,
  setCanvasPreset,
  customCanvasSize,
  setCustomCanvasSize,
  onDownload,
  exportSettings,
  onChangeExportSettings,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  solidPresets: string[]
  gradientPresets: LinearGradient[]
  defaultPattern: Pattern
  bgPreset: BgPreset
  setBgPreset: (p: BgPreset) => void
  padding: { x: number; y: number }
  setPadding: (updater: (p: { x: number; y: number }) => { x: number; y: number }) => void
  windowStyle: WindowStyle
  setWindowStyle: (v: WindowStyle) => void
  windowBarColor: string
  setWindowBarColor: (v: string) => void
  showWindow: boolean
  setShowWindow: (v: boolean) => void
  shadowEnabled: boolean
  setShadowEnabled: (v: boolean) => void
  shadowColor: string
  setShadowColor: (v: string) => void
  shadowOpacity: number
  setShadowOpacity: (v: number) => void
  shadowBlur: number
  setShadowBlur: (v: number) => void
  shadowOffsetX: number
  setShadowOffsetX: (v: number) => void
  shadowOffsetY: number
  setShadowOffsetY: (v: number) => void
  cornerRadius: number
  setCornerRadius: (v: number) => void
  imageScale: number
  setImageScale: (v: number) => void
  targetWidth: number | null
  setTargetWidth: (v: number | null) => void
  canvasPreset: CanvasPresetId
  setCanvasPreset: React.Dispatch<React.SetStateAction<CanvasPresetId>>
  customCanvasSize: CanvasSize
  setCustomCanvasSize: React.Dispatch<React.SetStateAction<CanvasSize>>
  onDownload: () => void
  exportSettings: { format: 'png' | 'jpeg'; quality: number; scale: number }
  onChangeExportSettings: (patch: Partial<{ format: 'png' | 'jpeg'; quality: number; scale: number }>) => void
}) {
  const [shadowAdvancedOpen, setShadowAdvancedOpen] = React.useState(false)

  const approxEqual = React.useCallback((a: number, b: number) => Math.abs(a - b) < 0.015, [])

  const activeShadowPresetId = React.useMemo(() => {
    return SHADOW_PRESETS.find((preset) => {
      const cfg = preset.config
      return (
        shadowEnabled === cfg.enabled &&
        approxEqual(shadowOpacity, cfg.opacity) &&
        approxEqual(shadowBlur, cfg.blur) &&
        approxEqual(shadowOffsetX, cfg.offsetX) &&
        approxEqual(shadowOffsetY, cfg.offsetY) &&
        shadowColor.toLowerCase() === cfg.color.toLowerCase()
      )
    })?.id
  }, [shadowEnabled, shadowOpacity, shadowBlur, shadowOffsetX, shadowOffsetY, shadowColor, approxEqual])

  const applyShadowPreset = React.useCallback((preset: ShadowPreset) => {
    const { config } = preset
    setShadowEnabled(config.enabled)
    setShadowColor(config.color)
    setShadowOpacity(config.opacity)
    setShadowBlur(config.blur)
    setShadowOffsetX(config.offsetX)
    setShadowOffsetY(config.offsetY)
  }, [setShadowBlur, setShadowColor, setShadowEnabled, setShadowOffsetX, setShadowOffsetY, setShadowOpacity])

  const handleShadowToggle = React.useCallback((checked: boolean) => {
    if (checked) {
      const fallback = SHADOW_PRESETS.find((p) => p.id === 'soft') ?? SHADOW_PRESETS[1]
      applyShadowPreset(fallback)
    } else {
      const offPreset = SHADOW_PRESETS.find((p) => p.id === 'off') ?? SHADOW_PRESETS[0]
      applyShadowPreset(offPreset)
    }
  }, [applyShadowPreset])

  const getPresetShadowCss = React.useCallback((preset: ShadowPreset) => {
    if (!preset.config.enabled) return 'none'
    const { offsetX, offsetY, blur, color, opacity } = preset.config
    return `${offsetX}px ${offsetY}px ${blur}px ${hexToRgba(color, opacity)}`
  }, [])
  return (
    <Sidebar {...props} variant="inset">
      <SidebarContent>
        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="px-4 py-2 text-sm font-medium flex items-center">
                Size
                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent className="space-y-4 px-4 pb-2">
                <div className="space-y-2">
                  <Label>Scale: {Math.round(imageScale * 100)}%</Label>
                  <Slider min={10} max={300} step={1} value={[Math.round(imageScale * 100)]} onValueChange={(v) => setImageScale((v[0] ?? 100) / 100)} />
                </div>
                <div className="space-y-2">
                  <Label>Canvas size</Label>
                  <Select value={canvasPreset} onValueChange={(value) => setCanvasPreset(value as CanvasPresetId)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto (fit content)</SelectItem>
                      <SelectItem value="square-1080">Square 1080 x 1080</SelectItem>
                      <SelectItem value="desktop-1600x900">Desktop 1600 x 900</SelectItem>
                      <SelectItem value="hd-1920x1080">HD 1920 x 1080</SelectItem>
                      <SelectItem value="custom">Custom…</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Canvas expands automatically if the image exceeds the selected size.</p>
                </div>
                {canvasPreset === 'custom' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="canvas-width">Width</Label>
                      <Input
                        id="canvas-width"
                        type="number"
                        min={320}
                        max={6000}
                        value={customCanvasSize.width}
                        onChange={(e) => {
                          const val = Number(e.currentTarget.value)
                          if (Number.isNaN(val)) return
                          const next = Math.min(6000, Math.max(320, Math.round(val)))
                          setCustomCanvasSize((prev) => ({ ...prev, width: next }))
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="canvas-height">Height</Label>
                      <Input
                        id="canvas-height"
                        type="number"
                        min={320}
                        max={6000}
                        value={customCanvasSize.height}
                        onChange={(e) => {
                          const val = Number(e.currentTarget.value)
                          if (Number.isNaN(val)) return
                          const next = Math.min(6000, Math.max(320, Math.round(val)))
                          setCustomCanvasSize((prev) => ({ ...prev, height: next }))
                        }}
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Width (px)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      className="w-40"
                      type="number"
                      min={1}
                      step={1}
                      value={targetWidth ?? ''}
                      placeholder="auto"
                      onChange={(e) => {
                        const val = e.currentTarget.value
                        if (val === '') setTargetWidth(null)
                        else setTargetWidth(Math.max(1, Math.floor(Number(val))))
                      }}
                    />
                    <Button variant="outline" size="sm" onClick={() => setTargetWidth(null)}>Auto</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Height adjusts automatically to preserve aspect ratio.</p>
                </div>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
        <SidebarSeparator />
        <Collapsible className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="px-4 py-2 text-sm font-medium flex items-center">
                Background
                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent className="px-4 pb-2 space-y-3">
                <Tabs
                  value={bgPreset.type}
                  onValueChange={(v) => {
                    if (v === 'solid') setBgPreset({ type: 'solid', color: solidPresets[0] })
                    if (v === 'linear') setBgPreset(gradientPresets[0])
                    if (v === 'pattern') setBgPreset(defaultPattern)
                  }}
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="solid">Solid</TabsTrigger>
                    <TabsTrigger value="linear">Gradient</TabsTrigger>
                    <TabsTrigger value="pattern">Pattern</TabsTrigger>
                  </TabsList>
                  <TabsContent value="solid" className="mt-3">
                    <div className="grid grid-cols-6 gap-2">
                      {solidPresets.map((c) => (
                        <button
                          key={c}
                          className={cn('h-7 w-7 rounded border', bgPreset.type === 'solid' && (bgPreset as Solid).color === c ? 'ring-2 ring-blue-500' : '')}
                          style={{ background: c }}
                          onClick={() => setBgPreset({ type: 'solid', color: c })}
                          aria-label={`Color ${c}`}
                        />
                      ))}
                      <label className="h-7 w-7 rounded border inline-flex items-center justify-center cursor-pointer">
                        <input type="color" className="absolute h-0 w-0 opacity-0" onChange={(e) => setBgPreset({ type: 'solid', color: e.target.value })} />
                        <span className="text-[10px] text-muted-foreground">+</span>
                      </label>
                    </div>
                  </TabsContent>
                  <TabsContent value="linear" className="mt-3 space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      {gradientPresets.map((g, i) => {
                        const css = `linear-gradient(${g.angle}deg, ${g.stops.map(s => `${s.color} ${Math.round(s.pos * 100)}%`).join(', ')})`
                        const selected = bgPreset.type === 'linear' && JSON.stringify(bgPreset) === JSON.stringify(g)
                        return (
                          <button
                            key={i}
                            className={cn('h-12 rounded border', selected ? 'ring-2 ring-blue-500' : '')}
                            style={{ backgroundImage: css }}
                            onClick={() => setBgPreset(g)}
                          />
                        )
                      })}
                    </div>
                    {bgPreset.type === 'linear' && (
                      <div className="space-y-2">
                        <Label>Angle: {bgPreset.angle}°</Label>
                        <Slider max={360} step={1} value={[bgPreset.angle]} onValueChange={(v) => setBgPreset({ ...bgPreset, angle: v[0] ?? bgPreset.angle })} />
                      </div>
                    )}
                    {bgPreset.type === 'linear' && (
                      <div className="space-y-2">
                        <Label>Stops</Label>
                        <div className="space-y-3">
                          {bgPreset.stops.map((s, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                              <input type="color" value={s.color} onChange={(e) => {
                                const stops = [...bgPreset.stops]
                                stops[idx] = { ...stops[idx], color: e.target.value }
                                setBgPreset({ ...bgPreset, stops })
                              }} />
                              <Slider className="flex-1" max={100} step={1} value={[Math.round(s.pos * 100)]} onValueChange={(v) => {
                                const stops = [...bgPreset.stops]
                                stops[idx] = { ...stops[idx], pos: (v[0] ?? Math.round(s.pos * 100)) / 100 }
                                setBgPreset({ ...bgPreset, stops })
                              }} />
                              <Button variant="outline" size="sm" onClick={() => {
                                if (bgPreset.stops.length <= 2) return
                                const stops = bgPreset.stops.filter((_, i) => i !== idx)
                                setBgPreset({ ...bgPreset, stops })
                              }}>Remove</Button>
                            </div>
                          ))}
                        </div>
                        <div className="pt-1">
                          <Button variant="outline" size="sm" onClick={() => {
                            if (bgPreset.type !== 'linear') return
                            if (bgPreset.stops.length >= 5) return
                            const stops = [...bgPreset.stops, { color: '#ffffff', pos: 0.5 }]
                            setBgPreset({ ...bgPreset, stops })
                          }}>Add Stop</Button>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="pattern" className="mt-3 space-y-3">
                    <div className="space-y-2">
                      <Label>Pattern</Label>
                      <Select
                        value={bgPreset.type === 'pattern' ? bgPreset.name : 'dots'}
                        onValueChange={(name) => {
                          const base = bgPreset.type === 'pattern' ? bgPreset : defaultPattern
                          setBgPreset({ type: 'pattern', name: name as Pattern['name'], fg: base.fg, bg: base.bg, scale: base.scale })
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(['dots','grid','diagonal','wave','icons','cross','crosshatch','hex','zigzag','plus','noise','circuit','chevron','stars','sprinkles','herringbone'] as const).map((name) => (
                            <SelectItem key={name} value={name}>{name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {bgPreset.type === 'pattern' && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label>Foreground</Label>
                            <input type="color" value={bgPreset.fg} onChange={(e) => setBgPreset({ ...bgPreset, fg: e.target.value })} />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Background</Label>
                            <input type="color" value={bgPreset.bg} onChange={(e) => setBgPreset({ ...bgPreset, bg: e.target.value })} />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Scale: {bgPreset.scale}px</Label>
                          <Slider min={8} max={64} step={1} value={[bgPreset.scale]} onValueChange={(v) => setBgPreset({ ...bgPreset, scale: v[0] ?? bgPreset.scale })} />
                        </div>
                      </>
                    )}
                  </TabsContent>
                </Tabs>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
        <SidebarSeparator />
        <Collapsible className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="px-4 py-2 text-sm font-medium flex items-center">
                Padding
                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent className="space-y-4 px-4 pb-2">
                <div className="space-y-2">
                  <Label>Horizontal: {padding.x}px</Label>
                  <Slider max={200} step={1} value={[padding.x]} onValueChange={(v) => setPadding((p) => ({ ...p, x: v[0] ?? p.x }))} />
                </div>
                <div className="space-y-2">
                  <Label>Vertical: {padding.y}px</Label>
                  <Slider max={200} step={1} value={[padding.y]} onValueChange={(v) => setPadding((p) => ({ ...p, y: v[0] ?? p.y }))} />
                </div>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
        <SidebarSeparator />
        <Collapsible className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="px-4 py-2 text-sm font-medium flex items-center">
                Window
                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent className="space-y-4 px-4 pb-2">
                <div className="space-y-2">
                  <Label>Style</Label>
                  <Select value={windowStyle} onValueChange={(v) => setWindowStyle(v as WindowStyle)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="notch">Notch</SelectItem>
                      <SelectItem value="title">Title only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Corner radius: {cornerRadius}px</Label>
                  <Slider max={40} min={0} step={1} value={[cornerRadius]} onValueChange={(v) => setCornerRadius(v[0] ?? cornerRadius)} />
                </div>
                <div className="space-y-2">
                  <Label>Bar color</Label>
                  <div className="grid grid-cols-6 gap-2">
                    {['#1f2937', '#111827', '#374151', '#e5e7eb', '#f3f4f6', '#0f172a'].map((c) => (
                      <button key={c} className={cn('h-7 w-7 rounded border', windowBarColor === c ? 'ring-2 ring-blue-500' : '')} style={{ background: c }} onClick={() => setWindowBarColor(c)} />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={showWindow} onCheckedChange={setShowWindow} id="win" />
                  <Label htmlFor="win">Show window frame</Label>
                </div>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
        <SidebarSeparator />
        <Collapsible className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="px-4 py-2 text-sm font-medium flex items-center">
                Effects
                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent className="space-y-4 px-4 pb-2">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Label htmlFor="shadow-enabled" className="text-sm font-medium">Drop shadow</Label>
                      <p className="text-xs text-muted-foreground">Add depth instantly with curated looks.</p>
                    </div>
                    <Switch checked={shadowEnabled} onCheckedChange={handleShadowToggle} id="shadow-enabled" />
                  </div>

                  <div className="grid gap-2">
                    {SHADOW_PRESETS.map((preset) => {
                      const isSelected = activeShadowPresetId === preset.id || (!activeShadowPresetId && !shadowEnabled && preset.id === 'off')
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          className={cn(
                            'rounded-md border px-3 py-2 text-left transition-all hover:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60',
                            isSelected ? 'border-blue-500 bg-blue-500/10' : 'border-border bg-background/60'
                          )}
                          onClick={() => applyShadowPreset(preset)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-16 items-center justify-center rounded-md bg-muted">
                              <div
                                className="h-7 w-12 rounded-md border border-border/70 bg-white"
                                style={{ boxShadow: preset.config.enabled ? getPresetShadowCss(preset) : 'none' }}
                              />
                            </div>
                            <div>
                              <div className="text-sm font-medium leading-none">{preset.label}</div>
                              <p className="text-xs text-muted-foreground leading-snug mt-1">{preset.description}</p>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {shadowEnabled && (
                    <Collapsible open={shadowAdvancedOpen} onOpenChange={setShadowAdvancedOpen} className="pt-1">
                      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm">
                        <span>Fine-tune shadow</span>
                        <ChevronDown className={cn('size-4 transition-transform', shadowAdvancedOpen ? 'rotate-180' : '')} />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-3 pt-3">
                        <div className="grid grid-cols-2 gap-3 items-center">
                          <Label>Color</Label>
                          <input
                            type="color"
                            value={shadowColor}
                            onChange={(e) => setShadowColor(e.target.value)}
                            className="h-8 w-full cursor-pointer rounded border"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Opacity: {Math.round(shadowOpacity * 100)}%</Label>
                          <Slider
                            min={0}
                            max={100}
                            step={1}
                            value={[Math.round(shadowOpacity * 100)]}
                            onValueChange={(v) => setShadowOpacity((v[0] ?? 0) / 100)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Blur: {shadowBlur}px</Label>
                          <Slider
                            min={0}
                            max={96}
                            step={1}
                            value={[shadowBlur]}
                            onValueChange={(v) => setShadowBlur(v[0] ?? shadowBlur)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Offset X: {shadowOffsetX}px</Label>
                          <Slider
                            min={-80}
                            max={80}
                            step={1}
                            value={[shadowOffsetX]}
                            onValueChange={(v) => setShadowOffsetX(v[0] ?? shadowOffsetX)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Offset Y: {shadowOffsetY}px</Label>
                          <Slider
                            min={-80}
                            max={80}
                            step={1}
                            value={[shadowOffsetY]}
                            onValueChange={(v) => setShadowOffsetY(v[0] ?? shadowOffsetY)}
                          />
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </div>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
        <SidebarSeparator />
        <Collapsible className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="px-4 py-2 text-sm font-medium flex items-center">
                Export
                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent className="space-y-4 px-4 pb-2">
                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select value={exportSettings.format} onValueChange={(value) => onChangeExportSettings({ format: value as 'png' | 'jpeg' })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="png">PNG (lossless)</SelectItem>
                      <SelectItem value="jpeg">JPEG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {exportSettings.format === 'jpeg' && (
                  <div className="space-y-2">
                    <Label>Quality: {Math.round(exportSettings.quality * 100)}%</Label>
                    <Slider
                      min={60}
                      max={100}
                      step={1}
                      value={[Math.round(exportSettings.quality * 100)]}
                      onValueChange={(v) => onChangeExportSettings({ quality: (v[0] ?? Math.round(exportSettings.quality * 100)) / 100 })}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Scale</Label>
                  <Select value={exportSettings.scale.toString()} onValueChange={(value) => onChangeExportSettings({ scale: Number(value) || 1 })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1× (preview size)</SelectItem>
                      <SelectItem value="1.5">1.5×</SelectItem>
                      <SelectItem value="2">2×</SelectItem>
                      <SelectItem value="3">3×</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Exports at a higher resolution without modifying the canvas preview.</p>
                </div>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <Button 
          onClick={onDownload} 
          size="lg" 
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
        >
          <Download className="w-4 h-4" />
          Download Screenshot
        </Button>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

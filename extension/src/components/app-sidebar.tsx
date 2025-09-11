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
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
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
import { ChevronDown } from 'lucide-react'

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
  onDownload,
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
  onDownload: () => void
}) {
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
                  <div className="flex items-center gap-3">
                    <Switch checked={shadowEnabled} onCheckedChange={setShadowEnabled} id="shadow-enabled" />
                    <Label htmlFor="shadow-enabled">Drop shadow</Label>
                  </div>
                  
                  {shadowEnabled && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          variant={shadowOffsetX === 0 && shadowOffsetY === 2 && shadowBlur === 8 ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setShadowOffsetX(0)
                            setShadowOffsetY(2)
                            setShadowBlur(8)
                            setShadowOpacity(0.1)
                          }}
                        >
                          Subtle
                        </Button>
                        <Button
                          variant={shadowOffsetX === 0 && shadowOffsetY === 4 && shadowBlur === 16 ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setShadowOffsetX(0)
                            setShadowOffsetY(4)
                            setShadowBlur(16)
                            setShadowOpacity(0.15)
                          }}
                        >
                          Medium
                        </Button>
                        <Button
                          variant={shadowOffsetX === 0 && shadowOffsetY === 8 && shadowBlur === 24 ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setShadowOffsetX(0)
                            setShadowOffsetY(8)
                            setShadowBlur(24)
                            setShadowOpacity(0.2)
                          }}
                        >
                          Strong
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3 items-center">
                          <Label>Color</Label>
                          <input 
                            type="color" 
                            value={shadowColor} 
                            onChange={(e) => setShadowColor(e.target.value)}
                            className="w-full h-8 rounded border cursor-pointer"
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
                            max={48} 
                            step={1} 
                            value={[shadowBlur]} 
                            onValueChange={(v) => setShadowBlur(v[0] ?? shadowBlur)} 
                          />
                        </div>
                        
                        <div className="space-y-1.5">
                          <Label>Offset X: {shadowOffsetX}px</Label>
                          <Slider 
                            min={-32} 
                            max={32} 
                            step={1} 
                            value={[shadowOffsetX]} 
                            onValueChange={(v) => setShadowOffsetX(v[0] ?? shadowOffsetX)} 
                          />
                        </div>
                        
                        <div className="space-y-1.5">
                          <Label>Offset Y: {shadowOffsetY}px</Label>
                          <Slider 
                            min={-32} 
                            max={32} 
                            step={1} 
                            value={[shadowOffsetY]} 
                            onValueChange={(v) => setShadowOffsetY(v[0] ?? shadowOffsetY)} 
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onDownload} className="justify-center">
              Download
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

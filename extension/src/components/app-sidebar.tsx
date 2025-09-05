import * as React from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarRail,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'

export type LinearGradient = { type: 'linear'; angle: number; stops: { color: string; pos: number }[] }
export type Solid = { type: 'solid'; color: string }
export type BgPreset = LinearGradient | Solid
export type WindowStyle = 'regular' | 'notch' | 'title'
export type ShadowStrength = 'off' | 'subtle' | 'medium' | 'strong'

export function AppSidebar({
  solidPresets,
  gradientPresets,
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
  shadowStrength,
  setShadowStrength,
  onDownload,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  solidPresets: string[]
  gradientPresets: LinearGradient[]
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
  shadowStrength: ShadowStrength
  setShadowStrength: (v: ShadowStrength) => void
  onDownload: () => void
}) {
  return (
    <Sidebar {...props}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Background</SidebarGroupLabel>
          <SidebarGroupContent className="px-4 py-2 space-y-3">
            <Tabs
              value={bgPreset.type}
              onValueChange={(v) => {
                if (v === 'solid' && bgPreset.type !== 'solid') setBgPreset({ type: 'solid', color: solidPresets[0] })
                if (v === 'linear' && bgPreset.type !== 'linear') setBgPreset(gradientPresets[0])
              }}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="solid">Solid</TabsTrigger>
                <TabsTrigger value="linear">Gradient</TabsTrigger>
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
            </Tabs>
          </SidebarGroupContent>
        </SidebarGroup>
        <Separator />
        <SidebarGroup>
          <SidebarGroupLabel>Padding</SidebarGroupLabel>
          <SidebarGroupContent className="space-y-4 px-4 py-2">
            <div className="space-y-2">
              <Label>Horizontal: {padding.x}px</Label>
              <Slider max={200} step={1} value={[padding.x]} onValueChange={(v) => setPadding((p) => ({ ...p, x: v[0] ?? p.x }))} />
              <ToggleGroup type="single" value={String(padding.x)} onValueChange={(val) => val && setPadding((p) => ({ ...p, x: Number(val) }))} className="justify-between">
                {[0, 32, 64, 96, 128, 160, 200].map((v) => (
                  <ToggleGroupItem key={v} value={String(v)} className="px-2 py-1 text-xs">
                    {v}px
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
            <div className="space-y-2">
              <Label>Vertical: {padding.y}px</Label>
              <Slider max={200} step={1} value={[padding.y]} onValueChange={(v) => setPadding((p) => ({ ...p, y: v[0] ?? p.y }))} />
              <ToggleGroup type="single" value={String(padding.y)} onValueChange={(val) => val && setPadding((p) => ({ ...p, y: Number(val) }))} className="justify-between">
                {[0, 32, 64, 96, 128, 160, 200].map((v) => (
                  <ToggleGroupItem key={v} value={String(v)} className="px-2 py-1 text-xs">
                    {v}px
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
        <Separator />
        <SidebarGroup>
          <SidebarGroupLabel>Window</SidebarGroupLabel>
          <SidebarGroupContent className="space-y-4 px-4 py-2">
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
        </SidebarGroup>
        <Separator />
        <SidebarGroup>
          <SidebarGroupLabel>Effects</SidebarGroupLabel>
          <SidebarGroupContent className="space-y-4 px-4 py-2">
            <div className="space-y-2">
              <Label>Shadow</Label>
              <ToggleGroup type="single" value={shadowStrength} onValueChange={(val) => val && setShadowStrength(val as ShadowStrength)}>
                {['off', 'subtle', 'medium', 'strong'].map((v) => (
                  <ToggleGroupItem key={v} value={v} className="px-3 py-1 text-xs capitalize">
                    {v}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
            <Button onClick={onDownload} className="w-full" variant="default">
              Download
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}


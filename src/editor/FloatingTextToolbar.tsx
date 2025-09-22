import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { 
  Bold, 
  Italic, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Trash2, 
  Type,
  Palette,
  Square,
  Zap,
  ChevronDown
} from 'lucide-react'
import type { TextNode, TextAlign } from './types'

export function FloatingTextToolbar({
  value,
  onChange,
  onRemove,
  position,
}: {
  value: TextNode | null
  onChange: (patch: Partial<TextNode>) => void
  onRemove: () => void
  position: { x: number; y: number }
}) {
  const [activePanel, setActivePanel] = useState<'font' | 'color' | 'background' | 'shadow' | null>(null)

  if (!value) return null

  const fonts = [
    'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
    'Georgia, serif',
    'Times New Roman, Times, serif',
    'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, Liberation Mono, monospace',
  ]

  return (
    <div
      className="fixed z-50 bg-background/95 backdrop-blur-sm border rounded-lg shadow-xl p-2 animate-in fade-in-0 zoom-in-95 duration-200"
      style={{
        left: position.x,
        top: position.y - 70, // Position above the text
        transform: 'translateX(-50%)',
        minWidth: 'max-content',
      }}
    >
      <div className="flex items-center gap-1">
        {/* Font Controls */}
        <Popover open={activePanel === 'font'} onOpenChange={(open) => setActivePanel(open ? 'font' : null)}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <Type className="size-4" />
              <ChevronDown className="size-3 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3" align="start">
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-medium">Font Family</Label>
                <Select value={value.fontFamily} onValueChange={(v) => onChange({ fontFamily: v })}>
                  <SelectTrigger className="h-8 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fonts.map((f) => (
                      <SelectItem key={f} value={f}>{f.split(',')[0]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium">Size: {value.fontSize}px</Label>
                <Slider 
                  min={8} 
                  max={160} 
                  step={1} 
                  value={[value.fontSize]} 
                  onValueChange={(v) => onChange({ fontSize: v[0] ?? value.fontSize })}
                  className="mt-2"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-6" />

        {/* Style Controls */}
        <Toggle pressed={value.bold} onPressedChange={(p) => onChange({ bold: !!p })} size="sm">
          <Bold className="size-4" />
        </Toggle>
        <Toggle pressed={value.italic} onPressedChange={(p) => onChange({ italic: !!p })} size="sm">
          <Italic className="size-4" />
        </Toggle>

        <Separator orientation="vertical" className="h-6" />

        {/* Alignment */}
        <ToggleGroup type="single" value={value.align} onValueChange={(v) => v && onChange({ align: v as TextAlign })} size="sm">
          <ToggleGroupItem value="left"><AlignLeft className="size-4" /></ToggleGroupItem>
          <ToggleGroupItem value="center"><AlignCenter className="size-4" /></ToggleGroupItem>
          <ToggleGroupItem value="right"><AlignRight className="size-4" /></ToggleGroupItem>
        </ToggleGroup>

        <Separator orientation="vertical" className="h-6" />

        {/* Anchor */}
        <ToggleGroup
          type="single"
          value={value.positionAnchor ?? 'content'}
          onValueChange={(v) => v && onChange({ positionAnchor: v as 'stage' | 'content' })}
          size="sm"
        >
          <ToggleGroupItem value="content" title="Anchor to Screenshot">Cnt</ToggleGroupItem>
          <ToggleGroupItem value="stage" title="Anchor to Stage">Stg</ToggleGroupItem>
        </ToggleGroup>

        <Separator orientation="vertical" className="h-6" />

        {/* Color / Fill Controls */}
        <Popover open={activePanel === 'color'} onOpenChange={(open) => setActivePanel(open ? 'color' : null)}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <Palette className="size-4" />
              <ChevronDown className="size-3 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" align="start">
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <Button variant={value.fillType === 'solid' ? 'default' : 'outline'} size="sm" onClick={() => onChange({ fillType: 'solid' })}>Solid</Button>
                <Button variant={value.fillType === 'linear' ? 'default' : 'outline'} size="sm" onClick={() => onChange({ fillType: 'linear' })}>Gradient</Button>
                <Button variant={value.fillType === 'pattern' ? 'default' : 'outline'} size="sm" onClick={() => onChange({ fillType: 'pattern' })} disabled>Pattern</Button>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs font-medium w-12">Color</Label>
                <input 
                  type="color" 
                  value={value.color} 
                  onChange={(e) => onChange({ color: e.currentTarget.value })}
                  className="w-8 h-8 rounded border"
                />
              </div>
              {value.fillType === 'linear' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs font-medium w-12">Color 2</Label>
                    <input 
                      type="color" 
                      value={value.fillColor2 ?? value.color} 
                      onChange={(e) => onChange({ fillColor2: e.currentTarget.value })}
                      className="w-8 h-8 rounded border"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Angle: {value.fillAngle ?? 0}°</Label>
                    <Slider min={0} max={180} step={1} value={[value.fillAngle ?? 0]} onValueChange={(v) => onChange({ fillAngle: v[0] })} className="mt-2" />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={value.outline} 
                    onChange={(e) => onChange({ outline: e.currentTarget.checked })}
                    className="rounded"
                  />
                  <Label className="text-xs font-medium">Outline</Label>
                </div>
                {value.outline && (
                  <div className="flex items-center gap-2 ml-6">
                    <input 
                      type="color" 
                      value={value.outlineColor} 
                      onChange={(e) => onChange({ outlineColor: e.currentTarget.value })}
                      className="w-6 h-6 rounded border"
                    />
                    <Input 
                      className="w-16 h-7" 
                      type="number" 
                      min={0} 
                      max={20} 
                      value={value.outlineWidth} 
                      onChange={(e) => onChange({ outlineWidth: Math.max(0, Number(e.currentTarget.value || 0)) })}
                      placeholder="Width"
                    />
                  </div>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Background Controls */}
        <Popover open={activePanel === 'background'} onOpenChange={(open) => setActivePanel(open ? 'background' : null)}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <Square className="size-4" />
              <ChevronDown className="size-3 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3" align="start">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={!!value.background} 
                  onChange={(e) => onChange({ background: e.currentTarget.checked })}
                  className="rounded"
                />
                <Label className="text-xs font-medium">Background</Label>
              </div>
              {value.background && (
                <div className="space-y-3 ml-6">
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant={value.backgroundType === 'solid' ? 'default' : 'outline'} size="sm" onClick={() => onChange({ backgroundType: 'solid' })}>Solid</Button>
                    <Button variant={value.backgroundType === 'linear' ? 'default' : 'outline'} size="sm" onClick={() => onChange({ backgroundType: 'linear' })}>Gradient</Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs w-16">Color</Label>
                    <input 
                      type="color" 
                      value={value.backgroundColor ?? '#000000'} 
                      onChange={(e) => onChange({ backgroundColor: e.currentTarget.value })}
                      className="w-8 h-8 rounded border"
                    />
                  </div>
                  {value.backgroundType === 'linear' && (
                    <>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs w-16">Color 2</Label>
                        <input 
                          type="color" 
                          value={value.backgroundColor2 ?? '#374151'} 
                          onChange={(e) => onChange({ backgroundColor2: e.currentTarget.value })}
                          className="w-8 h-8 rounded border"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Angle: {value.backgroundAngle ?? 90}°</Label>
                        <Slider min={0} max={180} step={1} value={[value.backgroundAngle ?? 90]} onValueChange={(v) => onChange({ backgroundAngle: v[0] })} className="mt-2" />
                      </div>
                    </>
                  )}
                  <div className="flex items-center gap-2">
                    <Label className="text-xs w-16">Opacity</Label>
                    <Slider 
                      min={0} 
                      max={1} 
                      step={0.05} 
                      value={[value.backgroundAlpha ?? 0.65]} 
                      onValueChange={(v) => onChange({ backgroundAlpha: v[0] })}
                      className="flex-1"
                    />
                    <span className="text-xs w-12">{Math.round((value.backgroundAlpha ?? 0.65) * 100)}%</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Pad X</Label>
                      <Input 
                        className="h-7 mt-1" 
                        type="number" 
                        min={0} 
                        max={64} 
                        value={value.backgroundPaddingX ?? 6} 
                        onChange={(e) => onChange({ backgroundPaddingX: Math.max(0, Number(e.currentTarget.value || 0)) })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Pad Y</Label>
                      <Input 
                        className="h-7 mt-1" 
                        type="number" 
                        min={0} 
                        max={64} 
                        value={value.backgroundPaddingY ?? 2} 
                        onChange={(e) => onChange({ backgroundPaddingY: Math.max(0, Number(e.currentTarget.value || 0)) })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Radius</Label>
                    <Input 
                      className="h-7 mt-1" 
                      type="number" 
                      min={0} 
                      max={64} 
                      value={value.backgroundRadius ?? 6} 
                      onChange={(e) => onChange({ backgroundRadius: Math.max(0, Number(e.currentTarget.value || 0)) })}
                    />
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Shadow Controls */}
        <Popover open={activePanel === 'shadow'} onOpenChange={(open) => setActivePanel(open ? 'shadow' : null)}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <Zap className="size-4" />
              <ChevronDown className="size-3 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3" align="start">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={!!value.shadow} 
                  onChange={(e) => onChange({ shadow: e.currentTarget.checked })}
                  className="rounded"
                />
                <Label className="text-xs font-medium">Drop Shadow</Label>
              </div>
              {value.shadow && (
                <div className="space-y-3 ml-6">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs w-16">Color</Label>
                    <input 
                      type="color" 
                      value={value.shadowColor ?? '#000000'} 
                      onChange={(e) => onChange({ shadowColor: e.currentTarget.value })}
                      className="w-8 h-8 rounded border"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Opacity: {Math.round((value.shadowAlpha ?? 0.5) * 100)}%</Label>
                    <Slider 
                      min={0} 
                      max={1} 
                      step={0.05} 
                      value={[value.shadowAlpha ?? 0.5]} 
                      onValueChange={(v) => onChange({ shadowAlpha: v[0] })}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Blur: {value.shadowBlur ?? 8}px</Label>
                    <Slider 
                      min={0} 
                      max={64} 
                      step={1} 
                      value={[value.shadowBlur ?? 8]} 
                      onValueChange={(v) => onChange({ shadowBlur: v[0] })}
                      className="mt-2"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Offset X</Label>
                      <Input 
                        className="h-7 mt-1" 
                        type="number" 
                        min={-64} 
                        max={64} 
                        value={value.shadowOffsetX ?? 0} 
                        onChange={(e) => onChange({ shadowOffsetX: Number(e.currentTarget.value || 0) })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Offset Y</Label>
                      <Input 
                        className="h-7 mt-1" 
                        type="number" 
                        min={-64} 
                        max={64} 
                        value={value.shadowOffsetY ?? 2} 
                        onChange={(e) => onChange({ shadowOffsetY: Number(e.currentTarget.value || 0) })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-6" />

        {/* Delete */}
        <Button variant="ghost" size="sm" onClick={onRemove} className="h-8 px-2 text-destructive hover:text-destructive">
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  )
}

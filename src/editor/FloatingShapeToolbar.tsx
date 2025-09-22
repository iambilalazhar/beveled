import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Square, Zap, ChevronDown, Trash2, Paintbrush } from 'lucide-react'
import type { ShapeNode } from './types'

export function FloatingShapeToolbar({
  value,
  onChange,
  onRemove,
  position,
}: {
  value: ShapeNode | null
  onChange: (patch: Partial<ShapeNode>) => void
  onRemove: () => void
  position: { x: number; y: number }
}) {
  const [open, setOpen] = useState(true)
  if (!value) return null

  return (
    <div
      className="fixed z-50 bg-background/95 backdrop-blur-sm border rounded-lg shadow-xl p-2 animate-in fade-in-0 zoom-in-95 duration-200"
      style={{
        left: position.x,
        top: position.y - 70,
        transform: 'translateX(-50%)',
        minWidth: 'max-content',
      }}
    >
      <div className="flex items-center gap-1">
        {/* Stroke */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2" title="Stroke">
              <Paintbrush className="size-4" />
              <ChevronDown className="size-3 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" align="start">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-xs w-16">Color</Label>
                <input
                  type="color"
                  value={value.strokeColor}
                  onChange={(e) => onChange({ strokeColor: e.currentTarget.value })}
                  className="w-8 h-8 rounded border"
                />
              </div>
              <div>
                <Label className="text-xs">Width: {value.strokeWidth}px</Label>
                <Slider
                  min={1}
                  max={20}
                  step={1}
                  value={[value.strokeWidth]}
                  onValueChange={(v) => onChange({ strokeWidth: v[0] ?? value.strokeWidth })}
                  className="mt-2"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-6" />

        {/* Fill */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2" title="Fill">
              <Square className="size-4" />
              <ChevronDown className="size-3 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" align="start">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!value.fill}
                  onChange={(e) => onChange({ fill: e.currentTarget.checked })}
                  className="rounded"
                />
                <Label className="text-xs font-medium">Fill</Label>
              </div>
              {value.fill && (
                <div className="flex items-center gap-2 ml-6">
                  <Label className="text-xs w-16">Color</Label>
                  <input
                    type="color"
                    value={value.fillColor ?? '#000000'}
                    onChange={(e) => onChange({ fillColor: e.currentTarget.value })}
                    className="w-8 h-8 rounded border"
                  />
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

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

        {/* Shadow */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2" title="Shadow">
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
        <Button variant="ghost" size="sm" onClick={onRemove} className="h-8 px-2 text-destructive hover:text-destructive" title="Delete">
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  )
}

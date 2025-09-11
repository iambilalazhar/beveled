import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Bold, Italic, AlignLeft, AlignCenter, AlignRight, Trash2 } from 'lucide-react'
import type { TextNode, TextAlign } from './types'

export function TextInspector({
  value,
  onChange,
  onRemove,
}: {
  value: TextNode | null
  onChange: (patch: Partial<TextNode>) => void
  onRemove: () => void
}) {
  if (!value) return null
  const fonts = [
    'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
    'Georgia, serif',
    'Times New Roman, Times, serif',
    'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, Liberation Mono, monospace',
  ]
  return (
    <div className="ml-4 flex items-center gap-3 rounded-md border px-3 py-2 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-56">
        <Label className="text-xs">Font</Label>
        <Select value={value.fontFamily} onValueChange={(v) => onChange({ fontFamily: v })}>
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fonts.map((f) => (
              <SelectItem key={f} value={f}>{f.split(',')[0]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="w-44">
        <Label className="text-xs">Size: {value.fontSize}px</Label>
        <Slider min={8} max={160} step={1} value={[value.fontSize]} onValueChange={(v) => onChange({ fontSize: v[0] ?? value.fontSize })} />
      </div>
      <div className="flex items-center gap-1">
        <Toggle pressed={value.bold} onPressedChange={(p) => onChange({ bold: !!p })} aria-label="Bold">
          <Bold className="size-4" />
        </Toggle>
        <Toggle pressed={value.italic} onPressedChange={(p) => onChange({ italic: !!p })} aria-label="Italic">
          <Italic className="size-4" />
        </Toggle>
        <ToggleGroup type="single" value={value.align} onValueChange={(v) => v && onChange({ align: v as TextAlign })}>
          <ToggleGroupItem value="left" aria-label="Align left"><AlignLeft className="size-4" /></ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Align center"><AlignCenter className="size-4" /></ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="Align right"><AlignRight className="size-4" /></ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Label className="text-xs">Color</Label>
          <input type="color" value={value.color} onChange={(e) => onChange({ color: e.currentTarget.value })} />
        </div>
        <div className="flex items-center gap-1">
          <Label className="text-xs">Outline</Label>
          <input type="checkbox" checked={value.outline} onChange={(e) => onChange({ outline: e.currentTarget.checked })} />
          <input type="color" value={value.outlineColor} onChange={(e) => onChange({ outlineColor: e.currentTarget.value })} disabled={!value.outline} />
          <Input className="w-16 h-8" type="number" min={0} max={20} value={value.outlineWidth} onChange={(e) => onChange({ outlineWidth: Math.max(0, Number(e.currentTarget.value || 0)) })} disabled={!value.outline} />
        </div>
        <div className="flex items-center gap-1">
          <Label className="text-xs">BG</Label>
          <input type="checkbox" checked={!!value.background} onChange={(e) => onChange({ background: e.currentTarget.checked })} />
          <input type="color" value={value.backgroundColor ?? '#000000'} onChange={(e) => onChange({ backgroundColor: e.currentTarget.value })} disabled={!value.background} />
          <Input className="w-16 h-8" type="number" min={0} max={1} step={0.05} value={value.backgroundAlpha ?? 0.65} onChange={(e) => onChange({ backgroundAlpha: Math.min(1, Math.max(0, Number(e.currentTarget.value || 0))) })} disabled={!value.background} />
          <Input className="w-16 h-8" type="number" min={0} max={64} value={value.backgroundPaddingX ?? 6} onChange={(e) => onChange({ backgroundPaddingX: Math.max(0, Number(e.currentTarget.value || 0)) })} disabled={!value.background} />
          <Input className="w-16 h-8" type="number" min={0} max={64} value={value.backgroundPaddingY ?? 2} onChange={(e) => onChange({ backgroundPaddingY: Math.max(0, Number(e.currentTarget.value || 0)) })} disabled={!value.background} />
          <Input className="w-16 h-8" type="number" min={0} max={64} value={value.backgroundRadius ?? 6} onChange={(e) => onChange({ backgroundRadius: Math.max(0, Number(e.currentTarget.value || 0)) })} disabled={!value.background} />
        </div>
        <div className="flex items-center gap-1">
          <Label className="text-xs">Shadow</Label>
          <input type="checkbox" checked={!!value.shadow} onChange={(e) => onChange({ shadow: e.currentTarget.checked })} />
          <input type="color" value={value.shadowColor ?? '#000000'} onChange={(e) => onChange({ shadowColor: e.currentTarget.value })} disabled={!value.shadow} />
          <Input className="w-16 h-8" type="number" min={0} max={64} value={value.shadowBlur ?? 8} onChange={(e) => onChange({ shadowBlur: Math.max(0, Number(e.currentTarget.value || 0)) })} disabled={!value.shadow} />
          <Input className="w-16 h-8" type="number" min={-64} max={64} value={value.shadowOffsetX ?? 0} onChange={(e) => onChange({ shadowOffsetX: Number(e.currentTarget.value || 0) })} disabled={!value.shadow} />
          <Input className="w-16 h-8" type="number" min={-64} max={64} value={value.shadowOffsetY ?? 2} onChange={(e) => onChange({ shadowOffsetY: Number(e.currentTarget.value || 0) })} disabled={!value.shadow} />
        </div>
      </div>
      <Button variant="destructive" size="icon" title="Delete" onClick={onRemove}>
        <Trash2 />
      </Button>
    </div>
  )
}

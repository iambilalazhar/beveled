import { Button } from '@/components/ui/button'
import { Crop, Type as TypeIcon, Square, Circle, Triangle, ArrowRight, Minus, Link as LinkIcon, Link2Off, MousePointer, Shapes as ShapesIcon, Grid3X3 } from 'lucide-react'
import type { ActiveTool, ShapeType } from './types'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { useState } from 'react'

export function Toolbar({
  activeTool,
  onToggleCrop,
  onApplyCrop,
  onCancelCrop,
  cropEnabled,
  aspectLocked,
  onToggleAspect,
  onToggleText,
  onToggleSelect,
  onChooseShape,
  keepPlacingShapes,
  onToggleKeepPlacingShapes,
  snapToGrid,
  onToggleSnapToGrid,
}: {
  activeTool: ActiveTool
  onToggleCrop: () => void
  onApplyCrop: () => void
  onCancelCrop: () => void
  cropEnabled: boolean
  aspectLocked: boolean
  onToggleAspect: () => void
  onToggleText: () => void
  onToggleSelect: () => void
  onChooseShape: (type: ShapeType) => void
  keepPlacingShapes: boolean
  onToggleKeepPlacingShapes: () => void
  snapToGrid: boolean
  onToggleSnapToGrid: () => void
}) {
  const [shapeOpen, setShapeOpen] = useState(false)
  return (
    <>
      <div className="ml-4 flex items-center gap-2">
        <Button
          variant={activeTool === 'crop' ? 'default' : 'outline'}
          size="icon"
          title="Crop"
          onClick={onToggleCrop}
        >
          <Crop />
        </Button>
        <Button
          variant={activeTool === 'select' ? 'default' : 'outline'}
          size="icon"
          title="Select"
          onClick={onToggleSelect}
        >
          <MousePointer />
        </Button>
        <Button
          variant={aspectLocked ? 'default' : 'outline'}
          size="icon"
          title={aspectLocked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
          onClick={onToggleAspect}
          disabled={activeTool !== 'crop'}
        >
          {aspectLocked ? <LinkIcon /> : <Link2Off />}
        </Button>
        <Button variant={activeTool === 'text' ? 'default' : 'outline'} size="icon" title="Text" onClick={onToggleText}>
          <TypeIcon />
        </Button>
        <Popover open={shapeOpen} onOpenChange={setShapeOpen}>
          <PopoverTrigger asChild>
            <Button variant={activeTool === 'shape' ? 'default' : 'outline'} size="icon" title="Shapes">
              <ShapesIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-44 p-2" align="start">
            <div className="grid grid-cols-5 gap-2">
              <Button variant="secondary" size="icon" title="Rectangle" onClick={() => { onChooseShape('rectangle'); setShapeOpen(false) }}>
                <Square className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="icon" title="Circle" onClick={() => { onChooseShape('circle'); setShapeOpen(false) }}>
                <Circle className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="icon" title="Triangle" onClick={() => { onChooseShape('triangle'); setShapeOpen(false) }}>
                <Triangle className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="icon" title="Line" onClick={() => { onChooseShape('line'); setShapeOpen(false) }}>
                <Minus className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="icon" title="Arrow" onClick={() => { onChooseShape('arrow'); setShapeOpen(false) }}>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-3 space-y-2">
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={keepPlacingShapes} onChange={() => onToggleKeepPlacingShapes()} />
                Keep placing
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={snapToGrid} onChange={() => onToggleSnapToGrid()} />
                Snap to grid
              </label>
            </div>
          </PopoverContent>
        </Popover>
        <Button
          variant={snapToGrid ? 'default' : 'outline'}
          size="icon"
          title="Snap to grid"
          onClick={onToggleSnapToGrid}
        >
          <Grid3X3 />
        </Button>
      </div>
      <div className="ml-auto flex items-center gap-2">
        {activeTool === 'crop' && (
          <>
            <Button size="sm" onClick={onApplyCrop} disabled={!cropEnabled}>Apply</Button>
            <Button size="sm" variant="outline" onClick={onCancelCrop}>Cancel</Button>
          </>
        )}
      </div>
    </>
  )
}

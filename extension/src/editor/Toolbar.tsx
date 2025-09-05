import { Button } from '@/components/ui/button'
import { Crop, Type as TypeIcon, Square, Circle, Link as LinkIcon, Link2Off } from 'lucide-react'
import type { ActiveTool } from './types'

export function Toolbar({
  activeTool,
  onToggleCrop,
  onApplyCrop,
  onCancelCrop,
  cropEnabled,
  aspectLocked,
  onToggleAspect,
  onToggleText,
}: {
  activeTool: ActiveTool
  onToggleCrop: () => void
  onApplyCrop: () => void
  onCancelCrop: () => void
  cropEnabled: boolean
  aspectLocked: boolean
  onToggleAspect: () => void
  onToggleText: () => void
}) {
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
        <Button variant="outline" size="icon" title="Rectangle" disabled>
          <Square />
        </Button>
        <Button variant="outline" size="icon" title="Circle" disabled>
          <Circle />
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

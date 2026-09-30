import { useEditor, useScene } from '../../store'
import { BackgroundEditor } from '../BackgroundEditor'

export function BackgroundPanel() {
  const bg = useScene('background')
  const media = useScene('media')
  const update = useEditor((s) => s.update)
  return <BackgroundEditor bg={bg} onChange={(patch) => update('background', patch)} paletteSource={media.kind === 'image' ? media.url : null} />
}

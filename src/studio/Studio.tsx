import { lazy, Suspense, useEffect, useRef } from 'react'
import { editShot, useEditor } from '@/mockup/store'
import { useShots } from '@/shots/store'
import { useStudioMode, type StudioMode } from './mode'

const MockupEditor = lazy(() => import('@/mockup/ui/MockupEditor'))
const ShotsEditor = lazy(() => import('@/shots/ui/ShotsEditor'))

/** Carries the screenshot across when switching between the 2-D and 3-D studios. */
function carryMedia(from: StudioMode) {
  const three = useEditor.getState()
  const shot = editShot(three.project, three.selectedClipId)
  const flat = useShots.getState()
  const m3 = shot.scene.media
  const m2 = flat.project.mockup.media[0]
  if (from === '3d' && m3.url && m3.url !== m2?.url) flat.setMedia(0, { ...m3 })
  if (from === '2d' && m2?.url && m2.url !== m3.url) three.setMedia({ ...m2 })
}

let switched = false
useStudioMode.subscribe(() => {
  switched = true
})

function Loading() {
  return <div className="fixed inset-0 bg-[#0a0a0a]" />
}

/** The editor at /editor: a 2D | 3D switch over the shots.so-style and UltraMock-style studios. */
export function Studio({ initialMedia = null }: { initialMedia?: Blob | string | null }) {
  const mode = useStudioMode((s) => s.mode)
  const prev = useRef(mode)
  useEffect(() => {
    if (prev.current !== mode) carryMedia(prev.current)
    prev.current = mode
  }, [mode])
  // Only the first editor shown picks up the initial media (upload, deep link or extension capture);
  // later switches carry the current screenshot across instead.
  const loadInitial = !switched
  return (
    <Suspense fallback={<Loading />}>
      {mode === '2d' ? <ShotsEditor initialMedia={initialMedia} loadInitial={loadInitial} /> : <MockupEditor initialMedia={initialMedia} loadInitial={loadInitial} />}
    </Suspense>
  )
}

export default Studio

import { downloadBlob } from '@/mockup/scene/download'
import { blobUrlToDataUrl, dataUrlToBlobUrl, mapStrings } from '@/mockup/ui/projectFile'
import { hydrateShots, useShots } from '../store'
import type { ShotsProject } from '../types'

const FORMAT = 'beveled-2d-project'

/** Saves the 2-D project (design, copy, screens set, animation and all media) to one .json file. */
export async function saveShotsProject() {
  const { project, setStatus } = useShots.getState()
  setStatus('Saving project…')
  try {
    const cache = new Map<string, string>()
    const embedded = await mapStrings(project, async (s) => {
      if (!s.startsWith('blob:')) return s
      if (!cache.has(s)) cache.set(s, await blobUrlToDataUrl(s).catch(() => ''))
      return cache.get(s)!
    })
    const json = JSON.stringify({ format: FORMAT, version: 1, savedAt: new Date().toISOString(), project: embedded })
    const d = new Date()
    const name = `beveled-2d-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.beveled.json`
    downloadBlob(new Blob([json], { type: 'application/json' }), name)
    setStatus(`Saved project · ${(json.length / 1_000_000).toFixed(1)} MB`)
  } catch (err) {
    console.error(err)
    setStatus('Could not save the project')
  }
}

export async function openShotsProject(file: File) {
  const { setStatus, loadProject } = useShots.getState()
  try {
    const parsed = JSON.parse(await file.text()) as { format?: string; project?: Partial<ShotsProject> }
    if (parsed.format !== FORMAT || !parsed.project?.mockup) throw new Error('Not a Beveled 2D project file')
    const cache = new Map<string, string>()
    const restored = (await mapStrings(parsed.project, async (s) => {
      if (!s.startsWith('data:') || s.length < 2048) return s
      if (!cache.has(s)) cache.set(s, await dataUrlToBlobUrl(s))
      return cache.get(s)!
    })) as Partial<ShotsProject>
    loadProject(hydrateShots(restored, true))
    setStatus(`Opened ${file.name}`)
  } catch (err) {
    console.error(err)
    setStatus(err instanceof Error ? err.message : 'Could not open that file')
  }
}

export function pickShotsProject() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json,.beveled,application/json'
  input.onchange = () => {
    const f = input.files?.[0]
    if (f) void openShotsProject(f)
  }
  input.click()
}

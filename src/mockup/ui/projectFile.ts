import { downloadBlob } from '../scene/download'
import { hydrateProject, useEditor, type Project } from '../store'

const FORMAT = 'beveled-project'
const VERSION = 1

async function blobUrlToDataUrl(url: string): Promise<string> {
  const blob = await (await fetch(url)).blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

async function dataUrlToBlobUrl(url: string): Promise<string> {
  const blob = await (await fetch(url)).blob()
  return URL.createObjectURL(blob)
}

/** Deep-maps every string value in a JSON-like value (media URLs live in many places). */
async function mapStrings(value: unknown, fn: (s: string) => Promise<string>): Promise<unknown> {
  if (typeof value === 'string') return fn(value)
  if (Array.isArray(value)) return Promise.all(value.map((v) => mapStrings(v, fn)))
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) out[k] = await mapStrings(v, fn)
    return out
  }
  return value
}

function stamp() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`
}

/** Saves the timeline, every scene and all media (embedded as data URLs) to a single .beveled.json file. */
export async function saveProjectFile() {
  const { project, setStatus } = useEditor.getState()
  setStatus('Saving project…')
  try {
    const cache = new Map<string, string>()
    const embedded = await mapStrings(project, async (s) => {
      if (!s.startsWith('blob:')) return s
      if (!cache.has(s)) cache.set(s, await blobUrlToDataUrl(s).catch(() => ''))
      return cache.get(s)!
    })
    const json = JSON.stringify({ format: FORMAT, version: VERSION, savedAt: new Date().toISOString(), project: embedded })
    downloadBlob(new Blob([json], { type: 'application/json' }), `beveled-project-${stamp()}.beveled.json`)
    setStatus(`Saved project · ${(json.length / 1_000_000).toFixed(1)} MB`)
  } catch (err) {
    console.error(err)
    setStatus('Could not save the project')
  }
}

/** Opens a project saved with `saveProjectFile`. Embedded media become object URLs again. */
export async function openProjectFile(file: File) {
  const { setStatus, loadProject } = useEditor.getState()
  try {
    const parsed = JSON.parse(await file.text()) as { format?: string; project?: Partial<Project> }
    if (parsed.format !== FORMAT || !parsed.project?.clips?.length) throw new Error('Not a Beveled project file')
    setStatus('Opening project…')
    const cache = new Map<string, string>()
    const restored = (await mapStrings(parsed.project, async (s) => {
      if (!s.startsWith('data:') || s.length < 2048) return s
      if (!cache.has(s)) cache.set(s, await dataUrlToBlobUrl(s))
      return cache.get(s)!
    })) as Partial<Project>
    loadProject(hydrateProject(restored, true))
    setStatus(`Opened ${file.name}`)
  } catch (err) {
    console.error(err)
    setStatus(err instanceof Error ? err.message : 'Could not open that file')
  }
}

export const PROJECT_ACCEPT = '.json,.beveled,application/json'

/** Opens a project file picker. Used by ⌘O. */
export function pickProjectFile() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = PROJECT_ACCEPT
  input.onchange = () => {
    const f = input.files?.[0]
    if (f) void openProjectFile(f)
  }
  input.click()
}

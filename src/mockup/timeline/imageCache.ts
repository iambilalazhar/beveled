const images = new Map<string, HTMLImageElement>()
const pending = new Map<string, Promise<HTMLImageElement>>()

/** Loaded image for a URL, if it has finished loading. */
export function cachedImage(url: string | null | undefined) {
  return url ? images.get(url) ?? null : null
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  const hit = images.get(url)
  if (hit) return Promise.resolve(hit)
  const inflight = pending.get(url)
  if (inflight) return inflight
  const p = new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image()
    el.crossOrigin = 'anonymous'
    el.onload = () => {
      images.set(url, el)
      resolve(el)
    }
    el.onerror = () => reject(new Error('Could not load image'))
    el.src = url
  })
  pending.set(url, p)
  p.finally(() => pending.delete(url)).catch(() => undefined)
  return p
}

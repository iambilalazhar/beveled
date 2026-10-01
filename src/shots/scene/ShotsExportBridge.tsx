import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { downloadBlob } from '@/mockup/scene/download'
import { getCachedMedia, loadMediaTexture } from '@/mockup/scene/media'
import type { ExportFormat } from '@/mockup/types'
import { useShots } from '../store'
import { totalDuration } from '../timeline'

const MIME: Record<ExportFormat, string> = { png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp' }
const tick = () => new Promise<void>((r) => setTimeout(r, 0))
const even = (n: number) => Math.max(2, Math.round(n / 2) * 2)

function stamp() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

/** Renders the 2-D studio's frame to images and frame-accurate video at the frame's own pixel size. */
export function ShotsExportBridge() {
  const gl = useThree((s) => s.gl)
  const advance = useThree((s) => s.advance)
  const setFrameloop = useThree((s) => s.setFrameloop)
  const size = useThree((s) => s.size)
  const exportRequest = useShots((s) => s.exportRequest)
  const videoRequest = useShots((s) => s.videoRequest)

  useEffect(() => {
    if (!exportRequest) return
    const { finishExport, setStatus, project } = useShots.getState()
    const req = exportRequest
    const run = async () => {
      const max = 8192
      const k = Math.min(req.scale, max / Math.max(project.frame.width, project.frame.height))
      const outW = Math.round(project.frame.width * k)
      const outH = Math.round(project.frame.height * k)
      const prevDpr = gl.getPixelRatio()
      try {
        setStatus(`Rendering ${outW}×${outH}…`)
        await new Promise((r) => window.setTimeout(r, 30))
        gl.setPixelRatio(outW / Math.max(1, size.width))
        advance(performance.now(), true)
        advance(performance.now(), true)
        const out = document.createElement('canvas')
        out.width = outW
        out.height = outH
        const ctx = out.getContext('2d')!
        if (req.format === 'jpeg') {
          ctx.fillStyle = '#fff'
          ctx.fillRect(0, 0, outW, outH)
        }
        ctx.drawImage(gl.domElement, 0, 0, outW, outH)
        const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, MIME[req.format], req.quality))
        if (!blob) throw new Error('Could not encode the image')
        const ext = req.format === 'jpeg' ? 'jpg' : req.format
        downloadBlob(blob, `beveled-2d-${stamp()}.${ext}`)
        setStatus(`Exported ${outW}×${outH} ${ext.toUpperCase()}`)
      } catch (err) {
        console.error(err)
        setStatus(err instanceof Error ? err.message : 'Export failed')
      } finally {
        gl.setPixelRatio(prevDpr)
        advance(performance.now(), true)
        finishExport()
      }
    }
    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exportRequest])

  useEffect(() => {
    if (!videoRequest) return
    const { setRecording, setStatus } = useShots.getState()
    let cancelled = false
    const isCancelled = () => cancelled || !useShots.getState().videoRequest
    const finish = (msg: string) => {
      setRecording(false)
      setStatus(msg)
    }
    const run = async () => {
      if (typeof VideoEncoder === 'undefined') {
        finish('Video export needs a browser with WebCodecs (Chrome, Edge or Safari 17+)')
        return
      }
      const { BufferTarget, CanvasSource, getFirstEncodableVideoCodec, Mp4OutputFormat, Output, WebMOutputFormat } = await import('mediabunny')
      const s = useShots.getState()
      const project = s.project
      const fps = project.export.fps
      const total = totalDuration(project)
      const frames = Math.max(1, Math.round(total * fps))
      const k = Math.min(1, 3840 / Math.max(project.frame.width, project.frame.height))
      const outW = even(project.frame.width * k)
      const outH = even(project.frame.height * k)
      const format = project.export.videoFormat === 'webm' ? new WebMOutputFormat() : new Mp4OutputFormat({ fastStart: 'in-memory' })
      const codec = await getFirstEncodableVideoCodec(format.getSupportedVideoCodecs(), { width: outW, height: outH })
      if (!codec) {
        finish('This browser cannot encode video at that size')
        return
      }
      const medias = project.mockup.media.filter((m) => m?.url)
      await Promise.all(medias.map((m) => loadMediaTexture(m!.url!, m!.kind === 'video' ? 'video' : 'image').catch(() => undefined)))
      const canvas = document.createElement('canvas')
      canvas.width = outW
      canvas.height = outH
      const ctx = canvas.getContext('2d')!
      const output = new Output({ format, target: new BufferTarget() })
      const source = new CanvasSource(canvas, { codec, bitrate: project.export.videoBitrate * 1_000_000, keyFrameInterval: 2 })
      output.addVideoTrack(source, { frameRate: fps })
      await output.start()
      const prevDpr = gl.getPixelRatio()
      const prevTime = s.time
      setFrameloop('never')
      gl.setPixelRatio(outW / Math.max(1, size.width))
      try {
        for (let i = 0; i < frames; i++) {
          if (isCancelled()) break
          const t = Math.min(i / fps, total)
          useShots.getState().setTimeFromPlayback(t)
          for (const m of medias) {
            if (m!.kind !== 'video') continue
            const entry = getCachedMedia(m!.url)
            const video = entry?.video
            if (!video || !video.duration) continue
            video.pause()
            const target = t % video.duration
            if (Math.abs(video.currentTime - target) > 0.5 / fps) {
              await new Promise<void>((resolve) => {
                video.addEventListener('seeked', () => resolve(), { once: true })
                video.currentTime = target
                window.setTimeout(resolve, 500)
              })
            }
            entry.texture.needsUpdate = true
          }
          advance(performance.now(), true)
          ctx.clearRect(0, 0, outW, outH)
          ctx.drawImage(gl.domElement, 0, 0, outW, outH)
          await source.add(i / fps, 1 / fps)
          if (i % 5 === 0) {
            setRecording(true, (i + 1) / frames)
            setStatus(`Rendering video ${Math.round(((i + 1) / frames) * 100)}%`)
            await tick()
          }
        }
        if (isCancelled()) {
          await output.cancel()
          finish('Video export cancelled')
          return
        }
        setStatus('Finalizing video…')
        await output.finalize()
        const buffer = (output.target as InstanceType<typeof BufferTarget>).buffer
        if (!buffer) throw new Error('Encoder produced no data')
        downloadBlob(new Blob([buffer], { type: format.mimeType }), `beveled-2d-${stamp()}${format.fileExtension}`)
        finish(`Saved ${outW}×${outH} ${format.fileExtension.slice(1).toUpperCase()} · ${total.toFixed(1)}s`)
      } finally {
        gl.setPixelRatio(prevDpr)
        setFrameloop('always')
        for (const m of medias) {
          const v = getCachedMedia(m!.url)?.video
          if (v) void v.play().catch(() => undefined)
        }
        useShots.getState().setTimeFromPlayback(prevTime)
      }
    }
    run().catch((err) => {
      console.error(err)
      finish(err instanceof Error ? `Video export failed: ${err.message}` : 'Video export failed')
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoRequest])

  return null
}

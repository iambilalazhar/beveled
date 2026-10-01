import { useThree } from '@react-three/fiber'
import type { AudioBufferSource as AudioBufferSourceT, BufferTarget as BufferTargetT } from 'mediabunny'
import { useEffect } from 'react'
import * as THREE from 'three'
import { activeClip, useEditor } from '../store'
import { ensureFont } from '../timeline/cardRender'
import { clipStart, totalDuration } from '../timeline/evaluate'
import { PLACEHOLDER_LOGO } from '../timeline/factory'
import { loadImage } from '../timeline/imageCache'
import type { ExportFormat } from '../types'
import { downloadBlob } from './download'
import { getCachedMedia, loadMediaTexture } from './media'

const MIME: Record<ExportFormat, string> = { png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp' }

function stamp() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

const tick = () => new Promise<void>((r) => setTimeout(r, 0))
const even = (n: number) => Math.max(2, Math.round(n / 2) * 2)

/** Renders the project's audio track into an AudioBuffer covering exactly `duration` seconds. */
async function renderAudio(url: string, duration: number, offset: number, volume: number, fadeOut: boolean): Promise<AudioBuffer> {
  const data = await (await fetch(url)).arrayBuffer()
  const decodeCtx = new AudioContext()
  const decoded = await decodeCtx.decodeAudioData(data)
  void decodeCtx.close()
  const sampleRate = 48000
  const ctx = new OfflineAudioContext(2, Math.max(1, Math.ceil(duration * sampleRate)), sampleRate)
  const src = ctx.createBufferSource()
  src.buffer = decoded
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(volume, 0)
  if (fadeOut && duration > 1.2) {
    gain.gain.setValueAtTime(volume, duration - 1)
    gain.gain.linearRampToValueAtTime(0, duration)
  }
  src.connect(gain).connect(ctx.destination)
  src.start(0, Math.max(0, offset))
  return ctx.startRendering()
}

/**
 * Lives inside the Canvas. Listens for image / video export requests on the store and fulfils them
 * by re-rendering frames at the requested resolution.
 */
export function ExportBridge() {
  const gl = useThree((s) => s.gl)
  const advance = useThree((s) => s.advance)
  const setFrameloop = useThree((s) => s.setFrameloop)
  const size = useThree((s) => s.size)
  const exportRequest = useEditor((s) => s.exportRequest)
  const videoRequest = useEditor((s) => s.videoRequest)

  /* ---------------- still image ---------------- */
  useEffect(() => {
    if (!exportRequest) return
    const { finishExport, setStatus, project } = useEditor.getState()
    const req = exportRequest
    let cancelled = false
    const run = async () => {
      const cssW = size.width
      const cssH = size.height
      let outW = Math.round(cssW * req.scale)
      let outH = Math.round(cssH * req.scale)
      if (project.frame.aspect === 'custom') {
        outW = Math.round(project.frame.customWidth * req.scale)
        outH = Math.round(project.frame.customHeight * req.scale)
      }
      const dpr = outW / cssW
      const prevDpr = gl.getPixelRatio()
      const prevClear = new THREE.Color()
      gl.getClearColor(prevClear)
      const prevAlpha = gl.getClearAlpha()
      try {
        setStatus(`Rendering ${outW}×${outH}…`)
        await new Promise((r) => window.setTimeout(r, 30))
        if (cancelled) return
        gl.setPixelRatio(dpr)
        if (req.transparent) gl.setClearColor(0x000000, 0)
        advance(performance.now(), true)
        advance(performance.now(), true)
        const out = document.createElement('canvas')
        out.width = outW
        out.height = outH
        const ctx = out.getContext('2d')!
        if (req.format === 'jpeg') {
          ctx.fillStyle = '#000'
          ctx.fillRect(0, 0, outW, outH)
        }
        ctx.drawImage(gl.domElement, 0, 0, outW, outH)
        const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, MIME[req.format], req.quality))
        if (!blob) throw new Error('Export failed: could not encode image')
        const ext = req.format === 'jpeg' ? 'jpg' : req.format
        const clip = activeClip(useEditor.getState())
        const kind = clip.kind === 'shot' ? clip.scene.device.kind : clip.kind
        downloadBlob(blob, `beveled-${kind}-${stamp()}.${ext}`)
        setStatus(`Exported ${outW}×${outH} ${ext.toUpperCase()}`)
      } catch (err) {
        console.error(err)
        setStatus(err instanceof Error ? err.message : 'Export failed')
      } finally {
        gl.setPixelRatio(prevDpr)
        gl.setClearColor(prevClear, prevAlpha)
        advance(performance.now(), true)
        finishExport()
        window.setTimeout(() => {
          if (useEditor.getState().status?.startsWith('Exported')) setStatus(null)
        }, 4000)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exportRequest])

  /* ---------------- video ---------------- */
  useEffect(() => {
    if (!videoRequest) return
    const store = useEditor.getState()
    const { setRecording, setStatus } = store
    let cancelled = false
    const isCancelled = () => cancelled || !useEditor.getState().videoRequest

    const finish = (msg: string | null) => {
      setRecording(false)
      setStatus(msg)
      if (msg) window.setTimeout(() => useEditor.getState().status === msg && setStatus(null), 5000)
    }

    /* Frame-accurate path: WebCodecs via mediabunny */
    const runTimeline = async (): Promise<boolean> => {
      if (typeof VideoEncoder === 'undefined') return false
      // Loaded on demand: the encoder library is only needed when exporting video.
      const { AudioBufferSource, BufferTarget, CanvasSource, getFirstEncodableAudioCodec, getFirstEncodableVideoCodec, Mp4OutputFormat, Output, QUALITY_HIGH, WebMOutputFormat } = await import('mediabunny')
      const s = useEditor.getState()
      const project = s.project
      const fps = project.export.fps
      const total = totalDuration(project.clips)
      const frames = Math.max(1, Math.round(total * fps))
      const outH = even(project.export.videoHeight)
      const outW = even((outH * size.width) / Math.max(1, size.height))
      const format = project.export.videoFormat === 'webm' ? new WebMOutputFormat() : new Mp4OutputFormat({ fastStart: 'in-memory' })
      // Alpha needs VP9 in WebM and a transparent background.
      const alpha = project.export.videoFormat === 'webm' && project.export.videoAlpha && project.export.transparent
      const codecs = alpha ? format.getSupportedVideoCodecs().filter((c) => c === 'vp9') : format.getSupportedVideoCodecs()
      const videoCodec = await getFirstEncodableVideoCodec(codecs, { width: outW, height: outH })
      if (!videoCodec) return false
      const samples = Math.max(1, Math.round(project.export.motionBlur))

      setStatus('Preparing media…')
      // Preload everything the timeline shows so no frame renders a placeholder.
      await Promise.all(
        project.clips.map(async (c) => {
          if (c.kind === 'shot' && c.scene.media.url) await loadMediaTexture(c.scene.media.url, c.scene.media.kind === 'video' ? 'video' : 'image').catch(() => undefined)
          if (c.kind === 'logo') await loadImage(c.logo.url ?? PLACEHOLDER_LOGO).catch(() => undefined)
          if (c.kind === 'text') await ensureFont(c.text.font, c.text.weight)
        })
      )
      if (isCancelled()) return true

      const frameCanvas = document.createElement('canvas')
      frameCanvas.width = outW
      frameCanvas.height = outH
      const fctx = frameCanvas.getContext('2d')!
      const output = new Output({ format, target: new BufferTarget() })
      const videoSource = new CanvasSource(frameCanvas, {
        codec: videoCodec,
        bitrate: project.export.videoBitrate * 1_000_000,
        keyFrameInterval: 2,
        ...(alpha ? { alpha: 'keep' as const } : {}),
      })
      output.addVideoTrack(videoSource, { frameRate: fps })

      let audioBuffer: AudioBuffer | null = null
      let audioSource: AudioBufferSourceT | null = null
      if (project.audio.url) {
        try {
          const audioCodec = await getFirstEncodableAudioCodec(format.getSupportedAudioCodecs())
          if (audioCodec) {
            audioBuffer = await renderAudio(project.audio.url, total, project.audio.offset, project.audio.volume, project.audio.fadeOut)
            audioSource = new AudioBufferSource({ codec: audioCodec, bitrate: QUALITY_HIGH })
            output.addAudioTrack(audioSource)
          }
        } catch (err) {
          console.warn('Audio skipped', err)
        }
      }
      await output.start()
      if (audioSource && audioBuffer) await audioSource.add(audioBuffer)

      const prevDpr = gl.getPixelRatio()
      const prevTime = s.time
      const prevClear = new THREE.Color()
      gl.getClearColor(prevClear)
      const prevAlpha = gl.getClearAlpha()
      setFrameloop('never')
      gl.setPixelRatio(outH / Math.max(1, size.height))
      if (alpha) gl.setClearColor(0x000000, 0)
      let lastClipId = ''
      try {
        for (let i = 0; i < frames; i++) {
          if (isCancelled()) break
          const t = Math.min(i / fps, total - 1e-4)
          useEditor.getState().setTimeFromPlayback(t)
          const st = useEditor.getState()
          const clip = activeClip(st)
          if (clip.id !== lastClipId) {
            // Let React mount the new clip, then give it a couple of frames to settle (env maps, shadows).
            lastClipId = clip.id
            await tick()
            await tick()
            advance(performance.now(), true)
            await tick()
          }
          if (clip.kind === 'shot' && clip.scene.media.kind === 'video') {
            const entry = getCachedMedia(clip.scene.media.url)
            const video = entry?.video
            if (video && video.duration) {
              const local = t - clipStart(st.project.clips, clip.id)
              video.pause()
              const target = local % video.duration
              if (Math.abs(video.currentTime - target) > 0.5 / fps) {
                await new Promise<void>((resolve) => {
                  const done = () => resolve()
                  video.addEventListener('seeked', done, { once: true })
                  video.currentTime = target
                  window.setTimeout(done, 500)
                })
              }
              entry.texture.needsUpdate = true
            }
          }
          fctx.clearRect(0, 0, outW, outH)
          if (samples > 1) {
            // Motion blur: average sub-frames spread over half a frame (a 180° shutter).
            for (let j = 0; j < samples; j++) {
              const st2 = Math.min(total - 1e-4, Math.max(0, t + ((j + 0.5) / samples - 0.5) * (0.5 / fps)))
              useEditor.getState().setTimeFromPlayback(st2)
              advance(performance.now(), true)
              fctx.globalAlpha = 1 / (j + 1)
              fctx.drawImage(gl.domElement, 0, 0, outW, outH)
            }
            fctx.globalAlpha = 1
          } else {
            advance(performance.now(), true)
            fctx.drawImage(gl.domElement, 0, 0, outW, outH)
          }
          await videoSource.add(i / fps, 1 / fps)
          if (i % 5 === 0) {
            const p = (i + 1) / frames
            setRecording(true, p)
            setStatus(`Rendering video ${Math.round(p * 100)}%`)
            await tick()
          }
        }
        if (isCancelled()) {
          await output.cancel()
          finish('Video export cancelled')
          return true
        }
        setStatus('Finalizing video…')
        await output.finalize()
        const buffer = (output.target as BufferTargetT).buffer
        if (!buffer) throw new Error('Encoder produced no data')
        const ext = format.fileExtension
        downloadBlob(new Blob([buffer], { type: format.mimeType }), `beveled-${stamp()}${ext}`)
        finish(`Saved ${outW}×${outH} ${ext.slice(1).toUpperCase()} · ${total.toFixed(1)}s`)
      } finally {
        gl.setPixelRatio(prevDpr)
        gl.setClearColor(prevClear, prevAlpha)
        setFrameloop('always')
        for (const c of project.clips) {
          if (c.kind === 'shot' && c.scene.media.kind === 'video') {
            const v = getCachedMedia(c.scene.media.url)?.video
            if (v) void v.play().catch(() => undefined)
          }
        }
        useEditor.getState().setTimeFromPlayback(prevTime)
      }
      return true
    }

    /* Fallback: record the canvas in real time while the timeline plays. */
    const runRealtime = async () => {
      const canvas = gl.domElement as HTMLCanvasElement & { captureStream?: (fps?: number) => MediaStream }
      const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find((m) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m))
      if (typeof canvas.captureStream !== 'function' || !mime) {
        finish('Video recording is not supported in this browser')
        return
      }
      const s = useEditor.getState()
      const total = totalDuration(s.project.clips)
      const stream = canvas.captureStream(s.project.export.fps)
      const chunks: Blob[] = []
      const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: s.project.export.videoBitrate * 1_000_000 })
      recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data)
      const started = performance.now()
      let t = 0
      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve()
        recorder.start(200)
        const step = () => {
          if (isCancelled() || t >= total) {
            if (recorder.state !== 'inactive') recorder.stop()
            return
          }
          t = (performance.now() - started) / 1000
          useEditor.getState().setTimeFromPlayback(Math.min(t, total - 1e-3))
          setRecording(true, Math.min(1, t / total))
          setStatus(`Recording ${Math.round(Math.min(1, t / total) * 100)}%`)
          requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
      })
      stream.getTracks().forEach((tr) => tr.stop())
      const blob = new Blob(chunks, { type: 'video/webm' })
      if (blob.size) downloadBlob(blob, `beveled-${stamp()}.webm`)
      finish(blob.size ? 'Saved WebM video' : 'Recording produced no data')
    }

    const run = async () => {
      try {
        const handled = videoRequest.mode === 'timeline' ? await runTimeline() : false
        if (!handled && !cancelled) await runRealtime()
      } catch (err) {
        console.error(err)
        finish(err instanceof Error ? `Video export failed: ${err.message}` : 'Video export failed')
      }
    }
    void run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoRequest])

  return null
}

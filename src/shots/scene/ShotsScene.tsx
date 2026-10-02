import { Bloom, ChromaticAberration, EffectComposer, Noise, Vignette } from '@react-three/postprocessing'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { BlendFunction } from 'postprocessing'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Background } from '@/mockup/scene/Background'
import { FocusBlurEffect } from '@/mockup/scene/effects/FocusBlurEffect'
import { LightShadowEffect } from '@/mockup/scene/effects/StyleEffects'
import { computeFit, useMediaTexture } from '@/mockup/scene/media'
import type { MediaState } from '@/mockup/types'
import { useShots } from '../store'
import { layoutAt, totalDuration } from '../timeline'
import type { FrameState2D, MockupState } from '../types'
import { cardSpec, renderCard, renderSilhouette, type CardSpec } from './cards'
import { drawTextBlock, splitRegions } from './textBlock'
import { ensureFont } from '@/mockup/timeline/cardRender'
import type { TextState2D } from '../types'
import { ShotsExportBridge } from './ShotsExportBridge'

const FOV = 22
const DIST = 1 / Math.tan(THREE.MathUtils.degToRad(FOV / 2))
const D2R = THREE.MathUtils.degToRad
const now = () => useShots.getState().time

/* ------------------------------------------------------------------ */
/* Screen: media with rounded corners, fit and scroll                  */
/* ------------------------------------------------------------------ */

const screenVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const screenFrag = /* glsl */ `
  uniform sampler2D map;
  uniform vec2 size;
  uniform float rTop;
  uniform float rBottom;
  uniform vec2 fitScale;
  uniform float scroll;
  varying vec2 vUv;
  float sdRR(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }
  void main() {
    vec2 p = (vUv - 0.5) * size;
    float r = p.y > 0.0 ? rTop : rBottom;
    float d = sdRR(p, size * 0.5, r);
    float aa = max(fwidth(d), 1e-3);
    float alpha = 1.0 - smoothstep(-aa, aa, d);
    vec2 q = (vUv - 0.5) * fitScale + 0.5;
    if (fitScale.y < 1.0) q.y += (0.5 - fitScale.y * 0.5) * (1.0 - 2.0 * scroll);
    vec4 c = (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0) ? vec4(0.0, 0.0, 0.0, 1.0) : texture2D(map, q);
    gl_FragColor = vec4(c.rgb, alpha);
    #include <colorspace_fragment>
  }
`

function useTexture(canvas: HTMLCanvasElement | null) {
  const texture = useMemo(() => {
    if (!canvas) return null
    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return t
  }, [canvas])
  useEffect(() => () => texture?.dispose(), [texture])
  return texture
}

type CardLayout = { card: CardSpec; media: MediaState; x: number; scale: number }

/** Builds the soft shadow texture for a card. Shadows are blurred, so a small canvas is plenty. */
function buildShadow(card: CardSpec, frame: HTMLCanvasElement, style: MockupState['shadow'], image: CanvasImageSource | null) {
  const maxDim = Math.max(card.width, card.height)
  const sc = 420 / maxDim
  const pad = maxDim * 0.28
  const c = document.createElement('canvas')
  c.width = Math.ceil((card.width + pad * 2) * sc)
  c.height = Math.ceil((card.height + pad * 2) * sc)
  const ctx = c.getContext('2d')!
  const sil = renderSilhouette(card, frame, sc)
  const off = 10000
  const shadowPass = (blur: number, alpha: number) => {
    ctx.save()
    ctx.shadowColor = `rgba(0,0,0,${alpha})`
    ctx.shadowBlur = blur * sc
    ctx.shadowOffsetX = off
    ctx.drawImage(sil, pad * sc - off, pad * sc)
    ctx.restore()
  }
  if (style === 'spread') {
    shadowPass(maxDim * 0.07, 0.85)
    shadowPass(maxDim * 0.02, 0.45)
  } else if (style === 'hug') {
    shadowPass(maxDim * 0.012, 1)
    shadowPass(maxDim * 0.004, 0.6)
  } else if (style === 'adaptive' && image) {
    ctx.filter = `blur(${maxDim * 0.06 * sc}px) saturate(1.8)`
    ctx.drawImage(image, pad * sc + card.screen.x * sc * 0.6, pad * sc + card.screen.y * sc * 0.6, card.width * sc * 0.95, card.height * sc * 0.95)
    ctx.filter = 'none'
    shadowPass(maxDim * 0.02, 0.4)
  }
  return { canvas: c, pad }
}

function DeviceCard({ item, mockup, index }: { item: CardLayout; mockup: MockupState; index: number }) {
  const { card, media, x, scale } = item
  const { texture, aspect } = useMediaTexture(media, card.screen.w / card.screen.h)
  const frameCanvas = useMemo(() => renderCard(card), [card])
  const frameTexture = useTexture(frameCanvas)
  const shadow = useMemo(() => {
    if (mockup.shadow === 'none') return null
    const img = (texture.image as CanvasImageSource | undefined) ?? null
    return buildShadow(card, frameCanvas, mockup.shadow, img)
  }, [card, frameCanvas, mockup.shadow, texture])
  const shadowTexture = useTexture(shadow?.canvas ?? null)

  const screenMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: screenVert,
        fragmentShader: screenFrag,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          map: { value: null },
          size: { value: new THREE.Vector2(1, 1) },
          rTop: { value: 0 },
          rBottom: { value: 0 },
          fitScale: { value: new THREE.Vector2(1, 1) },
          scroll: { value: 0 },
        },
      }),
    []
  )
  useEffect(() => () => screenMat.dispose(), [screenMat])
  const s = card.screen
  const fit = computeFit(s.w, s.h, aspect, mockup.fit, false)
  screenMat.uniforms.map.value = texture
  screenMat.uniforms.size.value.set(s.w, s.h)
  screenMat.uniforms.rTop.value = s.rTop
  screenMat.uniforms.rBottom.value = s.rBottom
  screenMat.uniforms.fitScale.value.set(fit.fitScale[0], fit.fitScale[1])
  screenMat.uniforms.scroll.value = mockup.scroll

  useEffect(() => {
    const img = texture.image as unknown
    if (img instanceof HTMLVideoElement && img.paused) void img.play().catch(() => undefined)
  }, [texture])

  // Card-space (px, y down) to local world units centred on the card.
  const cx = (s.x + s.w / 2 - card.width / 2) * scale
  const cy = -(s.y + s.h / 2 - card.height / 2) * scale
  const a = D2R(mockup.lightAngle)
  const fall = mockup.lightDistance * card.height * scale * (mockup.shadow === 'hug' ? 0.012 : mockup.shadow === 'adaptive' ? 0.03 : 0.05)
  const order = index * 10
  return (
    <group position={[x, 0, 0]}>
      {shadow && shadowTexture && (
        <mesh position={[-Math.sin(a) * fall, -Math.cos(a) * fall, -0.002]} renderOrder={order + 1}>
          <planeGeometry args={[(card.width + shadow.pad * 2) * scale, (card.height + shadow.pad * 2) * scale]} />
          <meshBasicMaterial map={shadowTexture} transparent opacity={Math.min(1, mockup.shadowOpacity * (mockup.shadow === 'spread' ? 1.5 : 1.4))} depthTest={false} depthWrite={false} toneMapped={false} />
        </mesh>
      )}
      <mesh position={[cx, cy, 0]} renderOrder={order + 2} material={screenMat}>
        <planeGeometry args={[s.w * scale, s.h * scale]} />
      </mesh>
      {frameTexture && (
        <mesh position={[0, 0, 0.001]} renderOrder={order + 3}>
          <planeGeometry args={[card.width * scale, card.height * scale]} />
          <meshBasicMaterial map={frameTexture} transparent depthTest={false} depthWrite={false} toneMapped={false} />
        </mesh>
      )}
    </group>
  )
}

/** Places 1–3 cards side by side and fits them inside the frame. */
function useCardLayouts(mockup: MockupState, aspect: number, region: { w: number; h: number }): CardLayout[] {
  const main = mockup.media[0]
  const mediaKey = mockup.media.map((m) => `${m?.url}|${m?.width}x${m?.height}`).join(';')
  return useMemo(() => {
    const medias = Array.from({ length: mockup.count }, (_, i) => (i > 0 && mockup.media[i]?.url ? mockup.media[i]! : main!))
    const cards = medias.map((m) => cardSpec(mockup, m.width && m.height ? m.width / m.height : 16 / 10))
    // Normalise so every card has the same height.
    const H = Math.max(...cards.map((c) => c.height))
    const widths = cards.map((c) => c.width * (H / c.height))
    const gap = mockup.gap * H
    const totalW = widths.reduce((a, w) => a + w, 0) + gap * (cards.length - 1)
    const full = region.w >= 1 && region.h >= 1
    const fill = full ? 0.8 : 0.86
    const boxW = 2 * aspect * region.w * fill
    const boxH = 2 * region.h * fill
    const k = Math.min(boxW / totalW, boxH / H)
    let cursor = -totalW / 2
    return cards.map((card, i) => {
      const w = widths[i]
      const item = { card, media: medias[i], x: (cursor + w / 2) * k, scale: (H / card.height) * k }
      cursor += w + gap
      return item
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mockup.kind, mockup.model, mockup.finish, mockup.style, mockup.radius, mockup.borderWidth, mockup.borderColor, mockup.browserStyle, mockup.browserDark, mockup.browserUrl, mockup.orientation, mockup.count, mockup.gap, mediaKey, aspect, region.w, region.h])
}

function Mockup({ mockup, text }: { mockup: MockupState; text: TextState2D }) {
  const size = useThree((s) => s.size)
  const aspect = size.width / Math.max(1, size.height)
  const region = splitRegions(text.placement, text.area).mockup
  const items = useCardLayouts(mockup, aspect, region)
  // Centre of the mockup's share of the frame, in world units.
  const ox = (region.x + region.w / 2 - 0.5) * 2 * aspect
  const oy = -(region.y + region.h / 2 - 0.5) * 2
  const ref = useRef<THREE.Group>(null)
  useFrame(() => {
    const g = ref.current
    if (!g) return
    const s = useShots.getState()
    const l = layoutAt(s.project, s.time)
    let rx = l.rotateX
    let ry = l.rotateY
    if (s.project.frame.parallax) {
      const t = s.time
      rx += Math.sin(t * 0.9) * 3
      ry += Math.sin(t * 0.7 + 1) * 4
    }
    g.position.set(ox + l.x * aspect, oy + l.y, 0)
    g.rotation.set(-D2R(rx), D2R(ry), -D2R(l.rotateZ), 'XYZ')
    g.scale.setScalar(Math.max(0.05, l.zoom))
  })
  if (mockup.hidden) return null
  return (
    <group ref={ref}>
      {items.map((item, i) => (
        <DeviceCard key={i} item={item} mockup={mockup} index={i} />
      ))}
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Scene extras                                                        */
/* ------------------------------------------------------------------ */

function rng(seed: number) {
  let s = seed >>> 0 || 1
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
}

/** Soft decorative shapes behind the mockup (shots.so "Shapes" scene). */
function Shapes({ frame }: { frame: FrameState2D }) {
  const size = useThree((s) => s.size)
  const aspect = size.width / Math.max(1, size.height)
  const canvas = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 1600
    c.height = Math.round(1600 / aspect)
    const ctx = c.getContext('2d')!
    const rand = rng(frame.shapesSeed * 7919)
    const palette = ['#fda4af', '#a5b4fc', '#fcd34d', '#6ee7b7', '#f0abfc', '#93c5fd', '#fdba74', '#e05d38']
    const start = Math.floor(rand() * palette.length)
    for (let i = 0; i < 9; i++) {
      const color = palette[(start + i * 3) % palette.length]
      const x = rand() * c.width
      const y = rand() * c.height
      const r = (0.06 + rand() * 0.14) * c.width
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rand() * Math.PI)
      ctx.shadowColor = 'rgba(0,0,0,0.12)'
      ctx.shadowBlur = r * 0.25
      ctx.shadowOffsetY = r * 0.08
      const g = ctx.createLinearGradient(-r, -r, r, r)
      g.addColorStop(0, color)
      g.addColorStop(1, `${color}aa`)
      ctx.fillStyle = g
      ctx.beginPath()
      const kind = i % 3
      if (kind === 0) ctx.arc(0, 0, r, 0, Math.PI * 2)
      else if (kind === 1) ctx.roundRect(-r, -r, r * 2, r * 2, r * 0.35)
      else ctx.roundRect(-r * 1.4, -r * 0.45, r * 2.8, r * 0.9, r * 0.45)
      ctx.fill()
      ctx.restore()
    }
    return c
  }, [frame.shapesSeed, aspect])
  const texture = useTexture(canvas)
  const depth = 0.8
  const k = (DIST + depth) / DIST
  if (!texture) return null
  return (
    <mesh position={[0, 0, -depth]} renderOrder={-500}>
      <planeGeometry args={[2 * aspect * k, 2 * k]} />
      <meshBasicMaterial map={texture} transparent depthTest={false} depthWrite={false} toneMapped={false} />
    </mesh>
  )
}

/** Headline, subtitle, eyebrow and badge drawn into a frame-sized canvas, animated per line / word / letter. */
function TextLayer({ text, frame }: { text: TextState2D; frame: FrameState2D }) {
  const size = useThree((s) => s.size)
  const aspect = size.width / Math.max(1, size.height)
  const [fontsTick, setFontsTick] = useState(0)
  useEffect(() => {
    let cancelled = false
    Promise.all([ensureFont(text.font, text.weight), ensureFont(text.bodyFont, 400), ensureFont(text.bodyFont, 600)]).then(() => !cancelled && setFontsTick((n) => n + 1))
    return () => {
      cancelled = true
    }
  }, [text.font, text.bodyFont, text.weight])
  const k = Math.min(2, 4096 / Math.max(frame.width, frame.height))
  const W = Math.round(frame.width * k)
  const H = Math.round(frame.height * k)
  const region = useMemo(() => {
    const r = splitRegions(text.placement, text.area).text
    return { x: r.x * W, y: r.y * H, w: r.w * W, h: r.h * H }
  }, [text.placement, text.area, W, H])
  const canvas = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = W
    c.height = H
    return c
  }, [W, H])
  const draw = (time: number | null) => {
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, W, H)
    return drawTextBlock(ctx, W, H, text, region, time)
  }
  // Final (static) state, redrawn on every change; also publishes the block's bounds for dragging.
  const texture = useTexture(canvas)
  useEffect(() => {
    const b = draw(null)
    if (texture) texture.needsUpdate = true
    useShots.getState().setTextBounds(b ? { x: b.x / W, y: b.y / H, w: b.w / W, h: b.h / H } : null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, region, canvas, texture, fontsTick])
  useEffect(() => () => useShots.getState().setTextBounds(null), [])
  const animatedRef = useRef(false)
  useFrame(() => {
    if (!texture) return
    const s = useShots.getState()
    const on = text.animate !== false && text.enter !== 'none' && (s.playing || s.recording) && s.time < text.enterDuration + 0.05
    if (on) {
      draw(s.time)
      texture.needsUpdate = true
      animatedRef.current = true
    } else if (animatedRef.current) {
      draw(null)
      texture.needsUpdate = true
      animatedRef.current = false
    }
  })
  if (!texture) return null
  return (
    <mesh renderOrder={950}>
      <planeGeometry args={[2 * aspect, 2]} />
      <meshBasicMaterial map={texture} transparent depthTest={false} depthWrite={false} toneMapped={false} />
    </mesh>
  )
}

function Watermark({ text }: { text: string }) {
  const size = useThree((s) => s.size)
  const aspect = size.width / Math.max(1, size.height)
  const canvas = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 1024
    c.height = 128
    const ctx = c.getContext('2d')!
    ctx.font = '600 56px Inter, -apple-system, system-ui, sans-serif'
    const w = Math.min(1000, ctx.measureText(text).width + 60)
    ctx.fillStyle = 'rgba(0,0,0,0.35)'
    ctx.beginPath()
    ctx.roundRect(1024 - w, 20, w, 88, 44)
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.92)'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, 1024 - 30, 66)
    return c
  }, [text])
  const texture = useTexture(canvas)
  const h = 0.085
  const w = h * 8
  if (!texture) return null
  return (
    <mesh position={[aspect - w / 2 - 0.04, -1 + h / 2 + 0.04, 0]} renderOrder={900}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={texture} transparent depthTest={false} depthWrite={false} toneMapped={false} />
    </mesh>
  )
}

function Portrait({ amount }: { amount: number }) {
  const size = useThree((s) => s.size)
  const effect = useMemo(() => new FocusBlurEffect(), [])
  useEffect(() => () => effect.dispose(), [effect])
  effect.setParams({ mode: 'radial', strength: amount * 16, falloff: 0.45, bokeh: 0.6, focusX: 0.5, focusY: 0.5, focusSize: 0.32, angle: 0, aspect: size.width / Math.max(1, size.height) })
  return <primitive object={effect} />
}

function LightShadow({ frame }: { frame: FrameState2D }) {
  const effect = useMemo(() => new LightShadowEffect(), [])
  useEffect(() => () => effect.dispose(), [effect])
  useFrame(() => effect.setParams({ opacity: frame.lightShadowOpacity, pattern: frame.lightShadowPattern, angle: D2R(24), softness: 0.5, time: now() }))
  return <primitive object={effect} />
}

function Effects2D({ frame }: { frame: FrameState2D }) {
  const shadowOn = frame.scene === 'shadow'
  const chroma = useMemo(() => new THREE.Vector2(frame.chromatic * 0.004, frame.chromatic * 0.004), [frame.chromatic])
  const signature = [shadowOn, frame.portrait > 0, frame.bloom > 0, frame.chromatic > 0, frame.vignette > 0, frame.grain > 0].join('|')
  return (
    <EffectComposer key={signature} multisampling={4} enableNormalPass={false}>
      {frame.portrait > 0 ? <Portrait amount={frame.portrait} /> : <></>}
      {shadowOn ? <LightShadow frame={frame} /> : <></>}
      {frame.bloom > 0 ? <Bloom intensity={frame.bloom * 1.2} luminanceThreshold={0.85} mipmapBlur radius={0.6} /> : <></>}
      {frame.chromatic > 0 ? <ChromaticAberration offset={chroma} radialModulation modulationOffset={0.3} /> : <></>}
      {frame.vignette > 0 ? <Vignette darkness={frame.vignette} offset={0.25} eskil={false} /> : <></>}
      {frame.grain > 0 ? <Noise premultiply blendFunction={BlendFunction.ADD} opacity={frame.grain} /> : <></>}
    </EffectComposer>
  )
}

function Playback() {
  useFrame((_, delta) => {
    const s = useShots.getState()
    if (!s.playing || s.recording || s.exporting) return
    const total = totalDuration(s.project)
    let t = s.time + Math.min(delta, 0.1)
    if (t >= total) {
      if (s.loop) t %= total
      else {
        s.setTimeFromPlayback(total)
        s.setPlaying(false)
        return
      }
    }
    s.setTimeFromPlayback(t)
  })
  return null
}

function CameraSetup() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  useEffect(() => {
    camera.fov = FOV
    camera.position.set(0, 0, DIST)
    camera.near = 0.05
    camera.far = 50
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
  }, [camera])
  return null
}

function Content() {
  const mockup = useShots((s) => s.project.mockup)
  const frame = useShots((s) => s.project.frame)
  const text = useShots((s) => s.project.text)
  return (
    <>
      <Playback />
      <CameraSetup />
      <Background bg={frame.background} time={now} />
      {frame.scene === 'shapes' && <Shapes frame={frame} />}
      {text.placement !== 'none' && <TextLayer text={text} frame={frame} />}
      <Mockup mockup={mockup} text={text} />
      {frame.watermark && <Watermark text={frame.watermarkText || 'Made with Beveled'} />}
      <Effects2D frame={frame} />
      <ShotsExportBridge />
    </>
  )
}

/** The 2-D studio's WebGL stage: flat mockups with CSS-like perspective tilt. */
export function ShotsScene() {
  return (
    <Canvas
      flat
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true, toneMapping: THREE.NoToneMapping }}
      camera={{ fov: FOV, near: 0.05, far: 50, position: [0, 0, DIST] }}
      onCreated={(state) => {
        state.gl.setClearColor(0x000000, 0)
        if (import.meta.env.DEV) (window as unknown as { __shotsR3F?: unknown }).__shotsR3F = state
      }}
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <Content />
    </Canvas>
  )
}


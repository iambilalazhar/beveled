import { Bloom, ChromaticAberration, DepthOfField, EffectComposer, Noise, Vignette } from '@react-three/postprocessing'
import { useFrame, useThree } from '@react-three/fiber'
import { BlendFunction, type BloomEffect, type VignetteEffect } from 'postprocessing'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { fadeAmount } from '../timeline/evaluate'
import type { Clip, ShotClip } from '../timeline/types'
import type { EffectId, EffectsState } from '../types'
import { useEditor } from '../store'
import { FocusBlurEffect, type FocusBlurMode } from './effects/FocusBlurEffect'
import { FadeEffect, FisheyeEffect, GradeEffect } from './effects/GradeEffects'
import { SharpenEffect } from './effects/SharpenEffect'
import { GlassFrameEffect, glassBorderParams, LightShadowEffect, liquidGlassParams, PixelGridEffect } from './effects/StyleEffects'
import type { DeviceLayout } from './layout'
import { localTimeOf, sampleNow } from './shotContext'

function FocusBlur({ clip, mode }: { clip: ShotClip; mode: FocusBlurMode }) {
  const size = useThree((s) => s.size)
  const effect = useMemo(() => new FocusBlurEffect(), [])
  useEffect(() => () => effect.dispose(), [effect])
  useFrame(() => {
    effect.setParams({
      mode,
      strength: sampleNow(clip, 'depth.strength'),
      falloff: sampleNow(clip, 'depth.falloff'),
      bokeh: sampleNow(clip, 'depth.bokeh'),
      focusX: sampleNow(clip, 'depth.focusX'),
      focusY: sampleNow(clip, 'depth.focusY'),
      focusSize: sampleNow(clip, 'depth.focusSize'),
      angle: THREE.MathUtils.degToRad(sampleNow(clip, 'depth.angle')),
      aspect: size.width / Math.max(1, size.height),
    })
  })
  return <primitive object={effect} />
}

function Sharpen({ amount }: { amount: number }) {
  const effect = useMemo(() => new SharpenEffect(), [])
  useEffect(() => () => effect.dispose(), [effect])
  effect.amount = amount
  return <primitive object={effect} />
}

function Fisheye({ amount }: { amount: number }) {
  const size = useThree((s) => s.size)
  const effect = useMemo(() => new FisheyeEffect(), [])
  useEffect(() => () => effect.dispose(), [effect])
  effect.setParams(amount, size.width / Math.max(1, size.height))
  return <primitive object={effect} />
}

function PixelGrid({ amount }: { amount: number }) {
  const effect = useMemo(() => new PixelGridEffect(), [])
  useEffect(() => () => effect.dispose(), [effect])
  effect.amount = amount
  return <primitive object={effect} />
}

function GlassFrame({ fx, kind }: { fx: EffectsState; kind: 'border' | 'liquid' }) {
  const effect = useMemo(() => new GlassFrameEffect(), [])
  useEffect(() => () => effect.dispose(), [effect])
  effect.setParams(kind === 'border' ? glassBorderParams(fx.glassBorder) : liquidGlassParams(fx.liquidGlass, fx.liquidGlassShine))
  return <primitive object={effect} />
}

function LightShadow({ fx }: { fx: EffectsState }) {
  const effect = useMemo(() => new LightShadowEffect(), [])
  useEffect(() => () => effect.dispose(), [effect])
  useFrame(() => {
    effect.setParams({
      opacity: fx.lightShadow,
      pattern: fx.lightShadowPattern,
      angle: THREE.MathUtils.degToRad(fx.lightShadowAngle),
      softness: fx.lightShadowSoftness,
      time: useEditor.getState().time,
    })
  })
  return <primitive object={effect} />
}

function Grade({ clip }: { clip: ShotClip }) {
  const effect = useMemo(() => new GradeEffect(), [])
  useEffect(() => () => effect.dispose(), [effect])
  useFrame(() => {
    const fx = clip.scene.effects
    effect.setParams({
      exposure: sampleNow(clip, 'effects.exposure'),
      brightness: fx.brightness,
      contrast: fx.contrast,
      saturation: sampleNow(clip, 'effects.saturation'),
      hue: THREE.MathUtils.degToRad(fx.hue),
      shadows: fx.shadows,
      midtones: fx.midtones,
      highlights: fx.highlights,
    })
  })
  return <primitive object={effect} />
}

function Fade({ clip }: { clip: Clip }) {
  const effect = useMemo(() => new FadeEffect(), [])
  useEffect(() => () => effect.dispose(), [effect])
  useFrame(() => {
    effect.amount = fadeAmount(clip, localTimeOf(clip))
  })
  return <primitive object={effect} />
}

function AnimatedBloom({ clip }: { clip: ShotClip }) {
  const ref = useRef<BloomEffect>(null)
  useFrame(() => {
    if (ref.current) ref.current.intensity = sampleNow(clip, 'effects.bloom') * 1.2
  })
  return <Bloom ref={ref} intensity={clip.scene.effects.bloom * 1.2} luminanceThreshold={clip.scene.effects.bloomThreshold} luminanceSmoothing={0.08} mipmapBlur radius={clip.scene.effects.bloomRadius} />
}

function AnimatedVignette({ clip }: { clip: ShotClip }) {
  const ref = useRef<VignetteEffect>(null)
  useFrame(() => {
    if (ref.current) ref.current.darkness = sampleNow(clip, 'effects.vignette')
  })
  return <Vignette ref={ref} darkness={clip.scene.effects.vignette} offset={0.25} eskil={false} />
}

const hasKeys = (clip: ShotClip, key: keyof ShotClip['tracks']) => !!clip.tracks[key]?.length

/** The post-processing stack. Effects at their neutral value (and not keyframed) are not mounted. */
export function Effects({ clip, layout }: { clip: Clip; layout: DeviceLayout | null }) {
  const shot = clip.kind === 'shot' ? clip : null
  const depth = shot?.scene.depth
  const fx = shot?.scene.effects
  const screenTarget = useMemo<[number, number, number] | null>(
    () => (layout ? [layout.screenCenter[0], layout.screenCenter[1], layout.screenCenter[2]] : null),
    [layout]
  )
  const chromaOffset = useMemo(() => new THREE.Vector2((fx?.chromatic ?? 0) * 0.004, (fx?.chromatic ?? 0) * 0.004), [fx?.chromatic])
  const focusBlurMode = depth && (depth.mode === 'tilt-shift' || depth.mode === 'radial' || depth.mode === 'directional') ? depth.mode : null
  const grade =
    !!shot &&
    !!fx &&
    (fx.exposure !== 0 || fx.brightness !== 0 || fx.contrast !== 0 || fx.saturation !== 0 || fx.hue !== 0 || fx.shadows !== 0 || fx.midtones !== 0 || fx.highlights !== 0 || hasKeys(shot, 'effects.exposure') || hasKeys(shot, 'effects.saturation'))

  const shown = (id: EffectId) => !!shot && !!fx && !fx.hidden?.includes(id)
  const fisheyeOn = shown('fisheye') && fx!.fisheye > 0
  const bloomOn = shown('bloom') && (fx!.bloom > 0 || hasKeys(shot!, 'effects.bloom'))
  const chromaOn = shown('chromatic') && fx!.chromatic > 0
  const sharpenOn = shown('sharpen') && fx!.sharpen > 0
  const grainOn = shown('grain') && fx!.grain > 0
  const vignetteOn = shown('vignette') && (fx!.vignette > 0 || hasKeys(shot!, 'effects.vignette'))
  const pixelOn = shown('pixelGrid') && fx!.pixelGrid > 0
  const borderOn = shown('glassBorder') && fx!.glassBorder > 0
  const liquidOn = shown('liquidGlass') && fx!.liquidGlass > 0 && fx!.liquidGlassTarget === 'frame'
  const shadowOn = shown('lightShadow') && fx!.lightShadow > 0
  const lensMode = shot && depth?.mode === 'lens' ? (depth.autoFocus && screenTarget ? 'auto' : 'manual') : 'off'
  // The composer does not reliably rebuild its pipeline when effects are added or removed, which can
  // leave a stale frame on screen. Remounting it whenever the effect set changes avoids that.
  const signature = [fisheyeOn, focusBlurMode, lensMode, bloomOn, chromaOn, grade, sharpenOn, grainOn, vignetteOn, pixelOn, borderOn, liquidOn, shadowOn].map(String).join('|')

  return (
    <EffectComposer
      key={signature}
      multisampling={4}
      enableNormalPass={false}
      ref={(composer) => {
        if (import.meta.env.DEV) (window as unknown as { __beveledComposer?: unknown }).__beveledComposer = composer
      }}
    >
      {fisheyeOn ? <Fisheye amount={fx!.fisheye} /> : <></>}
      {shot && focusBlurMode ? <FocusBlur clip={shot} mode={focusBlurMode} /> : <></>}
      {shot && depth?.mode === 'lens' ? (
        depth.autoFocus && screenTarget ? (
          <DepthOfField target={screenTarget} worldFocusRange={depth.focalLength} bokehScale={depth.bokeh * 4} resolutionScale={1} />
        ) : (
          <DepthOfField worldFocusDistance={depth.focusDistance} worldFocusRange={depth.focalLength} bokehScale={depth.bokeh * 4} resolutionScale={1} />
        )
      ) : (
        <></>
      )}
      {shadowOn ? <LightShadow fx={fx!} /> : <></>}
      {bloomOn ? <AnimatedBloom clip={shot!} /> : <></>}
      {chromaOn ? <ChromaticAberration offset={chromaOffset} radialModulation modulationOffset={0.3} /> : <></>}
      {grade && shot ? <Grade clip={shot} /> : <></>}
      {sharpenOn ? <Sharpen amount={fx!.sharpen} /> : <></>}
      {pixelOn ? <PixelGrid amount={fx!.pixelGrid} /> : <></>}
      {vignetteOn ? <AnimatedVignette clip={shot!} /> : <></>}
      {liquidOn ? <GlassFrame fx={fx!} kind="liquid" /> : <></>}
      {borderOn ? <GlassFrame fx={fx!} kind="border" /> : <></>}
      {grainOn ? <Noise premultiply blendFunction={BlendFunction.ADD} opacity={fx!.grain} /> : <></>}
      <Fade clip={clip} />
    </EffectComposer>
  )
}

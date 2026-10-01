import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo } from 'react'
import * as THREE from 'three'
import { useActiveClip, useEditor } from '../store'
import { totalDuration } from '../timeline/evaluate'
import type { ShotClip } from '../timeline/types'
import { Background } from './Background'
import { CameraRig } from './CameraRig'
import { LogoCard, TextCard } from './Cards'
import { Device } from './devices'
import { Effects } from './Effects'
import { ExportBridge } from './ExportBridge'
import { Floor } from './Floor'
import { computeDeviceLayout, type DeviceLayout } from './layout'
import { Lights } from './Lights'
import { MotionGroup } from './MotionGroup'
import { DeviceSlotContext } from './deviceSlot'
import { groupLayout, groupSlots } from './group'
import { SetPiece } from './SetPiece'
import { ShotContext } from './shotContext'
import { ENVIRONMENT_BY_ID } from '../presets'
import type { BackgroundState } from '../types'

/** Advances the playhead while playing. Mounted first so every other frame callback sees the new time. */
function PlaybackDriver() {
  useFrame((_, delta) => {
    const s = useEditor.getState()
    if (!s.playing || s.recording || s.exporting) return
    const total = totalDuration(s.project.clips)
    let t = s.time + Math.min(delta, 0.1)
    if (t >= total) {
      if (s.loop) t = t % total
      else {
        s.setTimeFromPlayback(Math.max(0, total - 1e-3))
        s.setPlaying(false)
        return
      }
    }
    s.setTimeFromPlayback(t)
  })
  return null
}

function useLayout(clip: ShotClip) {
  const device = clip.scene.device
  const media = clip.scene.media
  const mediaAspect = media.width && media.height ? media.width / media.height : 16 / 9
  return useMemo(() => computeDeviceLayout(device, mediaAspect), [device, mediaAspect])
}

function ShotView({ clip, layout, frameLayout }: { clip: ShotClip; layout: DeviceLayout; frameLayout: DeviceLayout }) {
  const { group, environment, media } = clip.scene
  const slots = useMemo(() => groupSlots(layout, group), [layout, group])
  const env = ENVIRONMENT_BY_ID[environment.kind]
  // A set replaces the background with its backdrop colour so the fog has something to fade into.
  const bg = useMemo<BackgroundState>(
    () => (env && clip.scene.background.kind !== 'transparent' ? { ...clip.scene.background, kind: 'solid', colors: [env.backdrop] } : clip.scene.background),
    [env, clip.scene.background]
  )
  const slotMedia = [media, group.media2, group.media3]
  return (
    <ShotContext.Provider value={clip}>
      <Background bg={bg} />
      <Lights />
      <CameraRig layout={frameLayout} />
      <MotionGroup layout={layout}>
        {slots.map((slot, i) => (
          <group key={i} position={slot.position} rotation={slot.rotation}>
            <DeviceSlotContext.Provider value={{ index: slot.mediaIndex, media: slotMedia[slot.mediaIndex] ?? null }}>
              <Device device={clip.scene.device} layout={layout} lighting={clip.scene.lighting} />
            </DeviceSlotContext.Provider>
          </group>
        ))}
      </MotionGroup>
      {env && <SetPiece env={environment} layout={frameLayout} />}
      <Floor layout={frameLayout} />
    </ShotContext.Provider>
  )
}

function ShotLayer({ clip }: { clip: ShotClip }) {
  const layout = useLayout(clip)
  const group = clip.scene.group
  const frameLayout = useMemo(() => groupLayout(layout, groupSlots(layout, group)), [layout, group])
  return (
    <>
      <ShotView clip={clip} layout={layout} frameLayout={frameLayout} />
      <Effects clip={clip} layout={layout} />
    </>
  )
}

function SceneContent() {
  const clip = useActiveClip()
  return (
    <>
      <PlaybackDriver />
      {clip.kind === 'shot' ? (
        <ShotLayer clip={clip} />
      ) : (
        <>
          {clip.kind === 'text' ? <TextCard clip={clip} /> : <LogoCard clip={clip} />}
          <Effects clip={clip} layout={null} />
        </>
      )}
      <ExportBridge />
    </>
  )
}

/** The WebGL stage. Sized by its parent; the parent decides the aspect frame. */
export function MockupScene() {
  return (
    <Canvas
      flat
      dpr={[1, 2]}
      frameloop="always"
      gl={{
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.NoToneMapping,
      }}
      camera={{ fov: 32, near: 0.1, far: 100, position: [0, 0, 8] }}
      onCreated={(state) => {
        state.gl.setClearColor(0x000000, 0)
        if (import.meta.env.DEV) (window as unknown as { __beveledR3F?: unknown }).__beveledR3F = state
      }}
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <SceneContent />
    </Canvas>
  )
}

import { useFrame } from '@react-three/fiber'
import { useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import type { DeviceLayout } from './layout'
import { localTimeOf, sampleNow, useShotClip } from './shotContext'

const D2R = THREE.MathUtils.degToRad

/**
 * Wraps the device. Applies the (keyframable) device rotation plus the looping float / sway / spin
 * idle motions. Orbit is handled by the camera rig. All motion is driven by the timeline clock so
 * exports are frame-accurate.
 */
export function MotionGroup({ layout, children }: { layout: DeviceLayout; children: ReactNode }) {
  const clip = useShotClip()
  const ref = useRef<THREE.Group>(null)
  const pivotY = layout.centerY

  useFrame(() => {
    const g = ref.current
    if (!g) return
    const motion = clip.scene.motion
    const rx = D2R(sampleNow(clip, 'device.rotateX'))
    const ry = D2R(sampleNow(clip, 'device.rotateY'))
    const px = 0
    let py = 0
    let ex = 0
    let ey = 0
    let ez = 0
    if (motion.enabled && motion.kind !== 'orbit') {
      const t = localTimeOf(clip)
      const w = (Math.PI * 2 * motion.speed) / Math.max(0.5, motion.duration)
      const amp = motion.intensity
      if (motion.kind === 'float') {
        py = Math.sin(t * w) * 0.12 * amp * layout.fitRadius
        ex = Math.sin(t * w * 0.5) * 0.05 * amp
        ey = Math.sin(t * w * 0.7) * 0.08 * amp
        ez = Math.cos(t * w * 0.6) * 0.03 * amp
      } else if (motion.kind === 'sway') {
        ey = Math.sin(t * w) * 0.45 * amp
        ez = Math.sin(t * w + Math.PI / 2) * 0.06 * amp
      } else if (motion.kind === 'spin') {
        ey = (t * w) % (Math.PI * 2)
      }
    }
    g.position.set(px, py, 0)
    g.rotation.set(rx + ex, ry + ey, ez, 'YXZ')
  })

  return (
    <group position={[0, pivotY, 0]}>
      <group ref={ref}>
        <group position={[0, -pivotY, 0]}>{children}</group>
      </group>
    </group>
  )
}

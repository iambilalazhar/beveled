import { useFrame, useThree } from '@react-three/fiber'
import { useMemo } from 'react'
import * as THREE from 'three'
import type { DeviceLayout } from './layout'
import { localTimeOf, sampleNow, useShotClip } from './shotContext'

/**
 * Positions the default camera from the (keyframed) yaw / pitch / roll / fov / zoom / pan values
 * around the device's visual centre. Also applies the looping "orbit" idle motion.
 */
export function CameraRig({ layout }: { layout: DeviceLayout }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const clip = useShotClip()
  const tmp = useMemo(() => ({ target: new THREE.Vector3(), pos: new THREE.Vector3(), up: new THREE.Vector3(), right: new THREE.Vector3() }), [])

  useFrame(() => {
    const motion = clip.scene.motion
    const t = localTimeOf(clip)
    let yaw = sampleNow(clip, 'camera.yaw')
    let pitch = sampleNow(clip, 'camera.pitch')
    const roll = sampleNow(clip, 'camera.roll')
    const fov = sampleNow(clip, 'camera.fov')
    const zoom = Math.max(0.05, sampleNow(clip, 'camera.zoom'))
    const panX = sampleNow(clip, 'camera.panX')
    const panY = sampleNow(clip, 'camera.panY')
    if (motion.enabled && motion.kind === 'orbit') {
      yaw += (t * motion.speed * 360) / Math.max(1, motion.duration)
      pitch += Math.sin(t * motion.speed * 1.2) * 6 * motion.intensity
    }
    const vFov = THREE.MathUtils.degToRad(fov)
    // Distance so the device fits both vertically and horizontally at zoom 1.
    const tanV = Math.tan(vFov / 2)
    const distV = layout.fitH / tanV
    const distH = layout.fitW / (tanV * Math.max(0.05, camera.aspect))
    const dist = (Math.max(distV, distH) * 1.04) / zoom

    const yawR = THREE.MathUtils.degToRad(yaw)
    const pitchR = THREE.MathUtils.degToRad(THREE.MathUtils.clamp(pitch, -89.9, 89.9))
    tmp.target.set(0, layout.centerY, 0)
    tmp.pos.set(Math.sin(yawR) * Math.cos(pitchR) * dist, Math.sin(pitchR) * dist, Math.cos(yawR) * Math.cos(pitchR) * dist)
    // Pan moves both camera and target along the camera's right / up axes, scaled by the visible height.
    const visibleH = (Math.max(distV, distH) * tanV) / zoom
    tmp.right.set(Math.cos(yawR), 0, -Math.sin(yawR)).multiplyScalar(panX * visibleH)
    tmp.up.set(0, 1, 0).multiplyScalar(panY * visibleH)
    tmp.target.sub(tmp.right).sub(tmp.up)
    tmp.pos.add(tmp.target)

    camera.position.copy(tmp.pos)
    camera.up.set(0, 1, 0)
    camera.lookAt(tmp.target)
    camera.rotateZ(THREE.MathUtils.degToRad(roll))
    const near = Math.max(0.01, dist * 0.02)
    const far = dist * 6 + 50
    if (camera.fov !== fov || camera.near !== near || camera.far !== far) {
      camera.fov = fov
      camera.near = near
      camera.far = far
      camera.updateProjectionMatrix()
    }
  })

  return null
}

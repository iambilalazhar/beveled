import { Environment, Lightformer } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { LIGHT_PRESET_BY_ID } from '../presets'
import { sampleNow, useShotClip } from './shotContext'

const D2R = THREE.MathUtils.degToRad

/**
 * Procedural studio lighting: an environment map built from Lightformers
 * (no remote HDR downloads) plus a key light for crisp highlights and an ambient fill.
 * Rotation, elevation and intensities are keyframable and applied every frame.
 */
export function Lights() {
  const clip = useShotClip()
  const lighting = clip.scene.lighting
  const preset = LIGHT_PRESET_BY_ID[lighting.preset]
  const scene = useThree((s) => s.scene)
  const keyRef = useRef<THREE.DirectionalLight>(null)
  const ambRef = useRef<THREE.AmbientLight>(null)
  const tmp = useRef(new THREE.Vector3())

  useFrame(() => {
    const rot = D2R(sampleNow(clip, 'lighting.rotation'))
    const elev = D2R(sampleNow(clip, 'lighting.elevation'))
    const env = sampleNow(clip, 'lighting.envIntensity')
    const key = sampleNow(clip, 'lighting.intensity')
    scene.environmentRotation.set(elev, rot, 0)
    scene.environmentIntensity = env
    const [kx, ky, kz] = preset.key.position
    const v = tmp.current.set(kx, ky, kz).applyEuler(new THREE.Euler(-elev, rot, 0, 'YXZ'))
    if (keyRef.current) {
      keyRef.current.position.copy(v)
      keyRef.current.intensity = preset.key.intensity * key
    }
    if (ambRef.current) ambRef.current.intensity = preset.ambient * env
  })

  return (
    <>
      <ambientLight ref={ambRef} intensity={preset.ambient * lighting.envIntensity} />
      <directionalLight ref={keyRef} intensity={preset.key.intensity * lighting.intensity} color={lighting.keyColor} />
      <Environment resolution={256} frames={1} environmentIntensity={lighting.envIntensity}>
        <group>
          {/* Studio dome: gives metals something to reflect everywhere */}
          <mesh scale={40}>
            <sphereGeometry args={[1, 32, 16]} />
            <meshBasicMaterial color={preset.dome} side={THREE.BackSide} toneMapped={false} />
          </mesh>
          <Lightformer form="rect" color="#ffffff" intensity={preset.front} position={[0, 2, 9]} target={[0, 0, 0]} scale={[14, 8]} />
          {preset.formers.map((f, i) => (
            <Lightformer
              key={`${lighting.preset}-${i}`}
              form={f.form}
              color={f.color}
              intensity={f.intensity}
              position={f.position}
              rotation={f.rotation}
              scale={f.scale}
            />
          ))}
          {/* Faint floor bounce so undersides are never pitch black */}
          <Lightformer form="rect" color="#ffffff" intensity={0.25} position={[0, -6, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[12, 12]} />
        </group>
      </Environment>
    </>
  )
}

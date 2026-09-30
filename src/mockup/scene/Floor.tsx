import { ContactShadows, MeshReflectorMaterial } from '@react-three/drei'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useShotScene } from './shotContext'
import type { DeviceLayout } from './layout'

let fadeTexture: THREE.CanvasTexture | null = null
function getFadeTexture() {
  if (fadeTexture) return fadeTexture
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.45, 'rgba(255,255,255,0.7)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  fadeTexture = new THREE.CanvasTexture(canvas)
  return fadeTexture
}

/** Contact shadow under the device and an optional reflective floor. */
export function Floor({ layout }: { layout: DeviceLayout }) {
  const lighting = useShotScene('lighting')
  const y = layout.bottomY
  const span = layout.fitRadius * 5
  const fade = useMemo(() => getFadeTexture(), [])
  useEffect(() => {
    fade.needsUpdate = true
  }, [fade])
  return (
    <group>
      {lighting.shadow && (
        <ContactShadows
          position={[0, y - 0.002, 0]}
          scale={span}
          blur={lighting.shadowBlur}
          opacity={lighting.shadowOpacity}
          far={layout.fitRadius * 2}
          resolution={512}
          frames={Infinity}
          color="#000000"
        />
      )}
      {lighting.reflection && (
        <mesh position={[0, y - 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-10}>
          <planeGeometry args={[span, span]} />
          <MeshReflectorMaterial
            resolution={1024}
            blur={[Math.round(lighting.reflectionBlur * 600), Math.round(lighting.reflectionBlur * 200)]}
            mixBlur={1}
            mixStrength={1.6}
            mirror={1}
            depthScale={0.6}
            minDepthThreshold={0.5}
            maxDepthThreshold={1.4}
            roughness={1}
            metalness={0}
            color="#000000"
            transparent
            opacity={lighting.reflectionOpacity}
            alphaMap={fade}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      )}
    </group>
  )
}

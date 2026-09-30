import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { createRoundedSlabGeometry, useRoundedPlane, useRoundedSlab } from './geometry'
import { keyboardLayout, type DeviceMaterials } from './materials'
import { MM } from './models'

/* ------------------------------------------------------------------ */
/* Generic parts                                                       */
/* ------------------------------------------------------------------ */

/** Rounded slab mesh. */
export function Slab({ w, h, d, r, bevel, material, position, rotation }: { w: number; h: number; d: number; r: number; bevel?: number; material: THREE.Material; position?: [number, number, number]; rotation?: [number, number, number] }) {
  const g = useRoundedSlab(w, h, d, r, bevel)
  return <mesh geometry={g} material={material} position={position} rotation={rotation} />
}

/** Flat rounded plane mesh. */
export function Plate({ w, h, r, material, position, rotation }: { w: number; h: number; r: number; material: THREE.Material; position?: [number, number, number]; rotation?: [number, number, number] }) {
  const g = useRoundedPlane(w, h, r)
  return <mesh geometry={g} material={material} position={position} rotation={rotation} />
}

/**
 * Camera lens module: metal ring, coated black glass with iridescent reflections and a darker
 * inner aperture, facing +z. `r` is the outer radius.
 */
export function Lens({ r, mats, position, depth = 1.2 * MM }: { r: number; mats: DeviceMaterials; position: [number, number, number]; depth?: number }) {
  return (
    <group position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, depth / 2]} material={mats.darkMetal}>
        <cylinderGeometry args={[r, r * 1.02, depth, 48]} />
      </mesh>
      <mesh position={[0, 0, depth + 0.0002]} material={mats.lens}>
        <circleGeometry args={[r * 0.8, 48]} />
      </mesh>
      <mesh position={[0, 0, depth + 0.0004]}>
        <ringGeometry args={[r * 0.28, r * 0.4, 48]} />
        <meshPhysicalMaterial color="#141820" metalness={0.6} roughness={0.25} clearcoat={1} />
      </mesh>
      <mesh position={[0, 0, depth + 0.0005]}>
        <circleGeometry args={[r * 0.22, 32]} />
        <meshPhysicalMaterial color="#000000" roughness={0.02} clearcoat={1} />
      </mesh>
    </group>
  )
}

/** Small flash / sensor dot. */
export function Dot({ r, color, position }: { r: number; color: string; position: [number, number, number] }) {
  return (
    <mesh position={position}>
      <circleGeometry args={[r, 24]} />
      <meshPhysicalMaterial color={color} roughness={0.3} clearcoat={1} />
    </mesh>
  )
}

/** A row of small round holes (speaker / microphone). Faces +z by default. */
export function Holes({ count, r, spacing, material, position, rotation }: { count: number; r: number; spacing: number; material: THREE.Material; position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i} position={[(i - (count - 1) / 2) * spacing, 0, 0]} material={material}>
          <circleGeometry args={[r, 12]} />
        </mesh>
      ))}
    </group>
  )
}

/** Instanced keycaps laid out on the XZ plane (y up), centred on the origin. */
export function Keyboard({ width, material }: { width: number; material: THREE.Material }) {
  const layout = useMemo(() => keyboardLayout(), [])
  const unit = width / layout.width
  const gap = unit * 0.14
  const depth = layout.height * unit
  const ref = useRef<THREE.InstancedMesh>(null)
  const geometry = useMemo(() => createRoundedSlabGeometry(1, 1, 1, 0.16, 0.12), [])
  useEffect(() => () => geometry.dispose(), [geometry])
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0))
    layout.keys.forEach((k, i) => {
      m.compose(
        new THREE.Vector3((k.x - layout.width / 2) * unit, 0, (k.y - layout.height / 2) * unit),
        q,
        new THREE.Vector3(k.w * unit - gap, k.h * unit - gap, unit * 0.12)
      )
      mesh.setMatrixAt(i, m)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [layout, unit, gap])
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -unit * 0.05, 0]}>
        <planeGeometry args={[width + unit * 0.3, depth + unit * 0.3]} />
        <meshStandardMaterial color="#050506" roughness={0.9} />
      </mesh>
      <instancedMesh ref={ref} args={[geometry, material, layout.keys.length]} />
    </group>
  )
}


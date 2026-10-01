import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { ENVIRONMENT_BY_ID, type EnvironmentPreset } from '../presets'
import type { EnvironmentState } from '../types'
import type { DeviceLayout } from './layout'
import { surfaceMaps } from './surfaces'

/**
 * Floor, cove and back wall as one swept profile, so the floor curves seamlessly into the wall.
 * Rows before `wallStart` use material 0 (floor), the rest material 1 (wall).
 */
function buildSet(width: number, front: number, depth: number, radius: number, height: number, tile: [number, number]) {
  const profile: [number, number][] = [[front, 0]]
  const hasWall = height > 0
  if (hasWall) {
    profile.push([-depth + radius, 0])
    const steps = radius > 0 ? 16 : 0
    for (let i = 1; i <= steps; i++) {
      const th = (i / steps) * (Math.PI / 2)
      profile.push([-depth + radius - radius * Math.sin(th), radius - radius * Math.cos(th)])
    }
    if (!steps) profile.push([-depth, 0])
  } else profile.push([-depth, 0])
  const wallStart = profile.length - 1
  if (hasWall) profile.push([-depth, height])

  const cols = 2
  const positions: number[] = []
  const uvs: number[] = []
  let s = 0
  profile.forEach(([z, y], j) => {
    if (j > 0) s += Math.hypot(z - profile[j - 1][0], y - profile[j - 1][1])
    for (let i = 0; i <= cols; i++) {
      const x = (i / cols - 0.5) * width
      positions.push(x, y, z)
      const onWall = j > wallStart || (j === wallStart && hasWall)
      uvs.push(x / (onWall ? tile[1] : tile[0]), -s / (onWall ? tile[1] : tile[0]))
    }
  })
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  const floorIdx: number[] = []
  const wallIdx: number[] = []
  for (let j = 0; j < profile.length - 1; j++) {
    const target = j >= wallStart ? wallIdx : floorIdx
    for (let i = 0; i < cols; i++) {
      const a = j * (cols + 1) + i
      const b = a + 1
      const c = a + cols + 1
      const d = c + 1
      target.push(a, b, c, b, d, c)
    }
  }
  geo.setIndex([...floorIdx, ...wallIdx])
  geo.addGroup(0, floorIdx.length, 0)
  if (wallIdx.length) geo.addGroup(floorIdx.length, wallIdx.length, 1)
  geo.computeVertexNormals()
  return geo
}

function useSurfaceMaterial(def: { surface: EnvironmentPreset['floor']['surface']; color: string; roughness: number; metalness?: number }) {
  const material = useMemo(() => {
    const maps = surfaceMaps(def.surface)
    const clone = (t: THREE.Texture | null) => {
      if (!t) return null
      const c = t.clone()
      c.repeat.set(1, 1)
      c.needsUpdate = true
      return c
    }
    const m = new THREE.MeshStandardMaterial({
      color: def.color,
      roughness: def.roughness,
      metalness: def.metalness ?? 0,
      map: clone(maps.map),
      roughnessMap: clone(maps.roughnessMap),
      envMapIntensity: 0.6,
    })
    if (maps.emissiveMap) {
      m.emissiveMap = clone(maps.emissiveMap)
      m.emissive = new THREE.Color('#3a3f52')
      m.emissiveIntensity = 0.9
    }
    return m
  }, [def.surface, def.color, def.roughness, def.metalness])
  useEffect(
    () => () => {
      material.map?.dispose()
      material.roughnessMap?.dispose()
      material.emissiveMap?.dispose()
      material.dispose()
    },
    [material]
  )
  return material
}

/** A 3-D set around the device (desk, room, studio). Fog blends the far floor and wall into the backdrop. */
export function SetPiece({ env, layout }: { env: EnvironmentState; layout: DeviceLayout }) {
  const preset = ENVIRONMENT_BY_ID[env.kind]
  if (!preset) return null
  return <SetPieceInner preset={preset} env={env} layout={layout} />
}

function SetPieceInner({ preset, env, layout }: { preset: EnvironmentPreset; env: EnvironmentState; layout: DeviceLayout }) {
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const R = Math.max(0.6, layout.fitRadius)
  const width = R * 60
  const front = R * 30
  const depth = R * (1.1 + env.depth * 2.4)
  const height = env.wall > 0 ? R * 14 * env.wall : 0
  const cove = Math.min(preset.cove * R, depth * 0.8, height > 0 ? height * 0.8 : 0)
  const tile = Math.max(0.6, R * 1.1) * preset.floor.scale
  const geometry = useMemo(() => buildSet(width, front, depth, cove, height, [tile, tile * 1.4]), [width, front, depth, cove, height, tile])
  useEffect(() => () => geometry.dispose(), [geometry])
  const floor = useSurfaceMaterial(preset.floor)
  const wall = useSurfaceMaterial(preset.wall)

  const fog = useMemo(() => new THREE.Fog(preset.backdrop, 10, 100), [preset.backdrop])
  useEffect(() => {
    scene.fog = fog
    return () => {
      if (scene.fog === fog) scene.fog = null
    }
  }, [scene, fog])
  useFrame(() => {
    // Keep the device itself out of the fog: start fading just behind it, relative to the camera.
    const dist = camera.position.length()
    fog.near = dist + R * (1.5 + (1 - env.fog) * 4)
    fog.far = fog.near + R * (3 + (1 - env.fog) * 26)
  })

  return <mesh geometry={geometry} material={[floor, wall]} position={[0, layout.bottomY - 0.004, 0]} receiveShadow renderOrder={-5} />
}

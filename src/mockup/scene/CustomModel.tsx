import { useGLTF } from '@react-three/drei'
import { Component, Suspense, useEffect, useMemo, type ReactNode } from 'react'
import * as THREE from 'three'
import type { DeviceState } from '../types'
import { getPlaceholderTexture, useMediaTexture } from './media'
import { useShotScene } from './shotContext'

const SCREEN_NAME = /screen|display|lcd|monitor|panel/i
const TARGET = 1.6

/** True when the mesh's V coordinate decreases towards local +Y (glTF convention). */
function vRunsDown(mesh: THREE.Mesh): boolean {
  const pos = mesh.geometry.attributes.position
  const uv = mesh.geometry.attributes.uv
  if (!pos || !uv) return true
  let my = 0
  let mv = 0
  for (let i = 0; i < pos.count; i++) {
    my += pos.getY(i)
    mv += uv.getY(i)
  }
  my /= pos.count
  mv /= pos.count
  let cov = 0
  for (let i = 0; i < pos.count; i++) cov += (pos.getY(i) - my) * (uv.getY(i) - mv)
  return cov < 0
}

/** Chooses the mesh the screenshot goes on: first by name, otherwise none. */
function findScreen(root: THREE.Object3D): THREE.Mesh | null {
  let hit: THREE.Mesh | null = null
  root.traverse((o) => {
    const m = o as THREE.Mesh
    if (!hit && m.isMesh && (SCREEN_NAME.test(m.name) || SCREEN_NAME.test(String((m.material as THREE.Material)?.name ?? '')))) hit = m
  })
  return hit
}

function Model({ url, device }: { url: string; device: DeviceState }) {
  const gltf = useGLTF(url)
  const media = useShotScene('media')
  const { texture, aspect } = useMediaTexture(media, 16 / 10)

  // Clone so the cached glTF scene can be reused, normalise size and centre it on the origin.
  const { root, screen, screenAspect } = useMemo(() => {
    const root = gltf.scene.clone(true)
    const box = new THREE.Box3().setFromObject(root)
    const size = box.getSize(new THREE.Vector3())
    const k = TARGET / Math.max(size.x, size.y, size.z, 1e-6)
    root.scale.setScalar(k)
    const center = box.getCenter(new THREE.Vector3()).multiplyScalar(k)
    root.position.sub(center)
    const screen = findScreen(root)
    let screenAspect = 16 / 10
    if (screen) {
      const sb = new THREE.Box3().setFromObject(screen).getSize(new THREE.Vector3())
      const dims = [sb.x, sb.y, sb.z].sort((a, b) => b - a)
      screenAspect = dims[0] / Math.max(dims[1], 1e-6)
      if (sb.y > sb.x) screenAspect = 1 / screenAspect
    }
    return { root, screen, screenAspect }
  }, [gltf])

  const screenMaterial = useMemo(() => {
    if (!screen) return null
    const t = (texture ?? getPlaceholderTexture(screenAspect)).clone()
    t.needsUpdate = true
    // Cover-fit the media into the screen's UV rectangle. Files authored for glTF have V running
    // top-down; flip through the texture transform when that is the case.
    let rx = 1
    let ry = 1
    if (device.fit === 'cover') {
      if (aspect > screenAspect) rx = screenAspect / aspect
      else ry = aspect / screenAspect
    }
    if (vRunsDown(screen)) {
      t.repeat.set(rx, -ry)
      t.offset.set((1 - rx) / 2, (1 - ry) / 2 + ry)
    } else {
      t.repeat.set(rx, ry)
      t.offset.set((1 - rx) / 2, (1 - ry) / 2)
    }
    return new THREE.MeshBasicMaterial({ map: t, toneMapped: false })
  }, [screen, texture, aspect, screenAspect, device.fit])

  useEffect(() => {
    if (!screen || !screenMaterial) return
    const prev = screen.material
    screen.material = screenMaterial
    return () => {
      screen.material = prev
      screenMaterial.map?.dispose()
      screenMaterial.dispose()
    }
  }, [screen, screenMaterial])

  return <primitive object={root} />
}

class ModelErrorBoundary extends Component<{ children: ReactNode; resetKey: string }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidUpdate(prev: { resetKey: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.failed) this.setState({ failed: false })
  }
  render() {
    return this.state.failed ? <FallbackBox /> : this.props.children
  }
}

function FallbackBox() {
  return (
    <mesh>
      <boxGeometry args={[1.2, 0.8, 0.05]} />
      <meshStandardMaterial color="#333" wireframe />
    </mesh>
  )
}

/** A user-supplied glTF / GLB model. Meshes named "screen" / "display" receive the media. */
export function CustomModel({ device }: { device: DeviceState }) {
  if (!device.customModel) return <FallbackBox />
  return (
    <ModelErrorBoundary resetKey={device.customModel}>
      <Suspense fallback={<FallbackBox />}>
        <Model url={device.customModel} device={device} />
      </Suspense>
    </ModelErrorBoundary>
  )
}

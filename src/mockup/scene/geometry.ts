import { useMemo } from 'react'
import * as THREE from 'three'

/** Rounded rectangle path centred on the origin. */
export function roundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2))
  const x = -w / 2
  const y = -h / 2
  const shape = new THREE.Shape()
  shape.moveTo(x + radius, y)
  shape.lineTo(x + w - radius, y)
  shape.absarc(x + w - radius, y + radius, radius, -Math.PI / 2, 0, false)
  shape.lineTo(x + w, y + h - radius)
  shape.absarc(x + w - radius, y + h - radius, radius, 0, Math.PI / 2, false)
  shape.lineTo(x + radius, y + h)
  shape.absarc(x + radius, y + h - radius, radius, Math.PI / 2, Math.PI, false)
  shape.lineTo(x, y + radius)
  shape.absarc(x + radius, y + radius, radius, Math.PI, Math.PI * 1.5, false)
  shape.closePath()
  return shape
}

/** Flat rounded plane with UVs normalised to 0..1 across the rectangle. */
export function createRoundedPlaneGeometry(w: number, h: number, r: number, segments = 24): THREE.ShapeGeometry {
  const geometry = new THREE.ShapeGeometry(roundedRectShape(w, h, r), segments)
  const pos = geometry.attributes.position
  const uv = geometry.attributes.uv
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (pos.getX(i) + w / 2) / w, (pos.getY(i) + h / 2) / h)
  }
  uv.needsUpdate = true
  geometry.computeVertexNormals()
  return geometry
}

/** Rounded slab (extruded rounded rectangle with a small edge bevel), centred on the origin. */
export function createRoundedSlabGeometry(
  w: number,
  h: number,
  d: number,
  r: number,
  bevel = Math.min(0.012, d / 4)
): THREE.ExtrudeGeometry {
  const b = Math.max(0.0005, Math.min(bevel, d / 2 - 0.0005))
  const shape = roundedRectShape(w - 2 * b, h - 2 * b, Math.max(0.001, r - b))
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.001, d - 2 * b),
    bevelEnabled: true,
    bevelThickness: b,
    bevelSize: b,
    bevelSegments: 4,
    bevelOffset: 0,
    curveSegments: 24,
    steps: 1,
  })
  geometry.translate(0, 0, -(d - 2 * b) / 2)
  geometry.computeVertexNormals()
  return geometry
}

export function useRoundedPlane(w: number, h: number, r: number) {
  const geometry = useMemo(() => createRoundedPlaneGeometry(w, h, r), [w, h, r])
  useDispose(geometry)
  return geometry
}

export function useRoundedSlab(w: number, h: number, d: number, r: number, bevel?: number) {
  const geometry = useMemo(() => createRoundedSlabGeometry(w, h, d, r, bevel), [w, h, d, r, bevel])
  useDispose(geometry)
  return geometry
}

function useDispose(geometry: THREE.BufferGeometry) {
  // Dispose the previous geometry when a new one is created.
  useMemo(() => geometry, [geometry])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return geometry
}

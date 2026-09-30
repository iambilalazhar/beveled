import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import type { DeviceState, LightingState } from '../types'
import { CustomModel } from './CustomModel'
import { DeviceScreen } from './DeviceScreen'
import { createRoundedPlaneGeometry } from './geometry'
import type { DeviceLayout } from './layout'
import { grilleTexture, keyboardDepth, latticeTexture, ridgeTexture, useDeviceMaterials, type DeviceMaterials } from './materials'
import { MM, type CameraLayout, type LaptopSpec, type MonitorSpec, type PhoneSpec, type TabletSpec, type WatchSpec } from './models'
import { Dot, Holes, Keyboard, Lens, Plate, Slab } from './parts'
import { sampleNow, useShotClip } from './shotContext'

export type DeviceProps = {
  device: DeviceState
  layout: DeviceLayout
  lighting: LightingState
}

const EPS = 0.0004

function useDisposable<T extends { dispose: () => void }>(factory: () => T, deps: unknown[]): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(factory, deps)
  useEffect(() => () => value.dispose(), [value])
  return value
}

function repeatTexture(base: THREE.Texture, rx: number, ry: number) {
  const t = base.clone()
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(rx, ry)
  t.needsUpdate = true
  return t
}

/* ------------------------------------------------------------------ */
/* Camera modules (back of phones / tablets)                           */
/* ------------------------------------------------------------------ */

function CameraModule({ camera, w, h, d, corner, mats }: { camera: CameraLayout; w: number; h: number; d: number; corner: number; mats: DeviceMaterials }) {
  let content: ReactNode = null
  if (camera.kind === 'plateau-bar') {
    const ph = h * camera.height
    const pw = w - 2 * MM
    const ly = h / 2 - ph / 2 - 1.2 * MM
    const lr = Math.min(ph * 0.2, 7.2 * MM)
    const lx0 = -pw / 2 + ph * 0.36
    const lenses: [number, number][] =
      camera.lenses === 3
        ? [
            [lx0, ly + ph * 0.21],
            [lx0, ly - ph * 0.21],
            [lx0 + ph * 0.38, ly],
          ]
        : camera.lenses === 2
          ? [
              [lx0, ly],
              [lx0 + ph * 0.42, ly],
            ]
          : [[lx0, ly]]
    content = (
      <>
        <Slab w={pw} h={ph} d={2.4 * MM} r={Math.min(corner * 0.9, ph / 2)} bevel={0.9 * MM} material={mats.frame} position={[0, ly, 0.6 * MM]} />
        <Plate w={pw - 1 * MM} h={ph - 1 * MM} r={Math.min(corner * 0.85, ph / 2 - 0.5 * MM)} material={mats.back} position={[0, ly, 1.82 * MM]} />
        {lenses.map(([x, y], i) => (
          <Lens key={i} r={lr} mats={mats} position={[x, y, 1.8 * MM]} depth={1.4 * MM} />
        ))}
        {camera.flash && <Dot r={2.6 * MM} color="#f4efe2" position={[pw / 2 - ph * 0.3, ly + ph * 0.2, 1.83 * MM]} />}
        <Dot r={2.2 * MM} color="#08090b" position={[pw / 2 - ph * 0.3, ly - ph * 0.2, 1.83 * MM]} />
        <Dot r={0.9 * MM} color="#141416" position={[pw / 2 - ph * 0.62, ly, 1.83 * MM]} />
      </>
    )
  } else if (camera.kind === 'square' || camera.kind === 'single') {
    const size = w * camera.size
    const cx = -w / 2 + size / 2 + 3 * MM
    const cy = h / 2 - size / 2 - 3 * MM
    const lr = size * (camera.kind === 'single' ? 0.26 : 0.2)
    content = (
      <>
        <Slab w={size} h={size} d={1.6 * MM} r={size * 0.28} bevel={0.6 * MM} material={mats.back} position={[cx, cy, 0.3 * MM]} />
        {camera.kind === 'square' ? (
          <>
            <Lens r={lr} mats={mats} position={[cx - size * 0.2, cy + size * 0.2, 1.1 * MM]} />
            <Lens r={lr} mats={mats} position={[cx + size * 0.2, cy - size * 0.2, 1.1 * MM]} />
            <Dot r={size * 0.07} color="#f4efe2" position={[cx + size * 0.22, cy + size * 0.22, 1.12 * MM]} />
          </>
        ) : (
          <>
            <Lens r={lr} mats={mats} position={[cx - size * 0.16, cy + size * 0.16, 1.1 * MM]} />
            <Dot r={size * 0.1} color="#0a0b0d" position={[cx + size * 0.2, cy + size * 0.2, 1.12 * MM]} />
            <Dot r={size * 0.08} color="#f4efe2" position={[cx + size * 0.2, cy - size * 0.2, 1.12 * MM]} />
          </>
        )}
      </>
    )
  } else if (camera.kind === 'visor') {
    const vh = h * camera.height
    const vy = h / 2 - vh / 2 - h * 0.08
    const lr = vh * 0.26
    content = (
      <>
        <Slab w={w} h={vh} d={3 * MM} r={vh / 2} bevel={1.2 * MM} material={mats.frame} position={[0, vy, 0.9 * MM]} />
        <Plate w={w * 0.56} h={vh * 0.72} r={vh * 0.36} material={mats.glass} position={[-w * 0.08, vy, 2.42 * MM]} />
        {Array.from({ length: camera.lenses }, (_, i) => (
          <Lens key={i} r={lr} mats={mats} position={[-w * 0.3 + i * vh * 0.75, vy, 2.4 * MM]} depth={0.6 * MM} />
        ))}
        <Dot r={2 * MM} color="#f4efe2" position={[w * 0.27, vy, 2.43 * MM]} />
      </>
    )
  } else if (camera.kind === 'column') {
    const lr = w * 0.085
    const x = -w / 2 + w * 0.17
    content = (
      <>
        {Array.from({ length: camera.lenses }, (_, i) => (
          <Lens key={i} r={lr} mats={mats} position={[x, h / 2 - h * 0.1 - i * lr * 2.5, 0.3 * MM]} depth={1.6 * MM} />
        ))}
        <Lens r={lr * 0.6} mats={mats} position={[x + lr * 2.2, h / 2 - h * 0.1, 0.3 * MM]} depth={1.2 * MM} />
        <Dot r={1.8 * MM} color="#f4efe2" position={[x + lr * 2.2, h / 2 - h * 0.1 - lr * 1.8, 0.35 * MM]} />
      </>
    )
  }
  // Built facing +z (as seen from behind the device), then turned onto the back.
  return (
    <group position={[0, 0, -d / 2]} rotation={[0, Math.PI, 0]}>
      {content}
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Phones                                                              */
/* ------------------------------------------------------------------ */

function PhoneModel({ device, layout, lighting, spec }: DeviceProps & { spec: PhoneSpec }) {
  const mats = useDeviceMaterials(device.finish, lighting.envIntensity)
  const { bodyW: w, bodyH: h, bodyD: d, bodyRadius: r, screenW, screenH, screenRadius } = layout
  const bevel = spec.frame === 'rounded' ? d * 0.42 : 0.55 * MM
  const z = d / 2
  const islandW = screenW * 0.31
  const islandH = screenW * 0.092
  const island = useDisposable(() => createRoundedPlaneGeometry(islandW, islandH, islandH / 2), [islandW, islandH])
  return (
    <group>
      {/* Frame + back */}
      <Slab w={w} h={h} d={d} r={r} bevel={bevel} material={mats.frame} />
      <Plate w={w - 2.2 * MM} h={h - 2.2 * MM} r={r - 1.1 * MM} material={mats.back} position={[0, 0, -z - EPS]} rotation={[0, Math.PI, 0]} />
      {/* Antenna bands */}
      {[-1, 1].map((sgn) => (
        <mesh key={sgn} position={[0, sgn * (h / 2 - r * 0.9), 0]} material={mats.port}>
          <boxGeometry args={[w + 0.2 * MM, 0.9 * MM, d * 0.6]} />
        </mesh>
      ))}
      {/* Front glass, screen, cut-out */}
      <Plate w={w - 0.9 * MM} h={h - 0.9 * MM} r={r - 0.45 * MM} material={mats.glass} position={[0, 0, z + EPS]} />
      <DeviceScreen width={screenW} height={screenH} radius={screenRadius} rotated={layout.rotated} fit={device.fit} glare={lighting.screenGlare} position={[0, 0, z + 2 * EPS]} statusBar={device.statusBar} />
      {device.notch && spec.cutout === 'island' && (
        <mesh geometry={island} position={[0, screenH / 2 - islandH / 2 - screenW * 0.03, z + 5 * EPS]}>
          <meshPhysicalMaterial color="#000" roughness={0.1} clearcoat={1} />
        </mesh>
      )}
      {device.notch && spec.cutout === 'punch-hole' && (
        <group position={[0, screenH / 2 - 4.4 * MM, z + 5 * EPS]}>
          <mesh>
            <circleGeometry args={[1.7 * MM, 32]} />
            <meshPhysicalMaterial color="#000" roughness={0.1} clearcoat={1} />
          </mesh>
          <mesh position={[0, 0, EPS]}>
            <ringGeometry args={[0.5 * MM, 0.8 * MM, 24]} />
            <meshPhysicalMaterial color="#1b2230" metalness={0.5} roughness={0.2} />
          </mesh>
        </group>
      )}
      {/* Earpiece slit */}
      <Plate w={9 * MM} h={0.6 * MM} r={0.3 * MM} material={mats.port} position={[0, h / 2 - 1.05 * MM, z + 3 * EPS]} />
      {/* Buttons */}
      {spec.buttons.map((b, i) => {
        const len = b.len * h
        const y = h / 2 - b.from * h - len / 2
        const x = (b.side === 'left' ? -1 : 1) * (w / 2 + (b.kind === 'control' ? 0.1 : 0.45) * MM)
        return (
          <Slab
            key={i}
            w={b.kind === 'control' ? 0.4 * MM : 1.2 * MM}
            h={len}
            d={d * 0.42}
            r={0.2 * MM}
            bevel={0.15 * MM}
            material={b.kind === 'control' ? mats.glass : mats.frame}
            position={[x, y, 0]}
          />
        )
      })}
      {/* Bottom: port and speaker holes */}
      <group position={[0, -h / 2 - EPS, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <Plate w={8.6 * MM} h={2.8 * MM} r={1.4 * MM} material={mats.port} />
        <Holes count={6} r={0.5 * MM} spacing={1.6 * MM} material={mats.port} position={[-13 * MM, 0, 0]} />
        <Holes count={6} r={0.5 * MM} spacing={1.6 * MM} material={mats.port} position={[13 * MM, 0, 0]} />
      </group>
      <CameraModule camera={spec.camera} w={w} h={h} d={d} corner={r} mats={mats} />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Tablets                                                             */
/* ------------------------------------------------------------------ */

function TabletModel({ device, layout, lighting, spec }: DeviceProps & { spec: TabletSpec }) {
  const mats = useDeviceMaterials(device.finish, lighting.envIntensity)
  const { bodyW: w, bodyH: h, bodyD: d, bodyRadius: r, screenW, screenH, screenRadius } = layout
  const z = d / 2
  return (
    <group>
      <Slab w={w} h={h} d={d} r={r} bevel={0.9 * MM} material={mats.frame} />
      <Plate w={w - 0.8 * MM} h={h - 0.8 * MM} r={r - 0.4 * MM} material={mats.glass} position={[0, 0, z + EPS]} />
      <DeviceScreen width={screenW} height={screenH} radius={screenRadius} rotated={layout.rotated} fit={device.fit} glare={lighting.screenGlare} position={[0, 0, z + 2 * EPS]} />
      {device.notch && (
        // Landscape front camera on the long edge (iPad Pro layout).
        <mesh position={[w / 2 - spec.bezel * 0.5 * MM, 0, z + 3 * EPS]}>
          <circleGeometry args={[1.3 * MM, 24]} />
          <meshPhysicalMaterial color="#0d1118" metalness={0.5} roughness={0.2} clearcoat={1} />
        </mesh>
      )}
      {/* Top button, volume buttons */}
      <Slab w={16 * MM} h={1.1 * MM} d={d * 0.45} r={0.4 * MM} bevel={0.2 * MM} material={mats.frame} position={[w / 2 - 28 * MM, h / 2 + 0.35 * MM, 0]} />
      <Slab w={1.1 * MM} h={10 * MM} d={d * 0.45} r={0.4 * MM} bevel={0.2 * MM} material={mats.frame} position={[w / 2 + 0.35 * MM, h / 2 - 30 * MM, 0]} />
      <Slab w={1.1 * MM} h={10 * MM} d={d * 0.45} r={0.4 * MM} bevel={0.2 * MM} material={mats.frame} position={[w / 2 + 0.35 * MM, h / 2 - 43 * MM, 0]} />
      {/* Speaker slots on the short edges */}
      {[-1, 1].map((sgn) => (
        <group key={sgn} position={[0, sgn * (h / 2 + EPS), 0]} rotation={[sgn * -Math.PI / 2, 0, 0]}>
          <Holes count={5} r={0.45 * MM} spacing={1.3 * MM} material={mats.port} position={[-w * 0.3, 0, 0]} />
          <Holes count={5} r={0.45 * MM} spacing={1.3 * MM} material={mats.port} position={[w * 0.3, 0, 0]} />
        </group>
      ))}
      <Plate w={9 * MM} h={2.6 * MM} r={1.3 * MM} material={mats.port} position={[0, -h / 2 - EPS, 0]} rotation={[Math.PI / 2, 0, 0]} />
      <CameraModule camera={spec.camera} w={w} h={h} d={d} corner={r} mats={mats} />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Laptops                                                             */
/* ------------------------------------------------------------------ */

function LaptopModel({ device, layout, lighting, spec }: DeviceProps & { spec: LaptopSpec }) {
  const mats = useDeviceMaterials(device.finish, lighting.envIntensity)
  const clip = useShotClip()
  const lidRef = useRef<THREE.Group>(null)
  useFrame(() => {
    if (lidRef.current) lidRef.current.rotation.x = -THREE.MathUtils.degToRad(sampleNow(clip, 'device.lidAngle') - 90)
  })
  const { bodyW: w, bodyH, bodyD, bodyRadius: r, screenW, screenH, screenRadius, screenOffsetY, baseDepth: D, baseThick: T } = layout
  const kbW = w * (spec.speakers ? 0.78 : 0.86)
  const kbD = keyboardDepth(kbW)
  const kbZ = -D / 2 + 14 * MM + kbD / 2
  const tpW = w * 0.45
  const tpD = D * 0.32
  const tpZ = D / 2 - 10 * MM - tpD / 2
  const grille = useDisposable(() => repeatTexture(grilleTexture(), 3, 18), [])
  const speakerMat = useDisposable(() => new THREE.MeshStandardMaterial({ color: '#050506', transparent: true, alphaMap: grille, roughness: 0.8, depthWrite: false }), [grille])
  const notchW = screenW * 0.064
  const notchH = 8 * MM
  const lidTilt = -THREE.MathUtils.degToRad(device.lidAngle - 90)
  const speakerW = (w - kbW) / 2 - 12 * MM

  return (
    <group>
      {/* Base */}
      <group position={[0, T / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <Slab w={w} h={D} d={T} r={r} bevel={Math.min(T * 0.3, 2 * MM)} material={mats.frame} />
      </group>
      {/* Keyboard well and keys */}
      <group position={[0, T + EPS, kbZ]}>
        <Keyboard width={kbW} material={mats.keycap} />
      </group>
      {/* Speaker grilles */}
      {spec.speakers &&
        [-1, 1].map((sgn) => (
          <mesh key={sgn} position={[sgn * (kbW / 2 + 6 * MM + speakerW / 2), T + EPS, kbZ]} rotation={[-Math.PI / 2, 0, 0]} material={speakerMat}>
            <planeGeometry args={[speakerW, kbD]} />
          </mesh>
        ))}
      {/* Trackpad */}
      <Plate w={tpW} h={tpD} r={3 * MM} material={mats.trackpad} position={[0, T + EPS * 2, tpZ]} rotation={[-Math.PI / 2, 0, 0]} />
      {/* Thumb notch on the front lip */}
      <Plate w={w * 0.2} h={T * 0.5} r={T * 0.25} material={mats.back} position={[0, T * 0.62, D / 2 + EPS]} />
      {/* Ports */}
      {(
        [
          [-1, -D * 0.25, 13],
          [-1, D * 0.05, 8.5],
          [-1, D * 0.15, 8.5],
          [1, D * 0.0, 14],
          [1, D * 0.15, 8.5],
          [1, -D * 0.22, 24],
        ] as const
      ).map(([side, zPos, len], i) => (
        <Plate key={i} w={len * MM} h={T * 0.28} r={T * 0.14} material={mats.port} position={[side * (w / 2 + EPS), T * 0.5, zPos]} rotation={[0, side * (Math.PI / 2), 0]} />
      ))}
      {/* Feet */}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * (w / 2 - 22 * MM), -0.5 * MM, sz * (D / 2 - 22 * MM)]} material={mats.rubber}>
            <cylinderGeometry args={[6 * MM, 6 * MM, 1 * MM, 24]} />
          </mesh>
        ))
      )}
      {/* Hinge */}
      <mesh position={[0, T, -D / 2 + 2 * MM]} rotation={[0, 0, Math.PI / 2]} material={mats.darkMetal}>
        <cylinderGeometry args={[T * 0.42, T * 0.42, w * 0.82, 32]} />
      </mesh>
      {/* Lid */}
      <group ref={lidRef} position={[0, T, -D / 2]} rotation={[lidTilt, 0, 0]}>
        <group position={[0, bodyH / 2, -bodyD / 2]}>
          <Slab w={w} h={bodyH} d={bodyD} r={r} bevel={Math.min(bodyD * 0.35, 1.2 * MM)} material={mats.frame} />
          <Plate w={w - 1.2 * MM} h={bodyH - 1.2 * MM} r={r - 0.6 * MM} material={mats.glass} position={[0, 0, bodyD / 2 + EPS]} />
          <DeviceScreen width={screenW} height={screenH} radius={screenRadius} rotated={false} fit={device.fit} glare={lighting.screenGlare} position={[0, screenOffsetY, bodyD / 2 + 2 * EPS]} />
          {device.notch && spec.notch && (
            <group position={[0, screenOffsetY + screenH / 2 - notchH / 2 + 0.3 * MM, bodyD / 2 + 4 * EPS]}>
              <Plate w={notchW} h={notchH} r={2 * MM} material={mats.glass} />
              <mesh position={[0, 0.8 * MM, EPS]}>
                <circleGeometry args={[1.1 * MM, 20]} />
                <meshPhysicalMaterial color="#0f1520" metalness={0.5} roughness={0.2} clearcoat={1} />
              </mesh>
            </group>
          )}
        </group>
      </group>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Displays                                                            */
/* ------------------------------------------------------------------ */

function MonitorModel({ device, layout, lighting, spec }: DeviceProps & { spec: MonitorSpec }) {
  const mats = useDeviceMaterials(device.finish, lighting.envIntensity)
  const { bodyW: w, bodyH: h, bodyD: d, bodyRadius: r, screenW, screenH, screenRadius, standH } = layout
  const lattice = useDisposable(() => repeatTexture(latticeTexture(), w / 0.9, h / 0.9), [w, h])
  const latticeMat = useDisposable(() => new THREE.MeshStandardMaterial({ map: lattice, metalness: 0.45, roughness: 0.35 }), [lattice])
  const grille = useDisposable(() => repeatTexture(grilleTexture(), 60, 2), [])
  const grilleMat = useDisposable(() => new THREE.MeshStandardMaterial({ color: '#080809', transparent: true, alphaMap: grille, depthWrite: false }), [grille])
  const armW = spec.stand === 'studio' ? w * 0.27 : w * 0.18
  const armLen = standH + h * 0.45
  const tilt = 0.18
  return (
    <group>
      <Slab w={w} h={h} d={d} r={r} bevel={Math.min(d * 0.3, 3 * MM)} material={mats.frame} />
      <Plate w={w - 1.5 * MM} h={h - 1.5 * MM} r={r - 0.8 * MM} material={mats.glass} position={[0, 0, d / 2 + EPS]} />
      <DeviceScreen width={screenW} height={screenH} radius={screenRadius} rotated={false} fit={device.fit} glare={lighting.screenGlare} position={[0, 0, d / 2 + 2 * EPS]} />
      {/* Camera */}
      <mesh position={[0, h / 2 - spec.bezel * 0.5 * MM, d / 2 + 3 * EPS]}>
        <circleGeometry args={[1.6 * MM, 24]} />
        <meshPhysicalMaterial color="#0f1520" metalness={0.5} roughness={0.2} clearcoat={1} />
      </mesh>
      {/* Back */}
      {spec.back === 'lattice' ? (
        <Plate w={w - 30 * MM} h={h - 30 * MM} r={r} material={latticeMat} position={[0, 0, -d / 2 - EPS]} rotation={[0, Math.PI, 0]} />
      ) : (
        <mesh position={[0, h / 2 - 12 * MM, -d / 2 - EPS]} rotation={[0, Math.PI, 0]} material={grilleMat}>
          <planeGeometry args={[w * 0.8, 8 * MM]} />
        </mesh>
      )}
      {/* Stand */}
      <group position={[0, -h * 0.05, -d / 2 - 4 * MM]}>
        {spec.stand === 'pro' && (
          <mesh position={[0, 0, -8 * MM]} rotation={[0, 0, Math.PI / 2]} material={mats.frame}>
            <cylinderGeometry args={[14 * MM, 14 * MM, armW * 1.05, 32]} />
          </mesh>
        )}
        <group rotation={[tilt, 0, 0]}>
          <Slab w={armW} h={armLen} d={spec.stand === 'pro' ? 22 * MM : 9 * MM} r={6 * MM} bevel={2 * MM} material={mats.frame} position={[0, -armLen / 2, -armLen * 0.02]} />
        </group>
        <group position={[0, -armLen * Math.cos(tilt) - 4 * MM, -armLen * Math.sin(tilt) + 60 * MM]} rotation={[-Math.PI / 2, 0, 0]}>
          <Slab w={armW * 1.02} h={spec.stand === 'pro' ? 230 * MM : 190 * MM} d={8 * MM} r={12 * MM} bevel={2.5 * MM} material={mats.frame} />
        </group>
      </group>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Watches                                                             */
/* ------------------------------------------------------------------ */

function WatchModel({ device, layout, lighting, spec }: DeviceProps & { spec: WatchSpec }) {
  const mats = useDeviceMaterials(device.finish, lighting.envIntensity)
  const { bodyW: w, bodyH: h, bodyD: d, bodyRadius: r, screenW, screenH, screenRadius, standH: band } = layout
  const z = d / 2
  const ultra = spec.style === 'ultra'
  const ridges = useDisposable(() => repeatTexture(ridgeTexture(), 1, 1), [])
  const crownMat = useDisposable(() => new THREE.MeshPhysicalMaterial({ color: ultra ? '#8a857d' : '#2a2a2d', metalness: 0.9, roughness: 0.35, map: ridges }), [ultra, ridges])
  const bandMat = useDisposable(() => new THREE.MeshStandardMaterial({ color: ultra ? '#2c3b4f' : '#1d1d20', roughness: 0.85, metalness: 0 }), [ultra])
  const bandW = w * 0.78
  return (
    <group>
      {/* Bands curve away behind the case */}
      {[1, -1].map((sgn) => (
        <group key={sgn} position={[0, sgn * (h / 2 - 2 * MM), -d * 0.15]} rotation={[sgn * -0.22, 0, 0]}>
          <Slab w={bandW} h={band} d={3.4 * MM} r={4 * MM} bevel={1.2 * MM} material={bandMat} position={[0, (sgn * band) / 2, 0]} />
          {ultra && <Holes count={4} r={1.4 * MM} spacing={9 * MM} material={mats.port} position={[0, sgn * band * 0.6, 1.72 * MM]} rotation={[0, 0, Math.PI / 2]} />}
        </group>
      ))}
      {/* Case */}
      <Slab w={w} h={h} d={d} r={r} bevel={ultra ? 1.2 * MM : d * 0.4} material={mats.frame} />
      <Plate w={w - (ultra ? 2 : 0.6) * MM} h={h - (ultra ? 2 : 0.6) * MM} r={r - 1 * MM} material={mats.glass} position={[0, 0, z + (ultra ? 0.6 * MM : EPS)]} />
      {ultra && <Slab w={w - 2 * MM} h={h - 2 * MM} d={0.8 * MM} r={r - 1 * MM} bevel={0.3 * MM} material={mats.glass} position={[0, 0, z + 0.2 * MM]} />}
      <DeviceScreen width={screenW} height={screenH} radius={screenRadius} rotated={false} fit={device.fit} glare={lighting.screenGlare} position={[0, 0, z + (ultra ? 0.62 * MM : 2 * EPS) + EPS]} />
      {/* Crown + guard, side button, action button */}
      {ultra && <Slab w={3 * MM} h={16 * MM} d={d * 0.7} r={1.5 * MM} bevel={0.6 * MM} material={mats.frame} position={[w / 2 + 1 * MM, h * 0.08, 0]} />}
      <mesh position={[w / 2 + (ultra ? 3 : 1.6) * MM, h * 0.12, 0]} rotation={[0, 0, Math.PI / 2]} material={crownMat}>
        <cylinderGeometry args={[3.2 * MM, 3.2 * MM, 3 * MM, 40]} />
      </mesh>
      <Slab w={1.2 * MM} h={11 * MM} d={d * 0.35} r={0.5 * MM} bevel={0.2 * MM} material={mats.frame} position={[w / 2 + 0.4 * MM, -h * 0.18, 0]} />
      {ultra && <Slab w={1.4 * MM} h={12 * MM} d={d * 0.4} r={0.6 * MM} bevel={0.25 * MM} material={mats.accent} position={[-w / 2 - 0.5 * MM, h * 0.1, 0]} />}
      {/* Sensor on the back */}
      <mesh position={[0, 0, -z - EPS]} rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[w * 0.32, 48]} />
        <meshPhysicalMaterial color="#0b0b0d" roughness={0.1} clearcoat={1} />
      </mesh>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Browser window & bare screen                                        */
/* ------------------------------------------------------------------ */

function drawTitleBar(ctx: CanvasRenderingContext2D, w: number, h: number, dark: boolean, url: string, style: DeviceState['browserStyle']) {
  const bg = dark ? (style === 'arc' ? '#232028' : '#1f1f22') : style === 'chrome' ? '#dee1e6' : style === 'arc' ? '#f1ecff' : '#ececef'
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)
  const r = h * 0.12
  ;['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => {
    ctx.fillStyle = c
    ctx.beginPath()
    ctx.arc(h * 0.5 + i * r * 3.2, h / 2, r, 0, Math.PI * 2)
    ctx.fill()
  })
  const pillW = style === 'chrome' ? w * 0.62 : w * 0.46
  const pillH = h * 0.58
  const px = style === 'chrome' ? h * 2.6 : (w - pillW) / 2
  const py = (h - pillH) / 2
  ctx.fillStyle = dark ? '#0f0f11' : '#ffffff'
  ctx.beginPath()
  ctx.roundRect(px, py, pillW, pillH, style === 'safari' ? pillH * 0.3 : pillH / 2)
  ctx.fill()
  ctx.fillStyle = dark ? 'rgba(255,255,255,0.78)' : 'rgba(0,0,0,0.72)'
  ctx.font = `500 ${Math.round(h * 0.3)}px -apple-system, Inter, system-ui, sans-serif`
  ctx.textAlign = style === 'chrome' ? 'left' : 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(url || 'beveled.app', style === 'chrome' ? px + pillH * 0.6 : w / 2, h / 2 + 1)
  ctx.fillStyle = dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)'
  for (let i = 0; i < 3; i++) ctx.fillRect(w - h * (0.7 + i * 0.55), h * 0.42, h * 0.22, h * 0.16)
  ctx.fillStyle = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'
  ctx.fillRect(0, h - 2, w, 2)
}

function BrowserModel({ device, layout, lighting }: DeviceProps) {
  const { bodyW, bodyH, bodyD, bodyRadius, screenW, screenH, barH, screenOffsetY } = layout
  const bar = useDisposable(() => {
    const c = document.createElement('canvas')
    c.width = 2000
    c.height = Math.max(8, Math.round((2000 * barH) / bodyW))
    drawTitleBar(c.getContext('2d')!, c.width, c.height, device.browserDark, device.browserUrl, device.browserStyle)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return t
  }, [device.browserDark, device.browserUrl, device.browserStyle, barH, bodyW])
  const barGeom = useDisposable(() => {
    // Top-rounded bar: a rounded plane twice the bar height whose lower half hides behind the screen.
    const g = createRoundedPlaneGeometry(bodyW, barH * 2, bodyRadius)
    const uv = g.attributes.uv
    for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * 2 - 1)
    uv.needsUpdate = true
    return g
  }, [bodyW, barH, bodyRadius])
  const chrome = device.browserDark ? '#1f1f22' : '#ececef'
  const bodyMat = useDisposable(() => new THREE.MeshPhysicalMaterial({ color: chrome, roughness: 0.5, metalness: 0.1, clearcoat: 0.4 }), [chrome])
  return (
    <group>
      <Slab w={bodyW} h={bodyH} d={bodyD} r={bodyRadius} bevel={0.006} material={bodyMat} />
      <mesh geometry={barGeom} position={[0, bodyH / 2 - barH, bodyD / 2 + 0.0008]}>
        <meshBasicMaterial map={bar} toneMapped={false} />
      </mesh>
      <DeviceScreen width={screenW} height={screenH} radius={0} rotated={false} fit={device.fit} glare={lighting.screenGlare * 0.6} position={[0, screenOffsetY, bodyD / 2 + 0.0012]} />
    </group>
  )
}

function ScreenModel({ device, layout, lighting }: DeviceProps) {
  const { bodyW, bodyH, bodyD, bodyRadius, screenW, screenH, screenRadius } = layout
  const color = device.border > 0 ? device.borderColor : '#050505'
  const mat = useDisposable(() => new THREE.MeshPhysicalMaterial({ color, metalness: 0.1, roughness: 0.4, clearcoat: 0.6 }), [color])
  return (
    <group>
      <Slab w={bodyW} h={bodyH} d={bodyD} r={bodyRadius} bevel={0.004} material={mat} />
      <DeviceScreen width={screenW} height={screenH} radius={screenRadius} rotated={false} fit={device.fit} glare={lighting.screenGlare * 0.6} position={[0, 0, bodyD / 2 + 0.001]} />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Dispatcher                                                          */
/* ------------------------------------------------------------------ */

export function Device(props: DeviceProps) {
  const { device, layout } = props
  const spec = layout.model.spec
  const rotation: [number, number, number] = layout.rotated ? [0, 0, Math.PI / 2] : [0, 0, 0]
  let content: ReactNode = null
  if (spec?.family === 'phone' || spec?.family === 'android') content = <PhoneModel {...props} spec={spec} />
  else if (spec?.family === 'tablet') content = <TabletModel {...props} spec={spec} />
  else if (spec?.family === 'laptop') content = <LaptopModel {...props} spec={spec} />
  else if (spec?.family === 'monitor') content = <MonitorModel {...props} spec={spec} />
  else if (spec?.family === 'watch') content = <WatchModel {...props} spec={spec} />
  else if (device.kind === 'custom') content = <CustomModel device={device} />
  else if (device.kind === 'browser') content = <BrowserModel {...props} />
  else content = <ScreenModel {...props} />
  return (
    <group scale={device.scale} rotation={rotation}>
      {content}
    </group>
  )
}

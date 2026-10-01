import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { ScreenFit } from '../types'
import { useRoundedPlane } from './geometry'
import { computeFit, useMediaTexture } from './media'
import { useSlotMedia } from './deviceSlot'
import { effectOn } from './effectState'
import { sampleNow, useShotClip, useShotScene } from './shotContext'

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform sampler2D map;
  uniform vec2 planeSize;
  uniform vec2 effSize;
  uniform vec2 fitScale;
  uniform float rot;
  uniform float inset;
  uniform vec3 letterbox;
  uniform float scroll;
  uniform float fade;
  uniform float fadeAngle;
  uniform float fadeSoftness;
  varying vec2 vUv;
  void main() {
    vec2 p = (vUv - 0.5) * planeSize;
    float c = cos(rot);
    float s = sin(rot);
    p = mat2(c, -s, s, c) * p;
    // Padding shrinks the media rectangle by 2 * inset of the short side.
    float pad = inset * min(effSize.x, effSize.y);
    vec2 inner = max(effSize - 2.0 * pad, vec2(1e-3));
    vec2 q = (p / inner) * fitScale + 0.5;
    // Media taller than the screen scrolls: 0 shows the top, 1 the bottom.
    if (fitScale.y < 1.0) q.y += (0.5 - fitScale.y * 0.5) * (1.0 - 2.0 * scroll);
    vec4 color;
    if (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0) {
      color = vec4(letterbox, 1.0);
    } else {
      color = texture2D(map, q);
    }
    if (fade > 0.0) {
      vec2 dir = vec2(cos(fadeAngle), sin(fadeAngle));
      vec2 pn = vUv - 0.5;
      float t = 0.5 + dot(pn, dir) / max(1e-3, abs(dir.x) + abs(dir.y));
      float f = fade * smoothstep(1.0 - fadeSoftness - 0.2, 1.0, t);
      color.rgb = mix(color.rgb, letterbox, clamp(f, 0.0, 1.0));
    }
    gl_FragColor = vec4(color.rgb, 1.0);
    #include <colorspace_fragment>
  }
`

export type DeviceScreenProps = {
  width: number
  height: number
  radius: number
  rotated: boolean
  fit: ScreenFit
  /** Environment reflection intensity of the glass layer. */
  glare: number
  position?: [number, number, number]
  rotation?: [number, number, number]
  /** Draw a phone status bar at the top of the screen. */
  statusBar?: boolean
}

function drawStatusBar(ctx: CanvasRenderingContext2D, w: number, h: number, dark: boolean) {
  ctx.clearRect(0, 0, w, h)
  const fg = dark ? '#000000' : '#ffffff'
  ctx.fillStyle = fg
  ctx.textBaseline = 'middle'
  ctx.font = `600 ${Math.round(h * 0.42)}px -apple-system, "SF Pro Text", Inter, system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText('9:41', w * 0.2, h * 0.55)
  // signal bars
  const bx = w * 0.7
  const by = h * 0.72
  for (let i = 0; i < 4; i++) {
    const bh = h * (0.12 + i * 0.07)
    ctx.fillRect(bx + i * h * 0.1, by - bh, h * 0.07, bh)
  }
  // wifi
  ctx.lineWidth = h * 0.06
  ctx.strokeStyle = fg
  const wx = w * 0.79
  const wy = h * 0.72
  for (let i = 1; i <= 3; i++) {
    ctx.beginPath()
    ctx.arc(wx, wy, h * 0.1 * i, -Math.PI * 0.75, -Math.PI * 0.25)
    ctx.stroke()
  }
  // battery
  const x = w * 0.84
  const y = h * 0.4
  const bw = h * 0.5
  const bhh = h * 0.28
  ctx.globalAlpha = 0.45
  ctx.beginPath()
  ctx.roundRect(x, y, bw, bhh, bhh * 0.3)
  ctx.lineWidth = h * 0.04
  ctx.stroke()
  ctx.fillRect(x + bw + h * 0.03, y + bhh * 0.3, h * 0.04, bhh * 0.4)
  ctx.globalAlpha = 1
  ctx.beginPath()
  ctx.roundRect(x + h * 0.05, y + h * 0.05, bw * 0.78, bhh - h * 0.1, bhh * 0.2)
  ctx.fill()
}

/** Average luminance of the top strip of an image, used to pick status bar colours. */
function topLuminance(image: unknown): number {
  if (!(image instanceof HTMLImageElement) || !image.naturalWidth) return 0
  try {
    const c = document.createElement('canvas')
    c.width = 16
    c.height = 4
    const ctx = c.getContext('2d', { willReadFrequently: true })!
    ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight * 0.05, 0, 0, 16, 4)
    const d = ctx.getImageData(0, 0, 16, 4).data
    let sum = 0
    for (let i = 0; i < d.length; i += 4) sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]
    return sum / (d.length / 4) / 255
  } catch {
    return 0
  }
}

/**
 * The media surface of a device: a rounded plane with a custom shader that handles
 * cover / contain / stretch fitting, padding and landscape rotation, plus a thin additive
 * glass layer that catches environment reflections.
 */
export function DeviceScreen({ width, height, radius, rotated, fit, glare, position = [0, 0, 0], rotation = [0, 0, 0], statusBar = false }: DeviceScreenProps) {
  const media = useSlotMedia()
  const device = useShotScene('device')
  const fx = useShotScene('effects')
  const clip = useShotClip()
  const fallbackAspect = rotated ? height / width : width / height
  const { texture, aspect, isPlaceholder } = useMediaTexture(media, fallbackAspect)
  const geometry = useRoundedPlane(width, height, radius)
  const fitResult = useMemo(() => computeFit(width, height, aspect, fit, rotated), [width, height, aspect, fit, rotated])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          map: { value: null },
          planeSize: { value: new THREE.Vector2(1, 1) },
          effSize: { value: new THREE.Vector2(1, 1) },
          fitScale: { value: new THREE.Vector2(1, 1) },
          rot: { value: 0 },
          inset: { value: 0 },
          letterbox: { value: new THREE.Color('#000000') },
          scroll: { value: 0 },
          fade: { value: 0 },
          fadeAngle: { value: 0 },
          fadeSoftness: { value: 0.5 },
        },
        toneMapped: false,
      }),
    []
  )
  useEffect(() => () => material.dispose(), [material])

  // Videos loop on their own while previewing; exports seek them explicitly.
  useEffect(() => {
    const img = texture.image as unknown
    if (img instanceof HTMLVideoElement && img.paused) void img.play().catch(() => undefined)
  }, [texture])

  material.uniforms.map.value = texture
  material.uniforms.planeSize.value.set(width, height)
  material.uniforms.effSize.value.set(fitResult.effW, fitResult.effH)
  material.uniforms.fitScale.value.set(fitResult.fitScale[0], fitResult.fitScale[1])
  material.uniforms.rot.value = fitResult.rotation
  material.uniforms.inset.value = device.screenPadding
  material.uniforms.letterbox.value.set(device.screenBg)
  material.uniforms.fade.value = effectOn(fx, 'screenFade', fx.screenFade) ? fx.screenFade : 0
  material.uniforms.fadeAngle.value = THREE.MathUtils.degToRad(fx.screenFadeAngle)
  material.uniforms.fadeSoftness.value = fx.screenFadeSoftness
  useFrame(() => {
    material.uniforms.scroll.value = THREE.MathUtils.clamp(sampleNow(clip, 'device.scroll'), 0, 1)
  })

  const barH = width * 0.13
  const darkText = useMemo(() => (isPlaceholder ? false : topLuminance(texture.image) > 0.6), [texture, isPlaceholder])
  const bar = useMemo(() => {
    if (!statusBar) return null
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = Math.round((1024 * barH) / width)
    drawStatusBar(canvas.getContext('2d')!, canvas.width, canvas.height, darkText)
    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [statusBar, darkText, barH, width])
  useEffect(() => () => bar?.dispose(), [bar])

  const barW = rotated ? height : width
  const barPos: [number, number, number] = rotated ? [width / 2 - barH / 2, 0, 0.0006] : [0, height / 2 - barH / 2, 0.0006]

  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={geometry} material={material} />
      {bar && (
        <mesh position={barPos} rotation={[0, 0, rotated ? -Math.PI / 2 : 0]}>
          <planeGeometry args={[barW, barH]} />
          <meshBasicMaterial map={bar} transparent toneMapped={false} depthWrite={false} />
        </mesh>
      )}
      {glare > 0 && (
        <mesh geometry={geometry} position={[0, 0, 0.0012]}>
          <meshStandardMaterial
            color="#000000"
            metalness={1}
            roughness={0.06}
            envMapIntensity={glare}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  )
}

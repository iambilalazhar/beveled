import { useThree } from '@react-three/fiber'
import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import type { BackgroundState } from '../types'

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 1.0, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 c0;
  uniform vec3 c1;
  uniform vec3 c2;
  uniform int count;
  uniform int kind; // 0 solid, 1 linear, 2 radial, 3 image
  uniform float angle;
  uniform float aspect;
  uniform float noise;
  uniform vec2 resolution;
  uniform sampler2D map;
  uniform float mapAspect;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  vec3 ramp(float t) {
    t = clamp(t, 0.0, 1.0);
    if (count <= 1) return c0;
    if (count == 2) return mix(c0, c1, t);
    return t < 0.5 ? mix(c0, c1, t * 2.0) : mix(c1, c2, (t - 0.5) * 2.0);
  }

  void main() {
    vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);
    vec3 color;
    if (kind == 3) {
      // cover-fit the image
      vec2 uv = vUv - 0.5;
      if (aspect > mapAspect) uv.y *= mapAspect / aspect;
      else uv.x *= aspect / mapAspect;
      color = texture2D(map, uv + 0.5).rgb;
    } else {
      float t = 0.0;
      if (kind == 1) {
        // CSS-style angle: 0deg = to top, 90deg = to right
        vec2 dir = vec2(sin(angle), cos(angle));
        float extent = abs(dir.x) * aspect * 0.5 + abs(dir.y) * 0.5;
        t = dot(p, dir) / max(extent, 1e-4) * 0.5 + 0.5;
      } else if (kind == 2) {
        t = length(p) / (0.5 * length(vec2(aspect, 1.0))) * 1.05;
      }
      color = ramp(t);
    }
    if (noise > 0.0) {
      float n = hash(floor(vUv * resolution)) - 0.5;
      color += n * noise * 0.16;
    }
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`

/** Loads an image and bakes a blurred copy into a texture (blur is 0..1 of a strong gaussian). */
function useBlurredImage(url: string | null, blur: number) {
  const [state, setState] = useState<{ key: string; texture: THREE.Texture; aspect: number } | null>(null)
  const key = `${url}|${blur.toFixed(2)}`
  useEffect(() => {
    if (!url) return
    let cancelled = false
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      if (cancelled) return
      const maxSide = 1600
      const k = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight))
      const w = Math.max(2, Math.round(img.naturalWidth * k))
      const h = Math.max(2, Math.round(img.naturalHeight * k))
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      const px = blur * Math.max(w, h) * 0.04
      if (px > 0.5) {
        // Draw slightly oversized so the blurred edges don't fade to transparent.
        ctx.filter = `blur(${px}px)`
        const pad = px * 2
        ctx.drawImage(img, -pad, -pad, w + pad * 2, h + pad * 2)
      } else ctx.drawImage(img, 0, 0, w, h)
      const texture = new THREE.CanvasTexture(canvas)
      texture.colorSpace = THREE.SRGBColorSpace
      setState((prev) => {
        prev?.texture.dispose()
        return { key, texture, aspect: w / h }
      })
    }
    img.src = url
    return () => {
      cancelled = true
    }
  }, [url, blur, key])
  // Keep showing the previous image while a new blur level is baked.
  return url ? state : null
}

/**
 * Full-screen background quad rendered inside the scene so it is part of every export
 * and every post-processing pass. Not rendered when the background is transparent.
 */
export function Background({ bg }: { bg: BackgroundState }) {
  const size = useThree((s) => s.size)
  const image = useBlurredImage(bg.kind === 'image' ? bg.image : null, bg.imageBlur)
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          c0: { value: new THREE.Color('#000') },
          c1: { value: new THREE.Color('#000') },
          c2: { value: new THREE.Color('#000') },
          count: { value: 1 },
          kind: { value: 0 },
          angle: { value: 0 },
          aspect: { value: 1 },
          noise: { value: 0 },
          resolution: { value: new THREE.Vector2(1, 1) },
          map: { value: null },
          mapAspect: { value: 1 },
        },
      }),
    []
  )
  useEffect(() => () => material.dispose(), [material])

  const colors = bg.colors.length ? bg.colors : ['#000000']
  const hasImage = bg.kind === 'image' && !!image
  material.uniforms.c0.value.set(colors[0])
  material.uniforms.c1.value.set(colors[1] ?? colors[0])
  material.uniforms.c2.value.set(colors[2] ?? colors[1] ?? colors[0])
  material.uniforms.count.value = bg.kind === 'solid' || bg.kind === 'image' ? 1 : Math.min(3, colors.length)
  material.uniforms.kind.value = hasImage ? 3 : bg.kind === 'linear' ? 1 : bg.kind === 'radial' ? 2 : 0
  material.uniforms.angle.value = THREE.MathUtils.degToRad(bg.angle)
  material.uniforms.aspect.value = size.width / Math.max(1, size.height)
  material.uniforms.noise.value = bg.noise
  material.uniforms.resolution.value.set(size.width, size.height)
  material.uniforms.map.value = hasImage ? image.texture : null
  material.uniforms.mapAspect.value = hasImage ? image.aspect : 1

  if (bg.kind === 'transparent') return null
  return (
    <mesh frustumCulled={false} renderOrder={-1000} material={material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  )
}

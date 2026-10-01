import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import type { BackgroundState, ShaderBgId } from '../types'
import { useEditor } from '../store'

const SHADER_INDEX: Record<ShaderBgId, number> = { aurora: 0, silk: 1, mesh: 2, waves: 3, prism: 4, chrome: 5, dunes: 6, swirl: 7, bokeh: 8, grain: 9 }

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
  uniform int kind; // 0 solid, 1 linear, 2 radial, 3 image, 4 shader
  uniform int pattern;
  uniform float time;
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

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * vnoise(p);
      p = mat2(1.6, 1.2, -1.2, 1.6) * p;
      a *= 0.5;
    }
    return v;
  }

  vec3 ramp(float t) {
    t = clamp(t, 0.0, 1.0);
    if (count <= 1) return c0;
    if (count == 2) return mix(c0, c1, t);
    return t < 0.5 ? mix(c0, c1, t * 2.0) : mix(c1, c2, (t - 0.5) * 2.0);
  }

  vec3 palette3(float t) {
    t = clamp(t, 0.0, 1.0);
    return t < 0.5 ? mix(c0, c1, t * 2.0) : mix(c1, c2, (t - 0.5) * 2.0);
  }

  vec3 shaderBg(vec2 p, float t) {
    if (pattern == 0) {
      // Aurora: thin curtains of light with vertical rays over a dark sky
      vec3 col = c0 * 0.8;
      for (int i = 0; i < 3; i++) {
        float fi = float(i);
        float y = p.y - 0.12 + fi * 0.14 + 0.16 * sin(p.x * (1.4 + fi * 0.6) + t * (0.3 + fi * 0.1) + fi * 2.0) + (fbm(vec2(p.x * 1.2 + t * 0.08, fi)) - 0.5) * 0.3;
        float band = exp(-pow(max(y, 0.0) * 9.0, 2.0)) * smoothstep(-0.35, 0.0, y);
        float rays = 0.45 + 0.55 * fbm(vec2(p.x * 14.0 + fi * 3.0, t * 0.15));
        col += (mod(fi, 2.0) == 1.0 ? c2 : c1) * band * rays * (0.75 - fi * 0.15);
      }
      return col;
    }
    if (pattern == 1) {
      // Silk: domain-warped folds with a sheen
      vec2 q = p * 1.4;
      float f = 0.0;
      for (int i = 0; i < 4; i++) {
        float fi = float(i);
        q += 0.35 * vec2(sin(q.y * 1.7 + t * 0.3 + fi), cos(q.x * 1.3 - t * 0.25 + fi * 1.3));
      }
      f = 0.5 + 0.5 * sin(q.x * 2.0 + q.y * 1.2);
      float sheen = pow(0.5 + 0.5 * sin(q.x * 2.0 + q.y * 1.2 + 0.6), 8.0);
      return palette3(f) + sheen * 0.35 * mix(c1, vec3(1.0), 0.5);
    }
    if (pattern == 2) {
      // Mesh gradient: four drifting colour points
      vec2 a = vec2(-0.45 + 0.15 * sin(t * 0.4), 0.3 + 0.1 * cos(t * 0.3));
      vec2 b = vec2(0.5 + 0.12 * cos(t * 0.35), 0.25 + 0.15 * sin(t * 0.5));
      vec2 c = vec2(0.1 + 0.2 * sin(t * 0.25 + 1.0), -0.35 + 0.1 * cos(t * 0.45));
      vec2 d = vec2(-0.6 + 0.1 * cos(t * 0.3), -0.4);
      float wa = 1.0 / (0.02 + pow(length(p - a), 2.2));
      float wb = 1.0 / (0.02 + pow(length(p - b), 2.2));
      float wc = 1.0 / (0.02 + pow(length(p - c), 2.2));
      float wd = 1.0 / (0.02 + pow(length(p - d), 2.2));
      return (c0 * wa + c1 * wb + c2 * wc + mix(c0, c2, 0.5) * wd) / (wa + wb + wc + wd);
    }
    if (pattern == 3) {
      // Waves: stacked bands, each catching a little light along its crest
      vec3 col = mix(c0, c1, smoothstep(-0.5, 0.6, p.y));
      for (int i = 0; i < 6; i++) {
        float fi = float(i);
        float h = 0.38 - fi * 0.16 + 0.06 * sin(p.x * (2.0 + fi * 0.4) + t * (0.4 + fi * 0.07) + fi);
        float m = smoothstep(h + 0.003, h - 0.003, p.y);
        vec3 tone = palette3(fi / 5.0) * (0.78 + 0.22 * smoothstep(h - 0.14, h, p.y));
        col = mix(col, tone, m);
      }
      return col;
    }
    if (pattern == 4) {
      // Prism: a soft fan of spectral light from below the frame
      vec2 o = p + vec2(0.25, 0.75);
      float a = atan(o.y, o.x);
      float r = length(o);
      float rays = pow(0.5 + 0.5 * sin(a * 7.0 + t * 0.3 + fbm(vec2(a * 2.0, t * 0.08)) * 2.5), 3.0);
      vec3 spectrum = 0.5 + 0.5 * cos(6.2831 * (a * 0.45 + vec3(0.0, 0.33, 0.67) + t * 0.02));
      vec3 col = mix(c1, c0, smoothstep(0.2, 1.6, r));
      col += spectrum * rays * exp(-r * 1.1) * 0.45 * (0.4 + c2 * 0.6);
      return col;
    }
    if (pattern == 5) {
      // Liquid chrome: warped noise mapped through a metallic ramp
      vec2 q = p * 1.6;
      vec2 w = vec2(fbm(q + t * 0.08), fbm(q + vec2(5.2, 1.3) - t * 0.06));
      float n = fbm(q + w * 2.2);
      float m = 0.5 + 0.5 * sin(n * 12.0);
      float spec = pow(m, 6.0);
      vec3 metal = mix(c0, c1, m);
      return metal + spec * mix(vec3(1.0), c2, 0.3) * 0.6;
    }
    if (pattern == 6) {
      // Dunes: layered soft hills
      vec3 col = mix(c2, c1, smoothstep(-0.6, 0.6, p.y));
      for (int i = 0; i < 4; i++) {
        float fi = float(i);
        float h = 0.15 - fi * 0.18 + 0.1 * sin(p.x * (1.4 + fi * 0.5) + fi * 2.1 + t * 0.05) + fbm(vec2(p.x * 2.0 + fi * 4.0, fi)) * 0.08;
        float m = smoothstep(h + 0.01, h - 0.01, p.y);
        vec3 tone = mix(c1, c0, (fi + 1.0) / 4.0);
        tone *= 0.85 + 0.15 * smoothstep(h - 0.25, h, p.y);
        col = mix(col, tone, m);
      }
      return col;
    }
    if (pattern == 7) {
      // Swirl: a slow vortex of the three stops
      float r = length(p);
      float a = atan(p.y, p.x) + r * 3.2 - t * 0.25;
      float f = 0.5 + 0.5 * sin(a * 2.0 + (fbm(p * 1.5 + t * 0.05) - 0.5) * 1.2);
      return mix(palette3(f), c0, smoothstep(0.0, 0.08, 0.08 - r) * 0.5 + smoothstep(0.45, 1.3, r) * 0.6);
    }
    if (pattern == 8) {
      // Bokeh: out-of-focus discs over a gradient
      vec3 col = mix(c0, c1 * 0.6, smoothstep(-0.7, 0.7, p.y));
      for (int i = 0; i < 14; i++) {
        float fi = float(i);
        vec2 c = vec2(hash(vec2(fi, 1.0)) * 2.0 - 1.0, hash(vec2(fi, 2.0)) * 1.2 - 0.6) * vec2(aspect * 0.5 + 0.2, 1.0);
        c += 0.04 * vec2(sin(t * 0.3 + fi), cos(t * 0.25 + fi * 1.3));
        float rad = 0.05 + hash(vec2(fi, 3.0)) * 0.12;
        float disc = smoothstep(rad, rad * 0.85, length(p - c));
        col += mix(c1, c2, hash(vec2(fi, 4.0))) * disc * 0.35;
      }
      return col;
    }
    // Grain gradient: blurred colour blobs with heavy grain
    float n = fbm(p * 1.2 + vec2(t * 0.05, 0.0));
    vec3 col = palette3(smoothstep(0.2, 0.8, n + p.y * 0.3));
    col += (hash(gl_FragCoord.xy + fract(t)) - 0.5) * 0.12;
    return col;
  }

  void main() {
    vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);
    vec3 color;
    if (kind == 4) {
      color = shaderBg(p, time);
    } else if (kind == 3) {
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
export function Background({ bg, time }: { bg: BackgroundState; /** Clock for animated backgrounds (defaults to the 3-D timeline). */ time?: () => number }) {
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
          pattern: { value: 0 },
          time: { value: 0 },
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
  material.uniforms.kind.value = hasImage ? 3 : bg.kind === 'shader' ? 4 : bg.kind === 'linear' ? 1 : bg.kind === 'radial' ? 2 : 0
  material.uniforms.pattern.value = SHADER_INDEX[bg.shader] ?? 0
  material.uniforms.angle.value = THREE.MathUtils.degToRad(bg.angle)
  material.uniforms.aspect.value = size.width / Math.max(1, size.height)
  material.uniforms.noise.value = bg.noise
  material.uniforms.resolution.value.set(size.width, size.height)
  material.uniforms.map.value = hasImage ? image.texture : null
  material.uniforms.mapAspect.value = hasImage ? image.aspect : 1

  // Shader backgrounds animate with the timeline clock, so exports match the preview frame for frame.
  const speed = bg.speed
  useFrame(() => {
    material.uniforms.time.value = (time ? time() : useEditor.getState().time) * speed * 2 + 10
  })

  if (bg.kind === 'transparent') return null
  return (
    <mesh frustumCulled={false} renderOrder={-1000} material={material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  )
}

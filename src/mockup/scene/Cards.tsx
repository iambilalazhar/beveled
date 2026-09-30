import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { drawLogoCard, drawTextCard, ensureFont } from '../timeline/cardRender'
import { PLACEHOLDER_LOGO } from '../timeline/factory'
import { cachedImage, loadImage } from '../timeline/imageCache'
import type { LogoClip, TextClip } from '../timeline/types'
import { Background } from './Background'
import { localTimeOf } from './shotContext'


function useImage(url: string | null) {
  const [, bump] = useState(0)
  const img = cachedImage(url)
  useEffect(() => {
    if (!url || cachedImage(url)) return
    let cancelled = false
    loadImage(url)
      .then(() => !cancelled && bump((n) => n + 1))
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [url])
  return img
}

/**
 * Full-frame quad whose texture is a 2D canvas redrawn every frame. Sized to the drawing buffer
 * so exports at 2x–4x stay sharp.
 */
function CanvasQuad({ draw }: { draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void }) {
  const gl = useThree((s) => s.gl)
  const { canvas, texture } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 2
    canvas.height = 2
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.minFilter = THREE.LinearFilter
    texture.generateMipmaps = false
    return { canvas, texture }
  }, [])
  useEffect(() => () => texture.dispose(), [texture])
  const buf = useMemo(() => new THREE.Vector2(), [])

  useFrame(() => {
    gl.getDrawingBufferSize(buf)
    const w = Math.max(2, Math.round(buf.x))
    const h = Math.max(2, Math.round(buf.y))
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
      texture.dispose()
    }
    draw(canvas.getContext('2d')!, w, h)
    texture.needsUpdate = true
  })

  return (
    <mesh frustumCulled={false} renderOrder={10}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        transparent
        depthTest={false}
        depthWrite={false}
        uniforms={{ map: { value: texture } }}
        vertexShader={/* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`}
        fragmentShader={/* glsl */ `
          uniform sampler2D map;
          varying vec2 vUv;
          void main() {
            gl_FragColor = texture2D(map, vUv);
            #include <colorspace_fragment>
          }
        `}
      />
    </mesh>
  )
}

export function TextCard({ clip }: { clip: TextClip }) {
  const [, bump] = useState(0)
  useEffect(() => {
    let cancelled = false
    void ensureFont(clip.text.font, clip.text.weight).then(() => !cancelled && bump((n) => n + 1))
    return () => {
      cancelled = true
    }
  }, [clip.text.font, clip.text.weight])
  return (
    <>
      <Background bg={clip.text.background} />
      <CanvasQuad draw={(ctx, w, h) => drawTextCard(ctx, w, h, clip.text, localTimeOf(clip), clip.duration)} />
    </>
  )
}

export function LogoCard({ clip }: { clip: LogoClip }) {
  const image = useImage(clip.logo.url ?? PLACEHOLDER_LOGO)
  return (
    <>
      <Background bg={clip.logo.background} />
      <CanvasQuad draw={(ctx, w, h) => drawLogoCard(ctx, w, h, clip.logo, image, localTimeOf(clip), clip.duration)} />
    </>
  )
}

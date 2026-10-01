import { BlendFunction, Effect, EffectAttribute } from 'postprocessing'
import * as THREE from 'three'

const uniformMap = (entries: [string, unknown][]) => new Map<string, THREE.Uniform>(entries.map(([k, v]) => [k, new THREE.Uniform(v)]))

/* ------------------------------------------------------------------ */
/* Pixel grid: LCD-style cells with RGB sub-pixels                     */
/* ------------------------------------------------------------------ */

const pixelGridShader = /* glsl */ `
  uniform float amount;
  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    // Cell size follows the frame height so exports at any resolution look the same.
    float cell = max(2.0, resolution.y * mix(0.0035, 0.016, amount));
    vec2 px = uv * resolution;
    vec2 id = floor(px / cell);
    vec4 c = texture2D(inputBuffer, (id + 0.5) * cell / resolution);
    vec2 f = fract(px / cell);
    float gap = 0.14;
    float mask = smoothstep(0.0, gap, f.x) * smoothstep(0.0, gap, 1.0 - f.x) * smoothstep(0.0, gap, f.y) * smoothstep(0.0, gap, 1.0 - f.y);
    vec3 sub = vec3(f.x < 0.333 ? 1.0 : 0.4, (f.x >= 0.333 && f.x < 0.666) ? 1.0 : 0.4, f.x >= 0.666 ? 1.0 : 0.4);
    vec3 col = c.rgb * mix(vec3(1.0), sub * 1.5, 0.5) * mix(0.3, 1.05, mask);
    outputColor = vec4(mix(inputColor.rgb, col, smoothstep(0.0, 0.12, amount)), inputColor.a);
  }
`

export class PixelGridEffect extends Effect {
  constructor() {
    super('PixelGridEffect', pixelGridShader, { attributes: EffectAttribute.CONVOLUTION, uniforms: uniformMap([['amount', 0]]) })
  }
  set amount(v: number) {
    this.uniforms.get('amount')!.value = v
  }
}

/* ------------------------------------------------------------------ */
/* Glass frame: frosted glass border and liquid glass refraction       */
/* ------------------------------------------------------------------ */

const glassShader = /* glsl */ `
  uniform float width;       // rim width, fraction of the short side
  uniform float refraction;  // how strongly the rim bends the image inwards
  uniform float frost;       // blur inside the rim
  uniform float shine;       // specular highlight along the lit edge
  uniform float dispersion;  // chromatic split in the rim
  uniform float radius;      // inner corner radius, fraction of the short side
  uniform float tint;        // white tint of the glass

  float sdRoundRect(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }

  vec3 tap(vec2 uv, vec2 off) {
    if (dispersion <= 0.0) return texture2D(inputBuffer, clamp(uv + off, 0.0, 1.0)).rgb;
    return vec3(
      texture2D(inputBuffer, clamp(uv + off * (1.0 + dispersion), 0.0, 1.0)).r,
      texture2D(inputBuffer, clamp(uv + off, 0.0, 1.0)).g,
      texture2D(inputBuffer, clamp(uv + off * (1.0 - dispersion), 0.0, 1.0)).b
    );
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    float s = min(resolution.x, resolution.y);
    float w = width * s;
    vec2 halfSize = 0.5 * resolution;
    vec2 p = uv * resolution - halfSize;
    float r = clamp(radius * s, 0.0, min(halfSize.x, halfSize.y));
    // Signed distance to the inner edge of the rim (negative inside the rim, positive in the clear centre).
    float inside = -sdRoundRect(p, halfSize - w, r);
    float dEdge = min(halfSize.x - abs(p.x), halfSize.y - abs(p.y));
    if (w <= 0.5 || inside > 1.0) {
      outputColor = inputColor;
      return;
    }
    // 0 at the inner edge of the rim, 1 at the frame edge.
    float k = clamp(-inside / w, 0.0, 1.0);
    vec2 e = vec2(1.0, 0.0);
    vec2 n = normalize(vec2(
      sdRoundRect(p + e.xy, halfSize - w, r) - sdRoundRect(p - e.xy, halfSize - w, r),
      sdRoundRect(p + e.yx, halfSize - w, r) - sdRoundRect(p - e.yx, halfSize - w, r)
    ) + 1e-5);
    // Lens profile: a rounded bevel whose slope grows towards the frame edge.
    float slope = k * k;
    vec2 off = -n * refraction * w * slope / resolution;
    vec3 col;
    float br = frost * w * 0.18;
    if (br > 0.75) {
      col = tap(uv, off) * 0.2;
      for (int i = 0; i < 8; i++) {
        float a = float(i) * 0.785398 + 0.39;
        col += tap(uv, off + vec2(cos(a), sin(a)) * br / resolution) * 0.1;
      }
    } else {
      col = tap(uv, off);
    }
    col = mix(col, vec3(1.0), tint * (0.4 + 0.6 * k));
    // Specular: light from the top left, strongest on the outer bevel.
    float lit = max(dot(n, normalize(vec2(-0.55, 0.85))), 0.0);
    float spec = shine * pow(lit, 3.0) * smoothstep(0.15, 1.0, k);
    // Thin bright lines at the inner and outer edge of the glass.
    float innerLine = (1.0 - smoothstep(0.0, 1.6, abs(inside))) * 0.55;
    float outerLine = (1.0 - smoothstep(0.0, 1.6, dEdge)) * 0.35;
    col += vec3(spec + (innerLine + outerLine) * (0.35 + shine));
    outputColor = vec4(col, inputColor.a);
  }
`

export type GlassParams = { width: number; refraction: number; frost: number; shine: number; dispersion: number; radius: number; tint: number }

export class GlassFrameEffect extends Effect {
  constructor() {
    super('GlassFrameEffect', glassShader, {
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: uniformMap([
        ['width', 0],
        ['refraction', 0],
        ['frost', 0],
        ['shine', 0],
        ['dispersion', 0],
        ['radius', 0],
        ['tint', 0],
      ]),
    })
  }
  setParams(p: GlassParams) {
    for (const [k, v] of Object.entries(p)) this.uniforms.get(k)!.value = v
  }
}

/** Frosted glass border: `width` is a percentage of the short side. */
export const glassBorderParams = (width: number): GlassParams => ({ width: width / 100, refraction: 0.5, frost: 1.2, shine: 0.5, dispersion: 0, radius: 0.02, tint: 0.14 })

/** Liquid glass over the frame edges: thick, clear, refractive, with a chromatic split. */
export const liquidGlassParams = (strength: number, shine: number): GlassParams => ({
  width: 0.045 + strength * 0.05,
  refraction: 0.4 + strength * 1.6,
  frost: 0,
  shine: shine * 1.4,
  dispersion: strength * 0.35,
  radius: 0.06,
  tint: 0.03,
})

/* ------------------------------------------------------------------ */
/* Light shadow: sunlight through blinds, a window or leaves           */
/* ------------------------------------------------------------------ */

const lightShadowShader = /* glsl */ `
  uniform float opacity;
  uniform int pattern;      // 0 blinds, 1 window, 2 leaves, 3 palm
  uniform float angle;
  uniform float softness;
  uniform float uTime;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = p * 2.03 + vec2(17.0, 9.0);
      a *= 0.5;
    }
    return v;
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
    float ca = cos(angle);
    float sa = sin(angle);
    vec2 q = mat2(ca, -sa, sa, ca) * p;
    float soft = mix(0.008, 0.2, softness);
    float light = 1.0;
    if (pattern == 0) {
      // Venetian blinds, slightly keystoned like a projection
      q.y += q.x * q.x * 0.08;
      float f = fract(q.y * 8.0 + 0.25);
      light = smoothstep(0.42 - soft * 2.0, 0.42 + soft * 2.0, f) * (1.0 - smoothstep(0.96 - soft * 2.0, 0.999, f));
      float frameMask = smoothstep(0.72 + soft, 0.72 - soft, abs(q.x + 0.15));
      light *= frameMask;
    } else if (pattern == 1) {
      // A four-pane window: bright panes, dark mullions and frame
      vec2 g = (q - vec2(0.18, 0.05)) * vec2(1.0, 1.15);
      vec2 cell = abs(fract(g * 1.6) - 0.5);
      float bars = smoothstep(0.035, 0.035 + soft * 0.8, min(cell.x, cell.y));
      float area = smoothstep(0.62 + soft, 0.62 - soft, max(abs(g.x), abs(g.y) * 1.2));
      light = bars * area;
    } else if (pattern == 2) {
      // Dappled leaves that sway over time: warped noise with a sharp threshold reads as foliage
      vec2 w = q * 5.5 + vec2(sin(uTime * 0.6) * 0.1, cos(uTime * 0.45) * 0.08);
      vec2 warp = vec2(fbm(w * 0.6 + 3.1), fbm(w * 0.6 + 7.7));
      float n = fbm(w + warp * 1.6);
      float holes = fbm(w * 2.3 + warp);
      light = smoothstep(0.52 - soft * 0.6, 0.52 + soft * 0.6, n) * smoothstep(0.35, 0.35 + soft + 0.05, holes) + smoothstep(0.62, 0.7, holes) * 0.5;
      light = clamp(light, 0.0, 1.0);
    } else {
      // Palm fronds: drooping spines with tapering, angled leaflets, radiating from beyond the top-left corner
      float shadow = 0.0;
      vec2 o = vec2(-0.5 * aspect - 0.15, 0.62);
      for (int i = 0; i < 5; i++) {
        float fi = float(i);
        float th = -0.12 - fi * 0.32 + sin(uTime * 0.5 + fi * 1.7) * 0.025;
        vec2 dir = vec2(cos(th), sin(th));
        vec2 nrm = vec2(-dir.y, dir.x);
        vec2 d = q - o;
        float u = dot(d, dir);
        float L = 1.25 - fi * 0.08;
        float along = u / L;
        float v = dot(d, nrm) + 0.18 * along * along;
        float inRange = step(0.03, along) * step(along, 1.0);
        float halfW = 0.17 * sin(3.14159 * clamp(along, 0.0, 1.0));
        float leaflet = step(fract(along * 24.0 + abs(v) * 7.0), 0.55);
        float blade = (1.0 - smoothstep(halfW - soft * 0.3, halfW + soft * 0.3, abs(v))) * leaflet;
        float spine = 1.0 - smoothstep(0.004, 0.004 + soft * 0.08, abs(v));
        shadow = max(shadow, max(blade, spine) * inRange);
      }
      light = 1.0 - shadow;
    }
    float shade = mix(1.0, 0.42 + 0.58 * light, opacity);
    vec3 warm = mix(vec3(1.0), vec3(1.07, 1.02, 0.94), light * opacity * 0.8);
    vec3 cool = mix(vec3(1.0), vec3(0.9, 0.94, 1.05), (1.0 - light) * opacity);
    outputColor = vec4(inputColor.rgb * shade * warm * cool, inputColor.a);
  }
`

const PATTERN_INDEX = { blinds: 0, window: 1, leaves: 2, palm: 3 } as const

export class LightShadowEffect extends Effect {
  constructor() {
    super('LightShadowEffect', lightShadowShader, {
      blendFunction: BlendFunction.SRC,
      uniforms: uniformMap([
        ['opacity', 0],
        ['pattern', 0],
        ['angle', 0],
        ['softness', 0.5],
        ['uTime', 0],
      ]),
    })
  }
  setParams(p: { opacity: number; pattern: keyof typeof PATTERN_INDEX; angle: number; softness: number; time: number }) {
    this.uniforms.get('opacity')!.value = p.opacity
    this.uniforms.get('pattern')!.value = PATTERN_INDEX[p.pattern]
    this.uniforms.get('angle')!.value = p.angle
    this.uniforms.get('softness')!.value = p.softness
    this.uniforms.get('uTime')!.value = p.time
  }
}

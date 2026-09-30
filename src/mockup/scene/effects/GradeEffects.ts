import { BlendFunction, Effect, EffectAttribute } from 'postprocessing'
import * as THREE from 'three'

/* ------------------------------------------------------------------ */
/* Colour grade                                                        */
/* ------------------------------------------------------------------ */

const gradeShader = /* glsl */ `
  uniform float exposure;
  uniform float brightness;
  uniform float contrast;
  uniform float saturation;
  uniform float hue;
  uniform float shadows;
  uniform float midtones;
  uniform float highlights;

  vec3 hueShift(vec3 c, float a) {
    const vec3 k = vec3(0.57735);
    float ca = cos(a);
    return c * ca + cross(k, c) * sin(a) + k * dot(k, c) * (1.0 - ca);
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec3 c = inputColor.rgb * exp2(exposure);
    c += brightness;
    c = (c - 0.5) * (1.0 + contrast) + 0.5;
    float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
    // Lift / gamma / gain weighted by luminance bands
    float sw = 1.0 - smoothstep(0.0, 0.5, l);
    float hw = smoothstep(0.5, 1.0, l);
    float mw = 1.0 - sw - hw;
    c += shadows * 0.25 * sw + highlights * 0.25 * hw;
    c = pow(max(c, 0.0), vec3(1.0 / max(0.05, 1.0 + midtones * 0.6 * mw * 2.0)));
    l = dot(c, vec3(0.2126, 0.7152, 0.0722));
    c = mix(vec3(l), c, 1.0 + saturation);
    if (abs(hue) > 1e-4) c = hueShift(c, hue);
    outputColor = vec4(clamp(c, 0.0, 1.0), inputColor.a);
  }
`

export type GradeParams = {
  exposure: number
  brightness: number
  contrast: number
  saturation: number
  hue: number
  shadows: number
  midtones: number
  highlights: number
}

export class GradeEffect extends Effect {
  constructor() {
    super('GradeEffect', gradeShader, {
      blendFunction: BlendFunction.SRC,
      uniforms: new Map<string, THREE.Uniform>(
        ['exposure', 'brightness', 'contrast', 'saturation', 'hue', 'shadows', 'midtones', 'highlights'].map((k) => [k, new THREE.Uniform(0)])
      ),
    })
  }
  setParams(p: GradeParams) {
    for (const [k, v] of Object.entries(p)) {
      const u = this.uniforms.get(k)
      if (u) u.value = v
    }
  }
}

/* ------------------------------------------------------------------ */
/* Fish eye                                                            */
/* ------------------------------------------------------------------ */

const fisheyeShader = /* glsl */ `
  uniform float amount;
  uniform float aspectRatio;
  void mainUv(inout vec2 uv) {
    vec2 p = (uv - 0.5) * vec2(aspectRatio, 1.0);
    float r2 = dot(p, p);
    p *= 1.0 + amount * r2 * 1.4;
    p /= 1.0 + amount * 0.35;
    uv = p / vec2(aspectRatio, 1.0) + 0.5;
  }
`

export class FisheyeEffect extends Effect {
  constructor() {
    super('FisheyeEffect', fisheyeShader, {
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map<string, THREE.Uniform>([
        ['amount', new THREE.Uniform(0)],
        ['aspectRatio', new THREE.Uniform(1)],
      ]),
    })
  }
  setParams(amount: number, aspect: number) {
    this.uniforms.get('amount')!.value = amount
    this.uniforms.get('aspectRatio')!.value = aspect
  }
}

/* ------------------------------------------------------------------ */
/* Fade (clip transitions)                                             */
/* ------------------------------------------------------------------ */

const fadeShader = /* glsl */ `
  uniform float amount;
  uniform vec3 color;
  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    outputColor = vec4(mix(inputColor.rgb, color, amount), mix(inputColor.a, 1.0, amount));
  }
`

export class FadeEffect extends Effect {
  constructor() {
    super('FadeEffect', fadeShader, {
      blendFunction: BlendFunction.SRC,
      uniforms: new Map<string, THREE.Uniform>([
        ['amount', new THREE.Uniform(0)],
        ['color', new THREE.Uniform(new THREE.Color('#000000'))],
      ]),
    })
  }
  set amount(v: number) {
    this.uniforms.get('amount')!.value = v
  }
}

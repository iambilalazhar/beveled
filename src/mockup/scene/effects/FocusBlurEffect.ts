import { BlendFunction, Effect, EffectAttribute } from 'postprocessing'
import * as THREE from 'three'

const fragmentShader = /* glsl */ `
  uniform int mode;        // 1 tilt-shift, 2 radial, 3 directional
  uniform float strength;  // blur radius in pixels
  uniform float falloff;   // 0..1 softness of the focus edge
  uniform float bokeh;     // 0..2 highlight weighting
  uniform vec2 focus;      // 0..1 (uv space, y up)
  uniform float focusSize; // 0..1
  uniform float angle;     // radians
  uniform float aspectRatio;

  float focusMask(const in vec2 uv) {
    vec2 p = (uv - focus) * vec2(aspectRatio, 1.0);
    float soft = 0.02 + falloff * 0.6;
    if (mode == 1) {
      vec2 n = vec2(-sin(angle), cos(angle));
      float d = abs(dot(p, n));
      return smoothstep(focusSize, focusSize + soft, d);
    }
    if (mode == 2) {
      float d = length(p);
      return smoothstep(focusSize, focusSize + soft, d);
    }
    vec2 dir = vec2(cos(angle), sin(angle));
    float d = dot(p, dir);
    return smoothstep(0.0, soft + 0.001, d);
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    float m = focusMask(uv);
    float radius = strength * m;
    if (radius < 0.5) {
      outputColor = inputColor;
      return;
    }
    vec3 acc = vec3(0.0);
    float wsum = 0.0;
    const int TAPS = 40;
    const float GOLDEN = 2.39996323;
    for (int i = 0; i < TAPS; i++) {
      float fi = float(i);
      float r = sqrt((fi + 0.5) / float(TAPS));
      float a = fi * GOLDEN;
      vec2 offset = vec2(cos(a), sin(a)) * r * radius * texelSize;
      vec3 s = texture2D(inputBuffer, uv + offset).rgb;
      float lum = dot(s, vec3(0.299, 0.587, 0.114));
      float w = 1.0 + bokeh * pow(lum, 3.0) * 2.5;
      acc += s * w;
      wsum += w;
    }
    vec3 blurred = acc / max(wsum, 1e-4);
    outputColor = vec4(mix(inputColor.rgb, blurred, smoothstep(0.5, 1.5, radius)), inputColor.a);
  }
`

export type FocusBlurMode = 'tilt-shift' | 'radial' | 'directional'

/**
 * Screen-space focus blur with three masks: tilt-shift (band), radial (circle) and
 * directional (everything past a line). Uses a golden-angle disk kernel with
 * luminance weighting for a soft bokeh look.
 */
export class FocusBlurEffect extends Effect {
  constructor() {
    super('FocusBlurEffect', fragmentShader, {
      blendFunction: BlendFunction.SRC,
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map<string, THREE.Uniform>([
        ['mode', new THREE.Uniform(2)],
        ['strength', new THREE.Uniform(10)],
        ['falloff', new THREE.Uniform(0.3)],
        ['bokeh', new THREE.Uniform(0.5)],
        ['focus', new THREE.Uniform(new THREE.Vector2(0.5, 0.5))],
        ['focusSize', new THREE.Uniform(0.2)],
        ['angle', new THREE.Uniform(0)],
        ['aspectRatio', new THREE.Uniform(1)],
      ]),
    })
  }

  setParams(p: { mode: FocusBlurMode; strength: number; falloff: number; bokeh: number; focusX: number; focusY: number; focusSize: number; angle: number; aspect: number }) {
    const u = this.uniforms
    u.get('mode')!.value = p.mode === 'tilt-shift' ? 1 : p.mode === 'radial' ? 2 : 3
    u.get('strength')!.value = p.strength
    u.get('falloff')!.value = p.falloff
    u.get('bokeh')!.value = p.bokeh
    ;(u.get('focus')!.value as THREE.Vector2).set(p.focusX, 1 - p.focusY)
    u.get('focusSize')!.value = p.focusSize
    u.get('angle')!.value = p.angle
    u.get('aspectRatio')!.value = p.aspect
  }
}

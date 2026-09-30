import { BlendFunction, Effect, EffectAttribute } from 'postprocessing'
import * as THREE from 'three'

const fragmentShader = /* glsl */ `
  uniform float amount;
  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec3 l = texture2D(inputBuffer, uv - vec2(texelSize.x, 0.0)).rgb;
    vec3 r = texture2D(inputBuffer, uv + vec2(texelSize.x, 0.0)).rgb;
    vec3 u = texture2D(inputBuffer, uv + vec2(0.0, texelSize.y)).rgb;
    vec3 d = texture2D(inputBuffer, uv - vec2(0.0, texelSize.y)).rgb;
    vec3 sharp = inputColor.rgb * (1.0 + 4.0 * amount) - (l + r + u + d) * amount;
    outputColor = vec4(clamp(sharp, 0.0, 1.0), inputColor.a);
  }
`

/** Simple unsharp-mask style sharpening. */
export class SharpenEffect extends Effect {
  constructor() {
    super('SharpenEffect', fragmentShader, {
      blendFunction: BlendFunction.SRC,
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map<string, THREE.Uniform>([['amount', new THREE.Uniform(0)]]),
    })
  }
  set amount(v: number) {
    this.uniforms.get('amount')!.value = v
  }
}

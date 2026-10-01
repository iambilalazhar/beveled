import type { EffectId, EffectsState } from '../types'

/** True when an effect has a non-neutral value and has not been hidden with its eye toggle. */
export function effectOn(fx: EffectsState, id: EffectId, value: number): boolean {
  return value > 0 && !fx.hidden?.includes(id)
}

import { Signal, EffectRef, effect, untracked } from '@angular/core';


export const triggerNonReactiveContext = <T>(
  triggerSignal: Signal<T>,
  logic: (trigger: T) => void
): EffectRef =>
  effect(() => {
    const value = triggerSignal();
    untracked(() => logic(value));
  });

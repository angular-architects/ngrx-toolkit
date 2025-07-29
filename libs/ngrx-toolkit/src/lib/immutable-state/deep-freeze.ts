/**
 * Deep freezes a state object along its properties with primitive values
 * on the first level.
 *
 * The reason for this is that the final state is a merge of all
 * root properties of all states, i.e. `withState`,....
 *
 * Since the root object will not be part of the state (shadow clone),
 * we are not freezing it.
 */

export function deepFreeze<T extends Record<string | symbol, unknown>>(
  target: T,
  // if empty all properties will be frozen
  propertyNamesToBeFrozen: (string | symbol)[],
  // also means that we are on the first level
  isRoot = true,
): void {
  const runPropertyNameCheck = propertyNamesToBeFrozen.length > 0;
  for (const key of Reflect.ownKeys(target)) {
    if (runPropertyNameCheck && !propertyNamesToBeFrozen.includes(key)) {
      continue;
    }

    const propValue = target[key];
    if (isRecordLike(propValue) && !Object.isFrozen(propValue)) {
      Object.freeze(propValue);
      deepFreeze(propValue, [], false);
    } else if (isRoot) {
      Object.defineProperty(target, key, {
        value: propValue,
        writable: false,
        configurable: false,
      });
    }
  }
}

function isRecordLike(
  target: unknown,
): target is Record<string | symbol, unknown> {
  return typeof target === 'object' && target !== null;
}

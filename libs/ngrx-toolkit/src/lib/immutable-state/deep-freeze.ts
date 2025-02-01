export function deepFreeze<T extends Record<string | symbol, unknown>>(
  target: T
): T {
  Object.freeze(target);

  for (const key of Reflect.ownKeys(target)) {
    const propValue = target[key];
    if (isRecordLike(propValue)) {
      if (!Object.isFrozen(propValue)) {
        deepFreeze(propValue);
      }
    }
  }
  return target;
}

function isRecordLike(
  target: unknown
): target is Record<string | symbol, unknown> {
  return typeof target === 'object' && target !== null;
}

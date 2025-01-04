export function throwIfNull<T>(obj: T): NonNullable<T> {
  if (obj === null || obj === undefined) {
    throw new Error('');
  }

  return obj;
}

export type Assert<T extends true> = T;
export type AssertNot<T extends false> = T;

export type IsEqual<T, U> = [T] extends [U]
  ? [U] extends [T]
    ? true
    : false
  : false;

export type Satisfies<T, U> = T extends U ? true : false;

import { Signal } from '@angular/core';
import { SIGNAL } from '@angular/core/primitives/signals';

type Rec = Record<string, any>;

type SignalPropertyNames<T extends Rec> = {
  [K in keyof T]: T[K] extends Signal<any> ? K : never;
}[keyof T];

type SignalProperties<T extends Rec, Without extends keyof T = never> = Pick<
  T,
  Exclude<SignalPropertyNames<T>, Without>
>;

type SignalPropertyValues<T extends Rec, Without extends keyof T = never> = {
  [K in keyof SignalProperties<
    T,
    Without
  >]: SignalProperties<T>[K] extends Signal<any>
    ? ReturnType<SignalProperties<T>[K]>
    : never;
};

export function getSignalValues<T extends Rec, Without extends keyof T = never>(
  signals: T,
  ...exclude: Without[]
): SignalPropertyValues<T, Without> {
  const result: Partial<SignalPropertyValues<T, Without>> = {};
  const withouts = new Set(exclude);

  const entries = Object.entries(signals)
    .filter(
      ([_, value]) =>
        typeof value === 'function' && hasOwnSymbol(value, SIGNAL)
    )  
    .filter(([key]) => !withouts.has(key as Without))  
    .map(([key, value]) => [key, value()]);

  const reduced = Object.fromEntries(entries) as SignalPropertyValues<T, Without>;
  return reduced;
}

export function hasOwnSymbol(obj: any, symbol: symbol) {
  return Object.getOwnPropertySymbols(obj).includes(symbol);
}

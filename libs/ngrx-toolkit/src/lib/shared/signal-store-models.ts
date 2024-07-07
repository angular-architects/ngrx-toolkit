/**
 * This file contains copies of types of the Signal Store which are not public.
 *
 * Since certain features depend on them, if we don't want to break
 * the encapsulation of @ngrx/signals, we decided to copy them.
 *
 * Since TypeScript is based on structural typing, we can get away with it.
 *
 * If @ngrx/signals changes its internal types, we catch them via integration
 * tests.
 *
 * Because of the "tight coupling", the toolkit doesn't have version range
 * to @ngrx/signal, but is very precise.
 */
import { Signal } from '@angular/core';
import { EntityId } from '@ngrx/signals/entities';

export type SignalStoreFeatureResult = {
  state: object;
  computed: Record<string, Signal<unknown>>;
  methods: Record<string, Function>;
};

export type EmptyFeatureResult = {
  state: {};
  computed: {};
  methods: {};
};

// withEntites models
export type EntityState<Entity> = {
  entityMap: Record<EntityId, Entity>;
  ids: EntityId[];
};

export type EntityComputed<Entity> = {
  entities: Signal<Entity[]>;
};

export type NamedEntityComputed<Entity, Collection extends string> = {
  [K in keyof EntityComputed<Entity> as `${Collection}${Capitalize<K>}`]: EntityComputed<Entity>[K];
};

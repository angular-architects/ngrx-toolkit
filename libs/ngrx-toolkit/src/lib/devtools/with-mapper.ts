import { createDevtoolsFeature, Mapper } from './devtools-feature';

/**
 * Allows you to define a function to map the state.
 *
 * It is needed for huge states, that slows down the Devtools and where
 * you don't need to see the whole state.
 *
 * @param map function which maps the state
 */
export function withMapper<State extends object>(
  map: (state: State) => Record<string, unknown>
) {
  return createDevtoolsFeature({ map: map as Mapper });
}

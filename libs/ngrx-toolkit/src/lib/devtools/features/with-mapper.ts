import { createDevtoolsFeature, Mapper } from '../internal/devtools-feature';

/**
 * Allows you to define a function to map the state.
 *
 * It is needed for huge states, that slows down the Devtools and where
 * you don't need to see the whole state or other reasons.
 *
 * Example:
 *
 * <pre>
 *   const initialState = {
 *     id: 1,
 *     email: 'john.list@host.com',
 *     name: 'John List',
 *     enteredPassword: ''
 *   }
 *
 *   const Store = signalStore(
 *     withState(initialState),
 *     withDevtools(
 *       'user',
 *       withMapper(state => ({state, { enteredPassword: '***' }}))
 *     )
 *   )
 * </pre>
 *
 * @param map function which maps the state
 */
export function withMapper<State extends object>(
  map: (state: State) => Record<string, unknown>
) {
  return createDevtoolsFeature({ map: map as Mapper });
}

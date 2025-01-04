import { StateSource } from '@ngrx/signals';
import { renameDevtoolsMethodName } from './with-devtools';

/**
 * Renames the name of a store how it appears in the Devtools.
 * @param store instance of the SignalStore
 * @param newName new name for the Devtools
 */
export function renameDevtoolsName<State extends object>(
  store: StateSource<State>,
  newName: string
): void {
  const renameMethod = (store as Record<string, (newName: string) => void>)[
    renameDevtoolsMethodName
  ];
  if (!renameMethod) {
    throw new Error("Devtools extensions haven't been added to this store.");
  }

  renameMethod(newName);
}

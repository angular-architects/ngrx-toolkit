import { Action } from '@ngrx/store';
import { Unsubscribable } from 'rxjs';


export function isUnsubscribable<F extends (...args: unknown[]) => unknown>(
  fn: F | (F & Unsubscribable)
): fn is F & Unsubscribable {
  return !!(fn as any as F & Unsubscribable)?.unsubscribe;
}

export function capitalize(str: string): string {
  return str ? str[0].toUpperCase() + str.substring(1) : str;
}

export function isActionCreator(action: any): action is Action {
  return (
    typeof action === 'function' &&
    action &&
    action.type &&
    typeof action.type === 'string'
  );
}

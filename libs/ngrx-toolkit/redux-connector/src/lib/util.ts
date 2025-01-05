import { ActionCreator } from '@ngrx/store';
import { Unsubscribable } from 'rxjs';

export function isUnsubscribable<F extends (...args: unknown[]) => unknown>(
  fn: F | (F & Unsubscribable)
): fn is F & Unsubscribable {
  return !!(fn as F & Unsubscribable)?.unsubscribe;
}

export function capitalize(str: string): string {
  return str ? str[0].toUpperCase() + str.substring(1) : str;
}

export function isActionCreator(action: unknown): action is ActionCreator {
  return Boolean(
    typeof action === 'function' &&
      action &&
      'type' in action &&
      action.type &&
      typeof action.type === 'string'
  );
}

import { EventInstance } from '@ngrx/signals/events';

export const currentActionNames = new Set<string>();

export const currentEvents = new Set<EventInstance<string, any>>();

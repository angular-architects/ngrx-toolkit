import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import { Book } from './book.model';

export const bookEvents = eventGroup({
  source: 'Book Store',
  events: {
    loadBooks: type<void>(),
    bookSelected: type<{ bookId: string }>(),
    selectionCleared: type<void>(),
    filterUpdated: type<{ filter: string }>(),
    stockToggled: type<{ bookId: string }>(),
    bookAdded: type<{ book: Book }>(),
    bookRemoved: type<{ bookId: string }>(),
  },
});

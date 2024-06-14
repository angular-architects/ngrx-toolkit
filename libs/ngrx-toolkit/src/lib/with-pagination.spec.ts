import { patchState, signalStore, type } from '@ngrx/signals';
import {
  createPageArray,
  gotoPage,
  setPageSize,
  withPagination,
} from './with-pagination';
import { setAllEntities, withEntities } from '@ngrx/signals/entities';

type Book = { id: number; title: string; author: string };
const generateBooks = (count = 10) => {
  const books = [] as Book[];
  for (let i = 1; i <= count; i++) {
    books.push({ id: i, title: `Book ${i}`, author: `Author ${i}` });
  }
  return books;
};

describe('withPagination', () => {
  it('should use and update a pagination', () => {
    const Store = signalStore(
      withEntities({ entity: type<Book>() }),
      withPagination()
    );

    const store = new Store();

    patchState(store, setAllEntities(generateBooks(55)));
    expect(store.currentPage()).toBe(0);
    expect(store.pageCount()).toBe(6);
  }),
    it('should use and update a pagination with collection', () => {
      const Store = signalStore(
        withEntities({ entity: type<Book>(), collection: 'books' }),
        withPagination({ entity: type<Book>(), collection: 'books' })
      );

      const store = new Store();

      patchState(
        store,
        setAllEntities(generateBooks(55), { collection: 'books' })
      );

      patchState(store, gotoPage(5, { collection: 'books' }));
      expect(store.booksCurrentPage()).toBe(5);
      expect(store.selectedPageBooksEntities().length).toBe(5);
      expect(store.booksPageCount()).toBe(6);
    }),
    it('should react on enitiy changes', () => {
      const Store = signalStore(
        withEntities({ entity: type<Book>() }),
        withPagination()
      );

      const store = new Store();

      patchState(store, setAllEntities(generateBooks(100)));

      expect(store.pageCount()).toBe(10);

      patchState(store, setAllEntities(generateBooks(20)));

      expect(store.pageCount()).toBe(2);

      patchState(store, setPageSize(5));

      expect(store.pageCount()).toBe(4);
    }),
    describe('internal pageNavigationArray', () => {
      it('should return an array of page numbers', () => {
        const pages = createPageArray(8, 10, 500, 7);
        expect(pages).toEqual([
          { label: 5, value: 5 },
          { label: '...', value: 6 },
          { label: 7, value: 7 },
          { label: 8, value: 8 },
          { label: 9, value: 9 },
          { label: '...', value: 10 },
          { label: 50, value: 50 },
        ]);
      });
    });
});

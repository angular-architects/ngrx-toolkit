/** With pagination comes in two flavors the first one is local pagination or in memory pagination. For example we have 2000 items which we want
 * to display in a table and the response payload is small enough to be stored in the memory. But we can not display all 2000 items at once
 * so we need to paginate the data. The second flavor is server side pagination where the response payload is too large to be stored in the memory
 * and we need to fetch the data from the server in chunks. In the second case we 'could' also cache the data in the memory but that could lead to
 * other problems like memory leaks and stale data. So we will not cache the data in the memory in the second case.
 * This feature implements the local pagination.
 */

import { Signal, computed } from '@angular/core';
import {
  SignalStoreFeature,
  StateSignal,
  patchState,
  signalStoreFeature,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { capitalize } from './with-data-service';
import {
  EntityComputed,
  EntityState,
  NamedEntityComputed,
} from './shared/signal-store-models';

// This is a virtual page which is can be used to create a pagination control
export type Page = { label: string | number; value: number };

export type NamedPaginationServiceState<E, Collection extends string> = {
  [K in Collection as `selectedPage${Capitalize<K>}Entities`]: Array<E>;
} & {
  [K in Collection as `${Lowercase<K>}CurrentPage`]: number;
} & {
  [K in Collection as `${Lowercase<K>}PageSize`]: number;
} & {
  [K in Collection as `${Lowercase<K>}TotalCount`]: number;
} & {
  [K in Collection as `${Lowercase<K>}PageCount`]: number;
} & {
  [K in Collection as `${Lowercase<K>}PageNavigationArray`]: number;
} & {
  [K in Collection as `${Lowercase<K>}PageNavigationArrayMax`]: number;
};

export type NamedPaginationServiceSignals<E, Collection extends string> = {
  [K in Collection as `selectedPage${Capitalize<K>}Entities`]: Signal<E[]>;
} & {
  [K in Collection as `${Lowercase<K>}CurrentPage`]: Signal<number>;
} & {
  [K in Collection as `${Lowercase<K>}PageSize`]: Signal<number>;
} & {
  [K in Collection as `${Lowercase<K>}TotalCount`]: Signal<number>;
} & {
  [K in Collection as `${Lowercase<K>}PageCount`]: Signal<number>;
} & {
  [K in Collection as `${Lowercase<K>}PageNavigationArray`]: Signal<Page[]>;
} & {
  [K in Collection as `${Lowercase<K>}PageNavigationArrayMax`]: Signal<number>;
} & {
  [K in Collection as `hasNext${Capitalize<K>}Page`]: Signal<boolean>;
} & {
  [K in Collection as `hasPrevious${Capitalize<K>}Page`]: Signal<boolean>;
};

export type NamedPaginationServiceMethods<Collection extends string> = {
  [K in Collection as `set${Capitalize<K>}PageSize`]: (size: number) => void;
} & {
  [K in Collection as `next${Capitalize<K>}Page`]: () => void;
} & {
  [K in Collection as `previous${Capitalize<K>}Page`]: () => void;
} & {
  [K in Collection as `last${Capitalize<K>}Page`]: () => void;
} & {
  [K in Collection as `first${Capitalize<K>}Page`]: () => void;
} & {
  [K in Collection as `goto${Capitalize<K>}Page`]: (page: number) => void;
};

export type PaginationServiceState<E> = {
  selectedPageEntities: Array<E>;
  currentPage: number;
  pageSize: number;
  totalCount: number;
  pageCount: number;
  pageNavigationArray: Page[];
  pageNavigationArrayMax: number;
};

export type PaginationServiceSignals<E> = {
  selectedPageEntities: Signal<E[]>;
  currentPage: Signal<number>;
  pageSize: Signal<number>;
  totalCount: Signal<number>;
  pageCount: Signal<number>;
  pageNavigationArray: Signal<Page[]>;
  pageNavigationArrayMax: Signal<number>;
  hasNextPage: Signal<boolean>;
  hasPreviousPage: Signal<boolean>;
};

export type PaginationServiceMethods = {
  setPageSize: (size: number) => void;
  nextPageKey: () => void;
  previousPage: () => void;
  lastPage: () => void;
  firstPage: () => void;
  gotoPage: (page: number) => void;
};

export type SetPaginationState<
  E,
  Collection extends string | undefined
> = Collection extends string
  ? NamedPaginationServiceState<E, Collection>
  : PaginationServiceState<E>;

export function withPagination<E, Collection extends string>(options: {
  entity: E;
  collection: Collection;
}): SignalStoreFeature<
  {
    state: {};
    computed: NamedEntityComputed<E, Collection>;
    methods: {};
  },
  {
    state: NamedPaginationServiceState<E, Collection>;
    computed: NamedPaginationServiceSignals<E, Collection>;
    methods: NamedPaginationServiceMethods<Collection>;
  }
>;

export function withPagination<E>(): SignalStoreFeature<
  {
    state: EntityState<E>;
    computed: EntityComputed<E>;
    methods: {};
  },
  {
    state: PaginationServiceState<E>;
    computed: PaginationServiceSignals<E>;
    methods: PaginationServiceMethods;
  }
>;

export function withPagination<E, Collection extends string>(options?: {
  entity: E;
  collection: Collection;
}): SignalStoreFeature<any, any> {
  const {
    pageKey,
    pageSizeKey,
    entitiesKey,
    selectedPageEntitiesKey,
    totalCountKey,
    pageCountKey,
    pageNavigationArrayMaxKey,
    pageNavigationArrayKey,
    setPageSizeKey,
    nextPageKey,
    previousPageKey,
    lastPageKey,
    firstPageKey,
    gotoPageKey,
    hasNextPageKey,
    hasPreviousPageKey,
  } = createPaginationKeys<Collection>(options);

  return signalStoreFeature(
    withState({
      [pageKey]: 0,
      [pageSizeKey]: 10,
      [pageNavigationArrayMaxKey]: 7,
    }),
    withComputed((store: Record<string, unknown>) => {
      const entities = store[entitiesKey] as Signal<E[]>;
      const page = store[pageKey] as Signal<number>;
      const pageSize = store[pageSizeKey] as Signal<number>;
      const pageNavigationArrayMax = store[
        pageNavigationArrayMaxKey
      ] as Signal<number>;

      return {
        // The derived enitites which are displayed on the current page
        [selectedPageEntitiesKey]: computed<E[]>(() => {
          const pageSizeValue = pageSize();
          const pageValue = page();

          return entities().slice(
            pageValue * pageSizeValue,
            (pageValue + 1) * pageSizeValue
          ) as E[];
        }),
        [totalCountKey]: computed(() => entities().length),
        [pageCountKey]: computed(() => {
          const totalCountValue = entities().length;
          const pageSizeValue = pageSize();

          if (totalCountValue === 0) {
            return 0;
          }

          return Math.ceil(totalCountValue / pageSizeValue);
        }),
        [pageNavigationArrayKey]: computed(() =>
          createPageArray(
            page(),
            pageSize(),
            entities().length,
            pageNavigationArrayMax()
          )
        ),

        [hasNextPageKey]: computed(() => {
          return page() < pageSize();
        }),

        [hasPreviousPageKey]: computed(() => {
          return page() > 1;
        }),
      };
    }),
    withMethods((store: Record<string, unknown> & StateSignal<object>) => {
      return {
        [setPageSizeKey]: (size: number) => {
          patchState(store, setPageSize(size, options));
        },
        [nextPageKey]: () => {
          patchState(store, nextPage(options));
        },

        [previousPageKey]: () => {
          patchState(store, previousPage(options));
        },

        [lastPageKey]: () => {
          const lastPage = (store[pageCountKey] as Signal<number>)();
          if (lastPage === 0) return;
          patchState(store, gotoPage(lastPage - 1, options));
        },

        [firstPageKey]: () => {
          patchState(store, firstPage());
        },

        [gotoPageKey]: (page: number) => {
          patchState(store, gotoPage(page, options));
        },
      };
    })
  );
}

export function gotoPage<E, Collection extends string>(
  page: number,
  options?: {
    collection: Collection;
  }
): Partial<SetPaginationState<E, Collection>> {
  const { pageKey } = createPaginationKeys<Collection>(options);

  return {
    [pageKey]: page,
  } as Partial<SetPaginationState<E, Collection>>;
}

export function setPageSize<E, Collection extends string>(
  pageSize: number,
  options?: {
    collection: Collection;
  }
): Partial<SetPaginationState<E, Collection>> {
  const { pageSizeKey } = createPaginationKeys<Collection>(options);

  return {
    [pageSizeKey]: pageSize,
  } as Partial<SetPaginationState<E, Collection>>;
}

export function nextPage<E, Collection extends string>(options?: {
  collection: Collection;
}): Partial<SetPaginationState<E, Collection>> {
  const { pageKey } = createPaginationKeys<Collection>(options);

  return {
    [pageKey]: (currentPage: number) => currentPage + 1,
  } as Partial<SetPaginationState<E, Collection>>;
}

export function previousPage<E, Collection extends string>(options?: {
  collection: Collection;
}): Partial<SetPaginationState<E, Collection>> {
  const { pageKey } = createPaginationKeys<Collection>(options);

  return {
    [pageKey]: (currentPage: number) => Math.max(currentPage - 1, 1),
  } as Partial<SetPaginationState<E, Collection>>;
}

export function firstPage<E, Collection extends string>(options?: {
  collection: Collection;
}): Partial<SetPaginationState<E, Collection>> {
  const { pageKey } = createPaginationKeys<Collection>(options);

  return {
    [pageKey]: 1,
  } as Partial<SetPaginationState<E, Collection>>;
}

export function setMaxPageNavigationArrayItems<E, Collection extends string>(
  maxPageNavigationArrayItems: number,
  options?: {
    collection: Collection;
  }
): Partial<SetPaginationState<E, Collection>> {
  const { pageNavigationArrayMaxKey } =
    createPaginationKeys<Collection>(options);

  return {
    [pageNavigationArrayMaxKey]: maxPageNavigationArrayItems,
  } as Partial<SetPaginationState<E, Collection>>;
}

function createPaginationKeys<Collection extends string>(
  options: { collection: Collection } | undefined
) {
  const entitiesKey = options?.collection
    ? `${options.collection}Entities`
    : 'entities';

  const selectedPageEntitiesKey = options?.collection
    ? `selectedPage${capitalize(options?.collection)}Entities`
    : 'selectedPageEntities';
  const pageKey = options?.collection
    ? `${options.collection}CurrentPage`
    : 'currentPage';
  const pageSizeKey = options?.collection
    ? `${options.collection}PageSize`
    : 'pageSize';
  const totalCountKey = options?.collection
    ? `${options.collection}TotalCount`
    : 'totalCount';
  const pageCountKey = options?.collection
    ? `${options.collection}PageCount`
    : 'pageCount';
  const pageNavigationArrayMaxKey = options?.collection
    ? `${options.collection}PageNavigationArrayMax`
    : 'pageNavigationArrayMax';
  const pageNavigationArrayKey = options?.collection
    ? `${options.collection}PageNavigationArray`
    : 'pageNavigationArray';

  const setPageSizeKey = options?.collection
    ? `set${capitalize(options.collection)}PageSize`
    : 'setPageSize';

  const nextPageKey = options?.collection
    ? `next${capitalize(options.collection)}Page`
    : 'nextPage';

  const previousPageKey = options?.collection
    ? `previous${capitalize(options.collection)}Page`
    : 'previousPage';

  const lastPageKey = options?.collection
    ? `last${capitalize(options.collection)}Page`
    : 'lastPage';

  const firstPageKey = options?.collection
    ? `first${capitalize(options.collection)}Page`
    : 'firstPage';

  const gotoPageKey = options?.collection
    ? `goto${capitalize(options.collection)}Page`
    : 'gotoPage';

  const hasNextPageKey = options?.collection
    ? `hasNext${capitalize(options.collection)}Page`
    : 'hasNextPage';

  const hasPreviousPageKey = options?.collection
    ? `hasPrevious${capitalize(options.collection)}Page`
    : 'hasPreviousPage';

  return {
    pageKey,
    pageSizeKey,
    entitiesKey,
    selectedPageEntitiesKey,
    totalCountKey,
    pageCountKey,
    pageNavigationArrayKey,
    pageNavigationArrayMaxKey,
    setPageSizeKey,
    nextPageKey,
    previousPageKey,
    lastPageKey,
    firstPageKey,
    gotoPageKey,
    hasNextPageKey,
    hasPreviousPageKey,
  };
}

export function createPageArray(
  currentPage: number,
  itemsPerPage: number,
  totalItems: number,
  paginationRange: number
): Page[] {
  // Convert paginationRange to number in case it's a string
  paginationRange = +paginationRange;

  // Calculate total number of pages
  const totalPages = Math.max(Math.ceil(totalItems / itemsPerPage), 1);
  const halfWay = Math.ceil(paginationRange / 2);

  const isStart = currentPage <= halfWay;
  const isEnd = totalPages - halfWay < currentPage;
  const isMiddle = !isStart && !isEnd;

  const ellipsesNeeded = paginationRange < totalPages;
  const pages: Page[] = [];

  for (let i = 1; i <= totalPages && i <= paginationRange; i++) {
    let pageNumber = i;

    if (i === paginationRange) {
      pageNumber = totalPages;
    } else if (ellipsesNeeded) {
      if (isEnd) {
        pageNumber = totalPages - paginationRange + i;
      } else if (isMiddle) {
        pageNumber = currentPage - halfWay + i;
      }
    }

    const openingEllipsesNeeded = i === 2 && (isMiddle || isEnd);
    const closingEllipsesNeeded =
      i === paginationRange - 1 && (isMiddle || isStart);

    const label =
      ellipsesNeeded && (openingEllipsesNeeded || closingEllipsesNeeded)
        ? '...'
        : pageNumber;

    pages.push({ label, value: pageNumber });
  }

  return pages;
}

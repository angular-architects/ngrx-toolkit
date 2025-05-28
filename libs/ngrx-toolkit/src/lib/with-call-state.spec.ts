import { patchState, signalStore } from '@ngrx/signals';
import { setLoaded, setLoading, withCallState } from './with-call-state';

describe('withCallState', () => {
  it('should use and update a callState', () => {
    const DataStore = signalStore({ protectedState: false }, withCallState());
    const dataStore = new DataStore();

    patchState(dataStore, setLoading());

    expect(dataStore.callState()).toBe('loading');
    expect(dataStore.loading()).toBe(true);

    dataStore.setLoaded();

    expect(dataStore.callState()).toBe('loaded');
    expect(dataStore.loaded()).toBe(true);
  });

  it('should use the callState for a collection', () => {
    const DataStore = signalStore(
      { protectedState: false },
      withCallState({ collection: 'entities' })
    );
    const dataStore = new DataStore();

    patchState(dataStore, setLoaded('entities'));

    expect(dataStore.entitiesCallState()).toBe('loaded');
    expect(dataStore.entitiesLoaded()).toBe(true);

    dataStore.entitiesSetLoading();

    expect(dataStore.entitiesCallState()).toBe('loading');
    expect(dataStore.entitiesLoading()).toBe(true);
  });

  it('should use the callState for multiple collections with an array', () => {
    const DataStore = signalStore(
      { protectedState: false },
      withCallState({ collections: ['entities', 'products'] })
    );
    const dataStore = new DataStore();

    patchState(dataStore, setLoaded('entities'), setLoaded('products'));

    expect(dataStore.entitiesCallState()).toBe('loaded');
    expect(dataStore.productsCallState()).toBe('loaded');
    expect(dataStore.entitiesLoaded()).toBe(true);
    expect(dataStore.productsLoaded()).toBe(true);

    dataStore.entitiesSetLoading();
    dataStore.productsSetLoading();

    expect(dataStore.entitiesCallState()).toBe('loading');
    expect(dataStore.productsCallState()).toBe('loading');
  });
});

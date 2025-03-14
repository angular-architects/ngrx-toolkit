import { patchState, signalStore } from '@ngrx/signals';
import { setLoaded, setLoading, setInitial, withCallState } from './with-call-state';

describe('withCallState', () => {
  it('should use and update a callState', () => {
    const DataStore = signalStore({ protectedState: false }, withCallState());
    const dataStore = new DataStore();

    patchState(dataStore, setLoading());

    expect(dataStore.callState()).toBe('loading');
    expect(dataStore.loading()).toBe(true);
  });

  it('should reinitialize a callState', () => {
    const DataStore = signalStore({ protectedState: false }, withCallState());
    const dataStore = new DataStore();

    patchState(dataStore, setLoading());

    patchState(dataStore, setInitial());

    expect(dataStore.callState()).toBe('init');
    expect(dataStore.initial()).toBe(true);
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
  });
});

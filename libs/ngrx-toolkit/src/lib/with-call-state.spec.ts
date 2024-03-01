import { patchState, signalStore } from '@ngrx/signals';
import { setLoaded, setLoading, withCallState } from 'ngrx-toolkit';

describe('withCallState', () => {
  it('should use and update a callState', () => {
    const DataStore = signalStore(withCallState());
    const dataStore = new DataStore();

    patchState(dataStore, setLoading());

    expect(dataStore.callState()).toBe('loading');
    expect(dataStore.loading()).toBe(true);
  });

  it('should use the callState for a collection', () => {
    const DataStore = signalStore(withCallState({ collection: 'entities' }));
    const dataStore = new DataStore();

    patchState(dataStore, setLoaded('entities'));

    expect(dataStore.entitiesCallState()).toBe('loaded');
    expect(dataStore.entitiesLoaded()).toBe(true);
  });
});

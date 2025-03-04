// todo
describe('true', () => {
  it('should', () => {
    expect(true).toBeTruthy();
  });
});

// import { getState, patchState, signalStore, withState } from '@ngrx/signals';
// import { TestBed } from '@angular/core/testing';
// import * as flushPromises from 'flush-promises';
// import { withIndexeddb } from '../features/with-indexeddb';
// import { withLocalStorage } from '../features/with-local-storage';
// import { withStorageSync } from '../with-storage-sync';
// import { StorageServiceFactory } from '../internal/models';
//
// interface StateObject {
//   foo: string;
//   age: number;
// }
//
// const initialState: StateObject = {
//   foo: 'bar',
//   age: 18,
// };
// const key = 'FooBar';
//
// const storages: { name: string; adapter: StorageServiceFactory }[] = [
//   {
//     name: 'localStorage',
//     adapter: withLocalStorage(),
//   },
//   {
//     name: 'indexeddb',
//     adapter: withIndexeddb(),
//   },
// ];
//
// describe('withStorageSync', () => {
//   it('adds methods for storage access to the store', async () => {
//     await TestBed.runInInjectionContext(async () => {
//       const Store = signalStore(withStorageSync({ key }));
//       const store = new Store();
//
//       await flushPromises();
//
//       expect(Object.keys(store)).toEqual([
//         'clearStorage',
//         'readFromStorage',
//         'writeToStorage',
//       ]);
//     });
//   });
//
//   storages.forEach(({ name, adapter }) => {
//     it(`[${name}] offers manual sync using provided methods`, async () => {
//       const storageService = new adapter();
//
//       await storageService.setItem(
//         key,
//         JSON.stringify({
//           foo: 'baz',
//           age: 99,
//         } as StateObject)
//       );
//
//       await TestBed.runInInjectionContext(async () => {
//         const Store = signalStore(
//           { protectedState: false },
//           withStorageSync({ key, autoSync: false }, adapter)
//         );
//         const store = new Store();
//
//         await flushPromises();
//
//         expect(getState(store)).toEqual({});
//
//         await store.readFromStorage();
//
//         expect(getState(store)).toEqual({
//           foo: 'baz',
//           age: 99,
//         });
//
//         patchState(store, { ...initialState });
//         TestBed.flushEffects();
//
//         let storeItem = JSON.parse((await storageService.getItem(key)) || '{}');
//         expect(storeItem).toEqual({
//           foo: 'baz',
//           age: 99,
//         });
//
//         await store.writeToStorage();
//         storeItem = JSON.parse((await storageService.getItem(key)) || '{}');
//         expect(storeItem).toEqual({
//           ...initialState,
//         });
//
//         await store.clearStorage();
//         storeItem = await storageService.getItem(key);
//         expect(storeItem).toEqual(null);
//       });
//     });
//
//     describe('autoSync', () => {
//       const storageService = new adapter();
//
//       beforeEach(async () => {
//         // prefill storage
//         await storageService.setItem(
//           key,
//           JSON.stringify({
//             foo: 'baz',
//             age: 99,
//           } as StateObject)
//         );
//       });
//
//       afterEach(async () => {
//         await storageService.clear(key);
//       });
//
//       it(`[${name}] inits from storage and write to storage on changes when set to true`, async () => {
//         await TestBed.runInInjectionContext(async () => {
//           const Store = signalStore(
//             { protectedState: false },
//             withStorageSync(key, adapter)
//           );
//           const store = new Store();
//
//           // asynchronous in effect
//           await flushPromises();
//           //
//           // await storageService.getItem function
//           await flushPromises();
//
//           expect(getState(store)).toEqual({
//             foo: 'baz',
//             age: 99,
//           });
//
//           patchState(store, { ...initialState });
//           TestBed.flushEffects();
//
//           expect(getState(store)).toEqual({
//             ...initialState,
//           });
//           const storeItem = JSON.parse(
//             (await storageService.getItem(key)) || '{}'
//           );
//           expect(storeItem).toEqual({
//             ...initialState,
//           });
//         });
//       });
//
//       it('does not init from storage and does write to storage on changes when set to `false`', async () => {
//         await TestBed.runInInjectionContext(async () => {
//           const Store = signalStore(
//             { protectedState: false },
//             withStorageSync({ key, autoSync: false }, adapter)
//           );
//           const store = new Store();
//
//           await flushPromises();
//
//           expect(getState(store)).toEqual({});
//
//           patchState(store, { ...initialState });
//
//           const storeItem = JSON.parse(
//             (await storageService.getItem(key)) || '{}'
//           );
//           expect(storeItem).toEqual({
//             foo: 'baz',
//             age: 99,
//           });
//         });
//       });
//     });
//
//     describe('select', () => {
//       const storageService = new adapter();
//
//       afterEach(async () => {
//         await storageService.clear(key);
//       });
//
//       it('syncs the whole state by default', async () => {
//         await TestBed.runInInjectionContext(async () => {
//           const Store = signalStore(
//             { protectedState: false },
//             withStorageSync(key, adapter)
//           );
//           const store = new Store();
//
//           await flushPromises();
//
//           await flushPromises();
//
//           patchState(store, { ...initialState });
//
//           TestBed.flushEffects();
//
//           const storeItem = JSON.parse(
//             (await storageService.getItem(key)) || '{}'
//           );
//           expect(storeItem).toEqual({
//             ...initialState,
//           });
//         });
//       });
//
//       it('syncs selected slices when specified', async () => {
//         await TestBed.runInInjectionContext(async () => {
//           const Store = signalStore(
//             { protectedState: false },
//             withState(initialState),
//             withStorageSync({ key, select: ({ foo }) => ({ foo }) }, adapter)
//           );
//           const store = new Store();
//
//           await flushPromises();
//
//           await flushPromises();
//
//           patchState(store, { foo: 'baz' });
//           TestBed.flushEffects();
//
//           const storeItem = JSON.parse(
//             (await storageService.getItem(key)) || '{}'
//           );
//           expect(storeItem).toEqual({
//             foo: 'baz',
//           });
//         });
//       });
//     });
//
//     describe('parse/stringify', () => {
//       const storageService = new adapter();
//
//       afterEach(async () => {
//         await storageService.clear(key);
//       });
//
//       it('uses custom parsing/stringification when specified', async () => {
//         const parse = (stateString: string) => {
//           const [foo, age] = stateString.split('_');
//           return {
//             foo,
//             age: +age,
//           };
//         };
//
//         await TestBed.runInInjectionContext(async () => {
//           const Store = signalStore(
//             { protectedState: false },
//             withState(initialState),
//             withStorageSync(
//               {
//                 key,
//                 parse,
//                 stringify: (state) => `${state.foo}_${state.age}`,
//               },
//               adapter
//             )
//           );
//           const store = new Store();
//
//           await flushPromises();
//
//           await flushPromises();
//
//           patchState(store, { foo: 'baz' });
//           TestBed.flushEffects();
//
//           const storeItem = parse((await storageService.getItem(key)) || '');
//
//           expect(storeItem).toEqual({
//             ...initialState,
//             foo: 'baz',
//           });
//         });
//       });
//     });
//   });
// });

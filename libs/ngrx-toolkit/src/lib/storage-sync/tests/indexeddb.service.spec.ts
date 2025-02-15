import { IndexedDBService, keyPath } from '../internal/indexeddb.service';

describe('IndexedDBService', () => {
  const storeNameAndDbName = 'users';

  const sampleData = JSON.stringify({
    foo: 'bar',
    users: [
      { name: 'John', age: 30, isAdmin: true },
      { name: 'Jane', age: 25, isAdmin: false },
    ],
  });

  let indexedDBService: IndexedDBService;

  beforeEach(() => {
    indexedDBService = new IndexedDBService();
  });

  it('It should be possible to write data using write() and then read the data using read()', async (): Promise<void> => {
    const expectedData = { [keyPath]: keyPath, value: sampleData };

    await indexedDBService.setItem(storeNameAndDbName, sampleData);

    const receivedData = await indexedDBService.getItem(storeNameAndDbName);

    expect(receivedData).toEqual(expectedData.value);
  });

  it('It should be possible to delete data using clear()', async (): Promise<void> => {
    await indexedDBService.setItem(storeNameAndDbName, sampleData);

    await indexedDBService.clear(storeNameAndDbName);

    const receivedData = await indexedDBService.getItem(storeNameAndDbName);

    expect(receivedData).toEqual(null);
  });

  it('When there is no data, read() should return null', async (): Promise<void> => {
    const receivedData = await indexedDBService.getItem(storeNameAndDbName);

    expect(receivedData).toEqual(null);
  });

  it('write() should handle null data', async (): Promise<void> => {
    await indexedDBService.setItem(storeNameAndDbName, JSON.stringify(null));

    const receivedData = await indexedDBService.getItem(storeNameAndDbName);

    expect(receivedData).toEqual('null');
  });

  it('write() should handle empty object data', async (): Promise<void> => {
    const emptyData = JSON.stringify({});
    const expectedData = { [keyPath]: keyPath, value: emptyData };

    await indexedDBService.setItem(storeNameAndDbName, emptyData);

    const receivedData = await indexedDBService.getItem(storeNameAndDbName);

    expect(receivedData).toEqual(expectedData.value);
  });

  it('write() should handle large data objects', async (): Promise<void> => {
    const largeData = JSON.stringify({ foo: 'a'.repeat(100000) });
    const expectedData = { [keyPath]: keyPath, value: largeData };

    await indexedDBService.setItem(storeNameAndDbName, largeData);

    const receivedData = await indexedDBService.getItem(storeNameAndDbName);

    expect(receivedData).toEqual(expectedData.value);
  });

  it('write() should handle special characters in data', async (): Promise<void> => {
    const specialCharData = JSON.stringify({ foo: 'bar!@#$%^&*()_+{}:"<>?' });
    const expectedData = { [keyPath]: keyPath, value: specialCharData };

    await indexedDBService.setItem(storeNameAndDbName, specialCharData);

    const receivedData = await indexedDBService.getItem(storeNameAndDbName);

    expect(receivedData).toEqual(expectedData.value);
  });
});

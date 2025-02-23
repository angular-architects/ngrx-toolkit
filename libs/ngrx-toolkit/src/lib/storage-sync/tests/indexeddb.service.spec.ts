import { IndexedDBService } from '../internal/indexeddb.service';

describe('IndexedDBService', () => {
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
    const key = 'users';

    const expectedData = sampleData;

    await indexedDBService.setItem(key, sampleData);

    const receivedData = await indexedDBService.getItem(key);

    expect(receivedData).toEqual(expectedData);
  });

  it('It should be possible to delete data using clear()', async (): Promise<void> => {
    const key = 'sample';

    await indexedDBService.setItem(key, sampleData);

    await indexedDBService.clear(key);

    const receivedData = await indexedDBService.getItem(key);

    expect(receivedData).toEqual(null);
  });

  it('When there is no data, read() should return null', async (): Promise<void> => {
    const key = 'nullData';

    const receivedData = await indexedDBService.getItem(key);

    expect(receivedData).toEqual(null);
  });

  it('write() should handle null data', async (): Promise<void> => {
    const key = 'nullData';

    await indexedDBService.setItem(key, JSON.stringify(null));

    const receivedData = await indexedDBService.getItem(key);

    expect(receivedData).toEqual('null');
  });

  it('write() should handle empty object data', async (): Promise<void> => {
    const key = 'emptyData';

    const emptyData = JSON.stringify({});
    const expectedData = emptyData;

    await indexedDBService.setItem(key, emptyData);

    const receivedData = await indexedDBService.getItem(key);

    expect(receivedData).toEqual(expectedData);
  });

  it('write() should handle large data objects', async (): Promise<void> => {
    const key = 'largeData';

    const largeData = JSON.stringify({ foo: 'a'.repeat(100000) });
    const expectedData = largeData;

    await indexedDBService.setItem(key, largeData);

    const receivedData = await indexedDBService.getItem(key);

    expect(receivedData).toEqual(expectedData);
  });

  it('write() should handle special characters in data', async (): Promise<void> => {
    const key = 'specialCharData';

    const specialCharData = JSON.stringify({ foo: 'bar!@#$%^&*()_+{}:"<>?' });
    const expectedData = specialCharData;

    await indexedDBService.setItem(key, specialCharData);

    const receivedData = await indexedDBService.getItem(key);

    expect(receivedData).toEqual(expectedData);
  });
});

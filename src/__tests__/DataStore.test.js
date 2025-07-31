import { jest, describe, it, expect } from '@jest/globals';

// Mock Firestore
const mockSet = jest.fn().mockResolvedValue({});
const mockUpdate = jest.fn().mockResolvedValue({});
const mockGet = jest.fn();
const mockCollection = jest.fn();
const mockDoc = jest.fn();
const mockData = jest.fn();

await jest.unstable_mockModule('../firebase', () => ({
  db: {
    collection: mockCollection
  }
}));

const { DataStore } = await import('../DataStore');

describe('DataStore', () => {
  let store;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockCollection.mockReturnValue({ 
      doc: mockDoc,
      get: jest.fn().mockResolvedValue({
        docs: [
          { data: () => ({ id: '1', name: 'Item 1' }) },
          { data: () => ({ id: '2', name: 'Item 2' }) }
        ]
      })
    });
    
    mockDoc.mockReturnValue({
      set: mockSet,
      update: mockUpdate,
      get: mockGet
    });
    
    mockGet.mockResolvedValue({
      exists: true,
      data: mockData
    });
    
    mockData.mockReturnValue({ id: '1', name: 'Test Item' });
    
    store = new DataStore();
  });

  it('save method calls Firestore set', async () => {
    const data = { name: 'New Item' };
    await store.save('items', 'item1', data);
    
    expect(mockCollection).toHaveBeenCalledWith('items');
    expect(mockDoc).toHaveBeenCalledWith('item1');
    expect(mockSet).toHaveBeenCalledWith(expect.any(Object));
  });

  it('update method calls Firestore update', async () => {
    const data = { name: 'Updated Item' };
    await store.update('items', 'item1', data);
    
    expect(mockCollection).toHaveBeenCalledWith('items');
    expect(mockDoc).toHaveBeenCalledWith('item1');
    expect(mockUpdate).toHaveBeenCalledWith(data);
  });

  it('get method returns document data when it exists', async () => {
    const result = await store.get('items', 'item1');
    
    expect(mockCollection).toHaveBeenCalledWith('items');
    expect(mockDoc).toHaveBeenCalledWith('item1');
    expect(result).toEqual({ id: '1', name: 'Test Item' });
  });

  it('get method returns null when document does not exist', async () => {
    mockGet.mockResolvedValue({
      exists: false
    });
    
    const result = await store.get('items', 'missing');
    expect(result).toBeNull();
  });

  it('getAll method returns all documents', async () => {
    const results = await store.getAll('items');
    
    expect(mockCollection).toHaveBeenCalledWith('items');
    expect(results).toHaveLength(2);
    expect(results[0].name).toBe('Item 1');
    expect(results[1].name).toBe('Item 2');
  });
});
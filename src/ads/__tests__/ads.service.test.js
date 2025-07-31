import { jest, describe, it, expect } from '@jest/globals';

// Mock the container module before importing adsService
const mockGet = jest.fn();
const mockSave = jest.fn();
const mockGetAll = jest.fn().mockResolvedValue([
  { 
    url: 'https://example.com/ad1',
    title: 'Test Ad 1', 
    views: [
      { timestamp: Date.now() - 86400000, count: 10 },
      { timestamp: Date.now(), count: 25 }
    ],
    timestamp: Date.now(),
    nativeId: 'ad1'
  }
]);

// Mock fetchAdViews to return test data
const mockFetchAdViews = jest.fn().mockResolvedValue({
  views: 30,
  title: 'Updated Ad Title',
  timestamp: Date.now(),
  nativeId: 'ad123'
});

await jest.unstable_mockModule('../../container', () => ({
  container: {
    adStore: {
      get: mockGet,
      save: mockSave,
      getAll: mockGetAll
    }
  }
}));

await jest.unstable_mockModule('../../parser', () => ({
  fetchAdViews: mockFetchAdViews
}));

const adsService = await import('../ads.service');

describe('adsService', () => {
  it('getAllAds returns ads from store', async () => {
    const ads = await adsService.getAllAds();
    
    expect(mockGetAll).toHaveBeenCalledWith('ads');
    expect(ads).toHaveLength(1);
    expect(ads[0].title).toBe('Test Ad 1');
  });

  it('createAd saves a new ad', async () => {
    const url = 'https://example.com/new-ad';
    mockGet.mockResolvedValue(null);
    
    await adsService.createAd(url);
    
    expect(mockGet).toHaveBeenCalledWith('ads', expect.any(String));
    expect(mockSave).toHaveBeenCalledWith('ads', expect.any(String), expect.objectContaining({
      url: url,
      title: '',
      views: [],
      timestamp: expect.any(Number)
    }));
  });

  it('createAd throws error if ad exists', async () => {
    const url = 'https://example.com/existing-ad';
    mockGet.mockResolvedValue({ url });
    
    await expect(adsService.createAd(url)).rejects.toThrow('Ad with this URL already exists');
  });

  it('updateViewsArray adds new view when array is empty', () => {
    const newView = { timestamp: Date.now(), count: 10 };
    const result = adsService.updateViewsArray([], newView);
    
    expect(result).toEqual([newView]);
  });

  it('updateViewsArray replaces view on same day', () => {
    const timestamp = new Date('2023-05-15').getTime();
    const oldViews = [{ timestamp, count: 5 }];
    const newView = { timestamp, count: 10 };
    
    const result = adsService.updateViewsArray(oldViews, newView);
    
    expect(result).toEqual([newView]);
  });

  it('parseAllAds fetches and updates all ads', async () => {
    await adsService.parseAllAds();
    
    expect(mockFetchAdViews).toHaveBeenCalledWith('https://example.com/ad1');
    expect(mockSave).toHaveBeenCalled();
  });
});
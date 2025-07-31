import { jest, describe, it, expect } from '@jest/globals';

// Mock the container module before importing reportService
const mockGetAll = jest.fn().mockResolvedValue([
  {
    title: 'Advert 1',
    views: [
      { timestamp: Date.now(), count: 5 },  // first view
      { timestamp: Date.now(), count: 12 }  // last view (used for totalViews)
    ]
  }
]);

// Use unstable_mockModule instead of mock for ESM
await jest.unstable_mockModule('../../container', () => ({
  container: {
    adStore: {
      getAll: mockGetAll
    }
  }
}));

const reportService = await import('../report.service');

describe('reportService', () => {
  it('getDailyReport returns correct report', async () => {
    const report = await reportService.getDailyReport();
    
    // Check properties exist
    expect(report[0]).toHaveProperty('title');
    expect(report[0]).toHaveProperty('totalViews');
    expect(report[0]).toHaveProperty('todayViews');
    
    // Check specific values
    expect(report[0].title).toBe('Advert 1');
    expect(report[0].totalViews).toBe(12); // Last view count
    expect(report[0].todayViews).toBe(7);  // Difference between last (12) and previous (5) view counts
    
    // Test overall structure
    expect(report).toHaveLength(1);
    expect(report).toEqual([
      {
        title: 'Advert 1',
        totalViews: 12,
        todayViews: 7
      }
    ]);
  });
});
import { container } from '../container';
import { AdData } from '../types';
import { fetchAdViews } from '../parser.js';

const adStore = container.adStore;

export function updateViewsArray(
  oldViews: { timestamp: number; count: number }[],
  newView: { timestamp: number; count: number }
): { timestamp: number; count: number }[] {
  if (!Array.isArray(oldViews) || oldViews.length === 0) {
    return [newView];
  }
  const lastView = oldViews[oldViews.length - 1];
  const lastDate = new Date(lastView.timestamp);
  const newDate = new Date(newView.timestamp);

  if (
    lastDate.getFullYear() === newDate.getFullYear() &&
    lastDate.getMonth() === newDate.getMonth() &&
    lastDate.getDate() === newDate.getDate()
  ) {
    return [...oldViews.slice(0, -1), newView];
  }
  return [...oldViews, newView];
}

export async function getAllAds() {
  return adStore.getAll('ads');
}

export async function createAd(adUrl: string) {
  const docId = encodeURIComponent(adUrl);
  const existing = await adStore.get('ads', docId);
  if (existing) throw new Error('Ad with this URL already exists');
  await adStore.save('ads', docId, {
    url: adUrl,
    title: '',
    views: [],
    timestamp: Date.now(),
    nativeId: null,
  });
  return docId;
}

export async function parseAllAds() {
  const allAds = await adStore.getAll('ads');
  for (const ad of allAds) {
    const data = await fetchAdViews(ad.url);
    if (data) {
      const updatedViews = updateViewsArray(ad.views, {
        timestamp: data.timestamp,
        count: data.views
      });
      const updatedAd = {
        ...ad,
        title: ad.title || data.title || '',
        views: updatedViews,
        timestamp: ad.timestamp || data.timestamp,
        nativeId: ad.nativeId || data.nativeId || null,
      };
      await adStore.save('ads', encodeURIComponent(ad.url), updatedAd);
    }
  }
}
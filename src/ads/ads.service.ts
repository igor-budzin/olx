import { container } from '../container';
import { fetchAdViews } from '../parser';

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
  return container.adRepository.getAllAds();
}

export async function createAd(adUrl: string) {
  const docId = encodeURIComponent(adUrl);
  const existing = await container.adRepository.getAdById(docId);
  if (existing) throw new Error('Ad with this URL already exists');
  await container.adRepository.createAd({
    ownerId: null, // This will be set later when the ad is claimed 
    url: adUrl,
    title: '',
    views: [],
    timestamp: Date.now(),
    nativeId: null,
  });
    
  return docId;
}

export async function parseAllAds() {
  const allAds = await container.adRepository.getAllAds();
  for (const ad of allAds) {
    const data = await fetchAdViews(ad.url);
    if (data) {
      const updatedViews = updateViewsArray(ad.views, {
        timestamp: data.timestamp,
        count: data.views
      });

      await container.adRepository.updateAd(encodeURIComponent(ad.url), {
       ...ad,
        title: ad.title || data.title || '',
        views: updatedViews,
        timestamp: ad.timestamp || data.timestamp,
        nativeId: ad.nativeId || data.nativeId || null,
      });
    }
  }
}
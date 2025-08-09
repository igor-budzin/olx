import { inject, injectable } from 'inversify';
import { TYPES } from '../inversify.types';
import { fetchAdViews } from '../parser';
import { AdRepository } from './ads.repository';
import { AdData } from '../types';

@injectable()
export class AdService {
  constructor(@inject(TYPES.AdRepository) private adRepository: AdRepository) { }

  updateViewsArray(
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

  async getAllAds(): Promise<AdData[]> {
    return this.adRepository.getAllAds();
  }

  async createAd(adUrl: string): Promise<string> {
    const docId = encodeURIComponent(adUrl);
    const existing = await this.adRepository.getAdById(docId);
    if (existing) throw new Error('Ad with this URL already exists');

    await this.adRepository.createAd({
      ownerId: [], // This will be set later when the ad is claimed 
      url: adUrl,
      title: '',
      views: [],
      timestamp: Date.now(),
      nativeId: null,
    });

    return docId;
  }

  async parseAllAds(): Promise<void> {
    const allAds = await this.adRepository.getAllAds();

    for (const ad of allAds) {
      const data = await fetchAdViews(ad.url);
      if (data) {
        const updatedViews = this.updateViewsArray(ad.views, {
          timestamp: data.timestamp,
          count: data.views
        });

        await this.adRepository.updateAd(encodeURIComponent(ad.url), {
          ...ad,
          title: ad.title || data.title || '',
          views: updatedViews,
          timestamp: ad.timestamp || data.timestamp,
          nativeId: ad.nativeId || data.nativeId || null,
        });
      }
    }
  }
}

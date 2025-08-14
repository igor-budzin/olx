import { inject, injectable } from 'inversify';
import { TYPES } from '../inversify.types';
import { fetchAdViews } from '../parser';
import { AdRepository } from './ads.repository';
import { AdData } from '../types';
import { LoggerFactory } from '../logger/logger.factory';
import { ILogger } from '../logger/logger.interface';
import { ca } from 'date-fns/locale';

@injectable()
export class AdService {
  private logger: ILogger;

  constructor(
    @inject(TYPES.AdRepository) private adRepository: AdRepository,
    @inject(TYPES.LoggerFactory) private loggerFactory: LoggerFactory
  ) {
    this.logger = loggerFactory.createLogger('AdService');
  }

  private updateViewsArray(
    oldViews: AdData['views'][number][],
    newView: AdData['views'][number]
  ): AdData['views'][number][] {
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
    try {
      const ads = await this.adRepository.getAllAds();
      return ads;
    } catch (error) {
      this.logger.error('Failed to fetch ads', { error });
      throw error;
    }
  }

  async createAd(adUrl: string): Promise<string> {
    try {
      const docId = encodeURIComponent(adUrl);
      const existing = await this.adRepository.getAdById(docId);
      if (existing) throw new Error('Ad with this URL already exists');

      await this.adRepository.createAd({
        ownerId: [],
        url: adUrl,
        title: '',
        views: [],
        timestamp: Date.now(),
        nativeId: null,
        accountName: '',
        location: ''
      });

      return docId;
    }
    catch (error: any) {
      this.logger.error('Failed to create ad', { error });
      throw error;
    }
  }

  async parseAllAds(): Promise<void> {
    try {
      const allAds = await this.adRepository.getAllAds();
  
      for (const ad of allAds) {
        const parsedAd = await fetchAdViews(ad.url);
  
        if (parsedAd) {
          const updatedViews = this.updateViewsArray(ad.views, {
            timestamp: parsedAd.timestamp,
            count: parsedAd.totalViewsOnDay,
            viewOnDay: ad.views.length > 0 ?
              parsedAd.totalViewsOnDay - ad.views[ad.views.length - 1].count :
              0
          });
  
          await this.adRepository.updateAd(encodeURIComponent(ad.url), {
            ...ad,
            title: ad.title || parsedAd.title || '',
            views: updatedViews,
            timestamp: ad.timestamp || parsedAd.timestamp,
            nativeId: ad.nativeId || parsedAd.nativeId || null,
            location: ad.location || parsedAd.location || ''
          });
        }
      }
    }
    catch (error) {
      this.logger.error('Failed to parse ads', { error });
    }
  }
}

import { Router, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { AdService } from './ads.service';
import { TYPES } from '../inversify.types';

@injectable()
export class AdController {
  public router = Router();

  constructor(@inject(TYPES.AdService) private adsService: AdService) {
    this.router.get('/', this.getAllAds.bind(this));
    this.router.post('/', this.createAd.bind(this));
    this.router.post('/parse', this.parseAds.bind(this));
  }

  async getAllAds(req: Request, res: Response): Promise<void> {
    try {
      const allAds = await this.adsService.getAllAds();
      res.json(allAds);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async createAd(req: Request, res: Response): Promise<void> {
    const { url } = req.body;
    if (!url) {
      res.status(400).json({ error: 'URL is required' });
      return;
    }
    
    const adUrl = url.split('?')[0];
    try {
      const docId = await this.adsService.createAd(adUrl);
      res.status(201).json({ message: 'Ad created', id: docId });
    } catch (err: any) {
      res.status(409).json({ error: err.message });
    }
  }

  async parseAds(req: Request, res: Response): Promise<void> {
    try {
      await this.adsService.parseAllAds();
      res.json({ message: 'Parsing complete ✅' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}

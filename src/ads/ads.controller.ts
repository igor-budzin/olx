import { Request, Response } from 'express';
import * as adsService from './ads.service';

export async function getAllAds(req: Request, res: Response) {
  try {
    const allAds = await adsService.getAllAds();
    res.json(allAds);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function createAd(req: Request, res: Response) {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  const adUrl = url.split('?')[0];
  try {
    const docId = await adsService.createAd(adUrl);
    res.status(201).json({ message: 'Ad created', id: docId });
  } catch (err: any) {
    res.status(409).json({ error: err.message });
  }
}

export async function parseAds(req: Request, res: Response) {
  await adsService.parseAllAds();
  res.json({ message: 'Parsing complete ✅' });
}
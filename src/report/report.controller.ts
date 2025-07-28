import { Request, Response } from 'express';
import * as reportService from './report.service';

export async function getDailyReport(req: Request, res: Response) {
  try {
    const report = await reportService.getDailyReport();
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
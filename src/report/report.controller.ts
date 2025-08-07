import { Request, Response } from 'express';
import * as reportService from './report.service';
import { container } from '../container';
import { generateDaylyChart } from './report.service';

export async function getDailyReport(req: Request, res: Response) {
  try {
    await generateDaylyChart();

    res.json({ status: 'success', message: 'Daily report generated successfully' });
  } catch (err: any) {
    console.error('Error generating chart:', err);
    res.status(500).json({ error: err.message });
  }
}
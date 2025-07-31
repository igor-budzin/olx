import { Request, Response } from 'express';
import * as reportService from './report.service';
import { container } from '../container';

export async function getDailyReport(req: Request, res: Response) {
  try {
    const report = await reportService.getDailyReport();

    await container.notifications.sendReportNotification(
      'Daily OLX Ad Report',
      report
    );

    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
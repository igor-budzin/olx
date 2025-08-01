import { Request, Response } from 'express';
import * as reportService from './report.service';
import { container } from '../container';
import { formatReportMessage } from '../utils/formatNotification';

export async function getDailyReport(req: Request, res: Response) {
  try {
    const report = await reportService.getDailyReport();

    await container.notifications.sendMessage({
      message: formatReportMessage('Щоденний звіт', JSON.stringify(report)),
      additionalParams: {
        parseMode: 'HTML'
      }
    });

    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
import { Router, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '../inversify.types';
import { ReportService } from './report.service';

@injectable()
export class ReportController {
  public router = Router();

  constructor(@inject(TYPES.ReportService) private reportService: ReportService) {
    this.router.get('/daily', this.getDailyReport.bind(this));
  }

  async getDailyReport(req: Request, res: Response): Promise<void> {
    try {
      await this.reportService.generateDailyChart();
      res.json({ success: true, message: 'Daily reports generated and sent' });
    } catch (error) {
      console.error('Error generating daily reports:', error);
      res.status(500).json({ success: false, error: 'Failed to generate reports' });
    }
  }
}
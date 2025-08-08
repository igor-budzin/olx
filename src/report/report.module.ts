import { ContainerModule } from 'inversify';
import { TYPES } from '../inversify.types';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';

export const ReportModule = new ContainerModule(({ bind }) => {
  bind(TYPES.ReportService).to(ReportService).inSingletonScope();
  bind(ReportController).toSelf().inRequestScope();
});
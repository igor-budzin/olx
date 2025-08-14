import { injectable, inject } from 'inversify';
import { TYPES } from '../inversify.types';
import { ILogger } from './logger.interface';

@injectable()
export class LoggerFactory {
  constructor(@inject(TYPES.Logger) private baseLogger: ILogger) {}

  createLogger(context: string): ILogger {
    return {
      info: (message: string, metadata?: any) => {
        this.baseLogger.info(message, { ...metadata, context });
      },
      warn: (message: string, metadata?: any) => {
        this.baseLogger.warn(message, { ...metadata, context });
      },
      error: (message: string, metadata?: any) => {
        this.baseLogger.error(message, { ...metadata, context });
      },
      debug: (message: string, metadata?: any) => {
        this.baseLogger.debug(message, { ...metadata, context });
      }
    };
  }
}
import { injectable } from 'inversify';
import winston from 'winston';
import { ILogger } from './logger.interface';
import { Logtail } from '@logtail/node';
import { LogtailTransport } from '@logtail/winston';

@injectable()
export class LoggerService implements ILogger {
  private logger: winston.Logger;
  private context: string;
  private logtail: Logtail;

  constructor() {
    this.context = 'App';

    this.logtail = new Logtail(process.env.BETTER_STACK_SOURCE_TOKEN!, {
      endpoint: `https://${process.env.BETTER_STACK_SOURCE_HOST}`
    });

    // Determine if we should show context based on environment variable
    const showContext = process.env.NODE_ENV === 'production';

    // Create console format with optional context
    const consoleFormat = winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(({ level, message, timestamp, context, ...meta }) => {
        // Only include context if showContext is true
        const ctx = showContext ? `[${context || this.context}] ` : '';
        const metaStr = Object.keys(meta).length ?
          `\n${JSON.stringify(meta, null, 2)}` : '';
        return `[${timestamp}] [${level}] ${ctx}${message}${metaStr}`;
      })
    );

    const transports: winston.transport[] = [
      new winston.transports.Console({
        format: consoleFormat
      }),
    ];

    if (process.env.NODE_ENV === 'production') {
      transports.push(new LogtailTransport(this.logtail));
    }

    this.logger = winston.createLogger({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
      ),
      defaultMeta: process.env.NODE_ENV === 'production' ? { service: 'olx-service' } : {},
      transports
    });
  }

  private formatMetadata(context: string, metadata?: any): any {
    const baseMetadata = { context };

    if (!metadata) {
      return baseMetadata;
    }

    if (metadata instanceof Error) {
      return {
        ...baseMetadata,
        error: {
          message: metadata.message,
          stack: metadata.stack,
          ...(metadata as any)
        }
      };
    }

    return { ...baseMetadata, ...metadata };
  }

  info(message: string, metadata?: any): void {
    const context = metadata?.context || 'App';
    this.logger.info(message, this.formatMetadata(context, metadata));
  }

  warn(message: string, metadata?: any): void {
    const context = metadata?.context || 'App';
    this.logger.warn(message, this.formatMetadata(context, metadata));
  }

  error(message: string, metadata?: any): void {
    const context = metadata?.context || 'App';
    this.logger.error(message, this.formatMetadata(context, metadata));
  }

  debug(message: string, metadata?: any): void {
    const context = metadata?.context || 'App';
    this.logger.debug(message, this.formatMetadata(context, metadata));
  }

  public async flush(): Promise<void> {
    try {
      if (this.logtail) {
        await this.logtail.flush();
        console.log('Logtail logs flushed successfully');
      }
    } catch (error) {
      console.error('Error flushing Logtail logs:', error);
    }
  }
}
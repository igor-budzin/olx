import { injectable } from 'inversify';
import winston from 'winston';
import { ILogger } from './logger.interface';

@injectable()
export class LoggerService implements ILogger {
  private logger: winston.Logger;
  private context: string;
  
  constructor() {
    this.context = 'App';
    
    // Determine if we should show context based on environment variable
    const showContext = process.env.NODE_ENV === 'production';
    
    // Create console format with optional context
    const consoleFormat = winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.timestamp({ format: 'HH:mm:ss' }),
      winston.format.printf(({ level, message, timestamp, context, ...meta }) => {
        // Only include context if showContext is true
        const ctx = showContext ? `[${context || this.context}] ` : '';
        const metaStr = Object.keys(meta).length ? 
          `\n${JSON.stringify(meta, null, 2)}` : '';
        return `[${timestamp}] [${level}] ${ctx}${message}${metaStr}`;
      })
    );

    this.logger = winston.createLogger({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
      ),
      defaultMeta: process.env.NODE_ENV === 'production' ? { service: 'olx-service' } : {},
      transports: [
        new winston.transports.Console({
          format: consoleFormat
        }),
        // new winston.transports.File({ 
        //   filename: 'logs/error.log', 
        //   level: 'error' 
        // }),
        // new winston.transports.File({ 
        //   filename: 'logs/combined.log' 
        // })
      ]
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
}
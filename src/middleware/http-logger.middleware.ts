import { Request, Response, NextFunction } from 'express';
import { container } from '../inversify.config';
import { TYPES } from '../inversify.types';
import { LoggerFactory } from '../logger/logger.factory';

export function httpLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const loggerFactory = container.get<LoggerFactory>(TYPES.LoggerFactory);
  const logger = loggerFactory.createLogger('HTTP');
  
  res.on('finish', () => {
    const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${durationSec}s`;
    
    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${durationSec}s`
    };
    
    if (res.statusCode >= 500) {
      logger.error(message, logData);
    } else if (res.statusCode >= 400) {
      logger.warn(message, logData);
    } else {
      logger.info(message, logData);
    }
  });
  
  next();
}
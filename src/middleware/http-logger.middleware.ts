import { Request, Response, NextFunction } from 'express';
import { container } from '../inversify.config';
import { TYPES } from '../inversify.types';
import { LoggerFactory } from '../logger/logger.factory';

export function httpLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const loggerFactory = container.get<LoggerFactory>(TYPES.LoggerFactory);
  const logger = loggerFactory.createLogger('HTTP');
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;
    
    const logData = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      statusCode: res.statusCode,
      responseTime: duration
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
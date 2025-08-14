import { Request, Response, NextFunction } from 'express';
import { container } from '../inversify.config';
import { TYPES } from '../inversify.types';
import { LoggerFactory } from '../logger/logger.factory';

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const loggerFactory = container.get<LoggerFactory>(TYPES.LoggerFactory);
  const logger = loggerFactory.createLogger('ErrorHandler');
  
  const status = err.status || 500;
  const message = err.message || 'Something went wrong';
  
  logger.error(`${status} - ${message}`, {
    error: err,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query
  });
  
  res.status(status).json({
    success: false,
    status,
    message: process.env.NODE_ENV === 'production' && status === 500 
      ? 'Internal Server Error'
      : message
  });
}
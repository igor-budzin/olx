import { Request, Response, NextFunction } from 'express';

export interface AuthOptions {
  apiKeyHeaderName?: string;
  apiKeyValue?: string;
}

export function apiKeyAuth(options: AuthOptions = {}) {
  const {
    apiKeyHeaderName = 'x-api-key',
    apiKeyValue = process.env.API_KEY
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV === 'development') {
      return next(); // Skip auth in development mode
    }

    const headerApiKey = req.headers[apiKeyHeaderName.toLowerCase()] as string;
    
    if (headerApiKey === apiKeyValue) {
      return next();
    }
    
    return res.status(401).json({
      status: 'error',
      message: 'Unauthorized: Invalid API key'
    });
  };
}
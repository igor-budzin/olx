import 'reflect-metadata';
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { AdController } from './ads/ads.controller';
import { health } from './health/health.controller';
import { apiKeyAuth } from './middleware/auth.middleware';
import { container } from './inversify.config';
import { uk } from 'date-fns/locale'
import { setDefaultOptions } from 'date-fns';
import { ReportController } from './report/report.controller';
import { TYPES } from './inversify.types';
import { TelegramBotService } from './telegram/TelegramBot.service';
import { httpLogger } from './middleware/http-logger.middleware';
import { errorHandler } from './middleware/error-handler.middleware';
import { LoggerFactory } from './logger/logger.factory';

setDefaultOptions({ locale: uk });

dotenv.config({ path: '../.env' });
const app = express();
const PORT = process.env.PORT || 3001;

// Get logger
const loggerFactory = container.get<LoggerFactory>(TYPES.LoggerFactory);
const logger = loggerFactory.createLogger('App');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(httpLogger);

app.use('/ads', apiKeyAuth(), container.get(AdController).router);
app.use('/report', apiKeyAuth(), container.get(ReportController).router);
app.get('/health', health);

// Serve static HTML file at "/"
app.get('/', (_req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).send('Not Found');
  }

  const htmlPath = path.join('src', 'ads.html');
  fs.readFile(htmlPath, 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Could not load HTML file');
    } else {
      res.setHeader('Content-Type', 'text/html');
      res.send(data);
    }
  });
});

const gracefulShutdown = () => {
  console.log('Shutting down server...');

  if (container.get<TelegramBotService>(TYPES.TelegramBotService)) {
    container.get<TelegramBotService>(TYPES.TelegramBotService).stop();
  }

  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);

  try {
    if (container.get<TelegramBotService>(TYPES.TelegramBotService).start()) {
      logger.info('Telegram bot polling started');
    } else {
      logger.warn('Telegram bot polling could not be started');
    }
  } catch (error) {
    logger.error('Error starting Telegram bot polling', { error });
  }
});



import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import * as adsController from './ads/ads.controller';
import * as reportController from './report/report.controller';
import { health } from './health/health.controller';
import { apiKeyAuth } from './middleware/auth.middleware';
import { container } from './container';
import { uk } from 'date-fns/locale'
import { setDefaultOptions } from 'date-fns';

setDefaultOptions({ locale: uk });

dotenv.config({ path: '../.env' });
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/ads', apiKeyAuth(), adsController.getAllAds);
app.post('/ads', apiKeyAuth(), adsController.createAd);
app.get('/parse', apiKeyAuth(), adsController.parseAds);
app.get('/report/daily', apiKeyAuth(), reportController.getDailyReport);
app.get('/health',  health);

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
  
  if (container.telegramBotService) {
    container.telegramBotService.stop();
  }
  
  process.exit(0);
};

// Register shutdown handlers
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server and then start the bot
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  // Start telegram bot after server is running
  try {
    if (container.telegramBotService.start()) {
      console.log('🤖 Telegram bot polling started');
    } else {
      console.warn('⚠️ Telegram bot polling could not be started');
    }
  } catch (error) {
    console.error('❌ Error starting Telegram bot polling:', error);
  }
});



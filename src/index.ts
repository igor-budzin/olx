import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import * as adsController from './ads/ads.controller';
import * as reportController from './report/report.controller';
import { health } from './health/health.controller';
import { apiKeyAuth } from './middleware/auth.middleware';

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

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});



import { DataStore } from './DataStore';
import { AdData } from './types';
import { NotificationFactory } from './notifications/NotificationFactory';
import dotenv from 'dotenv';

dotenv.config();

export const container = {
  adStore: new DataStore<AdData>(),
  notifications: NotificationFactory.create('telegram', {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    defaultRecipient: process.env.TELEGRAM_CHAT_ID
  })
};
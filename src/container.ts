import { AdData } from './types';
import { NotificationFactory } from './notifications/NotificationFactory';
import dotenv from 'dotenv';
import { NotificationType } from './notifications/Notification';
import { TelegramBotService } from './TelegramBot';
import { AdRepository } from './ads/ads.repository';
import { UserRepository } from './user/user.repository';

dotenv.config();

const telegramBotService = new TelegramBotService(process.env.TELEGRAM_BOT_TOKEN);

export const container = {
  notifications: NotificationFactory.create({
    type: NotificationType.TELEGRAM,
    options: {
      botInstance: telegramBotService.getBotInstance()
    }
  }),
  telegramBotService,
  adRepository: new AdRepository(),
  userRepository: new UserRepository(),
};
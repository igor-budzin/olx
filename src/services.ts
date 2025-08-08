import TelegramBot from 'node-telegram-bot-api';
import { TelegramBotService } from './TelegramBot';
import { NotificationFactory } from './notifications/NotificationFactory';
import { NotificationType } from './notifications/Notification';
import { Notification } from './notifications/Notification';

// Create singleton instances
const telegramBotService = new TelegramBotService(process.env.TELEGRAM_BOT_TOKEN || '');

const notificationService = NotificationFactory.create({
  type: NotificationType.TELEGRAM,
  options: {
    botInstance: telegramBotService.getBotInstance()
  }
});

// Export as singletons
export { telegramBotService, notificationService };
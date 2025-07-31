import TelegramBot from 'node-telegram-bot-api';
import { Notification, NotificationOptions, NotificationPayload } from './Notification';

export class TelegramNotification implements Notification {
  private readonly bot: TelegramBot;
  private readonly defaultChatId?: string;

  constructor(options: NotificationOptions) {
    const botToken = options.botToken as string;
    if (!botToken) {
      throw new Error('Bot token is required for Telegram notifications');
    }
    
    this.bot = new TelegramBot(botToken, { polling: false });
    this.defaultChatId = options.defaultRecipient;
  }

  async sendMessage(payload: NotificationPayload, chatId?: string): Promise<boolean> {
    try {
      const recipient = chatId || this.defaultChatId;
      
      if (!recipient) {
        throw new Error('No chat ID provided for notification');
      }

      const options: TelegramBot.SendMessageOptions = {
        parse_mode: (payload.additionalParams?.parseMode as any) || 'HTML',
        disable_notification: payload.additionalParams?.disableNotification
      };

      await this.bot.sendMessage(recipient, payload.message, options);
      return true;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return false;
    }
  }
}
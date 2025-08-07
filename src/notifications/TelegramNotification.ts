import TelegramBot from 'node-telegram-bot-api';
import { Notification, NotificationOptions, NotificationPayload } from './Notification';

export class TelegramNotification implements Notification {
  private readonly bot: TelegramBot;

  constructor(options: NotificationOptions) {
    const telegramOptions = options.options as { botInstance: TelegramBot };
    if (!telegramOptions.botInstance) {
      throw new Error('Bot instance is required for Telegram notifications');
    }

    this.bot = telegramOptions.botInstance;
  }

  async sendMessage(chatId: string, payload: NotificationPayload): Promise<boolean> {
    try {
      const options: TelegramBot.SendMessageOptions = {
        parse_mode: (payload.additionalParams?.parseMode as any) || 'HTML',
        disable_notification: payload.additionalParams?.disableNotification
      };

      await this.bot.sendMessage(chatId, payload.message, options);
      return true;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return false;
    }
  }

  async sendImage(chatId: string, imageBuffer: Buffer, caption?: string): Promise<boolean> {
    try {

      // await this.bot.sendMessage(chatId, caption, { parse_mode: 'HTML' });

      // Then send photos as an album (without captions)
      // if ([imageBuffer, imageBuffer].length > 1) {
      //   const mediaGroup: any = [imageBuffer, imageBuffer].map(buffer => ({
      //     type: 'photo' as const,
      //     media: buffer
      //   }));

      //   await this.bot.sendMediaGroup(chatId, mediaGroup);
      // }
      await this.bot.sendPhoto(chatId, imageBuffer, {
        caption,
        parse_mode: 'HTML'
      });
      return true;
    } catch (error) {
      console.error('Failed to send image notification:', error?.message);
      return false;
    }
  }
}
import { injectable, inject } from 'inversify';
import TelegramBot from 'node-telegram-bot-api';
import { TYPES } from '../inversify.types';
import { TelegramBotRouter } from './TelegramBot.router';

@injectable()
export class TelegramBotService {
  private bot: TelegramBot;
  private isRunning = false;
  private startTime: Date | null = null;

  constructor(
    private readonly token: string,
    @inject(TYPES.TelegramBotRouter) private botRouter: TelegramBotRouter
  ) {
    this.bot = new TelegramBot(this.token, { polling: false });
  }

  public getBotInstance(): TelegramBot {
    return this.bot;
  }

  public start(): boolean {
    if (this.isRunning) {
      console.log('Telegram bot is already running');
      return false;
    }

    try {
      // Stop any existing polling just to be safe
      this.bot.stopPolling();

      // Register all handlers before starting polling
      this.botRouter.registerHandlers(this.bot);
      
      // Start polling
      this.bot.startPolling();
      
      this.isRunning = true;
      this.startTime = new Date();
      console.log('🤖 Telegram bot started successfully');
      return true;
    } catch (error) {
      console.error('Failed to start Telegram bot:', error);
      return false;
    }
  }

  public stop(): boolean {
    if (!this.isRunning) {
      return false;
    }

    try {
      this.bot.stopPolling();
      this.isRunning = false;
      console.log('Telegram bot stopped');
      return true;
    } catch (error) {
      console.error('Failed to stop Telegram bot:', error);
      return false;
    }
  }

  public getStatus() {
    return {
      isRunning: this.isRunning,
      startTime: this.startTime,
      uptime: this.startTime ? Math.floor((Date.now() - this.startTime.getTime()) / 1000) : 0
    };
  }

  public async sendMessage(chatId: string, text: string, options = {}): Promise<boolean> {
    try {
      if (!text || text.trim() === '') {
        console.error(`Cannot send empty message to ${chatId}`);
        return false;
      }
      
      await this.bot.sendMessage(chatId, text, options);
      return true;
    } catch (error) {
      console.error(`Failed to send message to ${chatId}:`, error);
      return false;
    }
  }

  public async sendImage(chatId: string, imageBuffer: Buffer, caption?: string): Promise<boolean> {
    try {
      await this.bot.sendPhoto(chatId, imageBuffer, {
        caption,
        parse_mode: 'HTML'
      });
      return true;
    } catch (error) {
      console.error(`Failed to send image to ${chatId}:`, error);
      return false;
    }
  }
}

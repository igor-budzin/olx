import { injectable, inject } from 'inversify';
import TelegramBot from 'node-telegram-bot-api';
import { TYPES } from '../inversify.types';
import { ILogger } from '../logger/logger.interface';
import { LoggerFactory } from '../logger/logger.factory';
import { TelegramBotRouter } from './TelegramBot.router';

@injectable()
export class TelegramBotService {
  private bot: TelegramBot;
  private isRunning = false;
  private startTime: Date | null = null;
  private logger: ILogger;

  constructor(
    private readonly token: string,
    @inject(TYPES.TelegramBotRouter) private botRouter: TelegramBotRouter,
    @inject(TYPES.LoggerFactory) loggerFactory: LoggerFactory
  ) {
    this.logger = loggerFactory.createLogger('TelegramBotService');
    this.logger.debug('Initializing TelegramBotService');
    this.bot = new TelegramBot(this.token, { polling: false });
  }

  public getBotInstance(): TelegramBot {
    return this.bot;
  }

  public start(): boolean {
    if (this.isRunning) {
      this.logger.warn('Telegram bot is already running');
      return false;
    }

    try {
      this.logger.info('Starting Telegram bot');
      
      // Stop any existing polling just to be safe
      this.bot.stopPolling();
      
      // Register all handlers
      this.logger.debug('Registering command handlers');
      this.botRouter.registerHandlers(this.bot);
      
      // Start polling
      this.logger.debug('Starting bot polling');
      this.bot.startPolling();
      
      this.isRunning = true;
      this.startTime = new Date();
      this.logger.info('Telegram bot started successfully', {
        startTime: this.startTime.toISOString()
      });
      return true;
    } catch (error) {
      this.logger.error('Failed to start Telegram bot', { error });
      return false;
    }
  }

  public stop(): boolean {
    if (!this.isRunning) {
      this.logger.warn('Telegram bot is not running');
      return false;
    }

    try {
      this.logger.info('Stopping Telegram bot');
      this.bot.stopPolling();
      this.isRunning = false;
      
      const uptime = this.startTime ? 
        Math.floor((Date.now() - this.startTime.getTime()) / 1000) : 0;
      
      this.logger.info('Telegram bot stopped', { uptime });
      return true;
    } catch (error) {
      this.logger.error('Failed to stop Telegram bot', { error });
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
        this.logger.error('Cannot send empty message', { chatId });
        return false;
      }
      
      await this.bot.sendMessage(chatId, text, options);
      return true;
    } catch (error) {
      this.logger.error('Failed to send message', { 
        chatId, 
        error: error.message,
        code: error.code 
      });
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
      this.logger.error('Failed to send image', { 
        chatId, 
        error: error.message,
        code: error.code 
      });
      return false;
    }
  }
}

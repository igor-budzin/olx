import { injectable, inject } from 'inversify';
import TelegramBot from 'node-telegram-bot-api';
import { TYPES } from './inversify.types';
import { UserRepository } from './user/user.repository';

@injectable()
export class TelegramBotService {
  private bot: TelegramBot;
  private isRunning = false;
  private startTime: Date | null = null;

  constructor(
    private readonly token: string,
    @inject(TYPES.UserRepository) private userRepository: UserRepository
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

      // Start polling on the existing instance
      this.bot.startPolling();

      // Register handlers after polling starts
      this.registerHandlers();
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

  private registerHandlers() {
    this.bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id.toString();
      const firstName = msg.from?.first_name;

      try {
        await this.userRepository.createUser({
          id: chatId,
          firstName,
          registeredAt: Date.now(),
          isActive: true
        });
        
        console.log(`User registered: ${firstName} (${chatId})`);
      } catch (error) {
        console.error('Error registering user:', error);
      }
    });
  }

  public async sendMessage(chatId: string, text: string, options = {}): Promise<boolean> {
    try {
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

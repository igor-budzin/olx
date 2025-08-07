import TelegramBot from 'node-telegram-bot-api';
import { db } from './firebase';

export class TelegramBotService {
  private bot: TelegramBot;
  private isRunning = false;
  private startTime: Date | null = null;

  constructor(private readonly token: string) {
    this.bot = new TelegramBot(this.token, { polling: false });
  }

  /**
   * Get the bot instance to share with other services
   */
  public getBotInstance(): TelegramBot {
    return this.bot;
  }

  /**
   * Initialize and start the Telegram bot polling
   */
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

  /**
   * Stop the Telegram bot
   */
  public stop(): boolean {
    if (!this.isRunning) {
      return false;
    }

    try {
      // this.bot.stopPolling();
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
    // Handle /start command
    this.bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id.toString();
      const firstName = msg.from?.first_name;

      try {
        // Store user in Firestore
        await db.collection('users').doc(chatId).set({
          id: chatId,
          firstName,
          registeredAt: Date.now(),
          isActive: true
        }, { merge: true });

        console.log(`User registered: ${firstName} (${chatId})`);
      } catch (error) {
        console.error('Error registering user:', error);
      }
    });

    // Add more handlers here...
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

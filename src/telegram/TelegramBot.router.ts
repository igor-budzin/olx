import { injectable, inject } from 'inversify';
import TelegramBot from 'node-telegram-bot-api';
import { TYPES } from '../inversify.types';
import { UserRepository } from '../user/user.repository';

@injectable()
export class TelegramBotRouter {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepository
  ) {}

  /**
   * Register all command handlers with the bot instance
   */
  public registerHandlers(bot: TelegramBot): void {
    // Start command
    bot.onText(/\/start/, async (msg) => {
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
        this.showMenu(bot, chatId);
      } catch (error) {
        console.error('Error registering user:', error);
      }
    });
    
    // Add more command handlers here
    bot.onText(/\/stats/, (msg) => {
      // Handle stats command
    });
    
    // Handle non-command messages
    bot.on('message', (msg) => {
      if (!msg.text?.startsWith('/')) {
        // Handle regular messages
      }
    });
  }
  
  /**
   * UI helper methods
   */
  private showMenu(bot: TelegramBot, chatId: string, text: string = 'Виберіть дію:') {
    bot.sendMessage(chatId, text, {
      reply_markup: {
        keyboard: [
          [{ text: '🔰 Додати нове' }, { text: '🔍 Показати всі' }],
          [{ text: '📊 Статистика' }]
        ],
        resize_keyboard: true
      }
    });
  }
  
  private hideMenu(bot: TelegramBot, chatId: string) {
    bot.sendMessage(chatId, 'Меню приховано', {
      reply_markup: {
        keyboard: [],
        resize_keyboard: true
      }
    });
  }
}
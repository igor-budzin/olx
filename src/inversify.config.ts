import { Container } from 'inversify';
import { AdModule } from './ads/ads.module';
import { ReportModule } from './report/report.module';
import { UserModule } from './user/user.module';
import { TYPES } from './inversify.types';
import dotenv from 'dotenv';
import { TelegramBotService } from './TelegramBot';
import { NotificationFactory } from './notifications/NotificationFactory';
import { NotificationType } from './notifications/Notification';

dotenv.config();

const container = new Container();

container.load(UserModule);
container.load(AdModule);
container.load(ReportModule);

const telegramBotService = new TelegramBotService(
  process.env.TELEGRAM_BOT_TOKEN,
  container.get(TYPES.UserRepository)
);
const notificationService = NotificationFactory.create({
  type: NotificationType.TELEGRAM,
  options: {
    botInstance: telegramBotService.getBotInstance()
  }
});

// Bind the pre-created services as constant values
container.bind(TYPES.TelegramBotService).toConstantValue(telegramBotService);
container.bind(TYPES.NotificationService).toConstantValue(notificationService);

export { container };
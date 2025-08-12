import { Container } from 'inversify';
import { AdModule } from './ads/ads.module';
import { ReportModule } from './report/report.module';
import { UserModule } from './user/user.module';
import { TYPES } from './inversify.types';
import dotenv from 'dotenv';
import { TelegramBotService } from './telegram/TelegramBot.service';
import { NotificationFactory } from './notifications/NotificationFactory';
import { NotificationType, Notification } from './notifications/Notification';
import { TelegramBotRouter } from './telegram/TelegramBot.router';

dotenv.config();

const container = new Container();

container.load(UserModule);
container.load(AdModule);
container.load(ReportModule);

container
  .bind<TelegramBotRouter>(TYPES.TelegramBotRouter)
  .to(TelegramBotRouter)
  .inSingletonScope();

container
  .bind<TelegramBotService>(TYPES.TelegramBotService)
  .toDynamicValue((context) => {
    return new TelegramBotService(process.env.TELEGRAM_BOT_TOKEN || '', context.get(TYPES.TelegramBotRouter));
  }).inSingletonScope();


container
  .bind<Notification>(TYPES.NotificationService)
  .toDynamicValue((context) => {
    return NotificationFactory.create({
      type: NotificationType.TELEGRAM,
      options: {
        botInstance: context
                      .get<TelegramBotService>(TYPES.TelegramBotService)
                      .getBotInstance()
      }
    });
  });

export { container };
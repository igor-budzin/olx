import { Container } from 'inversify';
import { AdModule } from './ads/ads.module';
import { ReportModule } from './report/report.module';
import { UserModule } from './user/user.module';
import { LoggerModule } from './logger/logger.module';
import { TYPES } from './inversify.types';
import dotenv from 'dotenv';
import { TelegramBotService } from './telegram/TelegramBot.service';
import { NotificationFactory } from './notifications/NotificationFactory';
import { NotificationType, Notification } from './notifications/Notification';
import { TelegramBotRouter } from './telegram/TelegramBot.router';
import { ParserModule } from './parser/parser.module';

dotenv.config();

const container = new Container();

container.load(LoggerModule); // Load the Logger module first since other modules might depend on it
container.load(UserModule);
container.load(AdModule);
container.load(ReportModule);
container.load(ParserModule);

container
  .bind<TelegramBotRouter>(TYPES.TelegramBotRouter)
  .to(TelegramBotRouter)
  .inSingletonScope();

container
  .bind<TelegramBotService>(TYPES.TelegramBotService)
  .toDynamicValue((context) => {
    return new TelegramBotService(
      process.env.TELEGRAM_BOT_TOKEN || '', 
      context.get(TYPES.TelegramBotRouter),
      context.get(TYPES.LoggerFactory)
    );
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
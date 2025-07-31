import { Notification, NotificationOptions } from './Notification';
import { TelegramNotification } from './TelegramNotification';

export type NotificationType = 'telegram';

export class NotificationFactory {
  static create(type: NotificationType, options: NotificationOptions): Notification {
    switch (type) {
      case 'telegram':
        return new TelegramNotification(options);
      default:
        throw new Error(`Notification type "${type}" is not supported`);
    }
  }
}
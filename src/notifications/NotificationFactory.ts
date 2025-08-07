import { Notification, NotificationOptions, NotificationType } from './Notification';
import { TelegramNotification } from './TelegramNotification';

/**
 * Factory class to create notification instances based on the provided options.
 */
export class NotificationFactory {
  static create(options: NotificationOptions): Notification {
    switch (options.type) {
      case NotificationType.TELEGRAM:
        return new TelegramNotification(options);
      default:
        throw new Error(`Notification type "${options.type}" is not supported`);
    }
  }
}
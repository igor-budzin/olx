import TelegramBot from "node-telegram-bot-api";

export enum NotificationType {
  TELEGRAM = 'telegram',
  EMAIL = 'email',
}

export interface TelegramNotificationOptions {
  botInstance: TelegramBot;
}

export interface EmailNotificationOptions {}

export interface NotificationPayload {
  message: string;
  title?: string;
  additionalParams?: Record<string, any>;
}

type NotificationOptionsMap = {
  [NotificationType.TELEGRAM]: TelegramNotificationOptions;
  [NotificationType.EMAIL]: EmailNotificationOptions;
}

export interface NotificationOptions {
  type: NotificationType;
  options: NotificationOptionsMap[NotificationType];
}

export interface Notification {
  sendMessage(chatId: string, payload: NotificationPayload): Promise<boolean>;
  sendImage(chatId: string, imageBuffer: Buffer, caption?: string): Promise<boolean>;
}
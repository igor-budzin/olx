export interface NotificationPayload {
  message: string;
  title?: string;
  additionalParams?: Record<string, any>;
}

export interface NotificationOptions {
  defaultRecipient?: string;
  [key: string]: any;
}

export interface Notification {
  sendMessage(payload: NotificationPayload, recipient?: string): Promise<boolean>;
}
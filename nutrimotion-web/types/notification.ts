/**
 * Notification Types
 */

export enum NotificationType {
  EMAIL = 'email',
  WHATSAPP = 'whatsapp',
  PUSH = 'push',
  SMS = 'sms',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  DELIVERED = 'delivered',
}

export interface NotificationEvent {
  id: string;
  type: NotificationType;
  recipientId: string;
  recipientEmail?: string;
  recipientPhone?: string;
  subject?: string;
  message: string;
  templateId?: string;
  templateData?: Record<string, any>;
  status: NotificationStatus;
  errorMessage?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  subject?: string;
  body: string;
  variables: string[];
}

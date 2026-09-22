// نظام التنبيهات البصرية
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  duration?: number;
}

class NotificationManager {
  private listeners: ((notification: Notification) => void)[] = [];
  private notifications: Notification[] = [];

  // إضافة مستمع للتنبيهات
  subscribe(listener: (notification: Notification) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // إضافة تنبيه جديد
  addNotification(notification: Omit<Notification, 'id' | 'timestamp'>): Notification {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };

    this.notifications.push(newNotification);
    this.listeners.forEach(listener => listener(newNotification));

    // إزالة التنبيه تلقائياً بعد المدة المحددة
    if (notification.duration !== 0) {
      setTimeout(() => {
        this.removeNotification(newNotification.id);
      }, notification.duration || 3000);
    }

    return newNotification;
  }

  // إزالة تنبيه
  removeNotification(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
  }

  // الحصول على جميع التنبيهات
  getNotifications(): Notification[] {
    return [...this.notifications];
  }

  // تنبيهات سريعة
  success(title: string, message: string, duration = 3000): Notification {
    return this.addNotification({ type: 'success', title, message, duration });
  }

  error(title: string, message: string, duration = 5000): Notification {
    return this.addNotification({ type: 'error', title, message, duration });
  }

  warning(title: string, message: string, duration = 4000): Notification {
    return this.addNotification({ type: 'warning', title, message, duration });
  }

  info(title: string, message: string, duration = 3000): Notification {
    return this.addNotification({ type: 'info', title, message, duration });
  }
}

// إنشاء نسخة واحدة من NotificationManager
export const notificationManager = new NotificationManager();

// دوال مساعدة للتنبيهات الشائعة
export const notifyCourierCheckIn = (courierName: string, tripNumber: string) => {
  notificationManager.success(
    'تسجيل وصول',
    `تم تسجيل وصول المندوب ${courierName} - رحلة ${tripNumber}`
  );
};

export const notifyStageStarted = (stageName: string, tripNumber: string) => {
  notificationManager.info(
    'بدء المرحلة',
    `تم بدء مرحلة ${stageName} للرحلة ${tripNumber}`
  );
};

export const notifyStageCompleted = (stageName: string, tripNumber: string) => {
  notificationManager.success(
    'اكتمال المرحلة',
    `تم إنهاء مرحلة ${stageName} للرحلة ${tripNumber}`
  );
};

export const notifyDecision = (decision: string, tripNumber: string) => {
  notificationManager.info(
    'قرار النظام',
    `${decision} للرحلة ${tripNumber}`
  );
};

export const notifyQueuePromotion = (courierName: string, position: number) => {
  notificationManager.success(
    'ترقية من الطابور',
    `تم ترقية المندوب ${courierName} - الموقع: ${position}`
  );
};

export const notifyError = (message: string) => {
  notificationManager.error('خطأ', message);
};

// نظام سجل الأنشطة (Activity Audit Log)

export type ActivityType = 
  | 'LOGIN'
  | 'LOGOUT'
  | 'CREATE_TRIP'
  | 'START_STAGE'
  | 'FINISH_STAGE'
  | 'CREATE_INBOUND'
  | 'START_INBOUND'
  | 'COMPLETE_INBOUND'
  | 'ADD_ITEM'
  | 'REMOVE_ITEM'
  | 'IMPORT_COURIERS'
  | 'UPDATE_SETTINGS'
  | 'DECISION_MADE'
  | 'QUEUE_PROMOTION';

export interface ActivityLog {
  id: string;
  timestamp: number;
  userId: string;
  userName: string;
  userRole: string;
  type: ActivityType;
  description: string;
  details?: Record<string, any>;
}

class AuditLogManager {
  private logs: ActivityLog[] = [];
  private listeners: ((log: ActivityLog) => void)[] = [];
  private readonly STORAGE_KEY = 'tbos_audit_log';
  private readonly MAX_LOGS = 1000;

  constructor() {
    this.loadFromStorage();
  }

  // تحميل السجلات من التخزين المحلي
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    }
  }

  // حفظ السجلات في التخزين المحلي
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.logs));
    } catch (error) {
      console.error('Failed to save audit logs:', error);
    }
  }

  // إضافة سجل جديد
  addLog(
    userId: string,
    userName: string,
    userRole: string,
    type: ActivityType,
    description: string,
    details?: Record<string, any>
  ): ActivityLog {
    const log: ActivityLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      userId,
      userName,
      userRole,
      type,
      description,
      details,
    };

    this.logs.unshift(log); // إضافة في البداية (الأحدث أولاً)

    // الحفاظ على الحد الأقصى للسجلات
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(0, this.MAX_LOGS);
    }

    this.saveToStorage();
    this.notifyListeners(log);

    return log;
  }

  // الحصول على جميع السجلات
  getLogs(): ActivityLog[] {
    return [...this.logs];
  }

  // الحصول على السجلات حسب النوع
  getLogsByType(type: ActivityType): ActivityLog[] {
    return this.logs.filter(log => log.type === type);
  }

  // الحصول على السجلات حسب المستخدم
  getLogsByUser(userId: string): ActivityLog[] {
    return this.logs.filter(log => log.userId === userId);
  }

  // الحصول على السجلات حسب الفترة الزمنية
  getLogsByDateRange(startDate: number, endDate: number): ActivityLog[] {
    return this.logs.filter(log => log.timestamp >= startDate && log.timestamp <= endDate);
  }

  // الاشتراك في السجلات الجديدة
  subscribe(listener: (log: ActivityLog) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // إشعار المستمعين
  private notifyListeners(log: ActivityLog): void {
    this.listeners.forEach(listener => listener(log));
  }

  // مسح جميع السجلات
  clearLogs(): void {
    this.logs = [];
    this.saveToStorage();
  }

  // الحصول على إحصائيات السجلات
  getStats(): {
    total: number;
    today: number;
    byType: Record<ActivityType, number>;
  } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    const todayLogs = this.logs.filter(log => log.timestamp >= todayTimestamp);

    const byType = {} as Record<ActivityType, number>;
    this.logs.forEach(log => {
      byType[log.type] = (byType[log.type] || 0) + 1;
    });

    return {
      total: this.logs.length,
      today: todayLogs.length,
      byType,
    };
  }
}

// إنشاء نسخة واحدة من AuditLogManager
export const auditLogManager = new AuditLogManager();

// دوال مساعدة لتسجيل الأنشطة الشائعة
export const logActivity = {
  login: (userId: string, userName: string, userRole: string) => {
    auditLogManager.addLog(
      userId,
      userName,
      userRole,
      'LOGIN',
      `${userName} قام بتسجيل الدخول`
    );
  },

  logout: (userId: string, userName: string, userRole: string) => {
    auditLogManager.addLog(
      userId,
      userName,
      userRole,
      'LOGOUT',
      `${userName} قام بتسجيل الخروج`
    );
  },

  createTrip: (userId: string, userName: string, userRole: string, tripNumber: string, courierName: string) => {
    auditLogManager.addLog(
      userId,
      userName,
      userRole,
      'CREATE_TRIP',
      `تم إنشاء رحلة جديدة: ${tripNumber} للمندوب ${courierName}`,
      { tripNumber, courierName }
    );
  },

  startStage: (userId: string, userName: string, userRole: string, stage: string, tripNumber: string) => {
    auditLogManager.addLog(
      userId,
      userName,
      userRole,
      'START_STAGE',
      `تم بدء مرحلة ${stage} للرحلة ${tripNumber}`,
      { stage, tripNumber }
    );
  },

  finishStage: (userId: string, userName: string, userRole: string, stage: string, tripNumber: string) => {
    auditLogManager.addLog(
      userId,
      userName,
      userRole,
      'FINISH_STAGE',
      `تم إنهاء مرحلة ${stage} للرحلة ${tripNumber}`,
      { stage, tripNumber }
    );
  },

  createInbound: (userId: string, userName: string, userRole: string, inboundNumber: string) => {
    auditLogManager.addLog(
      userId,
      userName,
      userRole,
      'CREATE_INBOUND',
      `تم إنشاء وارد جديد: ${inboundNumber}`,
      { inboundNumber }
    );
  },

  importCouriers: (userId: string, userName: string, userRole: string, count: number) => {
    auditLogManager.addLog(
      userId,
      userName,
      userRole,
      'IMPORT_COURIERS',
      `تم استيراد ${count} مندوب من ملف Excel`,
      { count }
    );
  },

  updateSettings: (userId: string, userName: string, userRole: string, setting: string) => {
    auditLogManager.addLog(
      userId,
      userName,
      userRole,
      'UPDATE_SETTINGS',
      `تم تحديث الإعدادات: ${setting}`,
      { setting }
    );
  },

  decisionMade: (userId: string, userName: string, userRole: string, decision: string, tripNumber: string) => {
    auditLogManager.addLog(
      userId,
      userName,
      userRole,
      'DECISION_MADE',
      `تم اتخاذ قرار: ${decision} للرحلة ${tripNumber}`,
      { decision, tripNumber }
    );
  },
};

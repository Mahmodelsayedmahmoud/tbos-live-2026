// نظام المزامنة اللحظية (Real-time Sync System)
// يدعم المزامنة بين التبويبات والنوافذ على نفس الجهاز
// جاهز للربط مع Supabase للمزامنة بين الأجهزة المختلفة

type SyncCallback = (data: unknown) => void;

class RealtimeSync {
  private channel: BroadcastChannel | null = null;
  private listeners: Map<string, Set<SyncCallback>> = new Map();
  private storageKey = 'tbos_sync_event';

  constructor() {
    // تهيئة BroadcastChannel للمزامنة بين التبويبات
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel('tbos_sync_channel');
        this.channel.onmessage = (event) => {
          this.handleMessage(event.data);
        };
      } catch (error) {
        console.warn('BroadcastChannel not available:', error);
      }
    }

    // الاستماع لأحداث التخزين للمزامنة بين النوافذ
    window.addEventListener('storage', (event) => {
      if (event.key === this.storageKey && event.newValue) {
        try {
          const data = JSON.parse(event.newValue);
          this.handleMessage(data);
        } catch (error) {
          console.error('Sync storage error:', error);
        }
      }
    });
  }

  private handleMessage(data: { type: string; payload: unknown }) {
    if (!data || !data.type) return;
    
    const callbacks = this.listeners.get(data.type);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data.payload);
        } catch (error) {
          console.error('Sync callback error:', error);
        }
      });
    }
  }

  // بث التغييرات إلى جميع العملاء المتصلين
  broadcast(type: string, payload: unknown) {
    const message = { type, payload, timestamp: Date.now() };

    // إرسال عبر BroadcastChannel (بين التبويبات)
    if (this.channel) {
      try {
        this.channel.postMessage(message);
      } catch (error) {
        console.warn('BroadcastChannel postMessage failed:', error);
      }
    }

    // حفظ في localStorage للمزامنة بين النوافذ
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(message));
      setTimeout(() => {
        localStorage.removeItem(this.storageKey);
      }, 100);
    } catch (error) {
      console.warn('Sync storage failed:', error);
    }
  }

  // الاشتراك في نوع معين من التغييرات
  subscribe(type: string, callback: SyncCallback): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);

    return () => {
      const callbacks = this.listeners.get(type);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(type);
        }
      }
    };
  }

  // الاشتراك في جميع التغييرات
  subscribeAll(callback: SyncCallback): () => void {
    const wrapper = (payload: unknown) => callback(payload);
    
    this.listeners.forEach(callbacks => callbacks.add(wrapper));
    
    return () => {
      this.listeners.forEach(callbacks => callbacks.delete(wrapper));
    };
  }

  // تنظيف
  destroy() {
    if (this.channel) {
      this.channel.close();
    }
    this.listeners.clear();
  }
}

// إنشاء نسخة واحدة من RealtimeSync
export const realtimeSync = new RealtimeSync();

// أنواع أحداث المزامنة
export const SYNC_EVENTS = {
  DB_CHANGED: 'db_changed',
  COURIER_ADDED: 'courier_added',
  COURIER_UPDATED: 'courier_updated',
  COURIER_DELETED: 'courier_deleted',
  TRIP_CREATED: 'trip_created',
  TRIP_UPDATED: 'trip_updated',
  STAGE_CHANGED: 'stage_changed',
  QUEUE_UPDATED: 'queue_updated',
  DECISION_MADE: 'decision_made',
  INBOUND_CREATED: 'inbound_created',
  INBOUND_UPDATED: 'inbound_updated',
  SETTINGS_UPDATED: 'settings_updated',
} as const;

// دالة مساعدة لإشعار جميع العملاء بالتغييرات
export function notifyDatabaseChange(table: string, action: string, data?: unknown) {
  realtimeSync.broadcast(SYNC_EVENTS.DB_CHANGED, {
    table,
    action,
    data,
    timestamp: Date.now(),
  });
}

/*
===========================================
📌 ملاحظة للمطورين: الربط مع Supabase
===========================================

لتمكين المزامنة بين الأجهزة المختلفة (عبر الإنترنت):

1. إنشاء حساب Supabase على https://supabase.com
2. إنشاء مشروع جديد
3. تنفيذ ملف supabase-schema.sql
4. نسخ Project URL و anon key
5. إنشاء ملف .env.local وإضافة:
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key

6. تثبيت @supabase/supabase-js:
   npm install @supabase/supabase-js

7. تفعيل Real-time في Supabase Dashboard

8. استبدال notifyDatabaseChange بـ:
   supabase.from('table_name').on('*', callback).subscribe()

===========================================
*/

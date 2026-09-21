// نظام المزامنة اللحظية (Real-time Sync System)
// يدعم المزامنة بين الأجهزة عبر Supabase Realtime
// مع fallback لـ BroadcastChannel للمزامنة المحلية

import { supabase, isSupabaseConfigured } from './supabase';

type SyncCallback = (payload: unknown) => void;

class RealtimeSync {
  private listeners: Map<string, Set<SyncCallback>> = new Map();
  private channels: Map<string, any> = new Map();
  private useSupabase: boolean = false;

  constructor() {
    // التحقق من توفر Supabase
    this.useSupabase = isSupabaseConfigured() && supabase !== null;
    
    if (this.useSupabase) {
      console.log('🔄 Real-time sync: Using Supabase');
    } else {
      console.log('🔄 Real-time sync: Using BroadcastChannel (local only)');
      this.initBroadcastChannel();
    }
  }

  private channel: BroadcastChannel | null = null;
  private storageKey = 'tbos_sync_event';

  private initBroadcastChannel() {
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

  // بث التغييرات
  broadcast(type: string, payload: unknown) {
    const message = { type, payload, timestamp: Date.now() };

    if (this.useSupabase && supabase) {
      // استخدام Supabase للمزامنة بين الأجهزة
      // Supabase يتولى المزامنة تلقائياً عبر Realtime subscriptions
      console.log('📡 Broadcasting via Supabase:', type);
    } else {
      // استخدام BroadcastChannel للمزامنة المحلية
      if (this.channel) {
        try {
          this.channel.postMessage(message);
        } catch (error) {
          console.warn('BroadcastChannel postMessage failed:', error);
        }
      }

      try {
        localStorage.setItem(this.storageKey, JSON.stringify(message));
        setTimeout(() => {
          localStorage.removeItem(this.storageKey);
        }, 100);
      } catch (error) {
        console.warn('Sync storage failed:', error);
      }
    }

    // استدعاء الـ callbacks المحلية
    this.handleMessage(message);
  }

  // الاشتراك في نوع معين من التغييرات
  subscribe(type: string, callback: SyncCallback): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);

    // إذا كان Supabase متاحاً، اشترك في Realtime channel
    if (this.useSupabase && supabase !== null && !this.channels.has(type)) {
      const tableName = this.getTableNameFromType(type);
      if (tableName) {
        const channel = supabase
          .channel(`${tableName}-changes`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: tableName },
            (payload: any) => {
              this.handleMessage({
                type,
                payload: payload.new || payload.old || payload
              });
            }
          )
          .subscribe();

        this.channels.set(type, channel);
      }
    }

    return () => {
      const callbacks = this.listeners.get(type);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(type);
          
          // إلغاء الاشتراك من Supabase channel
          if (this.useSupabase && this.channels.has(type)) {
            const channel = this.channels.get(type);
            if (supabase && channel) {
              supabase.removeChannel(channel);
            }
            this.channels.delete(type);
          }
        }
      }
    };
  }

  // الحصول على اسم الجدول من نوع الحدث
  private getTableNameFromType(type: string): string | null {
    const mapping: Record<string, string> = {
      'courier_added': 'couriers',
      'courier_updated': 'couriers',
      'courier_deleted': 'couriers',
      'trip_created': 'trips',
      'trip_updated': 'trips',
      'stage_changed': 'trip_stages',
      'queue_updated': 'queue',
      'decision_made': 'decisions',
      'inbound_created': 'inbound',
      'inbound_updated': 'inbound',
      'settings_updated': 'branches',
    };
    return mapping[type] || null;
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
    
    if (this.useSupabase && supabase !== null) {
      const supabaseClient = supabase;
      this.channels.forEach(channel => {
        supabaseClient.removeChannel(channel);
      });
    }
    
    this.listeners.clear();
    this.channels.clear();
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
  const eventType = `${table === 'couriers' ? 'courier' : 
                     table === 'trips' ? 'trip' :
                     table === 'stages' ? 'stage' :
                     table === 'queue' ? 'queue' :
                     table === 'decisions' ? 'decision' :
                     table === 'inbound' ? 'inbound' :
                     table === 'branches' ? 'settings' : 'db'}_${action}`;
  
  realtimeSync.broadcast(eventType, {
    table,
    action,
    data,
    timestamp: Date.now(),
  });
}

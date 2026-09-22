// نظام المزامنة اللحظية مع إعادة الاتصال التلقائي
import { RealtimeChannel } from '@supabase/supabase-js';
import { connectionManager, supabase, isSupabaseConfigured } from './supabase';

type SyncCallback = (payload: unknown) => void;

class RealtimeSync {
  private listeners: Map<string, Set<SyncCallback>> = new Map();
  private channels: Map<string, RealtimeChannel> = new Map();
  private unsubscribers: Map<string, () => void> = new Map();
  private useSupabase: boolean = false;

  constructor() {
    // التحقق من توفر Supabase
    this.useSupabase = isSupabaseConfigured() && supabase !== null;
    
    if (this.useSupabase) {
      console.log('🔄 Real-time sync: Using Supabase with auto-reconnect');
      
      // مراقبة حالة الاتصال
      connectionManager.onConnectionStatusChange((status) => {
        console.log(`📡 Connection status: ${status}`);
        
        if (status === 'connected') {
          // إعادة الاشتراك في جميع القنوات عند إعادة الاتصال
          this.resubscribeAll();
        }
      });
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
    if (this.useSupabase && !this.channels.has(type)) {
      const tableName = this.getTableNameFromType(type);
      if (tableName) {
        this.subscribeToTable(type, tableName);
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
            const unsub = this.unsubscribers.get(type);
            if (unsub) {
              unsub();
              this.unsubscribers.delete(type);
            }
            connectionManager.removeChannel(type);
            this.channels.delete(type);
          }
        }
      }
    };
  }

  private subscribeToTable(type: string, tableName: string): void {
    const channel = connectionManager.createChannel(`${tableName}-${type}`);
    
    if (!channel) {
      console.error(`❌ Failed to create channel for ${tableName}`);
      return;
    }

    const subscription = channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tableName },
        (payload: any) => {
          console.log(`📥 Received ${tableName} change:`, payload.eventType);
          this.handleMessage({
            type,
            payload: payload.new || payload.old || payload
          });
        }
      )
      .subscribe((status: string, err?: Error) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Subscribed to ${tableName}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ Channel error for ${tableName}:`, err);
          // سيتم إعادة الاتصال تلقائياً بواسطة ConnectionManager
        } else if (status === 'TIMED_OUT') {
          console.warn(`⏱️ Channel timeout for ${tableName}`);
          // سيتم إعادة الاتصال تلقائياً
        } else if (status === 'CLOSED') {
          console.warn(`🔒 Channel closed for ${tableName}`);
          // سيتم إعادة الاتصال تلقائياً
        }
      });

    this.channels.set(type, channel);
    this.unsubscribers.set(type, () => {
      connectionManager.removeChannel(`${tableName}-${type}`);
    });
  }

  private resubscribeAll(): void {
    console.log('🔄 Resubscribing to all channels...');
    
    const types = Array.from(this.listeners.keys());
    types.forEach(type => {
      const tableName = this.getTableNameFromType(type);
      if (tableName && !this.channels.has(type)) {
        this.subscribeToTable(type, tableName);
      }
    });
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

  // الحصول على حالة الاتصال
  getConnectionStatus(): string {
    return connectionManager.getConnectionStatus();
  }

  // إعادة الاتصال يدوياً
  forceReconnect(): void {
    connectionManager.forceReconnect();
  }

  // تنظيف
  destroy() {
    if (this.channel) {
      this.channel.close();
    }
    
    // إلغاء جميع الاشتراكات
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers.clear();
    this.channels.clear();
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

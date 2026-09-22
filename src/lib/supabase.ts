// Supabase Configuration with Auto-reconnect
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

// ============================================
// 🔐 بيانات الاتصال الحقيقية بـ Supabase
// ============================================
export const SUPABASE_URL = 'https://jkzgpfjaovqxxtrkxalu.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_85-SSPry88Xpsjf0RfOrLg_UoD6rkIk';

// التحقق من التكوين
export const isSupabaseConfigured = (): boolean => {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
};

// ============================================
// 🔄 نظام إعادة الاتصال التلقائي
// ============================================
class SupabaseConnectionManager {
  private client: SupabaseClient | null = null;
  private channels: Map<string, RealtimeChannel> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectDelay: number = 1000; // 1 second
  private maxReconnectDelay: number = 30000; // 30 seconds
  private isReconnecting: boolean = false;
  private connectionStatus: 'connected' | 'disconnected' | 'reconnecting' = 'disconnected';
  private listeners: Set<(status: string) => void> = new Set();

  constructor() {
    this.initializeClient();
  }

  private initializeClient(): void {
    if (!isSupabaseConfigured()) {
      console.warn('⚠️ Supabase not configured');
      return;
    }

    try {
      this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        },
        realtime: {
          params: {
            eventsPerSecond: 10
          },
          headers: {
            'x-client-info': 'tbos-app/1.0.0'
          }
        },
        global: {
          headers: {
            'x-client-info': 'tbos-app/1.0.0'
          },
          fetch: (...args) => {
            return fetch(...args).then(response => {
              // مراقبة حالة الاتصال
              if (!response.ok) {
                this.handleConnectionError(new Error(`HTTP ${response.status}`));
              }
              return response;
            }).catch(error => {
              this.handleConnectionError(error);
              throw error;
            });
          }
        }
      });

      this.connectionStatus = 'connected';
      this.notifyListeners();
      console.log('✅ Supabase client initialized successfully');
      console.log('🌐 URL:', SUPABASE_URL);
    } catch (error) {
      console.error('❌ Failed to initialize Supabase client:', error);
      this.handleConnectionError(error);
    }
  }

  private handleConnectionError(error: any): void {
    console.error('🔌 Connection error:', error);
    
    if (this.connectionStatus !== 'reconnecting') {
      this.connectionStatus = 'disconnected';
      this.notifyListeners();
      this.attemptReconnect();
    }
  }

  private attemptReconnect(): void {
    if (this.isReconnecting || this.reconnectAttempts >= this.maxReconnectAttempts) {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('❌ Max reconnect attempts reached');
      }
      return;
    }

    this.isReconnecting = true;
    this.connectionStatus = 'reconnecting';
    this.notifyListeners();

    // حساب التأخير مع زيادة تدريجية (exponential backoff)
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );

    console.log(`🔄 Attempting reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.reconnectAttempts++;
      this.isReconnecting = false;

      // إعادة تهيئة العميل
      this.initializeClient();

      // إعادة إنشاء جميع القنوات
      if (this.connectionStatus === 'connected') {
        this.resubscribeAllChannels();
        this.reconnectAttempts = 0; // إعادة تعيين العداد عند النجاح
      } else {
        // محاولة إعادة الاتصال مرة أخرى
        this.attemptReconnect();
      }
    }, delay);
  }

  private resubscribeAllChannels(): void {
    console.log(`🔄 Resubscribing ${this.channels.size} channels...`);
    
    const channelConfigs = Array.from(this.channels.entries());
    this.channels.clear();

    channelConfigs.forEach(([channelName, oldChannel]) => {
      // إلغاء الاشتراك القديم
      try {
        if (this.client) {
          this.client.removeChannel(oldChannel);
        }
      } catch (error) {
        console.warn('Failed to remove old channel:', error);
      }
    });

    // سيتم إعادة إنشاء القنوات عند الحاجة
    console.log('✅ Channels will be resubscribed on next subscription');
  }

  // الحصول على العميل
  getClient(): SupabaseClient | null {
    return this.client;
  }

  // الحصول على حالة الاتصال
  getConnectionStatus(): string {
    return this.connectionStatus;
  }

  // الاشتراك في تغييرات حالة الاتصال
  onConnectionStatusChange(listener: (status: string) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.connectionStatus));
  }

  // إنشاء قناة مع إعادة الاتصال التلقائي
  createChannel(channelName: string): RealtimeChannel | null {
    if (!this.client) {
      console.error('❌ Supabase client not initialized');
      return null;
    }

    // إذا كانت القناة موجودة بالفعل، أرجعها
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    // إنشاء قناة جديدة
    const channel = this.client.channel(channelName);
    
    // مراقبة حالة القناة
    channel.on('system', { event: '*' }, (payload: any) => {
      if (payload.status === 'CHANNEL_ERROR') {
        console.error(`❌ Channel ${channelName} error:`, payload);
        this.handleChannelError(channelName);
      } else if (payload.status === 'TIMED_OUT') {
        console.warn(`⏱️ Channel ${channelName} timed out`);
        this.handleChannelError(channelName);
      } else if (payload.status === 'CLOSED') {
        console.warn(`🔒 Channel ${channelName} closed`);
        this.handleChannelError(channelName);
      }
    });

    this.channels.set(channelName, channel);
    return channel;
  }

  private handleChannelError(channelName: string): void {
    console.warn(`🔄 Handling error for channel: ${channelName}`);
    
    // إزالة القناة القديمة
    const oldChannel = this.channels.get(channelName);
    if (oldChannel && this.client) {
      try {
        this.client.removeChannel(oldChannel);
      } catch (error) {
        console.warn('Failed to remove channel:', error);
      }
    }
    this.channels.delete(channelName);

    // إذا كان الاتصال مقطوعاً، سيتم إعادة إنشاء القنوات تلقائياً
    if (this.connectionStatus === 'disconnected' || this.connectionStatus === 'reconnecting') {
      console.log('⏳ Waiting for reconnection...');
    }
  }

  // إزالة قناة
  removeChannel(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel && this.client) {
      try {
        this.client.removeChannel(channel);
      } catch (error) {
        console.warn('Failed to remove channel:', error);
      }
    }
    this.channels.delete(channelName);
  }

  // إزالة جميع القنوات
  removeAllChannels(): void {
    this.channels.forEach((channel, name) => {
      this.removeChannel(name);
    });
  }

  // اختبار الاتصال
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.client) {
      return { success: false, message: 'Client not initialized' };
    }

    try {
      const { data, error } = await this.client
        .from('branches')
        .select('count', { count: 'exact', head: true });

      if (error) {
        this.handleConnectionError(error);
        return { success: false, message: error.message };
      }

      return { 
        success: true, 
        message: `✅ Connected! Found ${data} branches` 
      };
    } catch (error) {
      this.handleConnectionError(error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // إعادة الاتصال يدوياً
  forceReconnect(): void {
    console.log('🔄 Force reconnecting...');
    this.reconnectAttempts = 0;
    this.connectionStatus = 'disconnected';
    this.notifyListeners();
    this.attemptReconnect();
  }
}

// إنشاء نسخة واحدة من Connection Manager
export const connectionManager = new SupabaseConnectionManager();

// تصدير العميل للاستخدام المباشر
export const supabase = connectionManager.getClient();

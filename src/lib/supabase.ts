import { createClient } from '@supabase/supabase-js';

// متغيرات البيئة
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// التحقق من وجود المتغيرات
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase environment variables not set. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

// إنشاء عميل Supabase مع دعم المزامنة اللحظية
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'x-application-name': 'TBOS',
    },
  },
});

// دالة للتحقق من حالة الاتصال
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('branches').select('count').limit(1);
    return !error;
  } catch (error) {
    console.error('Supabase connection check failed:', error);
    return false;
  }
};

// دالة للاشتراك في تغييرات جدول معين (Realtime)
export const subscribeToTable = (
  tableName: string,
  callback: (payload: any) => void
) => {
  return supabase
    .channel(`table-${tableName}-changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: tableName,
      },
      callback
    )
    .subscribe();
};

// دالة لإلغاء الاشتراك من قناة
export const unsubscribeFromChannel = (channel: any) => {
  if (channel) {
    supabase.removeChannel(channel);
  }
};

// تصدير أنواع البيانات (Types)
export type Database = {
  public: {
    Tables: {
      branches: {
        Row: {
          id: string;
          name: string;
          code: string;
          cashier_capacity: number;
          cashier_occupancy: number;
          dock_capacity: number;
          dock_occupancy: number;
          max_queue: number;
          operational_status: 'ACTIVE' | 'PAUSED';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['branches']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['branches']['Insert']>;
      };
      couriers: {
        Row: {
          id: string;
          code: string;
          name: string;
          phone: string;
          branch_id: string;
          status: 'AVAILABLE' | 'ON_TRIP' | 'WAITING' | 'IN_CASHIER' | 'COMPLETED';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['couriers']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['couriers']['Insert']>;
      };
      trips: {
        Row: {
          id: string;
          trip_number: string;
          courier_id: string;
          branch_id: string;
          arrival_at: string;
          completed_at: string | null;
          current_stage: string;
          status: 'ACTIVE' | 'WAITING' | 'COMPLETED' | 'CANCELLED';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['trips']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['trips']['Insert']>;
      };
      trip_stages: {
        Row: {
          id: string;
          trip_id: string;
          stage: string;
          status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
          started_at: string | null;
          finished_at: string | null;
          duration_seconds: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['trip_stages']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['trip_stages']['Insert']>;
      };
      queue: {
        Row: {
          id: string;
          trip_id: string;
          branch_id: string;
          queue_number: number;
          priority: number;
          entered_at: string;
          status: 'WAITING' | 'PROMOTED' | 'COMPLETED';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['queue']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['queue']['Insert']>;
      };
      decisions: {
        Row: {
          id: string;
          trip_id: string;
          branch_id: string;
          decision: string;
          reason_ar: string;
          reason_en: string;
          priority: number;
          queue_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['decisions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['decisions']['Insert']>;
      };
      inbound: {
        Row: {
          id: string;
          inbound_number: string;
          driver_name: string;
          driver_code: string;
          container_number: string;
          container_type: string;
          branch_id: string;
          status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['inbound']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['inbound']['Insert']>;
      };
      inbound_items: {
        Row: {
          id: string;
          inbound_id: string;
          item_name: string;
          item_code: string;
          quantity: number;
          unit: string;
          notes: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['inbound_items']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['inbound_items']['Insert']>;
      };
      users: {
        Row: {
          id: string;
          username: string;
          password_hash: string;
          name: string;
          role: 'ADMIN' | 'SUPERVISOR' | 'WAREHOUSE' | 'CASHIER' | 'COURIER' | 'VIEWER';
          branch_id: string | null;
          courier_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
    };
  };
};

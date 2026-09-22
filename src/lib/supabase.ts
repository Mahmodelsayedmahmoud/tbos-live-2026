// Supabase Configuration - TBOS Cloud Database
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================
// 🔐 بيانات الاتصال الحقيقية بـ Supabase
// ============================================
export const SUPABASE_URL = 'https://jkzgpfjaovqxxtrkxalu.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_85-SSPry88Xpsjf0RfOrLg_UoD6rkIk';

// التحقق من التكوين
export const isSupabaseConfigured = (): boolean => {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
};

// إنشاء عميل Supabase
let supabaseClient: SupabaseClient | null = null;

try {
  if (isSupabaseConfigured()) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      },
      global: {
        headers: {
          'x-client-info': 'tbos-app/1.0.0'
        }
      }
    });
    
    console.log('✅ Supabase client initialized successfully');
    console.log('🌐 URL:', SUPABASE_URL);
  } else {
    console.warn('⚠️ Supabase not configured. Using localStorage fallback.');
  }
} catch (error) {
  console.error('❌ Failed to initialize Supabase client:', error);
}

export const supabase = supabaseClient;

// اختبار الاتصال
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  if (!supabase) {
    return { success: false, message: 'Supabase client not initialized' };
  }

  try {
    const { data, error } = await supabase
      .from('branches')
      .select('count', { count: 'exact', head: true });

    if (error) {
      return { success: false, message: error.message };
    }

    return { 
      success: true, 
      message: `✅ Connected! Found ${data} branches` 
    };
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

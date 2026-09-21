// Supabase Configuration - TBOS Cloud Database
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// بيانات المشروع الحقيقية
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jkzgpfjaovqxxtrkxalu.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_85-SSPry88Xpsjf0RfOrLg_UoD6rkIk';

// التحقق من التكوين
export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey && 
         !supabaseUrl.includes('your-project') && 
         !supabaseAnonKey.includes('your-anon-key'));
};

// إنشاء عميل Supabase
let supabaseClient: SupabaseClient | null = null;

try {
  if (isSupabaseConfigured()) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
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
    console.log('🌐 URL:', supabaseUrl);
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

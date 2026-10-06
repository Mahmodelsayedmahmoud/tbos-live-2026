import { createClient } from '@supabase/supabase-js';

// بيانات الاتصال الحقيقية بـ Supabase
const supabaseUrl = 'https://jkzgpfjaovqxxtrkxalu.supabase.co';
const supabaseAnonKey = 'sb_publishable_85-SSPry88Xpsjf0RfOrLg_UoD6rkIk';

// إنشاء عميل Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// التحقق من حالة الاتصال
export const checkConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('branches')
      .select('count', { count: 'exact', head: true });
    return !error;
  } catch (error) {
    console.error('Connection check failed:', error);
    return false;
  }
};

import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase-config';
import { Lang } from '../lib/i18n';

interface ConnectionStatusProps {
  lang: Lang;
}

export default function ConnectionStatus({ lang }: ConnectionStatusProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkConnection();
    
    // فحص الاتصال كل 30 ثانية
    const interval = setInterval(checkConnection, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const checkConnection = async () => {
    setIsChecking(true);
    
    try {
      if (!isSupabaseConfigured()) {
        setIsConnected(false);
        setIsChecking(false);
        return;
      }

      // محاولة جلب بيانات بسيطة للتحقق من الاتصال
      const { error } = await supabase!
        .from('branches')
        .select('count', { count: 'exact', head: true });

      setIsConnected(!error);
    } catch (error) {
      console.error('Connection check failed:', error);
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  };

  const statusColor = isConnected ? 'bg-green-500' : 'bg-red-500';
  const statusText = isConnected 
    ? (lang === 'ar' ? 'متصل' : 'Online')
    : (lang === 'ar' ? 'غير متصل' : 'Offline');
  
  const statusTooltip = isConnected
    ? (lang === 'ar' ? 'التطبيق متصل بقاعدة البيانات ويعمل بشكل حي' : 'Application is connected to database and working in real-time')
    : (lang === 'ar' ? 'التطبيق غير متصل بقاعدة البيانات' : 'Application is not connected to database');

  return (
    <div 
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
      onClick={checkConnection}
      title={statusTooltip}
    >
      {/* نقطة الحالة */}
      <div className="relative">
        <div className={`w-2.5 h-2.5 rounded-full ${statusColor} ${isChecking ? 'animate-pulse' : ''}`}></div>
        {isConnected && (
          <div className={`absolute inset-0 w-2.5 h-2.5 rounded-full ${statusColor} animate-ping opacity-75`}></div>
        )}
      </div>

      {/* أيقونة */}
      {isConnected ? (
        <Wifi size={14} className="text-green-600" />
      ) : (
        <WifiOff size={14} className="text-red-600" />
      )}

      {/* نص الحالة */}
      <span className={`text-xs font-semibold ${isConnected ? 'text-green-700' : 'text-red-700'}`}>
        {statusText}
      </span>

      {/* مؤشر التحديث */}
      {isChecking && (
        <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
      )}
    </div>
  );
}

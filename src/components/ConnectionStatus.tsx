import * as React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { Lang } from '../lib/i18n';
import * as db from '../lib/db';

interface ConnectionStatusProps {
  lang: Lang;
}

export default function ConnectionStatus({ lang }: ConnectionStatusProps) {
  const [isConnected, setIsConnected] = React.useState(true);
  const [isChecking, setIsChecking] = React.useState(false);

  React.useEffect(() => {
    // فحص الاتصال مع localStorage
    checkConnection();
    
    // فحص الاتصال كل 30 ثانية
    const interval = setInterval(checkConnection, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const checkConnection = () => {
    setIsChecking(true);
    
    try {
      // التحقق من أن localStorage يعمل
      const testKey = '__tbos_connection_test__';
      localStorage.setItem(testKey, 'test');
      const value = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      // التحقق من أن البيانات موجودة
      const branches = db.getBranches();
      const isConnectedNow = value === 'test' && branches.length > 0;
      
      setIsConnected(isConnectedNow);
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
      className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
      onClick={checkConnection}
      title={statusTooltip}
    >
      {/* نقطة الحالة */}
      <div className="relative">
        <div className={`w-2 h-2 rounded-full ${statusColor} ${isChecking ? 'animate-pulse' : ''}`}></div>
        {isConnected && (
          <div className={`absolute inset-0 w-2 h-2 rounded-full ${statusColor} animate-ping opacity-75`}></div>
        )}
      </div>

      {/* أيقونة */}
      {isConnected ? (
        <Wifi size={12} className="text-green-600" />
      ) : (
        <WifiOff size={12} className="text-red-600" />
      )}

      {/* نص الحالة */}
      <span className={`text-xs font-semibold ${isConnected ? 'text-green-700' : 'text-red-700'}`}>
        {statusText}
      </span>

      {/* مؤشر التحديث */}
      {isChecking && (
        <div className="w-2.5 h-2.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
      )}
    </div>
  );
}

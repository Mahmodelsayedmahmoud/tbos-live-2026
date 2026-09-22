import * as React from 'react';
import { Wifi, WifiOff, RefreshCw, Cloud, CloudOff, AlertCircle } from 'lucide-react';
import { connectionManager } from '../lib/supabase';
import { realtimeSync } from '../lib/sync';

interface ConnectionStatusProps {
  lang?: 'ar' | 'en';
}

export default function ConnectionStatus({ lang = 'ar' }: ConnectionStatusProps) {
  const [connectionStatus, setConnectionStatus] = React.useState<string>(connectionManager.getConnectionStatus());
  const [isReconnecting, setIsReconnecting] = React.useState(false);

  React.useEffect(() => {
    // مراقبة حالة الاتصال
    const unsubscribe = connectionManager.onConnectionStatusChange((status) => {
      setConnectionStatus(status);
      setIsReconnecting(status === 'reconnecting');
    });

    return unsubscribe;
  }, []);

  const handleReconnect = () => {
    console.log('🔄 Manual reconnect triggered');
    realtimeSync.forceReconnect();
  };

  const isConnected = connectionStatus === 'connected';
  const isDisconnected = connectionStatus === 'disconnected';
  const isReconnectingStatus = connectionStatus === 'reconnecting';

  const getStatusColor = () => {
    if (isConnected) return 'bg-green-500';
    if (isReconnectingStatus) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusIcon = () => {
    if (isConnected) return <Cloud size={12} className="text-green-600" />;
    if (isReconnectingStatus) return <RefreshCw size={12} className="text-yellow-600 animate-spin" />;
    return <CloudOff size={12} className="text-red-600" />;
  };

  const getStatusText = () => {
    if (isConnected) return lang === 'ar' ? 'متصل' : 'Connected';
    if (isReconnectingStatus) return lang === 'ar' ? 'جاري إعادة الاتصال...' : 'Reconnecting...';
    return lang === 'ar' ? 'غير متصل' : 'Disconnected';
  };

  const getStatusTooltip = () => {
    if (isConnected) {
      return lang === 'ar' 
        ? 'التطبيق متصل بـ Supabase ويعمل بشكل حي' 
        : 'Application is connected to Supabase and working in real-time';
    }
    if (isReconnectingStatus) {
      return lang === 'ar'
        ? 'جاري محاولة إعادة الاتصال بـ Supabase...'
        : 'Attempting to reconnect to Supabase...';
    }
    return lang === 'ar'
      ? 'التطبيق غير متصل بـ Supabase - انقر لإعادة الاتصال'
      : 'Application is not connected to Supabase - Click to reconnect';
  };

  return (
    <div 
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-sm border shadow-sm transition-all cursor-pointer ${
        isConnected 
          ? 'bg-green-50/80 border-green-200 hover:bg-green-100/80' 
          : isReconnectingStatus
          ? 'bg-yellow-50/80 border-yellow-200 hover:bg-yellow-100/80'
          : 'bg-red-50/80 border-red-200 hover:bg-red-100/80'
      }`}
      onClick={isDisconnected ? handleReconnect : undefined}
      title={getStatusTooltip()}
    >
      {/* نقطة الحالة */}
      <div className="relative">
        <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor()} ${isReconnectingStatus ? 'animate-pulse' : ''}`}></div>
        {isConnected && (
          <div className={`absolute inset-0 w-2.5 h-2.5 rounded-full ${getStatusColor()} animate-ping opacity-75`}></div>
        )}
      </div>

      {/* أيقونة */}
      {getStatusIcon()}

      {/* نص الحالة */}
      <span className={`text-xs font-semibold ${
        isConnected ? 'text-green-700' : 
        isReconnectingStatus ? 'text-yellow-700' : 
        'text-red-700'
      }`}>
        {getStatusText()}
      </span>

      {/* زر إعادة الاتصال اليدوي */}
      {isDisconnected && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleReconnect();
          }}
          className="ml-1 p-1 rounded-full hover:bg-red-200 transition-colors"
          title={lang === 'ar' ? 'إعادة الاتصال' : 'Reconnect'}
        >
          <RefreshCw size={12} className="text-red-700" />
        </button>
      )}

      {/* مؤشر إعادة الاتصال */}
      {isReconnectingStatus && (
        <div className="ml-1 text-xs text-yellow-700">
          {lang === 'ar' ? '🔄' : '🔄'}
        </div>
      )}
    </div>
  );
}

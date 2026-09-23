import * as React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { Lang } from '../lib/i18n';

interface ConnectionStatusProps {
  lang: Lang;
}

export default function ConnectionStatus({ lang }: ConnectionStatusProps) {
  const [isConnected, setIsConnected] = React.useState(true);

  React.useEffect(() => {
    const checkConnection = () => {
      try {
        const testKey = '__tbos_connection_test__';
        localStorage.setItem(testKey, 'test');
        const value = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);
        setIsConnected(value === 'test');
      } catch (error) {
        setIsConnected(false);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const statusColor = isConnected ? 'bg-green-500' : 'bg-red-500';
  const statusText = isConnected 
    ? (lang === 'ar' ? 'متصل' : 'Online')
    : (lang === 'ar' ? 'غير متصل' : 'Offline');
  
  const statusTooltip = isConnected
    ? (lang === 'ar' ? 'التطبيق متصل ويعمل بشكل طبيعي' : 'Application is connected and working normally')
    : (lang === 'ar' ? 'التطبيق غير متصل' : 'Application is not connected');

  return (
    <div 
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
      title={statusTooltip}
    >
      <div className="relative">
        <div className={`w-2.5 h-2.5 rounded-full ${statusColor} ${!isConnected ? 'animate-pulse' : ''}`}></div>
        {isConnected && (
          <div className={`absolute inset-0 w-2.5 h-2.5 rounded-full ${statusColor} animate-ping opacity-75`}></div>
        )}
      </div>

      {isConnected ? (
        <Wifi size={14} className="text-green-600" />
      ) : (
        <WifiOff size={14} className="text-red-600" />
      )}

      <span className={`text-xs font-semibold ${isConnected ? 'text-green-700' : 'text-red-700'}`}>
        {statusText}
      </span>
    </div>
  );
}

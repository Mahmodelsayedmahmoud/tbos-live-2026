import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { Lang } from '../lib/i18n';

interface LiveClockProps {
  lang: Lang;
}

export default function LiveClock({ lang }: LiveClockProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    // تحديث الوقت كل ثانية
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // تنسيق الوقت
  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  // تنسيق التاريخ
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return date.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', options);
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200">
      <Clock size={16} className="text-purple-600 animate-pulse" />
      <div className="text-right">
        <div className="text-lg font-mono font-bold text-gray-800 tracking-wider">
          {formatTime(time)}
        </div>
        <div className="text-xs text-gray-500">
          {formatDate(time)}
        </div>
      </div>
    </div>
  );
}

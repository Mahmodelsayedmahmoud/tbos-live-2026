import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { themeManager, Theme } from '../lib/theme';
import { Lang } from '../lib/i18n';

interface ThemeToggleProps {
  lang: Lang;
}

export default function ThemeToggle({ lang }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>(themeManager.getTheme());

  useEffect(() => {
    // الاشتراك في تغييرات الثيم
    const unsubscribe = themeManager.subscribe((newTheme) => {
      setTheme(newTheme);
    });

    return unsubscribe;
  }, []);

  const handleToggle = () => {
    themeManager.toggleTheme();
  };

  const isDark = theme === 'dark';

  return (
    <div className="flex items-center gap-2">
      {/* Toggle Switch */}
      <button
        onClick={handleToggle}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full
          transition-colors duration-300 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
          ${isDark ? 'bg-indigo-600' : 'bg-gray-300'}
        `}
        role="switch"
        aria-checked={isDark}
        title={isDark 
          ? (lang === 'ar' ? 'التبديل إلى الوضع الفاتح' : 'Switch to Light Mode')
          : (lang === 'ar' ? 'التبديل إلى الوضع الداكن' : 'Switch to Dark Mode')
        }
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white
            transition-transform duration-300 ease-in-out
            shadow-md
            ${isDark ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>

      {/* Label with Icon */}
      <div className="flex items-center gap-1.5">
        {isDark ? (
          <Moon size={16} className="text-indigo-600" />
        ) : (
          <Sun size={16} className="text-gray-600" />
        )}
        <span className={`text-xs font-medium ${isDark ? 'text-indigo-600' : 'text-gray-600'}`}>
          {isDark 
            ? (lang === 'ar' ? 'داكن' : 'Dark')
            : (lang === 'ar' ? 'فاتح' : 'Light')
          }
        </span>
      </div>
    </div>
  );
}

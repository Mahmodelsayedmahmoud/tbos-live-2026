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
    <button
      onClick={handleToggle}
      className={`
        relative flex items-center justify-center
        w-12 h-12 rounded-xl
        transition-all duration-300 ease-in-out
        ${isDark 
          ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400' 
          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
        }
        shadow-md hover:shadow-lg
      `}
      title={isDark 
        ? (lang === 'ar' ? 'التبديل إلى الوضع الفاتح' : 'Switch to Light Mode')
        : (lang === 'ar' ? 'التبديل إلى الوضع الداكن' : 'Switch to Dark Mode')
      }
    >
      {isDark ? (
        <Sun size={20} className="transition-transform duration-300 rotate-0" />
      ) : (
        <Moon size={20} className="transition-transform duration-300 rotate-0" />
      )}
    </button>
  );
}

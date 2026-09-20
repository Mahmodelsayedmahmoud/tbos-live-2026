// نظام إدارة الثيمات (Theme Management System)

export type Theme = 'light' | 'dark';

class ThemeManager {
  private currentTheme: Theme;
  private listeners: ((theme: Theme) => void)[] = [];
  private readonly STORAGE_KEY = 'tbos_theme';

  constructor() {
    // تحميل الثيم المحفوظ أو استخدام الوضع الفاتح كافتراضي
    this.currentTheme = this.loadTheme();
    this.applyTheme();
  }

  // تحميل الثيم من التخزين المحلي
  private loadTheme(): Theme {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
    return 'light';
  }

  // حفظ الثيم في التخزين المحلي
  private saveTheme(theme: Theme): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, theme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  }

  // تطبيق الثيم على الصفحة
  private applyTheme(): void {
    const root = document.documentElement;
    
    // إزالة كلا الثيمين أولاً
    root.classList.remove('light', 'dark');
    
    // إضافة الثيم الحالي
    root.classList.add(this.currentTheme);
    
    // تحديث لون الخلفية
    if (this.currentTheme === 'dark') {
      document.body.style.backgroundColor = '#1a1a1a';
      document.body.style.color = '#ffffff';
    } else {
      document.body.style.backgroundColor = '#f8fafc';
      document.body.style.color = '#1e293b';
    }
  }

  // الحصول على الثيم الحالي
  getTheme(): Theme {
    return this.currentTheme;
  }

  // تبديل الثيم
  toggleTheme(): Theme {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.saveTheme(this.currentTheme);
    this.applyTheme();
    this.notifyListeners();
    return this.currentTheme;
  }

  // تعيين ثيم محدد
  setTheme(theme: Theme): void {
    this.currentTheme = theme;
    this.saveTheme(theme);
    this.applyTheme();
    this.notifyListeners();
  }

  // الاشتراك في تغييرات الثيم
  subscribe(listener: (theme: Theme) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // إشعار المستمعين بالتغيير
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentTheme));
  }

  // التحقق من الوضع الداكن
  isDark(): boolean {
    return this.currentTheme === 'dark';
  }

  // التحقق من الوضع الفاتح
  isLight(): boolean {
    return this.currentTheme === 'light';
  }
}

// إنشاء نسخة واحدة من ThemeManager
export const themeManager = new ThemeManager();

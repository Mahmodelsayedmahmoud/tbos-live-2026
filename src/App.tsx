import * as React from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, LogIn, LogOut, Menu, X, Users, Truck, FileText, Settings,
  ClipboardList, Package, ArrowDownCircle, Play, Square, Clock, AlertTriangle,
  CheckCircle, BarChart3, Layers, Globe, Zap, Printer, Share2, TrendingUp, Upload, Download, Activity, RefreshCw, Edit, Trash2, Database
} from 'lucide-react';
import { Lang, t, formatDuration, formatTime } from './lib/i18n';
import * as db from './lib/db';
import * as XLSX from 'xlsx';
import NotificationToast from './components/NotificationToast';
import * as permissions from './lib/permissions';
import { notifyCourierCheckIn, notifyStageStarted, notifyStageCompleted, notifyDecision } from './lib/notifications';
import DashboardKPIs from './components/DashboardKPIs';
import ActivityLogViewer from './components/ActivityLog';
import { logActivity } from './lib/auditLog';
import { exportTripsReport, exportCouriersReport, exportInboundReport, exportPerformanceReport } from './lib/exportUtils';
import ThemeToggle from './components/ThemeToggle';
import ConnectionStatus from './components/ConnectionStatus';
import UserAvatar from './components/UserAvatar';
import BranchSelector from './components/BranchSelector';
import LiveClock from './components/LiveClock';
import DatabaseSetup from './pages/DatabaseSetup';

// Context
interface AppContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  user: db.User | null;
  setUser: (u: db.User | null) => void;
  refresh: () => void;
}

const AppContext = React.createContext<AppContextType>({
  lang: 'ar',
  setLang: () => {},
  user: null,
  setUser: () => {},
  refresh: () => {},
});

function useApp() {
  return React.useContext(AppContext);
}

// Protected Route
function ProtectedRoute({ children, requiredPermission }: { children: React.ReactNode; requiredPermission?: permissions.Permission }) {
  const { user, lang } = useApp();
  const location = useLocation();
  
  if (!user) return <Navigate to="/login" replace />;
  
  if (requiredPermission && !permissions.hasPermission(user.role, requiredPermission)) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-8">
          <AlertTriangle size={64} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {lang === 'ar' ? 'ليس لديك صلاحية الوصول' : 'Access Denied'}
          </h2>
          <p className="text-gray-600 mb-4">
            {lang === 'ar' ? 'ليس لديك صلاحية للوصول إلى هذه الصفحة' : 'You do not have permission to access this page'}
          </p>
          <button
            onClick={() => window.history.back()}
            className="btn btn-primary"
          >
            {lang === 'ar' ? 'العودة' : 'Go Back'}
          </button>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}

// Layout
function Layout({ children }: { children: React.ReactNode }) {
  const { lang, setLang, user, setUser } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const handleLogout = () => {
    db.logout();
    setUser(null);
    navigate('/login');
  };

  const navItems = [
    { path: '/', icon: Home, label: 'nav.home', perm: 'view_dashboard' },
    { path: '/inbound', icon: Package, label: 'nav.inbound', perm: 'view_inbound' },
    { path: '/incoming', icon: ArrowDownCircle, label: 'nav.incoming', perm: 'view_inbound' },
    { path: '/couriers', icon: Truck, label: 'nav.couriers', perm: 'view_couriers' },
    { path: '/preparation', icon: Package, label: 'nav.preparation', perm: 'view_workflow' },
    { path: '/inventory', icon: ClipboardList, label: 'nav.inventory', perm: 'view_workflow' },
    { path: '/loading', icon: Truck, label: 'nav.loading', perm: 'view_workflow' },
    { path: '/workflow', icon: Layers, label: 'nav.workflow', perm: 'view_workflow' },
    { path: '/trips', icon: FileText, label: 'nav.trips', perm: 'view_trips' },
    { path: '/cashier', icon: ClipboardList, label: 'nav.cashier', perm: 'view_cashier' },
    { path: '/queue', icon: Clock, label: 'nav.queue', perm: 'view_queue' },
    { path: '/reports', icon: BarChart3, label: 'nav.reports', perm: 'view_reports' },
    { path: '/performance', icon: TrendingUp, label: 'nav.performance', perm: 'view_performance' },
    { path: '/dashboard-kpis', icon: BarChart3, label: 'nav.dashboard_kpis', perm: 'view_dashboard' },
    { path: '/activity-log', icon: Activity, label: 'nav.activity_log', perm: 'view_dashboard' },
    { path: '/users', icon: Users, label: 'nav.users', perm: 'view_users' },
    { path: '/settings', icon: Settings, label: 'nav.settings', perm: 'view_settings' },
  ];

  const filteredNav = navItems.filter(item => {
    if (!item.perm) return true;
    if (!user) return false;
    return permissions.hasPermission(user.role, item.perm as permissions.Permission);
  });

  return (
    <div className="app-container">
      {/* نظام التنبيهات البصرية */}
      <NotificationToast />
      
      {/* Sidebar Overlay للموبايل */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="flex flex-col h-full">
          {/* Logo - Compact */}
          <div className="p-3 border-b border-gray-700">
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              <Zap size={18} />
              TBOS
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">Operations System</p>
          </div>

          {/* User Profile Section - Compact */}
          {user && (
            <div className="p-3 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <UserAvatar 
                  userName={user.name} 
                  userRole={user.role} 
                  size="lg"
                  editable={true}
                  onImageUpload={(imageUrl) => {
                    localStorage.setItem(`user_avatar_${user.id}`, imageUrl);
                  }}
                />
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    <span className="inline-block px-2 py-0.5 bg-indigo-600/30 text-indigo-300 rounded-full text-xs font-medium">
                      {user.role}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation - Compact */}
          <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {filteredNav.map(item => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
              >
                <item.icon size={16} />
                <span>{t(item.label, lang)}</span>
              </Link>
            ))}
          </nav>

          {/* Footer - Theme & Settings - Compact */}
          <div className="border-t border-gray-700">
            {/* Theme Control Section - Compact */}
            <div className="p-2 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-indigo-600/30 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-300">
                      {lang === 'ar' ? 'الوضع الليلي' : 'Dark Mode'}
                    </p>
                  </div>
                </div>
                <ThemeToggle lang={lang} />
              </div>
            </div>

            {/* Actions - Compact */}
            <div className="p-2 space-y-1.5">
              <button
                onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
                className="btn btn-outline w-full text-xs py-1.5"
              >
                <Globe size={12} />
                {lang === 'ar' ? 'English' : 'عربي'}
              </button>

              <button onClick={handleLogout} className="btn btn-danger w-full text-xs py-1.5">
                <LogOut size={14} />
                {t('nav.logout', lang)}
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="main-content">
        <header className="app-header">
          <div className="header-section header-right">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-md hover:bg-gray-100 transition-colors"
              title={lang === 'ar' ? 'القائمة' : 'Menu'}
            >
              <Menu size={18} />
            </button>

            <BranchSelector lang={lang} />
          </div>

          <div className="header-section header-center hide-mobile">
            <button
              onClick={() => window.print()}
              className="btn btn-outline text-xs py-1 px-2"
              title={lang === 'ar' ? 'طباعة' : 'Print'}
            >
              <Printer size={14} />
              <span className="hidden lg:inline">{lang === 'ar' ? 'طباعة' : 'Print'}</span>
            </button>
            <button
              onClick={async () => {
                if (navigator.share) {
                  try {
                    await navigator.share({
                      title: 'TBOS',
                      text: lang === 'ar' ? 'نظام إدارة العمليات التجارية' : 'Trans Business Operations System',
                      url: window.location.href,
                    });
                  } catch (err) {
                    navigator.clipboard.writeText(window.location.href);
                    alert(lang === 'ar' ? 'تم نسخ الرابط!' : 'Link copied!');
                  }
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert(lang === 'ar' ? 'تم نسخ الرابط!' : 'Link copied!');
                }
              }}
              className="btn btn-outline text-xs py-1 px-2"
              title={lang === 'ar' ? 'مشاركة' : 'Share'}
            >
              <Share2 size={14} />
              <span className="hidden lg:inline">{lang === 'ar' ? 'مشاركة' : 'Share'}</span>
            </button>
          </div>

          <div className="header-section header-left">
            <LiveClock lang={lang} />
            <ConnectionStatus lang={lang} />
          </div>
        </header>
        <main className="content-area">
          {children}
        </main>
      </div>
    </div>
  );
}

// Login Page
function LoginPage() {
  const { lang, setUser, setLang } = useApp();
  const navigate = useNavigate();
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = db.login(username, password);
    if (result.success && result.user) {
      setUser(result.user);
      navigate('/');
    } else {
      setError(t('login.error', lang));
    }
  };

  const handleDemoClick = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
  };

  return (
    <div className="login-bg">
      <button
        onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
        className="absolute top-6 left-6 btn btn-outline text-white/80 border-white/20 hover:bg-white/10"
      >
        <Globe size={16} />
        {lang === 'ar' ? 'English' : 'عربي'}
      </button>

      <div className="login-card animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg mb-4">
            <Zap size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">TBOS</h1>
          <p className="text-gray-500 mt-2 text-sm">Trans Business Operations System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('login.username', lang)}</label>
            <input
              type="text"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(''); }}
              className="input"
              placeholder="admin"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('login.password', lang)}</label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              className="input"
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-full py-3">
            <LogIn size={18} />
            {t('login.submit', lang)}
          </button>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs font-medium text-gray-600 mb-2">حسابات تجريبية (انقر للتعبئة):</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button onClick={() => handleDemoClick('admin', 'admin123')} className="p-2 bg-white rounded border hover:border-indigo-500 hover:bg-indigo-50 transition-all text-right">
              <span className="font-medium">admin</span> / admin123
            </button>
            <button onClick={() => handleDemoClick('supervisor', 'super123')} className="p-2 bg-white rounded border hover:border-indigo-500 hover:bg-indigo-50 transition-all text-right">
              <span className="font-medium">supervisor</span> / super123
            </button>
            <button onClick={() => handleDemoClick('warehouse', 'wh123')} className="p-2 bg-white rounded border hover:border-indigo-500 hover:bg-indigo-50 transition-all text-right">
              <span className="font-medium">warehouse</span> / wh123
            </button>
            <button onClick={() => handleDemoClick('cashier', 'cash123')} className="p-2 bg-white rounded border hover:border-indigo-500 hover:bg-indigo-50 transition-all text-right">
              <span className="font-medium">cashier</span> / cash123
            </button>
            <button onClick={() => handleDemoClick('courier', 'cr123')} className="p-2 bg-white rounded border hover:border-indigo-500 hover:bg-indigo-50 transition-all text-right">
              <span className="font-medium">courier</span> / cr123
            </button>
            <button onClick={() => handleDemoClick('viewer', 'view123')} className="p-2 bg-white rounded border hover:border-indigo-500 hover:bg-indigo-50 transition-all text-right">
              <span className="font-medium">viewer</span> / view123
            </button>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => navigate('/setup-db')}
              className="w-full text-xs text-indigo-600 hover:text-indigo-700 hover:underline flex items-center justify-center gap-1"
            >
              <Database size={14} />
              {lang === 'ar' ? 'إعداد قاعدة البيانات (Supabase)' : 'Database Setup (Supabase)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dashboard Page
function DashboardPage() {
  const { lang, refresh } = useApp();
  const [stats, setStats] = React.useState(db.getDashboardStats());
  const [branches] = React.useState(db.getBranches());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setStats(db.getDashboardStats());
      refresh();
    }, 3000);
    return () => clearInterval(interval);
  }, [refresh]);

  const kpis = [
    { label: t('dashboard.trips_today', lang), value: stats.totalToday, color: 'bg-blue-50 text-blue-700' },
    { label: t('dashboard.active_trips', lang), value: stats.active, color: 'bg-green-50 text-green-700' },
    { label: t('dashboard.on_dock', lang), value: stats.onDock, color: 'bg-purple-50 text-purple-700' },
    { label: t('dashboard.in_preparation', lang), value: stats.inPrep, color: 'bg-yellow-50 text-yellow-700' },
    { label: t('dashboard.in_inventory', lang), value: stats.inInventory, color: 'bg-orange-50 text-orange-700' },
    { label: t('dashboard.in_loading', lang), value: stats.inLoading, color: 'bg-pink-50 text-pink-700' },
    { label: t('dashboard.in_cashier', lang), value: stats.inCashier, color: 'bg-cyan-50 text-cyan-700' },
    { label: t('dashboard.in_queue', lang), value: stats.inQueue, color: 'bg-red-50 text-red-700' },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      <h2 className="text-2xl font-bold text-gray-800">{t('dashboard.title', lang)}</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className={`card p-4 ${kpi.color}`}>
            <p className="text-3xl font-bold">{kpi.value}</p>
            <p className="text-sm mt-1 opacity-80">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {branches.map(branch => (
          <div key={branch.id} className="card p-4">
            <h3 className="font-semibold text-gray-800 mb-3">{branch.name} ({branch.code})</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className={`p-3 rounded-lg ${branch.cashierOccupancy < branch.cashierCapacity ? 'bg-green-50' : 'bg-red-50'}`}>
                <p className="text-xs text-gray-600">{t('cashier.title', lang)}</p>
                <p className="text-xl font-bold">
                  {branch.cashierOccupancy} / {branch.cashierCapacity}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-orange-50">
                <p className="text-xs text-gray-600">{t('nav.queue', lang)}</p>
                <p className="text-xl font-bold">
                  {db.getQueue(branch.id).filter(q => q.status === 'WAITING').length}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Main App
export default function App() {
  const [lang, setLang] = React.useState<Lang>('ar');
  const [user, setUser] = React.useState<db.User | null>(db.getCurrentUser());
  const [, setRefreshTick] = React.useState(0);

  const refresh = () => setRefreshTick(t => t + 1);

  React.useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  React.useEffect(() => {
    const currentUser = db.getCurrentUser();
    if (currentUser) setUser(currentUser);
  }, []);

  return (
    <AppContext.Provider value={{ lang, setLang, user, setUser, refresh }}>
      <HashRouter>
        <Routes>
          <Route path="/setup-db" element={<DatabaseSetup />} />
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
          <Route path="/" element={
            <ProtectedRoute requiredPermission="view_dashboard">
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </HashRouter>
    </AppContext.Provider>
  );
}

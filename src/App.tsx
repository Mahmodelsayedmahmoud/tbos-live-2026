import React, { createContext, useContext, useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, LogIn, LogOut, Menu, X, Users, Truck, FileText, Settings,
  ClipboardList, Package, ArrowDownCircle, Play, Square, Clock, AlertTriangle,
  CheckCircle, BarChart3, Layers, Globe, Zap, Printer, Share2, TrendingUp, Upload, Download
} from 'lucide-react';
import { Lang, t, formatDuration, formatTime } from './lib/i18n';
import * as db from './lib/db';
import * as XLSX from 'xlsx';

// Context
interface AppContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  user: db.User | null;
  setUser: (u: db.User | null) => void;
  refresh: () => void;
}

const AppContext = createContext<AppContextType>({
  lang: 'ar',
  setLang: () => {},
  user: null,
  setUser: () => {},
  refresh: () => {},
});

function useApp() {
  return useContext(AppContext);
}

// Protected Route
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useApp();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// Layout
function Layout({ children }: { children: React.ReactNode }) {
  const { lang, setLang, user, setUser } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    db.logout();
    setUser(null);
    navigate('/login');
  };

  const navItems = [
    { path: '/', icon: Home, label: 'nav.home', perm: null },
    { path: '/inbound', icon: Package, label: 'nav.inbound', perm: 'trips.create' },
    { path: '/incoming', icon: ArrowDownCircle, label: 'nav.incoming', perm: 'trips.create' },
    { path: '/couriers', icon: Truck, label: 'nav.couriers', perm: 'couriers.read' },
    { path: '/preparation', icon: Package, label: 'nav.preparation', perm: 'workflow.start' },
    { path: '/inventory', icon: ClipboardList, label: 'nav.inventory', perm: 'workflow.start' },
    { path: '/loading', icon: Truck, label: 'nav.loading', perm: 'workflow.start' },
    { path: '/workflow', icon: Layers, label: 'nav.workflow', perm: 'workflow.start' },
    { path: '/trips', icon: FileText, label: 'nav.trips', perm: 'trips.read' },
    { path: '/cashier', icon: ClipboardList, label: 'nav.cashier', perm: 'cashier.read' },
    { path: '/queue', icon: Clock, label: 'nav.queue', perm: 'queue.read' },
    { path: '/reports', icon: BarChart3, label: 'nav.reports', perm: 'reports.view' },
    { path: '/performance', icon: TrendingUp, label: 'nav.performance', perm: 'reports.view' },
    { path: '/users', icon: Users, label: 'nav.users', perm: 'users.read' },
    { path: '/settings', icon: Settings, label: 'nav.settings', perm: 'settings.read' },
  ];

  const filteredNav = navItems.filter(item => {
    if (!item.perm) return true;
    if (!user) return false;
    return db.hasPermission(user.role, item.perm);
  });

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`sidebar fixed lg:static inset-y-0 right-0 z-50 w-64 transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-lg font-bold text-indigo-600 flex items-center gap-2">
              <Zap size={20} />
              TBOS
            </h1>
            <p className="text-xs text-gray-500 mt-1">Operations System</p>
          </div>

          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {filteredNav.map(item => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
              >
                <item.icon size={18} />
                <span>{t(item.label, lang)}</span>
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-200 space-y-3">
            <button
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="btn btn-outline w-full text-xs"
            >
              <Globe size={14} />
              {lang === 'ar' ? 'English' : 'عربي'}
            </button>
            {user && (
              <div className="text-sm">
                <p className="font-medium text-gray-800">{user.name}</p>
                <p className="text-xs text-gray-500">{user.role}</p>
              </div>
            )}
            <button onClick={handleLogout} className="btn btn-danger w-full text-sm">
              <LogOut size={16} />
              {t('nav.logout', lang)}
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="btn btn-outline text-xs"
              title={lang === 'ar' ? 'طباعة' : 'Print'}
            >
              <Printer size={16} />
              <span className="hidden md:inline">{lang === 'ar' ? 'طباعة' : 'Print'}</span>
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
              className="btn btn-outline text-xs"
              title={lang === 'ar' ? 'مشاركة' : 'Share'}
            >
              <Share2 size={16} />
              <span className="hidden md:inline">{lang === 'ar' ? 'مشاركة' : 'Share'}</span>
            </button>
            <div className="h-6 w-px bg-gray-200"></div>
            <span className="text-sm text-gray-600">{user?.name}</span>
            <span className="badge badge-purple">{user?.role}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

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
        </div>
      </div>
    </div>
  );
}

// Dashboard Page
function DashboardPage() {
  const { lang, refresh } = useApp();
  const [stats, setStats] = useState(db.getDashboardStats());
  const [branches] = useState(db.getBranches());

  useEffect(() => {
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

// Inbound Page
function InboundPage() {
  const { lang, refresh } = useApp();
  const [inbounds, setInbounds] = useState<any[]>([]);
  const [selectedInbound, setSelectedInbound] = useState<any>(null);
  const [, setTick] = useState(0);
  
  // مؤقت حي للعمليات النشطة
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setInbounds(db.getInbounds());
  }, []);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    driverName: '',
    driverCode: '',
    containerNumber: '',
    containerType: '20ft',
    branchId: '',
  });
  const branches = db.getBranches() || [];

  const [itemForm, setItemForm] = useState({
    itemName: '',
    itemCode: '',
    quantity: '',
    unit: 'قطعة',
    notes: '',
  });

  const handleCreate = () => {
    if (!formData.driverName || !formData.driverCode || !formData.containerNumber || !formData.branchId) {
      alert(lang === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    const newInbound = db.createInbound(
      formData.driverName,
      formData.driverCode,
      formData.containerNumber,
      formData.containerType,
      formData.branchId
    );
    
    setInbounds(db.getInbounds());
    setSelectedInbound(newInbound);
    setShowForm(false);
    setFormData({
      driverName: '',
      driverCode: '',
      containerNumber: '',
      containerType: '20ft',
      branchId: '',
    });
  };

  // إضافة صنف
  const handleAddItem = () => {
    if (!selectedInbound) return;
    const quantityNum = parseInt(itemForm.quantity);
    if (!itemForm.itemName || !itemForm.itemCode || !itemForm.quantity || quantityNum <= 0) {
      alert(lang === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    db.addInboundItem(
      selectedInbound.id,
      itemForm.itemName,
      itemForm.itemCode,
      quantityNum,
      itemForm.unit,
      itemForm.notes
    );

    const updated = db.getInbound(selectedInbound.id);
    if (updated) setSelectedInbound(updated);
    setInbounds(db.getInbounds());
    
    setItemForm({
      itemName: '',
      itemCode: '',
      quantity: '',
      unit: 'قطعة',
      notes: '',
    });
  };

  // حذف صنف
  const handleRemoveItem = (itemId: string) => {
    if (!selectedInbound) return;
    db.removeInboundItem(selectedInbound.id, itemId);
    const updated = db.getInbound(selectedInbound.id);
    if (updated) setSelectedInbound(updated);
    setInbounds(db.getInbounds());
  };

  // بدء العد
  const handleStartCounting = (id: string) => {
    db.startInbound(id);
    setInbounds(db.getInbounds());
    refresh();
  };

  // إنهاء العد
  const handleEndCounting = (id: string) => {
    db.completeInbound(id);
    setInbounds(db.getInbounds());
    refresh();
  };

  // حساب الوقت المستغرق
  const calculateDuration = (startedAt: string | null, completedAt: string | null): string => {
    if (!startedAt) return '-';
    
    const start = new Date(startedAt).getTime();
    const end = completedAt ? new Date(completedAt).getTime() : Date.now();
    const durationSeconds = Math.floor((end - start) / 1000);
    
    return formatDuration(durationSeconds, lang);
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <Package className="text-indigo-500" size={28} />
            {lang === 'ar' ? 'الوارد' : 'Inbound'}
          </h2>
          <p className="text-gray-500 mt-1">
            {lang === 'ar' ? 'إدارة الكونتينرات والبضائع الواردة' : 'Manage containers and incoming goods'}
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {lang === 'ar' ? 'وارد جديد' : 'New Inbound'}
        </button>
      </div>

      {showForm && (
        <div className="card p-6">
          <h3 className="font-bold text-gray-800 mb-4">{lang === 'ar' ? 'تسجيل وارد جديد' : 'Register New Inbound'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <input
              value={formData.driverName}
              onChange={e => setFormData({ ...formData, driverName: e.target.value })}
              className="input"
              placeholder={lang === 'ar' ? 'اسم السائق' : 'Driver Name'}
            />
            <input
              value={formData.driverCode}
              onChange={e => setFormData({ ...formData, driverCode: e.target.value })}
              className="input"
              placeholder={lang === 'ar' ? 'كود السائق' : 'Driver Code'}
            />
            <input
              value={formData.containerNumber}
              onChange={e => setFormData({ ...formData, containerNumber: e.target.value })}
              className="input"
              placeholder={lang === 'ar' ? 'رقم الحاوية' : 'Container Number'}
            />
            <select
              value={formData.branchId}
              onChange={e => setFormData({ ...formData, branchId: e.target.value })}
              className="input"
            >
              <option value="">-- اختر الفرع --</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={handleCreate} className="btn btn-success">
              <CheckCircle size={16} />
              {lang === 'ar' ? 'إنشاء' : 'Create'}
            </button>
            <button onClick={() => setShowForm(false)} className="btn btn-outline">
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </div>
      )}

      {/* قسم الأصناف للوارد المحدد */}
      {selectedInbound && (
        <div className="card p-6 border-2 border-indigo-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <ClipboardList size={20} className="text-indigo-500" />
              {lang === 'ar' ? 'إدارة الأصناف' : 'Manage Items'} - {selectedInbound.inboundNumber}
            </h3>
            <button
              onClick={() => setSelectedInbound(null)}
              className="btn btn-outline text-xs"
            >
              <X size={14} />
              {lang === 'ar' ? 'إغلاق' : 'Close'}
            </button>
          </div>

          {/* معلومات الوارد */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-3 bg-blue-50 rounded-lg">
            <div>
              <p className="text-xs text-gray-600">{lang === 'ar' ? 'السائق' : 'Driver'}</p>
              <p className="font-semibold text-gray-800">{selectedInbound.driverName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">{lang === 'ar' ? 'الحاوية' : 'Container'}</p>
              <p className="font-semibold text-gray-800">{selectedInbound.containerNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">{lang === 'ar' ? 'عدد الأصناف' : 'Total Items'}</p>
              <p className="font-bold text-indigo-600 text-lg">{selectedInbound.items?.length || 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">{lang === 'ar' ? 'إجمالي الكميات' : 'Total Quantity'}</p>
              <p className="font-bold text-green-600 text-lg">
                {selectedInbound.items?.reduce((sum: number, item: any) => sum + (parseInt(item.quantity) || 0), 0) || 0}
              </p>
            </div>
          </div>

          {/* نموذج إضافة صنف */}
          <div className="mb-4">
            <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <CheckCircle size={16} className="text-green-500" />
              {lang === 'ar' ? 'إضافة صنف جديد' : 'Add New Item'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {lang === 'ar' ? 'اسم الصنف *' : 'Item Name *'}
                </label>
                <input
                  value={itemForm.itemName}
                  onChange={e => setItemForm({ ...itemForm, itemName: e.target.value })}
                  className="input"
                  placeholder={lang === 'ar' ? 'مثال: كرتون' : 'Example: Carton'}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {lang === 'ar' ? 'كود الصنف *' : 'Item Code *'}
                </label>
                <input
                  value={itemForm.itemCode}
                  onChange={e => setItemForm({ ...itemForm, itemCode: e.target.value })}
                  className="input"
                  placeholder={lang === 'ar' ? 'مثال: ITM-001' : 'Example: ITM-001'}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {lang === 'ar' ? 'الكمية *' : 'Quantity *'}
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={itemForm.quantity}
                  onChange={e => setItemForm({ ...itemForm, quantity: e.target.value })}
                  className="input"
                  placeholder={lang === 'ar' ? 'العدد' : 'Count'}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {lang === 'ar' ? 'الوحدة' : 'Unit'}
                </label>
                <select
                  value={itemForm.unit}
                  onChange={e => setItemForm({ ...itemForm, unit: e.target.value })}
                  className="input"
                >
                  <option value="قطعة">{lang === 'ar' ? 'قطعة' : 'Piece'}</option>
                  <option value="كرتون">{lang === 'ar' ? 'كرتون' : 'Carton'}</option>
                  <option value="بالته">{lang === 'ar' ? 'بالته' : 'Pallet'}</option>
                  <option value="كيلو">{lang === 'ar' ? 'كيلو' : 'KG'}</option>
                  <option value="طن">{lang === 'ar' ? 'طن' : 'Ton'}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {lang === 'ar' ? 'ملاحظات' : 'Notes'}
                </label>
                <input
                  value={itemForm.notes}
                  onChange={e => setItemForm({ ...itemForm, notes: e.target.value })}
                  className="input"
                  placeholder={lang === 'ar' ? 'اختياري' : 'Optional'}
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleAddItem}
                  className="btn btn-success w-full"
                  disabled={selectedInbound.status === 'COMPLETED'}
                >
                  <CheckCircle size={16} />
                  {lang === 'ar' ? 'إضافة صنف' : 'Add Item'}
                </button>
              </div>
            </div>
          </div>

          {/* جدول الأصناف */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <FileText size={16} className="text-blue-500" />
              {lang === 'ar' ? 'قائمة الأصناف المضافة' : 'Added Items List'}
            </h4>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="font-semibold text-gray-700">{lang === 'ar' ? '#' : '#'}</th>
                    <th className="font-semibold text-gray-700">{lang === 'ar' ? 'كود الصنف' : 'Item Code'}</th>
                    <th className="font-semibold text-gray-700">{lang === 'ar' ? 'اسم الصنف' : 'Item Name'}</th>
                    <th className="font-semibold text-gray-700">{lang === 'ar' ? 'الكمية' : 'Quantity'}</th>
                    <th className="font-semibold text-gray-700">{lang === 'ar' ? 'الوحدة' : 'Unit'}</th>
                    <th className="font-semibold text-gray-700">{lang === 'ar' ? 'ملاحظات' : 'Notes'}</th>
                    <th className="font-semibold text-gray-700">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {!selectedInbound.items || selectedInbound.items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center text-gray-400 py-8">
                        <ClipboardList size={32} className="mx-auto mb-2 opacity-30" />
                        <p>{lang === 'ar' ? 'لا توجد أصناف مضافة بعد' : 'No items added yet'}</p>
                        <p className="text-xs mt-1">{lang === 'ar' ? 'استخدم النموذج أعلاه لإضافة أصناف' : 'Use the form above to add items'}</p>
                      </td>
                    </tr>
                  ) : (
                    selectedInbound.items.map((item: any, index: number) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="text-gray-500">{index + 1}</td>
                        <td className="font-mono font-bold text-indigo-600">{item.itemCode}</td>
                        <td className="font-medium">{item.itemName}</td>
                        <td className="font-bold text-green-600">{item.quantity}</td>
                        <td>{item.unit}</td>
                        <td className="text-gray-500 text-sm">{item.notes || '-'}</td>
                        <td>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="btn btn-outline text-xs text-red-600 hover:bg-red-50"
                            disabled={selectedInbound.status === 'COMPLETED'}
                            title={lang === 'ar' ? 'حذف الصنف' : 'Delete Item'}
                          >
                            <X size={14} />
                            {lang === 'ar' ? 'حذف' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="card p-6">
        <h3 className="font-bold text-gray-800 mb-4">
          {lang === 'ar' ? 'سجل الوارد' : 'Inbound History'} ({inbounds.length})
        </h3>
        {!inbounds || inbounds.length === 0 ? (
          <p className="text-center text-gray-400 py-8">{lang === 'ar' ? 'لا يوجد وارد مسجل' : 'No inbound records'}</p>
        ) : (
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>{lang === 'ar' ? 'الرقم' : 'Number'}</th>
                  <th>{lang === 'ar' ? 'السائق' : 'Driver'}</th>
                  <th>{lang === 'ar' ? 'الحاوية' : 'Container'}</th>
                  <th>{lang === 'ar' ? 'عدد الأصناف' : 'Items Count'}</th>
                  <th>{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th>{lang === 'ar' ? 'وقت الوارد' : 'Duration'}</th>
                  <th>{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                  <th>{lang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {inbounds.map((inbound: any) => (
                  <tr key={inbound.id} className="hover:bg-gray-50">
                    <td className="font-mono font-bold text-indigo-600">{inbound.inboundNumber || '-'}</td>
                    <td>{inbound.driverName || '-'}</td>
                    <td>{inbound.containerNumber || '-'}</td>
                    <td>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100 text-purple-700 font-semibold text-sm">
                        <ClipboardList size={14} />
                        {inbound.items?.length || 0}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        inbound.status === 'COMPLETED' ? 'badge-green' :
                        inbound.status === 'IN_PROGRESS' ? 'badge-blue' :
                        'badge-gray'
                      }`}>
                        {inbound.status === 'PENDING' ? (lang === 'ar' ? 'قيد الانتظار' : 'Pending') :
                         inbound.status === 'IN_PROGRESS' ? (lang === 'ar' ? 'قيد التنفيذ' : 'In Progress') :
                         inbound.status === 'COMPLETED' ? (lang === 'ar' ? 'مكتمل' : 'Completed') :
                         inbound.status || 'PENDING'}
                      </span>
                    </td>
                    <td className="font-mono text-sm">
                      {inbound.status === 'IN_PROGRESS' ? (
                        <span className="text-indigo-600 font-bold animate-pulse-live">
                          {calculateDuration(inbound.startedAt, null)}
                        </span>
                      ) : (
                        <span className="text-gray-600">
                          {calculateDuration(inbound.startedAt, inbound.completedAt)}
                        </span>
                      )}
                    </td>
                    <td className="text-gray-500">{inbound.createdAt ? formatTime(inbound.createdAt, lang) : '-'}</td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedInbound(inbound)}
                          className="btn btn-primary text-xs"
                          title={lang === 'ar' ? 'إدارة الأصناف' : 'Manage Items'}
                        >
                          <ClipboardList size={12} />
                          {lang === 'ar' ? 'الأصناف' : 'Items'}
                        </button>
                        {inbound.status === 'PENDING' && (
                          <button
                            onClick={() => handleStartCounting(inbound.id)}
                            className="btn btn-success text-xs"
                          >
                            <Play size={12} />
                            {lang === 'ar' ? 'بدء' : 'Start'}
                          </button>
                        )}
                        {inbound.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => handleEndCounting(inbound.id)}
                            className="btn btn-danger text-xs"
                          >
                            <Square size={12} />
                            {lang === 'ar' ? 'إنهاء' : 'End'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Incoming Page
function IncomingPage() {
  const { lang, refresh } = useApp();
  const [couriers] = useState(db.getCouriers());
  const [selectedCourier, setSelectedCourier] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [startPreparation, setStartPreparation] = useState(false);
  const [branches] = useState(db.getBranches());
  const [trips, setTrips] = useState(db.getTrips());
  const [error, setError] = useState('');

  const handleCheckIn = () => {
    if (!selectedCourier || !selectedBranch) {
      setError('اختر المندوب والفرع');
      return;
    }
    const result = db.checkIn(selectedCourier, selectedBranch);
    if (result.success && result.trip) {
      setError('');
      
      // إذا تم تحديد بدء التحضير المسبق، ابدأ مرحلة التحضير فوراً
      if (startPreparation) {
        db.startStage(result.trip.id, 'PREPARATION');
      }
      
      setSelectedCourier('');
      setStartPreparation(false);
      setTrips(db.getTrips());
      refresh();
    } else {
      setError(result.error === 'ACTIVE_TRIP_EXISTS' ? 'المندوب لديه رحلة نشطة بالفعل' : 'حدث خطأ');
    }
  };

  const activeTrips = trips.filter(t => t.status === 'ACTIVE' || t.status === 'WAITING');

  return (
    <div className="space-y-6 animate-slide-up">
      <h2 className="text-2xl font-bold text-gray-800">{t('incoming.title', lang)}</h2>

      <div className="card p-6">
        <h3 className="font-semibold mb-4">{t('incoming.register', lang)}</h3>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm mb-4">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select value={selectedCourier} onChange={e => setSelectedCourier(e.target.value)} className="input">
            <option value="">-- اختر المندوب --</option>
            {couriers.filter(c => c.status === 'AVAILABLE').map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
            ))}
          </select>
          <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)} className="input">
            <option value="">-- اختر الفرع --</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <button onClick={handleCheckIn} className="btn btn-success">
            <ArrowDownCircle size={18} />
            {t('incoming.register', lang)}
          </button>
        </div>
        
        {/* خيار بدء التحضير المسبق */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={startPreparation}
              onChange={e => setStartPreparation(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <div className="flex-1">
              <p className="font-medium text-gray-800">
                {lang === 'ar' ? 'بدء التحضير المسبق' : 'Start Preparation in Advance'}
              </p>
              <p className="text-sm text-gray-600">
                {lang === 'ar' 
                  ? 'بدء مرحلة التحضير وتجهيز الطلب فوراً (حتى قبل وصول المندوب)'
                  : 'Start preparation stage immediately (even before courier arrives)'}
              </p>
            </div>
          </label>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold mb-4">الرحلات النشطة</h3>
        {activeTrips.length === 0 ? (
          <p className="text-center text-gray-500 py-8">{t('common.no_data', lang)}</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t('incoming.trip_number', lang)}</th>
                <th>{t('couriers.name', lang)}</th>
                <th>{t('couriers.branch', lang)}</th>
                <th>{t('workflow.current_stage', lang)}</th>
              </tr>
            </thead>
            <tbody>
              {activeTrips.map(trip => {
                const courier = db.getCourier(trip.courierId);
                const branch = db.getBranch(trip.branchId);
                return (
                  <tr key={trip.id}>
                    <td className="font-mono">{trip.tripNumber}</td>
                    <td>{courier?.name}</td>
                    <td>{branch?.name}</td>
                    <td><span className="badge badge-blue">{t(`stage.${trip.currentStage}`, lang)}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// Workflow Page
function WorkflowPage() {
  const { lang, refresh } = useApp();
  const [, setTick] = useState(0);
  const trips = db.getTrips().filter(t => t.status === 'ACTIVE' || t.status === 'WAITING');

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => refresh(), 3000);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleStart = (tripId: string, stage: db.StageName) => {
    const result = db.startStage(tripId, stage);
    if (result.success) refresh();
    else alert(result.error);
  };

  const handleFinish = (tripId: string, stage: db.StageName) => {
    const result = db.finishStage(tripId, stage);
    if (result.success) {
      if (stage === 'LOADING') {
        db.runDecisionEngine(tripId);
      }
      refresh();
    } else {
      alert(result.error);
    }
  };

  // الحصول على جميع المراحل النشطة للرحلة
  const getActiveStages = (tripId: string) => {
    const stages = db.getTripStages(tripId);
    return stages.filter(s => s.status === 'IN_PROGRESS');
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <h2 className="text-2xl font-bold text-gray-800">{t('workflow.title', lang)}</h2>

      {trips.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          <Package size={48} className="mx-auto mb-4 opacity-50" />
          <p>{t('common.no_data', lang)}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {trips.map(trip => {
            const courier = db.getCourier(trip.courierId);
            const branch = db.getBranch(trip.branchId);
            const stages = db.getTripStages(trip.id);
            const activeStages = getActiveStages(trip.id);
            const decision = db.getLatestDecision(trip.id);

            return (
              <div key={trip.id} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-800">{courier?.name}</p>
                    <p className="text-xs text-gray-500">{courier?.code} • {trip.tripNumber}</p>
                  </div>
                  <span className={`badge ${trip.status === 'ACTIVE' ? 'badge-green' : 'badge-orange'}`}>
                    {trip.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm mb-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('couriers.branch', lang)}:</span>
                    <span className="font-medium">{branch?.name}</span>
                  </div>
                  
                  {/* عرض جميع المراحل النشطة */}
                  {activeStages.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">
                        {lang === 'ar' ? 'المراحل النشطة:' : 'Active Stages:'}
                      </p>
                      {activeStages.map(stage => {
                        let liveDuration = 0;
                        if (stage.startedAt) {
                          liveDuration = Math.floor((Date.now() - new Date(stage.startedAt).getTime()) / 1000);
                        }
                        return (
                          <div key={stage.id} className="flex justify-between items-center p-2 bg-blue-50 rounded mb-1">
                            <span className="badge badge-blue">{t(`stage.${stage.stage}`, lang)}</span>
                            <span className="font-mono text-xs text-indigo-600 font-bold animate-pulse-live">
                              {formatDuration(liveDuration, lang)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {decision && (
                  <div className="mt-3 p-2 rounded-lg bg-gray-50 border">
                    <p className="text-xs text-gray-500 mb-1">{t('workflow.decision', lang)}</p>
                    <p className="text-sm font-medium">{t(`decision.${decision.decision}`, lang)}</p>
                  </div>
                )}

                {/* أزرار التحكم في المراحل النشطة */}
                <div className="mt-4 space-y-2">
                  {activeStages.map(stage => (
                    <button
                      key={stage.id}
                      onClick={() => handleFinish(trip.id, stage.stage)}
                      className="btn btn-danger w-full"
                    >
                      <Square size={14} />
                      {lang === 'ar' ? `إنهاء ${t(`stage.${stage.stage}`, lang)}` : `Finish ${stage.stage}`}
                    </button>
                  ))}
                  
                  {/* عرض المراحل المتاحة للبدء */}
                  {activeStages.length === 0 && (
                    <div className="space-y-2">
                      {stages.filter(s => s.status === 'PENDING').slice(0, 3).map(stage => (
                        <button
                          key={stage.id}
                          onClick={() => handleStart(trip.id, stage.stage)}
                          className="btn btn-success w-full"
                        >
                          <Play size={14} />
                          {lang === 'ar' ? `بدء ${t(`stage.${stage.stage}`, lang)}` : `Start ${stage.stage}`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Couriers Page
function CouriersPage() {
  const { lang, refresh } = useApp();
  const [couriers, setCouriers] = useState(db.getCouriers());
  const [branches] = useState(db.getBranches());
  const [showImportModal, setShowImportModal] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // تحويل البيانات إلى صيغة المندوبين - مرن جداً
        const couriersData = jsonData.map((row: any) => {
          // البحث عن الاسم بأي طريقة ممكنة
          const name = row['الاسم'] || row['name'] || row['Name'] || 
                      row['اسم المندوب'] || row['courier'] || row['Courier'] ||
                      row['المندوب'] || '';

          // البحث عن الكود
          const code = row['الكود'] || row['code'] || row['Code'] || 
                      row['كود المندوب'] || row['courier_code'] || row['courierCode'] ||
                      row['رقم المندوب'] || '';

          // البحث عن الهاتف
          const phone = row['الهاتف'] || row['phone'] || row['Phone'] || 
                       row['رقم الهاتف'] || row['tel'] || row['Tel'] ||
                       row['mobile'] || row['Mobile'] || '';

          // البحث عن الفرع - يقبل الاسم أو الكود أو المعرف
          const branch = row['الفرع'] || row['branchId'] || row['Branch'] || 
                        row['branch'] || row['BranchId'] || row['branch_id'] ||
                        row['الفرع الخاص'] || row['فرع'] || '';

          return {
            code,
            name,
            phone,
            branchId: branch, // سيتم معالجته في bulkImportCouriers
          };
        });

        // استيراد المندوبين
        const result = db.bulkImportCouriers(couriersData);
        setImportResult(result);
        setCouriers(db.getCouriers());
        refresh();
      } catch (error) {
        console.error('Error reading file:', error);
        alert(lang === 'ar' ? 'خطأ في قراءة الملف' : 'Error reading file');
      }
    };
    reader.readAsBinaryString(file);
  };

  const downloadTemplate = () => {
    const template = [
      { 'الكود': 'C001', 'الاسم': 'أحمد محمد', 'الهاتف': '0101234567', 'الفرع': 'القاهرة' },
      { 'الكود': 'C002', 'الاسم': 'محمود علي', 'الهاتف': '0109876543', 'الفرع': 'الإسكندرية' },
      { 'الكود': 'C003', 'الاسم': 'خالد حسن', 'الهاتف': '0115554433', 'الفرع': 'طنطا' },
      { 'الكود': '', 'الاسم': 'عمر سعيد', 'الهاتف': '0127778899', 'الفرع': '' }, // بدون كود وفرع - سيتم توليدهما تلقائياً
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'المندوبون');
    XLSX.writeFile(workbook, 'couriers_template.xlsx');
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">{t('couriers.title', lang)}</h2>
        <button
          onClick={() => setShowImportModal(true)}
          className="btn btn-primary"
        >
          <Upload size={18} />
          {lang === 'ar' ? 'استيراد مندوبين' : 'Import Couriers'}
        </button>
      </div>

      <div className="card p-6">
        <table>
          <thead>
            <tr>
              <th>{t('couriers.code', lang)}</th>
              <th>{t('couriers.name', lang)}</th>
              <th>{t('couriers.phone', lang)}</th>
              <th>{t('couriers.branch', lang)}</th>
              <th>{t('couriers.status', lang)}</th>
            </tr>
          </thead>
          <tbody>
            {couriers.map(courier => {
              const branch = branches.find(b => b.id === courier.branchId);
              return (
                <tr key={courier.id}>
                  <td className="font-mono">{courier.code}</td>
                  <td>{courier.name}</td>
                  <td>{courier.phone}</td>
                  <td>{branch?.name}</td>
                  <td><span className="badge badge-green">{courier.status}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  {lang === 'ar' ? 'استيراد المندوبين من ملف Excel' : 'Import Couriers from Excel'}
                </h3>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportResult(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              {!importResult ? (
                <div className="space-y-6">
                  {/* Instructions */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">
                      {lang === 'ar' ? 'تعليمات الاستيراد:' : 'Import Instructions:'}
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• <strong>{lang === 'ar' ? 'الاسم فقط مطلوب' : 'Only name is required'}</strong> - {lang === 'ar' ? 'باقي الحقول اختيارية' : 'other fields are optional'}</li>
                      <li>• {lang === 'ar' ? 'يمكنك كتابة اسم الفرع مباشرة (مثل: القاهرة، الإسكندرية، طنطا)' : 'You can write branch name directly (e.g., Cairo, Alexandria, Tanta)'}</li>
                      <li>• {lang === 'ar' ? 'إذا لم يتم تحديد كود، سيتم توليده تلقائياً' : 'If code is not provided, it will be auto-generated'}</li>
                      <li>• {lang === 'ar' ? 'إذا لم يتم تحديد فرع، سيتم استخدام الفرع الافتراضي' : 'If branch is not specified, default branch will be used'}</li>
                    </ul>
                  </div>

                  {/* Download Template */}
                  <div className="flex justify-center">
                    <button
                      onClick={downloadTemplate}
                      className="btn btn-outline"
                    >
                      <Download size={18} />
                      {lang === 'ar' ? 'تحميل نموذج Excel' : 'Download Excel Template'}
                    </button>
                  </div>

                  {/* File Upload */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center gap-3"
                    >
                      <Upload size={48} className="text-gray-400" />
                      <div>
                        <p className="text-lg font-medium text-gray-700">
                          {lang === 'ar' ? 'انقر لرفع ملف Excel' : 'Click to upload Excel file'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {lang === 'ar' ? 'يدعم ملفات .xlsx و .xls' : 'Supports .xlsx and .xls files'}
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Branch Reference */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-2">
                      {lang === 'ar' ? '✅ الفروع المتاحة (يمكنك استخدام الاسم أو المعرف):' : '✅ Available Branches (you can use name or ID):'}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      {branches.map(branch => (
                        <div key={branch.id} className="bg-white rounded-lg p-3 border border-green-300">
                          <div className="font-bold text-green-800 mb-1">{branch.name}</div>
                          <div className="text-xs text-gray-600">
                            {lang === 'ar' ? 'المعرف:' : 'ID:'} <span className="font-mono font-bold text-indigo-600">{branch.id}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {lang === 'ar' ? 'أو اكتب:' : 'Or write:'} <span className="font-medium">{branch.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Import Result */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <CheckCircle size={32} className="text-green-600 mx-auto mb-2" />
                      <p className="text-3xl font-bold text-green-700">{importResult.success}</p>
                      <p className="text-sm text-green-600">
                        {lang === 'ar' ? 'تم استيرادهم بنجاح' : 'Successfully imported'}
                      </p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                      <AlertTriangle size={32} className="text-red-600 mx-auto mb-2" />
                      <p className="text-3xl font-bold text-red-700">{importResult.failed}</p>
                      <p className="text-sm text-red-600">
                        {lang === 'ar' ? 'فشل استيرادهم' : 'Failed to import'}
                      </p>
                    </div>
                  </div>

                  {/* Errors */}
                  {importResult.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-semibold text-red-900 mb-2">
                        {lang === 'ar' ? 'تفاصيل الأخطاء:' : 'Error Details:'}
                      </h4>
                      <ul className="text-sm text-red-800 space-y-1 max-h-48 overflow-y-auto">
                        {importResult.errors.map((error, idx) => (
                          <li key={idx}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowImportModal(false);
                        setImportResult(null);
                      }}
                      className="btn btn-primary flex-1"
                    >
                      {lang === 'ar' ? 'إغلاق' : 'Close'}
                    </button>
                    <button
                      onClick={() => setImportResult(null)}
                      className="btn btn-outline flex-1"
                    >
                      {lang === 'ar' ? 'استيراد المزيد' : 'Import More'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Preparation Page
function PreparationPage() {
  const { lang, refresh } = useApp();
  const [, setTick] = useState(0);
  const trips = db.getTrips().filter(t => (t.status === 'ACTIVE' || t.status === 'WAITING') && t.currentStage === 'PREPARATION');

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => refresh(), 3000);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleStart = (tripId: string) => {
    const result = db.startStage(tripId, 'PREPARATION');
    if (result.success) refresh();
    else alert(result.error);
  };

  const handleFinish = (tripId: string) => {
    const result = db.finishStage(tripId, 'PREPARATION');
    if (result.success) refresh();
    else alert(result.error);
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <h2 className="text-2xl font-bold text-gray-800">{t('nav.preparation', lang)}</h2>
      {trips.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          <Package size={48} className="mx-auto mb-4 opacity-50" />
          <p>{t('common.no_data', lang)}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {trips.map(trip => {
            const courier = db.getCourier(trip.courierId);
            const branch = db.getBranch(trip.branchId);
            const stages = db.getTripStages(trip.id);
            const stageData = stages.find(s => s.stage === 'PREPARATION');
            let liveDuration = 0;
            if (stageData?.startedAt && stageData.status === 'IN_PROGRESS') {
              liveDuration = Math.floor((Date.now() - new Date(stageData.startedAt).getTime()) / 1000);
            }
            return (
              <div key={trip.id} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-800">{courier?.name}</p>
                    <p className="text-xs text-gray-500">{courier?.code} • {trip.tripNumber}</p>
                  </div>
                  <span className={`badge ${trip.status === 'ACTIVE' ? 'badge-green' : 'badge-orange'}`}>{trip.status}</span>
                </div>
                <div className="space-y-2 text-sm mb-3">
                  <div className="flex justify-between"><span className="text-gray-600">{t('couriers.branch', lang)}:</span><span className="font-medium">{branch?.name}</span></div>
                  {stageData?.status === 'IN_PROGRESS' && (
                    <div className="flex justify-between"><span className="text-gray-600">{t('workflow.duration', lang)}:</span><span className="font-mono text-indigo-600 font-bold animate-pulse-live">{formatDuration(liveDuration, lang)}</span></div>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  {stageData?.status === 'PENDING' && (
                    <button onClick={() => handleStart(trip.id)} className="btn btn-success flex-1"><Play size={14} />{t('workflow.start', lang)}</button>
                  )}
                  {stageData?.status === 'IN_PROGRESS' && (
                    <button onClick={() => handleFinish(trip.id)} className="btn btn-danger flex-1"><Square size={14} />{t('workflow.finish', lang)}</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Inventory Page
function InventoryPage() {
  const { lang, refresh } = useApp();
  const [, setTick] = useState(0);
  const trips = db.getTrips().filter(t => (t.status === 'ACTIVE' || t.status === 'WAITING') && t.currentStage === 'INVENTORY');

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => refresh(), 3000);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleStart = (tripId: string) => {
    const result = db.startStage(tripId, 'INVENTORY');
    if (result.success) refresh();
    else alert(result.error);
  };

  const handleFinish = (tripId: string) => {
    const result = db.finishStage(tripId, 'INVENTORY');
    if (result.success) refresh();
    else alert(result.error);
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <h2 className="text-2xl font-bold text-gray-800">{t('nav.inventory', lang)}</h2>
      {trips.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          <ClipboardList size={48} className="mx-auto mb-4 opacity-50" />
          <p>{t('common.no_data', lang)}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {trips.map(trip => {
            const courier = db.getCourier(trip.courierId);
            const branch = db.getBranch(trip.branchId);
            const stages = db.getTripStages(trip.id);
            const stageData = stages.find(s => s.stage === 'INVENTORY');
            let liveDuration = 0;
            if (stageData?.startedAt && stageData.status === 'IN_PROGRESS') {
              liveDuration = Math.floor((Date.now() - new Date(stageData.startedAt).getTime()) / 1000);
            }
            return (
              <div key={trip.id} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-800">{courier?.name}</p>
                    <p className="text-xs text-gray-500">{courier?.code} • {trip.tripNumber}</p>
                  </div>
                  <span className={`badge ${trip.status === 'ACTIVE' ? 'badge-green' : 'badge-orange'}`}>{trip.status}</span>
                </div>
                <div className="space-y-2 text-sm mb-3">
                  <div className="flex justify-between"><span className="text-gray-600">{t('couriers.branch', lang)}:</span><span className="font-medium">{branch?.name}</span></div>
                  {stageData?.status === 'IN_PROGRESS' && (
                    <div className="flex justify-between"><span className="text-gray-600">{t('workflow.duration', lang)}:</span><span className="font-mono text-indigo-600 font-bold animate-pulse-live">{formatDuration(liveDuration, lang)}</span></div>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  {stageData?.status === 'PENDING' && (
                    <button onClick={() => handleStart(trip.id)} className="btn btn-success flex-1"><Play size={14} />{t('workflow.start', lang)}</button>
                  )}
                  {stageData?.status === 'IN_PROGRESS' && (
                    <button onClick={() => handleFinish(trip.id)} className="btn btn-danger flex-1"><Square size={14} />{t('workflow.finish', lang)}</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Loading Page
function LoadingPage() {
  const { lang, refresh } = useApp();
  const [, setTick] = useState(0);
  const trips = db.getTrips().filter(t => (t.status === 'ACTIVE' || t.status === 'WAITING') && t.currentStage === 'LOADING');

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => refresh(), 3000);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleStart = (tripId: string) => {
    const result = db.startStage(tripId, 'LOADING');
    if (result.success) refresh();
    else alert(result.error);
  };

  const handleFinish = (tripId: string) => {
    const result = db.finishStage(tripId, 'LOADING');
    if (result.success) {
      db.runDecisionEngine(tripId);
      refresh();
    } else {
      alert(result.error);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <h2 className="text-2xl font-bold text-gray-800">{t('nav.loading', lang)}</h2>
      {trips.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          <Truck size={48} className="mx-auto mb-4 opacity-50" />
          <p>{t('common.no_data', lang)}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {trips.map(trip => {
            const courier = db.getCourier(trip.courierId);
            const branch = db.getBranch(trip.branchId);
            const stages = db.getTripStages(trip.id);
            const stageData = stages.find(s => s.stage === 'LOADING');
            let liveDuration = 0;
            if (stageData?.startedAt && stageData.status === 'IN_PROGRESS') {
              liveDuration = Math.floor((Date.now() - new Date(stageData.startedAt).getTime()) / 1000);
            }
            return (
              <div key={trip.id} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-800">{courier?.name}</p>
                    <p className="text-xs text-gray-500">{courier?.code} • {trip.tripNumber}</p>
                  </div>
                  <span className={`badge ${trip.status === 'ACTIVE' ? 'badge-green' : 'badge-orange'}`}>{trip.status}</span>
                </div>
                <div className="space-y-2 text-sm mb-3">
                  <div className="flex justify-between"><span className="text-gray-600">{t('couriers.branch', lang)}:</span><span className="font-medium">{branch?.name}</span></div>
                  {stageData?.status === 'IN_PROGRESS' && (
                    <div className="flex justify-between"><span className="text-gray-600">{t('workflow.duration', lang)}:</span><span className="font-mono text-indigo-600 font-bold animate-pulse-live">{formatDuration(liveDuration, lang)}</span></div>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  {stageData?.status === 'PENDING' && (
                    <button onClick={() => handleStart(trip.id)} className="btn btn-success flex-1"><Play size={14} />{t('workflow.start', lang)}</button>
                  )}
                  {stageData?.status === 'IN_PROGRESS' && (
                    <button onClick={() => handleFinish(trip.id)} className="btn btn-danger flex-1"><Square size={14} />{t('workflow.finish', lang)}</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Trips Page
function TripsPage() {
  const { lang } = useApp();
  const trips = db.getTrips();

  return (
    <div className="space-y-6 animate-slide-up">
      <h2 className="text-2xl font-bold text-gray-800">{t('nav.trips', lang)}</h2>

      <div className="card p-6">
        <table>
          <thead>
            <tr>
              <th>{t('incoming.trip_number', lang)}</th>
              <th>{t('couriers.name', lang)}</th>
              <th>{t('couriers.branch', lang)}</th>
              <th>{t('incoming.arrival_time', lang)}</th>
              <th>{t('workflow.current_stage', lang)}</th>
              <th>{t('workflow.status', lang)}</th>
            </tr>
          </thead>
          <tbody>
            {trips.length === 0 ? (
              <tr><td colSpan={6} className="text-center text-gray-500 py-8">{t('common.no_data', lang)}</td></tr>
            ) : trips.map(trip => {
              const courier = db.getCourier(trip.courierId);
              const branch = db.getBranch(trip.branchId);
              return (
                <tr key={trip.id}>
                  <td className="font-mono">{trip.tripNumber}</td>
                  <td>{courier?.name}</td>
                  <td>{branch?.name}</td>
                  <td>{formatTime(trip.arrivalAt, lang)}</td>
                  <td><span className="badge badge-blue">{t(`stage.${trip.currentStage}`, lang)}</span></td>
                  <td>
                    <span className={`badge ${
                      trip.status === 'ACTIVE' ? 'badge-green' :
                      trip.status === 'COMPLETED' ? 'badge-gray' : 'badge-orange'
                    }`}>{trip.status}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Cashier Page
function CashierPage() {
  const { lang, refresh } = useApp();
  const [branches] = useState(db.getBranches());

  useEffect(() => {
    const interval = setInterval(() => refresh(), 3000);
    return () => clearInterval(interval);
  }, [refresh]);

  const cashierTrips = db.getTrips().filter(t => t.currentStage === 'CASHIER' && t.status === 'ACTIVE');

  return (
    <div className="space-y-6 animate-slide-up">
      <h2 className="text-2xl font-bold text-gray-800">{t('cashier.title', lang)}</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {branches.map(branch => {
          const branchTrips = cashierTrips.filter(t => t.branchId === branch.id);
          const queueCount = db.getQueue(branch.id).filter(q => q.status === 'WAITING').length;
          const isFull = branch.cashierOccupancy >= branch.cashierCapacity;

          return (
            <div key={branch.id} className="card p-6">
              <h3 className="font-semibold text-gray-800 mb-3">{branch.name}</h3>
              <div className={`p-4 rounded-lg text-center ${isFull ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                <p className="text-4xl font-bold">{branch.cashierOccupancy} / {branch.cashierCapacity}</p>
                <p className="text-sm mt-1">{isFull ? 'ممتلئ' : 'متاح'}</p>
              </div>
              <div className="mt-3 p-3 bg-orange-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-orange-700">{queueCount}</p>
                <p className="text-xs text-orange-600">{t('queue.waiting', lang)}</p>
              </div>
              <div className="mt-3 space-y-2">
                {branchTrips.map(trip => {
                  const courier = db.getCourier(trip.courierId);
                  return (
                    <div key={trip.id} className="flex items-center justify-between p-2 bg-white rounded border">
                      <span className="text-sm font-medium">{courier?.name}</span>
                      <span className="text-xs text-gray-500">{trip.tripNumber}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Queue Page
function QueuePage() {
  const { lang, refresh } = useApp();
  const [, setTick] = useState(0);
  const queue = db.getQueue();

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
      refresh();
    }, 3000);
    return () => clearInterval(interval);
  }, [refresh]);

  const waitingQueue = queue.filter(q => q.status === 'WAITING');

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">{t('queue.title', lang)}</h2>
        <span className="badge badge-orange text-sm px-3 py-1">
          {waitingQueue.length} {t('queue.waiting', lang)}
        </span>
      </div>

      <div className="card p-6">
        <table>
          <thead>
            <tr>
              <th>{t('queue.number', lang)}</th>
              <th>{t('couriers.name', lang)}</th>
              <th>{t('incoming.trip_number', lang)}</th>
              <th>{t('couriers.branch', lang)}</th>
              <th>{t('queue.priority', lang)}</th>
              <th>{t('queue.position', lang)}</th>
              <th>{t('queue.waiting', lang)}</th>
            </tr>
          </thead>
          <tbody>
            {waitingQueue.length === 0 ? (
              <tr><td colSpan={7} className="text-center text-gray-500 py-8">{t('common.no_data', lang)}</td></tr>
            ) : waitingQueue.map((q, idx) => {
              const trip = db.getTrip(q.tripId);
              const courier = trip ? db.getCourier(trip.courierId) : null;
              const branch = db.getBranch(q.branchId);
              return (
                <tr key={q.id}>
                  <td className="font-mono font-bold">#{q.queueNumber}</td>
                  <td>{courier?.name}</td>
                  <td className="font-mono">{trip?.tripNumber}</td>
                  <td>{branch?.name}</td>
                  <td><span className="badge badge-purple">{q.priority}</span></td>
                  <td><span className="badge badge-blue">{idx + 1}</span></td>
                  <td><span className="badge badge-orange">{t('queue.waiting', lang)}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Reports Page
function ReportsPage() {
  const { lang } = useApp();
  const trips = db.getTrips();

  const exportCSV = () => {
    const headers = ['Trip Number', 'Courier', 'Branch', 'Arrival', 'Stage', 'Status'];
    const rows = trips.map(trip => {
      const courier = db.getCourier(trip.courierId);
      const branch = db.getBranch(trip.branchId);
      return [
        trip.tripNumber,
        courier?.name || '',
        branch?.name || '',
        trip.arrivalAt,
        trip.currentStage,
        trip.status,
      ].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tbos-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">{t('reports.title', lang)}</h2>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn btn-primary">
            {t('reports.export_csv', lang)}
          </button>
          <button onClick={() => window.print()} className="btn btn-outline">
            {t('reports.print', lang)}
          </button>
        </div>
      </div>

      <div className="card p-6">
        <table>
          <thead>
            <tr>
              <th>{t('incoming.trip_number', lang)}</th>
              <th>{t('couriers.name', lang)}</th>
              <th>{t('couriers.branch', lang)}</th>
              <th>{t('incoming.arrival_time', lang)}</th>
              <th>{t('workflow.current_stage', lang)}</th>
              <th>{t('workflow.status', lang)}</th>
            </tr>
          </thead>
          <tbody>
            {trips.length === 0 ? (
              <tr><td colSpan={6} className="text-center text-gray-500 py-8">{t('common.no_data', lang)}</td></tr>
            ) : trips.map(trip => {
              const courier = db.getCourier(trip.courierId);
              const branch = db.getBranch(trip.branchId);
              return (
                <tr key={trip.id}>
                  <td className="font-mono">{trip.tripNumber}</td>
                  <td>{courier?.name}</td>
                  <td>{branch?.name}</td>
                  <td>{formatTime(trip.arrivalAt, lang)}</td>
                  <td>{t(`stage.${trip.currentStage}`, lang)}</td>
                  <td>
                    <span className={`badge ${
                      trip.status === 'ACTIVE' ? 'badge-green' :
                      trip.status === 'COMPLETED' ? 'badge-gray' : 'badge-orange'
                    }`}>{trip.status}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Performance Report Page
function PerformanceReportPage() {
  const { lang } = useApp();
  const trips = db.getTrips();
  const stages = ['ENTRY', 'DOCK', 'PREPARATION', 'INVENTORY', 'LOADING', 'CASHIER'];

  // Calculate stage durations for each trip
  const getTripPerformance = (trip: any) => {
    const tripStages = db.getTripStages(trip.id);
    const stageDurations: Record<string, number> = {};
    let totalTime = 0;

    stages.forEach(stage => {
      const stageData = tripStages.find(s => s.stage === stage);
      if (stageData && stageData.durationSeconds) {
        stageDurations[stage] = stageData.durationSeconds;
        totalTime += stageData.durationSeconds;
      } else {
        stageDurations[stage] = 0;
      }
    });

    return {
      tripNumber: trip.tripNumber,
      courier: db.getCourier(trip.courierId)?.name || '-',
      branch: db.getBranch(trip.branchId)?.name || '-',
      arrivalTime: trip.arrivalAt,
      status: trip.status,
      stageDurations,
      totalTime,
    };
  };

  const performances = trips.map(getTripPerformance);
  const completedPerformances = performances.filter(p => p.status === 'COMPLETED');

  // Calculate averages
  const calculateAverage = (performances: any[], stage: string) => {
    const validPerformances = performances.filter(p => p.stageDurations[stage] > 0);
    if (validPerformances.length === 0) return 0;
    const total = validPerformances.reduce((sum, p) => sum + p.stageDurations[stage], 0);
    return Math.round(total / validPerformances.length);
  };

  const avgTotalTime = completedPerformances.length > 0
    ? Math.round(completedPerformances.reduce((sum, p) => sum + p.totalTime, 0) / completedPerformances.length)
    : 0;

  const exportCSV = () => {
    const headers = [
      'Trip Number',
      'Courier',
      'Branch',
      'Arrival Time',
      'Status',
      ...stages.map(s => s),
      'Total Time'
    ];
    
    const rows = performances.map(p => [
      p.tripNumber,
      p.courier,
      p.branch,
      p.arrivalTime,
      p.status,
      ...stages.map(s => p.stageDurations[s]),
      p.totalTime
    ].join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'performance-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">
          {lang === 'ar' ? 'تقرير أداء المندوبين' : 'Courier Performance Report'}
        </h2>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn btn-primary">
            {lang === 'ar' ? 'تصدير CSV' : 'Export CSV'}
          </button>
          <button onClick={() => window.print()} className="btn btn-outline">
            {lang === 'ar' ? 'طباعة' : 'Print'}
          </button>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
          <p className="text-sm text-gray-600">{lang === 'ar' ? 'إجمالي الرحلات' : 'Total Trips'}</p>
          <p className="text-3xl font-bold text-blue-700 mt-1">{trips.length}</p>
        </div>
        <div className="card p-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
          <p className="text-sm text-gray-600">{lang === 'ar' ? 'الرحلات المكتملة' : 'Completed Trips'}</p>
          <p className="text-3xl font-bold text-green-700 mt-1">{completedPerformances.length}</p>
        </div>
        <div className="card p-4 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
          <p className="text-sm text-gray-600">{lang === 'ar' ? 'متوسط الوقت الإجمالي' : 'Avg Total Time'}</p>
          <p className="text-3xl font-bold text-purple-700 mt-1">{formatDuration(avgTotalTime, lang)}</p>
        </div>
        <div className="card p-4 bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200">
          <p className="text-sm text-gray-600">{lang === 'ar' ? 'الرحلات النشطة' : 'Active Trips'}</p>
          <p className="text-3xl font-bold text-orange-700 mt-1">{trips.filter(t => t.status === 'ACTIVE').length}</p>
        </div>
      </div>

      {/* Average Time per Stage */}
      <div className="card p-6">
        <h3 className="font-bold text-gray-800 mb-4">
          {lang === 'ar' ? 'متوسط الوقت لكل مرحلة' : 'Average Time per Stage'}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {stages.map(stage => {
            const avg = calculateAverage(completedPerformances, stage);
            return (
              <div key={stage} className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-xs text-gray-600 mb-1">{t(`stage.${stage}`, lang)}</p>
                <p className="text-xl font-bold text-gray-800">{formatDuration(avg, lang)}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Performance Table */}
      <div className="card p-6">
        <h3 className="font-bold text-gray-800 mb-4">
          {lang === 'ar' ? 'تفاصيل أداء كل رحلة' : 'Detailed Trip Performance'}
        </h3>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>{lang === 'ar' ? 'رقم الرحلة' : 'Trip Number'}</th>
                <th>{lang === 'ar' ? 'المندوب' : 'Courier'}</th>
                <th>{lang === 'ar' ? 'الفرع' : 'Branch'}</th>
                {stages.map(stage => (
                  <th key={stage}>{t(`stage.${stage}`, lang)}</th>
                ))}
                <th>{lang === 'ar' ? 'الوقت الإجمالي' : 'Total Time'}</th>
                <th>{lang === 'ar' ? 'الحالة' : 'Status'}</th>
              </tr>
            </thead>
            <tbody>
              {performances.length === 0 ? (
                <tr>
                  <td colSpan={stages.length + 6} className="text-center text-gray-500 py-8">
                    {lang === 'ar' ? 'لا توجد بيانات' : 'No data available'}
                  </td>
                </tr>
              ) : (
                performances.map(perf => (
                  <tr key={perf.tripNumber}>
                    <td className="font-mono font-bold text-indigo-600">{perf.tripNumber}</td>
                    <td>{perf.courier}</td>
                    <td>{perf.branch}</td>
                    {stages.map(stage => (
                      <td key={stage} className="font-mono text-sm">
                        {perf.stageDurations[stage] > 0 ? (
                          <span className="text-gray-700">
                            {formatDuration(perf.stageDurations[stage], lang)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    ))}
                    <td className="font-mono font-bold text-purple-700">
                      {perf.totalTime > 0 ? formatDuration(perf.totalTime, lang) : '-'}
                    </td>
                    <td>
                      <span className={`badge ${
                        perf.status === 'COMPLETED' ? 'badge-green' :
                        perf.status === 'ACTIVE' ? 'badge-blue' :
                        'badge-gray'
                      }`}>
                        {perf.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Users Page
function UsersPage() {
  const { lang } = useApp();
  const users = db.getUsers();

  return (
    <div className="space-y-6 animate-slide-up">
      <h2 className="text-2xl font-bold text-gray-800">{t('users.title', lang)}</h2>

      <div className="card p-6">
        <table>
          <thead>
            <tr>
              <th>اسم المستخدم</th>
              <th>الاسم</th>
              <th>{t('users.role', lang)}</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td className="font-mono">{u.username}</td>
                <td>{u.name}</td>
                <td><span className="badge badge-purple">{u.role}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Settings Page
function SettingsPage() {
  const { lang, refresh } = useApp();
  const [branches, setBranches] = useState(db.getBranches());
  const [saved, setSaved] = useState(false);

  const handleSave = (id: string, updates: Partial<db.Branch>) => {
    db.updateBranch(id, updates);
    setBranches(db.getBranches());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    refresh();
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <h2 className="text-2xl font-bold text-gray-800">{t('settings.title', lang)}</h2>

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm">
          ✓ {t('settings.saved', lang)}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {branches.map(branch => (
          <BranchSettingsCard key={branch.id} branch={branch} onSave={handleSave} lang={lang} />
        ))}
      </div>
    </div>
  );
}

function BranchSettingsCard({ branch, onSave, lang }: { branch: db.Branch; onSave: (id: string, updates: Partial<db.Branch>) => void; lang: Lang }) {
  const [cashierCapacity, setCashierCapacity] = useState(branch.cashierCapacity);
  const [dockCapacity, setDockCapacity] = useState(branch.dockCapacity);
  const [maxQueue, setMaxQueue] = useState(branch.maxQueue);
  const [status, setStatus] = useState(branch.operationalStatus);

  return (
    <div className="card p-6">
      <h3 className="font-semibold text-gray-800 mb-4">{branch.name} ({branch.code})</h3>
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-600 mb-1">{t('settings.cashier_capacity', lang)}</label>
          <input type="number" min={1} value={cashierCapacity} onChange={e => setCashierCapacity(Number(e.target.value))} className="input" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">{t('settings.dock_capacity', lang)}</label>
          <input type="number" min={1} value={dockCapacity} onChange={e => setDockCapacity(Number(e.target.value))} className="input" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">{t('settings.max_queue', lang)}</label>
          <input type="number" min={1} value={maxQueue} onChange={e => setMaxQueue(Number(e.target.value))} className="input" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">{t('settings.operational_status', lang)}</label>
          <select value={status} onChange={e => setStatus(e.target.value as db.Branch['operationalStatus'])} className="input">
            <option value="ACTIVE">نشط</option>
            <option value="PAUSED">متوقف</option>
          </select>
        </div>
        <button
          onClick={() => onSave(branch.id, { cashierCapacity, dockCapacity, maxQueue, operationalStatus: status })}
          className="btn btn-primary w-full"
        >
          {t('settings.save', lang)}
        </button>
      </div>
    </div>
  );
}

// Main App
export default function App() {
  const [lang, setLang] = useState<Lang>('ar');
  const [user, setUser] = useState<db.User | null>(db.getCurrentUser());
  const [, setRefreshTick] = useState(0);

  const refresh = () => setRefreshTick(t => t + 1);

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const currentUser = db.getCurrentUser();
    if (currentUser) setUser(currentUser);
  }, []);

  return (
    <AppContext.Provider value={{ lang, setLang, user, setUser, refresh }}>
      <HashRouter>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/inbound" element={<ProtectedRoute><Layout><InboundPage /></Layout></ProtectedRoute>} />
          <Route path="/incoming" element={<ProtectedRoute><Layout><IncomingPage /></Layout></ProtectedRoute>} />
          <Route path="/couriers" element={<ProtectedRoute><Layout><CouriersPage /></Layout></ProtectedRoute>} />
          <Route path="/preparation" element={<ProtectedRoute><Layout><PreparationPage /></Layout></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute><Layout><InventoryPage /></Layout></ProtectedRoute>} />
          <Route path="/loading" element={<ProtectedRoute><Layout><LoadingPage /></Layout></ProtectedRoute>} />
          <Route path="/workflow" element={<ProtectedRoute><Layout><WorkflowPage /></Layout></ProtectedRoute>} />
          <Route path="/trips" element={<ProtectedRoute><Layout><TripsPage /></Layout></ProtectedRoute>} />
          <Route path="/cashier" element={<ProtectedRoute><Layout><CashierPage /></Layout></ProtectedRoute>} />
          <Route path="/queue" element={<ProtectedRoute><Layout><QueuePage /></Layout></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Layout><ReportsPage /></Layout></ProtectedRoute>} />
          <Route path="/performance" element={<ProtectedRoute><Layout><PerformanceReportPage /></Layout></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><Layout><UsersPage /></Layout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Layout><SettingsPage /></Layout></ProtectedRoute>} />
        </Routes>
      </HashRouter>
    </AppContext.Provider>
  );
}

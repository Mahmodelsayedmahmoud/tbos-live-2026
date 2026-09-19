import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, LogIn, LogOut, Menu, X, Users, Truck, FileText, Settings,
  ClipboardList, Package, ArrowDownCircle, Play, Square, Clock, AlertTriangle,
  CheckCircle, BarChart3, Layers, Globe, Zap
} from 'lucide-react';
import { Lang, t, formatDuration, formatTime } from './lib/i18n';
import * as db from './lib/db';

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
    { path: '/incoming', icon: ArrowDownCircle, label: 'nav.incoming', perm: 'trips.create' },
    { path: '/couriers', icon: Truck, label: 'nav.couriers', perm: 'couriers.read' },
    { path: '/workflow', icon: Layers, label: 'nav.workflow', perm: 'workflow.start' },
    { path: '/trips', icon: FileText, label: 'nav.trips', perm: 'trips.read' },
    { path: '/cashier', icon: ClipboardList, label: 'nav.cashier', perm: 'cashier.read' },
    { path: '/queue', icon: Clock, label: 'nav.queue', perm: 'queue.read' },
    { path: '/reports', icon: BarChart3, label: 'nav.reports', perm: 'reports.view' },
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

// Incoming Page
function IncomingPage() {
  const { lang, refresh } = useApp();
  const [couriers] = useState(db.getCouriers());
  const [selectedCourier, setSelectedCourier] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [branches] = useState(db.getBranches());
  const [trips, setTrips] = useState(db.getTrips());
  const [error, setError] = useState('');

  const handleCheckIn = () => {
    if (!selectedCourier || !selectedBranch) {
      setError('اختر المندوب والفرع');
      return;
    }
    const result = db.checkIn(selectedCourier, selectedBranch);
    if (result.success) {
      setError('');
      setSelectedCourier('');
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('couriers.name', lang)}</label>
            <select value={selectedCourier} onChange={e => setSelectedCourier(e.target.value)} className="input">
              <option value="">-- اختر --</option>
              {couriers.filter(c => c.status === 'AVAILABLE').map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('couriers.branch', lang)}</label>
            <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)} className="input">
              <option value="">-- اختر --</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={handleCheckIn} className="btn btn-success w-full">
              <ArrowDownCircle size={18} />
              {t('incoming.register', lang)}
            </button>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold mb-4">الرحلات النشطة</h3>
        <table>
          <thead>
            <tr>
              <th>{t('incoming.trip_number', lang)}</th>
              <th>{t('couriers.name', lang)}</th>
              <th>{t('couriers.branch', lang)}</th>
              <th>{t('incoming.arrival_time', lang)}</th>
              <th>{t('workflow.current_stage', lang)}</th>
            </tr>
          </thead>
          <tbody>
            {activeTrips.length === 0 ? (
              <tr><td colSpan={5} className="text-center text-gray-500 py-8">{t('common.no_data', lang)}</td></tr>
            ) : activeTrips.map(trip => {
              const courier = db.getCourier(trip.courierId);
              const branch = db.getBranch(trip.branchId);
              return (
                <tr key={trip.id}>
                  <td className="font-mono">{trip.tripNumber}</td>
                  <td>{courier?.name}</td>
                  <td>{branch?.name}</td>
                  <td>{formatTime(trip.arrivalAt, lang)}</td>
                  <td><span className="badge badge-blue">{t(`stage.${trip.currentStage}`, lang)}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
            const currentStageData = stages.find(s => s.stage === trip.currentStage);
            const decision = db.getLatestDecision(trip.id);
            const queuePos = db.getQueuePosition(trip.id);

            let liveDuration = 0;
            if (currentStageData?.startedAt && currentStageData.status === 'IN_PROGRESS') {
              liveDuration = Math.floor((Date.now() - new Date(currentStageData.startedAt).getTime()) / 1000);
            }

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
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('workflow.current_stage', lang)}:</span>
                    <span className="badge badge-blue">{t(`stage.${trip.currentStage}`, lang)}</span>
                  </div>
                  {currentStageData?.status === 'IN_PROGRESS' && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('workflow.duration', lang)}:</span>
                      <span className="font-mono text-indigo-600 font-bold animate-pulse-live">{formatDuration(liveDuration, lang)}</span>
                    </div>
                  )}
                </div>

                {decision && (
                  <div className="mt-3 p-2 rounded-lg bg-gray-50 border">
                    <p className="text-xs text-gray-500 mb-1">{t('workflow.decision', lang)}</p>
                    <p className="text-sm font-medium">{t(`decision.${decision.decision}`, lang)}</p>
                    {queuePos > 0 && (
                      <p className="text-xs text-orange-600 mt-1">
                        {t('queue.position', lang)}: {queuePos}
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  {currentStageData?.status === 'PENDING' && (
                    <button onClick={() => handleStart(trip.id, trip.currentStage)} className="btn btn-success flex-1">
                      <Play size={14} />
                      {t('workflow.start', lang)}
                    </button>
                  )}
                  {currentStageData?.status === 'IN_PROGRESS' && (
                    <button onClick={() => handleFinish(trip.id, trip.currentStage)} className="btn btn-danger flex-1">
                      <Square size={14} />
                      {t('workflow.finish', lang)}
                    </button>
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
  const { lang } = useApp();
  const [couriers, setCouriers] = useState(db.getCouriers());
  const [search, setSearch] = useState('');
  const branches = db.getBranches();

  const filtered = couriers.filter(c =>
    c.name.includes(search) || c.code.includes(search)
  );

  const statusBadge = (status: db.CourierStatus) => {
    const map: Record<db.CourierStatus, string> = {
      AVAILABLE: 'badge-green',
      ON_TRIP: 'badge-blue',
      WAITING: 'badge-orange',
      IN_CASHIER: 'badge-purple',
      COMPLETED: 'badge-red',
    };
    return <span className={`badge ${map[status]}`}>{t(`courier_status.${status}`, lang)}</span>;
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <h2 className="text-2xl font-bold text-gray-800">{t('couriers.title', lang)}</h2>

      <div className="card p-6">
        <input
          placeholder="بحث..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input mb-4"
        />
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
            {filtered.map(c => {
              const branch = branches.find(b => b.id === c.branchId);
              return (
                <tr key={c.id}>
                  <td className="font-mono">{c.code}</td>
                  <td>{c.name}</td>
                  <td>{c.phone}</td>
                  <td>{branch?.name}</td>
                  <td>{statusBadge(c.status)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
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
                      trip.status === 'COMPLETED' ? 'badge-red' : 'badge-orange'
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
                      trip.status === 'COMPLETED' ? 'badge-red' : 'badge-orange'
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

  const refresh = useCallback(() => {
    setRefreshTick(t => t + 1);
  }, []);

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
          <Route path="/incoming" element={<ProtectedRoute><Layout><IncomingPage /></Layout></ProtectedRoute>} />
          <Route path="/couriers" element={<ProtectedRoute><Layout><CouriersPage /></Layout></ProtectedRoute>} />
          <Route path="/trips" element={<ProtectedRoute><Layout><TripsPage /></Layout></ProtectedRoute>} />
          <Route path="/workflow" element={<ProtectedRoute><Layout><WorkflowPage /></Layout></ProtectedRoute>} />
          <Route path="/cashier" element={<ProtectedRoute><Layout><CashierPage /></Layout></ProtectedRoute>} />
          <Route path="/queue" element={<ProtectedRoute><Layout><QueuePage /></Layout></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Layout><ReportsPage /></Layout></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><Layout><UsersPage /></Layout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Layout><SettingsPage /></Layout></ProtectedRoute>} />
        </Routes>
      </HashRouter>
    </AppContext.Provider>
  );
}

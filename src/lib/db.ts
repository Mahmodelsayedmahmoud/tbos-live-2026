// TBOS Database Layer - localStorage based

export type UserRole = 'ADMIN' | 'SUPERVISOR' | 'WAREHOUSE' | 'CASHIER' | 'COURIER' | 'VIEWER';
export type CourierStatus = 'AVAILABLE' | 'ON_TRIP' | 'WAITING' | 'IN_CASHIER' | 'COMPLETED';
export type TripStatus = 'ACTIVE' | 'WAITING' | 'COMPLETED' | 'CANCELLED';
export type StageName = 'ENTRY' | 'DOCK' | 'PREPARATION' | 'INVENTORY' | 'LOADING' | 'DECISION' | 'CASHIER' | 'COMPLETED';

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  branchId: string | null;
  courierId: string | null;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  cashierCapacity: number;
  cashierOccupancy: number;
  dockCapacity: number;
  dockOccupancy: number;
  maxQueue: number;
  operationalStatus: 'ACTIVE' | 'PAUSED';
}

export interface Courier {
  id: string;
  code: string;
  name: string;
  phone: string;
  branchId: string;
  status: CourierStatus;
}

export interface Trip {
  id: string;
  tripNumber: string;
  courierId: string;
  branchId: string;
  arrivalAt: string;
  completedAt: string | null;
  currentStage: StageName;
  status: TripStatus;
}

export interface TripStage {
  id: string;
  tripId: string;
  stage: StageName;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  startedAt: string | null;
  finishedAt: string | null;
  durationSeconds: number;
}

export interface QueueRecord {
  id: string;
  tripId: string;
  branchId: string;
  queueNumber: number;
  priority: number;
  enteredAt: string;
  status: 'WAITING' | 'PROMOTED' | 'COMPLETED';
}

export interface SystemDecision {
  id: string;
  tripId: string;
  branchId: string;
  decision: 'GO_TO_CASHIER' | 'WAIT_CASHIER' | 'BLOCKED_INVENTORY' | 'WAIT_LOADING' | 'WAIT_CONGESTION';
  reasonAr: string;
  reasonEn: string;
  priority: number;
  queueId: string | null;
  createdAt: string;
}

interface DBState {
  users: User[];
  branches: Branch[];
  couriers: Courier[];
  trips: Trip[];
  tripStages: TripStage[];
  queue: QueueRecord[];
  decisions: SystemDecision[];
  currentUserId: string | null;
  nextTripNumber: number;
  nextQueueNumber: number;
}

const STORAGE_KEY = 'tbos_db';

function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

function getInitialState(): DBState {
  return {
    users: [
      { id: 'u1', username: 'admin', password: 'admin123', name: 'مدير النظام', role: 'ADMIN', branchId: null, courierId: null },
      { id: 'u2', username: 'supervisor', password: 'super123', name: 'المشرف', role: 'SUPERVISOR', branchId: 'b1', courierId: null },
      { id: 'u3', username: 'warehouse', password: 'wh123', name: 'أمين المخزن', role: 'WAREHOUSE', branchId: 'b1', courierId: null },
      { id: 'u4', username: 'cashier', password: 'cash123', name: 'أمين الكاشير', role: 'CASHIER', branchId: 'b1', courierId: null },
      { id: 'u5', username: 'courier', password: 'cr123', name: 'مندوب تجريبي', role: 'COURIER', branchId: 'b1', courierId: 'c1' },
      { id: 'u6', username: 'viewer', password: 'view123', name: 'مشاهد', role: 'VIEWER', branchId: null, courierId: null },
    ],
    branches: [
      { id: 'b1', name: 'القاهرة', code: 'CAI', cashierCapacity: 3, cashierOccupancy: 0, dockCapacity: 5, dockOccupancy: 0, maxQueue: 20, operationalStatus: 'ACTIVE' },
      { id: 'b2', name: 'الإسكندرية', code: 'ALX', cashierCapacity: 2, cashierOccupancy: 0, dockCapacity: 4, dockOccupancy: 0, maxQueue: 15, operationalStatus: 'ACTIVE' },
      { id: 'b3', name: 'طنطا', code: 'TNT', cashierCapacity: 2, cashierOccupancy: 0, dockCapacity: 3, dockOccupancy: 0, maxQueue: 10, operationalStatus: 'ACTIVE' },
    ],
    couriers: [
      { id: 'c1', code: 'C001', name: 'أحمد محمد', phone: '0101234567', branchId: 'b1', status: 'AVAILABLE' },
      { id: 'c2', code: 'C002', name: 'محمود علي', phone: '0109876543', branchId: 'b1', status: 'AVAILABLE' },
      { id: 'c3', code: 'C003', name: 'خالد حسن', phone: '0115554433', branchId: 'b2', status: 'AVAILABLE' },
      { id: 'c4', code: 'C004', name: 'عمر سعيد', phone: '0127778899', branchId: 'b2', status: 'AVAILABLE' },
      { id: 'c5', code: 'C005', name: 'ياسر إبراهيم', phone: '0103332211', branchId: 'b3', status: 'AVAILABLE' },
    ],
    trips: [],
    tripStages: [],
    queue: [],
    decisions: [],
    currentUserId: null,
    nextTripNumber: 1,
    nextQueueNumber: 1,
  };
}

function loadState(): DBState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // التحقق من صحة البيانات
      if (parsed && parsed.users && parsed.branches && Array.isArray(parsed.users) && parsed.users.length > 0) {
        // التحقق من وجود المستخدمين الافتراضيين
        const hasAdmin = parsed.users.some((u: User) => u.username === 'admin' && u.password === 'admin123');
        if (hasAdmin) {
          return parsed;
        }
      }
    }
  } catch (error) {
    console.warn('Failed to load state:', error);
  }
  // إذا كانت البيانات تالفة أو غير موجودة، استخدم البيانات الافتراضية
  const initial = getInitialState();
  saveState(initial);
  return initial;
}

function saveState(state: DBState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to save state:', error);
  }
}

let state: DBState = loadState();

// التحقق من صحة قاعدة البيانات عند التحميل
if (!validateDatabase()) {
  console.log('Database repaired successfully');
}

// Auth
export function login(username: string, password: string): { success: boolean; user?: User; error?: string } {
  // التحقق من المدخلات
  if (!username || !password) {
    return { success: false, error: 'missing_credentials' };
  }

  // البحث عن المستخدم
  const user = state.users.find(u => 
    u.username.toLowerCase() === username.toLowerCase() && 
    u.password === password
  );

  if (!user) {
    console.warn('Login failed: Invalid credentials for username:', username);
    return { success: false, error: 'invalid_credentials' };
  }

  // تسجيل الدخول بنجاح
  state.currentUserId = user.id;
  saveState(state);
  console.log('Login successful:', user.username, user.role);
  return { success: true, user };
}

export function logout(): void {
  state.currentUserId = null;
  saveState(state);
}

export function getCurrentUser(): User | null {
  if (!state.currentUserId) return null;
  return state.users.find(u => u.id === state.currentUserId) || null;
}

// Branches
export function getBranches(): Branch[] {
  return [...state.branches];
}

export function getBranch(id: string): Branch | undefined {
  return state.branches.find(b => b.id === id);
}

export function updateBranch(id: string, updates: Partial<Branch>): Branch | null {
  const idx = state.branches.findIndex(b => b.id === id);
  if (idx === -1) return null;
  state.branches[idx] = { ...state.branches[idx], ...updates };
  saveState(state);
  return state.branches[idx];
}

// Couriers
export function getCouriers(branchId?: string): Courier[] {
  if (branchId) return state.couriers.filter(c => c.branchId === branchId);
  return [...state.couriers];
}

export function getCourier(id: string): Courier | undefined {
  return state.couriers.find(c => c.id === id);
}

export function addCourier(data: Omit<Courier, 'id' | 'status'>): Courier {
  const courier: Courier = { ...data, id: generateId(), status: 'AVAILABLE' };
  state.couriers.push(courier);
  saveState(state);
  return courier;
}

export function updateCourier(id: string, updates: Partial<Courier>): Courier | null {
  const idx = state.couriers.findIndex(c => c.id === id);
  if (idx === -1) return null;
  state.couriers[idx] = { ...state.couriers[idx], ...updates };
  saveState(state);
  return state.couriers[idx];
}

// Trips
export function getTrips(branchId?: string, status?: TripStatus): Trip[] {
  let trips = [...state.trips];
  if (branchId) trips = trips.filter(t => t.branchId === branchId);
  if (status) trips = trips.filter(t => t.status === status);
  return trips;
}

export function getTrip(id: string): Trip | undefined {
  return state.trips.find(t => t.id === id);
}

export function getTripStages(tripId: string): TripStage[] {
  return state.tripStages.filter(s => s.tripId === tripId);
}

export function checkIn(courierId: string, branchId: string): { success: boolean; trip?: Trip; error?: string } {
  const activeTrip = state.trips.find(t => t.courierId === courierId && (t.status === 'ACTIVE' || t.status === 'WAITING'));
  if (activeTrip) return { success: false, error: 'ACTIVE_TRIP_EXISTS' };

  const courier = state.couriers.find(c => c.id === courierId);
  if (!courier) return { success: false, error: 'COURIER_NOT_FOUND' };

  const branch = state.branches.find(b => b.id === branchId);
  if (!branch) return { success: false, error: 'BRANCH_NOT_FOUND' };

  const tripNumber = `TR-${String(state.nextTripNumber).padStart(4, '0')}`;
  state.nextTripNumber++;

  const trip: Trip = {
    id: generateId(),
    tripNumber,
    courierId,
    branchId,
    arrivalAt: new Date().toISOString(),
    completedAt: null,
    currentStage: 'ENTRY',
    status: 'ACTIVE',
  };
  state.trips.push(trip);

  const stages: StageName[] = ['ENTRY', 'DOCK', 'PREPARATION', 'INVENTORY', 'LOADING', 'DECISION', 'CASHIER', 'COMPLETED'];
  stages.forEach(stage => {
    state.tripStages.push({
      id: generateId(),
      tripId: trip.id,
      stage,
      status: 'PENDING',
      startedAt: null,
      finishedAt: null,
      durationSeconds: 0,
    });
  });

  const cIdx = state.couriers.findIndex(c => c.id === courierId);
  if (cIdx !== -1) state.couriers[cIdx].status = 'ON_TRIP';

  saveState(state);
  return { success: true, trip };
}

// Workflow
const STAGE_ORDER: StageName[] = ['ENTRY', 'DOCK', 'PREPARATION', 'INVENTORY', 'LOADING', 'DECISION', 'CASHIER', 'COMPLETED'];

export function startStage(tripId: string, stage: StageName): { success: boolean; error?: string } {
  const trip = state.trips.find(t => t.id === tripId);
  if (!trip) return { success: false, error: 'TRIP_NOT_FOUND' };
  if (trip.status === 'COMPLETED' || trip.status === 'CANCELLED') return { success: false, error: 'TRIP_NOT_ACTIVE' };

  const stageIdx = STAGE_ORDER.indexOf(stage);
  const currentIdx = STAGE_ORDER.indexOf(trip.currentStage);

  if (stageIdx > currentIdx) return { success: false, error: 'STAGE_NOT_AVAILABLE' };
  if (stageIdx < currentIdx) return { success: false, error: 'STAGE_ALREADY_PASSED' };

  const tripStage = state.tripStages.find(s => s.tripId === tripId && s.stage === stage);
  if (!tripStage) return { success: false, error: 'STAGE_NOT_FOUND' };

  if (tripStage.status === 'IN_PROGRESS') return { success: false, error: 'STAGE_ALREADY_STARTED' };
  if (tripStage.status === 'COMPLETED') return { success: false, error: 'STAGE_ALREADY_COMPLETED' };

  tripStage.status = 'IN_PROGRESS';
  tripStage.startedAt = new Date().toISOString();
  trip.currentStage = stage;

  if (stage === 'DOCK') {
    const branch = state.branches.find(b => b.id === trip.branchId);
    if (branch) branch.dockOccupancy++;
  }

  saveState(state);
  return { success: true };
}

export function finishStage(tripId: string, stage: StageName): { success: boolean; error?: string } {
  const trip = state.trips.find(t => t.id === tripId);
  if (!trip) return { success: false, error: 'TRIP_NOT_FOUND' };

  const tripStage = state.tripStages.find(s => s.tripId === tripId && s.stage === stage);
  if (!tripStage) return { success: false, error: 'STAGE_NOT_FOUND' };

  if (tripStage.status !== 'IN_PROGRESS') return { success: false, error: 'STAGE_NOT_STARTED' };

  const now = new Date();
  tripStage.status = 'COMPLETED';
  tripStage.finishedAt = now.toISOString();
  if (tripStage.startedAt) {
    tripStage.durationSeconds = Math.floor((now.getTime() - new Date(tripStage.startedAt).getTime()) / 1000);
  }

  if (stage === 'DOCK') {
    const branch = state.branches.find(b => b.id === trip.branchId);
    if (branch && branch.dockOccupancy > 0) branch.dockOccupancy--;
  }

  const currentIdx = STAGE_ORDER.indexOf(stage);
  if (currentIdx < STAGE_ORDER.length - 1) {
    trip.currentStage = STAGE_ORDER[currentIdx + 1];
  }

  if (stage === 'CASHIER') {
    const branch = state.branches.find(b => b.id === trip.branchId);
    if (branch && branch.cashierOccupancy > 0) branch.cashierOccupancy--;
    trip.status = 'COMPLETED';
    trip.completedAt = now.toISOString();

    const courier = state.couriers.find(c => c.id === trip.courierId);
    if (courier) courier.status = 'AVAILABLE';

    const completedStage = state.tripStages.find(s => s.tripId === tripId && s.stage === 'COMPLETED');
    if (completedStage) {
      completedStage.status = 'COMPLETED';
      completedStage.startedAt = now.toISOString();
      completedStage.finishedAt = now.toISOString();
      completedStage.durationSeconds = 0;
    }

    promoteNextInQueue(trip.branchId);
  }

  saveState(state);
  return { success: true };
}

// Queue
function promoteNextInQueue(branchId: string): void {
  const branch = state.branches.find(b => b.id === branchId);
  if (!branch) return;

  const nextInQueue = state.queue
    .filter(q => q.branchId === branchId && q.status === 'WAITING')
    .sort((a, b) => a.priority - b.priority || new Date(a.enteredAt).getTime() - new Date(b.enteredAt).getTime())[0];

  if (!nextInQueue) return;
  if (branch.cashierOccupancy >= branch.cashierCapacity) return;

  branch.cashierOccupancy++;
  nextInQueue.status = 'PROMOTED';

  const trip = state.trips.find(t => t.id === nextInQueue.tripId);
  if (trip) {
    trip.currentStage = 'CASHIER';
    const cashierStage = state.tripStages.find(s => s.tripId === trip.id && s.stage === 'CASHIER');
    if (cashierStage) {
      cashierStage.status = 'IN_PROGRESS';
      cashierStage.startedAt = new Date().toISOString();
    }
    const courier = state.couriers.find(c => c.id === trip.courierId);
    if (courier) courier.status = 'IN_CASHIER';
  }
}

export function addToQueue(tripId: string, branchId: string, priority: number = 5): QueueRecord | null {
  const branch = state.branches.find(b => b.id === branchId);
  if (!branch) return null;

  const existing = state.queue.find(q => q.tripId === tripId && q.status === 'WAITING');
  if (existing) return existing;

  const record: QueueRecord = {
    id: generateId(),
    tripId,
    branchId,
    queueNumber: state.nextQueueNumber,
    priority,
    enteredAt: new Date().toISOString(),
    status: 'WAITING',
  };
  state.nextQueueNumber++;
  state.queue.push(record);
  saveState(state);
  return record;
}

export function getQueue(branchId?: string): QueueRecord[] {
  let items = [...state.queue];
  if (branchId) items = items.filter(q => q.branchId === branchId);
  return items.sort((a, b) => a.priority - b.priority || new Date(a.enteredAt).getTime() - new Date(b.enteredAt).getTime());
}

export function getQueuePosition(tripId: string): number {
  const branch = state.trips.find(t => t.id === tripId)?.branchId;
  if (!branch) return 0;
  const waiting = state.queue
    .filter(q => q.branchId === branch && q.status === 'WAITING')
    .sort((a, b) => a.priority - b.priority || new Date(a.enteredAt).getTime() - new Date(b.enteredAt).getTime());
  return waiting.findIndex(q => q.tripId === tripId) + 1;
}

// Decisions
export function getDecisions(branchId?: string): SystemDecision[] {
  let items = [...state.decisions];
  if (branchId) items = items.filter(d => d.branchId === branchId);
  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getLatestDecision(tripId: string): SystemDecision | undefined {
  return state.decisions
    .filter(d => d.tripId === tripId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
}

export function runDecisionEngine(tripId: string): SystemDecision | null {
  const trip = state.trips.find(t => t.id === tripId);
  if (!trip) return null;

  const branch = state.branches.find(b => b.id === trip.branchId);
  if (!branch) return null;

  const stages = state.tripStages.filter(s => s.tripId === tripId);
  const inventoryStage = stages.find(s => s.stage === 'INVENTORY');
  const loadingStage = stages.find(s => s.stage === 'LOADING');

  let decision: SystemDecision['decision'];
  let reasonAr: string;
  let reasonEn: string;
  let priority = 5;
  let queueId: string | null = null;

  if (!inventoryStage || inventoryStage.status !== 'COMPLETED') {
    decision = 'BLOCKED_INVENTORY';
    reasonAr = 'الجرد لم يكتمل بعد';
    reasonEn = 'Inventory not yet completed';
  } else if (!loadingStage || loadingStage.status !== 'COMPLETED') {
    decision = 'WAIT_LOADING';
    reasonAr = 'التحميل غير جاهز';
    reasonEn = 'Loading not ready';
  } else if (branch.operationalStatus === 'PAUSED') {
    decision = 'WAIT_CONGESTION';
    reasonAr = 'الفرع متوقف مؤقتاً';
    reasonEn = 'Branch is paused';
  } else if (branch.dockOccupancy >= branch.dockCapacity) {
    decision = 'WAIT_CONGESTION';
    reasonAr = 'يوجد ازدحام تشغيلي';
    reasonEn = 'Operational congestion detected';
  } else if (branch.cashierOccupancy >= branch.cashierCapacity) {
    decision = 'WAIT_CASHIER';
    reasonAr = 'الكاشير ممتلئ — انتظر على الرصيف';
    reasonEn = 'Cashier full — wait on dock';
    
    const queueRecord = addToQueue(tripId, branch.id, priority);
    if (queueRecord) queueId = queueRecord.id;
    
    trip.status = 'WAITING';
    const courier = state.couriers.find(c => c.id === trip.courierId);
    if (courier) courier.status = 'WAITING';
  } else {
    decision = 'GO_TO_CASHIER';
    reasonAr = 'الكاشير متاح — اذهب الآن';
    reasonEn = 'Cashier available — proceed';
    
    branch.cashierOccupancy++;
    trip.currentStage = 'CASHIER';
    
    const cashierStage = stages.find(s => s.stage === 'CASHIER');
    if (cashierStage) {
      cashierStage.status = 'IN_PROGRESS';
      cashierStage.startedAt = new Date().toISOString();
    }
    
    const courier = state.couriers.find(c => c.id === trip.courierId);
    if (courier) courier.status = 'IN_CASHIER';
  }

  const sysDecision: SystemDecision = {
    id: generateId(),
    tripId,
    branchId: branch.id,
    decision,
    reasonAr,
    reasonEn,
    priority,
    queueId,
    createdAt: new Date().toISOString(),
  };
  state.decisions.push(sysDecision);
  saveState(state);

  return sysDecision;
}

// Users
export function getUsers(): User[] {
  return [...state.users];
}

// Permissions
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  ADMIN: ['*'],
  SUPERVISOR: ['users.read', 'couriers.read', 'couriers.manage', 'branches.read', 'branches.manage', 'trips.read', 'trips.create', 'trips.manage', 'workflow.start', 'workflow.finish', 'cashier.read', 'cashier.manage', 'queue.read', 'queue.manage', 'reports.view', 'reports.export', 'settings.read', 'settings.manage', 'audit.read'],
  WAREHOUSE: ['trips.read', 'workflow.start', 'workflow.finish', 'couriers.read'],
  CASHIER: ['cashier.read', 'cashier.manage', 'trips.read', 'queue.read'],
  COURIER: ['trips.read'],
  VIEWER: ['trips.read', 'reports.view'],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  if (perms.includes('*')) return true;
  return perms.includes(permission);
}

// Dashboard Stats
export function getDashboardStats(branchId?: string) {
  let trips = [...state.trips];
  if (branchId) trips = trips.filter(t => t.branchId === branchId);
  
  const today = new Date().toDateString();
  const todayTrips = trips.filter(t => new Date(t.arrivalAt).toDateString() === today);
  
  const activeTrips = trips.filter(t => t.status === 'ACTIVE');
  const onDock = activeTrips.filter(t => t.currentStage === 'DOCK');
  const inPrep = activeTrips.filter(t => t.currentStage === 'PREPARATION');
  const inInventory = activeTrips.filter(t => t.currentStage === 'INVENTORY');
  const inLoading = activeTrips.filter(t => t.currentStage === 'LOADING');
  const inCashier = activeTrips.filter(t => t.currentStage === 'CASHIER');
  const waitingTrips = trips.filter(t => t.status === 'WAITING');
  
  const completedTrips = trips.filter(t => t.status === 'COMPLETED');
  const avgTripTime = completedTrips.length > 0
    ? completedTrips.reduce((sum, t) => {
        if (t.completedAt) {
          return sum + (new Date(t.completedAt).getTime() - new Date(t.arrivalAt).getTime()) / 1000;
        }
        return sum;
      }, 0) / completedTrips.length
    : 0;

  return {
    totalToday: todayTrips.length,
    active: activeTrips.length,
    onDock: onDock.length,
    inPrep: inPrep.length,
    inInventory: inInventory.length,
    inLoading: inLoading.length,
    inCashier: inCashier.length,
    inQueue: waitingTrips.length,
    avgTripTime: Math.round(avgTripTime),
  };
}

// Reset
export function resetDatabase(): void {
  state = getInitialState();
  saveState(state);
}

// Validate and repair database
export function validateDatabase(): boolean {
  try {
    // التحقق من وجود المستخدمين الأساسيين
    const requiredUsers = ['admin', 'supervisor', 'warehouse', 'cashier', 'courier', 'viewer'];
    const hasAllUsers = requiredUsers.every(username => 
      state.users.some(u => u.username === username)
    );

    // التحقق من وجود الفروع
    const hasBranches = state.branches && state.branches.length > 0;

    // التحقق من وجود المندوبين
    const hasCouriers = state.couriers && state.couriers.length > 0;

    if (!hasAllUsers || !hasBranches || !hasCouriers) {
      console.warn('Database validation failed, resetting...');
      resetDatabase();
      return false;
    }

    return true;
  } catch (error) {
    console.error('Database validation error:', error);
    resetDatabase();
    return false;
  }
}

// Get all users (for debugging)
export function getAllUsers(): User[] {
  return [...state.users];
}

// Check if user exists
export function userExists(username: string): boolean {
  return state.users.some(u => u.username.toLowerCase() === username.toLowerCase());
}

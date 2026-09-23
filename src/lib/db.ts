// TBOS Database Layer
// يستخدم localStorage كقاعدة بيانات أساسية
// Supabase اختياري للمزامنة بين الأجهزة

import { notifyDatabaseChange } from './sync';
import { supabase, isSupabaseConfigured } from './supabase';

// التحقق من توفر Supabase (اختياري)
const USE_SUPABASE = isSupabaseConfigured() && supabase !== null;

if (USE_SUPABASE) {
  console.log('🌐 TBOS: Supabase connected');
} else {
  console.log('💾 TBOS: Using localStorage');
}

export type UserRole = 'ADMIN' | 'SUPERVISOR' | 'WAREHOUSE' | 'CASHIER' | 'COURIER' | 'VIEWER';
export type CourierStatus = 'AVAILABLE' | 'ON_TRIP' | 'WAITING' | 'IN_CASHIER' | 'COMPLETED';
export type TripStatus = 'ACTIVE' | 'WAITING' | 'COMPLETED' | 'CANCELLED';
export type StageName = 'ENTRY' | 'DOCK' | 'PREPARATION' | 'INVENTORY' | 'LOADING' | 'DECISION' | 'CASHIER' | 'COMPLETED';
export type InboundStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

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

export interface InboundItem {
  id: string;
  inboundId: string;
  itemName: string;
  itemCode: string;
  quantity: number;
  unit: string;
  notes: string;
}

export interface Inbound {
  id: string;
  inboundNumber: string;
  driverName: string;
  driverCode: string;
  containerNumber: string;
  containerType: string;
  branchId: string;
  status: InboundStatus;
  startedAt: string | null;
  completedAt: string | null;
  items: InboundItem[];
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
  inbound: Inbound[];
  currentUserId: string | null;
  nextTripNumber: number;
  nextQueueNumber: number;
  nextInboundNumber: number;
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
    inbound: [],
    currentUserId: null,
    nextTripNumber: 1,
    nextQueueNumber: 1,
    nextInboundNumber: 1,
  };
}

// حالة محلية كـ cache
let state: DBState = getInitialState();

// إدخال البيانات الأولية (Seed Data)
async function seedInitialData(): Promise<void> {
  if (!USE_SUPABASE || !supabase) return;
  
  try {
    console.log('🌱 Seeding initial data to Supabase...');
    
    // إدخال الفروع
    const { error: branchesError } = await supabase
      .from('branches')
      .upsert([
        { id: 'b1', name: 'القاهرة', code: 'CAI', cashier_capacity: 3, cashier_occupancy: 0, dock_capacity: 5, dock_occupancy: 0, max_queue: 20, operational_status: 'ACTIVE' },
        { id: 'b2', name: 'الإسكندرية', code: 'ALX', cashier_capacity: 2, cashier_occupancy: 0, dock_capacity: 4, dock_occupancy: 0, max_queue: 15, operational_status: 'ACTIVE' },
        { id: 'b3', name: 'طنطا', code: 'TNT', cashier_capacity: 2, cashier_occupancy: 0, dock_capacity: 3, dock_occupancy: 0, max_queue: 10, operational_status: 'ACTIVE' },
      ], { onConflict: 'id' });
    
    if (branchesError) {
      console.warn('Could not seed branches:', branchesError.message);
    }
    
    // إدخال المندوبين
    const { error: couriersError } = await supabase
      .from('couriers')
      .upsert([
        { id: 'c1', code: 'C001', name: 'أحمد محمد', phone: '0101234567', branch_id: 'b1', status: 'AVAILABLE' },
        { id: 'c2', code: 'C002', name: 'محمود علي', phone: '0109876543', branch_id: 'b1', status: 'AVAILABLE' },
        { id: 'c3', code: 'C003', name: 'خالد حسن', phone: '0115554433', branch_id: 'b2', status: 'AVAILABLE' },
        { id: 'c4', code: 'C004', name: 'عمر سعيد', phone: '0127778899', branch_id: 'b2', status: 'AVAILABLE' },
        { id: 'c5', code: 'C005', name: 'ياسر إبراهيم', phone: '0103332211', branch_id: 'b3', status: 'AVAILABLE' },
      ], { onConflict: 'id' });
    
    if (couriersError) {
      console.warn('Could not seed couriers:', couriersError.message);
    }
    
    // إدخال المستخدمين
    const { error: usersError } = await supabase
      .from('users')
      .upsert([
        { id: 'u1', username: 'admin', password_hash: 'admin123', name: 'مدير النظام', role: 'ADMIN' },
        { id: 'u2', username: 'supervisor', password_hash: 'super123', name: 'المشرف', role: 'SUPERVISOR', branch_id: 'b1' },
        { id: 'u3', username: 'warehouse', password_hash: 'wh123', name: 'أمين المخزن', role: 'WAREHOUSE', branch_id: 'b1' },
        { id: 'u4', username: 'cashier', password_hash: 'cash123', name: 'أمين الكاشير', role: 'CASHIER', branch_id: 'b1' },
        { id: 'u5', username: 'courier', password_hash: 'cr123', name: 'مندوب تجريبي', role: 'COURIER', branch_id: 'b1', courier_id: 'c1' },
        { id: 'u6', username: 'viewer', password_hash: 'view123', name: 'مشاهد', role: 'VIEWER' },
      ], { onConflict: 'id' });
    
    if (usersError) {
      console.warn('Could not seed users:', usersError.message);
    }
    
    console.log('✅ Initial data seeded successfully');
  } catch (error) {
    console.error('❌ Failed to seed initial data:', error);
  }
}

// تحميل البيانات من Supabase عند بدء التطبيق
async function loadFromSupabase(): Promise<void> {
  if (!USE_SUPABASE || !supabase) return;
  
  try {
    console.log('📥 Loading data from Supabase...');
    
    // تحميل الفروع
    const { data: branchesData, error: branchesError } = await supabase
      .from('branches')
      .select('*');
    
    if (!branchesError && branchesData && branchesData.length > 0) {
      state.branches = branchesData.map((b: any) => ({
        id: b.id,
        name: b.name,
        code: b.code,
        cashierCapacity: b.cashier_capacity,
        cashierOccupancy: b.cashier_occupancy,
        dockCapacity: b.dock_capacity,
        dockOccupancy: b.dock_occupancy,
        maxQueue: b.max_queue,
        operationalStatus: b.operational_status
      }));
    } else {
      // إذا كانت الفروع فارغة، أدخل البيانات الأولية
      console.log('🌱 Branches table is empty, seeding initial data...');
      await seedInitialData();
      
      // أعد تحميل الفروع
      const { data: newBranchesData } = await supabase.from('branches').select('*');
      if (newBranchesData && newBranchesData.length > 0) {
        state.branches = newBranchesData.map((b: any) => ({
          id: b.id,
          name: b.name,
          code: b.code,
          cashierCapacity: b.cashier_capacity,
          cashierOccupancy: b.cashier_occupancy,
          dockCapacity: b.dock_capacity,
          dockOccupancy: b.dock_occupancy,
          maxQueue: b.max_queue,
          operationalStatus: b.operational_status
        }));
      }
    }
    
    // تحميل المندوبين
    const { data: couriersData, error: couriersError } = await supabase
      .from('couriers')
      .select('*');
    
    if (!couriersError && couriersData && couriersData.length > 0) {
      state.couriers = couriersData.map((c: any) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        phone: c.phone,
        branchId: c.branch_id,
        status: c.status
      }));
    }
    
    // تحميل الرحلات
    const { data: tripsData, error: tripsError } = await supabase
      .from('trips')
      .select('*');
    
    if (!tripsError && tripsData && tripsData.length > 0) {
      state.trips = tripsData.map((t: any) => ({
        id: t.id,
        tripNumber: t.trip_number,
        courierId: t.courier_id,
        branchId: t.branch_id,
        arrivalAt: t.arrival_at,
        completedAt: t.completed_at,
        currentStage: t.current_stage,
        status: t.status
      }));
    }
    
    console.log('✅ Data loaded from Supabase successfully');
  } catch (error) {
    console.error('❌ Failed to load from Supabase:', error);
  }
}

// بدء التحميل من Supabase (اختياري - فقط إذا كان متاحاً)
if (USE_SUPABASE) {
  loadFromSupabase().catch(error => {
    console.warn('⚠️ Could not load from Supabase, using localStorage:', error);
  });
}

function saveState(state: DBState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to save state:', error);
  }
}

// Auth
export function login(username: string, password: string): { success: boolean; user?: User; error?: string } {
  if (!username || !password) {
    return { success: false, error: 'missing_credentials' };
  }
  const user = state.users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
  if (!user) return { success: false, error: 'invalid_credentials' };
  state.currentUserId = user.id;
  saveState(state);
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

export async function updateBranch(id: string, updates: Partial<Branch>): Promise<Branch | null> {
  if (USE_SUPABASE && supabase) {
    try {
      const { data, error } = await supabase
        .from('branches')
        .update({
          cashier_capacity: updates.cashierCapacity,
          cashier_occupancy: updates.cashierOccupancy,
          dock_capacity: updates.dockCapacity,
          dock_occupancy: updates.dockOccupancy,
          max_queue: updates.maxQueue,
          operational_status: updates.operationalStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // تحديث الحالة المحلية
      const idx = state.branches.findIndex(b => b.id === id);
      if (idx !== -1 && data) {
        state.branches[idx] = {
          ...state.branches[idx],
          ...updates
        };
        saveState(state);
        notifyDatabaseChange('branches', 'update', state.branches[idx]);
        return state.branches[idx];
      }
    } catch (error) {
      console.error('Failed to update branch in Supabase:', error);
    }
  }
  
  // Fallback إلى localStorage
  const idx = state.branches.findIndex(b => b.id === id);
  if (idx === -1) return null;
  state.branches[idx] = { ...state.branches[idx], ...updates };
  saveState(state);
  notifyDatabaseChange('branches', 'update', state.branches[idx]);
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

export async function addCourier(data: Omit<Courier, 'id' | 'status'>): Promise<Courier> {
  const courier: Courier = { ...data, id: generateId(), status: 'AVAILABLE' };
  
  if (USE_SUPABASE && supabase) {
    try {
      const { error } = await supabase
        .from('couriers')
        .insert({
          id: courier.id,
          code: courier.code,
          name: courier.name,
          phone: courier.phone,
          branch_id: courier.branchId,
          status: courier.status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      state.couriers.push(courier);
      saveState(state);
      notifyDatabaseChange('couriers', 'add', courier);
      return courier;
    } catch (error) {
      console.error('Failed to add courier to Supabase:', error);
    }
  }
  
  // Fallback إلى localStorage
  state.couriers.push(courier);
  saveState(state);
  notifyDatabaseChange('couriers', 'add', courier);
  return courier;
}

export function bulkImportCouriers(couriersData: Array<Omit<Courier, 'id' | 'status'>>): { success: number; failed: number; errors: string[] } {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  // الحصول على الفرع الافتراضي (أول فرع في النظام)
  const defaultBranch = state.branches.length > 0 ? state.branches[0] : null;

  couriersData.forEach((data, index) => {
    try {
      // التحقق المرن: فقط الاسم مطلوب
      if (!data.name) {
        failed++;
        errors.push(`Row ${index + 1}: Name is required`);
        return;
      }

      // توليد كود تلقائي إذا لم يكن موجوداً
      const courierCode = data.code || `AUTO-${String(state.couriers.length + index + 1).padStart(4, '0')}`;

      // التحقق من عدم تكرار الكود
      const existingCourier = state.couriers.find(c => c.code === courierCode);
      if (existingCourier) {
        failed++;
        errors.push(`Row ${index + 1}: Courier code "${courierCode}" already exists`);
        return;
      }

      // البحث عن الفرع بمرونة
      let branchId = data.branchId;
      
      // إذا لم يكن branchId موجوداً، استخدم الفرع الافتراضي
      if (!branchId && defaultBranch) {
        branchId = defaultBranch.id;
      }
      
      // إذا كان branchId موجوداً، تحقق من وجوده
      if (branchId) {
        const branch = state.branches.find(b => b.id === branchId || b.name === branchId || b.code === branchId);
        if (!branch && defaultBranch) {
          // إذا لم يتم العثور على الفرع، استخدم الفرع الافتراضي
          branchId = defaultBranch.id;
        } else if (branch) {
          branchId = branch.id;
        }
      }

      // إنشاء المندوب
      const courierData: Omit<Courier, 'id' | 'status'> = {
        code: courierCode,
        name: data.name,
        phone: data.phone || '',
        branchId: branchId || (defaultBranch ? defaultBranch.id : 'b1'),
      };

      addCourier(courierData);
      success++;
    } catch (error) {
      failed++;
      errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  return { success, failed, errors };
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

export async function checkIn(courierId: string, branchId: string): Promise<{ success: boolean; trip?: Trip; error?: string }> {
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
  
  if (USE_SUPABASE && supabase) {
    try {
      // حفظ الرحلة في Supabase
      const { error: tripError } = await supabase
        .from('trips')
        .insert({
          id: trip.id,
          trip_number: trip.tripNumber,
          courier_id: trip.courierId,
          branch_id: trip.branchId,
          arrival_at: trip.arrivalAt,
          current_stage: trip.currentStage,
          status: trip.status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (tripError) throw tripError;
      
      // حفظ المراحل في Supabase
      const stages: StageName[] = ['ENTRY', 'DOCK', 'PREPARATION', 'INVENTORY', 'LOADING', 'DECISION', 'CASHIER', 'COMPLETED'];
      const stagesData = stages.map(stage => ({
        id: generateId(),
        trip_id: trip.id,
        stage,
        status: 'PENDING',
        started_at: null,
        finished_at: null,
        duration_seconds: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      const { error: stagesError } = await supabase
        .from('trip_stages')
        .insert(stagesData);
      
      if (stagesError) throw stagesError;
      
      // تحديث حالة المندوب في Supabase
      const { error: courierError } = await supabase
        .from('couriers')
        .update({ status: 'ON_TRIP', updated_at: new Date().toISOString() })
        .eq('id', courierId);
      
      if (courierError) throw courierError;
      
      // تحديث الحالة المحلية
      state.trips.push(trip);
      stages.forEach((stage, idx) => {
        state.tripStages.push({
          id: stagesData[idx].id,
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
      notifyDatabaseChange('trips', 'create', trip);
      return { success: true, trip };
    } catch (error) {
      console.error('Failed to checkIn in Supabase:', error);
    }
  }
  
  // Fallback إلى localStorage
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
  notifyDatabaseChange('trips', 'create', trip);
  return { success: true, trip };
}

// Workflow
const STAGE_ORDER: StageName[] = ['ENTRY', 'DOCK', 'PREPARATION', 'INVENTORY', 'LOADING', 'DECISION', 'CASHIER', 'COMPLETED'];

export async function startStage(tripId: string, stage: StageName): Promise<{ success: boolean; error?: string }> {
  const trip = state.trips.find(t => t.id === tripId);
  if (!trip) return { success: false, error: 'TRIP_NOT_FOUND' };

  const tripStage = state.tripStages.find(s => s.tripId === tripId && s.stage === stage);
  if (!tripStage) return { success: false, error: 'STAGE_NOT_FOUND' };

  // السماح ببدء أي مرحلة طالما أنها PENDING (مرونة في الترتيب)
  if (tripStage.status !== 'PENDING') return { success: false, error: 'STAGE_NOT_PENDING' };

  tripStage.status = 'IN_PROGRESS';
  tripStage.startedAt = new Date().toISOString();
  
  // تحديث currentStage فقط إذا لم تكن هناك مرحلة أخرى قيد التشغيل
  const activeStages = state.tripStages.filter(s => s.tripId === tripId && s.status === 'IN_PROGRESS');
  if (activeStages.length === 1) {
    trip.currentStage = stage;
  }

  if (USE_SUPABASE && supabase) {
    try {
      const { error } = await supabase
        .from('trip_stages')
        .update({
          status: 'IN_PROGRESS',
          started_at: tripStage.startedAt,
          updated_at: new Date().toISOString()
        })
        .eq('id', tripStage.id);
      
      if (error) throw error;
      
      const { error: tripError } = await supabase
        .from('trips')
        .update({
          current_stage: trip.currentStage,
          updated_at: new Date().toISOString()
        })
        .eq('id', tripId);
      
      if (tripError) throw tripError;
    } catch (error) {
      console.error('Failed to startStage in Supabase:', error);
    }
  }

  saveState(state);
  notifyDatabaseChange('stages', 'start', { tripId, stage });
  return { success: true };
}

export async function finishStage(tripId: string, stage: StageName): Promise<{ success: boolean; error?: string }> {
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

  // تحديث currentStage بذكاء: اختر المرحلة النشطة التالية أو الأخيرة
  const activeStages = state.tripStages.filter(s => s.tripId === tripId && s.status === 'IN_PROGRESS');
  if (activeStages.length > 0) {
    // اختر المرحلة الأقدم في الترتيب
    const sortedActive = activeStages.sort((a, b) => 
      STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage)
    );
    trip.currentStage = sortedActive[0].stage;
  } else {
    // لا توجد مراحل نشطة، اختر المرحلة التالية غير المكتملة
    const pendingStages = state.tripStages.filter(s => s.tripId === tripId && s.status === 'PENDING');
    if (pendingStages.length > 0) {
      const sortedPending = pendingStages.sort((a, b) => 
        STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage)
      );
      trip.currentStage = sortedPending[0].stage;
    } else {
      // جميع المراحل مكتملة
      trip.currentStage = 'COMPLETED';
    }
  }

  if (stage === 'CASHIER') {
    trip.status = 'COMPLETED';
    trip.completedAt = now.toISOString();
    const courier = state.couriers.find(c => c.id === trip.courierId);
    if (courier) courier.status = 'AVAILABLE';
    
    // تقليل إشغال الكاشير
    const branch = state.branches.find(b => b.id === trip.branchId);
    if (branch && branch.cashierOccupancy > 0) {
      branch.cashierOccupancy--;
      
      // ترقية الرحلة التالية من الطابور تلقائياً
      promoteFromQueue(branch.id);
    }
  }
  
  if (USE_SUPABASE && supabase) {
    try {
      // تحديث المرحلة في Supabase
      const { error: stageError } = await supabase
        .from('trip_stages')
        .update({
          status: tripStage.status,
          started_at: tripStage.startedAt,
          finished_at: tripStage.finishedAt,
          duration_seconds: tripStage.durationSeconds,
          updated_at: new Date().toISOString()
        })
        .eq('id', tripStage.id);
      
      if (stageError) throw stageError;
      
      // تحديث الرحلة في Supabase
      const { error: tripError } = await supabase
        .from('trips')
        .update({
          current_stage: trip.currentStage,
          status: trip.status,
          completed_at: trip.completedAt,
          updated_at: new Date().toISOString()
        })
        .eq('id', tripId);
      
      if (tripError) throw tripError;
      
      // إذا كانت المرحلة CASHIER، تحديث المندوب والفرع
      if (stage === 'CASHIER') {
        const { error: courierError } = await supabase
          .from('couriers')
          .update({ status: 'AVAILABLE', updated_at: new Date().toISOString() })
          .eq('id', trip.courierId);
        
        if (courierError) throw courierError;
        
        const branch = state.branches.find(b => b.id === trip.branchId);
        if (branch) {
          const { error: branchError } = await supabase
            .from('branches')
            .update({ 
              cashier_occupancy: branch.cashierOccupancy,
              updated_at: new Date().toISOString()
            })
            .eq('id', branch.id);
          
          if (branchError) throw branchError;
        }
      }
    } catch (error) {
      console.error('Failed to finishStage in Supabase:', error);
    }
  }
  
  saveState(state);
  notifyDatabaseChange('stages', 'finish', { tripId, stage });
  return { success: true };
}
// Queue
export function getQueue(branchId?: string): QueueRecord[] {
  let items = [...state.queue];
  if (branchId) items = items.filter(q => q.branchId === branchId);
  return items.sort((a, b) => {
    // ترتيب حسب الأولوية ثم حسب وقت الدخول
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    return new Date(a.enteredAt).getTime() - new Date(b.enteredAt).getTime();
  });
}

export function getQueuePosition(tripId: string): number {
  const branch = state.trips.find(t => t.id === tripId)?.branchId;
  if (!branch) return 0;
  const waiting = state.queue.filter(q => q.branchId === branch && q.status === 'WAITING');
  return waiting.findIndex(q => q.tripId === tripId) + 1;
}

export function addToQueue(tripId: string, branchId: string, priority: number = 5): QueueRecord | null {
  // التحقق من عدم وجود الرحلة في الطابور بالفعل
  const existing = state.queue.find(q => q.tripId === tripId && q.status === 'WAITING');
  if (existing) {
    return existing;
  }

  // حساب رقم الطابور التالي
  const branchQueue = state.queue.filter(q => q.branchId === branchId);
  const maxQueueNumber = branchQueue.length > 0 
    ? Math.max(...branchQueue.map(q => q.queueNumber))
    : 0;

  const queueRecord: QueueRecord = {
    id: generateId(),
    tripId,
    branchId,
    queueNumber: maxQueueNumber + 1,
    priority,
    enteredAt: new Date().toISOString(),
    status: 'WAITING',
  };

  state.queue.push(queueRecord);
  saveState(state);
  notifyDatabaseChange('queue', 'add', queueRecord);
  
  return queueRecord;
}

export function promoteFromQueue(branchId: string): QueueRecord | null {
  const branch = state.branches.find(b => b.id === branchId);
  if (!branch) return null;

  // التحقق من وجود مساحة في الكاشير
  if (branch.cashierOccupancy >= branch.cashierCapacity) {
    return null;
  }

  // الحصول على أول رحلة في الطابور (حسب الأولوية ثم وقت الدخول)
  const waitingQueue = state.queue
    .filter(q => q.branchId === branchId && q.status === 'WAITING')
    .sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return new Date(a.enteredAt).getTime() - new Date(b.enteredAt).getTime();
    });

  if (waitingQueue.length === 0) {
    return null;
  }

  const nextInQueue = waitingQueue[0];
  
  // تحديث حالة الطابور
  nextInQueue.status = 'PROMOTED';
  
  // زيادة إشغال الكاشير
  branch.cashierOccupancy++;
  
  // تحديث حالة الرحلة
  const trip = state.trips.find(t => t.id === nextInQueue.tripId);
  if (trip) {
    trip.status = 'ACTIVE';
    trip.currentStage = 'CASHIER';
    
    // بدء مرحلة الكاشير
    const cashierStage = state.tripStages.find(s => s.tripId === trip.id && s.stage === 'CASHIER');
    if (cashierStage) {
      cashierStage.status = 'IN_PROGRESS';
      cashierStage.startedAt = new Date().toISOString();
    }
    
    // تحديث حالة المندوب
    const courier = state.couriers.find(c => c.id === trip.courierId);
    if (courier) {
      courier.status = 'IN_CASHIER';
    }
  }
  
  saveState(state);
  notifyDatabaseChange('queue', 'promote', nextInQueue);
  return nextInQueue;
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

  if (!inventoryStage || inventoryStage.status !== 'COMPLETED') {
    decision = 'BLOCKED_INVENTORY';
    reasonAr = 'الجرد لم يكتمل بعد';
    reasonEn = 'Inventory not yet completed';
  } else if (!loadingStage || loadingStage.status !== 'COMPLETED') {
    decision = 'WAIT_LOADING';
    reasonAr = 'التحميل غير جاهز';
    reasonEn = 'Loading not ready';
  } else if (branch.cashierOccupancy >= branch.cashierCapacity) {
    decision = 'WAIT_CASHIER';
    reasonAr = 'الكاشير ممتلئ - انتظر على الرصيف';
    reasonEn = 'Cashier full - wait on dock';
    
    // إضافة الرحلة إلى الطابور تلقائياً
    const queueRecord = addToQueue(tripId, branch.id, 5);
    
    // تحديث حالة الرحلة إلى WAITING
    trip.status = 'WAITING';
    
    // تحديث حالة المندوب إلى WAITING
    const courier = state.couriers.find(c => c.id === trip.courierId);
    if (courier) {
      courier.status = 'WAITING';
    }
    
    // حفظ queueId في القرار
    const sysDecision: SystemDecision = {
      id: generateId(),
      tripId,
      branchId: branch.id,
      decision,
      reasonAr,
      reasonEn,
      priority: 5,
      queueId: queueRecord ? queueRecord.id : null,
      createdAt: new Date().toISOString(),
    };
    state.decisions.push(sysDecision);
    saveState(state);
    
    return sysDecision;
  } else {
    decision = 'GO_TO_CASHIER';
    reasonAr = 'الكاشير متاح';
    reasonEn = 'Cashier available';
    branch.cashierOccupancy++;
  }
  
  const sysDecision: SystemDecision = {
    id: generateId(),
    tripId,
    branchId: branch.id,
    decision,
    reasonAr,
    reasonEn,
    priority: 5,
    queueId: null,
    createdAt: new Date().toISOString(),
  };
  state.decisions.push(sysDecision);
  saveState(state);
  notifyDatabaseChange('decisions', 'create', sysDecision);
  
  return sysDecision;}

// Inbound
export function getInbounds(branchId?: string): Inbound[] {
  if (!state.inbound) state.inbound = [];
  let items = [...state.inbound];
  if (branchId) items = items.filter(i => i.branchId === branchId);
  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getInbound(id: string): Inbound | undefined {
  if (!state.inbound) return undefined;
  return state.inbound.find(i => i.id === id);
}

export function createInbound(
  driverName: string,
  driverCode: string,
  containerNumber: string,
  containerType: string,
  branchId: string
): Inbound {
  if (!state.inbound) state.inbound = [];
  
  const inboundNumber = `INB-${String(state.nextInboundNumber).padStart(4, '0')}`;
  state.nextInboundNumber++;

  const inbound: Inbound = {
    id: generateId(),
    inboundNumber,
    driverName,
    driverCode,
    containerNumber,
    containerType,
    branchId,
    status: 'PENDING',
    startedAt: null,
    completedAt: null,
    items: [],
    createdAt: new Date().toISOString(),
  };
  state.inbound.push(inbound);
  saveState(state);
  notifyDatabaseChange('inbound', 'create', inbound);
  return inbound;
}

// بدء العد
export function startInbound(id: string): Inbound | null {
  if (!state.inbound) return null;
  
  const idx = state.inbound.findIndex(i => i.id === id);
  if (idx === -1) return null;
  
  state.inbound[idx].status = 'IN_PROGRESS';
  state.inbound[idx].startedAt = new Date().toISOString();
  saveState(state);
  notifyDatabaseChange('inbound', 'start', state.inbound[idx]);
  return state.inbound[idx];
}

// إنهاء العد
export function completeInbound(id: string): Inbound | null {
  if (!state.inbound) return null;
  
  const idx = state.inbound.findIndex(i => i.id === id);
  if (idx === -1) return null;
  
  state.inbound[idx].status = 'COMPLETED';
  state.inbound[idx].completedAt = new Date().toISOString();
  saveState(state);
  notifyDatabaseChange('inbound', 'complete', state.inbound[idx]);
  return state.inbound[idx];
}

// إضافة صنف لوارد
export function addInboundItem(
  inboundId: string,
  itemName: string,
  itemCode: string,
  quantity: number,
  unit: string,
  notes: string = ''
): InboundItem | null {
  if (!state.inbound) return null;
  
  const inbound = state.inbound.find(i => i.id === inboundId);
  if (!inbound) return null;

  const item: InboundItem = {
    id: generateId(),
    inboundId,
    itemName,
    itemCode,
    quantity,
    unit,
    notes,
  };
  inbound.items.push(item);
  saveState(state);
  return item;
}

// حذف صنف من وارد
export function removeInboundItem(inboundId: string, itemId: string): boolean {
  if (!state.inbound) return false;
  
  const inbound = state.inbound.find(i => i.id === inboundId);
  if (!inbound) return false;

  const idx = inbound.items.findIndex(it => it.id === itemId);
  if (idx === -1) return false;

  inbound.items.splice(idx, 1);
  saveState(state);
  return true;
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

// Delete Functions
export function deleteInbound(id: string): boolean {
  const idx = state.inbound.findIndex(i => i.id === id);
  if (idx === -1) return false;
  const inbound = state.inbound[idx];
  state.inbound.splice(idx, 1);
  saveState(state);
  notifyDatabaseChange('inbound', 'delete', inbound);
  return true;
}

export function deleteCourier(id: string): boolean {
  const idx = state.couriers.findIndex(c => c.id === id);
  if (idx === -1) return false;
  const courier = state.couriers[idx];
  state.couriers.splice(idx, 1);
  saveState(state);
  notifyDatabaseChange('couriers', 'delete', courier);
  return true;
}

export function updateCourier(id: string, updates: Partial<Courier>): Courier | null {
  const idx = state.couriers.findIndex(c => c.id === id);
  if (idx === -1) return null;
  state.couriers[idx] = { ...state.couriers[idx], ...updates };
  saveState(state);
  return state.couriers[idx];
}

export function deleteTrip(id: string): boolean {
  const idx = state.trips.findIndex(t => t.id === id);
  if (idx === -1) return false;
  const trip = state.trips[idx];
  state.trips.splice(idx, 1);
  // حذف المراحل المرتبطة
  state.tripStages = state.tripStages.filter(s => s.tripId !== id);
  saveState(state);
  notifyDatabaseChange('trips', 'delete', trip);
  return true;
}

export function updateTripStatus(id: string, status: TripStatus): Trip | null {
  const idx = state.trips.findIndex(t => t.id === id);
  if (idx === -1) return null;
  state.trips[idx].status = status;
  if (status === 'COMPLETED') {
    state.trips[idx].completedAt = new Date().toISOString();
  }
  saveState(state);
  return state.trips[idx];
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

  return {
    totalToday: todayTrips.length,
    active: activeTrips.length,
    onDock: onDock.length,
    inPrep: inPrep.length,
    inInventory: inInventory.length,
    inLoading: inLoading.length,
    inCashier: inCashier.length,
    inQueue: waitingTrips.length,
    avgTripTime: 0,
  };
}

// ============================================
// 🌐 SUPABASE CLOUD SYNC FUNCTIONS
// ============================================

// التحقق من حالة الاتصال بـ Supabase
export function getSyncStatus(): { connected: boolean; mode: 'cloud' | 'local' } {
  const connected = isSupabaseConfigured() && supabase !== null;
  return {
    connected,
    mode: connected ? 'cloud' : 'local'
  };
}

// مزامنة البيانات المحلية مع Supabase
export async function syncToSupabase(): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, message: 'Supabase not configured' };
  }

  try {
    console.log('🔄 Starting sync to Supabase...');
    
    // مزامنة الفروع
    const { error: branchesError } = await supabase
      .from('branches')
      .upsert(state.branches.map(b => ({
        id: b.id,
        name: b.name,
        code: b.code,
        cashier_capacity: b.cashierCapacity,
        cashier_occupancy: b.cashierOccupancy,
        dock_capacity: b.dockCapacity,
        dock_occupancy: b.dockOccupancy,
        max_queue: b.maxQueue,
        operational_status: b.operationalStatus
      })), { onConflict: 'id' });

    if (branchesError) throw branchesError;

    // مزامنة المندوبين
    const { error: couriersError } = await supabase
      .from('couriers')
      .upsert(state.couriers.map(c => ({
        id: c.id,
        code: c.code,
        name: c.name,
        phone: c.phone,
        branch_id: c.branchId,
        status: c.status
      })), { onConflict: 'id' });

    if (couriersError) throw couriersError;

    // مزامنة الرحلات
    const { error: tripsError } = await supabase
      .from('trips')
      .upsert(state.trips.map(t => ({
        id: t.id,
        trip_number: t.tripNumber,
        courier_id: t.courierId,
        branch_id: t.branchId,
        arrival_at: t.arrivalAt,
        completed_at: t.completedAt,
        current_stage: t.currentStage,
        status: t.status
      })), { onConflict: 'id' });

    if (tripsError) throw tripsError;

    console.log('✅ Sync to Supabase completed successfully');
    return { success: true, message: 'Data synced to cloud successfully' };
  } catch (error) {
    console.error('❌ Sync failed:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// استيراد البيانات من Supabase
export async function syncFromSupabase(): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, message: 'Supabase not configured' };
  }

  try {
    console.log('🔄 Starting sync from Supabase...');
    
    // استيراد الفروع
    const { data: branchesData, error: branchesError } = await supabase
      .from('branches')
      .select('*');

    if (branchesError) throw branchesError;
    if (branchesData && branchesData.length > 0) {
      state.branches = branchesData.map(b => ({
        id: b.id,
        name: b.name,
        code: b.code,
        cashierCapacity: b.cashier_capacity,
        cashierOccupancy: b.cashier_occupancy,
        dockCapacity: b.dock_capacity,
        dockOccupancy: b.dock_occupancy,
        maxQueue: b.max_queue,
        operationalStatus: b.operational_status
      }));
    }

    // استيراد المندوبين
    const { data: couriersData, error: couriersError } = await supabase
      .from('couriers')
      .select('*');

    if (couriersError) throw couriersError;
    if (couriersData && couriersData.length > 0) {
      state.couriers = couriersData.map(c => ({
        id: c.id,
        code: c.code,
        name: c.name,
        phone: c.phone,
        branchId: c.branch_id,
        status: c.status
      }));
    }

    // استيراد الرحلات
    const { data: tripsData, error: tripsError } = await supabase
      .from('trips')
      .select('*');

    if (tripsError) throw tripsError;
    if (tripsData && tripsData.length > 0) {
      state.trips = tripsData.map(t => ({
        id: t.id,
        tripNumber: t.trip_number,
        courierId: t.courier_id,
        branchId: t.branch_id,
        arrivalAt: t.arrival_at,
        completedAt: t.completed_at,
        currentStage: t.current_stage,
        status: t.status
      }));
    }

    saveState(state);
    console.log('✅ Sync from Supabase completed successfully');
    return { success: true, message: 'Data imported from cloud successfully' };
  } catch (error) {
    console.error('❌ Sync failed:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// الاشتراك في التغييرات من Supabase
export function subscribeToSupabaseChanges(callback: () => void): () => void {
  if (!isSupabaseConfigured() || !supabase) {
    return () => {};
  }

  const channels = [
    supabase.channel('branches-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'branches' }, callback)
      .subscribe(),
    
    supabase.channel('couriers-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'couriers' }, callback)
      .subscribe(),
    
    supabase.channel('trips-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, callback)
      .subscribe(),
    
    supabase.channel('trip_stages-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_stages' }, callback)
      .subscribe(),
    
    supabase.channel('queue-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue' }, callback)
      .subscribe(),
    
    supabase.channel('decisions-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'decisions' }, callback)
      .subscribe(),
    
    supabase.channel('inbound-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inbound' }, callback)
      .subscribe()
  ];

  return () => {
    channels.forEach(channel => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    });
  };
}

// Supabase Configuration
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase credentials - Replace with your actual credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey && 
         supabaseUrl !== 'https://your-project.supabase.co' && 
         supabaseAnonKey !== 'your-anon-key');
};

// Create Supabase client only if configured
let supabaseClient: SupabaseClient | null = null;

try {
  if (isSupabaseConfigured()) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
  }
} catch (error) {
  console.warn('Failed to initialize Supabase client:', error);
}

export const supabase = supabaseClient;

// Database types
export interface Database {
  branches: {
    id: string;
    name: string;
    code: string;
    cashier_capacity: number;
    cashier_occupancy: number;
    dock_capacity: number;
    dock_occupancy: number;
    max_queue: number;
    operational_status: 'ACTIVE' | 'PAUSED';
    created_at: string;
    updated_at: string;
  };
  couriers: {
    id: string;
    code: string;
    name: string;
    phone: string;
    branch_id: string;
    status: 'AVAILABLE' | 'ON_TRIP' | 'WAITING' | 'IN_CASHIER' | 'COMPLETED';
    created_at: string;
    updated_at: string;
  };
  trips: {
    id: string;
    trip_number: string;
    courier_id: string;
    branch_id: string;
    arrival_at: string;
    completed_at: string | null;
    current_stage: string;
    status: 'ACTIVE' | 'WAITING' | 'COMPLETED' | 'CANCELLED';
    created_at: string;
    updated_at: string;
  };
  trip_stages: {
    id: string;
    trip_id: string;
    stage: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    started_at: string | null;
    finished_at: string | null;
    duration_seconds: number;
    created_at: string;
    updated_at: string;
  };
  queue: {
    id: string;
    trip_id: string;
    branch_id: string;
    queue_number: number;
    priority: number;
    entered_at: string;
    status: 'WAITING' | 'PROMOTED' | 'COMPLETED';
    created_at: string;
    updated_at: string;
  };
  decisions: {
    id: string;
    trip_id: string;
    branch_id: string;
    decision: string;
    reason_ar: string;
    reason_en: string;
    priority: number;
    queue_id: string | null;
    created_at: string;
  };
  inbound: {
    id: string;
    inbound_number: string;
    driver_name: string;
    driver_code: string;
    container_number: string;
    container_type: string;
    branch_id: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    started_at: string | null;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
  };
  inbound_items: {
    id: string;
    inbound_id: string;
    item_name: string;
    item_code: string;
    quantity: number;
    unit: string;
    notes: string;
    created_at: string;
  };
  users: {
    id: string;
    username: string;
    password_hash: string;
    name: string;
    role: 'ADMIN' | 'SUPERVISOR' | 'WAREHOUSE' | 'CASHIER' | 'COURIER' | 'VIEWER';
    branch_id: string | null;
    courier_id: string | null;
    created_at: string;
    updated_at: string;
  };
}

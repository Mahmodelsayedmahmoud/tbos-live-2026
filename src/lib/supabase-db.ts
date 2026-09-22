// Supabase Database Layer with Real-time Support
import { supabase, isSupabaseConfigured } from './supabase-config';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Real-time subscription manager
class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private listeners: Map<string, Set<() => void>> = new Map();

  // Subscribe to table changes
  subscribe(table: string, callback: () => void): () => void {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured, real-time disabled');
      return () => {};
    }

    if (!this.listeners.has(table)) {
      this.listeners.set(table, new Set());
    }
    this.listeners.get(table)!.add(callback);

    // Create channel if not exists
    if (!this.channels.has(table)) {
      const channel = supabase!
        .channel(`${table}-changes`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          () => {
            // Notify all listeners for this table
            this.listeners.get(table)?.forEach(cb => cb());
          }
        )
        .subscribe();

      this.channels.set(table, channel);
    }

    // Return unsubscribe function
    return () => {
      this.listeners.get(table)?.delete(callback);
      
      // If no more listeners, unsubscribe from channel
      if (this.listeners.get(table)?.size === 0) {
        const channel = this.channels.get(table);
        if (channel) {
          supabase!.removeChannel(channel);
          this.channels.delete(table);
        }
        this.listeners.delete(table);
      }
    };
  }

  // Subscribe to all tables
  subscribeAll(callback: () => void): () => void {
    const tables = ['branches', 'couriers', 'trips', 'trip_stages', 'queue', 'decisions', 'inbound', 'inbound_items'];
    const unsubscribes = tables.map(table => this.subscribe(table, callback));
    
    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }

  // Clean up all subscriptions
  cleanup(): void {
    this.channels.forEach(channel => {
      supabase!.removeChannel(channel);
    });
    this.channels.clear();
    this.listeners.clear();
  }
}

export const realtimeManager = new RealtimeManager();

// ============================================
// BRANCHES
// ============================================
export async function getBranches() {
  if (!isSupabaseConfigured()) return [];
  
  const { data, error } = await supabase!
    .from('branches')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data || [];
}

export async function getBranch(id: string) {
  if (!isSupabaseConfigured()) return null;
  
  const { data, error } = await supabase!
    .from('branches')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateBranch(id: string, updates: any) {
  if (!isSupabaseConfigured()) return null;
  
  const { data, error } = await supabase!
    .from('branches')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ============================================
// COURIERS
// ============================================
export async function getCouriers(branchId?: string) {
  if (!isSupabaseConfigured()) return [];
  
  let query = supabase!.from('couriers').select('*');
  
  if (branchId) {
    query = query.eq('branch_id', branchId);
  }
  
  const { data, error } = await query.order('name');
  if (error) throw error;
  return data || [];
}

export async function getCourier(id: string) {
  if (!isSupabaseConfigured()) return null;
  
  const { data, error } = await supabase!
    .from('couriers')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function addCourier(courier: any) {
  if (!isSupabaseConfigured()) return null;
  
  const { data, error } = await supabase!
    .from('couriers')
    .insert([{
      ...courier,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateCourier(id: string, updates: any) {
  if (!isSupabaseConfigured()) return null;
  
  const { data, error } = await supabase!
    .from('couriers')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteCourier(id: string) {
  if (!isSupabaseConfigured()) return false;
  
  const { error } = await supabase!
    .from('couriers')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
}

// ============================================
// TRIPS
// ============================================
export async function getTrips(branchId?: string, status?: string) {
  if (!isSupabaseConfigured()) return [];
  
  let query = supabase!.from('trips').select('*');
  
  if (branchId) {
    query = query.eq('branch_id', branchId);
  }
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query.order('arrival_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getTrip(id: string) {
  if (!isSupabaseConfigured()) return null;
  
  const { data, error } = await supabase!
    .from('trips')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function createTrip(trip: any) {
  if (!isSupabaseConfigured()) return null;
  
  const { data, error } = await supabase!
    .from('trips')
    .insert([{
      ...trip,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateTripStatus(id: string, status: string) {
  if (!isSupabaseConfigured()) return null;
  
  const updates: any = { 
    status, 
    updated_at: new Date().toISOString() 
  };
  
  if (status === 'COMPLETED') {
    updates.completed_at = new Date().toISOString();
  }
  
  const { data, error } = await supabase!
    .from('trips')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteTrip(id: string) {
  if (!isSupabaseConfigured()) return false;
  
  // Delete related trip stages first
  await supabase!
    .from('trip_stages')
    .delete()
    .eq('trip_id', id);
  
  const { error } = await supabase!
    .from('trips')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
}

// ============================================
// TRIP STAGES
// ============================================
export async function getTripStages(tripId: string) {
  if (!isSupabaseConfigured()) return [];
  
  const { data, error } = await supabase!
    .from('trip_stages')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at');
  
  if (error) throw error;
  return data || [];
}

export async function updateTripStage(id: string, updates: any) {
  if (!isSupabaseConfigured()) return null;
  
  const { data, error } = await supabase!
    .from('trip_stages')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ============================================
// QUEUE
// ============================================
export async function getQueue(branchId?: string) {
  if (!isSupabaseConfigured()) return [];
  
  let query = supabase!.from('queue').select('*');
  
  if (branchId) {
    query = query.eq('branch_id', branchId);
  }
  
  const { data, error } = await query
    .eq('status', 'WAITING')
    .order('priority', { ascending: true })
    .order('entered_at', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

export async function addToQueue(queue: any) {
  if (!isSupabaseConfigured()) return null;
  
  const { data, error } = await supabase!
    .from('queue')
    .insert([{
      ...queue,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getQueuePosition(tripId: string) {
  if (!isSupabaseConfigured()) return 0;
  
  const trip = await getTrip(tripId);
  if (!trip) return 0;
  
  const { data, error } = await supabase!
    .from('queue')
    .select('entered_at')
    .eq('branch_id', trip.branch_id)
    .eq('status', 'WAITING')
    .order('priority', { ascending: true })
    .order('entered_at', { ascending: true });
  
  if (error) throw error;
  
  const position = data?.findIndex(q => q.entered_at === trip.arrival_at);
  return position !== undefined && position !== -1 ? position + 1 : 0;
}

// ============================================
// DECISIONS
// ============================================
export async function getDecisions(branchId?: string) {
  if (!isSupabaseConfigured()) return [];
  
  let query = supabase!.from('decisions').select('*');
  
  if (branchId) {
    query = query.eq('branch_id', branchId);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getLatestDecision(tripId: string) {
  if (!isSupabaseConfigured()) return null;
  
  const { data, error } = await supabase!
    .from('decisions')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (error) return null;
  return data;
}

export async function createDecision(decision: any) {
  if (!isSupabaseConfigured()) return null;
  
  const { data, error } = await supabase!
    .from('decisions')
    .insert([{
      ...decision,
      created_at: new Date().toISOString()
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ============================================
// INBOUND
// ============================================
export async function getInbounds(branchId?: string) {
  if (!isSupabaseConfigured()) return [];
  
  let query = supabase!.from('inbound').select('*');
  
  if (branchId) {
    query = query.eq('branch_id', branchId);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getInbound(id: string) {
  if (!isSupabaseConfigured()) return null;
  
  const { data, error } = await supabase!
    .from('inbound')
    .select(`
      *,
      inbound_items (*)
    `)
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function createInbound(inbound: any) {
  if (!isSupabaseConfigured()) return null;
  
  const { data, error } = await supabase!
    .from('inbound')
    .insert([{
      ...inbound,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateInbound(id: string, updates: any) {
  if (!isSupabaseConfigured()) return null;
  
  const { data, error } = await supabase!
    .from('inbound')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteInbound(id: string) {
  if (!isSupabaseConfigured()) return false;
  
  const { error } = await supabase!
    .from('inbound')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
}

// ============================================
// INBOUND ITEMS
// ============================================
export async function addInboundItem(item: any) {
  if (!isSupabaseConfigured()) return null;
  
  const { data, error } = await supabase!
    .from('inbound_items')
    .insert([{
      ...item,
      created_at: new Date().toISOString()
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function removeInboundItem(id: string) {
  if (!isSupabaseConfigured()) return false;
  
  const { error } = await supabase!
    .from('inbound_items')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
}

// ============================================
// USERS
// ============================================
export async function getUsers() {
  if (!isSupabaseConfigured()) return [];
  
  const { data, error } = await supabase!
    .from('users')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data || [];
}

export async function login(username: string, password: string) {
  if (!isSupabaseConfigured()) return null;
  
  const { data, error } = await supabase!
    .from('users')
    .select('*')
    .eq('username', username)
    .eq('password_hash', password) // In production, use proper password hashing
    .single();
  
  if (error) return null;
  return data;
}

// ============================================
// DASHBOARD STATS
// ============================================
export async function getDashboardStats(branchId?: string) {
  if (!isSupabaseConfigured()) {
    return {
      totalToday: 0,
      active: 0,
      onDock: 0,
      inPrep: 0,
      inInventory: 0,
      inLoading: 0,
      inCashier: 0,
      inQueue: 0,
      avgTripTime: 0,
    };
  }
  
  let tripsQuery = supabase!.from('trips').select('*');
  
  if (branchId) {
    tripsQuery = tripsQuery.eq('branch_id', branchId);
  }
  
  const { data: trips, error } = await tripsQuery;
  if (error) throw error;
  
  const today = new Date().toDateString();
  const todayTrips = trips?.filter(t => new Date(t.arrival_at).toDateString() === today) || [];
  
  const activeTrips = trips?.filter(t => t.status === 'ACTIVE') || [];
  const onDock = activeTrips.filter(t => t.current_stage === 'DOCK').length;
  const inPrep = activeTrips.filter(t => t.current_stage === 'PREPARATION').length;
  const inInventory = activeTrips.filter(t => t.current_stage === 'INVENTORY').length;
  const inLoading = activeTrips.filter(t => t.current_stage === 'LOADING').length;
  const inCashier = activeTrips.filter(t => t.current_stage === 'CASHIER').length;
  const waitingTrips = trips?.filter(t => t.status === 'WAITING').length || 0;
  
  return {
    totalToday: todayTrips.length,
    active: activeTrips.length,
    onDock,
    inPrep,
    inInventory,
    inLoading,
    inCashier,
    inQueue: waitingTrips,
    avgTripTime: 0,
  };
}

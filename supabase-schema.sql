-- TBOS Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor to create all necessary tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- BRANCHES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS branches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  cashier_capacity INTEGER DEFAULT 3,
  cashier_occupancy INTEGER DEFAULT 0,
  dock_capacity INTEGER DEFAULT 5,
  dock_occupancy INTEGER DEFAULT 0,
  max_queue INTEGER DEFAULT 20,
  operational_status TEXT DEFAULT 'ACTIVE' CHECK (operational_status IN ('ACTIVE', 'PAUSED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- COURIERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS couriers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'ON_TRIP', 'WAITING', 'IN_CASHIER', 'COMPLETED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TRIPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS trips (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_number TEXT UNIQUE NOT NULL,
  courier_id UUID REFERENCES couriers(id) ON DELETE SET NULL,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  arrival_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  current_stage TEXT DEFAULT 'ENTRY',
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'WAITING', 'COMPLETED', 'CANCELLED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TRIP STAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS trip_stages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')),
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trip_id, stage)
);

-- ============================================
-- QUEUE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS queue (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  queue_number INTEGER NOT NULL,
  priority INTEGER DEFAULT 5,
  entered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'WAITING' CHECK (status IN ('WAITING', 'PROMOTED', 'COMPLETED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- DECISIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS decisions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  decision TEXT NOT NULL,
  reason_ar TEXT,
  reason_en TEXT,
  priority INTEGER DEFAULT 5,
  queue_id UUID REFERENCES queue(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INBOUND TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS inbound (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  inbound_number TEXT UNIQUE NOT NULL,
  driver_name TEXT NOT NULL,
  driver_code TEXT NOT NULL,
  container_number TEXT NOT NULL,
  container_type TEXT DEFAULT '20ft',
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INBOUND ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS inbound_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  inbound_id UUID REFERENCES inbound(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  item_code TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'قطعة',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'SUPERVISOR', 'WAREHOUSE', 'CASHIER', 'COURIER', 'VIEWER')),
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  courier_id UUID REFERENCES couriers(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_couriers_branch ON couriers(branch_id);
CREATE INDEX IF NOT EXISTS idx_couriers_status ON couriers(status);
CREATE INDEX IF NOT EXISTS idx_trips_courier ON trips(courier_id);
CREATE INDEX IF NOT EXISTS idx_trips_branch ON trips(branch_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trip_stages_trip ON trip_stages(trip_id);
CREATE INDEX IF NOT EXISTS idx_queue_branch ON queue(branch_id);
CREATE INDEX IF NOT EXISTS idx_queue_status ON queue(status);
CREATE INDEX IF NOT EXISTS idx_decisions_trip ON decisions(trip_id);
CREATE INDEX IF NOT EXISTS idx_inbound_branch ON inbound(branch_id);
CREATE INDEX IF NOT EXISTS idx_inbound_items_inbound ON inbound_items(inbound_id);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_couriers_updated_at BEFORE UPDATE ON couriers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trip_stages_updated_at BEFORE UPDATE ON trip_stages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_queue_updated_at BEFORE UPDATE ON queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inbound_updated_at BEFORE UPDATE ON inbound
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE couriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbound ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbound_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES (Allow all for now - customize as needed)
-- ============================================
CREATE POLICY "Enable all access for authenticated users" ON branches FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON couriers FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON trips FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON trip_stages FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON queue FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON decisions FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON inbound FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON inbound_items FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON users FOR ALL USING (true);

-- ============================================
-- ENABLE REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE branches;
ALTER PUBLICATION supabase_realtime ADD TABLE couriers;
ALTER PUBLICATION supabase_realtime ADD TABLE trips;
ALTER PUBLICATION supabase_realtime ADD TABLE trip_stages;
ALTER PUBLICATION supabase_realtime ADD TABLE queue;
ALTER PUBLICATION supabase_realtime ADD TABLE decisions;
ALTER PUBLICATION supabase_realtime ADD TABLE inbound;
ALTER PUBLICATION supabase_realtime ADD TABLE inbound_items;

-- ============================================
-- SEED DATA (Optional - Default branches and users)
-- ============================================
INSERT INTO branches (name, code, cashier_capacity, dock_capacity, max_queue) VALUES
  ('القاهرة', 'CAI', 3, 5, 20),
  ('الإسكندرية', 'ALX', 2, 4, 15),
  ('طنطا', 'TNT', 2, 3, 10)
ON CONFLICT (code) DO NOTHING;

-- Default users (passwords are hashed - replace with actual hashed passwords)
-- For demo purposes, using simple passwords (in production, use bcrypt)
INSERT INTO users (username, password_hash, name, role) VALUES
  ('admin', 'admin123', 'مدير النظام', 'ADMIN'),
  ('supervisor', 'super123', 'المشرف', 'SUPERVISOR'),
  ('warehouse', 'wh123', 'أمين المخزن', 'WAREHOUSE'),
  ('cashier', 'cash123', 'أمين الكاشير', 'CASHIER'),
  ('courier', 'cr123', 'مندوب تجريبي', 'COURIER'),
  ('viewer', 'view123', 'مشاهد', 'VIEWER')
ON CONFLICT (username) DO NOTHING;

-- Default couriers
INSERT INTO couriers (code, name, phone, branch_id) VALUES
  ('C001', 'أحمد محمد', '0101234567', (SELECT id FROM branches WHERE code = 'CAI')),
  ('C002', 'محمود علي', '0109876543', (SELECT id FROM branches WHERE code = 'CAI')),
  ('C003', 'خالد حسن', '0115554433', (SELECT id FROM branches WHERE code = 'ALX')),
  ('C004', 'عمر سعيد', '0127778899', (SELECT id FROM branches WHERE code = 'ALX')),
  ('C005', 'ياسر إبراهيم', '0103332211', (SELECT id FROM branches WHERE code = 'TNT'))
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- VIEWS (Optional - for easier querying)
-- ============================================
CREATE OR REPLACE VIEW active_trips_view AS
SELECT 
  t.*,
  c.name as courier_name,
  c.code as courier_code,
  b.name as branch_name
FROM trips t
LEFT JOIN couriers c ON t.courier_id = c.id
LEFT JOIN branches b ON t.branch_id = b.id
WHERE t.status IN ('ACTIVE', 'WAITING');

CREATE OR REPLACE VIEW queue_view AS
SELECT 
  q.*,
  t.trip_number,
  c.name as courier_name,
  c.code as courier_code,
  b.name as branch_name
FROM queue q
LEFT JOIN trips t ON q.trip_id = t.id
LEFT JOIN couriers c ON t.courier_id = c.id
LEFT JOIN branches b ON q.branch_id = b.id
WHERE q.status = 'WAITING'
ORDER BY q.priority ASC, q.entered_at ASC;

-- ============================================
-- FUNCTIONS (Optional - for common operations)
-- ============================================
CREATE OR REPLACE FUNCTION get_cashier_occupancy(branch_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT cashier_occupancy FROM branches WHERE id = branch_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_queue_position(trip_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  pos INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO pos
  FROM queue
  WHERE branch_id = (SELECT branch_id FROM trips WHERE id = trip_uuid)
    AND status = 'WAITING'
    AND entered_at < (SELECT entered_at FROM queue WHERE trip_id = trip_uuid);
  
  RETURN pos;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'TBOS Database schema created successfully!';
  RAISE NOTICE 'Tables: branches, couriers, trips, trip_stages, queue, decisions, inbound, inbound_items, users';
  RAISE NOTICE 'Realtime enabled for all tables';
  RAISE NOTICE 'Seed data inserted (branches and users)';
END $$;

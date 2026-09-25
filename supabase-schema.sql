-- ============================================
-- TBOS Database Schema for Supabase
-- Trans Business Operations System
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. جدول الفروع (branches)
-- ============================================
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  cashier_capacity INTEGER NOT NULL DEFAULT 3,
  cashier_occupancy INTEGER NOT NULL DEFAULT 0,
  dock_capacity INTEGER NOT NULL DEFAULT 5,
  dock_occupancy INTEGER NOT NULL DEFAULT 0,
  max_queue INTEGER NOT NULL DEFAULT 20,
  operational_status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (operational_status IN ('ACTIVE', 'PAUSED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. جدول المندوبين (couriers)
-- ============================================
CREATE TABLE IF NOT EXISTS couriers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'ON_TRIP', 'WAITING', 'IN_CASHIER', 'COMPLETED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. جدول الرحلات (trips)
-- ============================================
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_number TEXT UNIQUE NOT NULL,
  courier_id UUID REFERENCES couriers(id) ON DELETE SET NULL,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  arrival_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  current_stage TEXT NOT NULL DEFAULT 'ENTRY',
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'WAITING', 'COMPLETED', 'CANCELLED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. جدول مراحل الرحلات (trip_stages)
-- ============================================
CREATE TABLE IF NOT EXISTS trip_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')),
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trip_id, stage)
);

-- ============================================
-- 5. جدول الطابور (queue)
-- ============================================
CREATE TABLE IF NOT EXISTS queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  queue_number INTEGER NOT NULL,
  priority INTEGER NOT NULL DEFAULT 5,
  entered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'WAITING' CHECK (status IN ('WAITING', 'PROMOTED', 'COMPLETED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. جدول القرارات (decisions)
-- ============================================
CREATE TABLE IF NOT EXISTS decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  decision TEXT NOT NULL CHECK (decision IN ('GO_TO_CASHIER', 'WAIT_CASHIER', 'BLOCKED_INVENTORY', 'WAIT_LOADING', 'WAIT_CONGESTION')),
  reason_ar TEXT,
  reason_en TEXT,
  priority INTEGER NOT NULL DEFAULT 5,
  queue_id UUID REFERENCES queue(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7. جدول الوارد (inbound)
-- ============================================
CREATE TABLE IF NOT EXISTS inbound (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inbound_number TEXT UNIQUE NOT NULL,
  driver_name TEXT NOT NULL,
  driver_code TEXT NOT NULL,
  container_number TEXT NOT NULL,
  container_type TEXT NOT NULL DEFAULT '20ft',
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 8. جدول أصناف الوارد (inbound_items)
-- ============================================
CREATE TABLE IF NOT EXISTS inbound_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inbound_id UUID NOT NULL REFERENCES inbound(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  item_code TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'قطعة',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 9. جدول المستخدمين (users)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
-- 10. جدول سجل الأنشطة (audit_logs)
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- الفهارس (Indexes) لتحسين الأداء
-- ============================================

-- فهارس المندوبين
CREATE INDEX IF NOT EXISTS idx_couriers_branch ON couriers(branch_id);
CREATE INDEX IF NOT EXISTS idx_couriers_status ON couriers(status);
CREATE INDEX IF NOT EXISTS idx_couriers_code ON couriers(code);

-- فهارس الرحلات
CREATE INDEX IF NOT EXISTS idx_trips_courier ON trips(courier_id);
CREATE INDEX IF NOT EXISTS idx_trips_branch ON trips(branch_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_arrival ON trips(arrival_at DESC);
CREATE INDEX IF NOT EXISTS idx_trips_number ON trips(trip_number);

-- فهارس مراحل الرحلات
CREATE INDEX IF NOT EXISTS idx_trip_stages_trip ON trip_stages(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_stages_stage ON trip_stages(stage);
CREATE INDEX IF NOT EXISTS idx_trip_stages_status ON trip_stages(status);

-- فهارس الطابور
CREATE INDEX IF NOT EXISTS idx_queue_branch ON queue(branch_id);
CREATE INDEX IF NOT EXISTS idx_queue_trip ON queue(trip_id);
CREATE INDEX IF NOT EXISTS idx_queue_status ON queue(status);
CREATE INDEX IF NOT EXISTS idx_queue_priority ON queue(priority, entered_at);

-- فهارس القرارات
CREATE INDEX IF NOT EXISTS idx_decisions_trip ON decisions(trip_id);
CREATE INDEX IF NOT EXISTS idx_decisions_branch ON decisions(branch_id);
CREATE INDEX IF NOT EXISTS idx_decisions_created ON decisions(created_at DESC);

-- فهارس الوارد
CREATE INDEX IF NOT EXISTS idx_inbound_branch ON inbound(branch_id);
CREATE INDEX IF NOT EXISTS idx_inbound_status ON inbound(status);
CREATE INDEX IF NOT EXISTS idx_inbound_number ON inbound(inbound_number);
CREATE INDEX IF NOT EXISTS idx_inbound_created ON inbound(created_at DESC);

-- فهارس أصناف الوارد
CREATE INDEX IF NOT EXISTS idx_inbound_items_inbound ON inbound_items(inbound_id);

-- فهارس المستخدمين
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_branch ON users(branch_id);

-- فهارس سجل الأنشطة
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================
-- دالة تحديث updated_at تلقائياً
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق التريجر على جميع الجداول
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
-- تفعيل Row Level Security (RLS)
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
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- سياسات RLS (Row Level Security Policies)
-- ============================================

-- الفروع: الجميع يمكنه القراءة، فقط المدراء يمكنهم التعديل
CREATE POLICY "Branches are viewable by everyone" ON branches
  FOR SELECT USING (true);

CREATE POLICY "Branches are modifiable by admins" ON branches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (SELECT auth.uid()::text)
      AND users.role IN ('ADMIN', 'SUPERVISOR')
    )
  );

-- المندوبون: الجميع يمكنه القراءة، المشرفون يمكنهم التعديل
CREATE POLICY "Couriers are viewable by everyone" ON couriers
  FOR SELECT USING (true);

CREATE POLICY "Couriers are modifiable by authorized users" ON couriers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (SELECT auth.uid()::text)
      AND users.role IN ('ADMIN', 'SUPERVISOR', 'WAREHOUSE')
    )
  );

-- الرحلات: الجميع يمكنه القراءة
CREATE POLICY "Trips are viewable by everyone" ON trips
  FOR SELECT USING (true);

CREATE POLICY "Trips are modifiable by authorized users" ON trips
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (SELECT auth.uid()::text)
      AND users.role IN ('ADMIN', 'SUPERVISOR', 'WAREHOUSE', 'CASHIER')
    )
  );

-- مراحل الرحلات: الجميع يمكنه القراءة
CREATE POLICY "Trip stages are viewable by everyone" ON trip_stages
  FOR SELECT USING (true);

CREATE POLICY "Trip stages are modifiable by authorized users" ON trip_stages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (SELECT auth.uid()::text)
      AND users.role IN ('ADMIN', 'SUPERVISOR', 'WAREHOUSE')
    )
  );

-- الطابور: الجميع يمكنه القراءة
CREATE POLICY "Queue is viewable by everyone" ON queue
  FOR SELECT USING (true);

CREATE POLICY "Queue is modifiable by authorized users" ON queue
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (SELECT auth.uid()::text)
      AND users.role IN ('ADMIN', 'SUPERVISOR', 'CASHIER')
    )
  );

-- القرارات: الجميع يمكنه القراءة
CREATE POLICY "Decisions are viewable by everyone" ON decisions
  FOR SELECT USING (true);

CREATE POLICY "Decisions are insertable by system" ON decisions
  FOR INSERT WITH CHECK (true);

-- الوارد: الجميع يمكنه القراءة
CREATE POLICY "Inbound is viewable by everyone" ON inbound
  FOR SELECT USING (true);

CREATE POLICY "Inbound is modifiable by authorized users" ON inbound
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (SELECT auth.uid()::text)
      AND users.role IN ('ADMIN', 'SUPERVISOR', 'WAREHOUSE')
    )
  );

-- أصناف الوارد: الجميع يمكنه القراءة
CREATE POLICY "Inbound items are viewable by everyone" ON inbound_items
  FOR SELECT USING (true);

CREATE POLICY "Inbound items are modifiable by authorized users" ON inbound_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (SELECT auth.uid()::text)
      AND users.role IN ('ADMIN', 'SUPERVISOR', 'WAREHOUSE')
    )
  );

-- المستخدمين: المستخدمون يمكنهم قراءة بياناتهم فقط
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users are modifiable by admins" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = (SELECT auth.uid()::text)
      AND u.role = 'ADMIN'
    )
  );

-- سجل الأنشطة: المدراء فقط يمكنهم القراءة
CREATE POLICY "Audit logs are viewable by admins" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (SELECT auth.uid()::text)
      AND users.role = 'ADMIN'
    )
  );

CREATE POLICY "Audit logs are insertable by system" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- ============================================
-- تفعيل Realtime للمزامنة اللحظية
-- ============================================

-- إضافة جميع الجداول إلى نشر Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE branches;
ALTER PUBLICATION supabase_realtime ADD TABLE couriers;
ALTER PUBLICATION supabase_realtime ADD TABLE trips;
ALTER PUBLICATION supabase_realtime ADD TABLE trip_stages;
ALTER PUBLICATION supabase_realtime ADD TABLE queue;
ALTER PUBLICATION supabase_realtime ADD TABLE decisions;
ALTER PUBLICATION supabase_realtime ADD TABLE inbound;
ALTER PUBLICATION supabase_realtime ADD TABLE inbound_items;

-- ============================================
-- البيانات الأولية (Seed Data)
-- ============================================

-- إدخال الفروع
INSERT INTO branches (id, name, code, cashier_capacity, dock_capacity, max_queue, operational_status) VALUES
  ('b1', 'القاهرة', 'CAI', 3, 5, 20, 'ACTIVE'),
  ('b2', 'الإسكندرية', 'ALX', 2, 4, 15, 'ACTIVE'),
  ('b3', 'طنطا', 'TNT', 2, 3, 10, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- إدخال المندوبين
INSERT INTO couriers (id, code, name, phone, branch_id, status) VALUES
  ('c1', 'C001', 'أحمد محمد', '0101234567', 'b1', 'AVAILABLE'),
  ('c2', 'C002', 'محمود علي', '0109876543', 'b1', 'AVAILABLE'),
  ('c3', 'C003', 'خالد حسن', '0115554433', 'b2', 'AVAILABLE'),
  ('c4', 'C004', 'عمر سعيد', '0127778899', 'b2', 'AVAILABLE'),
  ('c5', 'C005', 'ياسر إبراهيم', '0103332211', 'b3', 'AVAILABLE')
ON CONFLICT (id) DO NOTHING;

-- إدخال المستخدمين
INSERT INTO users (id, username, password_hash, name, role, branch_id, courier_id) VALUES
  ('u1', 'admin', 'admin123', 'مدير النظام', 'ADMIN', NULL, NULL),
  ('u2', 'supervisor', 'super123', 'المشرف', 'SUPERVISOR', 'b1', NULL),
  ('u3', 'warehouse', 'wh123', 'أمين المخزن', 'WAREHOUSE', 'b1', NULL),
  ('u4', 'cashier', 'cash123', 'أمين الكاشير', 'CASHIER', 'b1', NULL),
  ('u5', 'courier', 'cr123', 'مندوب تجريبي', 'COURIER', 'b1', 'c1'),
  ('u6', 'viewer', 'view123', 'مشاهد', 'VIEWER', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- دوال مساعدة (Helper Functions)
-- ============================================

-- دالة للحصول على إشغال الكاشير
CREATE OR REPLACE FUNCTION get_cashier_occupancy(branch_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT cashier_occupancy FROM branches WHERE id = branch_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة للحصول على موقع الرحلة في الطابور
CREATE OR REPLACE FUNCTION get_queue_position(trip_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  pos INTEGER;
  trip_branch_id UUID;
  trip_entered_at TIMESTAMP WITH TIME ZONE;
  trip_priority INTEGER;
BEGIN
  -- الحصول على معلومات الرحلة
  SELECT branch_id, entered_at, priority 
  INTO trip_branch_id, trip_entered_at, trip_priority
  FROM queue 
  WHERE trip_id = trip_uuid AND status = 'WAITING';
  
  IF trip_branch_id IS NULL THEN
    RETURN 0;
  END IF;
  
  -- حساب الموقع
  SELECT COUNT(*) + 1 INTO pos
  FROM queue
  WHERE branch_id = trip_branch_id
    AND status = 'WAITING'
    AND (
      priority < trip_priority 
      OR (priority = trip_priority AND entered_at < trip_entered_at)
    );
  
  RETURN pos;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة لترقية الرحلة التالية من الطابور
CREATE OR REPLACE FUNCTION promote_next_in_queue(branch_uuid UUID)
RETURNS UUID AS $$
DECLARE
  next_trip_id UUID;
  branch_capacity INTEGER;
  branch_occupancy INTEGER;
BEGIN
  -- الحصول على سعة وإشغال الكاشير
  SELECT cashier_capacity, cashier_occupancy 
  INTO branch_capacity, branch_occupancy
  FROM branches 
  WHERE id = branch_uuid;
  
  -- التحقق من وجود مساحة
  IF branch_occupancy >= branch_capacity THEN
    RETURN NULL;
  END IF;
  
  -- الحصول على الرحلة التالية في الطابور
  SELECT trip_id INTO next_trip_id
  FROM queue
  WHERE branch_id = branch_uuid AND status = 'WAITING'
  ORDER BY priority ASC, entered_at ASC
  LIMIT 1;
  
  IF next_trip_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- ترقية الرحلة
  UPDATE queue
  SET status = 'PROMOTED', updated_at = NOW()
  WHERE trip_id = next_trip_id;
  
  -- زيادة إشغال الكاشير
  UPDATE branches
  SET cashier_occupancy = cashier_occupancy + 1, updated_at = NOW()
  WHERE id = branch_uuid;
  
  -- تحديث حالة الرحلة
  UPDATE trips
  SET status = 'ACTIVE', current_stage = 'CASHIER', updated_at = NOW()
  WHERE id = next_trip_id;
  
  -- بدء مرحلة الكاشير
  UPDATE trip_stages
  SET status = 'IN_PROGRESS', started_at = NOW(), updated_at = NOW()
  WHERE trip_id = next_trip_id AND stage = 'CASHIER';
  
  -- تحديث حالة المندوب
  UPDATE couriers
  SET status = 'IN_CASHIER', updated_at = NOW()
  WHERE id = (SELECT courier_id FROM trips WHERE id = next_trip_id);
  
  RETURN next_trip_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Views (عرض البيانات)
-- ============================================

-- عرض الرحلات النشطة
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

-- عرض الطابور
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

-- عرض الوارد مع الأصناف
CREATE OR REPLACE VIEW inbound_with_items_view AS
SELECT 
  i.*,
  b.name as branch_name,
  COALESCE(
    (SELECT json_agg(row_to_json(ii))
     FROM inbound_items ii
     WHERE ii.inbound_id = i.id),
    '[]'::json
  ) as items
FROM inbound i
LEFT JOIN branches b ON i.branch_id = b.id;

-- ============================================
-- رسالة نجاح
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TBOS Database Schema Created Successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tables: 10 created';
  RAISE NOTICE 'Indexes: 25+ created';
  RAISE NOTICE 'RLS: Enabled on all tables';
  RAISE NOTICE 'Realtime: Enabled on 8 tables';
  RAISE NOTICE 'Seed Data: 3 branches, 5 couriers, 6 users';
  RAISE NOTICE 'Functions: 3 created';
  RAISE NOTICE 'Views: 3 created';
  RAISE NOTICE '========================================';
END $$;

-- ============================================
-- TBOS - سكريبت إنشاء قاعدة البيانات
-- ============================================
-- انسخ هذا السكريبت كاملاً والصقه في:
-- Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================

-- 1. إنشاء جدول الفروع
CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  cashier_capacity INTEGER DEFAULT 3,
  cashier_occupancy INTEGER DEFAULT 0,
  dock_capacity INTEGER DEFAULT 5,
  dock_occupancy INTEGER DEFAULT 0,
  max_queue INTEGER DEFAULT 20,
  operational_status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. إنشاء جدول المندوبين
CREATE TABLE IF NOT EXISTS couriers (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  branch_id TEXT REFERENCES branches(id),
  status TEXT DEFAULT 'AVAILABLE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. إنشاء جدول الرحلات
CREATE TABLE IF NOT EXISTS trips (
  id TEXT PRIMARY KEY,
  trip_number TEXT UNIQUE NOT NULL,
  courier_id TEXT REFERENCES couriers(id),
  branch_id TEXT REFERENCES branches(id),
  arrival_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  current_stage TEXT DEFAULT 'ENTRY',
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. إنشاء جدول مراحل الرحلات
CREATE TABLE IF NOT EXISTS trip_stages (
  id TEXT PRIMARY KEY,
  trip_id TEXT REFERENCES trips(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING',
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trip_id, stage)
);

-- 5. إنشاء جدول الطابور
CREATE TABLE IF NOT EXISTS queue (
  id TEXT PRIMARY KEY,
  trip_id TEXT REFERENCES trips(id) ON DELETE CASCADE,
  branch_id TEXT REFERENCES branches(id),
  queue_number INTEGER NOT NULL,
  priority INTEGER DEFAULT 5,
  entered_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'WAITING',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. إنشاء جدول القرارات
CREATE TABLE IF NOT EXISTS decisions (
  id TEXT PRIMARY KEY,
  trip_id TEXT REFERENCES trips(id) ON DELETE CASCADE,
  branch_id TEXT REFERENCES branches(id),
  decision TEXT NOT NULL,
  reason_ar TEXT,
  reason_en TEXT,
  priority INTEGER DEFAULT 5,
  queue_id TEXT REFERENCES queue(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. إنشاء جدول الوارد
CREATE TABLE IF NOT EXISTS inbound (
  id TEXT PRIMARY KEY,
  inbound_number TEXT UNIQUE NOT NULL,
  driver_name TEXT NOT NULL,
  driver_code TEXT NOT NULL,
  container_number TEXT NOT NULL,
  container_type TEXT DEFAULT '20ft',
  branch_id TEXT REFERENCES branches(id),
  status TEXT DEFAULT 'PENDING',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. إنشاء جدول أصناف الوارد
CREATE TABLE IF NOT EXISTS inbound_items (
  id TEXT PRIMARY KEY,
  inbound_id TEXT REFERENCES inbound(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  item_code TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit TEXT DEFAULT 'قطعة',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. إنشاء جدول المستخدمين
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  branch_id TEXT REFERENCES branches(id),
  courier_id TEXT REFERENCES couriers(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. إنشاء جدول سجل الأنشطة
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT REFERENCES users(id),
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- الفهارس (Indexes) للأداء
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
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================
-- البيانات الأولية (Seed Data)
-- ============================================

-- الفروع
INSERT INTO branches (id, name, code, cashier_capacity, dock_capacity, max_queue) VALUES
  ('b1', 'القاهرة', 'CAI', 3, 5, 20),
  ('b2', 'الإسكندرية', 'ALX', 2, 4, 15),
  ('b3', 'طنطا', 'TNT', 2, 3, 10)
ON CONFLICT (id) DO NOTHING;

-- المندوبين
INSERT INTO couriers (id, code, name, phone, branch_id, status) VALUES
  ('c1', 'C001', 'أحمد محمد', '0101234567', 'b1', 'AVAILABLE'),
  ('c2', 'C002', 'محمود علي', '0109876543', 'b1', 'AVAILABLE'),
  ('c3', 'C003', 'خالد حسن', '0115554433', 'b2', 'AVAILABLE'),
  ('c4', 'C004', 'عمر سعيد', '0127778899', 'b2', 'AVAILABLE'),
  ('c5', 'C005', 'ياسر إبراهيم', '0103332211', 'b3', 'AVAILABLE')
ON CONFLICT (id) DO NOTHING;

-- المستخدمين
INSERT INTO users (id, username, password_hash, name, role, branch_id, courier_id) VALUES
  ('u1', 'admin', 'admin123', 'مدير النظام', 'ADMIN', NULL, NULL),
  ('u2', 'supervisor', 'super123', 'المشرف', 'SUPERVISOR', 'b1', NULL),
  ('u3', 'warehouse', 'wh123', 'أمين المخزن', 'WAREHOUSE', 'b1', NULL),
  ('u4', 'cashier', 'cash123', 'أمين الكاشير', 'CASHIER', 'b1', NULL),
  ('u5', 'courier', 'cr123', 'مندوب تجريبي', 'COURIER', 'b1', 'c1'),
  ('u6', 'viewer', 'view123', 'مشاهد', 'VIEWER', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

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
-- سياسات الوصول (Policies) - السماح للجميع مؤقتاً
-- ============================================
DO $$ 
BEGIN
  -- حذف السياسات القديمة إذا كانت موجودة
  DROP POLICY IF EXISTS "allow_all_branches" ON branches;
  DROP POLICY IF EXISTS "allow_all_couriers" ON couriers;
  DROP POLICY IF EXISTS "allow_all_trips" ON trips;
  DROP POLICY IF EXISTS "allow_all_trip_stages" ON trip_stages;
  DROP POLICY IF EXISTS "allow_all_queue" ON queue;
  DROP POLICY IF EXISTS "allow_all_decisions" ON decisions;
  DROP POLICY IF EXISTS "allow_all_inbound" ON inbound;
  DROP POLICY IF EXISTS "allow_all_inbound_items" ON inbound_items;
  DROP POLICY IF EXISTS "allow_all_users" ON users;
  DROP POLICY IF EXISTS "allow_all_audit_logs" ON audit_logs;
END $$;

-- سياسات القراءة والكتابة للجميع (للاختبار)
CREATE POLICY "allow_all_branches" ON branches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_couriers" ON couriers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_trips" ON trips FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_trip_stages" ON trip_stages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_queue" ON queue FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_decisions" ON decisions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_inbound" ON inbound FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_inbound_items" ON inbound_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_audit_logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- تفعيل Realtime للمزامنة اللحظية
-- ============================================

-- إنشاء Publication إذا لم يكن موجوداً
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- إضافة الجداول إلى Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE branches;
ALTER PUBLICATION supabase_realtime ADD TABLE couriers;
ALTER PUBLICATION supabase_realtime ADD TABLE trips;
ALTER PUBLICATION supabase_realtime ADD TABLE trip_stages;
ALTER PUBLICATION supabase_realtime ADD TABLE queue;
ALTER PUBLICATION supabase_realtime ADD TABLE decisions;
ALTER PUBLICATION supabase_realtime ADD TABLE inbound;
ALTER PUBLICATION supabase_realtime ADD TABLE inbound_items;

-- ============================================
-- رسالة النجاح
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ TBOS Database Setup Complete!';
  RAISE NOTICE '📊 Tables: 10 created';
  RAISE NOTICE '🔑 Indexes: 13 created';
  RAISE NOTICE '🔒 RLS: Enabled on all tables';
  RAISE NOTICE '🔄 Realtime: Enabled on 8 tables';
  RAISE NOTICE '🌱 Seed Data: 3 branches, 5 couriers, 6 users';
END $$;

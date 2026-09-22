-- ============================================
-- TBOS Database Schema for Supabase
-- Trans Business Operations System
-- ============================================
-- هذا الملف يحتوي على جميع الجداول والعلاقات المطلوبة
-- لتشغيل تطبيق TBOS مع المزامنة اللحظية بين الأجهزة
-- ============================================

-- تمكين إضافة UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. جدول الفروع (branches)
-- ============================================
CREATE TABLE IF NOT EXISTS public.branches (
  id TEXT PRIMARY KEY,
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
CREATE TABLE IF NOT EXISTS public.couriers (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  branch_id TEXT REFERENCES public.branches(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'ON_TRIP', 'WAITING', 'IN_CASHIER', 'COMPLETED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. جدول الرحلات (trips)
-- ============================================
CREATE TABLE IF NOT EXISTS public.trips (
  id TEXT PRIMARY KEY,
  trip_number TEXT UNIQUE NOT NULL,
  courier_id TEXT REFERENCES public.couriers(id) ON DELETE SET NULL,
  branch_id TEXT REFERENCES public.branches(id) ON DELETE SET NULL,
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
CREATE TABLE IF NOT EXISTS public.trip_stages (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS public.queue (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  branch_id TEXT NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS public.decisions (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  branch_id TEXT NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  decision TEXT NOT NULL CHECK (decision IN ('GO_TO_CASHIER', 'WAIT_CASHIER', 'BLOCKED_INVENTORY', 'WAIT_LOADING', 'WAIT_CONGESTION')),
  reason_ar TEXT,
  reason_en TEXT,
  priority INTEGER NOT NULL DEFAULT 5,
  queue_id TEXT REFERENCES public.queue(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7. جدول الوارد (inbound)
-- ============================================
CREATE TABLE IF NOT EXISTS public.inbound (
  id TEXT PRIMARY KEY,
  inbound_number TEXT UNIQUE NOT NULL,
  driver_name TEXT NOT NULL,
  driver_code TEXT NOT NULL,
  container_number TEXT NOT NULL,
  container_type TEXT NOT NULL DEFAULT '20ft',
  branch_id TEXT REFERENCES public.branches(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 8. جدول أصناف الوارد (inbound_items)
-- ============================================
CREATE TABLE IF NOT EXISTS public.inbound_items (
  id TEXT PRIMARY KEY,
  inbound_id TEXT NOT NULL REFERENCES public.inbound(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'SUPERVISOR', 'WAREHOUSE', 'CASHIER', 'COURIER', 'VIEWER')),
  branch_id TEXT REFERENCES public.branches(id) ON DELETE SET NULL,
  courier_id TEXT REFERENCES public.couriers(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 10. جدول سجل الأنشطة (audit_logs)
-- ============================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
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
CREATE INDEX IF NOT EXISTS idx_couriers_branch ON public.couriers(branch_id);
CREATE INDEX IF NOT EXISTS idx_couriers_status ON public.couriers(status);
CREATE INDEX IF NOT EXISTS idx_couriers_code ON public.couriers(code);

-- فهارس الرحلات
CREATE INDEX IF NOT EXISTS idx_trips_courier ON public.trips(courier_id);
CREATE INDEX IF NOT EXISTS idx_trips_branch ON public.trips(branch_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_arrival ON public.trips(arrival_at DESC);
CREATE INDEX IF NOT EXISTS idx_trips_number ON public.trips(trip_number);

-- فهارس مراحل الرحلات
CREATE INDEX IF NOT EXISTS idx_trip_stages_trip ON public.trip_stages(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_stages_stage ON public.trip_stages(stage);
CREATE INDEX IF NOT EXISTS idx_trip_stages_status ON public.trip_stages(status);

-- فهارس الطابور
CREATE INDEX IF NOT EXISTS idx_queue_branch ON public.queue(branch_id);
CREATE INDEX IF NOT EXISTS idx_queue_trip ON public.queue(trip_id);
CREATE INDEX IF NOT EXISTS idx_queue_status ON public.queue(status);
CREATE INDEX IF NOT EXISTS idx_queue_priority ON public.queue(priority, entered_at);

-- فهارس القرارات
CREATE INDEX IF NOT EXISTS idx_decisions_trip ON public.decisions(trip_id);
CREATE INDEX IF NOT EXISTS idx_decisions_branch ON public.decisions(branch_id);
CREATE INDEX IF NOT EXISTS idx_decisions_created ON public.decisions(created_at DESC);

-- فهارس الوارد
CREATE INDEX IF NOT EXISTS idx_inbound_branch ON public.inbound(branch_id);
CREATE INDEX IF NOT EXISTS idx_inbound_status ON public.inbound(status);
CREATE INDEX IF NOT EXISTS idx_inbound_number ON public.inbound(inbound_number);
CREATE INDEX IF NOT EXISTS idx_inbound_created ON public.inbound(created_at DESC);

-- فهارس أصناف الوارد
CREATE INDEX IF NOT EXISTS idx_inbound_items_inbound ON public.inbound_items(inbound_id);

-- فهارس المستخدمين
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_branch ON public.users(branch_id);

-- فهارس سجل الأنشطة
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- ============================================
-- دالة تحديث updated_at تلقائياً
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق التريجر على جميع الجداول التي تحتوي على updated_at
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON public.branches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_couriers_updated_at BEFORE UPDATE ON public.couriers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trip_stages_updated_at BEFORE UPDATE ON public.trip_stages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_queue_updated_at BEFORE UPDATE ON public.queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inbound_updated_at BEFORE UPDATE ON public.inbound
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- تفعيل Row Level Security (RLS)
-- ============================================
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbound ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbound_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- سياسات RLS (Row Level Security Policies)
-- ============================================

-- الفروع: الجميع يمكنه القراءة، فقط المدراء يمكنهم التعديل
CREATE POLICY "Branches are viewable by everyone" ON public.branches
  FOR SELECT USING (true);

CREATE POLICY "Branches are modifiable by admins" ON public.branches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = (SELECT auth.uid()::text)
      AND users.role IN ('ADMIN', 'SUPERVISOR')
    )
  );

-- المندوبون: الجميع يمكنه القراءة، المشرفون يمكنهم التعديل
CREATE POLICY "Couriers are viewable by everyone" ON public.couriers
  FOR SELECT USING (true);

CREATE POLICY "Couriers are modifiable by authorized users" ON public.couriers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = (SELECT auth.uid()::text)
      AND users.role IN ('ADMIN', 'SUPERVISOR', 'WAREHOUSE')
    )
  );

-- الرحلات: الجميع يمكنه القراءة
CREATE POLICY "Trips are viewable by everyone" ON public.trips
  FOR SELECT USING (true);

CREATE POLICY "Trips are modifiable by authorized users" ON public.trips
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = (SELECT auth.uid()::text)
      AND users.role IN ('ADMIN', 'SUPERVISOR', 'WAREHOUSE', 'CASHIER')
    )
  );

-- مراحل الرحلات: الجميع يمكنه القراءة
CREATE POLICY "Trip stages are viewable by everyone" ON public.trip_stages
  FOR SELECT USING (true);

CREATE POLICY "Trip stages are modifiable by authorized users" ON public.trip_stages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = (SELECT auth.uid()::text)
      AND users.role IN ('ADMIN', 'SUPERVISOR', 'WAREHOUSE')
    )
  );

-- الطابور: الجميع يمكنه القراءة
CREATE POLICY "Queue is viewable by everyone" ON public.queue
  FOR SELECT USING (true);

CREATE POLICY "Queue is modifiable by authorized users" ON public.queue
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = (SELECT auth.uid()::text)
      AND users.role IN ('ADMIN', 'SUPERVISOR', 'CASHIER')
    )
  );

-- القرارات: الجميع يمكنه القراءة
CREATE POLICY "Decisions are viewable by everyone" ON public.decisions
  FOR SELECT USING (true);

CREATE POLICY "Decisions are insertable by system" ON public.decisions
  FOR INSERT WITH CHECK (true);

-- الوارد: الجميع يمكنه القراءة
CREATE POLICY "Inbound is viewable by everyone" ON public.inbound
  FOR SELECT USING (true);

CREATE POLICY "Inbound is modifiable by authorized users" ON public.inbound
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = (SELECT auth.uid()::text)
      AND users.role IN ('ADMIN', 'SUPERVISOR', 'WAREHOUSE')
    )
  );

-- أصناف الوارد: الجميع يمكنه القراءة
CREATE POLICY "Inbound items are viewable by everyone" ON public.inbound_items
  FOR SELECT USING (true);

CREATE POLICY "Inbound items are modifiable by authorized users" ON public.inbound_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = (SELECT auth.uid()::text)
      AND users.role IN ('ADMIN', 'SUPERVISOR', 'WAREHOUSE')
    )
  );

-- المستخدمين: المستخدمون يمكنهم قراءة بياناتهم فقط
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users are modifiable by admins" ON public.users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = (SELECT auth.uid()::text)
      AND u.role = 'ADMIN'
    )
  );

-- سجل الأنشطة: المدراء فقط يمكنهم القراءة
CREATE POLICY "Audit logs are viewable by admins" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = (SELECT auth.uid()::text)
      AND users.role = 'ADMIN'
    )
  );

CREATE POLICY "Audit logs are insertable by system" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- ============================================
-- تفعيل Realtime للمزامنة اللحظية
-- ============================================

-- إضافة جميع الجداول إلى نشر Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.branches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.couriers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_stages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue;
ALTER PUBLICATION supabase_realtime ADD TABLE public.decisions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inbound;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inbound_items;

-- ============================================
-- البيانات الأولية (Seed Data)
-- ============================================

-- إدخال الفروع
INSERT INTO public.branches (id, name, code, cashier_capacity, dock_capacity, max_queue, operational_status) VALUES
  ('b1', 'القاهرة', 'CAI', 3, 5, 20, 'ACTIVE'),
  ('b2', 'الإسكندرية', 'ALX', 2, 4, 15, 'ACTIVE'),
  ('b3', 'طنطا', 'TNT', 2, 3, 10, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- إدخال المندوبين
INSERT INTO public.couriers (id, code, name, phone, branch_id, status) VALUES
  ('c1', 'C001', 'أحمد محمد', '0101234567', 'b1', 'AVAILABLE'),
  ('c2', 'C002', 'محمود علي', '0109876543', 'b1', 'AVAILABLE'),
  ('c3', 'C003', 'خالد حسن', '0115554433', 'b2', 'AVAILABLE'),
  ('c4', 'C004', 'عمر سعيد', '0127778899', 'b2', 'AVAILABLE'),
  ('c5', 'C005', 'ياسر إبراهيم', '0103332211', 'b3', 'AVAILABLE')
ON CONFLICT (id) DO NOTHING;

-- إدخال المستخدمين
INSERT INTO public.users (id, username, password_hash, name, role, branch_id, courier_id) VALUES
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
CREATE OR REPLACE FUNCTION public.get_cashier_occupancy(branch_uuid TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT cashier_occupancy FROM public.branches WHERE id = branch_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة للحصول على موقع الرحلة في الطابور
CREATE OR REPLACE FUNCTION public.get_queue_position(trip_uuid TEXT)
RETURNS INTEGER AS $$
DECLARE
  pos INTEGER;
  trip_branch_id TEXT;
  trip_entered_at TIMESTAMP WITH TIME ZONE;
  trip_priority INTEGER;
BEGIN
  -- الحصول على معلومات الرحلة
  SELECT branch_id, entered_at, priority 
  INTO trip_branch_id, trip_entered_at, trip_priority
  FROM public.queue 
  WHERE trip_id = trip_uuid AND status = 'WAITING';
  
  IF trip_branch_id IS NULL THEN
    RETURN 0;
  END IF;
  
  -- حساب الموقع
  SELECT COUNT(*) + 1 INTO pos
  FROM public.queue
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
CREATE OR REPLACE FUNCTION public.promote_next_in_queue(branch_uuid TEXT)
RETURNS TEXT AS $$
DECLARE
  next_trip_id TEXT;
  branch_capacity INTEGER;
  branch_occupancy INTEGER;
BEGIN
  -- الحصول على سعة وإشغال الكاشير
  SELECT cashier_capacity, cashier_occupancy 
  INTO branch_capacity, branch_occupancy
  FROM public.branches 
  WHERE id = branch_uuid;
  
  -- التحقق من وجود مساحة
  IF branch_occupancy >= branch_capacity THEN
    RETURN NULL;
  END IF;
  
  -- الحصول على الرحلة التالية في الطابور
  SELECT trip_id INTO next_trip_id
  FROM public.queue
  WHERE branch_id = branch_uuid AND status = 'WAITING'
  ORDER BY priority ASC, entered_at ASC
  LIMIT 1;
  
  IF next_trip_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- ترقية الرحلة
  UPDATE public.queue
  SET status = 'PROMOTED', updated_at = NOW()
  WHERE trip_id = next_trip_id;
  
  -- زيادة إشغال الكاشير
  UPDATE public.branches
  SET cashier_occupancy = cashier_occupancy + 1, updated_at = NOW()
  WHERE id = branch_uuid;
  
  -- تحديث حالة الرحلة
  UPDATE public.trips
  SET status = 'ACTIVE', current_stage = 'CASHIER', updated_at = NOW()
  WHERE id = next_trip_id;
  
  -- بدء مرحلة الكاشير
  UPDATE public.trip_stages
  SET status = 'IN_PROGRESS', started_at = NOW(), updated_at = NOW()
  WHERE trip_id = next_trip_id AND stage = 'CASHIER';
  
  -- تحديث حالة المندوب
  UPDATE public.couriers
  SET status = 'IN_CASHIER', updated_at = NOW()
  WHERE id = (SELECT courier_id FROM public.trips WHERE id = next_trip_id);
  
  RETURN next_trip_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Views (عرض البيانات)
-- ============================================

-- عرض الرحلات النشطة
CREATE OR REPLACE VIEW public.active_trips_view AS
SELECT 
  t.*,
  c.name as courier_name,
  c.code as courier_code,
  b.name as branch_name
FROM public.trips t
LEFT JOIN public.couriers c ON t.courier_id = c.id
LEFT JOIN public.branches b ON t.branch_id = b.id
WHERE t.status IN ('ACTIVE', 'WAITING');

-- عرض الطابور
CREATE OR REPLACE VIEW public.queue_view AS
SELECT 
  q.*,
  t.trip_number,
  c.name as courier_name,
  c.code as courier_code,
  b.name as branch_name
FROM public.queue q
LEFT JOIN public.trips t ON q.trip_id = t.id
LEFT JOIN public.couriers c ON t.courier_id = c.id
LEFT JOIN public.branches b ON q.branch_id = b.id
WHERE q.status = 'WAITING'
ORDER BY q.priority ASC, q.entered_at ASC;

-- عرض الوارد مع الأصناف
CREATE OR REPLACE VIEW public.inbound_with_items_view AS
SELECT 
  i.*,
  b.name as branch_name,
  COALESCE(
    (SELECT json_agg(row_to_json(ii))
     FROM public.inbound_items ii
     WHERE ii.inbound_id = i.id),
    '[]'::json
  ) as items
FROM public.inbound i
LEFT JOIN public.branches b ON i.branch_id = b.id;

-- ============================================
-- رسالة نجاح
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TBOS Database Schema Created Successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tables: branches, couriers, trips, trip_stages, queue, decisions, inbound, inbound_items, users, audit_logs';
  RAISE NOTICE 'Indexes: Created for performance optimization';
  RAISE NOTICE 'RLS: Enabled on all tables';
  RAISE NOTICE 'Realtime: Enabled for all tables';
  RAISE NOTICE 'Seed Data: Branches, Couriers, Users inserted';
  RAISE NOTICE 'Functions: get_cashier_occupancy, get_queue_position, promote_next_in_queue';
  RAISE NOTICE 'Views: active_trips_view, queue_view, inbound_with_items_view';
  RAISE NOTICE '========================================';
END $$;

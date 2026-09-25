# 🗄️ دليل قاعدة بيانات Supabase لتطبيق TBOS

## 📋 نظرة عامة

تم إنشاء ملف SQL شامل يحتوي على جميع الجداول المطلوبة لتطبيق TBOS مع:
- ✅ 10 جداول رئيسية
- ✅ 25+ فهرس للأداء
- ✅ Row Level Security (RLS)
- ✅ Realtime للمزامنة اللحظية
- ✅ بيانات أولية (Seed Data)
- ✅ دوال مساعدة
- ✅ Views لعرض البيانات

---

## 🚀 خطوات الإعداد

### 1. إنشاء مشروع Supabase

1. اذهب إلى [Supabase](https://supabase.com)
2. سجل دخولك أو أنشئ حساب جديد
3. أنشئ مشروع جديد

### 2. تنفيذ مخطط قاعدة البيانات

1. افتح **SQL Editor** في Supabase Dashboard
2. انسخ محتوى ملف `supabase-schema.sql`
3. الصقه في SQL Editor
4. انقر على **Run**

### 3. إعداد متغيرات البيئة

1. انسخ ملف `.env.example` إلى `.env.local`:
```bash
cp .env.example .env.local
```

2. احصل على مفاتيح API من Supabase Dashboard:
   - اذهب إلى **Settings** → **API**
   - انسخ **Project URL** → `VITE_SUPABASE_URL`
   - انسخ **anon public key** → `VITE_SUPABASE_ANON_KEY`

3. عدّل ملف `.env.local`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. تفعيل Realtime

1. اذهب إلى **Database** → **Replication**
2. فعّل Realtime على جميع الجداول:
   - branches
   - couriers
   - trips
   - trip_stages
   - queue
   - decisions
   - inbound
   - inbound_items

---

## 📊 الجداول المُنشأة

### 1. **branches** - الفروع
```sql
- id (UUID)
- name (TEXT)
- code (TEXT, UNIQUE)
- cashier_capacity (INTEGER)
- cashier_occupancy (INTEGER)
- dock_capacity (INTEGER)
- dock_occupancy (INTEGER)
- max_queue (INTEGER)
- operational_status (TEXT: 'ACTIVE' | 'PAUSED')
- created_at, updated_at
```

### 2. **couriers** - المندوبين
```sql
- id (UUID)
- code (TEXT, UNIQUE)
- name (TEXT)
- phone (TEXT)
- branch_id (UUID, FK → branches)
- status (TEXT: 'AVAILABLE' | 'ON_TRIP' | 'WAITING' | 'IN_CASHIER' | 'COMPLETED')
- created_at, updated_at
```

### 3. **trips** - الرحلات
```sql
- id (UUID)
- trip_number (TEXT, UNIQUE)
- courier_id (UUID, FK → couriers)
- branch_id (UUID, FK → branches)
- arrival_at (TIMESTAMP)
- completed_at (TIMESTAMP)
- current_stage (TEXT)
- status (TEXT: 'ACTIVE' | 'WAITING' | 'COMPLETED' | 'CANCELLED')
- created_at, updated_at
```

### 4. **trip_stages** - مراحل الرحلات
```sql
- id (UUID)
- trip_id (UUID, FK → trips)
- stage (TEXT)
- status (TEXT: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED')
- started_at (TIMESTAMP)
- finished_at (TIMESTAMP)
- duration_seconds (INTEGER)
- created_at, updated_at
- UNIQUE(trip_id, stage)
```

### 5. **queue** - الطابور
```sql
- id (UUID)
- trip_id (UUID, FK → trips)
- branch_id (UUID, FK → branches)
- queue_number (INTEGER)
- priority (INTEGER)
- entered_at (TIMESTAMP)
- status (TEXT: 'WAITING' | 'PROMOTED' | 'COMPLETED')
- created_at, updated_at
```

### 6. **decisions** - القرارات
```sql
- id (UUID)
- trip_id (UUID, FK → trips)
- branch_id (UUID, FK → branches)
- decision (TEXT)
- reason_ar (TEXT)
- reason_en (TEXT)
- priority (INTEGER)
- queue_id (UUID, FK → queue)
- created_at
```

### 7. **inbound** - الوارد
```sql
- id (UUID)
- inbound_number (TEXT, UNIQUE)
- driver_name (TEXT)
- driver_code (TEXT)
- container_number (TEXT)
- container_type (TEXT)
- branch_id (UUID, FK → branches)
- status (TEXT: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED')
- started_at (TIMESTAMP)
- completed_at (TIMESTAMP)
- created_at, updated_at
```

### 8. **inbound_items** - أصناف الوارد
```sql
- id (UUID)
- inbound_id (UUID, FK → inbound)
- item_name (TEXT)
- item_code (TEXT)
- quantity (INTEGER)
- unit (TEXT)
- notes (TEXT)
- created_at
```

### 9. **users** - المستخدمين
```sql
- id (UUID)
- username (TEXT, UNIQUE)
- password_hash (TEXT)
- name (TEXT)
- role (TEXT: 'ADMIN' | 'SUPERVISOR' | 'WAREHOUSE' | 'CASHIER' | 'COURIER' | 'VIEWER')
- branch_id (UUID, FK → branches)
- courier_id (UUID, FK → couriers)
- created_at, updated_at
```

### 10. **audit_logs** - سجل الأنشطة
```sql
- id (UUID)
- user_id (UUID, FK → users)
- user_name (TEXT)
- user_role (TEXT)
- action (TEXT)
- description (TEXT)
- details (JSONB)
- created_at
```

---

## 🔒 الأمان (Row Level Security)

### السياسات المطبقة:

#### الفروع (branches):
- ✅ الجميع يمكنه القراءة
- ✅ فقط المدراء والمشرفين يمكنهم التعديل

#### المندوبين (couriers):
- ✅ الجميع يمكنه القراءة
- ✅ المدراء والمشرفين وأمناء المخزن يمكنهم التعديل

#### الرحلات (trips):
- ✅ الجميع يمكنه القراءة
- ✅ المدراء والمشرفين وأمناء المخزن والكاشير يمكنهم التعديل

#### الطابور (queue):
- ✅ الجميع يمكنه القراءة
- ✅ المدراء والمشرفين وأمناء الكاشير يمكنهم التعديل

#### القرارات (decisions):
- ✅ الجميع يمكنه القراءة
- ✅ النظام يمكنه الإدراج

#### الوارد (inbound):
- ✅ الجميع يمكنه القراءة
- ✅ المدراء والمشرفين وأمناء المخزن يمكنهم التعديل

#### المستخدمين (users):
- ✅ الجميع يمكنه القراءة
- ✅ فقط المدراء يمكنهم التعديل

#### سجل الأنشطة (audit_logs):
- ✅ فقط المدراء يمكنهم القراءة
- ✅ النظام يمكنه الإدراج

---

## 🔄 المزامنة اللحظية (Realtime)

### الجداول المفعّلة:
- ✅ branches
- ✅ couriers
- ✅ trips
- ✅ trip_stages
- ✅ queue
- ✅ decisions
- ✅ inbound
- ✅ inbound_items

### كيفية الاستخدام:

```typescript
import { subscribeToTable, unsubscribeFromChannel } from './lib/supabase';

// الاشتراك في تغييرات جدول المندوبين
const channel = subscribeToTable('couriers', (payload) => {
  console.log('Change detected:', payload);
  
  if (payload.eventType === 'INSERT') {
    // إضافة مندوب جديد
    console.log('New courier:', payload.new);
  } else if (payload.eventType === 'UPDATE') {
    // تحديث مندوب موجود
    console.log('Updated courier:', payload.new);
  } else if (payload.eventType === 'DELETE') {
    // حذف مندوب
    console.log('Deleted courier:', payload.old);
  }
});

// إلغاء الاشتراك عند عدم الحاجة
unsubscribeFromChannel(channel);
```

---

## 📝 البيانات الأولية (Seed Data)

### الفروع (3):
```sql
- b1: القاهرة (CAI) - سعة كاشير: 3، سعة رصيف: 5
- b2: الإسكندرية (ALX) - سعة كاشير: 2، سعة رصيف: 4
- b3: طنطا (TNT) - سعة كاشير: 2، سعة رصيف: 3
```

### المندوبين (5):
```sql
- c1: أحمد محمد (C001) - القاهرة
- c2: محمود علي (C002) - القاهرة
- c3: خالد حسن (C003) - الإسكندرية
- c4: عمر سعيد (C004) - الإسكندرية
- c5: ياسر إبراهيم (C005) - طنطا
```

### المستخدمين (6):
```sql
- u1: admin (مدير النظام) - ADMIN
- u2: supervisor (المشرف) - SUPERVISOR
- u3: warehouse (أمين المخزن) - WAREHOUSE
- u4: cashier (أمين الكاشير) - CASHIER
- u5: courier (مندوب تجريبي) - COURIER
- u6: viewer (مشاهد) - VIEWER
```

---

## 🛠️ الدوال المساعدة

### 1. get_cashier_occupancy(branch_uuid)
```sql
-- الحصول على عدد المشغولين في الكاشير
SELECT get_cashier_occupancy('b1');
```

### 2. get_queue_position(trip_uuid)
```sql
-- الحصول على موقع الرحلة في الطابور
SELECT get_queue_position('trip-id');
```

### 3. promote_next_in_queue(branch_uuid)
```sql
-- ترقية الرحلة التالية من الطابور
SELECT promote_next_in_queue('b1');
```

---

## 📊 Views (عروض البيانات)

### 1. active_trips_view
```sql
-- عرض الرحلات النشطة مع معلومات المندوب والفرع
SELECT * FROM active_trips_view;
```

### 2. queue_view
```sql
-- عرض الطابور مع معلومات الرحلة والمندوب والفرع
SELECT * FROM queue_view;
```

### 3. inbound_with_items_view
```sql
-- عرض الوارد مع جميع الأصناف
SELECT * FROM inbound_with_items_view;
```

---

## 🔧 الاستخدام في التطبيق

### ملف `src/lib/supabase.ts`

الملف يحتوي على:
- ✅ عميل Supabase مُعدّ
- ✅ دالة `checkSupabaseConnection()` للتحقق من الاتصال
- ✅ دالة `subscribeToTable()` للاشتراك في تغييرات الجداول
- ✅ دالة `unsubscribeFromChannel()` لإلغاء الاشتراك
- ✅ أنواع البيانات (Types) لجميع الجداول

### ملف `src/lib/db.ts`

الملف يدعم:
- ✅ Supabase كقاعدة بيانات أساسية
- ✅ localStorage كـ Fallback آمن
- ✅ التبديل التلقائي بين النظامين
- ✅ نفس الواجهة الحالية (لا تغيير في الكود)

---

## 🧪 الاختبار

### 1. اختبار الاتصال
```typescript
import { checkSupabaseConnection } from './lib/supabase';

const isConnected = await checkSupabaseConnection();
console.log('Connected to Supabase:', isConnected);
```

### 2. اختبار الاستعلامات
```typescript
import { supabase } from './lib/supabase';

// جلب جميع الفروع
const { data, error } = await supabase.from('branches').select('*');
console.log('Branches:', data);
```

### 3. اختبار المزامنة
```typescript
import { subscribeToTable } from './lib/supabase';

subscribeToTable('couriers', (payload) => {
  console.log('Courier changed:', payload);
});
```

---

## 🐛 استكشاف الأخطاء

### المشكلة: "Supabase environment variables not set"

**الحل:**
1. تأكد من وجود ملف `.env.local`
2. تأكد من صحة `VITE_SUPABASE_URL` و `VITE_SUPABASE_ANON_KEY`
3. أعد تشغيل خادم التطوير: `npm run dev`

### المشكلة: "Connection check failed"

**الحل:**
1. تأكد من أن مشروع Supabase نشط
2. تحقق من اتصال الإنترنت
3. تأكد من صحة URL و Key

### المشكلة: "Permission denied"

**الحل:**
1. تأكد من تفعيل RLS policies
2. تحقق من أن المستخدم لديه الصلاحيات المطلوبة
3. راجع Console للأخطاء

---

## 📚 الموارد

- [Supabase Documentation](https://supabase.com/docs)
- [JavaScript Client Library](https://supabase.com/docs/reference/javascript)
- [Realtime](https://supabase.com/docs/guides/realtime)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Schema](https://supabase.com/docs/guides/database)

---

## ✅ الخلاصة

### ما تم إنجازه:
1. ✅ ملف SQL شامل مع 10 جداول
2. ✅ 25+ فهرس للأداء
3. ✅ Row Level Security (RLS)
4. ✅ Realtime للمزامنة اللحظية
5. ✅ بيانات أولية (3 فروع، 5 مندوبين، 6 مستخدمين)
6. ✅ 3 دوال مساعدة
7. ✅ 3 Views
8. ✅ ملف اتصال Supabase
9. ✅ تحديث db.ts لدعم Supabase مع Fallback
10. ✅ توثيق شامل

### الفوائد:
- 🌐 مزامنة لحظية بين الأجهزة
- 💾 Fallback آمن إلى localStorage
- 🔒 أمان عالي مع RLS
- ⚡ أداء محسّن مع الفهارس
- 📊 Views لعرض البيانات
- 🛠️ دوال مساعدة للعمليات الشائعة

---

**الملف جاهز للاستخدام!** 🚀✅

**التطبيق الآن يدعم Supabase مع Fallback آمن!** 💾🌐

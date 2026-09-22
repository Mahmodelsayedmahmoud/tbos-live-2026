# 🗄️ دليل إنشاء جداول قاعدة البيانات في Supabase

## 📋 نظرة عامة

تم إنشاء ملف `supabase-schema.sql` شامل يحتوي على جميع الجداول والعلاقات المطلوبة لتشغيل تطبيق TBOS مع المزامنة اللحظية بين الأجهزة.

---

## 🎯 محتويات الملف

### الجداول (10 جداول):
1. ✅ **branches** - الفروع
2. ✅ **couriers** - المندوبين
3. ✅ **trips** - الرحلات
4. ✅ **trip_stages** - مراحل الرحلات
5. ✅ **queue** - الطابور
6. ✅ **decisions** - القرارات
7. ✅ **inbound** - الوارد
8. ✅ **inbound_items** - أصناف الوارد
9. ✅ **users** - المستخدمين
10. ✅ **audit_logs** - سجل الأنشطة

### الميزات:
- ✅ **الفهارس (Indexes)** - لتحسين الأداء
- ✅ **العلاقات (Foreign Keys)** - لربط الجداول
- ✅ **RLS Policies** - للأمان
- ✅ **Realtime Subscriptions** - للمزامنة اللحظية
- ✅ **Triggers** - لتحديث updated_at تلقائياً
- ✅ **Functions** - دوال مساعدة
- ✅ **Views** - عروض البيانات
- ✅ **Seed Data** - البيانات الأولية

---

## 🚀 خطوات التنفيذ

### الخطوة 1: الدخول إلى Supabase Dashboard

1. اذهب إلى [Supabase Dashboard](https://supabase.com/dashboard/project/jkzgpfjaovqxxtrkxalu)
2. تأكد من تسجيل الدخول

### الخطوة 2: فتح SQL Editor

1. من القائمة الجانبية، انقر على **SQL Editor**
2. انقر على **New Query**

### الخطوة 3: نسخ محتوى الملف

1. افتح ملف `supabase-schema.sql`
2. انسخ جميع المحتويات (Ctrl+A ثم Ctrl+C)

### الخطوة 4: تنفيذ الاستعلام

1. الصق المحتوى في SQL Editor
2. انقر على **Run** (أو اضغط Ctrl+Enter)
3. انتظر حتى تكتمل العملية

### الخطوة 5: التحقق من النجاح

يجب أن ترى رسالة:
```
========================================
TBOS Database Schema Created Successfully!
========================================
Tables: branches, couriers, trips, trip_stages, queue, decisions, inbound, inbound_items, users, audit_logs
Indexes: Created for performance optimization
RLS: Enabled on all tables
Realtime: Enabled for all tables
Seed Data: Branches, Couriers, Users inserted
Functions: get_cashier_occupancy, get_queue_position, promote_next_in_queue
Views: active_trips_view, queue_view, inbound_with_items_view
========================================
```

### الخطوة 6: التحقق من الجداول

1. من القائمة الجانبية، انقر على **Table Editor**
2. تحقق من وجود الجداول التالية:
   - ✅ branches (3 صفوف)
   - ✅ couriers (5 صفوف)
   - ✅ trips (0 صفوف)
   - ✅ trip_stages (0 صفوف)
   - ✅ queue (0 صفوف)
   - ✅ decisions (0 صفوف)
   - ✅ inbound (0 صفوف)
   - ✅ inbound_items (0 صفوف)
   - ✅ users (6 صفوف)
   - ✅ audit_logs (0 صفوف)

### الخطوة 7: التحقق من Realtime

1. من القائمة الجانبية، انقر على **Database**
2. انقر على **Replication**
3. تأكد من تفعيل Realtime على جميع الجداول:
   - ✅ branches
   - ✅ couriers
   - ✅ trips
   - ✅ trip_stages
   - ✅ queue
   - ✅ decisions
   - ✅ inbound
   - ✅ inbound_items

---

## 📊 البيانات الأولية

### الفروع (3 فروع):
| ID | الاسم | الكود | سعة الكاشير | سعة الرصيف | الحد الأقصى للطابور |
|----|-------|-------|-------------|------------|---------------------|
| b1 | القاهرة | CAI | 3 | 5 | 20 |
| b2 | الإسكندرية | ALX | 2 | 4 | 15 |
| b3 | طنطا | TNT | 2 | 3 | 10 |

### المندوبين (5 مندوبين):
| ID | الكود | الاسم | الهاتف | الفرع |
|----|-------|-------|---------|-------|
| c1 | C001 | أحمد محمد | 0101234567 | القاهرة |
| c2 | C002 | محمود علي | 0109876543 | القاهرة |
| c3 | C003 | خالد حسن | 0115554433 | الإسكندرية |
| c4 | C004 | عمر سعيد | 0127778899 | الإسكندرية |
| c5 | C005 | ياسر إبراهيم | 0103332211 | طنطا |

### المستخدمين (6 مستخدمين):
| ID | اسم المستخدم | الاسم | الدور |
|----|--------------|-------|-------|
| u1 | admin | مدير النظام | ADMIN |
| u2 | supervisor | المشرف | SUPERVISOR |
| u3 | warehouse | أمين المخزن | WAREHOUSE |
| u4 | cashier | أمين الكاشير | CASHIER |
| u5 | courier | مندوب تجريبي | COURIER |
| u6 | viewer | مشاهد | VIEWER |

---

## 🔒 الأمان (RLS Policies)

### سياسة الوصول:

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

### الجداول المفعّلة للمزامنة:
- ✅ branches
- ✅ couriers
- ✅ trips
- ✅ trip_stages
- ✅ queue
- ✅ decisions
- ✅ inbound
- ✅ inbound_items

### كيف تعمل المزامنة:

```
الجهاز 1: إجراء تغيير → Supabase → Realtime Event → الجهاز 2
                                                    ↓
                                              تحديث فوري
```

### مثال:
1. المستخدم على الجهاز 1 يضيف مندوب جديد
2. يتم حفظ المندوب في Supabase
3. Supabase يرسل Realtime Event
4. جميع الأجهزة المتصلة تستقبل الحدث
5. يتم تحديث الواجهة تلقائياً على جميع الأجهزة

---

## 🛠️ الدوال المساعدة

### 1. get_cashier_occupancy(branch_uuid TEXT)
```sql
SELECT get_cashier_occupancy('b1');
-- النتيجة: عدد المشغولين في الكاشير
```

### 2. get_queue_position(trip_uuid TEXT)
```sql
SELECT get_queue_position('trip-id-here');
-- النتيجة: موقع الرحلة في الطابور
```

### 3. promote_next_in_queue(branch_uuid TEXT)
```sql
SELECT promote_next_in_queue('b1');
-- النتيجة: ترقية الرحلة التالية من الطابور
```

---

## 📈 العروض (Views)

### 1. active_trips_view
```sql
SELECT * FROM active_trips_view;
-- يعرض جميع الرحلات النشطة مع معلومات المندوب والفرع
```

### 2. queue_view
```sql
SELECT * FROM queue_view;
-- يعرض الطابور مع معلومات الرحلة والمندوب والفرع
```

### 3. inbound_with_items_view
```sql
SELECT * FROM inbound_with_items_view;
-- يعرض الوارد مع جميع الأصناف
```

---

## 🧪 اختبار المزامنة

### الخطوة 1: فتح التطبيق على جهازين
```
الجهاز 1: https://your-app.vercel.app
الجهاز 2: https://your-app.vercel.app
```

### الخطوة 2: تسجيل الدخول
```
admin / admin123
```

### الخطوة 3: إجراء تغيير على الجهاز الأول
```
1. اذهب إلى "المندوبون"
2. انقر على "استيراد مندوبين"
3. ارفع ملف Excel
```

### الخطوة 4: التحقق على الجهاز الثاني
```
1. انتظر بضع ثوانٍ
2. يجب أن تظهر المندوبين الجدد تلقائياً!
```

---

## 🐛 حل المشاكل

### المشكلة 1: "relation already exists"

**الحل:**
```sql
-- احذف الجداول القديمة
DROP TABLE IF EXISTS public.audit_logs;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.inbound_items;
DROP TABLE IF EXISTS public.inbound;
DROP TABLE IF EXISTS public.decisions;
DROP TABLE IF EXISTS public.queue;
DROP TABLE IF EXISTS public.trip_stages;
DROP TABLE IF EXISTS public.trips;
DROP TABLE IF EXISTS public.couriers;
DROP TABLE IF EXISTS public.branches;

-- أعد تنفيذ الملف
```

### المشكلة 2: "permission denied"

**الحل:**
1. تأكد من أن لديك صلاحيات كافية
2. تحقق من RLS policies
3. جرب تعطيل RLS مؤقتاً:
```sql
ALTER TABLE public.branches DISABLE ROW LEVEL SECURITY;
-- ... كرر لجميع الجداول
```

### المشكلة 3: "Realtime not working"

**الحل:**
1. تأكد من تفعيل Realtime في Supabase Dashboard
2. تحقق من أن الجداول مضافة إلى Publication
3. أعد تشغيل التطبيق

### المشكلة 4: "No data showing"

**الحل:**
1. تأكد من تنفيذ Seed Data
2. تحقق من Console للأخطاء
3. جرب إعادة تحميل الصفحة

---

## 📊 إحصائيات قاعدة البيانات

### عدد الجداول: 10
### عدد الفهارس: 25+
### عدد الدوال: 3
### عدد العروض: 3
### عدد السياسات: 20+

---

## ✅ قائمة التحقق

### قبل التنفيذ:
- [ ] تم الدخول إلى Supabase Dashboard
- [ ] تم فتح SQL Editor
- [ ] تم نسخ محتوى الملف

### بعد التنفيذ:
- [ ] ظهرت رسالة النجاح
- [ ] تم التحقق من وجود الجداول
- [ ] تم التحقق من البيانات الأولية
- [ ] تم تفعيل Realtime
- [ ] تم اختبار المزامنة

---

## 🎉 الخلاصة

تم إنشاء ملف SQL شامل يحتوي على:

### ✅ الجداول:
- 10 جداول كاملة مع جميع الأعمدة

### ✅ العلاقات:
- Foreign Keys لربط الجداول

### ✅ الفهارس:
- 25+ index لتحسين الأداء

### ✅ الأمان:
- RLS Policies للتحكم في الوصول

### ✅ المزامنة:
- Realtime Subscriptions للمزامنة اللحظية

### ✅ الدوال:
- 3 دوال مساعدة للعمليات الشائعة

### ✅ العروض:
- 3 Views لعرض البيانات

### ✅ البيانات الأولية:
- 3 فروع
- 5 مندوبين
- 6 مستخدمين

---

**تم إنشاء ملف SQL شامل بنجاح!** 🎉✅

**الخطوة التالية: تنفيذ الملف في Supabase SQL Editor** 🚀

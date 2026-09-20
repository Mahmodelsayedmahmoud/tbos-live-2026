# 🚀 دليل ربط TBOS بقاعدة بيانات Supabase السحابية

## 📋 نظرة عامة

تم تجهيز التطبيق للربط بقاعدة بيانات Supabase السحابية مع دعم المزامنة اللحظية (Real-time) لجميع المستخدمين.

---

## ⚡ الخطوات السريعة (5 دقائق)

### 1️⃣ إنشاء حساب Supabase

1. اذهب إلى [supabase.com](https://supabase.com)
2. انقر على "Start your project"
3. سجل دخولك بحساب GitHub أو Email
4. أنشئ مشروع جديد:
   - **Name**: `tbos-production`
   - **Database Password**: اختر كلمة مرور قوية
   - **Region**: اختر المنطقة الأقرب لك

### 2️⃣ إعداد قاعدة البيانات

1. في لوحة تحكم Supabase، اذهب إلى **SQL Editor**
2. انقر على **New Query**
3. انسخ محتوى ملف `supabase-schema.sql`
4. الصقه في المحرر
5. انقر على **Run** أو اضغط `Ctrl+Enter`

### 3️⃣ الحصول على مفاتيح API

1. اذهب إلى **Settings** > **API**
2. انسخ القيم التالية:
   - **Project URL**: `https://your-project.supabase.co`
   - **anon public key**: `eyJhbGc...`

### 4️⃣ تكوين التطبيق

1. انسخ ملف `.env.example` إلى `.env`:
   ```bash
   cp .env.example .env
   ```

2. افتح ملف `.env` وأضف القيم:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. احفظ الملف

### 5️⃣ التحقق من الاتصال

1. شغّل التطبيق:
   ```bash
   npm run dev
   ```

2. افتح المتصفح على `http://localhost:5173`

3. تحقق من Console:
   - ✅ لا توجد أخطاء
   - ✅ رسالة "Supabase connected" (إذا تم التكوين بنجاح)

---

## 🔄 المزامنة اللحظية (Real-time)

### كيف تعمل المزامنة؟

1. **المستخدم A** يقوم بتغيير في التطبيق
2. **Supabase** يرسل الحدث إلى جميع المستخدمين المتصلين
3. **المستخدم B** يرى التغيير فوراً دون إعادة تحميل الصفحة

### مثال عملي:

```
المستخدم A (القاهرة):
├─ إنشاء وارد جديد
└─ يظهر فوراً عند جميع المستخدمين

المستخدم B (الإسكندرية):
├─ يرى الوارد الجديد فوراً
└─ بدون إعادة تحميل الصفحة

المستخدم C (طنطا):
├─ يرى الوارد الجديد فوراً
└─ بدون إعادة تحميل الصفحة
```

---

## 📊 الجداول المُنشأة

### 1. branches (الفروع)
- id, name, code
- cashier_capacity, cashier_occupancy
- dock_capacity, dock_occupancy
- max_queue, operational_status

### 2. couriers (المندوبون)
- id, code, name, phone
- branch_id, status

### 3. trips (الرحلات)
- id, trip_number
- courier_id, branch_id
- arrival_at, completed_at
- current_stage, status

### 4. trip_stages (مراحل الرحلات)
- id, trip_id, stage
- status, started_at, finished_at
- duration_seconds

### 5. queue (الطابور)
- id, trip_id, branch_id
- queue_number, priority
- entered_at, status

### 6. decisions (القرارات)
- id, trip_id, branch_id
- decision, reason_ar, reason_en
- priority, queue_id

### 7. inbound (الوارد)
- id, inbound_number
- driver_name, driver_code
- container_number, container_type
- branch_id, status
- started_at, completed_at

### 8. inbound_items (أصناف الوارد)
- id, inbound_id
- item_name, item_code
- quantity, unit, notes

### 9. users (المستخدمون)
- id, username, password_hash
- name, role
- branch_id, courier_id

---

## 🔒 الأمان

### Row Level Security (RLS)

تم تفعيل RLS على جميع الجداول:
- ✅ الجميع يمكنه القراءة
- ✅ فقط المستخدمون المصرح لهم يمكنهم التعديل
- ✅ حماية البيانات الحساسة

### المفاتيح

- ✅ **anon key**: آمن للاستخدام في الواجهة الأمامية
- ❌ **service_role key**: خطير جداً - لا تشاركه أبداً

---

## 📈 الأداء

### Indexes

تم إنشاء indexes لتحسين الأداء:
```sql
CREATE INDEX idx_couriers_branch ON couriers(branch_id);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_queue_branch ON queue(branch_id);
-- ... وغيرها
```

### Real-time

- ✅ تحديث فوري عبر WebSockets
- ✅ 10 أحداث في الثانية
- ✅ لا حاجة لإعادة التحميل

---

## 🧪 الاختبار

### اختبار الاتصال

```javascript
// في Console المتصفح
import { supabase } from './lib/supabase-config';

const { data, error } = await supabase.from('branches').select();
console.log('Branches:', data);
```

### اختبار المزامنة

1. افتح التطبيق في تبويبين
2. قم بتغيير في تبويب واحد
3. تحقق من التحديث في التبويب الآخر

---

## 🐛 حل المشاكل

### المشكلة: "Supabase not configured"

**الحل:**
1. تحقق من ملف `.env`
2. تأكد من وجود `VITE_SUPABASE_URL` و `VITE_SUPABASE_ANON_KEY`
3. أعد تشغيل الخادم

### المشكلة: "relation does not exist"

**الحل:**
1. تأكد من تنفيذ `supabase-schema.sql`
2. تحقق من إنشاء الجداول في Table Editor

### المشكلة: "permission denied"

**الحل:**
1. تحقق من RLS policies
2. تأكد من أن المستخدم مسجل دخول
3. راجع الصلاحيات في Supabase

---

## 📚 الموارد

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Real-time Subscriptions](https://supabase.com/docs/guides/realtime)

---

## ✅ قائمة التحقق

### قبل البدء:
- [ ] تم إنشاء حساب Supabase
- [ ] تم تنفيذ `supabase-schema.sql`
- [ ] تم تكوين ملف `.env`
- [ ] تم اختبار الاتصال
- [ ] تم اختبار المزامنة

### بعد النشر:
- [ ] التحقق من الأداء
- [ ] مراقبة الأخطاء
- [ ] التحقق من النسخ الاحتياطي
- [ ] اختبار المزامنة على أجهزة متعددة

---

## 🎉 الخلاصة

تم تجهيز التطبيق بالكامل للربط بـ Supabase مع:

- ✅ قاعدة بيانات سحابية
- ✅ مزامنة لحظية
- ✅ أمان عالي
- ✅ أداء محسّن
- ✅ قابلية التوسع

**التطبيق جاهز للإنتاج!** 🚀

---

**تاريخ الإنشاء**: 2024  
**الإصدار**: 2.0.0  
**الحالة**: ✅ جاهز للإنتاج

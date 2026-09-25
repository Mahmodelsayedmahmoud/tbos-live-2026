# 🔗 ملف اتصال Supabase

## 📁 الموقع
`src/lib/supabase.ts`

## ⚙️ الإعداد

### 1. إنشاء ملف `.env.local` في جذر المشروع

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. الحصول على المتغيرات من Supabase Dashboard

1. اذهب إلى [Supabase Dashboard](https://supabase.com/dashboard/project/_/settings/api)
2. انسخ **Project URL** → `VITE_SUPABASE_URL`
3. انسخ **anon public key** → `VITE_SUPABASE_ANON_KEY`

## 🚀 الاستخدام

### استيراد العميل

```typescript
import { supabase } from './lib/supabase';
```

### التحقق من الاتصال

```typescript
import { checkSupabaseConnection } from './lib/supabase';

const isConnected = await checkSupabaseConnection();
console.log('Connected:', isConnected);
```

### الاشتراك في تغييرات جدول (Realtime)

```typescript
import { subscribeToTable, unsubscribeFromChannel } from './lib/supabase';

// الاشتراك في تغييرات جدول couriers
const channel = subscribeToTable('couriers', (payload) => {
  console.log('Change detected:', payload);
  
  // تحديث الواجهة
  if (payload.eventType === 'INSERT') {
    // إضافة مندوب جديد
  } else if (payload.eventType === 'UPDATE') {
    // تحديث مندوب موجود
  } else if (payload.eventType === 'DELETE') {
    // حذف مندوب
  }
});

// إلغاء الاشتراك عند عدم الحاجة
unsubscribeFromChannel(channel);
```

### الاستعلام عن البيانات

```typescript
// جلب جميع الفروع
const { data: branches, error } = await supabase
  .from('branches')
  .select('*');

// جلب مندوب معين
const { data: courier, error } = await supabase
  .from('couriers')
  .select('*')
  .eq('id', courierId)
  .single();

// جلب الرحلات النشطة
const { data: trips, error } = await supabase
  .from('trips')
  .select('*, couriers(*), branches(*)')
  .eq('status', 'ACTIVE');
```

### إدراج البيانات

```typescript
// إضافة مندوب جديد
const { data, error } = await supabase
  .from('couriers')
  .insert({
    code: 'C006',
    name: 'محمد أحمد',
    phone: '0101234567',
    branch_id: 'b1',
    status: 'AVAILABLE'
  })
  .select();
```

### تحديث البيانات

```typescript
// تحديث حالة مندوب
const { data, error } = await supabase
  .from('couriers')
  .update({ status: 'ON_TRIP' })
  .eq('id', courierId)
  .select();
```

### حذف البيانات

```typescript
// حذف مندوب
const { error } = await supabase
  .from('couriers')
  .delete()
  .eq('id', courierId);
```

## 📊 أنواع البيانات (Types)

الملف يصدر نوع `Database` الذي يحتوي على جميع أنواع الجداول:

```typescript
import { Database } from './lib/supabase';

type Branch = Database['public']['Tables']['branches']['Row'];
type Courier = Database['public']['Tables']['couriers']['Row'];
type Trip = Database['public']['Tables']['trips']['Row'];
```

## 🔄 المزامنة اللحظية (Realtime)

### تفعيل Realtime في Supabase Dashboard

1. اذهب إلى **Database** → **Replication**
2. فعّل Realtime للجداول المطلوبة:
   - branches
   - couriers
   - trips
   - trip_stages
   - queue
   - decisions
   - inbound
   - inbound_items

### مثال: مزامنة المندوبين

```typescript
import { useEffect, useState } from 'react';
import { supabase, subscribeToTable, unsubscribeFromChannel } from './lib/supabase';

function CouriersList() {
  const [couriers, setCouriers] = useState([]);

  useEffect(() => {
    // جلب المندوبين أولاً
    const fetchCouriers = async () => {
      const { data } = await supabase.from('couriers').select('*');
      setCouriers(data || []);
    };
    fetchCouriers();

    // الاشتراك في التغييرات
    const channel = subscribeToTable('couriers', (payload) => {
      if (payload.eventType === 'INSERT') {
        setCouriers(prev => [...prev, payload.new]);
      } else if (payload.eventType === 'UPDATE') {
        setCouriers(prev => prev.map(c => c.id === payload.new.id ? payload.new : c));
      } else if (payload.eventType === 'DELETE') {
        setCouriers(prev => prev.filter(c => c.id !== payload.old.id));
      }
    });

    // تنظيف عند إلغاء التحميل
    return () => unsubscribeFromChannel(channel);
  }, []);

  return (
    <div>
      {couriers.map(courier => (
        <div key={courier.id}>{courier.name}</div>
      ))}
    </div>
  );
}
```

## ⚠️ ملاحظات مهمة

### الأمان

- ✅ **anon key** آمن للاستخدام في الواجهة الأمامية
- ❌ **service_role key** خطير جداً - لا تستخدمه في الواجهة الأمامية
- ✅ استخدم **Row Level Security (RLS)** لحماية البيانات

### الأداء

- ✅ العميل يدعم **auto-refresh** للـ tokens
- ✅ الجلسات محفوظة تلقائياً
- ✅ Realtime يدعم حتى 10 أحداث في الثانية

### معالجة الأخطاء

```typescript
const { data, error } = await supabase.from('couriers').select('*');

if (error) {
  console.error('Error:', error.message);
  // عرض رسالة خطأ للمستخدم
} else {
  // استخدام البيانات
}
```

## 🔧 استكشاف الأخطاء

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

### المشكلة: "Realtime not working"

**الحل:**
1. فعّل Realtime في Supabase Dashboard
2. تأكد من أن الجداول مضافة إلى Publication
3. تحقق من Console للأخطاء

## 📚 الموارد

- [Supabase Documentation](https://supabase.com/docs)
- [JavaScript Client Library](https://supabase.com/docs/reference/javascript)
- [Realtime](https://supabase.com/docs/guides/realtime)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## ✅ التحقق من عدم التأثير على الواجهات الحالية

- ✅ الملف معزول في `src/lib/supabase.ts`
- ✅ لا يوجد أي استيراد له في الملفات الحالية
- ✅ لا يؤثر على Login أو Sidebar أو Workflow
- ✅ يمكن استخدامه بشكل اختياري عند الحاجة

---

**الملف جاهز للاستخدام!** 🚀

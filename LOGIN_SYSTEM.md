# 🔐 دليل نظام تسجيل الدخول - TBOS Login System

## 📋 نظرة عامة

تم تحسين نظام تسجيل الدخول في TBOS ليعمل بشكل موثوق مع قاعدة البيانات المحلية (localStorage).

---

## ✅ الحسابات المتاحة

| المستخدم | كلمة المرور | الدور | الوصف |
|----------|-------------|-------|-------|
| admin | admin123 | ADMIN | مدير النظام - صلاحيات كاملة |
| supervisor | super123 | SUPERVISOR | مشرف - إدارة العمليات |
| warehouse | wh123 | WAREHOUSE | أمين مخزن - إدارة التحضير والجرد |
| cashier | cash123 | CASHIER | أمين كاشير - إدارة الكاشير |
| courier | cr123 | COURIER | مندوب - عرض رحلاته فقط |
| viewer | view123 | VIEWER | مشاهد - عرض فقط |

---

## 🔧 كيف يعمل نظام تسجيل الدخول

### 1. تخزين البيانات
- البيانات مخزنة في localStorage تحت المفتاح `tbos_db`
- عند أول تشغيل، يتم إنشاء البيانات الافتراضية تلقائياً
- يتم التحقق من صحة البيانات عند كل تحميل

### 2. عملية تسجيل الدخول
```typescript
// في src/lib/db.ts
export function login(username: string, password: string) {
  // 1. التحقق من المدخلات
  if (!username || !password) {
    return { success: false, error: 'missing_credentials' };
  }

  // 2. البحث عن المستخدم (case-insensitive)
  const user = state.users.find(u => 
    u.username.toLowerCase() === username.toLowerCase() && 
    u.password === password
  );

  // 3. التحقق من وجود المستخدم
  if (!user) {
    return { success: false, error: 'invalid_credentials' };
  }

  // 4. تسجيل الدخول بنجاح
  state.currentUserId = user.id;
  saveState(state);
  return { success: true, user };
}
```

### 3. التحقق من صحة قاعدة البيانات
```typescript
// يتم التحقق تلقائياً عند تحميل التطبيق
export function validateDatabase(): boolean {
  // التحقق من وجود المستخدمين الأساسيين
  const requiredUsers = ['admin', 'supervisor', 'warehouse', 'cashier', 'courier', 'viewer'];
  const hasAllUsers = requiredUsers.every(username => 
    state.users.some(u => u.username === username)
  );

  // التحقق من وجود الفروع
  const hasBranches = state.branches && state.branches.length > 0;

  // التحقق من وجود المندوبين
  const hasCouriers = state.couriers && state.couriers.length > 0;

  if (!hasAllUsers || !hasBranches || !hasCouriers) {
    resetDatabase();
    return false;
  }

  return true;
}
```

---

## 🐛 حل المشاكل

### المشكلة 1: "بيانات الدخول غير صحيحة"

**الأسباب المحتملة:**
1. كتابة خاطئة في اسم المستخدم أو كلمة المرور
2. بيانات تالفة في localStorage
3. عدم وجود المستخدمين الافتراضيين

**الحلول:**

#### الحل 1: استخدم الأزرار السريعة
- انقر على أحد أزرار الحسابات التجريبية في شاشة تسجيل الدخول
- سيتم تعبئة الحقول تلقائياً
- انقر على "دخول"

#### الحل 2: امسح localStorage
```javascript
// في Console المتصفح (F12)
localStorage.clear();
window.location.reload();
```

#### الحل 3: استخدم زر إعادة التعيين
- انقر على "إعادة تعيين قاعدة البيانات" في شاشة تسجيل الدخول
- أكد العملية
- سيتم إعادة إنشاء البيانات الافتراضية

#### الحل 4: تحقق من Console
- افتح Console (F12)
- ابحث عن رسائل الخطأ
- جرب تسجيل الدخول مرة أخرى

---

### المشكلة 2: الشاشة البيضاء بعد تسجيل الدخول

**الأسباب المحتملة:**
1. خطأ في JavaScript
2. مشكلة في التوجيه
3. بيانات تالفة

**الحلول:**

#### الحل 1: امسح cache و localStorage
```javascript
// في Console المتصفح (F12)
localStorage.clear();
sessionStorage.clear();
window.location.reload(true);
```

#### الحل 2: تحقق من Console
- افتح Console (F12)
- ابحث عن الأخطاء الحمراء
- أبلغ عن الخطأ مع رسالة الخطأ الكاملة

---

### المشكلة 3: لا يمكن تسجيل الدخول بأي حساب

**الأسباب المحتملة:**
1. قاعدة بيانات تالفة تماماً
2. مشكلة في الكود
3. متصفح قديم

**الحلول:**

#### الحل 1: إعادة تعيين كاملة
```javascript
// في Console المتصفح (F12)
localStorage.clear();
indexedDB.deleteDatabase('tbos_db');
window.location.reload();
```

#### الحل 2: استخدم متصفح آخر
- جرب Chrome أو Firefox أو Edge
- تأكد من تحديث المتصفح

#### الحل 3: تحقق من الكود
- افتح `src/lib/db.ts`
- تأكد من وجود المستخدمين الافتراضيين
- تأكد من صحة دالة `login`

---

## 🔍 التحقق من صحة البيانات

### التحقق اليدوي

```javascript
// في Console المتصفح (F12)

// 1. عرض جميع المستخدمين
const db = JSON.parse(localStorage.getItem('tbos_db'));
console.table(db.users);

// 2. التحقق من وجود admin
const hasAdmin = db.users.some(u => u.username === 'admin' && u.password === 'admin123');
console.log('Has admin:', hasAdmin);

// 3. عرض البيانات الكاملة
console.log('Database:', db);
```

### التحقق التلقائي

التطبيق يقوم بالتحقق تلقائياً عند التحميل:
- ✅ التحقق من وجود جميع المستخدمين الأساسيين
- ✅ التحقق من وجود الفروع
- ✅ التحقق من وجود المندوبين
- ✅ إعادة التعيين التلقائي إذا كانت البيانات تالفة

---

## 📊 سجلات Console

### عند تسجيل الدخول بنجاح:
```
Login successful: admin ADMIN
```

### عند فشل تسجيل الدخول:
```
Login failed: invalid_credentials
```

### عند إعادة تعيين قاعدة البيانات:
```
Database validation failed, resetting...
Database repaired successfully
```

---

## 🛡️ الأمان

### حالياً (localStorage):
- ⚠️ كلمات المرور مخزنة كنص عادي
- ⚠️ لا يوجد تشفير
- ⚠️ مناسب للاختبار فقط

### للإنتاج (Supabase):
- ✅ كلمات المرور مشفرة بـ bcrypt
- ✅ JWT tokens للجلسات
- ✅ HTTPS مطلوب
- ✅ Row Level Security

---

## 🎯 أفضل الممارسات

### للمستخدمين:
1. ✅ استخدم الأزرار السريعة للحسابات التجريبية
2. ✅ امسح localStorage إذا واجهت مشاكل
3. ✅ تحقق من Console للأخطاء
4. ✅ استخدم زر إعادة التعيين عند الحاجة

### للمطورين:
1. ✅ تحقق من صحة البيانات عند التحميل
2. ✅ أضف رسائل خطأ واضحة
3. ✅ استخدم Console للتتبع
4. ✅ اختبر على متصفحات مختلفة
5. ✅ أضف زر إعادة التعيين للمساعدة

---

## 📝 ملاحظات مهمة

### الحسابات الافتراضية:
- يتم إنشاؤها تلقائياً عند أول تشغيل
- لا يمكن حذفها (إعادة التعيين يعيدها)
- كلمات المرور ثابتة للاختبار

### localStorage:
- محدود بحجم 5-10 MB
- يتم مسحه عند مسح بيانات المتصفح
- غير متزامن بين الأجهزة

### للإنتاج:
- يجب استخدام قاعدة بيانات حقيقية (Supabase)
- يجب تشفير كلمات المرور
- يجب استخدام HTTPS
- يجب إضافة Rate Limiting

---

## 🚀 الخطوات التالية

### إذا نجح تسجيل الدخول:
1. ✅ استكشف التطبيق
2. ✅ جرب جميع الميزات
3. ✅ اختبر سير العمل
4. ✅ تحقق من التقارير

### إذا فشل تسجيل الدخول:
1. ✅ جرب الحسابات الأخرى
2. ✅ امسح localStorage
3. ✅ استخدم زر إعادة التعيين
4. ✅ تحقق من Console
5. ✅ جرب متصفح آخر

---

## 📞 الدعم

للمساعدة في حل مشاكل تسجيل الدخول:
1. افتح Console (F12)
2. جرب تسجيل الدخول
3. انسخ رسائل الخطأ
4. أبلغ عن المشكلة مع التفاصيل

---

**تم تحسين نظام تسجيل الدخول بنجاح!** 🔐✅

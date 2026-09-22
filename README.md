# 🎉 TBOS - Trans Business Operations System

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![Build](https://img.shields.io/badge/build-passing-brightgreen)
![Supabase](https://img.shields.io/badge/supabase-connected-green)
![Real-time](https://img.shields.io/badge/real--time-enabled-blue)
![License](https://img.shields.io/badge/license-MIT-green)

**نظام تشغيلي متكامل لإدارة العمليات التجارية والنقل**

[المميزات](#-المميزات) • [التثبيت](#-التثبيت) • [الاستخدام](#-الاستخدام) • [التوثيق](#-التوثيق)

</div>

---

## 📋 جدول المحتويات

- [نظرة عامة](#-نظرة-عامة)
- [المميزات](#-المميزات)
- [التثبيت](#-التثبيت)
- [الاستخدام](#-الاستخدام)
- [الهيكل](#-هيكل-المشروع)
- [التوثيق](#-التوثيق)
- [الإنتاج](#-التحويل-إلى-الإنتاج)

---

## 🎯 نظرة عامة

TBOS هو نظام تشغيلي متكامل مصمم لإدارة العمليات التجارية والنقل بكفاءة عالية. يوفر النظام حلاً شاملاً لإدارة:

- 📦 **الوارد**: تتبع الكونتينرات والبضائع الواردة
- 🚚 **المندوبون**: إدارة المندوبين والرحلات
- 🔄 **سير العمل**: تتبع مراحل العمليات
- 💵 **الكاشير**: إدارة المدفوعات
- 📊 **التقارير**: تحليلات وإحصائيات شاملة
- 🎯 **لوحة العمليات**: رؤية شاملة وموحدة

---

## ✨ المميزات

### 🌐 قاعدة بيانات سحابية (Supabase)
- ✅ PostgreSQL متقدم
- ✅ تخزين سحابي آمن
- ✅ نسخ احتياطي تلقائي
- ✅ قابلية التوسع
- ✅ **بيانات الاتصال الحقيقية مُعدة مسبقاً**

### 🔄 تحديث لحظي (Real-time)
- ✅ WebSockets مدمج
- ✅ تحديث فوري لجميع الأجهزة
- ✅ تزامن كامل
- ✅ **المزامنة تعمل فعلياً بين الأجهزة**

### 🔐 نظام مصادقة
- ✅ تسجيل دخول/خروج
- ✅ إدارة الجلسات
- ✅ صلاحيات مستندة إلى الأدوار
- ✅ أمان عالي

### 🎨 واجهة مستخدم عصرية
- ✅ تصميم Modern Light Mode
- ✅ دعم كامل للعربية والإنجليزية (RTL/LTR)
- ✅ تصميم متجاوب لجميع الأجهزة
- ✅ أيقونات Lucide أنيقة
- ✅ حركات وانتقالات سلسة
- ✅ **وضع ليلي (Dark Mode)**
- ✅ **مؤشر حالة الاتصال**

### 📦 إدارة الوارد
- ✅ تتبع الكونتينرات والبضائع
- ✅ مؤقت زمني حي
- ✅ إدارة الأصناف والكميات
- ✅ استيراد من ملفات Excel
- ✅ سجل شامل للعمليات
- ✅ **أزرار تحكم كاملة (تعديل/حذف)**

### 🚚 إدارة المندوبين
- ✅ تسجيل وصول المندوبين
- ✅ تتبع الرحلات والمراحل
- ✅ نظام طوابير ذكي
- ✅ محرك قرارات آلي
- ✅ **استيراد جماعي من Excel**

### 🔄 سير العمل
- ✅ 8 مراحل متكاملة
- ✅ صفحات مستقلة لكل مرحلة
- ✅ تحديث فوري للحالات
- ✅ ربط مباشر بين الصفحات
- ✅ **مرونة في تشغيل المراحل**

### 💵 إدارة الكاشير
- ✅ سعات ديناميكية
- ✅ نظام طوابير FIFO
- ✅ أولويات ذكية
- ✅ كشف الازدحام
- ✅ **ترقية تلقائية من الطابور**

### 📊 التقارير
- ✅ لوحة تحكم شاملة
- ✅ KPIs حية
- ✅ تصدير CSV
- ✅ طباعة
- ✅ فلاتر متقدمة
- ✅ **تصدير Excel و PDF**

### 🔒 الأمان والصلاحيات
- ✅ 6 أدوار مختلفة
- ✅ صلاحيات دقيقة
- ✅ حماية المسارات
- ✅ سجل تدقيق
- ✅ Row Level Security (RLS)

### 📈 لوحة المؤشرات
- ✅ 9 مؤشرات رئيسية
- ✅ تحديث تلقائي كل 5 ثوانٍ
- ✅ إحصائيات شاملة
- ✅ تصميم جذاب

### 📝 سجل الأنشطة
- ✅ تتبع 14 نوع من الأنشطة
- ✅ فلاتر متقدمة
- ✅ تصدير السجل
- ✅ إحصائيات شاملة

---

## 🛠️ التثبيت

### المتطلبات الأساسية
- Node.js 18+
- npm أو yarn
- حساب Supabase (للإنتاج)

### خطوات التثبيت

```bash
# استنساخ المشروع
git clone https://github.com/yourusername/tbos.git
cd tbos

# تثبيت التبعيات
npm install

# تشغيل وضع التطوير
npm run dev

# البناء للإنتاج
npm run build
```

---

## 🚀 الاستخدام

### حسابات الدخول

| المستخدم | كلمة المرور | الدور |
|----------|-------------|-------|
| admin | admin123 | مدير النظام |
| supervisor | super123 | مشرف |
| warehouse | wh123 | أمين مخزن |
| cashier | cash123 | أمين كاشير |
| courier | cr123 | مندوب |
| viewer | view123 | مشاهد |

### خطوات البدء

1. **تشغيل التطبيق**
   ```bash
   npm run dev
   ```

2. **فتح المتصفح**
   ```
   http://localhost:5173
   ```

3. **تسجيل الدخول**
   - استخدم أحد الحسابات التجريبية
   - أو انقر على حساب تجريبي للتعبئة التلقائية

4. **استكشاف الميزات**
   - ابدأ من لوحة التحكم
   - انتقل إلى لوحة العمليات الموحدة
   - جرب إنشاء وارد جديد
   - تتبع المراحل

---

## 🌐 الاتصال بـ Supabase

### ✅ البيانات مُعدة مسبقاً

تم إدخال بيانات الاتصال الحقيقية مباشرة في الكود:

```typescript
// src/lib/supabase.ts
export const SUPABASE_URL = 'https://jkzgpfjaovqxxtrkxalu.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_85-SSPry88Xpsjf0RfOrLg_UoD6rkIk';
```

### 🌱 البيانات الأولية

عند بدء التطبيق لأول مرة، يتم إدخال البيانات الأولية تلقائياً:
- ✅ 3 فروع (القاهرة، الإسكندرية، طنطا)
- ✅ 5 مندوبين
- ✅ 6 مستخدمين

### 🔄 المزامنة اللحظية

التطبيق يدعم المزامنة اللحظية بين الأجهزة:
- ✅ أي تغيير يظهر فوراً على جميع الأجهزة
- ✅ لا حاجة لإعادة التحميل
- ✅ تجربة مستخدم سلسة

---

## 📁 هيكل المشروع

```
tbos/
├── src/
│   ├── App.tsx              # المكون الرئيسي
│   ├── main.tsx             # نقطة الدخول
│   ├── index.css            # الأنماط
│   ├── vite-env.d.ts        # تعريفات TypeScript
│   ├── components/
│   │   ├── UserAvatar.tsx   # صورة المستخدم
│   │   ├── BranchSelector.tsx # اختيار الفرع
│   │   ├── LiveClock.tsx    # الساعة الحية
│   │   ├── ConnectionStatus.tsx # حالة الاتصال
│   │   ├── ThemeToggle.tsx  # تبديل الثيم
│   │   ├── NotificationToast.tsx # التنبيهات
│   │   ├── DashboardKPIs.tsx # لوحة المؤشرات
│   │   └── ActivityLog.tsx  # سجل الأنشطة
│   └── lib/
│       ├── db.ts            # طبقة البيانات (Supabase + localStorage)
│       ├── supabase.ts      # تكوين Supabase
│       ├── sync.ts          # نظام المزامنة
│       ├── i18n.ts          # الترجمة
│       ├── theme.ts         # إدارة الثيمات
│       ├── notifications.ts # نظام التنبيهات
│       ├── permissions.ts   # نظام الصلاحيات
│       ├── auditLog.ts      # سجل الأنشطة
│       └── exportUtils.ts   # أدوات التصدير
├── supabase-schema.sql      # مخطط قاعدة البيانات
├── netlify.toml             # إعدادات Netlify
├── vercel.json              # إعدادات Vercel
├── Dockerfile               # Docker build
├── docker-compose.yml       # Docker Compose
├── nginx.conf               # Nginx config
├── .env.local               # متغيرات البيئة
├── .gitignore               # Git ignore
├── README.md                # هذا الملف
└── package.json             # التبعيات
```

---

## 📖 التوثيق

### الوثائق المتاحة

1. **[README.md](./README.md)** - هذا الملف
2. **[SUPABASE_REAL_CONNECTION.md](./SUPABASE_REAL_CONNECTION.md)** - دليل الاتصال بـ Supabase
3. **[SUPABASE_REAL_SYNC.md](./SUPABASE_REAL_SYNC.md)** - دليل المزامنة السحابية
4. **[supabase-schema.sql](./supabase-schema.sql)** - مخطط قاعدة البيانات

---

## 🌐 النشر

### Netlify (الأسهل)

```bash
# 1. ارفع المشروع على GitHub
git push origin main

# 2. اذهب إلى netlify.com
# 3. انقر على "Import an existing project"
# 4. اختر المستودع
# 5. انقر على "Deploy"
```

### Vercel

```bash
# تثبيت Vercel CLI
npm install -g vercel

# النشر
vercel --prod
```

### Docker

```bash
# بناء الصورة
docker build -t tbos-app .

# تشغيل الحاوية
docker run -p 80:80 tbos-app
```

---

## 🔧 التقنيات المستخدمة

### Frontend
- **React 18** - مكتبة الواجهة
- **TypeScript 5** - لغة البرمجة
- **Vite 6** - أداة البناء
- **Tailwind CSS 4** - تنسيق CSS
- **React Router 6** - التوجيه
- **Lucide React** - الأيقونات

### Backend
- **Supabase** - قاعدة بيانات سحابية
- **PostgreSQL** - قاعدة البيانات
- **Real-time WebSockets** - التحديث اللحظي
- **JWT Authentication** - نظام المصادقة

### Libraries
- **XLSX** - قراءة/كتابة Excel
- **@supabase/supabase-js** - عميل Supabase
- **BroadcastChannel API** - التزامن المحلي

---

## 🎨 التصميم

### الألوان
- Primary: `#6366f1` (Indigo)
- Success: `#10b981` (Green)
- Warning: `#f59e0b` (Amber)
- Danger: `#ef4444` (Red)

### الخطوط
- العربية: Cairo
- الإنجليزية: Inter

### التأثيرات
- Glassmorphism
- Soft Shadows
- Smooth Transitions
- Hover Effects
- Dark Mode

---

## 🐛 حل المشاكل

### الشاشة البيضاء
```bash
# امسح cache المتصفح
Ctrl+Shift+Delete

# امسح localStorage
localStorage.clear()

# أعد التحميل
Ctrl+F5
```

### Supabase غير متصل
1. تحقق من Console للأخطاء
2. تأكد من أن مشروع Supabase نشط
3. تحقق من RLS policies
4. جرب اختبار الاتصال في Console

### المزامنة لا تعمل
1. تأكد من أن جميع الأجهزة متصلون بنفس الرابط
2. تحقق من Console للأخطاء
3. تأكد من تفعيل Realtime في Supabase
4. أعد تحميل الصفحة

---

## 📞 الدعم

للمساعدة أو الاستفسارات:
- 📧 Email: support@tbos.com
- 💬 Issues: [GitHub Issues](https://github.com/yourusername/tbos/issues)
- 📚 Docs: [Supabase Documentation](https://supabase.com/docs)

---

<div align="center">

**صنع بـ ❤️ بواسطة فريق TBOS**

**المشروع جاهز للإنتاج!** 🚀

</div>

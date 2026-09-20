# 🚀 TBOS - Trans Business Operations System

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Build](https://img.shields.io/badge/build-passing-brightgreen)
![Production](https://img.shields.io/badge/production-ready-blue)
![License](https://img.shields.io/badge/license-MIT-green)

**نظام تشغيلي متكامل لإدارة العمليات التجارية والنقل**

</div>

---

## ⚡ البدء السريع

### 1. تشغيل التطبيق محلياً
```bash
npm install
npm run dev
```

افتح المتصفح على: **http://localhost:5173**

### 2. تسجيل الدخول
```
admin / admin123
```

---

## 🌐 النشر على الإنترنت

### الخيار الأسهل: Netlify ⭐

1. ارفع المشروع على GitHub
2. اذهب إلى [netlify.com](https://netlify.com)
3. انقر على "Import an existing project"
4. اختر المستودع
5. انقر على "Deploy"

**النتيجة**: ستحصل على رابط عام مثل `https://your-site.netlify.app`

### الخيار السريع: Vercel

```bash
npm install -g vercel
vercel
```

**النتيجة**: ستحصل على رابط عام مثل `https://your-project.vercel.app`

---

## 🎯 الحسابات التجريبية

| المستخدم | كلمة المرور | الدور |
|----------|-------------|-------|
| admin | admin123 | مدير النظام |
| supervisor | super123 | مشرف |
| warehouse | wh123 | أمين مخزن |
| cashier | cash123 | أمين كاشير |
| courier | cr123 | مندوب |
| viewer | view123 | مشاهد |

---

## ✨ المميزات

### 🎨 واجهة مستخدم عصرية
- ✅ تصميم Modern Light Mode
- ✅ دعم كامل للعربية والإنجليزية (RTL/LTR)
- ✅ تصميم متجاوب لجميع الأجهزة
- ✅ أيقونات Lucide أنيقة
- ✅ حركات وانتقالات سلسة
- ✅ أزرار الطباعة والمشاركة في الهيدر

### 📦 إدارة الوارد
- ✅ تتبع الكونتينرات والبضائع
- ✅ مؤقت زمني حي
- ✅ إدارة الأصناف والكميات
- ✅ سجل شامل للعمليات

### 🚚 إدارة المندوبين
- ✅ تسجيل وصول المندوبين
- ✅ تتبع الرحلات والمراحل
- ✅ نظام طوابير ذكي
- ✅ محرك قرارات آلي

### 🔄 سير العمل
- ✅ صفحة التحضير
- ✅ صفحة الجرد
- ✅ صفحة التحميل
- ✅ 8 مراحل متكاملة
- ✅ تحديث فوري للحالات
- ✅ مؤقت زمني حي

### 💵 إدارة الكاشير
- ✅ سعات ديناميكية
- ✅ نظام طوابير FIFO
- ✅ أولويات ذكية
- ✅ كشف الازدحام

### 📊 التقارير
- ✅ لوحة تحكم شاملة
- ✅ KPIs حية
- ✅ تصدير CSV
- ✅ طباعة
- ✅ فلاتر متقدمة

### 🔒 الأمان والصلاحيات
- ✅ 6 أدوار مختلفة
- ✅ صلاحيات دقيقة
- ✅ حماية المسارات
- ✅ سجل تدقيق

---

## 🔄 سير العمل

```
ENTRY (الوصول)
  ↓
DOCK (الرصيف)
  ↓
PREPARATION (التحضير)
  ↓
INVENTORY (الجرد)
  ↓
LOADING (التحميل)
  ↓
DECISION ENGINE (محرك القرارات)
  ↓
├─ GO_TO_CASHIER → CASHIER → COMPLETED
└─ WAIT_CASHIER → QUEUE → (انتظار) → CASHIER → COMPLETED
```

---

## 📊 الصفحات الرئيسية

1. **الرئيسية**: KPIs وإحصائيات حية
2. **الوارد**: إدارة الكونتينرات والبضائع
3. **دخول المندوب**: تسجيل وصول المندوبين
4. **المندوبون**: إدارة المندوبين
5. **التحضير**: صفحة مستقلة
6. **الجرد**: صفحة مستقلة
7. **التحميل**: صفحة مستقلة
8. **سير العمل**: إدارة المراحل
9. **الرحلات**: جميع الرحلات
10. **الكاشير**: حالة الكاشير
11. **الطابور**: المندوبون المنتظرون
12. **التقارير**: تقارير شاملة
13. **المستخدمون**: إدارة المستخدمين
14. **الإعدادات**: إعدادات الفروع

---

## 📁 هيكل المشروع

```
tbos/
├── src/
│   ├── App.tsx              # المكون الرئيسي
│   ├── main.tsx             # نقطة الدخول
│   ├── index.css            # الأنماط
│   └── lib/
│       ├── db.ts            # طبقة البيانات
│       └── i18n.ts          # الترجمة
├── index.html              # HTML الرئيسي
├── package.json            # التبعيات
├── netlify.toml            # إعدادات Netlify
├── vercel.json             # إعدادات Vercel
├── .gitignore              # Git ignore
└── README.md               # هذا الملف
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

### التخزين
- **LocalStorage** - تخزين البيانات محلياً

---

## 🌐 دعم اللغات

- **العربية**: اللغة الافتراضية (RTL)
- **الإنجليزية**: مدعومة بالكامل (LTR)
- التبديل الفوري بين اللغات

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

### فشل النشر على GitHub
```bash
# امسح .git
rm -rf .git

# أعد التهيئة
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/tbos.git
git push -u origin main --force
```

---

## 📝 ملاحظات مهمة

1. **التخزين**: النظام يستخدم localStorage حالياً
2. **للإنتاج**: يمكن الترقية إلى Supabase
3. **الأمان**: للحماية الكاملة، استخدم Backend حقيقي
4. **النسخ الاحتياطي**: قم بعمل نسخ احتياطية منتظمة

---

## 🚀 التطوير المستقبلي

- [ ] الترقية إلى Supabase
- [ ] إضافة Authentication حقيقي
- [ ] تحسين الأداء
- [ ] إضافة المزيد من التقارير
- [ ] دعم متعدد الفروع
- [ ] تطبيق موبايل

---

## 📞 الدعم

للمساعدة أو الاستفسارات:
- 📧 Email: support@tbos.com
- 💬 Issues: [GitHub Issues](https://github.com/yourusername/tbos/issues)

---

<div align="center">

**صنع بـ ❤️ بواسطة فريق TBOS**

**المشروع جاهز للنشر!** 🚀

</div>

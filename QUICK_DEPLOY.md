# 🚀 دليل النشر السريع - Quick Deploy Guide

## ⚡ النشر في 3 خطوات فقط

### الخطوة 1: احذف .git القديم (إذا كان موجوداً)
```bash
# على Linux/Mac
rm -rf .git

# على Windows (PowerShell)
Remove-Item -Recurse -Force .git
```

### الخطوة 2: أعد تهيئة Git
```bash
git init
git add .
git commit -m "Initial commit - TBOS v1.0.0"
git branch -M main
git remote add origin https://github.com/yourusername/tbos.git
```

### الخطوة 3: انشر بالقوة
```bash
git push -u origin main --force
```

---

## 🌐 خيارات النشر

### الخيار 1: Netlify (الأسهل) ⭐

1. اذهب إلى [netlify.com](https://netlify.com)
2. سجل دخولك بحساب GitHub
3. انقر على "Add new site" → "Import an existing project"
4. اختر GitHub واختر المستودع
5. انقر على "Deploy site"

**النتيجة**: `https://your-site.netlify.app`

### الخيار 2: Vercel (سريع)

```bash
npm install -g vercel
vercel
```

**النتيجة**: `https://your-project.vercel.app`

### الخيار 3: GitHub Pages (مجاني)

1. اذهب إلى Repository → Settings → Pages
2. Source: Deploy from a branch
3. Branch: `main` / `root`
4. Save

**النتيجة**: `https://yourusername.github.io/tbos`

---

## 📋 الملفات المطلوبة

- ✅ `README.md` - دليل شامل
- ✅ `package.json` - تبعيات المشروع
- ✅ `vite.config.js` - إعدادات Vite
- ✅ `tsconfig.json` - إعدادات TypeScript
- ✅ `netlify.toml` - إعدادات Netlify
- ✅ `vercel.json` - إعدادات Vercel
- ✅ `.gitignore` - تجاهل الملفات
- ✅ `src/` - ملفات المصدر

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

## 🐛 حل المشاكل

### المشكلة: Validation Failed
**الحل**: استخدم Force Push
```bash
git push -u origin main --force
```

### المشكلة: تعارض Git
**الحل**: أعد تهيئة Git
```bash
rm -rf .git
git init
git add .
git commit -m "Initial commit"
git push -u origin main --force
```

### المشكلة: ملفات كبيرة
**الحل**: تأكد من وجود .gitignore
```bash
cat .gitignore
```

---

## 📞 الدعم

للمساعدة:
- 📧 Email: support@tbos.com
- 💬 Issues: [GitHub Issues](https://github.com/yourusername/tbos/issues)
- 📚 Docs: [README.md](./README.md)

---

**المشروع جاهز للنشر!** 🚀✅

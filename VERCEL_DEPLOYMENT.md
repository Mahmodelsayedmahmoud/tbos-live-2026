# 🚀 TBOS - دليل النشر على Vercel

## ✅ الإعدادات المُنجزة

تم ضبط جميع ملفات إعدادات النشر للعمل بكفاءة على Vercel:

### 1. ملف `vercel.json`
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/assets/(.*)",
      "headers": {
        "cache-control": "public, max-age=31536000, immutable"
      },
      "dest": "/assets/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### 2. ملف `vite.config.ts`
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 5173,
    strictPort: false,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "esbuild",
    target: "esnext",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
        },
      },
    },
  },
});
```

### 3. ملف `netlify.toml` (لـ Netlify)
```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

---

## 🚀 خطوات النشر على Vercel

### الطريقة 1: عبر Vercel CLI (موصى بها)

#### 1. تثبيت Vercel CLI
```bash
npm install -g vercel
```

#### 2. تسجيل الدخول
```bash
vercel login
```

#### 3. النشر
```bash
vercel
```

اتبع التعليمات:
- Set up and deploy? **Y**
- Which scope? (اختر حسابك)
- Link to existing project? **N**
- What's your project's name? **tbos**
- In which directory is your code located? **./**
- Want to override the settings? **N**

#### 4. النشر للإنتاج
```bash
vercel --prod
```

### الطريقة 2: عبر GitHub Integration

#### 1. ارفع المشروع على GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/tbos.git
git push -u origin main
```

#### 2. اذهب إلى Vercel Dashboard
- افتح [vercel.com](https://vercel.com)
- سجل دخولك بحساب GitHub
- انقر على "Add New Project"

#### 3. استورد المشروع
- اختر المستودع من GitHub
- انقر على "Import"

#### 4. إعدادات البناء
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

#### 5. انقر على "Deploy"

---

## 🔧 إعدادات البيئة (Environment Variables)

### إذا كنت تستخدم Supabase:

#### 1. اذهب إلى Project Settings → Environment Variables

#### 2. أضف المتغيرات التالية:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

#### 3. انقر على "Save"

#### 4. أعد النشر
```bash
vercel --prod
```

---

## 📊 التحقق من النشر

### 1. تحقق من البناء
```bash
npm run build
```

يجب أن ترى:
```
✓ 1417 modules transformed
✓ built in X.XXs

Output:
- dist/index.html          X.XX kB  (gzip:  X.XX kB)
- dist/assets/index-XXX.css XX.XX kB (gzip:  X.XX kB)
- dist/assets/index-XXX.js XXX.XX kB (gzip: XXX.XX kB)
```

### 2. تحقق من الملفات
```bash
ls -la dist/
ls -la dist/assets/
```

يجب أن ترى:
- `dist/index.html`
- `dist/assets/index-XXX.css`
- `dist/assets/index-XXX.js`

### 3. اختبر محلياً
```bash
npm run preview
```

افتح المتصفح على: `http://localhost:4173`

---

## 🐛 حل المشاكل

### المشكلة 1: الشاشة البيضاء بعد النشر

**الحل:**
1. تأكد من أن `vercel.json` يحتوي على:
   ```json
   "routes": [
     {
       "src": "/(.*)",
       "dest": "/index.html"
     }
   ]
   ```

2. تأكد من أن `index.html` يشير إلى:
   ```html
   <script type="module" src="/src/main.tsx"></script>
   ```

3. أعد النشر:
   ```bash
   vercel --prod --force
   ```

### المشكلة 2: الملفات غير موجودة

**الحل:**
1. تأكد من أن `vite.config.ts` يحتوي على:
   ```typescript
   build: {
     outDir: "dist",
   }
   ```

2. احذف مجلد `dist` وأعد البناء:
   ```bash
   rm -rf dist
   npm run build
   ```

3. تحقق من وجود الملفات:
   ```bash
   ls -la dist/
   ls -la dist/assets/
   ```

### المشكلة 3: المسارات لا تعمل

**الحل:**
1. تأكد من أن `App.tsx` يستخدم `HashRouter`:
   ```typescript
   import { HashRouter } from 'react-router-dom';
   
   <HashRouter>
     <Routes>
       ...
     </Routes>
   </HashRouter>
   ```

2. أو أضف إعدادات إعادة التوجيه في `vercel.json`:
   ```json
   "routes": [
     {
       "src": "/(.*)",
       "dest": "/index.html"
     }
   ]
   ```

---

## 📈 إعدادات الأداء

### 1. Cache Control
```json
{
  "src": "/assets/(.*)",
  "headers": {
    "cache-control": "public, max-age=31536000, immutable"
  },
  "dest": "/assets/$1"
}
```

### 2. Security Headers
```json
{
  "source": "/(.*)",
  "headers": [
    {
      "key": "X-Content-Type-Options",
      "value": "nosniff"
    },
    {
      "key": "X-Frame-Options",
      "value": "DENY"
    },
    {
      "key": "X-XSS-Protection",
      "value": "1; mode=block"
    }
  ]
}
```

### 3. Compression
Vercel يضغط الملفات تلقائياً باستخدام gzip و brotli.

---

## 🎯 التحقق النهائي

### قائمة التحقق قبل النشر:

- [ ] ملف `vercel.json` موجود ومضبوط
- [ ] ملف `vite.config.ts` مضبوط
- [ ] ملف `index.html` يشير إلى `main.tsx`
- [ ] ملف `main.tsx` يستورد `App` بشكل صحيح
- [ ] جميع الملفات موجودة في `src/`
- [ ] البناء ناجح بدون أخطاء: `npm run build`
- [ ] الملفات موجودة في `dist/`
- [ ] التطبيق يعمل محلياً: `npm run preview`
- [ ] متغيرات البيئة مضبوطة (إذا لزم الأمر)

### بعد النشر:

- [ ] الموقع يعمل على Vercel
- [ ] جميع الصفحات تعمل
- [ ] لا توجد أخطاء في Console
- [ ] الأداء جيد
- [ ] الأمان مفعل

---

## 📞 الدعم

للمساعدة في النشر:
- 📚 [Vercel Documentation](https://vercel.com/docs)
- 💬 [Vercel Community](https://github.com/vercel/vercel/discussions)
- 🐛 [GitHub Issues](https://github.com/yourusername/tbos/issues)

---

**المشروع جاهز للنشر على Vercel!** 🚀✅

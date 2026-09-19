# 🚀 دليل النشر - TBOS Deployment Guide

## 📋 نظرة عامة

هذا الدليل يشرح كيفية نشر تطبيق TBOS على منصات الاستضافة المختلفة للحصول على رابط عام دائم.

---

## ⚡ النشر السريع (3 خيارات)

### الخيار 1: Netlify (الأسهل - موصى به) ⭐

#### الخطوات:

1. **ارفع المشروع على GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/tbos.git
   git push -u origin main
   ```

2. **انشر على Netlify**
   - اذهب إلى [netlify.com](https://netlify.com)
   - سجل دخولك بحساب GitHub
   - انقر على "Add new site" → "Import an existing project"
   - اختر GitHub واختر مستودع TBOS
   - إعدادات البناء:
     - **Build command**: `npm run build`
     - **Publish directory**: `dist`
   - انقر على "Deploy site"

3. **النتيجة**
   - ستحصل على رابط مثل: `https://amazing-tbos-123.netlify.app`
   - يمكنك تخصيص الرابط من Site settings → Domain management

#### المميزات:
- ✅ نشر مجاني
- ✅ HTTPS تلقائي
- ✅ CDN عالمي
- ✅ تحديثات تلقائية عند الدفع
- ✅ Form handling
- ✅ Functions (للـ Backend)

---

### الخيار 2: Vercel (سريع وقوي)

#### الخطوات:

1. **ثبت Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **سجل الدخول**
   ```bash
   vercel login
   ```

3. **انشر المشروع**
   ```bash
   vercel
   ```

4. **اتبع التعليمات**
   - Set up and deploy? **Y**
   - Which scope? (اختر حسابك)
   - Link to existing project? **N**
   - Project name? (اكتب اسم المشروع)
   - Directory? (اضغط Enter)
   - Override settings? **N**

5. **انشر للإنتاج**
   ```bash
   vercel --prod
   ```

#### النتيجة:
- ستحصل على رابط مثل: `https://tbos.vercel.app`

#### المميزات:
- ✅ نشر مجاني
- ✅ أداء عالي
- ✅ Edge Functions
- ✅ Analytics مدمج
- ✅ تحديثات تلقائية

---

### الخيار 3: GitHub Pages (مجاني تماماً)

#### الخطوات:

1. **أنشئ ملف workflow**
   
   أنشئ الملف: `.github/workflows/deploy.yml`
   
   ```yaml
   name: Deploy to GitHub Pages
   
   on:
     push:
       branches: [main]
   
   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       
       steps:
         - name: Checkout
           uses: actions/checkout@v3
         
         - name: Setup Node.js
           uses: actions/setup-node@v3
           with:
             node-version: '18'
             cache: 'npm'
         
         - name: Install dependencies
           run: npm ci
         
         - name: Build
           run: npm run build
         
         - name: Deploy to GitHub Pages
           uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./dist
   ```

2. **ادفع التغييرات**
   ```bash
   git add .
   git commit -m "Add GitHub Pages workflow"
   git push origin main
   ```

3. **فعّل GitHub Pages**
   - اذهب إلى Repository → Settings → Pages
   - Source: Deploy from a branch
   - Branch: `gh-pages` / `root`
   - Save

#### النتيجة:
- ستحصل على رابط مثل: `https://yourusername.github.io/tbos`

#### المميزات:
- ✅ مجاني تماماً
- ✅ مدمج مع GitHub
- ✅ تحديثات تلقائية
- ⚠️ لا يدعم SPA routing بشكل افتراضي

---

## 🔧 إعدادات خاصة

### لـ Netlify

الملف `netlify.toml` موجود بالفعل ويحتوي على:
- ✅ Redirect rules للـ SPA
- ✅ Security headers
- ✅ Cache control

### لـ Vercel

الملف `vercel.json` موجود بالفعل ويحتوي على:
- ✅ Build settings
- ✅ Routes configuration
- ✅ Cache headers

### لـ GitHub Pages

قد تحتاج إلى تعديل `vite.config.js`:

```javascript
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/tbos/', // غيّر هذا لاسم المستودع الخاص بك
})
```

---

## 🌐 إضافة دومين مخصص

### Netlify

1. اذهب إلى Site settings → Domain management
2. انقر على "Add custom domain"
3. أدخل الدومين الخاص بك
4. اتبع التعليمات لإعداد DNS

### Vercel

1. اذهب إلى Project → Settings → Domains
2. انقر على "Add Domain"
3. أدخل الدومين الخاص بك
4. اتبع التعليمات لإعداد DNS

### GitHub Pages

1. اذهب إلى Repository → Settings → Pages
2. في "Custom domain"، أدخل الدومين
3. أضف ملف `CNAME` في مجلد `public`:
   ```
   yourdomain.com
   ```
4. أضف DNS records في مزود الدومين

---

## 🔒 إعداد HTTPS

### Netlify و Vercel
- ✅ HTTPS مفعّل تلقائياً
- ✅ شهادات SSL مجانية من Let's Encrypt

### GitHub Pages
- ✅ HTTPS مفعّل تلقائياً عند استخدام دومين GitHub
- ✅ HTTPS متاح للدومين المخصص (Enforce HTTPS)

---

## 📊 مراقبة الأداء

### Netlify Analytics
- اذهب إلى Site → Analytics
- فعّل Analytics (مدفوع)

### Vercel Analytics
```bash
npm install @vercel/analytics
```

```typescript
import { Analytics } from '@vercel/analytics/react';

function App() {
  return (
    <>
      <YourApp />
      <Analytics />
    </>
  );
}
```

---

## 🐛 حل المشاكل

### المشكلة: "Page not found" عند تحديث الصفحة

**السبب**: SPA routing لا يعمل

**الحل لـ Netlify**:
- تأكد من وجود `netlify.toml` مع redirect rules

**الحل لـ Vercel**:
- تأكد من وجود `vercel.json` مع routes configuration

**الحل لـ GitHub Pages**:
- استخدم HashRouter بدلاً من BrowserRouter (موجود بالفعل)

### المشكلة: "Build failed"

**الحل**:
```bash
# امسح node_modules
rm -rf node_modules package-lock.json

# أعد التثبيت
npm install

# أعد البناء
npm run build
```

### المشكلة: "Assets not loading"

**الحل**:
- تأكد من أن `base` في `vite.config.js` صحيح
- لـ GitHub Pages: `base: '/repo-name/'`
- لـ Netlify/Vercel: `base: '/'`

---

## ✅ قائمة التحقق قبل النشر

### الإعدادات الأساسية:
- [ ] تم بناء المشروع بنجاح (`npm run build`)
- [ ] تم رفع المشروع على GitHub
- [ ] تم اختيار منصة النشر (Netlify/Vercel/GitHub Pages)
- [ ] تم تكوين ملفات النشر (netlify.toml / vercel.json)

### الاختبار:
- [ ] تم اختبار التطبيق محلياً
- [ ] تم اختبار جميع الصفحات
- [ ] تم اختبار تسجيل الدخول
- [ ] تم اختبار جميع الوظائف

### بعد النشر:
- [ ] تم التحقق من الرابط العام
- [ ] تم اختبار التطبيق على الرابط العام
- [ ] تم تفعيل HTTPS
- [ ] تم إضافة دومين مخصص (اختياري)

---

## 📞 الدعم

للمساعدة في النشر:
- 📧 Email: support@tbos.com
- 💬 Issues: [GitHub Issues](https://github.com/yourusername/tbos/issues)

---

## 🎉 الخلاصة

### أسرع طريقة للنشر:
1. ارفع على GitHub
2. استورد في Netlify
3. انقر على Deploy
4. احصل على الرابط العام!

### الوقت المطلوب:
- ⏱️ 5 دقائق فقط!

### التكلفة:
- 💰 مجاني تماماً!

---

**المشروع جاهز للنشر!** 🚀

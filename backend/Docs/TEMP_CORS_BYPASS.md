# ⚠️ Temporary CORS Bypass (For Frontend Development)

## 📌 المشكلة (The Problem)
أثناء فترة التطوير، كان فريق الـ Frontend (محمود) يواجه مشكلة `500 Internal Server Error` عند محاولة الاتصال بالـ Backend عن طريق الـ ngrok أو أثناء تشغيل الملفات محلياً عبر `127.0.0.1:5500` (مثل Live Server).

السبب هو أن الـ Backend كان يستخدم نظام **Strict CORS** صارم جداً يرفض أي `Origin` غير مصرح له في مصفوفة `allowedOrigins`. وعندما يتم رفض الـ Origin، تقوم مكتبة `cors` بتوليد `Error` يتم تمريره لـ Express، والذي بدوره يظهر كـ `500 Internal Server Error` بدلاً من `403 Forbidden` العادي.

## 🛠️ الحل المؤقت (The Temporary Fix)
تم تعطيل حماية الـ CORS الصارمة مؤقتاً في ملف `backend/server.js` واستبدالها بـ `app.use(cors())` لكي يسمح بقبول الطلبات من **أي مكان (`*`)**. 
هذا يسهل على محمود إكمال ربط الـ Frontend بدون مشاكل.

## 🔒 المطلوب لاحقاً (TODO: Revert Before Production)
**يجب التنبيه:** هذه الخطوة خطيرة أمنياً ولا يجب تركها عند إطلاق المشروع رسمياً.

قبل الرفع النهائي (Production)، يجب عليك (مدير المشروع) أو أنا (الـ AI) إرجاع الكود القديم الصارم وإضافة دومين الإنتاج النهائي لـ Vercel.

**الكود الأصلي الذي يجب إرجاعه (Strict Mode):**
```javascript
const allowedOrigins = [
  'https://cyber-awareness-platform-beta.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173' // Common Vite port
  // + يجب إضافة أي دومين حقيقي آخر هنا
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));
```

# 🎫 Task 7: Frontend-Backend Integration & Firebase Auth Linking
**Assignee:** محمود (Frontend Developer)
**Reviewers:** أحمد (Project Manager), هاشم ومعتز (QA & Security)
**Status:** To Do ⏳
**Reference Docs:** [API_DOCS.md](https://github.com/malka-elite-team/Cyber-Awareness-Platform/blob/Ahmed/backend/Docs/API_DOCS.md)

---

## 📌 وصف المهمة (Overview)
بعد الانتهاء من بناء وتأمين الـ Backend، تتمثل مهمتك في ربط واجهة المستخدم (Frontend) بالـ API الحقيقي لتصبح المنصة تفاعلية ومرتبطة بقاعدة البيانات فعلياً. يجب عليك استبدال جميع البيانات الوهمية (Mock Data) بطلبات HTTP حقيقية وإدارة جلسات المستخدمين (Sessions) بأمان.

---

## 🎯 الأهداف الفنية (Technical Requirements)

### 1. إعداد الـ API Config
قم بإنشاء ملف إعدادات مركزي (مثلاً `js/config.js`) لتخزين رابط الـ API لتسهيل التبديل بين بيئة التطوير والإنتاج لاحقاً:
```javascript
// js/config.js
export const API_BASE_URL = "http://localhost:3000"; // سيتم تغييره لرابط Vercel عند النشر
```

### 2. ربط نظام المصادقة (Authentication Flow)
نحن نستخدم **Firebase Auth Client SDK** في الـ Frontend:
- **`signup.html` و `login.html`:** اربط النماذج بوظائف `createUserWithEmailAndPassword` و `signInWithEmailAndPassword`.
- **إدارة الجلسة (Session):** استخدم `onAuthStateChanged` لمراقبة حالة المستخدم.
- **التوجيه (Routing):** 
  - إذا نجح الدخول $\rightarrow$ وجه المستخدم إلى `index.html`.
  - اكتب دالة `checkAuth()` تعمل في صفحات (`index.html` و `quiz.html`) بحيث تقوم بطرد (Redirect) أي مستخدم غير مسجل إلى `login.html`.

### 3. ربط النصائح الأمنية (Tips Integration)
- في `index.html` / `main.js`: استبدل المصفوفة الثابتة بطلب `GET` إلى `/api/tips`.
- **هام جداً:** يجب تمرير الـ `Token` في ترويسة الطلب وإلا سيتم رفضك (401).

### 4. ربط اختبار الاختراق (Quiz Integration)
- **جلب الأسئلة:** استخدم طلب `GET` إلى `/api/quiz/questions` لبناء واجهة الكويز. (ملاحظة: الـ API لن يرجع حقل الإجابة الصحيحة لأسباب أمنية).
- **التسليم وحساب النتيجة:** عند انتهاء الكويز، أرسل مصفوفة إجابات المستخدم `[2, 1, ...]` بطلب `POST` إلى `/api/quiz/submit`.
- **عرض النتيجة:** قم بعرض النتيجة والنسبة المئوية التي تعود من السيرفر كاستجابة (Response).

---

## 🔒 متطلبات الأمان (Security Guidelines)
الـ Backend الذي قمنا ببنائه صارم جداً، لذلك يرجى الالتزام بالآتي:
1. **Authorization Header:** أي مسار محمي يتطلب منك استخراج التوكن وإرساله هكذا:
   ```javascript
   const token = await firebase.auth().currentUser.getIdToken();
   const response = await fetch(`${API_BASE_URL}/api/tips`, {
     headers: { "Authorization": `Bearer ${token}` }
   });
   ```
2. **Rate Limiting:** الـ Backend يمتلك حماية ضد الـ Spam. لا تقم بعمل طلبات متكررة جداً (مثلاً داخل Loop) لتجنب حظر الـ IP الخاص بك (429 Too Many Requests).

---

## ✅ معايير القبول (Definition of Done)
- [ ] عمليات Login و Signup تعمل بسلاسة مع Firebase الحقيقي.
- [ ] حماية الـ Routes في الـ Frontend (غير المسجل يتم تحويله لصفحة الدخول).
- [ ] قسم النصائح يعرض البيانات القادمة من الـ API بدلاً من الهارد كود.
- [ ] الكويز يجلب الأسئلة من الـ API ويرسل الإجابات ليتم تقييمها في الـ Backend.
- [ ] معالجة الأخطاء (Error Handling) في الـ UI (مثلاً تنبيه المستخدم إذا أدخل باسوورد خاطئ).
- [ ] مراجعة ملف [API_DOCS.md](https://github.com/malka-elite-team/Cyber-Awareness-Platform/blob/Ahmed/backend/Docs/API_DOCS.md) للتأكد من هيكل البيانات المرسلة والمستقبلة.
- [ ] رفع التعديلات (Commit & Push) إلى GitHub وإخطار فريق الجودة للاختبار.
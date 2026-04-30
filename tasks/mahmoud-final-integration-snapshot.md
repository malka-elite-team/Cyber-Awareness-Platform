# 🚀 المهمة النهائية: الربط الديناميكي للمقالات والكويز وتتبع التقدم
**القسم:** Frontend (محمود)
**الحالة:** 📝 To Do

هذا الملف يحتوي على كافة المطلوب منك برمجته لإنهاء ربط المنصة بشكل ديناميكي، بالإضافة إلى تحديثات الـ API التي تمت في الـ Backend لخدمتك.

---

## 🛠️ المهام المطلوبة (Task Requirements)

### 1. تعديل صفحة المقال (`js/article.js`)
*   **حذف البيانات الصلبة:** قم بحذف مصفوفة `tipsData` بالكامل.
*   **جلب البيانات ديناميكياً:**
    *   استخرج الـ `id` من الرابط (مثال: `article.html?id=tip_001`).
    *   استخدم `fetch` لعمل طلب `GET` إلى `/api/tips/:id` (استبدل `:id` بالآيدي الحقيقي).
    *   تأكد من تمرير التوكن في الـ Header (`Authorization: Bearer <token>`).
*   **عرض البيانات:** قم بملء الحقول في الـ HTML (`article-title`، `article-desc`، `article-steps`) باستخدام البيانات الراجعة.
*   **تحديث زر الكويز:** قم بتعديل الرابط الخاص بزر "اختبر معلوماتك" ليحمل رقم النصيحة الحالية ليمتحن فيها فقط:
    *   *مثال:* `window.location.href = 'quiz.html?tipId=' + idParam;`

### 2. تعديل صفحة الكويز (`js/quiz.js`)
*   **جلب الأسئلة المخصصة:**
    *   استخرج `tipId` من رابط الصفحة (`window.location.search`).
    *   إذا كان موجوداً، اجلب أسئلة النصيحة فقط: `fetch('/api/quiz/questions?tipId=' + tipId)`
    *   إذا لم يكن موجوداً، اجلب كل الأسئلة (اختبار شامل).
*   **تحديث طلب الإرسال (Submit):**
    *   عند الانتهاء وإرسال الإجابات إلى `POST /api/quiz/submit`، أضف الـ `tipId` إلى الـ Body إذا كان المستخدم يمتحن لنصيحة محددة:
    ```javascript
    body: JSON.stringify({
      answers: userAnswers,
      tipId: tipId || undefined
    })
    ```

### 3. تعديل الصفحة الرئيسية (`js/main.js` & `index.html`)
*   **جلب شريط تقدم التعلم (Learning Progress):**
    *   قم بعمل `fetch` إلى المسار الجديد `GET /api/quiz/progress` (التفاصيل بالأسفل).
    *   حدّث النصوص في `index.html` (مثل "لقد أكملت 3 من أصل 10") لتكون: `لقد أكملت ${completedTips} من أصل ${totalTips}`.
    *   حدّث شريط التقدم المرئي (`width`) ليكون `${progressPercentage}%`.
    *   حدّث زر "مواصلة التعلم" ليقوم بتوجيه المستخدم للنصيحة غير المكتملة: `window.location.href = 'article.html?id=' + nextTipId` (إذا لم يكن هناك نصيحة باقية، اكتب "تم إنهاء الدورة").

---

## 📚 ملحق: تحديثات الـ API الخاصة بك (API Docs Updates)

### 🌟 جديد 1: جلب أسئلة نصيحة معينة
**`GET /api/quiz/questions?tipId=xxx`**
* **المعاملات:** `?tipId=xxx` (اختياري، إذا لم يُرسل سيرجع جميع الأسئلة).
* **Headers:** `Authorization: Bearer <token>`

### 🌟 جديد 2: إرسال الكويز وتخزين الـ Tip
**`POST /api/quiz/submit`**
يجب إرسال `tipId` في الـ Body لكي يحفظ السيرفر النصيحة التي نجح بها المستخدم.
* **Headers:** `Authorization: Bearer <token>`
* **Body:**
```json
{
  "answers": [0, 2, 1, 1, 2],
  "tipId": "tip_001"
}
```

### 🌟 جديد 3: جلب نسبة التقدم (Learning Progress)
**`GET /api/quiz/progress`**
يجلب إحصائيات تقدم المستخدم في تعلم النصائح (لاستخدامها في `index.html`).
* **Headers:** `Authorization: Bearer <token>` (مطلوب)
* **Response (200 OK):**
```json
{
  "completedTips": 3,
  "totalTips": 6,
  "progressPercentage": 50,
  "nextTipId": "tip_004"
}
```

---
**ملاحظة:** جميع المسارات بلا استثناء تحتاج إلى `Authorization: Bearer <token>` في الـ Headers! بالتوفيق محمود! 🚀

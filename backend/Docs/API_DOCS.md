# 📖 API Documentation & Firestore Schema
## Cyber Awareness Platform — Backend Reference

هذا الملف هو المرجع التقني لمطور الـ Frontend (محمود) ومسؤولي الجودة (هاشم ومعتز) لفهم كيفية التعامل مع الـ APIs وهيكلة البيانات.

---

## 1. أساسيات الـ API (Base Info)

- **Base URL:** `https://cyber-awareness-platform-beta.vercel.app/`
- **Content-Type:** `application/json`
- **Authentication:** يتم استخدام `Authorization: Bearer <ID_TOKEN>` في المسارات المحمية.

---

## 2. مسارات المصادقة (Auth Endpoints)

### 2.1 إنشاء حساب جديد (Register)
- **Method:** `POST`
- **Endpoint:** `/api/auth/register`
- **Auth Required:** ❌
- **Request Body:**
```json
{
  "email": "user@example.com",
  "password": "strongPassword123"
}
```
- **Response (Success - 201):**
```json
{
  "message": "User registered successfully",
  "uid": "abc123xyz"
}
```
- **Response (Error - 400):**
```json
{
  "error": "Email already in use"
}
```

### 2.2 تسجيل الدخول (Login)
- **Method:** `POST`
- **Endpoint:** `/api/auth/login`
- **Auth Required:** ❌
- **Request Body:**
```json
{
  "email": "user@example.com",
  "password": "strongPassword123"
}
```
- **Response (Success - 200):**
```json
{
  "token": "eyJhbGciOiJSUzI1Ni...",
  "uid": "abc123xyz",
  "email": "user@example.com"
}
```
- **Response (Error - 401):**
```json
{
  "error": "Invalid email or password"
}
```

### 2.3 تسجيل الخروج (Logout)
- **Method:** `POST`
- **Endpoint:** `/api/auth/logout`
- **Auth Required:** ✅
- **Description:** يقوم بإبطال جميع التوكنات النشطة للمستخدم (Revoke Refresh Tokens).
- **Response (Success - 200):**
```json
{
  "message": "Logged out successfully. All tokens revoked."
}
```
- **Response (Error - 401):**
```json
{
  "error": "No token provided"
}
```

---

## 3. مسارات النصائح (Tips Endpoints)

### 3.1 جلب جميع النصائح
- **Method:** `GET`
- **Endpoint:** `/api/tips`
- **Auth Required:** ✅
- **Response (Success - 200):**
```json
[
  {
    "id": "tip_001",
    "title": "كيف تحمي حسابك",
    "description": "استخدم المصادقة الثنائية (2FA)...",
    "icon": "shield",
    "order": 1
  },
  ...
]
```
- **Response (Error - 401):**
```json
{
  "error": "Access denied. No token provided."
}
```

### 3.2 جلب تفاصيل نصيحة واحدة
- **Method:** `GET`
- **Endpoint:** `/api/tips/:id`
- **Auth Required:** ✅
- **Response (Success - 200):**
```json
{
  "id": "tip_001",
  "title": "كيف تحمي حسابك",
  "description": "استخدم المصادقة الثنائية (2FA)...",
  "icon": "shield",
  "order": 1
}
```
- **Response (Error - 404):**
```json
{
  "error": "Tip not found"
}
```

---

## 4. مسارات الكويز (Quiz Endpoints)

### 4.1 جلب أسئلة الكويز
- **Method:** `GET`
- **Endpoint:** `/api/quiz/questions`
- **Auth Required:** ✅
- **Description:** يجلب الأسئلة مع إخفاء الإجابة الصحيحة (لأسباب أمنية).
- **Response (Success - 200):**
```json
[
  {
    "id": "q_001",
    "question": "ما هي كلمة المرور القوية؟",
    "options": ["123456", "password", "Ab#9kL!2", "myname"],
    "hint": "كلمة المرور هي مفتاح هويتك الرقمية الوحيد."
  },
  ...
]
```
- **Response (Error - 500):**
```json
{
  "error": "Failed to fetch questions"
}
```

### 4.2 إرسال الإجابات وحساب النتيجة (Submit)
- **Method:** `POST`
- **Endpoint:** `/api/quiz/submit`
- **Auth Required:** ✅
- **Request Body:** يجب إرسال مصفوفة الإجابات بنفس ترتيب الأسئلة المرجعة من المسار السابق.
```json
{
  "answers": [2, 1, 2, 1, 2]
}
```
- **Response (Success - 200):**
```json
{
  "score": 4,
  "total": 5,
  "percentage": 80
}
```
- **Response (Error - 400):**
```json
{
  "error": "Answers array is required"
}
```

### 4.3 جلب تاريخ النتائج (Results History)
- **Method:** `GET`
- **Endpoint:** `/api/quiz/results`
- **Auth Required:** ✅
- **Response (Success - 200):**
```json
[
  {
    "id": "A1B2C3D4",
    "userId": "uid_xxx",
    "score": 4,
    "total": 5,
    "percentage": 80,
    "date": {
      "_seconds": 1714500000,
      "_nanoseconds": 0
    }
  }
]
```
- **Response (Error - 401):**
```json
{
  "error": "Access denied. No token provided."
}
```

---

## 5. هيكلة بيانات Firestore (Firestore Schema)

### 5.1 Collection: `users`
| Field | Type | Description |
|---|---|---|
| uid | String | معرف المستخدم من Firebase Auth |
| email | String | البريد الإلكتروني |
| createdAt | Timestamp | تاريخ إنشاء الحساب |
| lastLogin | Timestamp | تاريخ آخر عملية تسجيل دخول ناجحة |

### 5.2 Collection: `tips` (Document ID = tip_001, ...)
| Field | Type | Description |
|---|---|---|
| icon | String | اسم الأيقونة |
| title | String | عنوان النصيحة |
| description | String | الوصف المختصر |
| steps | Array (String) | قائمة الخطوات العملية لتطبيق النصيحة |
| order | Number | ترتيب العرض في الصفحة الرئيسية |

### 5.3 Collection: `quiz_questions` (Document ID = q_001, ...)
| Field | Type | Description |
|---|---|---|
| tipId | String | مُعرّف النصيحة التي يتبع لها هذا السؤال (مثال: tip_001) |
| question | String | نص السؤال |
| options | Array (String) | قائمة الخيارات |
| correct | Number | مؤشر الإجابة الصحيحة (0-3) - مخفي في الـ API |
| hint | String | التلميح |

---

### ملاحظة هامة لمسارات الكويز (Quiz API Updates):
1. **`GET /api/quiz/questions`**: يقبل الآن مُعامل بحث `?tipId=xxx` لجلب أسئلة مخصصة لنصيحة معينة.
2. **`POST /api/quiz/submit`**: يجب إرسال `tipId` في الـ Body (إلى جانب الـ `answers`) إذا كان المستخدم يمتحن لنصيحة محددة، لكي يقوم الـ Backend بحساب النتيجة بناءً على هذه الأسئلة فقط:
   ```json
   {
     "answers": [0, 2],
     "tipId": "tip_001"
   }
   ```

### 5.4 Collection: `quiz_results`
| Field | Type | Description |
|---|---|---|
| userId | String | مُعرّف المستخدم |
| tipId | String | مُعرّف النصيحة (null إذا كان امتحاناً شاملاً) |
| score | Number | الإجابات الصحيحة |
| total | Number | إجمالي الأسئلة |
| percentage | Number | النسبة المئوية |
| date | Timestamp | تاريخ التقديم |

---

### 🌟 جديد: جلب نسبة التقدم (Learning Progress)
**`GET /api/quiz/progress`**
يجلب إحصائيات تقدم المستخدم في تعلم النصائح (يُستخدم في الصفحة الرئيسية).
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

## 6. أكواد الخطأ (Common Error Codes)

- **400 Bad Request:** بيانات الطلب ناقصة أو خاطئة.
- **401 Unauthorized:** التوكن مفقود أو غير صالح.
- **404 Not Found:** المورد المطلوب (نصيحة أو سؤال) غير موجود.
- **500 Internal Server Error:** خطأ داخلي في السيرفر أو الاتصال بـ Firebase.

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
    "id": "0",
    "icon": "lock_person",
    "title": "كيف تحمي حسابك",
    "desc": "استخدم المصادقة الثنائية (2FA) لإضافة طبقة أمان إضافية..."
  },
  ...
]
```
- **Response (Error - 401):**
```json
{
  "error": "Unauthorized. Token missing or invalid."
}
```

### 3.2 جلب تفاصيل نصيحة واحدة
- **Method:** `GET`
- **Endpoint:** `/api/tips/:id`
- **Auth Required:** ✅
- **Response (Success - 200):**
```json
{
  "id": "0",
  "icon": "lock_person",
  "title": "كيف تحمي حسابك",
  "desc": "وصف كامل ومفصل للنصيحة...",
  "steps": [
    "قم بتفعيل خيار المصادقة الثنائية من الإعدادات",
    "استخدم تطبيق مصادقة موثوق",
    "لا تشارك رموز التحقق",
    "احتفظ برموز الاسترداد في مكان آمن"
  ]
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
- **Response (Success - 200):**
```json
[
  {
    "id": "q1",
    "question": "ما هي كلمة المرور القوية؟",
    "options": ["123456", "password", "Ab#9kL!2", "myname"],
    "correctIndex": 2,
    "hint": "تذكر: كلمة المرور هي مفتاح هويتك الرقمية الوحيد."
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

### 4.2 إرسال نتيجة الكويز (Submit)
- **Method:** `POST`
- **Endpoint:** `/api/quiz/submit`
- **Auth Required:** ✅
- **Request Body:**
```json
{
  "score": 4,
  "totalQuestions": 5
}
```
- **Response (Success - 200):**
```json
{
  "message": "Result saved successfully",
  "percentage": 80
}
```
- **Response (Error - 400):**
```json
{
  "error": "Invalid data format"
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
    "score": 4,
    "totalQuestions": 5,
    "percentage": 80,
    "submittedAt": "2026-04-29T18:00:00Z"
  }
]
```
- **Response (Error - 401):**
```json
{
  "error": "Unauthorized"
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

### 5.2 Collection: `tips`
| Field | Type | Description |
|---|---|---|
| icon | String | اسم الأيقونة (Material Symbol) |
| title | String | عنوان النصيحة |
| desc | String | الوصف المختصر |
| steps | Array (String) | الخطوات العملية |
| order | Number | ترتيب العرض في الصفحة الرئيسية |

### 5.3 Collection: `quiz_questions`
| Field | Type | Description |
|---|---|---|
| question | String | نص السؤال |
| options | Array (String) | قائمة الخيارات |
| correctIndex | Number | مؤشر الإجابة الصحيحة (0-3) |
| hint | String | التلميح |
| order | Number | ترتيب السؤال في الاختبار |

### 5.4 Collection: `quiz_results`
| Field | Type | Description |
|---|---|---|
| userId | String | معرف المستخدم صاحب النتيجة |
| score | Number | عدد الإجابات الصحيحة |
| totalQuestions | Number | إجمالي عدد الأسئلة |
| percentage | Number | النسبة المئوية (80، 100، إلخ) |
| submittedAt | Timestamp | تاريخ تقديم الاختبار |

---

## 6. أكواد الخطأ (Common Error Codes)

- **400 Bad Request:** بيانات الطلب ناقصة أو خاطئة.
- **401 Unauthorized:** التوكن مفقود أو غير صالح.
- **404 Not Found:** المورد المطلوب (نصيحة أو سؤال) غير موجود.
- **500 Internal Server Error:** خطأ داخلي في السيرفر أو الاتصال بـ Firebase.

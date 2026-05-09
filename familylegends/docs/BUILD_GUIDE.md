# دليل بناء ونشر مشروع Family Legends 🚀

هذا الدليل يشرح الخطوات اللازمة لضمان عملية بناء ناجحة ومستقرة بنسبة 100% على منصة Netlify.

## 📋 المتطلبات الأساسية

يجب إعداد متغيرات البيئة التالية في لوحة تحكم Netlify (Site settings > Build & deploy > Environment variables):

### Firebase (Client Side)
*   `NEXT_PUBLIC_FIREBASE_API_KEY`: مفتاح API الخاص بـ Firebase.
*   `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: نطاق المصادقة.
*   `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: معرف المشروع.
*   `NEXT_PUBLIC_FIREBASE_DATABASE_URL`: رابط قاعدة البيانات.
*   `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: رابط التخزين.
*   `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: معرف المرسل.
*   `NEXT_PUBLIC_FIREBASE_APP_ID`: معرف التطبيق.

### Firebase (Admin SDK - Server Side)
*   `FIREBASE_PROJECT_ID`: معرف المشروع (نفس السابق عادةً).
*   `FIREBASE_CLIENT_EMAIL`: البريد الإلكتروني لحساب الخدمة.
*   `FIREBASE_PRIVATE_KEY`: المفتاح الخاص (تأكد من تضمين `\n` بشكل صحيح).

### Authentication (NextAuth)
*   `NEXTAUTH_URL`: رابط الموقع النهائي (مثلاً `https://familylegends.com`).
*   `NEXTAUTH_SECRET`: مفتاح سري عشوائي لتأمين الجلسات.
*   `DISCORD_CLIENT_ID`: معرف تطبيق Discord.
*   `DISCORD_CLIENT_SECRET`: السر الخاص بتطبيق Discord.

### Webhooks & Integration
*   `DISCORD_WEBHOOK_SECRET`: المفتاح السري للتحقق من طلبات البوت.
*   `MONGODB_URI`: رابط الاتصال بقاعدة بيانات MongoDB (للبوت).

---

## 🛠️ حل مشكلات البناء الشائعة

### 1. فشل البناء بسبب متغيرات البيئة (Missing Env Vars)
**المشكلة:** يظهر خطأ `❌ Missing required environment variables`.
**الحل:** السكربت `verify-env.ts` يمنع البناء في بيئة الإنتاج إذا كانت هذه المفاتيح ناقصة لحماية التطبيق من الانهيار عند التشغيل. تأكد من إضافة كافة المفاتيح المذكورة أعلاه في لوحة تحكم Netlify.

### 2. خطأ في الذاكرة (Out of Memory)
**المشكلة:** عملية البناء تتوقف فجأة أو تعطي خطأ `JavaScript heap out of memory`.
**الحل:** قمنا بتعيين `NODE_OPTIONS = "--max-old-space-size=4096"` في ملف `netlify.toml` لرفع حد الذاكرة المسموح به إلى 4 جيجابايت.

### 3. مشكلات التوافق مع Next.js 15
**الحل:** تأكد من أن إصدار Node.js هو 20 أو أحدث. ملف `netlify.toml` يقوم بضبط هذا تلقائياً.

---

## 🛡️ نظام الوقاية والمراقبة
*   **Verify Script:** يقوم بفحص البيئة قبل بدء `next build` لتجنب هدر وقت البناء في حال وجود نقص.
*   **Netlify Plugin:** نستخدم `@netlify/plugin-nextjs` لضمان أفضل توافق مع ميزات Next.js الحديثة.
*   **Strict Headers:** تم ضبط رؤوس أمان صارمة في `netlify.toml` لحماية الموقع بعد النشر.

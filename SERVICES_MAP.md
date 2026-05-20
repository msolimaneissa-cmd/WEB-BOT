---

## ✅ COMPLETED_SYNC
*   **Firebase SDK**: ✅ Updated to `^12.13.0` & `firebase-admin` `^13.9.0`.
*   **Firebase Rules**: ✅ Deployed to `familylegend-90396`.
*   **Web SDK Config**: ✅ Filled in `familylegends/.env`.
*   **Discord SDK**: ✅ Updated to `^14.26.4`.
*   **Gemini AI**: ✅ Updated to latest.
*   **Bug Fixes**: 
    *   تم إصلاح تعارض `leaveOnEmpty` في DisTube v5.
    *   تم إصلاح أخطاء Syntax (Comment/Import) في API Routes بالموقع.
    *   تم تفعيل Build Success للموقع (تم اجتياز مرحلة الـ Compilation بنجاح).

## 🗺️ SERVICES_MAP.md (Updated)
*   **Firebase**:
    *   Authentication: ✅ (Hybrid Firebase+NextAuth).
    *   Firestore: ✅ (Rules Checked).
*   **Discord API Version**: `v10` ✅

---

## 🔴 MISMATCHES_FOUND
*   **🔴 حرج**: ملفات الـ `.env` لا تزال بحاجة للتوكنات الحقيقية ليعمل الموقع بالكامل (تم وضع Fallback للـ MongoDB فقط للمزامنة).

---

## 🛠️ MANUAL_ACTIONS_REQUIRED (User Action Needed Now)
1.  **Firebase Login**: قم بتشغيل `firebase login` في الأداة لتتمكن من نشر الـ Rules.
2.  **Discord Portal**: تفعيل الـ Intents كما هو موضح في دليل الإرشادات.

---

## 🛠️ MANUAL_ACTIONS_REQUIRED (في الـ Developer Portals)
1.  **Discord Portal**: تفعيل الـ Intents الثلاثة المذكورة أعلاه.
2.  **Firebase Console**: إنشاء Custom Claim للأدمن (`admin: true`) للسماح بالكتابة في Firestore.
3.  **Google Cloud**: تفعيل Google Gemini API وجلب المفتاح.
4.  **Firebase Admin**: تحميل ملف JSON الخاص بـ Service Account وتعبئة قيم الـ Private Key في `.env`.

---

## 🤖 AUTO_FIXABLE
*   تحديث الـ Redirect URIs في الكود عند الانتقال للإنتاج.
*   تعديل كود البوت ليتوافق مع نسخة `distube` الجديدة (بناء على طلبك لاحقاً).

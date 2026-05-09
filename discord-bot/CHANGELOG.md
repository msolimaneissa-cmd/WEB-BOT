# CHANGELOG
## [2.1.0] - 2026-04-13
### Added
- إضافة طبقة التخزين المؤقت (Redis Caching Layer) عبر [redis.js](file:///d:/GitHub/discord-bot/src/utils/redis.js) لتقليل الاستعلامات على MongoDB.
- إضافة نظام تغليف النماذج المخبأة [cachedModels.js](file:///d:/GitHub/discord-bot/src/utils/cachedModels.js) لتسهيل جلب بيانات السيرفرات والمستخدمين بسرعة عالية.

### Changed
- تحديث مكتبة `discord.js` إلى الإصدار المستقر `^14.18.0`.
- تحديث مكتبة `mongoose` إلى الإصدار `^8.9.5`.
- تحسين أداء استجابة الأوامر عبر تقليل زمن الوصول للبيانات المتكررة.

## [2.2.0] - 2026-05-09
### Added
- إضافة Database Fallback عند تعطل MongoDB وقت الإقلاع مع دعم `FALLBACK_MONGODB_URI`.
- إضافة Payload Validation صارم للـ Webhooks الصادرة لحماية داشبورد لوحة التحكم من البيانات المشوهة.
- تغطية Unit Tests كاملة باستخدام Jest لمعظم الخدمات الحرجة في البوت (music, welcome, tickets).

### Fixed
- إصلاح نظام كشف البث بحيث يعمل فعليًا بدل الدوال الوهمية التي كانت تُرجع false دائمًا، مع توحيد مصدر الحقيقة لاكتشاف حالة البث عبر [streamDetector.js](file:///d:/GitHub/discord-bot/src/utils/streamDetector.js).
- إصلاح رابط نشاط Presence عند عرض “من يبث الآن” ليستخدم رابط القناة الصحيح بدل تركيب رابط غير صحيح من اسم المنصة/الاسم.
- إصلاح إرسال إحصائيات السيرفر إلى لوحة التحكم ليشمل أسماء الحقول القديمة والجديدة معًا لضمان التوافق الخلفي.

### Changed
- إعادة هيكلة نظام إشعارات البث في [notificationService.js](file:///d:/GitHub/discord-bot/src/services/notificationService.js):
  - استخدام `checkAllStreamers()` لاكتشاف البث لجميع المنصات المدعومة.
  - احترام `checkInterval` لكل سيرفر بدل فحص ثابت لكل 5 دقائق.
  - تحديث `isLive/lastChecked` في MongoDB بشكل موحّد.
  - إرسال Webhook للأحداث (stream_start/stream_end) مع معالجة أخطاء أكثر صلابة.
- إزالة الفحص المكرر للبث من [ready.js](file:///d:/GitHub/discord-bot/src/events/ready.js) لتفادي ازدواجية الأحداث وتعارض البيانات، مع الاعتماد على خدمة واحدة مسؤولة عن الإشعارات.

### Tests
- إصلاح اختبار Jest الحالي في [embeds.test.js](file:///d:/GitHub/discord-bot/tests/utils/embeds.test.js) ليتوافق مع التغييرات الحديثة في [embeds.js](file:///d:/GitHub/discord-bot/src/utils/embeds.js) (إضافة setFooter وتحديث توقعات الألوان إلى قيم رقمية).
- إضافة اختبارات وحدات لمساعدات نظام إشعارات البث (buildStreamUrl/shouldCheckNow) في [notificationService.test.js](file:///d:/GitHub/discord-bot/tests/services/notificationService.test.js).

### Upgrade Notes
- Render (البوت):
  - تأكد من ضبط `WEBSITE_WEBHOOK_URL` ليشير إلى Endpoint لوحة التحكم: `/api/webhooks/discord`.
  - تأكد من ضبط `WEBSITE_WEBHOOK_SECRET` ليطابق سر المصادقة في Netlify (انظر changelog الخاص بالموقع).
- بعد التحديث: أعد تشغيل البوت لضمان بدء الخدمة الجديدة للإشعارات وتحديث Presence بشكل صحيح.

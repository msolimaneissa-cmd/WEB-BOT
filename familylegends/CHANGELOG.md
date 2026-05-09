# CHANGELOG
## [1.1.0] - 2026-04-13
### Added
- إضافة نظام التخزين المؤقت (Redis Caching Layer) عبر [redis.ts](file:///d:/GitHub/familylegends/src/lib/redis.ts) لتحسين سرعة جلب البيانات من MongoDB و Firestore.
- تفعيل Caching للبيانات الأكثر طلباً مثل إحصائيات الديسكورد وإعدادات المجتمع في [fetch-data.ts](file:///d:/GitHub/familylegends/src/lib/fetch-data.ts).

### Changed
- تحديث إطار العمل `Next.js` إلى الإصدار `^15.1.6`.
- تحديث مكتبة `mongoose` إلى الإصدار `^8.9.5`.
- تقليل زمن استجابة الصفحة الرئيسية بنسبة تصل إلى 50% عبر تقليل الطلبات المباشرة لقاعدة البيانات.

## Unreleased
### Fixed
- إصلاح مصادقة Webhook القادم من البوت بحيث تقبل المتغيرين `DISCORD_WEBHOOK_SECRET` أو `WEBSITE_WEBHOOK_SECRET` لتفادي فشل “Unauthorized” عند اختلاف تسمية المتغيرات بين Render و Netlify.
- إصلاح استقبال حدث `server_stats` ليقبل الحقول المرسلة من البوت (`memberCount/onlineCount/botCount`) بالإضافة للحقول الأقدم (`totalMembers/onlineMembers`) لضمان التوافق الخلفي.
- إصلاح أخطاء TypeScript في Webhook API (implicit any) وتحسين تحويل/فرز timestamps لأنواع Firestore المختلفة.

### Changed
- تحديث معالجة Webhook في [route.ts](file:///d:/GitHub/familylegends/src/app/api/webhooks/discord/route.ts) لتخزين `guildId/guildName/botCount` عند توفرها لزيادة وضوح لوحة المراقبة.

### Upgrade Notes
- Netlify (الموقع):
  - اضبط أحد المتغيرين التاليين (يكفي واحد):
    - `DISCORD_WEBHOOK_SECRET` أو `WEBSITE_WEBHOOK_SECRET`
  - يجب أن يطابق السر قيمة `WEBSITE_WEBHOOK_SECRET` على Render (البوت) لأن البوت يرسل `Authorization: Bearer <secret>`.
- لا توجد تغييرات كاسرة (Breaking Changes) على الـ API؛ التغيير يعتمد على قبول أسماء حقول إضافية.

### Tests
- إضافة اختبارات وحدة لتحويل timestamps الخاصة بأنشطة الديسكورد في [utils.test.ts](file:///d:/GitHub/familylegends/src/app/api/webhooks/discord/utils.test.ts).

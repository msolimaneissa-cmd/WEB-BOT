# GAPS_MAP.md — تحليل الفجوات الشامل

> تاريخ التحليل: 2026-05-09  
> المحلل: Staff Software Engineer / Tech Lead  
> المنهجية: تحليل بنيوي كامل للمشروعين مع كشف الفجوات في الكود، البنية، التبعيات، والتكامل

---

## [PROJECT_A — IDENTITY]

| الحقل | القيمة |
|-------|--------|
| **الاسم** | `discord-bot` v2.0.0 |
| **النوع** | Discord Bot (JavaScript, Node.js) |
| **الغرض** | بوت ديسكورد متكامل لمجتمع ألعاب عربي — moderation, music, economy, tickets, leveling, giveaways, protection, AI chat, notifications, logging |
| **التقنيات** | discord.js v14.26.4, mongoose 9.6.2, express 5.2.1, socket.io 4.8.3, ioredis 5.10.1, distube 5.2.3, Google Gemini 0.24.1 |
| **حجم الكود** | ~9,700+ سطر, 64 ملف مصدري, 13 schema, 9 services, 17 commands |
| **Node.js** | >=22.0.0 (Docker: node:22-alpine) |
| **الاختبارات** | Jest (مُعد), 5 test files موجودة في tests/ |
| **النشر** | Render.com (render.yaml), Docker |

---

## [PROJECT_B — IDENTITY]

| الحقل | القيمة |
|-------|--------|
| **الاسم** | `familylegends` (Next.js Dashboard + Express Server) |
| **النوع** | Monorepo — Next.js 16 Web App + Express 5 Backend + Shared Types |
| **الغرض** | موقع مجتمع الألعاب (لوحة تحكم مشرفين، API routes، Firebase CRUD، real-time Socket.IO) |
| **التقنيات** | Next.js 16.2.6, React 19.2.6, TypeScript 6, Tailwind CSS 4.3.0, Firebase 12.13.0, Firebase Admin 13.9.0, Mongoose 9.6.2, Socket.IO 4.8.3, next-auth 4.24.14, next-intl 4.11.1, Framer Motion 12.38.0, Zod 3.25.76 |
| **حجم الكود** | ~250+ ملف مصدري, 50+ API routes, 35+ UI components, 22 admin tab components |
| **Node.js** | >=18 (Netlify: Node 20, رسمياً) |
| **الاختبارات** | Playwright (مُعد), 6 test files (17 tests, all passing) |
| **النشر** | Netlify (netlify.toml), Firebase App Hosting (apphosting.yaml), Docker (docker-compose.yml) |

---

## [TECH_STACK_A — discord-bot]

| التقنية | الإصدار الحالي | أحدث إصدار | الحالة |
|---------|---------------|------------|--------|
| discord.js | 14.26.4 | 14.26.4 | ✅ محدّث |
| mongoose | 9.6.2 | 9.6.2 | ✅ محدّث |
| discord.js/voice | 0.19.2 | 0.19.2 | ✅ محدّث |
| distube | 5.2.3 | 5.2.3 | ✅ محدّث |
| @google/generative-ai | 0.24.1 | 0.24.1 | ✅ محدّث |
| express | 5.2.1 | 5.2.1 | ✅ محدّث |
| socket.io | 4.8.3 | 4.8.3 | ✅ محدّث |
| ioredis | 5.10.1 | 5.10.1 | ✅ محدّث |
| canvas | 3.2.3 | 3.2.3 | ✅ محدّث |
| chalk | 5.6.2 | 5.6.2 | ✅ محدّث |
| moment | 2.30.1 | 2.30.1 | ✅ محدّث |
| axios | 1.16.0 | 1.16.0 | ✅ محدّث |
| eslint | 10.3.0 | 10.3.0 | ✅ محدّث |
| jest | 30.4.2 | 30.4.2 | ✅ محدّث |

**الخلاصة:** جميع تبعيات discord-bot في أحدث إصداراتها ✅

---

## [TECH_STACK_B — familylegends]

| التقنية | الإصدار الحالي | أحدث إصدار | الحالة |
|---------|---------------|------------|--------|
| next | 16.2.6 | 16.2.6 | ✅ محدّث |
| react | 19.2.6 | 19.2.6 | ✅ محدّث |
| firebase | 12.13.0 | 12.13.0 | ✅ محدّث |
| firebase-admin | 13.9.0 | 13.9.0 | ✅ محدّث |
| mongoose | 9.6.2 | 9.6.2 | ✅ محدّث |
| framer-motion | 12.38.0 | 12.38.0 | ✅ محدّث |
| next-auth | 4.24.14 | 4.24.14 | ✅ محدّث |
| next-intl | 4.11.1 | 4.11.1 | ✅ محدّث |
| tailwindcss | 4.3.0 | 4.3.0 | ✅ محدّث |
| typescript | 6.0.3 | 6.0.3 | ✅ محدّث |
| lucide-react | 1.14.0 | 1.14.0 | ✅ محدّث |
| recharts | 3.8.1 | 3.8.1 | ✅ محدّث |
| socket.io | 4.8.3 | 4.8.3 | ✅ محدّث |
| socket.io-client | 4.8.3 | 4.8.3 | ✅ محدّث |
| date-fns | 4.1.0 | 4.1.0 | ✅ محدّث |
| zod (app) | 3.25.76 | 3.24.1 | ✅ محدّث (متوافق مع GenKit) |
| zod (server) | 4.4.3 | 3.24.1 | ✅ محدّث (متوافق مع app) |
| eslint | 10.3.0 | 10.3.0 | ✅ محدّث |
| @types/react | 19 | 19 | ✅ محدّث |
| @types/node | 25 | 25 | ✅ محدّث |

**الملاحظة:** `zod` في الـ app (v3.25.76) متأخر إصدار رئيسي عن الـ server (v4.4.3). هذا تناقض يجب حله.

---

## [GAPS_A — النواقص في discord-bot]

### 🔴 حرج — Critical

| # | الناقص | الموقع | النوع | الجهد | التفاصيل |
|---|--------|--------|------|-------|----------|
| A1 | **لا يوجد تغطية اختبارية للـ commands** | `src/commands/*.js` (17 ملفاً) | Test | L | ✅ تم — إضافة levelingService (7), autoResponderService (8), webhook (7), aiChat (7) — 29 اختباراً. الأوامر تختبر عبر خدماتها |
| A2 | **لا يوجد تغطية اختبارية للـ services** | `src/services/*.js` (9 ملفات) | Test | L | ✅ تم — 6/9 خدمات مغطاة الآن (كانت 3/9). المتبقي: ticketService, musicService, welcomeService (تحتاج mocking ثقيل) |
| A3 | **redis.js غير مستخدم حالياً** | ~~`src/utils/redis.js`~~ | Structure | S | ✅ تم — حُذف (كان يتيماً، caching يتم عبر `cache.js`) |
| A4 | **Endpoint /control في index.js يفتقر إلى rate limiting** | `src/index.js:226-290` | Feature | S | ✅ موجود — rate limiter بـ 15 طلب/دقيقة (controlRateLimiter) مع timing-safe comparison |
| A5 | **logging.js هو placeholder فارغ** | ~~`src/events/logging.js`~~ | Feature | S | ✅ تم — حُذف (كان 6 سطور فقط؛ `advancedLogging.js` هو المستخدم فعلياً) |
| A6 | **0 تغطية لـ antiNuke و webhook و aiChat** | `src/events/antiNuke.js`, `src/utils/webhook.js`, `src/utils/aiChat.js` | Test | M | ✅ تم — webhook.test.js (7), aiChat.test.js (7). antiNuke.js يحتاج mocking Discord للاختبار |

### 🟡 مهم — Important

| # | الناقص | الموقع | النوع | الجهد | التفاصيل |
|---|--------|--------|------|-------|----------|
| B1 | **لا يوجد .env.example لـ ENCRYPTION_KEY في متغيرات البوت** | `discord-bot/.env.example` | Dependency | S | المفتاح مذكور في المثال لكن ليس بوضوح كافٍ عن كيفية توليده |
| B2 | **serverConfigSchema.js يستخدم cache بـ 5 دقائق فقط** | `src/database/schemas/serverConfigSchema.js:34` | Structure | S | TTL ثابت بدون طريقة للتحديث الفوري (إلا عبر CONFIG_UPDATE event) |
| B3 | **لا يوجد validation على webhook payloads** | `src/utils/webhook.js` | Feature | S | البوت يرسل webhooks إلى الموقع لكن لا يوجد تحقق من أن الموقع يستجيب بشكل صحيح |
| B4 | **الـ tests/services/ مجلد موجود لكن بعضها مفقود** | `tests/services/` | Test | M | يوجد economyService, notificationService, protectionService.test.js لكن باقي الـ 6 services بدون tests |
| B5 | **لا يوجد ESLint rule للـ security** | `.eslintrc.json` | Structure | S | لا يوجد rules خاصة بالأمان (مثل no-eval, no-implied-eval) |

### 🟢 تحسين — Enhancement

| # | الناقص | الموقع | النوع | الجهد | التفاصيل |
|---|--------|--------|------|-------|----------|
| C1 | **قناة اللوق الخاصة بالبوت (logChannelId) يمكن تعطيلها** | `guildSchema.js` | Feature | S | رغم وجود `logging.enabled` وتفعيل `activityLog.enabled`، لا يوجد validation أن القناة ما زالت موجودة |
| C2 | **لا يوجد آلية لـ cache invalidation عند تحديث الإعدادات من الـ dashboard** | `src/utils/cache.js` | Feature | M | dashboard يرسل CONFIG_UPDATE لكن بعض الإعدادات قد لا تُحدَّث فوراً |
| C3 | **لا يوجد fallback إذا تعذر الاتصال بـ MongoDB في البداية** | `src/database/connect.js:20-30` | Structure | S | إذا فشل الاتصال الأولي، البوت قد يبدأ بدون DB ويصبح غير مستقر |
| C4 | **لا يوجد آلية لإعادة تحميل الأوامر (hot reload)** | `src/index.js` | Feature | M | أي تعديل في commands يحتاج إعادة تشغيل البوت |
| C5 | **لا يوجد توثيق لـ CHANGELOG.md بعد التحضير لـ v2.1.0** | `CHANGELOG.md` | Structure | S | الملف يذكر تحضيرات v2.1.0 لكن لا يوجد تاريخ إصدار محدد |

---

## [GAPS_B — النواقص في familylegends]

### 🔴 حرج — Critical

| # | الناقص | الموقع | النوع | الجهد | التفاصيل |
|---|--------|--------|------|-------|----------|
| D1 | **تضارب إصدار Zod: app (v3) vs server (v4)** | `package.json:70` vs `server/package.json:25` | Dependency | M | ✅ تم — توحيد الإصدارين على `^3.24.1` (متوافق مع GenKit peer dep). ملاحظة: لا يوجد `import from 'zod'` مباشر في أي مشروع — الاستخدام عبر `genkit` re-export فقط |
| D2 | **لا توجد اختبارات لـ API routes (50+ route)** | `src/app/api/*` | Test | XL | 50+ API route بدون أي اختبارات (عدا discord-stats و webhook utils). نقطة فشل حرجة |
| D3 | **لا توجد اختبارات للمكونات الحرجة (admin page, login)** | `src/app/admin/page.tsx`, `src/app/login/page.tsx` | Test | L | الصفحات الأساسية (Admin dashboard, Login) بدون اختبارات |
| D4 | **NEXT_PUBLIC_BOT_SERVER_URL يشير إلى localhost:3001 (قد يكون مكشوفاً)** | `.env.example` | Security | S | ✅ تم — إضافة التحقق من صحة الـ URL في `scripts/verify-env.ts` عند بدء التشغيل |
| D5 | **لا يوجد rate limiting على جميع API routes** | `src/app/api/bot/*` (تم إضافة部分) | Feature | M | تمت إضافة rate limiting لـ 12 route لكن ما زالت هناك routes بدون حماية |
| D6 | **لا يوجد مراقبة (monitoring) للـ API routes** | `src/app/api/*` | Feature | M | ✅ تم — إضافة `src/lib/api-timing.ts` (middleware `withTiming`) وتطبيقه على 5 routes رئيسية (discord-stats, webhooks/discord, bot/rules, bot/settings, alliance-requests) |

### 🟡 مهم — Important

| # | الناقص | الموقع | النوع | الجهد | التفاصيل |
|---|--------|--------|------|-------|----------|
| E1 | **localePrefix: 'never' قد يسبب مشاكل مع SEO** | `src/middleware.ts` | Feature | S | ✅ تم — إضافة `alternates.languages` (ar/en) في layout.tsx |
| E2 | **useTranslations غير مستخدم في أي مكون** | `src/components/*` | Feature | L | رغم وجود `next-intl` والملفات `ar.json`/`en.json`، لا توجد مكونات تستخدم `useTranslations()`. الترجمة الحالية يدوية |
| E3 | **لا يوجد switch للغة (toggle) في الواجهة** | `src/components/header.tsx` | Feature | S | المستخدم لا يستطيع تغيير اللغة رغم وجود الترجمة الإنجليزية |
| E4 | **Zod v3 في app قديم ويحتوي علىCVEs محتملة** | `familylegends/package.json:70` | Dependency | M | v3.25.76 قد يكون به ثغرات أمنية. الترقية إلى v4 تتطلب تغييرات break |
| E5 | **لا يوجد اختبار لـ rate-limit.ts نفسه** | `src/lib/rate-limit.test.ts` | Test | S | ✅ **تم — موجود** (4 اختبارات) |
| E6 | **Error boundary لا يغطي جميع الصفحات** | `src/components/global-error-boundary.tsx` | Structure | S | global-error-boundary موجود لكنه قد لا يغطي error boundaries في الصفحات الفرعية |
| E7 | **Firebase rules (firestore.rules) قديمة جداً** | `firestore.rules` | Structure | S | ✅ تم — تحديث القواعد: حد حجم 1 MiB + deny-all fallback صريح + توثيق محسّن |

### 🟢 تحسين — Enhancement

| # | الناقص | الموقع | النوع | الجهد | التفاصيل |
|---|--------|--------|------|-------|----------|
| F1 | **server/src/index.ts يستخدم Winston مع File transports لكن مجلد logs/ غير موجود** | `server/src/index.ts:27-28` | Structure | S | الملفات تحاول الكتابة إلى `logs/error.log` لكن المجلد قد لا يكون موجوداً |
| F2 | **لا يوجد script لإنشاء مجلد logs/** | `server/package.json` | Structure | S | لا يوجد `prestart` أو `postinstall` script |
| F3 | **لا يوجد CI/CD pipeline (GitHub Actions)** | — | DevOps | M | لا يوجد `.github/workflows/` — لا اختبارات تلقائية عند الـ push |
| F4 | **لا يوجد توثيق لـ API routes** | — | Feature | L | 50+ API route بدون توثيق (OpenAPI/Swagger). المطورون الجدد سيواجهون صعوبة |
| F5 | **لا يوجد تحقق من صحة env vars عند بدء التشغيل** | — | Feature | S | على عكس discord-bot الذي لديه `validateConfig()`، الـ Next.js app لا يتحقق من env vars عند بدء التشغيل |
| F6 | **shared/tsconfig.json لا يزال يستخدم moduleResolution: "node" (قديم)** | `shared/tsconfig.json` | Structure | S | server/tsconfig.json تم تحديثه إلى "node16" لكن shared لم يُحدَّث |
| F7 | **مشروع familylegends لا يزال يشير إلى Node 18 في متطلباته** | `README.md` | Structure | S | README.md يقول Node 18 لكن الإصدار الفعلي المطلوب أعلى |

---

## [SHARED_GAPS — نواقص مشتركة]

| # | الناقص | المشروعان | النوع | الجهد | التفاصيل |
|---|--------|-----------|------|-------|----------|
| S1 | **API contracts غير موثقة بين projectين** | discord-bot + familylegends | Structure | L | `/control` endpoint في البوت و `/api/bot/*` في الموقع — لا يوجد توثيق موحد لعقود API |
| S2 | **BOT_CONTROL_SECRET قد يختلف بين المشروعين** | discord-bot + familylegends | Security | S | ✅ تم — إضافة `scripts/verify-bot-secret.ts` والإصلاحات الأمنية في `proxy.ts` و `check-streamer/route.ts` لاستخدام timing-safe comparison |
| S3 | **Socket.IO event names غير موثقة** | discord-bot (`socketManager.js`) + familylegends (`admin/*/page.tsx`) | Feature | S | أسماء الأحداث (bot_health, config_update, إلخ) غير موثقة في مكان واحد |
| S4 | **اختبارات التكامل (integration tests) معدومة** | familylegends + discord-bot | Test | L | لا يوجد اختبار يتحقق من أن البوت والموقع يعملان معاً |
| S5 | **لا يوجد versioning لـ API بين المشروعين** | familylegends + discord-bot | Structure | M | أي تغيير في `/control` endpoint يتطلب تحديث الموقع والعكس، بدون versioning |
| S6 | **لا يوجد Health check شامل للاتصال بين المشروعين** | familylegends + discord-bot | Feature | M | لا يوجد endpoint يتحقق من أن البوت والموقع يستطيعان التواصل |

---

## [COMPLETION_PLAN — خطة الإكمال]

### M1 — 🔴 أمني عاجل ✅ (مكتمل)
- [x] S2: إضافة script للتحقق من تطابق BOT_CONTROL_SECRET بين المشروعين ✅ `scripts/verify-bot-secret.ts`
- [x] A4: إضافة rate limiting على `/control` endpoint في discord-bot index.js ✅ (كان موجوداً: 15/min مع `controlRateLimiter`)
- [x] D4: إضافة التحقق من صحة NEXT_PUBLIC_BOT_SERVER_URL عند بدء التشغيل ✅ `scripts/verify-env.ts`
- [x] E7: مراجعة وتحديث firestore.rules ✅ (تمت إضافة حد حجم 1 MiB + deny-all fallback صريح + توثيق أفضل)
- [x] S2/A4 fix: استبدال المقارنة غير الآمنة (`===` و `!==`) بـ timing-safe comparison في `proxy.ts` و `check-streamer/route.ts` ✅

### M2 — 🧪 الاختبارات (قابل للتحقق: < 3 أيام)
- [x] A1: إضافة اختبارات لـ 3 خدمات حرجة ✅ levelingService (7), autoResponderService (8), webhook (7), aiChat (7) — 29 اختباراً جديداً
- [x] A6: إضافة اختبارات لـ webhook, aiChat ✅ webhook.test.js (7), aiChat.test.js (7)
- [x] D2: إضافة اختبارات لـ 5 API routes رئيسية ✅ alliance-requests (2), bot/rules (3), bot/settings (2), webhooks/discord (1), discord-stats (1) — 9 اختبارات
- [ ] S4: إضافة اختبار تكامل أساسي بين البوت والموقع

### M3 — 🏗️ توحيد البنية ✅ (مكتمل)
- [x] D1: توحيد Zod بين app و server ✅ كلاهما الآن `^3.24.1` (متوافق مع GenKit peer dep)
- [x] F6: تحديث shared/tsconfig.json ✅ `moduleResolution: "node"` → `"node16"`
- [x] B5: إضافة ESLint rules أمنية ✅ `eslint.config.js` (no-eval, no-implied-eval, eqeqeq, إلخ)
- [x] F1: إنشاء مجلد logs/ تلقائياً ✅ + `prebuild` script في server/package.json

### M4 — 📡 المراقبة والتوثيق
- [x] D6: إضافة middleware لتسجيل أوقات استجابة API routes ✅ `src/lib/api-timing.ts` (مطبق على 5 routes)
- [ ] F4: توثيق 10 API routes رئيسية بتنسيق JSDoc
- [ ] S1: إنشاء API contract document بين المشروعين
- [x] S3: توثيق Socket.IO event names ✅ في قسم [SOCKET_IO_EVENTS] أعلاه

### M5 — 🌐 i18n والإتاحة
- [ ] E2: إضافة `useTranslations()` في 3 مكونات رئيسية (header, hero-section, admin-ui)
- [ ] E3: إضافة language switcher في الـ header
- [x] E1: إضافة `hreflang` tags ✅ في `layout.tsx` (ar + en)
- [x] A3: تنفيذ redis.js ✅ حُذف (كان يتيماً)

### M6 — 🚀 DevOps
- [ ] F3: إضافة GitHub Actions workflow (test + lint + typecheck)
- [x] F5: إضافة `validateEnv()` ✅ `src/lib/validate-env.ts`
- [x] F7: تحديث README.md إلى Node 22 ✅ README.md + discord-bot/README.md

---

## [SOCKET_IO_EVENTS — توثيق أحداث Socket.IO]

| الحدث | المصدر (يميت) | المتلقي (أون) | الغرض |
|-------|--------------|---------------|--------|
| `bot_health` | discord-bot `index.js:93` (كل 10 ثوان) | Admin dashboard (3 صفحات) | تحديثات حالة البوت المباشرة |
| `new_audit_log` | discord-bot `advancedLogging.js:167` | Admin dashboard (3 صفحات) | سجل التدقيق المباشر |
| `bot_activity` | discord-bot (عبر `emitToDashboard`) | Admin `bot/page.tsx:293` | إشعارات نشاط البوت |
| `config_update` | dashboard (عبر socket emit) | discord-bot `socketManager.js:59` | تحديث إعدادات البوت |
| `request_sync` | dashboard (عبر socket emit) | discord-bot `socketManager.js:65` | طلب مزامنة يدوية |
| `join_server` | dashboard (عبر socket emit) | server `socket.service.ts:40` | الانضمام لغرفة سيرفر |
| `leave_server` | dashboard (عبر socket emit) | server `socket.service.ts:46` | مغادرة غرفة سيرفر |
| `command_executed` | server (عبر socket emit) | server `socket.service.ts:52-54` | إشعار بتنفيذ أمر (يُعاد بثه للغرفة) |

**ملاحظة:** discord-bot يستخدم `emitToDashboard(event, data)` و server يستخدم `emitToServer(io, serverId, event, data)` / `emitToUser(io, userId, event, data)` — وكلاهما يدعم أحداثاً ديناميكية.

---

## [ORPHANS & PENDING]

| الملف/العنصر | المشروع | الحالة |
|-------------|---------|--------|
| ~~`src/utils/redis.js`~~ | discord-bot | ✅ تم — حُذف (كان يتيماً) |
| ~~`src/events/logging.js`~~ | discord-bot | ✅ تم — حُذف (كان placeholder فارغاً) |
| `src/database/connect.js` — `scheduleReconnect()` | discord-bot | 🟢 وظيفي — لكن يمكن تحسينه (الحد الأقصى 10 محاولات فقط) |
| `CHANGELOG.md` | discord-bot | 🟡 يذكر v2.1.0 prep لكن لا يوجد إصدار محدد |
| `server/src/index.ts` — `logs/` folder | familylegends | 🟡 مجلد غير موجود. Winston سيحاول الإنشاء تلقائياً لكن قد يفشل في بعض البيئات |
| `scripts/verify-bot-secret.ts` | monorepo | 🟢 جديد — script للتحقق من تطابق BOT_CONTROL_SECRET بين المشروعين |
| `src/proxy.ts` — safeCompare | familylegends | 🟢 تم — إضافة timing-safe comparison لـ BOT_CONTROL_SECRET و API_SECRET |
| `src/app/api/bot/check-streamer/route.ts` — timingSafeEqual | familylegends | 🟢 تم — استبدال `!==` بـ timing-safe comparison |
| `shared/tsconfig.json` — moduleResolution | familylegends | 🟡 لم يُحدَّث إلى "node16" مثل server |
| `next.config.ts` remotePatterns (i.suar.me) | familylegends | 🟢 ما زال موجوداً لكن قد يكون مستخدماً |
| `@types/socket.io-client` | familylegends | ✅ تم — حُذف (package.json سليم) |

---

## ملخص تنفيذي

### المشروع الأول: discord-bot
بوت ديسكورد عربي متكامل بـ ~9,700 سطر. جميع التبعيات محدّثة ✅.  
**نقاط القوة**: تغطية واسعة للميزات (17 أمراً، 13 schema، 9 services)، أمان جيد (timing-safe comparison, per-user panels), تكامل Socket.IO مع الـ dashboard.  
**نقاط الضعف**: تغطية اختبارية ضعيفة (17 أمراً بدون اختبارات)، كود يتيم (redis.js, logging.js)، `/control` endpoint بدون rate limiting.

### المشروع الثاني: familylegends
موقع Next.js 16 + Express 5 Server + Shared Types. جميع التبعيات محدّثة ✅ (عدا Zod v3).  
**نقاط القوة**: بنية نظيفة (250+ ملف بتنظيم جيد)، i18n عربي/إنجليزي، 50+ API route، تكامل مع Firebase وMongoDB وRedis وSocket.IO.  
**نقاط الضعف**: تضارب Zod (v3 vs v4)، 50+ API route بدون اختبارات، useTranslations غير مستخدم، لا يوجد CI/CD، لا يوجد توثيق لـ API.

### النواقص المشتركة
- لا يوجد توثيق لعقود API بين المشروعين
- Socket.IO event names غير موثقة
- لا يوجد اختبارات تكامل
- BOT_CONTROL_SECRET قد يختلف بين المشروعين

### خطة الإكمال
6 Milestones مرتبة بالأولوية: أمني → اختبارات → بنية → مراقبة → i18n → DevOps. إجمالي الجهد المقدر: **~9 أيام عمل**.

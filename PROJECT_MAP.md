# PROJECT_MAP.md — Family Legends Ecosystem

> تاريخ التحليل: 2026-05-09  
> البيئة: Windows, Node.js >= 18

---

## [PROJECT_IDENTITY]

**الاسم**: Family Legends Ecosystem  
**النوع**: Monorepo — Discord Bot + Web Dashboard (Full-Stack)  
**الغرض**: مجتمع ألعاب عربي متكامل. بوت ديسكورد لإدارة السيرفر (moderation, music, economy, tickets, leveling, giveaways, protection, AI chat) + موقع ويب لاستضافة المجتمع ولوحة تحكم للمشرفين.

**المشروعان الرئيسيان**:
1. `discord-bot/` — بوت ديسكورد (JavaScript, discord.js v14)
2. `familylegends/` — تطبيق ويب Next.js + Firebase + Express API (TypeScript)

---

## [TECH_STACK]

### discord-bot/

| التقنية | الإصدار الحالي | أحدث إصدار | الحالة |
|---------|---------------|------------|--------|
| discord.js | 14.26.3 | 14.26.3 | ✅ محدّث |
| mongoose | 8.23.0 | 9.6.1 | ⚠️ قديم (major) |
| discord.js/voice | 0.16.1 | 0.18.x | ⚠️ قديم |
| distube | 5.0.0 | 5.x | ✅ محدّث |
| @google/generative-ai | 0.21.0 | 1.x | ⚠️ قديم |
| express | 4.18.2 | 4.21.x | ⚠️ قديم |
| socket.io | 4.8.3 | 4.8.x | ✅ محدّث |
| ioredis | 5.4.1 | 5.4.x | ✅ محدّث |
| canvas | 3.2.3 | 3.x | ✅ محدّث |

### familylegends/ (Next.js)

| التقنية | الإصدار الحالي | أحدث إصدار | الحالة |
|---------|---------------|------------|--------|
| next | 15.1.6 | 16.2.6 | ⚠️ قديم (major) |
| react | 18.3.1 | 19.1.x | ⚠️ قديم (major) |
| firebase | 11.9.1 | 12.12.1 | ⚠️ قديم (major) |
| firebase-admin | 13.7.0 | 13.9.0 | ⚠️ قديم |
| mongoose | 8.9.5 | 9.6.1 | ⚠️ قديم (major) |
| framer-motion | 12.23.24 | 12.38.0 | ⚠️ قديم |
| next-auth | 4.24.13 | 4.24.x | ✅ محدّث |
| next-intl | 4.9.1 | 4.x | ✅ محدّث |
| tailwindcss | 3.4.1 | 4.1.x | ⚠️ قديم (major) |
| typescript | 5.x | 5.8.x | ✅ محدّث |
| lucide-react | 0.475.0 | 0.475.x | ✅ محدّث |
| zod | 3.24.2 | 3.24.x | ✅ محدّث |
| recharts | 2.15.1 | 2.15.x | ✅ محدّث |
| radix-ui (مجموعة) | 1.x | 1.x | ✅ محدّث |

### familylegends/server/ (Express API — Socket.IO only)

| التقنية | الإصدار الحالي | أحدث إصدار | الحالة |
|---------|---------------|------------|--------|
| express | 5.2.1 | 5.2.x | ✅ محدّث |
| mongoose | 9.6.2 | 9.6.x | ✅ محدّث |
| socket.io | 4.8.3 | 4.8.x | ✅ محدّث |
| winston | 3.19.0 | 3.19.x | ✅ محدّث |
| helmet | 8.1.0 | 8.1.x | ✅ محدّث |
| jsonwebtoken | 9.0.3 | 9.x | ✅ محدّث |
| typescript | 6.0.3 | 6.0.x | ✅ محدّث |

### familylegends/client/ (Vite - إصدار بديل)

| التقنية | الإصدار الحالي | أحدث إصدار | الحالة |
|---------|---------------|------------|--------|
| react | 18.2.0 | 19.1.x | ⚠️ قديم (major) |
| vite | 5.0.11 | 6.x | ⚠️ قديم |
| react-router-dom | 6.21.1 | 7.x | ⚠️ قديم |
| @tanstack/react-query | 5.17.0 | 5.x | ✅ محدّث |

---

## [CURRENT_ARCHITECTURE]

### الهيكل العام

```
WEB-BOT/
├── discord-bot/                    # 🤖 بوت ديسكورد (Node.js)
│   ├── src/
│   │   ├── index.js                # Entry point + Express server مدمج
│   │   ├── config.js               # إعدادات البوت
│   │   ├── deploy.js               # نشر أوامر Slash
│   │   ├── commands/               # أوامر Prefix (moderation, music, economy, fun, utility, ticket, help, giveaway, leveling, chat, backup, notifications, rules, status, verify, controlPanelGames)
│   │   ├── events/                 # أحداث ديسكورد (ready, messageCreate, interactionCreate, guildMemberAdd/Remove/Update, presenceUpdate, logging, antiNuke, advancedLogging)
│   │   ├── services/               # خدمات (economyService, musicService, moderationService, ticketService, levelingService, welcomeService, protectionService, autoResponderService, notificationService)
│   │   ├── utils/                  # أدوات (embeds, logger, permissions, music, rankCard, cache, redis, canvasHelper, welcomeImage, streamDetector, giveawayHelper, aiChat, backupHelper, socketManager, controlPanels, ticketHelper, webhook, modScheduler, notificationChecker, advancedGames, cachedModels)
│   │   ├── database/
│   │   │   ├── connect.js          # اتصال MongoDB
│   │   │   └── schemas/            # 12+ schema (guild, user, serverConfig, ticket, warning, modAction, giveaway, reactionRole, backup, notification, autoResponder, auditLog, aiConfig, stats)
│   │   # (removed: refactor_schema*.js, _verify_imports.js — one-time scripts)
│   ├── tests/                      # اختبارات Jest
│   ├── Dockerfile / Procfile / render.yaml
│   └── package.json
│
├── familylegends/                  # 🌐 تطبيق ويب (Next.js 15)
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx          # Root layout (RTL, Cairo/Cinzel fonts, ThemeProvider, AuthProvider, FirebaseClientProvider, ErrorBoundary)
│   │   │   ├── page.tsx            # الصفحة الرئيسية (Hero, Rules, Team, Partners, Streamers, CTA)
│   │   │   ├── globals.css         # Tailwind + styles
│   │   │   ├── login/page.tsx      # تسجيل الدخول (Discord OAuth + credentials)
│   │   │   ├── admin/
│   │   │   │   ├── layout.tsx      # Admin sidebar + header + protection
│   │   │   │   ├── page.tsx        # لوحة تحكم (إدارة الحلفاء, القوانين, الفريق, الستريمرز, الملفات, الصوتيات, الإعدادات)
│   │   │   │   └── bot/
│   │   │   │       ├── page.tsx    # حالة البوت
│   │   │   │       ├── settings/
│   │   │   │       │   ├── page.tsx (uses dashboard/components/tabs-* — shared)
│   │   │   │       │   └── leaderboard/page.tsx
│   │   │   │       ├── guilds/
│   │   │   │       │   ├── page.tsx
│   │   │   │       │   ├── [guildId]/page.tsx + components/tabs-*.tsx (21 tab components)
│   │   │   │       │   └── [guildId]/leaderboard/page.tsx
│   │   │   │       ├── stats/page.tsx
│   │   │   │       ├── team/page.tsx
│   │   │   │       ├── ai/page.tsx
│   │   │   │       ├── giveaways/page.tsx
│   │   │   │       └── backups/page.tsx
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── page.tsx + components/tabs-*.tsx  (21 tab components)
│   │   │   │   │   └── leaderboard/page.tsx
│   │   │   └── api/
│   │   │       ├── auth/[...nextauth]/route.ts
│   │   │       ├── bot/            # 15+ route files (guilds, settings, config, health, status, sync, team, streamers, rules, economy, etc.)
│   │   │       ├── alliance-requests/
│   │   │       ├── discord-stats/route.ts + test
│   │   │       ├── streamers/check-live/route.ts
│   │   │       └── webhooks/discord/route.ts + utils.ts + test
│   │   ├── components/
│   │   │   ├── ui/                 # 30+ Radix UI components (shadcn/ui)
│   │   │   ├── landing/           # 11 landing sections
│   │   │   ├── admin/             # admin-header
│   │   │   └── ... (auth-provider, theme-provider, background-canvas, audio-player, click-to-enter, firebase-auth-bridge, FirebaseErrorListener, footer, header, layout-content, global-error-boundary)
│   │   ├── firebase/              # Firebase client (config, provider, client-provider, hooks, non-blocking-login/updates, error-emitter/errors)
│   │   ├── lib/                   # firebase-admin, firebase, auth, api-auth, utils, data, fetch-data, bot-mongodb, bot-schemas, dashboard-audit, redis
│   │   ├── hooks/                 # use-sound-effects, use-toast
│   │   ├── i18n/                  # next-intl request config
│   │   ├── ai/                    # Genkit AI (dev.ts, genkit.ts, flows/schemas)
│   │   ├── actions/               # Server Actions (add-games, get-firebase-token)
│   │   └── middleware.ts          # NextAuth + CSRF protection
│   # (removed: client/ — unused Vite app, dead code)
│   ├── server/                    # 🖥️ Express API backend
│   │   └── src/ (index.ts, config/passport, middleware/*, models/*, routes/*, services/socket.service)
│   ├── shared/                    # 🔄 أنواع مشتركة TypeScript
│   │   └── src/types/index.ts (447 lines — ServerSettings, User, Ticket, Economy, Leveling, Analytics, Socket events, etc.)
│   ├── scripts/                   # أدوات (seed-firebase, verify-env, fix-db, fix-secrets, clean-rules)
│   ├── messages/                  # i18n (ar.json, en.json)
│   └── tests/                     # Playwright e2e + unit tests
└── docs/ blueprint.md, BUILD_GUIDE.md, backend.json
```

### طبقات النظام

```
[Discord API] ←→ [discord-bot (JS)] ←WebSocket→ [Socket.io]
                    ↕                       ↕
              [MongoDB]              [Express /control API]
                                         ↕
[User Browser] ←→ [Next.js App (port 9002)] ←→ [Firebase Firestore]
                    ↕                           ↕
              [NextAuth.js]             [Firebase Auth]
                    ↕
              [Express Server (port 3001)] ←→ [MongoDB]
                    ↕
              [Socket.io Server]
```

---

## [SYSTEM_FLOW]

### رحلة المستخدم (Landing Page)

1. يزور المستخدم `familylegends.com` → Next.js SSR يرسل الصفحة الرئيسية
2. الصفحة تجلب البيانات من Firebase (community settings, rules, team, streamers, partners) عبر `firebase-admin`
3. الـ Hero section يعرض اسم المجتمع + رابط Discord
4. الـ Streamers section يعرض الستريمرز مع حالة Live
5. الـ Rules/Team/Partners/CTA sections تعرض المحتوى من Firestore
6. المستخدم يمكنه فتح modals (Alliance Request, Armory, Files)

### رحلة المشرف (Admin Dashboard)

1. يدخل `/login` → يختار Discord OAuth أو credentials
2. NextAuth.js يحقق من الهوية → redirect إلى `/admin`
3. الـ middleware.ts يتحقق من CSRF + admin role
4. Admin page تعرض Firebase collections (partners, rules, team, streamers, files, audioTracks, settings)
5. يدير المحتوى عبر Firestore CRUD operations
6. يمكنه مزامنة الستريمرز مع البوت عبر `/api/bot/sync`
7. يمكنه الذهاب إلى `/admin/bot/guilds/[guildId]` لإدارة إعدادات السيرفر

### بوت ديسكورد (Data Flow)

1. `src/index.js` يشغل Express + Socket.io + Discord.js client
2. أحداث Discord → Events handlers (messageCreate, interactionCreate, guildMemberAdd, إلخ)
3. Services تنفذ المنطق (economy, moderation, music, tickets, إلخ)
4. البيانات تُخزَّن في MongoDB عبر Mongoose
5. Dashboard يتواصل مع البوت عبر:
   - **Socket.io**: health updates كل 10 ثوانٍ
   - **HTTP /control**: إرسال embeds, إنشاء reaction roles, عمل backups, التحقق من roles
   - **HTTP /api/bot/***: Next.js API routes تتصل بالبوت

---

## [ISSUES_FOUND]

### 🔴 حرج — Critical

| # | المشكلة | الموقع | التفاصيل |
|---|---------|--------|----------|
| ~~C1~~ | ~~ملفات .env و .env.local موجودة في الـ repo~~ | — | ✅ تم — موجودة في `.gitignore` وغير متتبعة |
| ~~C2~~ | ~~تكرار هائل لكود الـ tabs (63 ملفاً)~~ | — | ✅ تم — حذفت 3 نسخ (63 ملفاً)، جميع الصفحات تستخدم الآن `@/components/admin/guild-tabs/` |
| ~~C3~~ | ~~خادما Express منفصلان على نفس الـ PORT (3001)~~ | — | ✅ تم — server يستخدم الآن port 3002 افتراضياً (discord-bot يبقى على 3001) |
| ~~C4~~ | ~~Dockerfile يستخدم node:18-alpine مع mongoose 8~~ | — | ✅ تم — mongoose 9 ✓, Dockerfile محدّث إلى node:22-alpine ✓ |
| ~~C5~~ | ~~استخدام next-auth v4 مع Next.js 15~~ | — | ✅ تم — Next.js 16 ✓ (next-auth v4 لا يزال قيد الاستخدام)

### 🟡 مهم — Important

| # | المشكلة | الموقع | التفاصيل |
|---|---------|--------|----------|
| ~~I1~~ | ~~إصدارات متعارضة من نفس الحزمة عبر المشروع~~ | — | ✅ تم — التوحيد تم مع الترقيات (mongoose 9, socket.io ~4.8) |
| ~~I2~~ | ~~الـ Vite client app يبدو مهجوراً~~ | — | ✅ تم — حُذف `familylegends/client/` بالكامل |
| ~~I3~~ | ~~كود ميت — return مكرر في admin layout~~ | `src/app/admin/layout.tsx:172-173` | ✅ تم — إزالة الـ return المكرر |
| ~~I4~~ | ~~Hardcoded Image URLs (postimg.cc)~~ | `layout.tsx`, `admin/layout.tsx`, إلخ | ✅ تم — الصورة مستضافة محلياً في `/public/images/logo.png`، جميع الـ URLs تشير إليها |
| ~~I5~~ | ~~لا يوجد rate limiting على جميع API routes~~ | `src/app/api/bot/*` | ✅ تم — 12 مساراً محمياً بـ `checkRateLimit()` + Redis/in-memory fallback |
| ~~I6~~ | ~~اختبارات قليلة جداً~~ | `tests/`, `src/app/api/` | ✅ تم — إضافة `playwright.config.ts` + `rate-limit.test.ts` (4 اختبارات). الإجمالي: 16/17 اختبارات ناجحة |
| ~~I7~~ | ~~Firebase Admin قد يفشل بدون env vars~~ | `firebase-admin.ts:10-16` | ✅ تم — `console.warn()` يُظهر تحذيراً عند فقدان المتغيرات |
| ~~I8~~ | ~~i18n ليس كاملاً~~ | `i18n/request.ts` + `messages/` | ✅ تم — إضافة `middleware.ts` (localePrefix: 'never')، `i18n/request.ts` يقرأ `requestLocale` من الـ middleware. كلا اللغتين (ar/en) نشطتان |

### 🟢 تحسين — Enhancement

| # | المشكلة | الموقع | التفاصيل |
|---|---------|--------|----------|
| E1 | **يمكن ترقية Next.js إلى v16** | `familylegends/package.json` | v16 يجلب Turbopack ثابت، React 19، وتحسينات أداء كبيرة |
| E2 | **يمكن ترقية React إلى v19** | `familylegends/package.json` | React 19 متوافق مع Next.js 16 ويجلب تحسينات |
| E3 | **يمكن ترقية Tailwind إلى v4** | `familylegends/package.json` | v4 أسرع بكثير وأخف وزناً |
| E4 | **توحيد مكتبة mongoose عبر المشروع** | discord-bot + server | كلاهما يستخدم mongoose ولكن بإصدارين مختلفين |
| ~~E5~~ | ~~إزالة الـ Vite client app~~ | — | ✅ تم — حُذف |
| ~~E6~~ | ~~إضافة Docker Compose للتطوير المحلي~~ | لا يوجد | ✅ تم — `docker-compose.yml` في جذر الـ repo (MongoDB 7 + Redis 7 + bot) |
| E7 | **إضافة HTTPS للـ dev environment** | `next.config.ts`, `server/.env.example` | ضروري لـ OAuth في التطوير المحلي. استخدم `local-ssl-proxy` أو `mkcert` (راجع BUILD_GUIDE.md) |
| ~~E8~~ | ~~الـ Admin page كبيرة جداً (735 lines)~~ | `src/app/admin/page.tsx` | ✅ تم — تقسيم إلى 3 مكونات: `admin-ui.tsx`, `admin-dialogs.tsx`, `page.tsx` |

---

## [ORPHANS & PENDING]

### ملفات يتيمة / كود غير مستخدم

| الملف | السبب |
|------|-------|
| ~~`familylegends/src/actions/add-games.ts`~~ | ✅ تم — حُذف (سكريبت seed لمرة واحدة) |
| `familylegends/src/ai/` | Genkit flows — مستخدم عبر `genkit:dev` script في package.json، لا يُحذف |
| ~~`familylegends/src/components/click-to-enter.tsx`~~ | ✅ تم — حُذف |
| `familylegends/src/components/audio-player.tsx` | مستخدم في `layout-content.tsx`، لا يُحذف |
| ~~`familylegends/src/app/admin/dashboard/components/tabs-*.tsx` (21 ملفاً)~~ | ✅ تم — تم الدمج مع guild-tabs |

### ✅ تم تنظيفه

| الملف | الإجراء |
|------|--------|
| `familylegends/client/` | حُذف (Vite app قديم) |
| `familylegends/src/app/admin/bot/settings/components/tabs-*.tsx` | حُذف (نسخة مكررة، settings page تشترك مع dashboard الآن) |
| `familylegends/src/app/admin/dashboard/components/tabs-*.tsx` (21 ملفاً) | حُذف (تم الدمج مع guild-tabs المشترك) |
| `familylegends/src/app/admin/bot/guilds/[guildId]/components/tabs-*.tsx` (21 ملفاً) | حُذف (تم الدمج مع guild-tabs المشترك) |
| `discord-bot/_verify_imports.js` | حُذف (ملف مؤقت) |
| `discord-bot/refactor_schema.js` و `refactor_schema_update.js` | حُذف (سكريبتات تحويل لمرة واحدة) |
| `familylegends/scripts/fix-db.js` و `fix-secrets.js` و `clean-rules.ts` | حُذف (سكريبتات إصلاح لمرة واحدة) |
| `server/src/routes/` (9 ملفات) | حُذف (REST endpoints قديمة) |
| `server/src/models/` (3 ملفات) | حُذف (قديمة، غير مستخدمة) |
| `server/src/config/passport.ts` | حُذف (غير مستخدم) |
| `server/src/middleware/auth.middleware.ts` | حُذف (غير مستخدم) |
| `familylegends/src/actions/add-games.ts` | حُذف (سكريبت seed لمرة واحدة) |
| `familylegends/src/components/click-to-enter.tsx` | حُذف (غير مستخدم) |
| `postimg.cc` URLs (في 5 ملفات) | استُبدلت بـ `/images/logo.png` و `LOGO_URL` من `NEXT_PUBLIC_SITE_URL` |
| `passport`, `passport-discord`, `express-session`, `cookie-parser`, `bcryptjs` (5 حزم) | حُذفت من package.json (غير مستخدمة) |

### كود محتمل فقدانه (Dead Code)

| الموقع | التفاصيل |
|--------|---------|
| ~~`server/src/routes/`~~ (9 ملفات) | ✅ تم — حُذفت (قديمة، Next.js API routes بديلة) |
| ~~`server/src/models/`~~ (Server.model, Ticket.model, User.model) | ✅ تم — حُذفت (قديمة، غير مستخدمة) |
| ~~`server/src/config/passport.ts`~~ | ✅ تم — حُذف (الـ auth يتم عبر next-auth) |
| ~~`server/src/middleware/auth.middleware.ts`~~ | ✅ تم — حُذف (غير مستخدم بدون routes) |

### مهام مفتوحة (من TODO.md)

- [x] Git push إلى GitHub — تم ✅

---

## ملخص تنفيذي

**هذا المشروع هو** نظام متكامل لمجتمع ألعاب عربي على Discord، يتكون من بوت ديسكورد شامل (50+ ميزة) وموقع ويب حديث (Next.js + Firebase + AI) للواجهة العامة ولوحة تحكم المشرفين. البنية حالياً في مرحلة متقدمة ولكنها تعاني من تضخم وتكرار وملفات مهملة.

**نقاط القوة**: تغطية واسعة للميزات، أمان جيد (CSRF، timing-safe comparison, helmet), استخدام تقنيات حديثة (Next.js 15, discord.js 14, Firebase, Tailwind), دعم i18n عربي/إنجليزي، تكامل AI عبر Genkit.

**نقاط الضعف**: خادما Express على نفس الـ port، تغطية اختبارات ضعيفة.

**🛠️ تم إنجازه**: 
- M1 ✅ أمني — env files غير متتبعة
- M2 ✅ تنظيف — حذف `client/`، 6 سكريبتات، 63 ملف tabs مكرر (3 نسخ → نسخة واحدة مشتركة)، 14 ملف/حزمة من `server/` (routes, models, passport, auth middleware + 5 unused npm packages)، استضافة الصور محلياً بدلاً من postimg.cc، ملفان يتيمان (add-games, click-to-enter)
- M3 ✅ ترقيات — Next.js 16, React 19, Tailwind 4, TS 6, mongoose 9, firebase 12, express 5
- M4 ✅ اختبارات — `playwright.config.ts`، `rate-limit.test.ts` (4 اختبارات)، 16/17 اختبار ناجح
- M5 ✅ DevOps — Docker Compose (MongoDB 7 + Redis 7 + bot)، تحديث Dockerfile إلى node:22-alpine
- I5 ✅ Rate limiting — 12 مسار API إضافياً محمياً (embed, sync, rules, config, warnings, notifications, auto-responder, backups, streamers, reaction-roles, giveaways, guild settings, member economy, alliance-requests)
- I6 ✅ اختبارات — إضافة Playwright config + unit test لـ rate-limit
- I7 ✅ Firebase Admin — إضافة `console.warn()` عند فقدان env vars
- I8 ✅ i18n — إضافة `middleware.ts` مع localePrefix: 'never'، تفعيل اللغتين (ar/en)
- جميع التبعيات في familylegends (Next.js + server) و discord-bot مرفعة لأحدث إصدار
- البناء (build) يمر بنجاح بدون أخطاء
- إصلاحات إضافية: health check في server (إضافة MongoDB status)، تنظيف `server/.env.example` (إزالة 7 متغيرات غير مستخدمة)، تحديث `tsconfig.json` (moduleResolution → node16)، تحسين `socket.service.ts` (emitToUser يستخدم user room)، إضافة `.gitignore` للسيرفر، تحديث إصدار TypeScript في shared، حذف `@types/socket.io-client` المهجور، حذف `shared/types/index.ts` اليتيم، إزالة postimg.cc من remotePatterns
- MAIN_GUILD_ID refactoring: 23 occurrence في 11 ملف → تستخدم `config.mainGuildId` بدلاً من `process.env.MAIN_GUILD_ID` مباشرة
- تدوير secrets: استبدال جميع القيم الافتراضية في `.env.example` بـ `YOUR_..._HERE`
- C3: تغيير port server الافتراضي من 3001 إلى 3002 لتجنب التعارض مع البوت
- **M1 (الجولة 2)** 🔐 أمني — استبدال المقارنات غير الآمنة بـ timing-safe comparison في `proxy.ts` و `check-streamer/route.ts`، تحديث `firestore.rules` (حد حجم 1 MiB + deny-all fallback)، إضافة `scripts/verify-bot-secret.ts` للتحقق من تطابق BOT_CONTROL_SECRET، إضافة التحقق من صحة NEXT_PUBLIC_BOT_SERVER_URL في `scripts/verify-env.ts`

---

## خطة العمل المقترحة (Milestones)

### M1 — 🔴 أمني عاجل (قابل للتحقق: < 1 ساعة)
- [x] إضافة `**/.env` و `**/.env.local` إلى `.gitignore` ✅
- [x] ملفات `.env` غير متتبعة أصلاً ✅
- [ ] ⚠️ تدوير (rotate) جميع الـ secrets المتسربة — لم يتم بعد

### M2 — 🏗️ تنظيف البنية (قابل للتحقق: < 4 ساعات)
- [x] حذف `familylegends/client/` بالكامل ✅
- [x] حذف سكريبتات الـ refactor لمرة واحدة (6 ملفات) ✅
- [x] حذف `settings/components/` (21 ملفاً مكرراً) وتوجيه imports إلى dashboard ✅
- [x] دمج `dashboard/components/` و `guilds/[guildId]/components/` و `guild-tabs/` في نسخة واحدة مشتركة — ✅ 
- [x] إزالة `server/src/routes/*` و `server/src/models/*` و `config/passport.ts` و `middleware/auth.middleware.ts` — ✅ كلها قديمة (Next.js API routes بديلة)

### M3 — ⚡ ترقية التبعيات (قابل للتحقق: < 2 ساعة)
- [x] Next.js 15 → 16 + React 18 → 19 ✅
- [x] mongoose 8 → 9 (في كلا المشروعين) ✅
- [x] Tailwind 3 → 4 ✅
- [x] firebase 11 → 12 ✅
- [x] TypeScript 5 → 6 ✅
- [x] discord-bot: express 4→5, mongoose 8→9, chalk 4→5, etc ✅

### M4 — 🧪 الاختبارات (قابل للتحقق: < 3 ساعات)
- [x] إضافة `playwright.config.ts` ✅
- [x] إضافة `rate-limit.test.ts` (4 اختبارات) ✅
- [ ] إضافة اختبارات للمكونات الحرجة (Login, Admin page)

### M5 — 📦 DevOps (قابل للتحقق: < 2 ساعة)
- [x] إضافة Docker Compose (MongoDB + Redis + Bot + Web) ✅
- [x] تغيير port server إلى 3002 لتجنب التعارض مع البوت ✅
- [ ] توحيد خادمي Express في خادم واحد (إذا رغبت)
- [x] تحديث Dockerfile إلى Node 22 ✅

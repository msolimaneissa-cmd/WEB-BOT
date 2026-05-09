# Prompt لإنشاء لوحة تحكم ويب متكاملة للبوت

## نظرة عامة
أريد إنشاء لوحة تحكم ويب احترافية شاملة للبوت ديسكورد تتفوق على لوحات ProBot و Carl-bot و Ticket Tool. اللوحة يجب أن تكون مقسمة إلى قسمين:
1. **لوحة المستخدمين العاديين** - للتحكم في التذاكر، المستوى، الاقتصاد، والإشعارات الشخصية
2. **لوحة الإدارة** - للتحكم الكامل في كل ميزات البوت

## التقنيات المطلوبة
- Frontend: React.js مع TypeScript
- UI Framework: TailwindCSS + Shadcn/ui أو Material-UI
- State Management: Zustand أو Redux Toolkit
- Backend API: Node.js مع Express
- Database: MongoDB (نفس قاعدة بيانات البوت)
- Authentication: Discord OAuth2
- Real-time: Socket.io للتحديثات المباشرة
- Charts: Recharts أو Chart.js
- Forms: React Hook Form + Zod validation

## المميزات الأساسية

### 1. نظام المصادقة
- تسجيل دخول عبر Discord OAuth2
- صلاحيات متعددة المستويات: User, Moderator, Admin, Server Owner
- إدارة الجلسات Sessions و Refresh Tokens
- حماية من CSRF و XSS

### 2. لوحة المستخدمين العاديين
- Dashboard: إحصائيات سريعة (المستوى، الرصيد، التذاكر)
- Profile: عرض المعلومات، الشارات، الإنجازات، تخصيص Rank Card
- Tickets: إنشاء/عرض/إغلاق التذاكر، Transcript
- Economy: الرصيد، Daily، Work، Rob، Transfer، Shop، Inventory
- Levels: XP، Leaderboard، Achievements، Role Rewards
- Notifications: تفضيلات الإشعارات لكل نوع

### 3. لوحة الإدارة
- Dashboard: نظرة عامة، رسوم بيانية، تنبيهات
- General Settings: Prefix، Language، Permissions، Logging
- Ticket Management: إعدادات، فئات، ردود تلقائية، إحصائيات
- Moderation: عقوبات، كلمات محظورة، Anti-Nuke، سجل
- Leveling: XP settings، Role rewards، Rank cards customization
- Economy: متجر، معاملات، مسابقات
- Music: إعدادات، Filters، History
- Welcome/Goodbye: محرر نصوص، صور مخصصة، أدوار تلقائية
- Auto Responder: triggers، أنواع المطابقة، قيود
- External Notifications: Twitch، YouTube، Twitter، RSS
- Backup: إنشاء/استعادة نسخ، جدولة
- Commands: قائمة، تخصيص، سجل استخدام
- Events: Giveaways، Trivia، ألعاب
- AI Settings: Gemini config، شخصية البوت، سجل محادثات

### 4. مميزات إضافية
- Analytics: تحليلات شاملة، تقارير PDF، تصدير بيانات
- Advanced Permissions: Granular permissions، inheritance، audit
- API: RESTful كاملة، Webhooks، GraphQL (اختياري)
- Templates: قوالب جاهزة للسيرفرات

### 5. تجربة المستخدم
- Design: Dark/Light mode، Responsive، Animations
- Performance: Lazy loading، Image optimization، Code splitting، PWA
- Accessibility: ARIA labels، Keyboard navigation، Screen reader

## هيكل المشروع
dashboard/
├── client/ (React + TypeScript)
│   ├── src/components/
│   ├── src/pages/
│   ├── src/hooks/
│   ├── src/stores/
│   └── src/services/
├── server/ (Node.js + Express)
│   ├── src/controllers/
│   ├── src/routes/
│   ├── src/middleware/
│   └── src/services/
└── shared/types/

## التكامل مع البوت
- استخدام نفس قاعدة البيانات MongoDB
- Socket.io للاتصال المباشر
- REST API للتواصل

## مراحل التطوير
1. الأساسيات والمصادقة (أسبوعان)
2. ميزات المستخدمين (أسبوعان)
3. لوحة الإدارة (3 أسابيع)
4. ميزات متقدمة (أسبوعان)
5. تحسينات واختبار (أسبوع)

هذا البرومبت يعطى لـ AI Agent لإنشاء لوحة التحكم بالكامل.

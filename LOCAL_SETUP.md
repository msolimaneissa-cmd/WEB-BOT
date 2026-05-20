# LOCAL_SETUP.md

## 📊 ENVIRONMENT_STATUS
| Tool | Current Version | Required | Status |
| :--- | :--- | :--- | :--- |
| **Node.js** | `v24.14.1` | `>=22.0.0` | ✅ Installed |
| **npm** | `11.11.0` | N/A | ✅ Installed |
| **Python** | `3.14.4` | N/A | ✅ Installed |
| **Git** | `2.53.0` | N/A | ✅ Installed |
| **Docker** | Not Found | Optional | ⚠️ Missing |

---

## 🚫 MISSING_TOOLS
1. **Docker Desktop** (Optional): Required if you plan to use the provided Dockerfiles, but not strictly necessary for local Node.js development.
2. **MongoDB Server**: The projects require MongoDB. If not installed locally, use a MongoDB Atlas URI.
3. **Redis Server**: Optional but used by both for caching.

---

## 🤖 BOT_REQUIREMENTS (`discord-bot`)
- **Runtime**: Node.js
- **Port**: `3001` (Default)
- **Primary Dependencies**: `discord.js v14`, `express`, `mongoose`, `socket.io`.
- **Key Environment Variables**:
  - `DISCORD_TOKEN`: Bot authentication token.
  - `MONGODB_URI`: Connection string for MongoDB.
  - `BOT_CONTROL_SECRET`: Shared secret for website communication.

---

## 🌐 WEB_REQUIREMENTS (`familylegends`)
- **Framework**: Next.js
- **Port**: `9002` (Local Dev)
- **Primary Dependencies**: `firebase`, `next-auth`, `mongoose`, `socket.io-client`.
- **Key Environment Variables**:
  - `NEXTAUTH_URL`: `http://localhost:9002` (for local dev).
  - `NEXTAUTH_SECRET`: Secret for session encryption.
  - `DISCORD_CLIENT_ID` / `SECRET`: For Discord Login.
  - `FIREBASE_*`: Firebase configuration keys.
  - `BOT_CONTROL_SECRET`: Must match the Bot's secret.

---

## 🚀 STARTUP_ORDER
1. **Database**: Start MongoDB (Local or Atlas).
2. **Redis**: Start Redis (Optional).
3. **Bot**:
   ```bash
   cd discord-bot
   npm install
   npm run dev
   ```
4. **Website**:
   ```bash
   cd familylegends
   npm install
   npm run dev
   ```

---

## 🔐 ENV_VARIABLES_GUIDE

### Shared Variables
| Variable | Description | Source |
| :--- | :--- | :--- |
| `BOT_CONTROL_SECRET` | Secret key for Bot-Web communication. | Generate a random string. |
| `MONGODB_URI` | MongoDB connection string. | Local MongoDB or Atlas. |

### Bot Specific
| Variable | Description | Source |
| :--- | :--- | :--- |
| `DISCORD_TOKEN` | The bot token. | Discord Developer Portal. |
| `CLIENT_ID` | Bot Client ID. | Discord Developer Portal. |
| `GUILD_ID` | Primary Server ID. | Discord App (Developer Mode). |

### Website Specific
| Variable | Description | Source |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_BOT_SERVER_URL` | `http://localhost:3001` | Bot's local address. |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin Service Account Key. | Firebase Console. |

---

## 🪟 WINDOWS_ISSUES
- **Firewall**: Ensure Ports `3001` and `9002` are allowed in Windows Firewall.
- **Node Version**: `v24` is experimental; if issues arise, consider using `v20.x` (LTS) via `nvm-windows`.
- **Path Lengths**: Discord bot uses deep `node_modules`. Ensure "Long Paths" are enabled in Windows Registry if installation fails.

---

## 🚀 HOW_TO_RUN
1. **Fill Environment Variables**: Complete `.env` files in both directories with your tokens and secrets.
2. **Start Services**: Double-click `start-local.bat` in the root directory.
3. **Check Logs**: Monitor the two command windows for any errors.

## ⚠️ KNOWN_ISSUES & SOLUTIONS
1. **المشكلة**: `DisTubeError [INVALID_KEY]: 'leaveOnEmpty'`
   - **السبب**: تغيير في مكتبة DisTube v5 يجعل خيار `leaveOnEmpty` غير صالح في الـ constructor.
   - **الحل**: يجب تحديث الكود في `src/utils/music.js` لإزالة هذا الخيار أو استخدام نسخة أقدم من المكتبة. (لم يتم تعديله هنا التزاماً بقواعد المشروع).
   - **الحالة**: ⚠️ بانتظار قرار المطور.

2. **المشكلة**: `خطأ: رابط MONGODB_URI غير موجود`
   - **السبب**: ملف الـ `.env` لم يكن يحتوي على رابط قاعدة البيانات.
   - **الحل**: تم إضافة `mongodb://127.0.0.1:27017/discord_bot_local` كقيمة افتراضية.
   - **الحالة**: ✅ محلول.

## ✅ STATUS_REPORT
- **Dependencies**: Installed ✅
- **Env Files**: Prepared ✅ (MongoDB URI added)
- **Startup Script**: Created ✅
- **Automation**: `start-local.bat` ready ✅

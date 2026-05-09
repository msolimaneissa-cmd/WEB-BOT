const mongoose = require('mongoose');
const logger = require('../utils/logger');

// تخزين حالة الاتصال
let isConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

/**
 * التحقق من حالة اتصال قاعدة البيانات
 * @returns {boolean}
 */
function isDatabaseConnected() {
    return isConnected && mongoose.connection.readyState === 1;
}

async function connectDatabase() {
    // دعم الاستخدام الرئيسي والاحتياطي
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    const fallbackUri = process.env.FALLBACK_MONGODB_URI;

    // التحقق من وجود رابط قاعدة البيانات في ملف .env
    if (!mongoUri) {
        logger.error('[قاعدة البيانات] ❌ خطأ: رابط MONGODB_URI غير موجود في ملف .env');
        return;
    }

    try {
        mongoose.set('strictQuery', false);
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
        isConnected = true;
        reconnectAttempts = 0;
        logger.info('[قاعدة البيانات] ✅ تم الاتصال بـ MongoDB بنجاح.');
    } catch (error) {
        logger.error('[قاعدة البيانات] ❌ فشل الاتصال بالخادم الرئيسي:', error.message);
        
        if (fallbackUri) {
            try {
                logger.warn('[قاعدة البيانات] 🔄 محاولة الاتصال بالخادم الاحتياطي (Fallback)...');
                await mongoose.connect(fallbackUri, { serverSelectionTimeoutMS: 5000 });
                isConnected = true;
                reconnectAttempts = 0;
                logger.info('[قاعدة البيانات] ✅ تم الاتصال بالخادم الاحتياطي بنجاح.');
            } catch (fallbackErr) {
                logger.error('[قاعدة البيانات] ❌ فشل الاتصال بالخادم الاحتياطي:', fallbackErr.message);
                isConnected = false;
                scheduleReconnect();
            }
        } else {
            isConnected = false;
            scheduleReconnect();
        }
    }

    // مراقبة حالة الاتصال
    mongoose.connection.on('disconnected', () => {
        logger.warn('[قاعدة البيانات] ⚠️ انقطع الاتصال بقاعدة البيانات!');
        isConnected = false;
        scheduleReconnect();
    });

    mongoose.connection.on('reconnected', () => {
        logger.info('[قاعدة البيانات] 🔄 تم إعادة الاتصال بقاعدة البيانات.');
        isConnected = true;
        reconnectAttempts = 0;
    });

    mongoose.connection.on('error', (err) => {
        logger.error('[قاعدة البيانات] ❌ خطأ في الاتصال:', err.message);
        isConnected = false;
    });
}

function scheduleReconnect() {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        logger.error('[قاعدة البيانات] ❌ وصلنا للحد الأقصى من محاولات إعادة الاتصال.');
        return;
    }
    reconnectAttempts++;
    // تأخير تصاعدي: 5s, 10s, 20s ... حتى 5 دقائق كحد أقصى
    const delay = Math.min(5000 * Math.pow(2, reconnectAttempts - 1), 5 * 60 * 1000);
    logger.warn(`[قاعدة البيانات] ⏳ المحاولة ${reconnectAttempts} بعد ${delay / 1000} ثانية...`);
    setTimeout(async () => {
        try {
            await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
        } catch (err) {
            logger.error('[قاعدة البيانات] ❌ فشلت إعادة الاتصال:', err.message);
        }
    }, delay);
}

module.exports = { connectDatabase, isDatabaseConnected };


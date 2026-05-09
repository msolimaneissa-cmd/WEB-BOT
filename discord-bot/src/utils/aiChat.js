/**
 * @file src/utils/aiChat.js
 * @description نظام الذكاء الاصطناعي للمحادثة - يدعم محادثات ذكية مع البوت
 */

const logger = require('./logger');

// ─── إعدادات Gemini ───
const GOOGLE_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
let genAI = null;

if (GOOGLE_API_KEY) {
    try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
        logger.success('✅ تم تفعيل نظام الذكاء الاصطناعي (Google Gemini)');
    } catch (e) {
        logger.warn('⚠️ حزمة @google/generative-ai غير مثبتة، سيتم استخدام الردود الذكية المدمجة فقط.');
    }
}

// تخزين سياق المحادثات لكل مستخدم
const conversationContext = new Map();

// الحد الأقصى لعدد الرسائل في السياق
const MAX_CONTEXT_LENGTH = 10;

// وقت انتهاء السياق (30 دقيقة)
const CONTEXT_EXPIRY = 30 * 60 * 1000;

/**
 * تنظيف السياقات القديمة
 */
function cleanExpiredContexts() {
    const now = Date.now();
    for (const [key, data] of conversationContext.entries()) {
        if (now - data.lastActivity > CONTEXT_EXPIRY) {
            conversationContext.delete(key);
        }
    }
}

// تنظيف كل 10 دقائق
setInterval(cleanExpiredContexts, 10 * 60 * 1000);

/**
 * إضافة رسالة للسياق
 * @param {string} userId - معرف المستخدم
 * @param {string} guildId - معرف السيرفر
 * @param {string} role - دور الرسالة (user/assistant)
 * @param {string} content - محتوى الرسالة
 */
function addToContext(userId, guildId, role, content) {
    const key = `${guildId}-${userId}`;
    const data = conversationContext.get(key) || { messages: [], lastActivity: Date.now() };

    data.messages.push({ role, content: content.slice(0, 500) }); // تحديد طول الرسالة
    data.lastActivity = Date.now();

    // حذف الرسائل القديمة إذا تجاوز الحد
    if (data.messages.length > MAX_CONTEXT_LENGTH) {
        data.messages = data.messages.slice(-MAX_CONTEXT_LENGTH);
    }

    conversationContext.set(key, data);
}

/**
 * الحصول على سياق المحادثة
 * @param {string} userId
 * @param {string} guildId
 * @returns {Array}
 */
function getContext(userId, guildId) {
    const key = `${guildId}-${userId}`;
    const data = conversationContext.get(key);
    return data?.messages || [];
}

/**
 * مسح سياق المحادثة
 * @param {string} userId
 * @param {string} guildId
 */
function clearContext(userId, guildId) {
    const key = `${guildId}-${userId}`;
    conversationContext.delete(key);
}

/**
 * الردود الذكية المدمجة (بدون API خارجي)
 */
const SMART_RESPONSES = {
    // الترحيب
    greetings: {
        patterns: [/^(هلا|اهلا|مرحبا|السلام|صباح|مساء|هاي|هي|يا هلا|هلا والله|هايي|هيي)/i],
        responses: [
            'أهلاً وسهلاً! 😊 كيف أقدر أساعدك؟',
            'يا هلا! نور البوت بوجودك! 🌟',
            'مرحباً! أنا هنا لمساعدتك في أي شيء! 💪',
            'هاي! شخبارك؟ 😄',
            'السلام عليكم! ورحمة الله وبركاته 🤲',
        ]
    },

    // الشكر
    thanks: {
        patterns: [/^(شكرا|مشكور|thanks|thank you|شكراً|جزاك الله|الله يعطيك|تسلم)/i],
        responses: [
            'العفو! 😊 دائماً في الخدمة!',
            'لا شكر على واجب! 💪',
            'سعيد بخدمتك! 🌟',
            'أنت الأروع! 😄',
            'وجودك هو الشكر! 💖',
        ]
    },

    // الأسئلة عن البوت
    aboutBot: {
        patterns: [
            /^(من انت|من أنت|وش انت|وش أنت|انت مين|أنت مين|عرفني بنفسك|تكلم عن نفسك)/i,
            /^(what are you|who are you|what can you do)/i,
            /^(ايش تسوي|ايش تقدر|وش تقدر|شنو تقدر)/i
        ],
        responses: [
            'أنا بوت Family Legends! 🤖\n\n✨ **أقدر أساعدك في:**\n🎵 تشغيل الموسيقى (يوتيوب، سبوتيفاي، ساوندكلاود)\n🎮 ألعاب مسلية\n💰 نظام اقتصاد متكامل\n🎫 نظام تذاكر\n🛡️ أوامر إشراف\n\n💡 جرب `!مساعدة` لمعرفة المزيد!',
            'أنا مساعدك الذكي! 🤖\n\nأساعدك في:\n• 🎵 تشغيل الموسيقى\n• 🎮 اللعب\n• 💰 إدارة الاقتصاد\n• 🎫 فتح تذاكر دعم\n\nاكتب `!لوحة` للتحكم الكامل!',
        ]
    },

    // أوامر الموسيقى
    music: {
        patterns: [
            /^(شغل|تشغيل|play|صوت|music)/i,
            /^(كيف اشغل|كيف أشغل|وشلون اشغل)/i
        ],
        responses: [
            '🎵 **لتشغيل الموسيقى:**\n\n`!شغل اسم الأغنية` - تشغيل بالاسم\n`!شغل رابط` - تشغيل برابط\n\n✅ **المنصات المدعومة:**\n• يوتيوب\n• سبوتيفاي\n• ساوندكلاود\n\n💡 استخدم `!تحكم` للوحة التحكم!',
            '🎶 **الموسيقى سهلة جداً!**\n\n1️⃣ ادخل روم صوتي\n2️⃣ اكتب `!شغل` + اسم الأغنية\n3️⃣ استمتع! 🎧\n\nجرب الآن! 🎵',
        ]
    },

    // الأسئلة العامة
    general: {
        patterns: [
            /^(كيف حالك|شخبارك|كيفك|عامل ايه|عامل أيه)/i,
            /^(how are you|how is it going|sup)/i
        ],
        responses: [
            'تمام الحمد لله! 😊 وأنت كيفك؟',
            'بخير والحمد لله! 🌟 شخبارك أنت؟',
            'أنا ممتاز! 💪 وأنت؟',
            'الحمد لله، سعيد بمساعدتك! 😄',
        ]
    },

    // النكت والترفيه
    jokes: {
        patterns: [/^(نكتة|نكته|ضحك|joke|ضحكني|فكاهة)/i],
        responses: [
            '😂 ليش الحاسوب مش بيروح الطبيب؟\n\nلأنه عنده ويندوز! 🪟',
            '😂 مدرس سأل الطالب: كم يساوي 2×2؟\nالطالب: 4\nالمدرس: صح! وكم يساوي 2×3؟\nالطالب: 5، ما توقعته! 🎲',
            '😂 ليش السمكة سعيدة؟\n\nلأنها في بحر من السعادة! 🐟',
            '😂 وحدة قالت لصاحبتها: ليش ما تسمعين نصايح؟\nقالت: لأني ما أبي أتعبك! 😅',
        ]
    },

    // المساعدة
    help: {
        patterns: [/^(مساعدة|ساعدني|help|أحتاج مساعدة|محتاج مساعدة)/i],
        responses: [
            '🆘 **أنا هنا لمساعدتك!**\n\n**أوامر مهمة:**\n`!لوحة` - القائمة الرئيسية\n`!شغل` - تشغيل موسيقى\n`!تحكم` - لوحة تحكم الموسيقى\n`!الالعاب` - ألعاب مسلية\n`!مساعدة` - كل الأوامر\n\n💡 اسألني أي شيء!',
            '🙋 **كيف أساعدك؟**\n\n🎯 أقدر أساعدك في:\n• 🎵 تشغيل الموسيقى\n• 🎮 اللعب\n• 💰 الاقتصاد\n• 🎫 التذاكر\n\nاكتب الأمر أو اسألني! 😊',
        ]
    },

    // الأسئلة الدينية
    religious: {
        patterns: [
            /^(جزاك الله|الله يرزقك|الله يجزيك|الله يبارك)/i,
            /(اللهم|اللهم|يارب|يا رب)/i
        ],
        responses: [
            'وإياكم! 🤲 الله يجزاك الخير',
            'اللهم آمين 🤲',
            'الله يبارك فيك! 🌙',
        ]
    },

    // الوداع
    goodbye: {
        patterns: [/^(باي|مع السلامة|bye|سلام|تصبحون|مساء الخير|الله معاك)/i],
        responses: [
            'مع السلامة! 👋 نتلاقى قريباً!',
            'باي! 👋 كانت جلسة حلوة!',
            'الله معاك! 🌟',
            'سلام! 🖐️ لا تنسى ترجع!',
        ]
    },

    // المديح
    compliment: {
        patterns: [
            /(جميل|حلو|رائع|ممتاز|goat|legend|اسطورة|أفضل|افضل)/i,
            /(انت الافضل|أنت الأفضل|baba|بابا|king|ملك)/i
        ],
        responses: [
            'شكراً! 😊 أنت الأروع! 🌟',
            'الله يسلمك! 💖',
            'بوجودكم نرتقي! 👑',
            'انت الأسطورة الحقيقية! 💪',
        ]
    },
};

/**
 * توليد رد ذكي
 * @param {string} message - رسالة المستخدم
 * @param {string} userId - معرف المستخدم
 * @param {string} guildId - معرف السيرفر
 * @returns {string|null}
 */
function generateSmartResponse(message, userId, guildId) {
    const msg = message.trim().toLowerCase();

    // التحقق من كل فئة
    for (const [category, data] of Object.entries(SMART_RESPONSES)) {
        for (const pattern of data.patterns) {
            if (pattern.test(msg)) {
                // إضافة للسياق
                addToContext(userId, guildId, 'user', message);
                const response = data.responses[Math.floor(Math.random() * data.responses.length)];
                addToContext(userId, guildId, 'assistant', response);
                return response;
            }
        }
    }

    // البحث عن كلمات مفتاحية
    const keywords = {
        'موسيقى|اغنية|أغنية|song|music': '🎵 للحصول على الموسيقى، اكتب `!شغل` + اسم الأغنية!',
        'اقتصاد|فلوس|مال|money|coins': '💰 للاقتصاد، استخدم `!اقتصاد` أو `/اقتصاد`!',
        'لعبة|لعب|game|العاب|ألعاب': '🎮 للألعاب، اكتب `!الالعاب`!',
        'تذكرة|دعم|ticket|support': '🎫 للتذاكر، استخدم `/تذكرة انشاء`!',
        'برمجة|كود|code|programming': '💻 أنا أحب البرمجة! اكتب `!مساعدة` لمعرفة أوامري!',
    };

    for (const [keys, response] of Object.entries(keywords)) {
        const parts = keys.split('|');
        const escapedParts = parts.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        if (new RegExp(escapedParts.join('|'), 'i').test(msg)) {
            addToContext(userId, guildId, 'user', message);
            addToContext(userId, guildId, 'assistant', response);
            return response;
        }
    }

    return null;
}

/**
 * معالجة الرسالة مع AI
 * @param {string} message - رسالة المستخدم
 * @param {string} userId - معرف المستخدم
 * @param {string} guildId - معرف السيرفر
 * @param {string} userName - اسم المستخدم
 * @param {string} customSystemPrompt - تعليمات النظام المخصصة (اختياري)
 * @param {string} customModel - النموذج المخصص (اختياري)
 * @returns {Promise<string>}
 */
async function processAIMessage(message, userId, guildId, userName, customSystemPrompt = null, customModel = null) {
    try {
        // أولاً: محاولة الرد الذكي المدمج (للسرعة)
        const smartResponse = generateSmartResponse(message, userId, guildId);
        if (smartResponse) {
            return smartResponse;
        }

        // ثانياً: محاولة استخدام Gemini إذا كان مفعلاً
        if (genAI) {
            try {
                const modelName = customModel || "gemini-1.5-flash";
                const model = genAI.getGenerativeModel({ model: modelName });
                const context = getContext(userId, guildId);
                
                // تحويل السياق لتنسيق Gemini
                const history = context.map(msg => ({
                    role: msg.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: msg.content }],
                }));

                const chat = model.startChat({
                    history: history,
                    generationConfig: {
                        maxOutputTokens: 500,
                        temperature: 0.7,
                    },
                });

                // توجيه للنظام (System Prompt)
                const defaultPrompt = `أنت بوت Discord يسمى "Family Legends Bot". أنت مساعد ذكي، ودود، وخبير في السيرفر. رد بالعربية (وبالإنجليزية إذا لزم الأمر). كن مختصراً وواضحاً. اسم المستخدم الذي تخاطبه هو ${userName}.`;
                const systemPrompt = customSystemPrompt || defaultPrompt;
                
                // دمج تعليمات النظام مع الرسالة الحالية لضمان الالتزام بها في كل مرة
                const promptWithSystem = `${systemPrompt}\n\nالمستخدم: ${message}`;
                
                const result = await chat.sendMessage(promptWithSystem);
                const response = await result.response;
                const text = response.text();

                if (text) {
                    // إضافة للسياق
                    addToContext(userId, guildId, 'user', message);
                    addToContext(userId, guildId, 'assistant', text);
                    return text;
                }
            } catch (err) {
                logger.error('Gemini API Error:', err);
            }
        }

        // ثالثاً: رد افتراضي في حال فشل كل شيء
        return "عذراً، أواجه صعوبة في معالجة طلبك الآن. جرب مرة أخرى لاحقاً!";
    } catch (error) {
        logger.error('AI Processing Error:', error);
        return "حدث خطأ غير متوقع أثناء محاولة الرد.";
    }
}

/**
 * نظام الدردشة الذكية - يتعلم من المحادثات
 */
const chatPatterns = {
    // أسئلة نعم/لا
    yesNo: {
        patterns: [/^(نعم|اي|ايه|أي|yes|yeah|yep|لا|لاا|no|nope|نو)/i],
        getContext: (match) => {
            if (/^(نعم|اي|ايه|أي|yes|yeah|yep)/i.test(match)) {
                return ['تمام! 👍', 'أوكي! 😊', 'حلو! 👌', 'ماشاء الله! ✨'];
            }
            return ['أوكي، ما في مشكلة! 👍', 'تمام، كما تريد! 😊', 'فهمت! 👌'];
        }
    },

    // العواطف
    emotions: {
        patterns: [
            { regex: /(حزين|زعلان|مزعوج|sad|😢|😭|💔)/i, responses: ['لا تحزن! 🤗 كل شي بيصير خير!', 'أنا معك! 💪 راح تتحسن الأمور!'] },
            { regex: /(سعيد|فرحان|happy|😂|🤣|joy)/i, responses: ['ماشاء الله! 🎉 استمر!', 'جميل جداً! 😄'] },
            { regex: /(غاضب|زعلت|عصبي|angry|😠|😡)/i, responses: ['اهدى شوي! 🧘 خذ نفس عميق!', 'لا تستعجل، كل شي بيصير تمام!'] },
            { regex: /(تعبان|مريض|sick|🤒|🤕)/i, responses: ['سلامتك! 🤲 الله يشفيك!', 'ان شاء الله تتعافى قريباً! 🌹'] },
        ],
        getResponse(msg) {
            for (const pattern of this.patterns) {
                if (pattern.regex.test(msg)) {
                    return pattern.responses[Math.floor(Math.random() * pattern.responses.length)];
                }
            }
            return null;
        }
    }
};

module.exports = {
    processAIMessage,
    generateSmartResponse,
    addToContext,
    getContext,
    clearContext,
    SMART_RESPONSES,
};

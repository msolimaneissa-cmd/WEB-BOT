/**
 * @file src/utils/advancedGames.js
 * @description ألعاب تفاعلية متقدمة للبوت
 */

const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
} = require('discord.js');
const { COLORS } = require('./embeds');

// ═══════════════════════════════════════════════════════════════
// 🎰 نظام الحظ واليانصيب
// ═══════════════════════════════════════════════════════════════

/**
 * إنشاء لوحة لعبة السلوتس
 */
function createSlotsPanel(userId) {
    const symbols = ['🍎', '🍊', '🍋', '🍇', '💎', '7️⃣', '⭐', '🍀'];

    const embed = new EmbedBuilder()
        .setColor(COLORS.ECONOMY)
        .setTitle('🎰 ماكينة السلوتس')
        .setDescription('اضغط على الزر للعب!')
        .addFields(
            { name: '💰 الجوائز', value: '💎💎💎 = 100x\n7️⃣7️⃣7️⃣ = 50x\n⭐⭐⭐ = 25x\n3 متشابه = 10x\n2 متشابه = 2x', inline: false },
            { name: '💵 تكلفة اللعب', value: '50 عملة', inline: true }
        )
        .setFooter({ text: '🎯 حظاً سعيداً!' });

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`slots_${userId}_spin`)
                .setLabel('لف!')
                .setEmoji('🎰')
                .setStyle(ButtonStyle.Primary),
        );

    return { embeds: [embed], components: [row] };
}

/**
 * تشغيل السلوتس
 */
function spinSlots() {
    const symbols = ['🍎', '🍊', '🍋', '🍇', '💎', '7️⃣', '⭐', '🍀'];
    const result = [];

    for (let i = 0; i < 3; i++) {
        result.push(symbols[Math.floor(Math.random() * symbols.length)]);
    }

    // حساب الفوز
    let multiplier = 0;

    if (result[0] === result[1] && result[1] === result[2]) {
        // ثلاثة متشابهين
        if (result[0] === '💎') multiplier = 100;
        else if (result[0] === '7️⃣') multiplier = 50;
        else if (result[0] === '⭐') multiplier = 25;
        else multiplier = 10;
    } else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
        // اثنين متشابهين
        multiplier = 2;
    }

    return { result, multiplier };
}

// ═══════════════════════════════════════════════════════════════
// 🎯 لعبة التخمين
// ═══════════════════════════════════════════════════════════════

/**
 * إنشاء لوحة لعبة تخمين الرقم
 */
function createGuessNumberPanel(userId, currentNumber = null, attempts = 0) {
    const number = currentNumber || Math.floor(Math.random() * 100) + 1;

    const embed = new EmbedBuilder()
        .setColor(COLORS.INFO)
        .setTitle('🎯 تخمين الرقم')
        .setDescription('خمن رقم بين 1 و 100!')
        .addFields(
            { name: '🔢 المحاولات', value: `${attempts}`, inline: true },
            { name: '💡 تلميح', value: attempts > 0 ? (currentNumber ? 'جرب مرة أخرى!' : 'ابدأ اللعب!') : 'اضغط على زر للبدء!', inline: true }
        )
        .setFooter({ text: '🎯 كل ما قلت المحاولات، زادت جائزتك!' });

    const row1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`guess_${userId}_1-25`)
                .setLabel('1-25')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`guess_${userId}_26-50`)
                .setLabel('26-50')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`guess_${userId}_51-75`)
                .setLabel('51-75')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`guess_${userId}_76-100`)
                .setLabel('76-100')
                .setStyle(ButtonStyle.Primary),
        );

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`guess_${userId}_giveup`)
                .setLabel('استسلام')
                .setStyle(ButtonStyle.Danger),
        );

    return { embeds: [embed], components: [row1, row2], number };
}

// ═══════════════════════════════════════════════════════════════
// 🎲 لعبة النرد المتقدمة
// ═══════════════════════════════════════════════════════════════

/**
 * إنشاء لوحة لعبة النرد الكبيرة
 */
function createBigDicePanel(userId) {
    const embed = new EmbedBuilder()
        .setColor(COLORS.INFO)
        .setTitle('🎲 لعبة النرد الكبيرة')
        .setDescription('توقع النتيجة واربح!')
        .addFields(
            { name: '🎲 خيارات', value: 'منخفض (1-3): 2x\nمتوسط (4): 3x\nعالي (5-6): 2x', inline: false },
            { name: '💵 تكلفة اللعب', value: '25 عملة', inline: true }
        );

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`bigdice_${userId}_low`)
                .setLabel('منخفض (1-3)')
                .setEmoji('🎲')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`bigdice_${userId}_mid`)
                .setLabel('متوسط (4)')
                .setEmoji('🎯')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`bigdice_${userId}_high`)
                .setLabel('عالي (5-6)')
                .setEmoji('🎲')
                .setStyle(ButtonStyle.Primary),
        );

    return { embeds: [embed], components: [row] };
}

/**
 * رمي النرد الكبير
 */
function rollBigDice(bet) {
    const result = Math.floor(Math.random() * 6) + 1;
    let won = false;
    let multiplier = 0;

    if (bet === 'low' && result <= 3) {
        won = true;
        multiplier = 2;
    } else if (bet === 'mid' && result === 4) {
        won = true;
        multiplier = 3;
    } else if (bet === 'high' && result >= 5) {
        won = true;
        multiplier = 2;
    }

    return { result, won, multiplier };
}

// ═══════════════════════════════════════════════════════════════
// 🃏 لعبة ورق (21)
// ═══════════════════════════════════════════════════════════════

const BLACKJACK_CARDS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const BLACKJACK_SUITS = ['♠️', '♥️', '♦️', '♣️'];

// تخزين ألعاب الـ Blackjack النشطة
const blackjackGames = new Map();

/**
 * إنشاء لعبة ورق جديدة
 */
function createBlackjackGame(userId) {
    const deck = [];
    for (const suit of BLACKJACK_SUITS) {
        for (const card of BLACKJACK_CARDS) {
            deck.push({ card, suit });
        }
    }

    // خلط
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    const playerCards = [deck.pop(), deck.pop()];
    const dealerCards = [deck.pop()];

    const game = {
        deck,
        playerCards,
        dealerCards,
        gameOver: false,
    };

    blackjackGames.set(userId, game);

    return createBlackjackPanel(userId, game);
}

/**
 * إنشاء لوحة لعبة ورق
 */
function createBlackjackPanel(userId, game) {
    const calculateHand = (cards) => {
        let total = 0;
        let aces = 0;

        for (const c of cards) {
            if (c.card === 'A') {
                aces++;
                total += 11;
            } else if (['K', 'Q', 'J'].includes(c.card)) {
                total += 10;
            } else {
                total += parseInt(c.card);
            }
        }

        while (total > 21 && aces > 0) {
            total -= 10;
            aces--;
        }

        return total;
    };

    const playerTotal = calculateHand(game.playerCards);
    const dealerTotal = calculateHand(game.dealerCards);

    const playerHand = game.playerCards.map(c => `${c.suit}${c.card}`).join(' ');
    const dealerHand = game.gameOver
        ? game.dealerCards.map(c => `${c.suit}${c.card}`).join(' ')
        : `${game.dealerCards[0].suit}${game.dealerCards[0].card} 🎴`;

    let result = '';
    if (game.gameOver) {
        if (playerTotal > 21) {
            result = '💥 خسرت! تجاوزت 21';
        } else if (dealerTotal > 21) {
            result = '🎉 فزت! الديلر تجاوز 21';
        } else if (playerTotal > dealerTotal) {
            result = '🎉 فزت!';
        } else if (playerTotal < dealerTotal) {
            result = '😢 خسرت!';
        } else {
            result = '🤝 تعادل!';
        }
    }

    const embed = new EmbedBuilder()
        .setColor(game.gameOver ? (result.includes('فزت') ? COLORS.SUCCESS : COLORS.ERROR) : COLORS.INFO)
        .setTitle('🃏 ورق (21)')
        .addFields(
            { name: '👤 يدك', value: `${playerHand}\nالمجموع: **${playerTotal}**`, inline: false },
            { name: '🤖 يد الديلر', value: `${dealerHand}\nالمجموع: **${game.gameOver ? dealerTotal : '?'}**`, inline: false },
        );

    if (result) {
        embed.addFields({ name: '📊 النتيجة', value: result, inline: false });
    }

    const components = [];
    if (!game.gameOver && playerTotal < 21) {
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`bj_${userId}_hit`)
                    .setLabel('خذ بطاقة')
                    .setEmoji('🃏')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`bj_${userId}_stand`)
                    .setLabel('توقف')
                    .setEmoji('✋')
                    .setStyle(ButtonStyle.Danger),
            );
        components.push(row);
    }

    return { embeds: [embed], components };
}

/**
 * اتخاذ قرار في لعبة ورق
 */
function blackjackAction(userId, action) {
    const game = blackjackGames.get(userId);
    if (!game || game.gameOver) return null;

    const calculateHand = (cards) => {
        let total = 0;
        let aces = 0;

        for (const c of cards) {
            if (c.card === 'A') {
                aces++;
                total += 11;
            } else if (['K', 'Q', 'J'].includes(c.card)) {
                total += 10;
            } else {
                total += parseInt(c.card);
            }
        }

        while (total > 21 && aces > 0) {
            total -= 10;
            aces--;
        }

        return total;
    };

    if (action === 'hit') {
        game.playerCards.push(game.deck.pop());
        const playerTotal = calculateHand(game.playerCards);

        if (playerTotal > 21) {
            game.gameOver = true;
        }
    } else if (action === 'stand') {
        // الديلر يلعب
        let dealerTotal = calculateHand(game.dealerCards);
        while (dealerTotal < 17) {
            game.dealerCards.push(game.deck.pop());
            dealerTotal = calculateHand(game.dealerCards);
        }
        game.gameOver = true;
    }

    return createBlackjackPanel(userId, game);
}

/**
 * التحقق من نتيجة Blackjack
 */
function getBlackjackResult(userId) {
    const game = blackjackGames.get(userId);
    if (!game) return null;

    const calculateHand = (cards) => {
        let total = 0;
        let aces = 0;

        for (const c of cards) {
            if (c.card === 'A') {
                aces++;
                total += 11;
            } else if (['K', 'Q', 'J'].includes(c.card)) {
                total += 10;
            } else {
                total += parseInt(c.card);
            }
        }

        while (total > 21 && aces > 0) {
            total -= 10;
            aces--;
        }

        return total;
    };

    const playerTotal = calculateHand(game.playerCards);
    const dealerTotal = calculateHand(game.dealerCards);

    if (playerTotal > 21) return -1;
    if (dealerTotal > 21) return 2;
    if (playerTotal > dealerTotal) return 2;
    if (playerTotal < dealerTotal) return -1;
    return 0; // تعادل
}

/**
 * حذف لعبة Blackjack
 */
function deleteBlackjackGame(userId) {
    blackjackGames.delete(userId);
}

// ═══════════════════════════════════════════════════════════════
// 📤 التصدير
// ═══════════════════════════════════════════════════════════════

module.exports = {
    // السلوتس
    createSlotsPanel,
    spinSlots,
    // تخمين الرقم
    createGuessNumberPanel,
    // النرد الكبير
    createBigDicePanel,
    rollBigDice,
    // ورق
    createBlackjackGame,
    createBlackjackPanel,
    blackjackAction,
    getBlackjackResult,
    deleteBlackjackGame,
};

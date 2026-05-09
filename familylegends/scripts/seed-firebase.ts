import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  console.error('❌ Missing Firebase Admin credentials in .env');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
  });
}

const db = admin.firestore();

const games = [
  { name: "GTA V", imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co2lbd.jpg" },
  { name: "Minecraft", imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co49x5.jpg" },
  { name: "Fortnite", imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co7xk1.jpg" },
  { name: "Valorant", imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co2mvt.jpg" },
  { name: "Call of Duty: Warzone", imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co7vbn.jpg" },
  { name: "Apex Legends", imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1x7z.jpg" },
  { name: "Counter-Strike 2", imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co7evc.jpg" },
  { name: "League of Legends", imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co49wj.jpg" }
];

const rules = [
  { title: "الاحترام المتبادل", description: "يجب على الجميع احترام بعضهم البعض وتجنب أي نوع من أنواع التنمر أو الإساءة." },
  { title: "لا للغش", description: "استخدام أي نوع من أنواع البرامج المساعدة أو الغش سيؤدي إلى الحظر النهائي." },
  { title: "المحتوى اللائق", description: "يمنع نشر أي محتوى غير لائق أو مخالف للآداب العامة في قنوات التواصل." },
  { title: "التعاون", description: "روح الفريق والتعاون هي أساس مجتمعنا، ساعد غيرك لتكبروا معاً." }
];

const team = [
  { name: "Admin", role: "Owner", imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" }
];

const settings = {
  name: "Family Legends",
  logoUrl: "/logo.png",
  discordInviteLink: "https://discord.gg/familylegends",
  copyright: "© 2024 Family Legends. All rights reserved.",
  audioMode: "music"
};

const audioTracks = [
  { title: "Main Theme", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", type: "music" }
];

const partners = [
  { name: "Partner 1", logoUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=Partner1", inviteUrl: "#", description: "وصف الشريك الأول" }
];

async function seed() {
  console.log('🚀 Starting Firebase Seeding...');

  try {
    // 1. Seed Games
    console.log('🎮 Seeding Games...');
    for (const game of games) {
      await db.collection('games').add({ ...game, timestamp: admin.firestore.FieldValue.serverTimestamp() });
    }

    // 2. Seed Rules
    console.log('📜 Seeding Rules...');
    for (const rule of rules) {
      await db.collection('rules').add({ ...rule, timestamp: admin.firestore.FieldValue.serverTimestamp() });
    }

    // 3. Seed Team
    console.log('👥 Seeding Team...');
    for (const member of team) {
      await db.collection('team').add({ ...member, timestamp: admin.firestore.FieldValue.serverTimestamp() });
    }

    // 4. Seed Settings
    console.log('⚙️ Seeding Settings...');
    await db.collection('settings').doc('general').set({
      ...settings,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // 5. Seed Audio
    console.log('🎵 Seeding Audio...');
    for (const track of audioTracks) {
      await db.collection('audioTracks').add({ ...track, timestamp: admin.firestore.FieldValue.serverTimestamp() });
    }

    // 6. Seed Partners
    console.log('🤝 Seeding Partners...');
    for (const partner of partners) {
      await db.collection('partners').add({ ...partner, timestamp: admin.firestore.FieldValue.serverTimestamp() });
    }

    console.log('\n✨ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    process.exit(0);
  }
}

seed();

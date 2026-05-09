/**
 * @file src/lib/fetch-data.ts
 * @description Server-side data fetching functions.
 * This file must NEVER be imported in Client Components ('use client').
 */

import { adminDb, serializeFirestoreData } from './firebase-admin';
import type { Rule, TeamMember, Streamer, Partner, Game, AudioTrack, CommunitySettings, DiscordServerStats } from './data';
import { cache as reactCache } from 'react';
import { connectBotDB } from './bot-mongodb';
import { GuildModel, UserModel, TicketModel, WarningModel } from './bot-schemas';
import redisCache, { CACHE_TTL } from './redis';

/**
 * جلب إحصائيات السيرفر الحقيقية من MongoDB مع Caching.
 */
export const getDiscordStats = reactCache(async (): Promise<DiscordServerStats | null> => {
  const cacheKey = 'discord_stats';
  const cachedData = await redisCache.get<DiscordServerStats>(cacheKey);
  if (cachedData) return cachedData;

  try {
    await connectBotDB();
    const guildId = process.env.NEXT_PUBLIC_GUILD_ID || '';
    if (!guildId) return null;

    const [totalMembers, onlineMembers] = await Promise.all([
      UserModel.countDocuments({ guildId }),
      UserModel.countDocuments({ guildId, isOnline: true }),
    ]);

    const stats = {
      totalMembers: totalMembers || 0,
      onlineMembers: onlineMembers || 0,
      boostCount: 0, 
      channelCount: 0,
      roleCount: 0,
      lastUpdated: Date.now()
    };

    await redisCache.set(cacheKey, stats, CACHE_TTL.GLOBAL_STATS);
    return stats;
  } catch (error) {
    console.error('Error fetching discord stats:', error);
    return null;
  }
});

/**
 * جلب إحصائيات عامة للموقع مع Caching.
 */
export const getGlobalStats = reactCache(async () => {
  const cacheKey = 'global_stats';
  const cachedData = await redisCache.get<any>(cacheKey);
  if (cachedData) return cachedData;

  try {
    await connectBotDB();
    const [totalUsers, totalTickets, totalWarnings] = await Promise.all([
      UserModel.countDocuments(),
      TicketModel.countDocuments(),
      WarningModel.countDocuments()
    ]);

    const stats = {
      totalUsers,
      totalTickets,
      totalWarnings,
      lastUpdated: Date.now()
    };

    await redisCache.set(cacheKey, stats, CACHE_TTL.GLOBAL_STATS);
    return stats;
  } catch (error) {
    console.error('Error fetching global stats:', error);
    return { totalUsers: 0, totalTickets: 0, totalWarnings: 0 };
  }
});

/**
 * جلب إعدادات المجتمع مع Caching.
 */
export const getCommunitySettings = reactCache(async (): Promise<CommunitySettings | null> => {
  const cacheKey = 'community_settings';
  const cachedData = await redisCache.get<CommunitySettings>(cacheKey);
  if (cachedData) return cachedData;

  try {
    const db = adminDb();
    if (!db) return null;
    const doc = await db.collection('settings').doc('community').get();
    if (!doc.exists) return null;
    const settings = serializeFirestoreData<CommunitySettings>({ id: doc.id, ...doc.data() });
    
    await redisCache.set(cacheKey, settings, CACHE_TTL.GUILD_SETTINGS);
    return settings;
  } catch (error) {
    console.error('Error fetching community settings:', error);
    return null;
  }
});

/**
 * جلب قوانين المجتمع.
 */
export const getRules = reactCache(async (): Promise<Rule[]> => {
  try {
    const db = adminDb();
    if (!db) return [];
    const snapshot = await db.collection('rules').orderBy('timestamp', 'asc').get();
    return snapshot.docs.map(doc => serializeFirestoreData<Rule>({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching rules:', error);
    return [];
  }
});

/**
 * جلب أعضاء الفريق.
 */
export const getTeam = reactCache(async (): Promise<TeamMember[]> => {
  try {
    const db = adminDb();
    if (!db) return [];
    const snapshot = await db.collection('team').orderBy('timestamp', 'asc').get();
    return snapshot.docs.map(doc => serializeFirestoreData<TeamMember>({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching team:', error);
    return [];
  }
});

/**
 * جلب الستريمرز.
 */
export const getStreamers = reactCache(async (): Promise<Streamer[]> => {
  try {
    const db = adminDb();
    if (!db) return [];
    const snapshot = await db.collection('streamers').orderBy('timestamp', 'asc').get();
    return snapshot.docs.map(doc => serializeFirestoreData<Streamer>({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching streamers:', error);
    return [];
  }
});

/**
 * جلب الشركاء.
 */
export const getPartners = reactCache(async (): Promise<Partner[]> => {
  try {
    const db = adminDb();
    if (!db) return [];
    const snapshot = await db.collection('partners').orderBy('timestamp', 'asc').get();
    return snapshot.docs.map(doc => serializeFirestoreData<Partner>({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching partners:', error);
    return [];
  }
});

/**
 * جلب الألعاب.
 */
export const getGames = reactCache(async (): Promise<Game[]> => {
  try {
    const db = adminDb();
    if (!db) return [];
    const snapshot = await db.collection('games').orderBy('timestamp', 'asc').get();
    return snapshot.docs.map(doc => serializeFirestoreData<Game>({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching games:', error);
    return [];
  }
});

/**
 * جلب مقاطع الصوت.
 */
export const getAudioTracks = reactCache(async (): Promise<AudioTrack[]> => {
  try {
    const db = adminDb();
    if (!db) return [];
    const snapshot = await db.collection('audio_tracks').orderBy('timestamp', 'asc').get();
    return snapshot.docs.map(doc => serializeFirestoreData<AudioTrack>({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching audio tracks:', error);
    return [];
  }
});

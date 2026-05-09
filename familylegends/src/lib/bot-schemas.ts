import mongoose, { Schema, Document } from 'mongoose';

// ─── Mod Config Schema ───
const modConfigSchema = new Schema({
  modRoleId: { type: String, default: '' },
  adminRoleId: { type: String, default: '' },
  mutedRoleId: { type: String, default: '' },
  logChannelId: { type: String, default: '' },
  maxWarnings: { type: Number, default: 3 },
  autoBan: { type: Boolean, default: false },
}, { _id: false, strict: true });

// ─── Welcome Config Schema ───
const welcomeConfigSchema = new Schema({
  enabled: { type: Boolean, default: false },
  channelId: { type: String, default: '' },
  message: { type: String, default: 'مرحباً بك في السيرفر، {user}!' },
  autoRoleId: { type: String, default: '' },
}, { _id: false, strict: true });

// ─── Protection Config Schema (NEW — individual toggles) ───
const antiSpamProtectionSchema = new Schema({
  enabled: { type: Boolean, default: false },
  maxMessages: { type: Number, default: 5 },
  interval: { type: Number, default: 5000 },
  punishment: { type: String, enum: ['timeout', 'kick', 'ban'], default: 'timeout' },
}, { _id: false, strict: true });

const antiLinkProtectionSchema = new Schema({
  enabled: { type: Boolean, default: false },
  allowedChannels: { type: [String], default: [] },
  allowedRoles: { type: [String], default: [] },
}, { _id: false, strict: true });

const antiInviteProtectionSchema = new Schema({
  enabled: { type: Boolean, default: false },
}, { _id: false, strict: true });

const antiCapsProtectionSchema = new Schema({
  enabled: { type: Boolean, default: false },
  minCapsPercentage: { type: Number, default: 70 },
  minCapsLength: { type: Number, default: 5 },
}, { _id: false, strict: true });

const antiSwearProtectionSchema = new Schema({
  enabled: { type: Boolean, default: false },
  customWords: { type: [String], default: [] },
}, { _id: false, strict: true });

const verificationConfigSchema = new Schema({
  enabled: { type: Boolean, default: false },
  roleId: { type: String, default: '' },
  channelId: { type: String, default: '' },
  message: { type: String, default: 'اضغط على الزر بالأسفل للتحقق والدخول للسيرفر.' },
}, { _id: false, strict: true });

const protectionConfigSchema = new Schema({
  antiSpam: { type: antiSpamProtectionSchema, default: () => ({}) },
  antiLink: { type: antiLinkProtectionSchema, default: () => ({}) },
  antiInvite: { type: antiInviteProtectionSchema, default: () => ({}) },
  antiCaps: { type: antiCapsProtectionSchema, default: () => ({}) },
  antiSwear: { type: antiSwearProtectionSchema, default: () => ({}) },
  antiMention: {
    type: new Schema({
      enabled: { type: Boolean, default: false },
      maxMentions: { type: Number, default: 5 },
      action: { type: String, default: 'timeout' },
    }, { _id: false }),
    default: () => ({})
  },
  antiNuke: {
    type: new Schema({
      enabled: { type: Boolean, default: false },
      maxChannelDelete: { type: Number, default: 3 },
      maxRoleDelete: { type: Number, default: 3 },
      maxKick: { type: Number, default: 5 },
      maxBan: { type: Number, default: 5 },
      action: { type: String, default: 'quarantine' },
    }, { _id: false }),
    default: () => ({})
  },
  verification: { type: verificationConfigSchema, default: () => ({}) },
}, { _id: false, strict: true });

// ─── Legacy Config Schemas (backward compatibility) ───
const antiSpamConfigSchema = new Schema({
  enabled: { type: Boolean, default: false },
  maxMessages: { type: Number, default: 5 },
  interval: { type: Number, default: 5000 },
  punishment: { type: String, enum: ['timeout', 'kick', 'ban'], default: 'timeout' },
}, { _id: false, strict: true });

const antiLinkConfigSchema = new Schema({
  enabled: { type: Boolean, default: false },
  allowedChannels: { type: [String], default: [] },
  allowedRoles: { type: [String], default: [] },
}, { _id: false, strict: true });

// ─── Economy Config Schema ───
const shopItemSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  emoji: { type: String, default: '📦' },
  description: { type: String, default: '' },
  roleId: { type: String, default: null }, // Optional: award a role when bought
}, { _id: false });

const economyConfigSchema = new Schema({
  enabled: { type: Boolean, default: true },
  currencyName: { type: String, default: 'عملات' },
  currencyEmoji: { type: String, default: '💰' },
  dailyMin: { type: Number, default: 500 },
  dailyMax: { type: Number, default: 1500 },
  workMin: { type: Number, default: 100 },
  workMax: { type: Number, default: 800 },
  shopItems: { type: [shopItemSchema], default: [] },
}, { _id: false, strict: true });

// ─── Music Config Schema ───
const musicConfigSchema = new Schema({
  defaultVolume: { type: Number, default: 80 },
  maxQueueSize: { type: Number, default: 100 },
  leaveOnEmpty: { type: Boolean, default: true },
  emptyCooldown: { type: Number, default: 60 },
}, { _id: false, strict: true });

// ─── AI Config Schema (NEW) ───
const aiConfigSchema = new Schema({
  enabled: { type: Boolean, default: false },
  channelId: { type: String, default: '' },
  model: { type: String, default: 'gemini-1.5-flash' },
  systemPrompt: { type: String, default: 'أنت مساعد ذكي في سيرفر ديسكورد.' },
  maxTokens: { type: Number, default: 500 },
}, { _id: false, strict: true });

// ─── Leveling Config Schema (NEW) ───
const levelingConfigSchema = new Schema({
  enabled: { type: Boolean, default: true },
  channelId: { type: String, default: '' }, // '' means current channel
  message: { type: String, default: 'مبروك {user}، لقد وصلت للمستوى {level}!' },
  xpRange: {
    min: { type: Number, default: 15 },
    max: { type: Number, default: 25 },
  },
  cooldown: { type: Number, default: 60000 }, // 1 minute
  roles: { type: Map, of: String, default: () => ({}) }, // level -> roleId
}, { _id: false, strict: true });

// ─── Guild Schema ───
const guildSchema = new Schema({
  guildId: { type: String, required: true, unique: true },
  mod: { type: modConfigSchema, default: () => ({}) },
  welcome: { type: welcomeConfigSchema, default: () => ({}) },
  protection: { type: protectionConfigSchema, default: () => ({}) },
  antiSpam: { type: antiSpamConfigSchema, default: () => ({}) },
  antiLink: { type: antiLinkConfigSchema, default: () => ({}) },
  economy: { type: economyConfigSchema, default: () => ({}) },
  music: { type: musicConfigSchema, default: () => ({}) },
  ai: { type: aiConfigSchema, default: () => ({}) },
  leveling: { type: levelingConfigSchema, default: () => ({}) },
  goodbye: {
    type: new Schema({
      enabled: { type: Boolean, default: false },
      channelId: { type: String, default: '' },
      message: { type: String, default: 'وداعاً {user}!' },
    }, { _id: false }),
    default: () => ({})
  },
  welcomeImage: {
    type: new Schema({
      enabled: { type: Boolean, default: false },
      background: { type: String, default: 'default' },
      font: { type: String, default: 'Cairo' },
      color: { type: String, default: '#FFFFFF' },
    }, { _id: false }),
    default: () => ({})
  },
  activityLog: { type: new Schema({ enabled: { type: Boolean, default: true } }, { _id: false, strict: true }), default: () => ({ enabled: true }) },
  modules: {
    moderation: { type: Boolean, default: true },
    economy: { type: Boolean, default: true },
    music: { type: Boolean, default: true },
    tickets: { type: Boolean, default: true },
    ai: { type: Boolean, default: true },
    giveaway: { type: Boolean, default: true },
    leveling: { type: Boolean, default: true },
  },
  services: {
    weather: { type: Boolean, default: true },
    delivery: { type: Boolean, default: true },
    prayer: { type: Boolean, default: true },
    currency: { type: Boolean, default: true },
  },
}, { strict: true });

// ─── Rule Schema (NEW) ───
const ruleSchema = new Schema({
  guildId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  order: { type: Number, default: 0 },
}, { timestamps: true });

// ─── User Schema ───
const inventoryItemSchema = new Schema({
  itemId: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  price: { type: Number, default: 0 },
}, { _id: false });

const userSchema = new Schema({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  roles: { type: [String], default: [] },
  balance: { type: Number, default: 0 },
  bank: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  totalMessages: { type: Number, default: 0 },
  dailyCooldown: { type: Date, default: null },
  workCooldown: { type: Date, default: null },
  robCooldown: { type: Date, default: null },
  streak: { type: Number, default: 0 },
  lastDaily: { type: Date, default: null },
  inventory: { type: [inventoryItemSchema], default: [] },
}, { _id: false, strict: true });

userSchema.index({ userId: 1, guildId: 1 }, { unique: true });

// ─── Warning Schema (NEW) ───
const warningSchema = new Schema({
  userId: { type: String, required: true, index: true },
  guildId: { type: String, required: true, index: true },
  moderatorId: { type: String, required: true },
  moderatorTag: { type: String, default: 'Unknown' },
  reason: { type: String, default: 'لم يتم تحديد سبب' },
  timestamp: { type: Date, default: Date.now },
}, { strict: true });

warningSchema.index({ userId: 1, guildId: 1 });

// ─── ModAction Schema (NEW) ───
const modActionSchema = new Schema({
  userId: { type: String, required: true, index: true },
  guildId: { type: String, required: true, index: true },
  moderatorId: { type: String, required: true },
  type: { type: String, enum: ['tempban', 'tempmute'], required: true },
  reason: { type: String, default: 'لم يتم تحديد سبب' },
  expiresAt: { type: Date, required: true, index: true },
  completed: { type: Boolean, default: false },
}, { timestamps: true, strict: true });

// ─── AutoResponder Schema (NEW) ───
const autoResponderSchema = new Schema({
  guildId: { type: String, required: true, index: true },
  trigger: { type: String, required: true },
  response: { type: String, required: true },
  exact: { type: Boolean, default: false },
}, { timestamps: true, strict: true });

// ─── Ticket Schema (NEW) ───
const ticketSchema = new Schema({
  guildId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  channelId: { type: String, required: true, unique: true },
  category: { type: String, default: 'General' },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  closedBy: { type: String, default: null },
  closedAt: { type: Date, default: null },
}, { timestamps: true, strict: true });

// ─── AuditLog Schema (NEW) ───
const auditLogSchema = new Schema({
  guildId: { type: String, required: true, index: true },
  eventType: { type: String, required: true, index: true },
  executorId: { type: String, default: null },
  executorTag: { type: String, default: null },
  targetId: { type: String, default: null },
  targetTag: { type: String, default: null },
  channelId: { type: String, default: null },
  reason: { type: String, default: null },
  metadata: { type: Schema.Types.Mixed, default: () => ({}) },
}, { timestamps: true, strict: true });

auditLogSchema.index({ guildId: 1, createdAt: -1 });

// ─── Giveaway Schema (NEW) ───
const giveawaySchema = new Schema({
  guildId: { type: String, required: true, index: true },
  channelId: { type: String, required: true },
  messageId: { type: String, required: true, unique: true },
  hostId: { type: String, required: true },
  hostTag: { type: String, default: null },
  prize: { type: String, required: true },
  winners: { type: Number, default: 1 },
  endAt: { type: Date, required: true, index: true },
  entries: { type: [String], default: [] },
  winnerIds: { type: [String], default: [] },
  ended: { type: Boolean, default: false },
  requirements: {
    requiredRole: { type: String, default: null },
    minAccountAge: { type: Number, default: 0 },
    minServerJoin: { type: Number, default: 0 },
  },
}, { timestamps: true, strict: true });

// ─── Stats Schema ───
const statsSchema = new Schema({
  guildId: { type: String, required: true, unique: true },
  totalMembers: { type: Number, default: 0 },
  onlineMembers: { type: Number, default: 0 },
  boostCount: { type: Number, default: 0 },
  channelCount: { type: Number, default: 0 },
  roleCount: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
}, { strict: true });

// ─── Models ───
export const GuildModel = mongoose.models.Guild || mongoose.model('Guild', guildSchema);
export const UserModel = mongoose.models.User || mongoose.model('User', userSchema);
export const WarningModel = mongoose.models.Warning || mongoose.model('Warning', warningSchema);
export const ModActionModel = mongoose.models.ModAction || mongoose.model('ModAction', modActionSchema);
export const AutoResponderModel = mongoose.models.AutoResponder || mongoose.model('AutoResponder', autoResponderSchema);
export const TicketModel = mongoose.models.Ticket || mongoose.model('Ticket', ticketSchema);
export const AuditLogModel = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
export const GiveawayModel = mongoose.models.Giveaway || mongoose.model('Giveaway', giveawaySchema);
export const StatsModel = mongoose.models.Stats || mongoose.model('Stats', statsSchema);
export const RuleModel = mongoose.models.Rule || mongoose.model('Rule', ruleSchema);

// ─── TypeScript Types ───
export interface IProtectionAntiSpam {
  enabled: boolean;
  maxMessages: number;
  interval: number;
  punishment: 'timeout' | 'kick' | 'ban';
}

export interface IProtectionAntiLink {
  enabled: boolean;
  allowedChannels: string[];
  allowedRoles: string[];
}

export interface IProtectionAntiInvite {
  enabled: boolean;
}

export interface IProtectionAntiCaps {
  enabled: boolean;
  minCapsPercentage: number;
  minCapsLength: number;
}

export interface IProtectionAntiSwear {
  enabled: boolean;
  customWords: string[];
}

export interface IProtectionConfig {
  antiSpam: IProtectionAntiSpam;
  antiLink: IProtectionAntiLink;
  antiInvite: IProtectionAntiInvite;
  antiCaps: IProtectionAntiCaps;
  antiSwear: IProtectionAntiSwear;
}

export interface IGuild extends Document {
  guildId: string;
  mod: {
    modRoleId: string;
    adminRoleId: string;
    mutedRoleId: string;
    logChannelId: string;
    maxWarnings: number;
    autoBan: boolean;
  };
  welcome: {
    enabled: boolean;
    channelId: string;
    message: string;
    autoRoleId: string;
  };
  protection?: IProtectionConfig;
  antiSpam?: IProtectionAntiSpam;
  antiLink?: IProtectionAntiLink;
  economy: {
    enabled: boolean;
    currencyName: string;
    currencyEmoji: string;
    dailyMin: number;
    dailyMax: number;
    workMin: number;
    workMax: number;
  };
  music: {
    defaultVolume: number;
    maxQueueSize: number;
    leaveOnEmpty: boolean;
    emptyCooldown: number;
  };
  activityLog?: { enabled: boolean };
  [key: string]: any;
}

export interface IInventoryItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface IUser extends Document {
  userId: string;
  guildId: string;
  balance: number;
  bank: number;
  level: number;
  xp: number;
  totalMessages: number;
  dailyCooldown: number;
  workCooldown: number;
  robCooldown: number;
  streak: number;
  lastDaily: number;
  inventory: IInventoryItem[];
}

export interface IWarning extends Document {
  userId: string;
  guildId: string;
  moderatorId: string;
  moderatorTag: string;
  reason: string;
  timestamp: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

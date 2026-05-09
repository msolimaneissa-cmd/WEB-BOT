// User roles and permissions
export type UserRole = 'User' | 'Moderator' | 'Admin' | 'ServerOwner';

export interface User {
  id: string;
  discordId: string;
  username: string;
  discriminator: string;
  avatar?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Server {
  id: string;
  discordId: string;
  name: string;
  icon?: string;
  ownerId: string;
  settings: ServerSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServerSettings {
  prefix: string;
  language: string;
  permissions: PermissionConfig;
  logging: LoggingConfig;
  welcome: WelcomeConfig;
  goodbye: GoodbyeConfig;
  tickets: TicketConfig;
  leveling: LevelingConfig;
  economy: EconomyConfig;
  moderation: ModerationConfig;
  music: MusicConfig;
  autoResponder: AutoResponderConfig;
  notifications: NotificationConfig;
  ai: AIConfig;
}

export interface PermissionConfig {
  adminRoles: string[];
  moderatorRoles: string[];
  restrictedRoles: string[];
  commandPermissions: CommandPermission[];
}

export interface CommandPermission {
  command: string;
  requiredRole: UserRole;
  allowedRoles: string[];
  deniedRoles: string[];
}

export interface LoggingConfig {
  enabled: boolean;
  channelId: string | null;
  events: LogEvent[];
}

export type LogEvent = 
  | 'message_delete'
  | 'message_update'
  | 'member_join'
  | 'member_leave'
  | 'member_ban'
  | 'member_unban'
  | 'channel_create'
  | 'channel_delete'
  | 'role_create'
  | 'role_delete'
  | 'voice_state_update'
  | 'moderation_action';

export interface WelcomeConfig {
  enabled: boolean;
  channelId: string | null;
  message: string;
  embed: boolean;
  image?: string;
  autoRoles: string[];
}

export interface GoodbyeConfig {
  enabled: boolean;
  channelId: string | null;
  message: string;
  embed: boolean;
  image?: string;
}

export interface TicketConfig {
  enabled: boolean;
  categoryId: string | null;
  transcriptChannelId: string | null;
  categories: TicketCategory[];
  autoClose: boolean;
  autoCloseTimeout: number;
  maxTicketsPerUser: number;
}

export interface TicketCategory {
  id: string;
  name: string;
  emoji: string;
  description: string;
  assignedRoles: string[];
  closedStatus: string[];
}

export interface LevelingConfig {
  enabled: boolean;
  xpPerMessage: number;
  xpCooldown: number;
  roleRewards: RoleReward[];
  rankCardStyle: string;
  excludedChannels: string[];
  excludedRoles: string[];
}

export interface RoleReward {
  level: number;
  roleId: string;
}

export interface EconomyConfig {
  enabled: boolean;
  currency: string;
  dailyAmount: number;
  workCommands: WorkCommand[];
  shopItems: ShopItem[];
}

export interface WorkCommand {
  id: string;
  name: string;
  minEarn: number;
  maxEarn: number;
  cooldown: number;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  type: 'role' | 'item' | 'badge';
  data: any;
}

export interface ModerationConfig {
  enabled: boolean;
  modLogChannelId: string | null;
  muteRoleId: string | null;
  automod: AutomodConfig;
  antiNuke: AntiNukeConfig;
}

export interface AutomodConfig {
  enabled: boolean;
  bannedWords: string[];
  bannedLinks: string[];
  spamDetection: boolean;
  mentionSpamThreshold: number;
  duplicateMessages: boolean;
}

export interface AntiNukeConfig {
  enabled: boolean;
  channelDeleteThreshold: number;
  roleDeleteThreshold: number;
  banThreshold: number;
  kickThreshold: number;
  timeoutDuration: number;
}

export interface MusicConfig {
  enabled: boolean;
  defaultVolume: number;
  allowedFilters: string[];
  queueLimit: number;
}

export interface AutoResponder {
  id: string;
  trigger: string;
  response: string;
  matchType: 'exact' | 'contains' | 'regex' | 'starts_with' | 'ends_with';
  caseSensitive: boolean;
  channels: string[];
  roles: string[];
  cooldown: number;
  enabled: boolean;
}

export interface AutoResponderConfig {
  enabled: boolean;
  responders: AutoResponder[];
}

export interface NotificationConfig {
  twitch: TwitchNotification[];
  youtube: YouTubeNotification[];
  twitter: TwitterNotification[];
  rss: RSSNotification[];
}

export interface TwitchNotification {
  channelId: string;
  twitchUsername: string;
  discordChannelId: string;
  message: string;
  enabled: boolean;
}

export interface YouTubeNotification {
  channelId: string;
  youtubeChannelId: string;
  discordChannelId: string;
  message: string;
  enabled: boolean;
}

export interface TwitterNotification {
  channelId: string;
  twitterUsername: string;
  discordChannelId: string;
  message: string;
  enabled: boolean;
}

export interface RSSNotification {
  channelId: string;
  feedUrl: string;
  discordChannelId: string;
  message: string;
  interval: number;
  enabled: boolean;
}

export interface AIConfig {
  enabled: boolean;
  provider: 'gemini' | 'openai' | 'local';
  apiKey?: string;
  personality: string;
  maxTokens: number;
  temperature: number;
  systemPrompt: string;
  allowedChannels: string[];
}

// Ticket types
export interface Ticket {
  id: string;
  serverId: string;
  userId: string;
  categoryId: string;
  channelId: string;
  status: 'open' | 'closed' | 'pending';
  createdAt: Date;
  closedAt?: Date;
  closedBy?: string;
  transcript?: string;
  messages: TicketMessage[];
}

export interface TicketMessage {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: Date;
  attachments: string[];
}

// Level & XP types
export interface UserLevel {
  userId: string;
  serverId: string;
  xp: number;
  level: number;
  messagesSent: number;
  voiceMinutes: number;
  lastXpGain: Date;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: (user: UserLevel) => boolean;
  reward?: {
    type: 'xp' | 'currency' | 'badge' | 'role';
    amount: number | string;
  };
}

// Economy types
export interface UserEconomy {
  userId: string;
  serverId: string;
  balance: number;
  bankBalance: number;
  dailyStreak: number;
  lastDaily: Date;
  lastWork: Date;
  inventory: InventoryItem[];
  badges: string[];
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  type: 'consumable' | 'permanent' | 'collectible';
  quantity: number;
  data?: any;
}

// Analytics types
export interface Analytics {
  serverId: string;
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  metrics: {
    messages: number;
    commands: number;
    newMembers: number;
    leftMembers: number;
    ticketsCreated: number;
    ticketsClosed: number;
    xpGiven: number;
    currencyTransferred: number;
  };
  topCommands: CommandUsage[];
  topUsers: UserActivity[];
}

export interface CommandUsage {
  command: string;
  count: number;
}

export interface UserActivity {
  userId: string;
  username: string;
  messages: number;
  xp: number;
  timeInVoice: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Auth types
export interface DiscordOAuth2Token {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: 'Bearer';
  scope: string;
}

export interface Session {
  id: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  createdAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthUser {
  id: string;
  discordId: string;
  username: string;
  discriminator: string;
  avatar?: string;
  guilds: UserGuild[];
}

export interface UserGuild {
  id: string;
  name: string;
  icon?: string;
  owner: boolean;
  permissions: string;
}

// Socket events
export interface SocketEvents {
  // Client to Server
  'join_server': (serverId: string) => void;
  'leave_server': (serverId: string) => void;
  'command_executed': (data: CommandExecutedData) => void;
  
  // Server to Client
  'server_update': (data: ServerSettings) => void;
  'ticket_created': (data: Ticket) => void;
  'ticket_updated': (data: Ticket) => void;
  'ticket_closed': (data: Ticket) => void;
  'new_message': (data: TicketMessage) => void;
  'level_up': (data: LevelUpData) => void;
  'economy_update': (data: UserEconomy) => void;
  'analytics_update': (data: Analytics) => void;
  'notification': (data: NotificationData) => void;
}

export interface CommandExecutedData {
  serverId: string;
  userId: string;
  command: string;
  args: string[];
  timestamp: Date;
}

export interface LevelUpData {
  userId: string;
  serverId: string;
  oldLevel: number;
  newLevel: number;
}

export interface NotificationData {
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
}

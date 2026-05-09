// This type definition is used to provide type safety for the community settings data
// that is now fetched from Firestore.
export type CommunitySettings = {
  id?: string; // Make id optional as it's not always present on new objects
  name: string;
  logoUrl: string;
  discordInviteLink: string;
  copyright: string;
  audioMode?: 'music' | 'quran';
};

export type Rule = {
  id: string;
  title: string;
  description: string;
  timestamp?: any;
};

export type SocialLinks = {
  twitter?: string;
  discord?: string;
  twitch?: string;
  youtube?: string;
  instagram?: string;
  facebook?: string;
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
  socialLinks?: SocialLinks;
  timestamp?: any;
};

export type Streamer = {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
  channelLink: string;
  socialLinks?: SocialLinks;
  isLive?: boolean; // Live status - manual or auto-updated
  timestamp?: any;
};

export type Partner = {
  id: string;
  name: string;
  logoUrl: string;
  inviteUrl: string;
  description: string;
  ownerName?: string;
  ownerUrl?: string;
  streamUrl?: string;
  socialLinks?: SocialLinks;
  timestamp?: any;
};

export type Game = {
  id: string;
  name: string;
  imageUrl: string;
  timestamp?: any;
};

export type AudioTrack = {
  id: string;
  title: string;
  url: string; // Direct MP3/audio URL
  type: 'music' | 'quran';
  artist?: string; // e.g., Sheikh's name or artist name
  timestamp?: any;
};

export type File = {
  id: string;
  fileName: string;
  fileUrl: string;
  iconClass: string;
  timestamp?: any;
};

// Alliance Request Types
export type AllianceRequestStatus = 'pending' | 'approved' | 'rejected';

export type AllianceRequest = {
  id: string;
  serverName: string;
  serverLogoUrl: string;
  inviteUrl: string;
  description: string;
  memberCount: number;
  ownerName: string;
  ownerDiscordId: string;
  ownerContact: string;
  socialLinks?: SocialLinks;
  streamUrl?: string;
  status: AllianceRequestStatus;
  rejectedReason?: string;
  reviewedBy?: string;
  reviewedAt?: any;
  timestamp?: any;
};

// Discord Activity Types
export type DiscordActivity = {
  type: 'streaming' | 'playing' | 'listening' | 'watching' | 'custom';
  name: string;
  details?: string;
  url?: string;
  platform?: string;
  startedAt?: number;
};

export type DiscordMember = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  isOnline: boolean;
  isStreaming: boolean;
  activity?: DiscordActivity;
  roles?: string[];
};

export type DiscordServerStats = {
  onlineMembers: number;
  totalMembers: number;
  boostCount: number;
  channelCount: number;
  roleCount: number;
  lastUpdated: number;
};
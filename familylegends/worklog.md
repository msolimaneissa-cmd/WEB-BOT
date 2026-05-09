---
## Task ID: 1 - fullstack-dev
### Work Task
Create 5 new/rewritten components and 4 API routes for the Family Legends Arabic gaming community website.

### Work Summary

#### Components Created/Rewritten:

1. **`/src/components/landing/alliance-request-modal.tsx`** — Beautiful modal form using shadcn Dialog with:
   - Full form validation (required fields, URL patterns, member count > 0)
   - POST to `/api/alliance-requests` on submit
   - Loading, success, and error states with Arabic messages
   - Gold gradient theme with glow effects and framer-motion animations
   - All labels in Arabic with lucide-react icons

2. **`/src/components/landing/discord-widget.tsx`** — Discord server stats widget with:
   - Fetches from `/api/discord-stats` with fallback data
   - Animated number counters using IntersectionObserver via `useInView`
   - Rotating activity feed (auto-cycles every 4 seconds)
   - Pulse animation on online indicator
   - Glass-morphism card with Discord blurple + gold accent colors
   - Auto-refreshes every 5 minutes

3. **`/src/components/landing/partners-section.tsx`** (rewritten) — Enhanced partners section with:
   - Featured partner card ("صديق مميز") for the first partner with larger layout
   - Animated gradient rotating borders on cards
   - Glass-morphism effects with gold accents
   - Green online indicators
   - Discord Widget and Discord Activity Feed in sidebar
   - Alliance request CTA card with benefits icons grid
   - Beautiful empty state with alliance request modal trigger

4. **`/src/components/landing/streamers-section.tsx`** (rewritten) — Enhanced streamers section with:
   - Auto-live polling every 60 seconds via `/api/streamers/check-live`
   - Toast notifications when streamers go live
   - Live streamers sorted to top with pulsing red border glow
   - Live count badge in header ("3 متصلين الآن 🔴")
   - Platform-specific badge colors (Twitch purple, YouTube red, etc.)
   - Last checked timestamp display with manual refresh button
   - Enhanced featured live streamer with platform badge

5. **`/src/components/landing/discord-activity-feed.tsx`** — Activity feed timeline with:
   - Vertical timeline design with color-coded dots
   - 10 demo activities (member joined, stream started, tournaments, etc.)
   - Staggered entrance animations
   - Show more/less toggle (5 visible initially)
   - Fetches from `/api/webhooks/discord` for future real data
   - Pulsing timeline dots per activity color

#### API Routes Created:

1. **`/src/app/api/alliance-requests/route.ts`** — POST endpoint with full server-side validation
2. **`/src/app/api/discord-stats/route.ts`** — GET endpoint using MongoDB for real stats with fallback
3. **`/src/app/api/streamers/check-live/route.ts`** — GET endpoint (ready for Twitch/YouTube API integration)
4. **`/src/app/api/webhooks/discord/route.ts`** — GET endpoint (ready for Discord webhook data)

All components use TypeScript strict types, Arabic RTL layout, framer-motion animations, and match the existing gold gaming aesthetic. No TypeScript compilation errors in the new files.

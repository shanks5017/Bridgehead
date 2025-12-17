## PLAN FOR COMMUNITY 
## 15/12/2025
## 11:30 AM

Community Hub Transformation: Premium Discussion Forum
Transform the Community page from a generic feed into a 10/10 Premium Discussion Forum with a 3-column "Holy Grail" layout that encourages active participation and connection.

Vision
Current State: Simple single-column feed (Twitter-like) with posts, likes, and reposts.

Target State: Premium "Town Hall" forum with:

Left Column: Topic/Channel navigation ("The Tribes")
Center Column: Discussion threads with focus on titles and replies ("The Discussions")
Right Column: Gamification and leaderboard ("The Hall of Fame")
Design Philosophy: "Cyberpunk Professional" - Deep Black (#050505), Dark Gray (#121212), Neon Red (#FF0000) accents.

User Review Required
IMPORTANT

Breaking Change: This is a complete UI overhaul of the Community page. The new layout will:

Replace the current single-column feed with a 3-column grid
Introduce topic-based navigation (channels)
Add gamification features (leaderboard)
Change the visual hierarchy to prioritize discussion titles over media
WARNING

Design Decision: Should we create a new component (CommunityHub.tsx) or refactor the existing 
CommunityFeed.tsx
?

Option A: Create new CommunityHub.tsx (allows A/B testing, easier rollback)
Option B: Refactor existing 
CommunityFeed.tsx
 (cleaner codebase, single source of truth)
Recommendation: Create new CommunityHub.tsx initially, then migrate once approved.

Proposed Changes
Component Structure
[NEW] 
CommunityHub.tsx
Complete rewrite of the Community page with the following structure:

Layout Architecture:

┌─────────────────────────────────────────────────────┐
│                    Header/Navbar                     │
├──────────┬───────────────────────────┬───────────────┤
│  Topics  │      Discussions          │  Leaderboard  │
│  (25%)   │         (50%)             │     (25%)     │
│  Sticky  │      Scrollable           │    Sticky     │
│          │                           │               │
│ #Startups│  ┌─────────────────────┐  │  🥇 User 1   │
│ #Events  │  │ Discussion Card     │  │  🥈 User 2   │
│ #Help    │  │ - Avatar + Title    │  │  🥉 User 3   │
│ #Showcase│  │ - Reply Count       │  │              │
│          │  │ - Avatar Pile       │  │  Top Posts   │
│          │  └─────────────────────┘  │  This Week   │
└──────────┴───────────────────────────┴───────────────┘
Key Features:

Mock Data: Self-contained with inline mock data for immediate testing
Inline Components: All sub-components defined within the file
Responsive: Mobile hides sidebars, shows only center column
Glassmorphism: Sticky sidebars use bg-[#121212]/80 backdrop-blur-md
Neon Glow: Red glow effects on active states and create post box
Component Breakdown:

Left Column: TopicSidebar
Vertical list of discussion topics/channels
Pill-shaped buttons with hover states
Active topic glows red
Sticky positioning (sticky top-20)
Topics: #Startups, #LocalEvents, #Help, #Showcase, #General
Center Column: DiscussionList
Create Post Box: Premium input with red-to-black gradient border and glow
Discussion Cards:
Row-based layout (avatar left, content right)
Bold white titles (18px)
Gray metadata (author, time, category)
Reply count with icon
Avatar pile footer (3 overlapping avatars + count)
Hover state: slight scale and glow
No large images: Focus on text and conversation
Right Column: Leaderboard
Top Contributors (top 5 users)
Gold/Silver/Bronze ring borders for top 3
Avatar + name + contribution count
Sticky positioning
Trending This Week section
Top 3 discussion titles
Click to navigate
Props Interface:

interface CommunityHubProps {
  posts: CommunityPost[];
  addPost: (content: string, media: MediaItem[]) => void;
  onLike: (id: string) => void;
  onRepost: (id: string) => void;
  onEditPost: (id: string, content: string, media: MediaItem[]) => void;
  onReply: (postId: string, content: string, media: MediaItem[]) => void;
  currentUser: User | null;
  setView: (view: View) => void;
}
Mock Data Structure:

const MOCK_TOPICS = [
  { id: 'startups', name: '#Startups', icon: '🚀', count: 42 },
  { id: 'events', name: '#LocalEvents', icon: '📅', count: 28 },
  { id: 'help', name: '#Help', icon: '🆘', count: 15 },
  { id: 'showcase', name: '#Showcase', icon: '✨', count: 31 },
  { id: 'general', name: '#General', icon: '💬', count: 89 },
];
const MOCK_DISCUSSIONS = [
  {
    id: '1',
    title: 'Looking for co-founder for coffee shop startup',
    author: 'Jane Doe',
    avatar: 'user1',
    topic: 'startups',
    replyCount: 12,
    recentRepliers: ['user2', 'user3', 'user4'],
    timestamp: '2h ago',
  },
  // ... more discussions
];
const MOCK_LEADERBOARD = [
  { id: '1', name: 'Alex Johnson', avatar: 'user1', contributions: 156, rank: 1 },
  { id: '2', name: 'Sarah Chen', avatar: 'user2', contributions: 142, rank: 2 },
  { id: '3', name: 'Mike Ross', avatar: 'user3', contributions: 128, rank: 3 },
  // ... more users
];
Styling Details
Color Palette:

--bg-deep-black: #050505
--bg-dark-gray: #121212
--neon-red: #FF0000
--text-white: #FFFFFF
--text-gray: #A0A0A0
--border-subtle: #333333
Key CSS Classes:

/* Glassmorphism Sidebar */
.sidebar-glass {
  background: rgba(18, 18, 18, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
/* Neon Red Glow */
.red-glow {
  box-shadow: 0 0 15px rgba(255, 0, 0, 0.3);
}
/* Active Topic Pill */
.topic-active {
  background: linear-gradient(135deg, #FF0000 0%, #8B0000 100%);
  box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
}
/* Discussion Card Hover */
.discussion-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(255, 0, 0, 0.15);
}
/* Leaderboard Rank Borders */
.rank-gold { border: 2px solid #FFD700; }
.rank-silver { border: 2px solid #C0C0C0; }
.rank-bronze { border: 2px solid #CD7F32; }
Responsive Breakpoints:

/* Mobile: Single column */
@media (max-width: 1023px) {
  .sidebar-left, .sidebar-right { display: none; }
  .center-column { width: 100%; }
}
/* Desktop: 3-column grid */
@media (min-width: 1024px) {
  .grid-container {
    display: grid;
    grid-template-columns: 1fr 2fr 1fr;
    gap: 1.5rem;
  }
}
Integration with App.tsx
[MODIFY] 
App.tsx
Changes Required:

Import new CommunityHub component
Update 
renderView()
 switch statement to use CommunityHub instead of 
CommunityFeed
Code Changes:

// Line 17: Add import
import CommunityHub from './components/CommunityHub';
// Line 795-803: Replace CommunityFeed with CommunityHub
case View.COMMUNITY_FEED:
  return <CommunityHub
    posts={communityPosts}
    addPost={addCommunityPost}
    onLike={handleLikePost}
    onRepost={handleRepostPost}
    onEditPost={handleEditPost}
    onReply={handleReplyPost}
    currentUser={currentUser}
    setView={handleSetView}
  />;
Note: Keep 
CommunityFeed.tsx
 in the codebase for now (don't delete) in case we need to rollback.

Verification Plan
Automated Tests
NOTE

No existing tests found for Community components. Manual testing will be primary verification method.

Future Test Coverage (not part of this implementation):

Component rendering tests
Topic filtering logic
Leaderboard sorting
Responsive layout breakpoints
Manual Verification
Test 1: Desktop Layout Verification
Steps:

Run the development server: npm run dev
Navigate to http://localhost:3000
Sign in with test account
Click on "Community" in the navigation
Verify:
✅ 3-column layout is visible (25% - 50% - 25%)
✅ Left sidebar shows topic list with icons
✅ Center shows discussion cards with titles
✅ Right sidebar shows leaderboard
✅ Sidebars are sticky when scrolling center column
✅ Glassmorphism effect visible on sidebars
Test 2: Mobile Responsiveness
Steps:

Open browser DevTools (F12)
Toggle device toolbar (Ctrl+Shift+M)
Select "iPhone 12 Pro" or similar mobile device
Navigate to Community page
Verify:
✅ Only center column visible
✅ Sidebars are hidden
✅ Discussion cards are full width
✅ Create post box is accessible
Test 3: Topic Navigation
Steps:

On desktop view, click different topics in left sidebar
Verify:
✅ Active topic has red glow
✅ Discussion list filters by selected topic
✅ Smooth transition between topics
Test 4: Create Discussion
Steps:

Click in the "What's on your mind?" input box
Type a discussion title and content
Click "Post" button
Verify:
✅ Red glow appears on input box when focused
✅ New discussion appears at top of list
✅ Discussion card shows correct format (avatar, title, metadata)
Test 5: Leaderboard Display
Steps:

Scroll down the discussion list
Observe right sidebar
Verify:
✅ Leaderboard remains sticky
✅ Top 3 users have gold/silver/bronze borders
✅ Contribution counts are visible
✅ "Trending This Week" section shows top discussions
Test 6: Visual Polish
Steps:

Hover over discussion cards
Hover over topic pills
Click on various elements
Verify:
✅ Smooth hover animations (scale, glow)
✅ Neon red accents on interactive elements
✅ Consistent dark theme (#050505, #121212)
✅ Typography hierarchy is clear (bold titles, gray metadata)
Test 7: Integration with Existing Features
Steps:

Navigate to Community page
Click on a discussion
Reply to a discussion
Like a discussion
Verify:
✅ Existing like/reply functionality still works
✅ Reply count updates correctly
✅ Avatar pile shows recent repliers
✅ No console errors
Implementation Notes
Development Approach
Create CommunityHub.tsx as a standalone component
Use inline mock data for immediate visual testing
Implement all sub-components within the same file initially
Test thoroughly before integrating with 
App.tsx
Once approved, can extract sub-components into separate files if needed
Performance Considerations
Use React.memo for discussion cards to prevent unnecessary re-renders
Implement virtual scrolling if discussion list grows large (future enhancement)
Lazy load avatars with skeleton placeholders
Accessibility
Ensure keyboard navigation works for topic selection
Add ARIA labels to interactive elements
Maintain focus management when switching topics
Future Enhancements (Not in Scope)
Real-time updates via WebSocket
Search functionality within discussions
Pinned discussions
User reputation system
Notification system for replies
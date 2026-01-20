# 🎨 UI/UX Plans - Bridgehead

> **Document Version**: 1.0  
> **Last Updated**: December 24, 2025  
> **Parent Document**: [plans.md](file:///d:/og%20project/Bridgehead/docs/plans.md)  
> **Priority**: 🟢 ONGOING

---

## 📋 Table of Contents

1. [Current UX Issues](#current-ux-issues)
2. [Custom Cursor Optimization](#custom-cursor-optimization)
3. [Sidebar Animation Polish](#sidebar-animation-polish)
4. [Post Button Discoverability](#post-button-discoverability)
5. [Image Consistency](#image-consistency)
6. [Mobile Experience](#mobile-experience)
7. [Loading States](#loading-states)
8. [Questions for Clarification](#questions-for-clarification)

---

## 📍 Current UX Issues

### Issue Summary (from project_analysis.md)

| Component | Issue | Priority |
|-----------|-------|----------|
| Custom Cursor | Delay on page load | 🟡 MEDIUM |
| Sidebar Animation | Feels casual, not premium | 🟡 MEDIUM |
| Post Button | Hidden/not discoverable | 🔴 HIGH |
| Image Sizing | Inconsistent across cards | 🟡 MEDIUM |
| Rental Hero | Not clickable | 🔴 HIGH |
| Loading States | Some missing | 🟢 LOW |

---

## 🖱️ Custom Cursor Optimization

### Current Implementation

```typescript
// CustomCursor.tsx
// Uses requestAnimationFrame with lerp physics
// Issue: 300ms+ delay before cursor becomes visible
```

### Proposed Fixes

1. **Instant Initialization**: Show cursor immediately, don't wait for React mount
2. **CSS-First Approach**: Use CSS for basic cursor, JS for enhancements
3. **Reduce Animation Delay**: Lower lerp factor from 0.25 to 0.15

```css
/* Add to index.html for instant cursor */
body {
  cursor: none;
}

.cursor-dot {
  position: fixed;
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
  pointer-events: none;
  z-index: 9999;
  opacity: 1; /* Visible immediately */
}
```

---

## 📱 Sidebar Animation Polish

### Current Issue

```typescript
// Using: transition-transform duration-300 ease-in-out
// Problem: Linear easing feels mechanical
```

### Premium Animation Curve

```css
/* Custom premium easing */
.sidebar {
  transition: transform 350ms cubic-bezier(0.32, 0.72, 0, 1);
}

/* Staggered content animation */
.sidebar-item {
  opacity: 0;
  transform: translateX(-20px);
  transition: all 200ms cubic-bezier(0.32, 0.72, 0, 1);
}

.sidebar-open .sidebar-item {
  opacity: 1;
  transform: translateX(0);
}

.sidebar-item:nth-child(1) { transition-delay: 50ms; }
.sidebar-item:nth-child(2) { transition-delay: 100ms; }
.sidebar-item:nth-child(3) { transition-delay: 150ms; }
```

---

## 🔘 Post Button Discoverability

### Current Issue

- QuickPostButton at `bottom-24 right-6` with just `+` icon
- New users don't know what it does

### Solution: Hybrid Approach

1. **Navbar "Post" Dropdown**: Visible action in navigation
2. **Floating Button**: Keep for power users
3. **First-Time Tooltip**: Show hint on first visit

```typescript
// components/PostButtonDropdown.tsx (NEW)
const PostButtonDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
      >
        + Post
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[#181818] rounded-lg shadow-xl">
          <button onClick={() => setView(View.POST_DEMAND)}>
            Post a Demand
          </button>
          <button onClick={() => setView(View.POST_RENTAL)}>
            List a Rental
          </button>
        </div>
      )}
    </div>
  );
};
```

---

## 🖼️ Image Consistency

### Current Issue

- Different aspect ratios across DemandCard, RentalCard, CommunityPostCard
- No unified image container

### Solution: Unified ImageContainer

```typescript
// components/common/ImageContainer.tsx (ENHANCE)
interface ImageContainerProps {
  src: string;
  alt: string;
  aspectRatio: '16:9' | '4:3' | '1:1' | '21:9';
  className?: string;
}

const ASPECT_RATIOS = {
  '16:9': 'aspect-video',      // 56.25%
  '4:3': 'aspect-[4/3]',       // 75%
  '1:1': 'aspect-square',      // 100%
  '21:9': 'aspect-[21/9]',     // 42.86% (cinematic)
};

export const ImageContainer: React.FC<ImageContainerProps> = ({
  src, alt, aspectRatio, className
}) => (
  <div className={`relative overflow-hidden ${ASPECT_RATIOS[aspectRatio]} ${className}`}>
    <img 
      src={src} 
      alt={alt}
      className="absolute inset-0 w-full h-full object-cover"
      loading="lazy"
    />
  </div>
);
```

### Standard Aspect Ratios

| Card Type | Aspect Ratio | Use |
|-----------|--------------|-----|
| Rental Hero | 21:9 | Full-width cinematic |
| Rental Card | 16:9 | Standard video ratio |
| Demand Card | 4:3 | Compact photo ratio |
| Community Post | Auto | Variable with max-height |
| Profile Avatar | 1:1 | Square |

---

## 📱 Mobile Experience

### Current Issues

- Desktop-focused design
- Sidebars hidden on mobile (good)
- No bottom navigation

### Mobile Improvements

1. **Bottom Navigation Bar**: Quick access on mobile
2. **Swipe Gestures**: Natural navigation
3. **Faster Post Flow**: Simplified mobile posting

```tsx
// components/MobileNavBar.tsx (NEW - mobile only)
const MobileNavBar = () => (
  <nav className="fixed bottom-0 left-0 right-0 bg-[#0D0D0D] border-t border-[#333] 
                  flex justify-around items-center h-16 lg:hidden">
    <NavItem icon={HomeIcon} label="Home" view={View.HOME} />
    <NavItem icon={MagnifyingGlassIcon} label="Explore" view={View.FEED} />
    <NavItem icon={PlusCircleIcon} label="Post" view={View.POST_DEMAND} />
    <NavItem icon={ChatBubbleIcon} label="Messages" view={View.COLLABORATION} />
    <NavItem icon={UserIcon} label="Profile" view={View.PROFILE} />
  </nav>
);
```

---

## ⏳ Loading States

### Current State

- Some skeletons exist
- Inconsistent loading indicators

### Standard Loading Components

```tsx
// components/common/SkeletonCard.tsx
export const SkeletonCard = () => (
  <div className="animate-pulse bg-[#181818] rounded-xl p-4">
    <div className="aspect-video bg-[#333] rounded-lg mb-4" />
    <div className="h-4 bg-[#333] rounded w-3/4 mb-2" />
    <div className="h-3 bg-[#333] rounded w-1/2" />
  </div>
);

// components/common/SkeletonFeed.tsx
export const SkeletonFeed = ({ count = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);
```

---

## ❓ Questions for Clarification

### Post Button
1. **Post Button Location**: Which approach?
   - [ ] Option A: Navbar dropdown only
   - [ ] Option B: Floating button with tooltip
   - [ ] Option C: Both (recommended)

### Mobile
2. **Bottom Navigation**: Implement for mobile?
   - [ ] Yes (better mobile UX)
   - [ ] No (keep current)

### Animations
3. **Animation Level**: How premium?
   - [ ] Subtle (minimal, performant)
   - [ ] Balanced (noticeable but not excessive)
   - [ ] Maximum (every interaction animated)

### Loading
4. **Loading Style**: Preference?
   - [ ] Skeletons (recommended)
   - [ ] Spinners
   - [ ] Progress bars

---

## 📁 Files to Create/Modify

### New Files

| File | Purpose | Priority |
|------|---------|----------|
| `components/PostButtonDropdown.tsx` | Navbar post button | 🔴 HIGH |
| `components/MobileNavBar.tsx` | Mobile bottom nav | 🟡 MEDIUM |
| `components/common/SkeletonCard.tsx` | Loading skeleton | 🟡 MEDIUM |

### Files to Modify

| File | Changes | Priority |
|------|---------|----------|
| `components/CustomCursor.tsx` | Reduce delay | 🟡 MEDIUM |
| `components/Sidebar.tsx` | Premium animation | 🟡 MEDIUM |
| `components/Header.tsx` | Add post dropdown | 🔴 HIGH |
| `RentalListings.tsx` | Make hero clickable | 🔴 HIGH |
| All card components | Unified image sizing | 🟡 MEDIUM |

---

*Last updated: December 24, 2025*

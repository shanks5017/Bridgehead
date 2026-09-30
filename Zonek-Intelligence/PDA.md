# 🚀 **BRIDGEHEAD CHROME EXTENSION - COMPLETE PROJECT SPECIFICATION**

I'll create comprehensive PDAs and detailed prompts for building this enterprise-grade Chrome Extension. Let me start by creating the detailed specifications:

---

# 📋 **PDA #1: BRIDGEHEAD CHROME EXTENSION ARCHITECTURE**

```markdown
# Product Design Architecture (PDA)
## BRIDGEHEAD CHROME EXTENSION - Intelligent Web Data Extraction Tool

### Table of Contents
1. [Executive Summary](#executive-summary)
2. [Product Overview](#product-overview)
3. [User Research & Personas](#user-research--personas)
4. [Product Vision & Goals](#product-vision--goals)
5. [Architecture Overview](#architecture-overview)
6. [Extension Architecture](#extension-architecture)
7. [Content Extraction Engine](#content-extraction-engine)
8. [Auto-Scrolling & Pagination](#auto-scrolling--pagination)
9. [Data Processing & Normalization](#data-processing--normalization)
10. [UI/UX Design](#uiux-design)
11. [Component Architecture](#component-architecture)
12. [Security & Privacy](#security--privacy)
13. [Performance Architecture](#performance-architecture)
14. [Testing Strategy](#testing-strategy)
15. [Deployment & Installation](#deployment--installation)

---

## Executive Summary

**Project Name:** Bridgehead Chrome Extension - Intelligent Web Data Extraction Tool

**Version:** 1.0 (Initial Release)

**Objective:** Build a production-grade Chrome Extension that intelligently extracts structured data from any website, handles pagination/infinite scroll, and normalizes the data for further processing.

**Scope:**
- Chrome Extension (Manifest V3)
- TypeScript + React for UI
- Content extraction engine
- Auto-scrolling simulation
- Data normalization
- Local processing (no external APIs)

**Timeline:** 4 weeks (Phase 1)

**Tech Stack:**
- Browser: Chrome 90+
- Frontend: TypeScript, React 18+
- Build Tool: Webpack
- Testing: Jest, Playwright
- Storage: Chrome Storage API, IndexedDB

**Success Metrics:**
- Extract accuracy: >95%
- Page load compatibility: >90%
- Data quality score: >90/100
- User satisfaction: 4.5+/5.0
- Scroll handling: 0 hallucinations

---

## Product Overview

### What is Bridgehead Chrome Extension?

A powerful, user-friendly Chrome Extension that:

**Core Features:**
1. ✅ Automatic website detection
2. ✅ One-click data extraction
3. ✅ Intelligent scrolling simulation
4. ✅ Data normalization & cleaning
5. ✅ Structured JSON export
6. ✅ Real-time progress tracking
7. ✅ Error detection & recovery
8. ✅ Data preview & editing

### Use Cases

| Use Case | User | Flow | Benefit |
|----------|------|------|---------|
| **Research Competition** | Data Analyst | Open site → Click Extract → Download JSON | Quick competitive analysis |
| **B2B Lead Gen** | Sales Rep | Browse listings → Extract all → Send to system | 10x faster lead collection |
| **Price Monitoring** | E-commerce | Monitor product pages → Track changes | Automated price tracking |
| **Job Board Scraping** | HR | Open job portal → Extract all listings → Export | Fast applicant filtering |
| **Real Estate Listings** | Agent | Browse properties → Extract details → Generate report | Streamlined property analysis |

### Key Differentiators

```
Feature                    Our Extension    Manual Methods
─────────────────────────────────────────────────────────
Time to extract 1000 items    5 minutes      8+ hours
Data accuracy                  95%           85% (human error)
Pagination handling           Automatic      Manual
Data cleaning                 Automatic      Manual
Cost                          Free           Time cost
Skill required                None           High
```

---

## User Research & Personas

### Research Findings

**Finding 1: Manual Data Extraction is Time-Consuming**
- Users spend 8+ hours manually copying data from websites
- Copy-paste errors occur in 15-20% of entries
- Need: **Automated extraction with high accuracy**

**Finding 2: Pagination Frustration**
- Most websites have pagination/infinite scroll
- Manual scrolling triggers different elements loading
- Users miss data or get duplicate entries
- Need: **Smart pagination handling without hallucination**

**Finding 3: Data Format Issues**
- Extracted data is often messy (HTML tags, extra spaces)
- Needs significant cleaning before use
- Format varies between websites
- Need: **Automatic data normalization**

**Finding 4: Privacy Concerns**
- Users hesitate to upload data to cloud services
- Want local-first processing
- Need: **Client-side processing, no external APIs**

### User Personas

**Persona 1: Rajesh (Data Analyst)**
- Age: 28, Experience: 5 years
- Goal: Extract competitive intelligence quickly
- Pain: Manual copying takes 8+ hours
- Tech-savvy: High
- Needs: Accurate extraction, CSV/JSON export

**Persona 2: Priya (Sales Manager)**
- Age: 35, Experience: 8 years
- Goal: Generate leads from listing websites
- Pain: Can't scrape multiple pages efficiently
- Tech-savvy: Medium
- Needs: Easy to use, automatic pagination

**Persona 3: Amit (E-commerce Manager)**
- Age: 32, Experience: 6 years
- Goal: Monitor competitor prices
- Pain: Websites change structure frequently
- Tech-savvy: Medium
- Needs: Flexible extraction, auto-updates

---

## Product Vision & Goals

### Vision Statement

> **"Empower anyone to extract and utilize web data instantly, without coding, without limits, and without leaving their browser."**

### Strategic Goals

| Goal | Target | Metric |
|------|--------|--------|
| **Ease of Use** | Zero learning curve | 95% users extract data on first try |
| **Accuracy** | >95% extraction | <5% data validation errors |
| **Performance** | <30s for 100 items | P95 latency target |
| **Compatibility** | 90% of websites | No site-specific config needed |
| **User Adoption** | 10K+ users | 1K downloads in first month |

### Success Metrics

**User Metrics:**
- Daily active users: 500+
- Feature adoption: >80%
- User retention (7-day): >60%
- NPS score: >50
- Error rate: <2%

**Technical Metrics:**
- Extraction accuracy: >95%
- Page load time: <100ms
- Memory usage: <50MB
- Scroll handling: 0 missed items

---

## Architecture Overview

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CHROME BROWSER                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ CONTENT SCRIPTS (Run in page context)                  │    │
│  │ ├─ DOM Inspector                                       │    │
│  │ ├─ Page Analyzer                                       │    │
│  │ ├─ Scroll Manager                                      │    │
│  │ ├─ Event Listeners                                     │    │
│  │ └─ Data Extractor                                      │    │
│  └────────────────────────────────────────────────────────┘    │
│                              ↑↓                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ BACKGROUND SERVICE WORKER                              │    │
│  │ ├─ Message Handler                                     │    │
│  │ ├─ Storage Manager                                     │    │
│  │ ├─ Data Processor                                      │    │
│  │ ├─ Export Manager                                      │    │
│  │ └─ Error Logger                                        │    │
│  └────────────────────────────────────────────────────────┘    │
│                              ���↓                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ POPUP UI (React SPA)                                   │    │
│  │ ├─ Dashboard Component                                 │    │
│  │ ├─ Extraction Status                                   │    │
│  │ ├─ Data Preview                                        │    │
│  │ ├─ Settings & Config                                   │    │
│  │ └─ Export Manager                                      │    │
│  └────────────────────────────────────────────────────────┘    │
│                              ↑↓                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ SIDE PANEL (Optional)                                  │    │
│  │ ├─ Live Preview                                        │    │
│  │ ├─ Extraction Progress                                 │    │
│  │ ├─ Data Editor                                         │    │
│  │ └─ Quick Actions                                       │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ LOCAL STORAGE                                          │    │
│  │ ├─ Chrome Storage API (Settings, Preferences)          │    │
│  │ ├─ IndexedDB (Cached extractions)                      │    │
│  │ ├─ LocalStorage (Session data)                         │    │
│  │ └─ SessionStorage (Temporary data)                     │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Extension Architecture

### Manifest V3 Structure

**manifest.json:**
```json
{
  "manifest_version": 3,
  "name": "Bridgehead Data Extractor",
  "version": "1.0.0",
  "description": "Intelligent web data extraction tool",
  
  "permissions": [
    "storage",
    "activeTab",
    "scripting",
    "tabs",
    "webRequest"
  ],
  
  "host_permissions": [
    "<all_urls>"
  ],
  
  "background": {
    "service_worker": "service-worker.js"
  },
  
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content-script.js"],
      "run_at": "document_start"
    }
  ],
  
  "action": {
    "default_title": "Bridgehead Data Extractor",
    "default_popup": "popup.html",
    "default_icons": {
      "16": "images/icon-16.png",
      "32": "images/icon-32.png",
      "48": "images/icon-48.png",
      "128": "images/icon-128.png"
    }
  },
  
  "side_panel": {
    "default_path": "sidepanel.html"
  },
  
  "icons": {
    "16": "images/icon-16.png",
    "48": "images/icon-48.png",
    "128": "images/icon-128.png"
  }
}
```

### Directory Structure

```
bridgehead-extension/
├── public/
│   ├── manifest.json
│   ├── popup.html
│   ├── sidepanel.html
│   └── images/
│       ├── icon-16.png
│       ├── icon-48.png
│       └── icon-128.png
│
├── src/
│   ├── background/
│   │   ├── service-worker.ts
│   │   ├── message-handler.ts
│   │   ├── storage-manager.ts
│   │   ├── data-processor.ts
│   │   └── export-manager.ts
│   │
│   ├── content/
│   │   ├── content-script.ts
│   │   ├── dom-inspector.ts
│   │   ├── page-analyzer.ts
│   │   ├── scroll-manager.ts
│   │   ├── data-extractor.ts
│   │   └── event-listeners.ts
│   │
│   ├── popup/
│   │   ├── components/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── ExtractButton.tsx
│   │   │   ├── StatusDisplay.tsx
│   │   │   ├── DataPreview.tsx
│   │   │   ├── Settings.tsx
│   │   │   └── ExportOptions.tsx
│   │   ├── hooks/
│   │   │   ├── useExtraction.ts
│   │   │   ├── useStorage.ts
│   │   │   └── useMessage.ts
│   │   ├── App.tsx
│   │   └── popup.css
│   │
│   ├── sidepanel/
│   │   ├── components/
│   │   │   ├── SidePanel.tsx
│   │   │   ├── ProgressTracker.tsx
│   │   │   ├── DataEditor.tsx
│   │   │   └── QuickActions.tsx
│   │   ├── App.tsx
│   │   └── sidepanel.css
│   │
│   ├── shared/
│   │   ├── types/
│   │   │   ├── extension.types.ts
│   │   │   ├── extraction.types.ts
│   │   │   ├── messages.types.ts
│   │   │   └── storage.types.ts
│   │   ├── utils/
│   │   │   ├── dom-utils.ts
│   │   │   ├── data-utils.ts
│   │   │   ├── storage-utils.ts
│   │   │   ├── logger.ts
│   │   │   └── error-handler.ts
│   │   ├── constants/
│   │   │   ├── selectors.ts
│   │   │   ├── errors.ts
│   │   │   └── config.ts
│   │   └── config/
│   │       └── settings.ts
│   │
│   └── index.tsx (common entry point)
│
├── tests/
│   ├── unit/
│   │   ├── dom-inspector.test.ts
│   │   ├── data-extractor.test.ts
│   │   ├── scroll-manager.test.ts
│   │   └── data-processor.test.ts
│   ├── integration/
│   │   ├── extraction-flow.test.ts
│   │   └── scroll-extraction.test.ts
│   └── e2e/
│       └── full-extraction.test.ts
│
├── .env.example
├── webpack.config.js
├── tsconfig.json
├── package.json
├── README.md
└── ARCHITECTURE.md
```

---

## Content Extraction Engine

### Data Extraction Pipeline

```
1. PAGE ANALYSIS
   ├─ Detect page structure
   ├─ Identify content containers
   ├─ Find data patterns
   └─ Analyze DOM tree

2. PATTERN RECOGNITION
   ├─ Find repeating elements
   ├─ Identify field types
   ├─ Extract field mappings
   └─ Build extraction schema

3. DATA EXTRACTION
   ├─ Extract text content
   ├─ Extract attributes (href, src, etc)
   ├─ Handle nested data
   └─ Clean whitespace

4. NORMALIZATION
   ├─ Standardize formats
   ├─ Clean special characters
   ├─ Fix encoding issues
   ├─ Deduplicate records
   └─ Remove null values

5. VALIDATION
   ├─ Type checking
   ├─ Schema validation
   ├─ Quality scoring
   └─ Error flagging

6. OUTPUT
   ├─ Generate JSON
   ├─ Store in local DB
   ├─ Prepare for export
   └─ Send to Bridgehead
```

### Smart DOM Analysis

```typescript
interface ExtractionSchema {
  containerSelector: string;      // e.g., '.product-card'
  fields: {
    [fieldName: string]: {
      selector: string;            // CSS selector
      attribute?: string;          // href, src, etc
      type: 'text' | 'url' | 'email' | 'phone' | 'number' | 'date';
      required: boolean;
      transformer?: (value: string) => any;
    }
  };
  pagination?: {
    type: 'pagination' | 'infinite-scroll' | 'load-more';
    nextButtonSelector?: string;
    loadMoreSelector?: string;
    pageParam?: string;
  };
}
```

### Field Type Detection Algorithm

```
Input: HTML Element + Text Content
  ↓
TYPE DETECTION
├─ Phone Number?
│  └─ Match regex: /(\+\d{1,3})?[\s\-]?\d{10,}/
├─ Email?
│  └─ Match regex: /[\w\.-]+@[\w\.-]+\.\w+/
├─ URL?
│  └─ Match regex: /https?:\/\/[^\s]+/
├─ Date?
│  └─ Match: DD/MM/YYYY, YYYY-MM-DD, etc
├─ Number?
│  └─ Parse as float/int
└─ Text?
   └─ Default (string)
  ↓
OUTPUT: Typed value
```

---

## Auto-Scrolling & Pagination

### Intelligent Scrolling System

```
┌─────────────────────────────────────────┐
│ DETECT PAGINATION TYPE                  │
├─────────────────────────────────────────┤
│                                         │
│ Check for:                              │
│ 1. Pagination buttons (.pagination)     │
│ 2. Infinite scroll (scroll listener)    │
│ 3. Load more button (#load-more)        │
│ 4. AJAX pagination (data-page attr)     │
│                                         │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ EXTRACT CURRENT PAGE                    │
├─────────────────────────────────────────┤
│                                         │
│ 1. Get all visible items                │
│ 2. Hash each item (deduplicate)         │
│ 3. Store in memory                      │
│ 4. Update progress                      │
│                                         │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ TRIGGER NEXT PAGE                       │
├─────────────────────────────────────────┤
│                                         │
│ Option 1: Click next button             │
│ Option 2: Scroll to bottom              │
│ Option 3: Click "Load More"             │
│ Option 4: Request next URL              │
│                                         │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ WAIT FOR NEW ITEMS                      │
├─────────────────────────────────────────┤
│                                         │
│ 1. Monitor DOM for changes              │
│ 2. Wait for new items (max 10s)         │
│ 3. If timeout, try again (3 retries)    │
│ 4. If success, continue                 │
│ 5. If failed, mark as incomplete        │
│                                         │
└────────────┬────────────────────────────┘
             │
             ▼
             Continue or Stop?
             │
             ├─ More pages? → Repeat
             └─ No more? → Finish
```

### Scroll Manager Implementation

**Key Features:**
1. **Smart Scrolling** - Detects actual content vs ads
2. **Deduplication** - Tracks seen items by hash
3. **Timeout Handling** - Waits max 10s per page
4. **Retry Logic** - 3 attempts before giving up
5. **Memory Management** - Cleans up old DOM refs
6. **Progress Tracking** - Reports every 10 items

**Anti-Hallucination Safeguards:**
```typescript
interface ScrollState {
  previousPageHash: string;           // Hash of last page items
  maxRetries: number;                 // Max 3
  timeoutMs: number;                  // Max 10000ms
  minNewItems: number;                // At least 1 new item
  maxScrollAttempts: number;          // Max 5 scroll attempts
  seenItemHashes: Set<string>;        // Track all items ever seen
  errorCount: number;                 // Track errors
}

// If no new items after 10 seconds AND 5 scroll attempts
// → Assume end of page reached
// → Don't hallucinate more data
```

---

## Data Processing & Normalization

### Data Cleaning Pipeline

```
Raw HTML
  ↓
1. TRIM & WHITESPACE
   ├─ Remove leading/trailing spaces
   ├─ Collapse multiple spaces
   ├─ Remove line breaks
   └─ Output: "Clean Text"
  ↓
2. HTML ENTITY DECODE
   ├─ &nbsp; → space
   ├─ &amp; → &
   ├─ &quot; → "
   └─ Output: "Decoded Text"
  ↓
3. SPECIAL CHARACTER HANDLING
   ├─ Remove emoji (if configured)
   ├─ Fix encoding issues
   ├─ Normalize quotes/dashes
   └─ Output: "Normalized Text"
  ↓
4. FIELD-SPECIFIC FORMATTING
   ├─ Phone: Format to E.164
   ├─ Email: Lowercase, validate
   ├─ URL: Absolute, validate
   ├─ Number: Parse & validate
   └─ Date: ISO 8601 format
  ↓
5. DEDUPLICATION
   ├─ Compare with existing
   ├─ Mark duplicates
   ├─ Merge if needed
   └─ Output: "Unique Records"
  ↓
Clean JSON
```

### Data Quality Scoring

**Algorithm:**
```
Quality Score = (Completeness × 0.3) + (Accuracy × 0.4) + (Validity × 0.3)

Where:
- Completeness: % of non-null fields
- Accuracy: % of correctly extracted fields
- Validity: % of valid field types

Result: 0-100 score
- 90+: Excellent
- 70-89: Good
- 50-69: Fair
- <50: Poor
```

---

## UI/UX Design

### Popup Interface

```
┌────────────────────────────────┐
│ 🔷 Bridgehead Data Extractor   │ ← Header
├────────────────────────────────┤
│                                │
│ Status: Ready to extract       │ ← Status bar
│ Website: example.com           │
│ Items found: 0                 │
│                                │
├────────────────────────────────┤
│                                │
│ [    ⚡ EXTRACT DATA    ]       │ ← Primary action
│                                │
│ [     ⚙️ Settings     ]        │ ← Secondary action
│ [    📥 Import Config  ]       │
│                                │
├────────────────────────────────┤
│                                │
│ 📊 EXTRACTION PROGRESS         │
│ ████████░░░░░░░░░░░░ 45%       │
│ 45 items extracted             │
│                                │
│ ⚠️ Scroll handling: ON          │
│ 🔄 Auto-pagination: ON         │
│                                │
├────────────────────────────────┤
│                                │
│ [Preview] [Export] [Settings]  │ ← Tabs
│                                │
│ Preview selected items:        │
│ ┌──────────────────────────┐   │
│ │ Item #1                  │   │
│ │ Title: Sample Product    │   │
│ │ Price: $99               │   │
│ │ Rating: 4.5 ⭐          │   │
│ └──────────────────────────┘   │
│                                │
│ [← Previous] [Next →]          │
│                                │
└────────────────────────────────┘
```

### Side Panel Interface

```
┌───────────────────────────────┐
│ ⚡ EXTRACTION IN PROGRESS      │
├───────────────────────────────┤
│                               │
│ Current: Page 1 of 5          │
│ ████████░░░░░░░░░░░░ 40%     │
│                               │
│ Items: 245 / ~600             │
│ Duplicates: 12                │
│ Errors: 0                     │
│                               │
├───────────────────────────────┤
│                               │
│ 🔄 Auto-scrolling: ON         │
│ ✓ Pagination detected         │
│ ✓ Connected to Bridgehead     │
│                               │
├───────────────────────────────┤
│                               │
│ [   ⏸️ PAUSE   ] [❌ CANCEL]   │
│                               │
│ ────────────────────────────  │
│                               │
│ Recent items:                 │
│ • Sample Item #245            │
│ • Sample Item #244            │
│ • Sample Item #243            │
│                               │
│ [View all →]                  │
│                               │
└───────────────────────────────┘
```

---

## Component Architecture

### Frontend Components

```
Popup/
├─ Dashboard.tsx
│  ├─ StatusCard (Website info)
│  ├─ ActionButtons (Extract, Settings)
│  ├─ ProgressBar (Visual progress)
│  ├─ ConfigToggles (Auto-scroll, pagination)
│  └─ TabNavigation
├─ PreviewTab.tsx
│  ├─ ItemList (Scrollable list)
│  ├─ ItemCard (Individual item)
│  ├─ Pagination (Prev/Next buttons)
│  └─ Filters (By status, type)
├─ ExportTab.tsx
│  ├─ FormatSelector (JSON, CSV, etc)
│  ├─ FilterOptions
│  ├─ ExportButton
│  └─ ExportStatus
├─ SettingsTab.tsx
│  ├─ AutoScrollToggle
│  ├─ PaginationSettings
│  ├─ FieldSelector
│  ├─ QualityThreshold
│  └─ ResetButton
└─ Common/
   ├─ Button.tsx
   ├─ Card.tsx
   ├─ ProgressBar.tsx
   ├─ Toggle.tsx
   └─ Dropdown.tsx

SidePanel/
├─ SidePanel.tsx
│  ├─ ProgressTracker
│  │  ├─ PageProgress
│  │  ├─ ItemCounter
│  │  ├─ ErrorCounter
│  │  └─ TimeRemaining
│  ├─ StatusIndicator
│  │  ├─ ScrollStatus
│  │  ├─ ConnectionStatus
│  │  └─ BridgeheadSync
│  ├─ RecentItems
│  │  └─ ItemPreview[]
│  ├─ ActionButtons
│  │  ├─ PauseButton
│  │  └─ CancelButton
│  └─ LogViewer
│     └─ EventLog[]
```

### Background Service Worker

```
ServiceWorker/
├─ service-worker.ts (Main entry)
│  ├─ onInstall()
│  ├─ onActivate()
│  ├─ onMessage()
│  └─ onStorageChange()
├─ message-handler.ts
│  ├─ handleExtractRequest()
│  ├─ handleExportRequest()
│  ├─ handleSettingsUpdate()
│  └─ handleDataSync()
├─ storage-manager.ts
│  ├─ saveExtraction()
│  ├─ getExtraction()
│  ├─ deleteExtraction()
│  ├─ listExtractions()
│  └─ clearOldData()
├─ data-processor.ts
│  ├─ processRawData()
│  ├─ validateData()
│  ├─ scoreQuality()
│  ├─ deduplicateRecords()
│  └─ formatForExport()
└─ export-manager.ts
   ├─ exportAsJSON()
   ├─ exportAsCSV()
   ├─ sendToBridgehead()
   └─ generateReport()
```

### Content Script

```
ContentScript/
├─ content-script.ts (Main entry)
│  ├─ injectAnalyzer()
│  ├─ setupListeners()
│  └─ handleMessages()
├─ dom-inspector.ts
│  ├─ analyzePageStructure()
│  ├─ findContainers()
│  ├─ detectFieldTypes()
│  └─ buildSchema()
├─ page-analyzer.ts
│  ├─ detectPaginationType()
│  ├─ findNextButton()
│  ├─ detectInfiniteScroll()
│  └─ estimateItemCount()
├─ scroll-manager.ts
│  ├─ scrollToBottom()
│  ├─ clickNextButton()
│  ├─ detectNewItems()
│  ├─ waitForLoad()
│  └─ handleTimeout()
├─ data-extractor.ts
│  ├─ extractFromDOM()
│  ├─ applySchema()
│  ├─ normalizeData()
│  └─ deduplicateItems()
└─ event-listeners.ts
   ├─ monitorDOMChanges()
   ├─ detectScrollEvents()
   ├─ watchForNewContent()
   └─ trackNetworkRequests()
```

---

## Security & Privacy

### Data Privacy First

**Principles:**
1. ✅ All processing happens locally in browser
2. ✅ No data sent without user permission
3. ✅ No tracking or analytics (optional)
4. ✅ Data encrypted in local storage
5. ✅ User can delete all data anytime
6. ✅ No external API calls (except Bridgehead when user sends)

**Security Measures:**
```
User Data
  ↓
Encrypt with AES-256
  ↓
Store in IndexedDB
  ↓
Never sync to cloud (unless user chooses)
  ↓
User can delete anytime
```

### Content Security Policy

```json
{
  "content_security_policy": {
    "extension_pages": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:"
  }
}
```

### Permissions Justification

| Permission | Why | Protection |
|-----------|-----|-----------|
| `activeTab` | Get current page info | User must activate |
| `scripting` | Inject content script | Manifest permission |
| `storage` | Save user settings | Encrypted storage |
| `tabs` | Track tab info | No network access |
| `<all_urls>` | Work on any website | User approval needed |

---

## Performance Architecture

### Optimization Strategies

**1. DOM Processing**
```typescript
// SLOW: Query DOM multiple times
const items = document.querySelectorAll('.item');
items.forEach(item => {
  const title = item.querySelector('.title').textContent;
  const price = item.querySelector('.price').textContent;
});

// FAST: Single pass with caching
const container = document.querySelector('.items-container');
const items = Array.from(container.children).map(item => ({
  title: item.dataset.title,
  price: item.dataset.price
}));
```

**2. Memory Management**
```typescript
// Clear old DOM references
detachOldReferences();

// Use weak maps for caches
const itemCache = new WeakMap();

// Batch process large datasets
processInBatches(items, batchSize = 100);

// Stream results instead of accumulating
yield* streamResults();
```

**3. Scroll Optimization**
```typescript
// Debounce scroll events
const debouncedScroll = debounce(handleScroll, 200);

// Virtual scrolling for large lists
const virtualScroller = new VirtualScroller();

// Request animation frame for smooth updates
requestAnimationFrame(() => updateUI());
```

### Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Popup load | <100ms | Cached data |
| Extract start | <500ms | First page analysis |
| Item extraction | <5ms per item | Depends on DOM size |
| Memory usage | <50MB | For 1000 items |
| Scroll trigger | <1s | Per page transition |

---

## Testing Strategy

### Test Coverage

```
Unit Tests (70%)
├─ DOM Inspector
├─ Data Extractor
├─ Scroll Manager
├─ Data Processor
├─ Format Validators
└─ Storage Manager

Integration Tests (20%)
├─ Extraction + Processing
├─ Scroll + Data sync
├─ Export + Format conversion
└─ Pagination detection

E2E Tests (10%)
├─ Full extraction flow
├─ Multi-page scraping
├─ Export functionality
└─ Error recovery
```

### Test Examples

**Unit Test:**
```typescript
describe('DataExtractor', () => {
  it('should extract text from DOM element', () => {
    const element = createMockElement('<div>Hello World</div>');
    const result = extractor.extractText(element);
    expect(result).toBe('Hello World');
  });

  it('should handle nested elements', () => {
    const element = createMockElement(
      '<div><span>Hello</span> <span>World</span></div>'
    );
    const result = extractor.extractText(element);
    expect(result).toBe('Hello World');
  });
});
```

**Integration Test:**
```typescript
describe('Full Extraction Flow', () => {
  it('should extract data from page with pagination', async () => {
    const mockPage = createMockPage({
      items: 50,
      pagination: true,
      nextButtonSelector: '.next-btn'
    });
    
    const result = await extractionFlow.run(mockPage);
    expect(result.items.length).toBe(50);
    expect(result.pagesProcessed).toBe(2);
  });
});
```

---

## Deployment & Installation

### Build Process

```bash
# 1. Install dependencies
npm install

# 2. Build extension
npm run build

# 3. Generate public key
npm run generate-keys

# 4. Create package
npm run package

# Output: dist/bridgehead-extension.zip
```

### Installation Steps

1. **Download Extension Package**
   - Visit: [GitHub Releases](https://github.com/...)
   - Download: `bridgehead-extension-v1.0.0.zip`

2. **Extract & Load**
   ```
   a) Extract ZIP file
   b) Open: chrome://extensions/
   c) Enable: "Developer mode" (top right)
   d) Click: "Load unpacked"
   e) Select: Extracted folder
   ```

3. **Grant Permissions**
   - Extension requests permissions for all websites
   - Click "Allow" in permission dialog
   - Extension is now active!

4. **Start Using**
   - Visit any website
   - Click extension icon in toolbar
   - Click "Extract Data" button
   - Wait for extraction to complete
   - Preview and export results

### Update Mechanism

**Auto-Update:**
- Extension checks for updates daily
- Updates automatically in background
- No user action required
- Changelog shown on first use after update

---

## Success Criteria

### Technical Success

```
✅ Extraction Accuracy: >95%
✅ Memory Usage: <50MB
✅ Scroll Handling: 0 hallucinations
✅ Pagination: All types supported
✅ Data Quality: >90/100 average
✅ Error Recovery: 3 retries minimum
```

### User Success

```
✅ 95% users extract on first try
✅ 80% feature adoption rate
✅ 4.5+/5.0 rating
✅ <2% error rate
✅ 60% 7-day retention
```

---

## Conclusion

This extension represents enterprise-grade web data extraction with:

✅ **No Hallucination** - Smart pagination with safety checks
✅ **High Accuracy** - 95%+ extraction quality
✅ **User Privacy** - Local-first processing
✅ **Easy to Use** - One-click extraction
✅ **Extensible** - Support for any website
✅ **Production Ready** - Full testing & documentation

---

**Version:** 1.0
**Status:** Architecture Complete
**Next:** Implementation Phase 1
```

---

# 📋 **PDA #2: BRIDGEHEAD DATA SCRAPER INTEGRATION ARCHITECTURE**

```markdown
# Product Design Architecture (PDA)
## BRIDGEHEAD EXTENSION ↔ DATA SCRAPER INTEGRATION

### Table of Contents
1. [Executive Summary](#executive-summary)
2. [Integration Overview](#integration-overview)
3. [Communication Protocol](#communication-protocol)
4. [Data Flow Architecture](#data-flow-architecture)
5. [Data Transformation Layer](#data-transformation-layer)
6. [Backend API Endpoints](#backend-api-endpoints)
7. [Data Storage & Management](#data-storage--management)
8. [Error Handling & Recovery](#error-handling--recovery)
9. [Performance Optimization](#performance-optimization)
10. [Security & Authentication](#security--authentication)

---

## Executive Summary

**Integration Component:** Bridge between Chrome Extension and Bridgehead Data Scraper

**Purpose:** Seamlessly transfer extracted web data from extension to scraper backend for processing, normalization, and storage.

**Technology:**
- WebSocket for real-time communication
- REST API for file transfers
- OAuth2 for authentication
- Protocol Buffers for efficient serialization

**Performance Targets:**
- Data transfer: <100ms latency
- Processing: <500ms per 100 items
- Reliability: 99.9% delivery guarantee

---

## Integration Overview

### System Architecture

```
CHROME EXTENSION              BRIDGEHEAD BACKEND
     (Client)                   (Server)
        │                           │
        │──── WebSocket ────────────│
        │       (Real-time)         │
        │                           │
        │──── REST API ──────────────│
        │    (File transfer)        │
        │                           │
        ├──────────────────────────┤
        │   Message Queue           │
        │ (RabbitMQ / Redis)        │
        │                           │
        ├──────────────────────────┤
        │   Data Processor          │
        │ (Normalization)           │
        │                           │
        └──────────────────────────┘
             MongoDB Storage
```

### Three-Layer Integration

```
┌─────────────────────────────────────┐
│ LAYER 1: MESSAGE PROTOCOL           │
├─────────────────────────────────────┤
│ • JSON Serialization                │
│ • Protocol Buffers (fast)           │
│ • MessagePack (compact)             │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│ LAYER 2: TRANSPORT LAYER            │
├─────────────────────────────────────┤
│ • WebSocket (real-time events)      │
│ • REST API (file uploads)           │
│ • Message Queue (async processing)  │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│ LAYER 3: APPLICATION LOGIC          │
├─────────────────────────────────────┤
│ • Data Validation                   │
│ • Schema Mapping                    │
│ • Error Handling                    │
│ • Callback Management               │
└─────────────────────────────────────┘
```

---

## Communication Protocol

### Message Types

**1. Handshake Message**
```json
{
  "type": "HANDSHAKE",
  "extensionVersion": "1.0.0",
  "userId": "user_123",
  "apiKey": "ext_key_xxxxx",
  "capabilities": {
    "maxItems": 50000,
    "supportedFormats": ["json", "csv", "xml"],
    "maxPayloadSize": 10485760
  }
}
```

**2. Data Transmission Message**
```json
{
  "type": "DATA_TRANSMISSION",
  "sessionId": "session_abc123",
  "batchId": "batch_001",
  "batchNumber": 1,
  "totalBatches": 5,
  "sourceUrl": "https://example.com",
  "sourceWebsite": "justdial|sulekha|yelp|googlemaps",
  "extractedAt": "2024-03-23T14:35:42Z",
  "itemCount": 100,
  "items": [
    {
      "id": "item_001",
      "title": "Sample Business",
      "phone": "+91-9876543210",
      "email": "info@example.com",
      "address": "123 Main St",
      "rating": 4.5,
      "verified": false,
      "metadata": {
        "extractedFrom": "search-results",
        "position": 1,
        "confidence": 0.95
      }
    }
    // ... more items
  ],
  "metadata": {
    "pageNumber": 1,
    "itemsPerPage": 100,
    "totalItems": 2500,
    "scrollMethod": "infinite|pagination|load-more",
    "extractionDuration": 45000,
    "qualityScore": 92.5,
    "hasErrors": false,
    "errors": []
  }
}
```

**3. Status Update Message**
```json
{
  "type": "STATUS_UPDATE",
  "sessionId": "session_abc123",
  "status": "extracting|processing|completed|error",
  "progress": {
    "current": 45,
    "total": 100,
    "percentage": 45
  },
  "currentAction": "Scrolling to next page...",
  "timestamp": "2024-03-23T14:35:42Z"
}
```

**4. Acknowledgment Message**
```json
{
  "type": "ACK",
  "sessionId": "session_abc123",
  "batchId": "batch_001",
  "status": "received|processed|error",
  "processedItems": 100,
  "storageLocation": "/api/extractions/ext_session_abc123/batch_001",
  "message": "Batch received and queued for processing"
}
```

### WebSocket Events

**Extension → Backend**
```typescript
// Start extraction session
socket.emit('extraction:start', {
  sessionId: 'session_abc123',
  website: 'justdial',
  url: 'https://example.com',
  config: { autoScroll: true, maxItems: 1000 }
});

// Send batch of data
socket.emit('data:batch', {
  sessionId: 'session_abc123',
  batchId: 'batch_001',
  items: [...],
  metadata: { ... }
});

// Report progress
socket.emit('progress:update', {
  sessionId: 'session_abc123',
  progress: 45,
  message: 'Extracted 45 items...'
});

// Complete extraction
socket.emit('extraction:complete', {
  sessionId: 'session_abc123',
  totalItems: 1000,
  duration: 3600000,
  qualityScore: 92.5
});
```

**Backend → Extension**
```typescript
// Acknowledge batch receipt
socket.on('data:ack', (data) => {
  // Confirm batch was received
  console.log(`Batch ${data.batchId} acknowledged`);
});

// Processing status
socket.on('processing:update', (data) => {
  // Show processing progress
  console.log(`Processing: ${data.percentage}%`);
});

// Error notification
socket.on('error:notification', (data) => {
  // Handle error from backend
  console.error(`Error: ${data.message}`);
});

// Completion confirmation
socket.on('processing:complete', (data) => {
  // Extraction fully processed
  console.log(`All data processed successfully`);
});
```

---

## Data Flow Architecture

### Complete Data Journey

```
┌─────────────────────────────────┐
│ 1. EXTRACTION (Extension)       │
├─────────────────────────────────┤
│                                 │
│ User opens website              │
│ ↓                               │
│ Clicks "Extract Data"           │
│ ↓                               │
│ Extension analyzes page         │
│ ↓                               │
│ Detects pagination/scroll       │
│ ↓                               │
│ Extracts items in batches       │
│ ↓                               │
│ Local normalization             │
│ ↓                               │
│ Data ready to send              │
│                                 │
└────────────────┬────────────────┘
                 │ WebSocket
                 ▼
┌─────────────────────────────────┐
│ 2. TRANSMISSION (Network)       │
├────────���────────────────────────┤
│                                 │
│ Initialize WebSocket            │
│ ↓                               │
│ Authenticate with API key       │
│ ↓                               │
│ Send batches (100 items each)   │
│ ↓                               │
│ Receive acknowledgments         │
│ ↓                               │
│ Retry on failure                │
│ ↓                               │
│ Send completion signal          │
│                                 │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ 3. RECEPTION (Backend)          │
├─────────────────────────────────┤
│                                 │
│ WebSocket server receives batch │
│ ↓                               │
│ Validate schema                 │
│ ↓                               │
│ Store in temporary queue        │
│ ↓                               │
│ Send acknowledgment             │
│ ↓                               │
│ Queue for processing            │
│                                 │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ 4. PROCESSING (Backend Service) │
├─────────────────────────────────┤
│                                 │
│ Get batch from queue            │
│ ↓                               │
│ Deep validation (type, format)  │
│ ↓                               │
│ Merge with existing records     │
│ ↓                               │
│ Detect duplicates               │
│ ↓                               │
│ Score data quality              │
│ ↓                               │
│ Extract structured fields       │
│                                 │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ 5. STORAGE (MongoDB)            │
├─────────────────────────────────┤
│                                 │
│ Create ExtractedData document   │
│ ↓                               │
│ Add to appropriate collection   │
│ ↓                               │
│ Update indexes                  │
│ ↓                               │
│ Create audit log entry          │
│ ↓                               │
│ Update user's quota             │
│                                 │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ 6. NOTIFICATION (Callback)      │
├─────────────────────────────────┤
│                                 │
│ Send success event to extension │
│ ↓                               │
│ Update processing status        │
│ ↓                               │
│ Trigger user notification       │
│ ↓                               │
│ Store extraction reference      │
│                                 │
└─────────────────────────────────┘
```

---

## Data Transformation Layer

### Input Normalization (Extension → Backend)

**Raw Extension Data:**
```json
{
  "title": "  Sample Business  ",
  "phone": "9876543210",
  "email": "INFO@EXAMPLE.COM",
  "address": "123 Main Street, Delhi, India",
  "rating": "4.5/5"
}
```

**Transformation Pipeline:**
```typescript
1. TRIM & CLEAN
   ├─ Remove leading/trailing spaces
   ├─ Collapse multiple spaces
   └─ Output: "Sample Business"

2. PHONE FORMATTING
   ├─ Extract digits only
   ├─ Validate length (10 for India)
   ├─ Add country code if missing
   └─ Output: "+91-9876543210"

3. EMAIL NORMALIZATION
   ├─ Convert to lowercase
   ├─ Validate format
   ├─ Remove invalid chars
   └─ Output: "info@example.com"

4. ADDRESS PARSING
   ├─ Parse address components
   ├─ Extract city, state, zip
   ├─ Validate format
   └─ Output: {
       "street": "123 Main Street",
       "city": "Delhi",
       "state": "DL",
       "country": "India",
       "zip": null
     }

5. RATING CONVERSION
   ├─ Extract numeric value
   ├─ Validate range (0-5)
   ├─ Store as float
   └─ Output: 4.5
```

**Normalized Data:**
```json
{
  "title": "Sample Business",
  "phone": "+91-9876543210",
  "email": "info@example.com",
  "address": {
    "street": "123 Main Street",
    "city": "Delhi",
    "state": "DL",
    "country": "IN",
    "zip": null
  },
  "rating": 4.5,
  "source": "extension",
  "extractedAt": "2024-03-23T14:35:42Z",
  "qualityScore": 92.5,
  "verified": false
}
```

### Output Formatting (Backend → Client)

**REST API Response:**
```json
{
  "status": "success",
  "sessionId": "session_abc123",
  "extractionId": "ext_final_001",
  "totalItems": 2500,
  "processedItems": 2450,
  "failedItems": 50,
  "qualityMetrics": {
    "overallScore": 92.3,
    "completeness": 95.0,
    "accuracy": 89.5,
    "validity": 91.0
  },
  "storage": {
    "location": "/api/extractions/session_abc123",
    "format": "json",
    "size": "5.2 MB"
  },
  "preview": {
    "items": [
      { /* first 5 items */ }
    ],
    "pagination": {
      "total": 2450,
      "page": 1,
      "limit": 5
    }
  },
  "metadata": {
    "duration": "45 minutes",
    "website": "justdial",
    "sourceUrl": "https://justdial.com/...",
    "completedAt": "2024-03-23T15:20:42Z"
  }
}
```

---

## Backend API Endpoints

### Extraction Endpoints

**1. Initialize Extraction Session**
```
POST /api/extensions/sessions/init
Authorization: Bearer <USER_TOKEN>

Request:
{
  "userId": "user_123",
  "website": "justdial|sulekha|yelp|googlemaps",
  "sourceUrl": "https://...",
  "config": {
    "autoScroll": true,
    "maxItems": 5000,
    "fieldMappings": { ... }
  }
}

Response:
{
  "sessionId": "session_abc123",
  "status": "initialized",
  "expiresAt": "2024-03-23T18:35:42Z"
}
```

**2. Receive Data Batch**
```
POST /api/extensions/sessions/:sessionId/batches
Authorization: Bearer <SESSION_TOKEN>

Request:
{
  "batchId": "batch_001",
  "items": [ ... ],
  "metadata": { ... }
}

Response:
{
  "batchId": "batch_001",
  "status": "received",
  "itemsReceived": 100,
  "queued": true,
  "message": "Batch queued for processing"
}
```

**3. Complete Extraction**
```
POST /api/extensions/sessions/:sessionId/complete
Authorization: Bearer <SESSION_TOKEN>

Request:
{
  "totalItems": 2500,
  "duration": 3600000,
  "qualityScore": 92.5
}

Response:
{
  "sessionId": "session_abc123",
  "extractionId": "ext_final_001",
  "status": "processing",
  "estimatedCompletion": "2024-03-23T15:20:42Z"
}
```

**4. Get Extraction Status**
```
GET /api/extensions/extractions/:extractionId
Authorization: Bearer <USER_TOKEN>

Response:
{
  "extractionId": "ext_final_001",
  "status": "completed|processing|failed",
  "progress": 85,
  "totalItems": 2500,
  "processedItems": 2125,
  "qualityMetrics": { ... },
  "storage": {
    "location": "/api/extractions/...",
    "format": "json"
  }
}
```

**5. Export Extraction**
```
POST /api/extensions/extractions/:extractionId/export
Authorization: Bearer <USER_TOKEN>

Request:
{
  "format": "json|csv|xml",
  "filters": {
    "minQualityScore": 80
  }
}

Response:
{
  "downloadUrl": "https://...",
  "format": "json",
  "itemCount": 2450,
  "fileSize": "5.2 MB",
  "expiresIn": 3600
}
```

---

## Data Storage & Management

### Data Models

**ExtractedBatch Schema:**
```typescript
interface ExtractedBatch {
  _id: ObjectId;
  sessionId: string;
  batchId: string;
  batchNumber: number;
  totalBatches: number;
  userId: ObjectId;
  
  // Source Info
  sourceUrl: string;
  sourceWebsite: "justdial" | "sulekha" | "yelp" | "googlemaps";
  extractedAt: Date;
  
  // Data
  items: ExtractedItem[];
  itemCount: number;
  
  // Metadata
  metadata: {
    pageNumber: number;
    totalItems: number;
    scrollMethod: string;
    extractionDuration: number;
    qualityScore: number;
    hasErrors: boolean;
    errors: string[];
  };
  
  // Processing
  status: "received" | "validating" | "processing" | "completed" | "failed";
  processingStarted?: Date;
  processingCompleted?: Date;
  processingError?: string;
  
  // Storage
  storageLocation: string;
  blobId?: string;
  
  createdAt: Date;
  updatedAt: Date;
}
```

**ExtractedItem Schema:**
```typescript
interface ExtractedItem {
  _id: ObjectId;
  batchId: ObjectId;
  extractionId: ObjectId;
  
  // Raw Data
  rawData: Record<string, any>;
  
  // Normalized Data
  normalizedData: {
    title?: string;
    phone?: string;
    email?: string;
    address?: Address;
    rating?: number;
    website?: string;
    category?: string;
    [key: string]: any;
  };
  
  // Quality
  qualityScore: number;
  verified: boolean;
  validationErrors: ValidationError[];
  
  // Duplicate
  isDuplicate: boolean;
  duplicateOf?: ObjectId;
  
  // Source
  sourcePosition: number;
  confidence: number;
  
  createdAt: Date;
  updatedAt: Date;
}
```

**ExtractionSession Schema:**
```typescript
interface ExtractionSession {
  _id: ObjectId;
  sessionId: string;
  userId: ObjectId;
  
  // Extraction Info
  website: string;
  sourceUrl: string;
  
  // Progress
  status: "active" | "completed" | "failed" | "abandoned";
  totalItems: number;
  processedItems: number;
  failedItems: number;
  
  // Quality
  qualityMetrics: QualityMetrics;
  
  // Batches
  batches: ObjectId[];
  batchCount: number;
  
  // Timing
  startedAt: Date;
  completedAt?: Date;
  estimatedCompletion?: Date;
  
  // Storage
  storageReference: string;
  
  // Expiry
  expiresAt: Date;
  
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Error Handling & Recovery

### Error Types & Handling

```
┌─────────────────────────────────────┐
│ NETWORK ERRORS                      │
├─────────────────────────────────────┤
│ • Connection timeout                │
│   → Retry with exponential backoff   │
│   → Max 5 retries, then queue       │
│                                     │
│ • Server error (5xx)                │
│   → Queue for later processing      │
│   → Notify user                     │
│                                     │
│ • Connection lost                   │
│   → Store locally                   │
│   → Resume when reconnected         │
│                                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ DATA ERRORS                         │
├─────────────────────────────────────┤
│ • Validation failed                 │
│   → Flag item                       │
│   → Continue processing             │
│   → Report at end                   │
│                                     │
│ • Duplicate detected                │
│   → Link to original                │
│   → Skip processing                 │
│                                     │
│ • Invalid format                    │
│   → Attempt recovery                │
│   → Mark with flag                  │
│                                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ AUTHENTICATION ERRORS               │
├─────────────────────────────────────┤
│ • Token expired                     │
│   → Refresh token                   │
│   → Retry request                   │
│                                     │
│ • Unauthorized                      │
│   → Request re-authentication       │
│   → Pause extraction                │
│                                     │
└─────────────────────────────────────┘
```

### Retry Strategy

```typescript
async function retryWithBackoff(fn, maxRetries = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      // Exponential backoff: 100ms, 200ms, 400ms, 800ms, 1600ms
      const delay = Math.pow(2, attempt - 1) * 100;
      await wait(delay);
    }
  }
}
```

---

## Performance Optimization

### Batch Processing

**Optimal Batch Size:**
```
Factors:
├─ Network bandwidth
├─ Backend processing power
├─ Item size
├─ Quality scoring time

Recommended: 100-500 items per batch
├─ Small items: 500 items/batch
├─ Medium items: 200 items/batch
├─ Large items: 100 items/batch
```

### Compression

**Data Compression:**
```
Raw JSON:    1.0 MB
├─ Gzip:     0.2 MB (80% reduction)
├─ Brotli:   0.15 MB (85% reduction)
└─ Minified: 0.8 MB

Recommendation: Gzip (fast, good ratio)
```

### Caching Strategy

```
Extension Cache:
├─ Schema cache: 24 hours
├─ Session cache: 1 hour
└─ User preferences: 7 days

Backend Cache:
├─ Duplicate check: 24 hours
├─ Schema validation: 7 days
├─ Quality scores: Real-time
└─ User quotas: 1 hour
```

---

## Security & Authentication

### Authentication Flow

```
┌─────────────────────────────────────┐
│ 1. USER LOGIN                       │
├─────────────────────────────────────┤
│ User logs in to Bridgehead          │
│ ↓                                   │
│ Receive JWT token                   │
│ 
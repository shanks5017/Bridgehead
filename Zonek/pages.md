# Bridgehead (Zonek) - Page Architecture & User Flow

## 1. Core User Flow Journey

**Phase 1: Entry & Authentication**
1. User lands on the **Home** page to understand the 50/100 head start proposition.
2. User proceeds to **Sign Up** or **Sign In**.
3. Upon successful authentication, they are redirected to the **Main Feed** (or the target page they were trying to access).

**Phase 2: Discovery & Intelligence Gathering**
1. User browses the **Main Feed**, **Demand Feed**, or **Rental Listings** to see what the market needs or what spaces are available.
2. User navigates to the **Research** page to view competitor saturation (aggregation from Justdial/Sulekha).
3. User visits **AI Suggestions** and **AI Matches** to see Groq/Gemini generated reports on which businesses are highly feasible in their exact location.
4. User saves interesting opportunities and views them later in **Saved Posts**.

**Phase 3: Community & Market Signals**
1. User interacts in the **Community Hub (The Hive)** to gauge local sentiment or discuss business trends.
2. If the user spots a gap in the market, they use **Post Demand** to signal a missing business.
3. If they own a property, they use **Post Rental** to list it.

**Phase 4: Execution & Negotiation**
1. From a **Demand Detail** or **Rental Detail** page, the user clicks "Start Collaboration".
2. The user is taken to the **Collaboration/Messages** page where they negotiate real-time with the post owner.
3. The user can also chat with **ARU (AI Assistant)** in the Messages tab for strategic advice.
4. Once an agreement is reached, the original author goes to their **Profile** and marks the Demand as "Solved" or the Rental as "Rented".

---

## 2. Complete Page Directory & Functionality

### A. Authentication & Onboarding
* **Home Page (`/home`)**
  * **Function:** Public landing page demonstrating platform value.
  * **Features:** Marketing copy, global navigation, direct links to sign up.
* **Sign Up (`/sign-up`)**
  * **Function:** User registration.
  * **Features:** Inputs for Full Name, Username, Email, Password. Sets default account type.
* **Sign In (`/sign-in`)**
  * **Function:** User login.
  * **Features:** JWT authentication. Remembers previous route to seamlessly redirect user after login.

### B. Discovery & Feeds
* **Main Market Feed (`/feed`)**
  * **Function:** The central dashboard aggregating all platform activity.
  * **Features:** Displays a unified stream of top Demand Posts, Rental Listings, and Community Posts. Allows quick upvoting and saving.
* **Demand Feed (`/demand`)**
  * **Function:** Dedicated directory of requested local businesses.
  * **Features:** Browse demands, filter, upvote to increase demand validity, save for later.
* **Rental Listings (`/rentals`)**
  * **Function:** Dedicated directory of commercial real estate.
  * **Features:** Browse available properties, view pricing, upvote quality listings, save for later.
* **Community Hub / The Hive (`/community`)**
  * **Function:** Hyper-local discussion forum.
  * **Features:** Create text/media posts, like, reply, repost. Author verification badges displayed.

### C. Details & Deep Dives
* **Demand Detail (`/demand-detail`)**
  * **Function:** Expanded view of a specific market request.
  * **Features:** View full description, location data, image gallery viewer, upvote count. "Start Collaboration" button to initiate chat. 
* **Rental Detail (`/rental-detail`)**
  * **Function:** Expanded view of a commercial property.
  * **Features:** View property specs, financial benchmarks, location, image gallery viewer. "Start Collaboration" button to contact landlord.

### D. Content Creation (Protected Routes)
* **Post Demand (`/post-demand`)**
  * **Function:** Form to create a new market request.
  * **Features:** Upload multiple images, define business category, enter description, set precise location coordinates, toggle "Open to Collaboration", provide contact info.
* **Post Rental (`/post-rental`)**
  * **Function:** Form to list a commercial space.
  * **Features:** Upload images, define property category, set pricing/terms, set location data, provide contact info.

### E. Intelligence & AI Tools
* **Market Research (`/research`)**
  * **Function:** Competitor analysis dashboard.
  * **Features:** Displays aggregated data scraped from verified directories (Justdial, Sulekha, OLX) indicating competitor saturation within a specific radius.
* **AI Suggestions (`/ai-suggestions`)**
  * **Function:** Automated business logic.
  * **Features:** Uses LLM to synthesize local demands into raw "Execution Plans" (How-to guides for feasible businesses).
* **AI Matches (`/ai-matches`)**
  * **Function:** Connecting supply and demand.
  * **Features:** Uses AI to pair high-upvote Demands with geographically relevant Rental Listings.

### F. User Management & Execution
* **Messaging / Collaboration (`/messages`)**
  * **Function:** Real-time communications center.
  * **Features:** 
    * Peer-to-peer Socket.io chat rooms linked directly to specific Posts.
    * Persistent chat session with ARU (AI Assistant via Groq/Gemini) for business advice.
    * Tracks unread counts and timestamps.
* **Saved Posts (`/saved`)**
  * **Function:** Bookmarks repository.
  * **Features:** View all Demands and Rentals the user has starred/saved across the platform.
* **User Profile (`/profile`)**
  * **Function:** User dashboard and content management.
  * **Features:** 
    * Update Profile Picture, Name, and Bio (Multipart Form upload).
    * View personal published Demands and Rentals.
    * Edit existing posts.
    * Delete posts.
    * Mark Demands as "Solved".
    * Mark Rentals as "Rented".
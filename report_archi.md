# Zonek Intelligence 2.0 - Complete Architecture & System Report

As the Project Owner, this document serves as the master architectural blueprint for Zonek Intelligence 2.0. It breaks down the system into its core components, workflows, and pipelines. 

For each section, a highly optimized **Image Generation Prompt** is provided. These prompts are meticulously engineered to bypass standard "AI-generated" tropes. They are instructed to strictly adhere to your specific brand UI palette:

* **Backgrounds:** Warm Off-White (#E4E3E0) & White (#FFFFFF)
* **Lines/Grids:** Light Gray (#D9D8D6)
* **Text/Primary Structures:** Deep Black (#141414)
* **Accents/Highlights:** Electric Green (#22C55E)

---

## 1. Complete Project Architecture (Simplest Way)

**Description:**
The Zonek platform is a highly modular, Zero-Hallucination business intelligence engine. At its simplest, it operates as a 3-layer cake:
1. **The Client (Top):** The React Frontend where users interact with the ARU AI chat and view Data Rooms.
2. **The Brain (Middle):** The Node.js Orchestrator that receives requests, coordinates microservices, and runs the Hallucination Firewall.
3. **The Data Harvesters (Bottom):** Parallel engines fetching live web data (Browser Engine), real estate limits (Rental Scraper), and static census data (Gov Data Engine).

**Image Generation Prompt:**
> **Prompt:** A professional system architecture diagram designed in a clean, minimalist 2D flat vector style similar to a Figma or Lucidchart export. No 3D effects. Top-down layout. CRITICAL COLOR THEME STRICTLY ENFORCED: The background must be warm off-white (#E4E3E0). Use light gray (#D9D8D6) for structural grid lines. Use deep black (#141414) for node outlines and typography. Use electric green (#22C55E) exclusively for connection arrows and highlighting the central 'Orchestrator' node. Clean solid lines, sans-serif typography.

---

## 2. Six Service Microservice Ecosystem

**Description:**
The platform is decoupled into six independent nodes to ensure maximum speed (the 15-second parallel pipeline):
1. **Bridgehead Frontend** (React user interface).
2. **Orchestrator Brain** (Node.js API Gateway & SSE hub).
3. **Gov Data Engine** (Node.js/Vector daemon for LGD mappings & Census data).
4. **Browser Intelligence** (Neutral search via Exa/Tavily + web-to-markdown API).
5. **India Rental Scraper** (Python/FastAPI + Playwright for OLX/MagicBricks).
6. **Intelligence Ops Dashboard** (React internal observing/logging panel).

**Image Generation Prompt:**
> **Prompt:** A crisp, flat 2D network topology diagram representing a microservice ecosystem. Designed like a professional web architecture diagram. A central hub connects to 5 service nodes. CRITICAL COLOR THEME: Warm off-white (#E4E3E0) canvas. Deep black (#141414) flat icons and box borders. Light gray (#D9D8D6) for subtle UI elements. Use striking electric green (#22C55E) for the exact data pipelines branching from the center. Uniform border radiuses on the white (#FFFFFF) bounding boxes. Absolute minimalism.

---

## 3. Bridgehead Front-End Component Architecture

**Description:**
The client-facing React application is heavily componentized. 
* **State Management:** Handles user sessions and active report tracking.
* **Component Tree:** 
  * `DashboardView`: User hubs and previous reports.
  * `FormIntake`: Dynamic questionnaire for business variables.
  * `DataRoomViewer`: A structured pane showing verifiable facts, charts, and maps.
  * `ARU_AI_Chat`: The sidebar WebSocket connection for real-time AI assistance.

**Image Generation Prompt:**
> **Prompt:** A UI/UX React component tree diagram. Drawn in a human-designed, flat wireframe style with precise, readable boxes. CRITICAL COLOR THEME: Pure white (#FFFFFF) background. Deep black (#141414) for all text and node boxes. Light gray (#D9D8D6) for connector lines. Highlight the 'ARU_AI_Chat' and 'DataRoomViewer' component nodes distinctly using electric green (#22C55E) fills or accents. Utilitarian, corporate documentation style. No 3D renders.

---

## 4. Backend API and Database Interaction

**Description:**
The Node.js Orchestrator acts as an API gateway. It exposes RESTful routes for static assets and WebSocket/SSE endpoints for streaming. The backend interacts directly with multiple data layers:
* **Supabase PostgreSQL:** Primary relational database for structured data (users, reports, rentals, geographic mappings).
* **Supabase Storage:** For storing static assets like PDF government documents and cached web scrapes.
* **ChromaDB:** A local vector database for embedding large unstructured texts (optional/local cache).

**Image Generation Prompt:**
> **Prompt:** A strict, minimalist 2D flowchart showing backend server and database relationships. Left: 'API Gateway'. Right: Three distinct data storage nodes - a cylinder icon for 'PostgreSQL DB', a storage bucket icon for 'Supabase Storage', and a geometric grid icon for 'ChromaDB Vector Cache'. CRITICAL COLOR THEME: Background is warm off-white (#E4E3E0). Database and gateway icons are drawn in deep black (#141414). Solid straight directional arrows for data flow are highlighted in bright electric green (#22C55E). Completely flat shading, highly stylized professional infographic layout.

---

## 5. Supabase Database Architecture / ER Diagram

**Description:**
Supabase provides a fully managed PostgreSQL database with realtime subscriptions, authentication, and storage. We leverage its relational schema to enforce data integrity across entities while still storing unstructured AI findings in JSONB columns.
* **users table:** Stores auth user metadata, subscription tier, profile info.
* **reports table:** Core business intelligence records; includes JSONB column for AI-generated findings, foreign key to users, and geographic references.
* **rentals table:** Cached real estate listings with GeoJSON geometry column for spatial queries; includes source URL, price, and deduplication hash.
* **lgd_mappings table:** Local Government Directory hierarchy (state -> district -> subdistrict/village) for standardizing geographic lookups.
* **embeddings table (optional):** Stores vector embeddings (via pgvector) for semantic search over large text corpora like census PDFs.

Relationships: reports.user_id -> users.id; rentals may reference lgd_mappings for location normalization.

**Image Generation Prompt:**
> **Prompt:** A standard, human-designed Entity-Relationship (ER) diagram for a PostgreSQL/Supabase database. Clean tabular boxes resembling strict UML modeling layout. Flat 2D design. CRITICAL COLOR THEME: Use a pure white (#FFFFFF) background with a light gray (#D9D8D6) subtle coordinate grid. The table borders and typography must be deep black (#141414). Highlight Primary Keys (PK), Foreign Keys (FK), and special columns like JSONB or geometry in electric green (#22C55E). Designed to look exactly like a Visio or Draw.io technical export.

---

## 6. Research Pipeline Data Flow

**Description:**
The progression of a user's prompt into actionable data:
1. **Query Ingestion:** User inputs location and business type.
2. **Entity Extraction:** Inferring coordinates, keywords, and NAICS codes.
3. **Fan-out:** Sending these parameters to the 3 Harvesters (Web, Gov, Rental) simultaneously.
4. **Gather & Synthesize:** Waiting for all APIs to resolve.
5. **Generation & Stream:** Producing the report and streaming it back.

**Image Generation Prompt:**
> **Prompt:** A straightforward, professional horizontal data flow diagram, created in the style of a senior technical illustrator using Figma. Left-to-right progression. CRITICAL COLOR THEME: Warm off-white (#E4E3E0) background. All nodes and boxes are crisp white (#FFFFFF) with deep black (#141414) outlines and text. The flow arrows linking the entire pipeline are vivid electric green (#22C55E). Precise geometric alignment, no glow, no shadow.

---

## 7. Govt. Data ETL Pipeline

**Description:**
Transforming dirty, static Indian government logic into AI-ready vectors:
* **Extract:** Pulling static PDFs, budgeting documents, and Census CSVs.
* **Transform:** Parsing tables, standardizing names against the LGD mapping.
* **Load:** Embedding the clean data into a local ChromaDB instance.

**Image Generation Prompt:**
> **Prompt:** A pristine corporate schematic showing an Extract, Transform, Load (ETL) pipeline. Flat minimalist design. Left: PDF/CSV icons. Middle: Transformation gear. Right: Database. CRITICAL COLOR THEME: Light gray (#D9D8D6) minimalist background. Deep black (#141414) flat icons and typography. Use electric green (#22C55E) exclusively for the 'Transform' step and flow arrows to emphasize the data cleaning process. Strict grid alignment.

---

## 8. Browser Intelligence Search & Extraction Workflow

**Description:**
Bypassing brittle web scrapers. We query neural APIs, grab raw webpage HTML, convert the HTML immediately to Markdown, and feed that Markdown to a hyper-fast Groq LLM with a strict prompt: "Extract exactly 3 mathematically verifiable facts."

**Image Generation Prompt:**
> **Prompt:** A simple, highly professional business process flowchart diagram illustrating web data extraction. Sequential nodes: 'Search API', 'Raw HTML', 'Markdown', and 'JSON Facts'. CRITICAL COLOR THEME: Pure white (#FFFFFF) background. Deep black (#141414) uniform rectangular nodes. Solid electric green (#22C55E) thin, sharp connection arrows. Flat 2D corporate aesthetics, standard flowchart notation symbols.

---

## 9. Rental Scraping Pipeline

**Description:**
Solving spatial real estate analysis. 
1. String -> GPS boundaries.
2. FastAPI invokes Playwright scripts on real estate portals.
3. Listings are passed through a Levenshtein distance string deduplicator.
4. Persisted in Supabase PostgreSQL with PostGIS geometry column for spatial queries.

**Image Generation Prompt:**
> **Prompt:** An abstract, clean 2D vector data pipeline diagram representing automated data collection. sleek, minimalist diagram style. CRITICAL COLOR THEME: Warm off-white (#E4E3E0) canvas. Deep black (#141414) geometric precision for location boundaries, scraping tools, and database icons. Highlight the 'Deduplication' filter node vividly in electric green (#22C55E). No heavy shading, no 3D elements. Modern flat UI design methodology.

---

## 10. AI and LLM Processing

**Description:**
The core intelligence mechanism. The Orchestrator collects all harvested data, creates a massive system prompt, and sends it to either Llama 3.1 or Qwen.

**Image Generation Prompt:**
> **Prompt:** A high-end corporate technical diagram explaining LLM data processing. Abstract flat geometry: simple document icons funneling into a central structured processing box. CRITICAL COLOR THEME: Pure white (#FFFFFF) background with a light gray (#D9D8D6) technical grid. Deep black (#141414) for all abstract nodes, text, and architecture geometry. Only the central 'LLM Processing' box is stroked or filled with bright electric green (#22C55E). Swiss design style, minimalist.

---

## 11. Hallucination Firewall Workflow

**Description:**
The safety net. When the LLM generates a claim, the firewall intercepts the claim, cross-references citations with the source database, and uses a deterministic math check. Unverified claims are stripped.

**Image Generation Prompt:**
> **Prompt:** A professional data validation flowchart, sketched in a clean UI designer's flat aesthetic. Shows a 'Pass/Fail' decision tree. CRITICAL COLOR THEME: Warm off-white (#E4E3E0) background. Deep black (#141414) for all standard workflow nodes and text. Use electric green (#22C55E) specifically for the central 'Firewall/Shield' icon and the 'Pass' path arrows. High readability, strictly 2D corporate diagram.

---

## 12. Real-Time Socket.io / SSE Communication Flow

**Description:**
Traditional HTTP requests time out. This workflow uses Server-Sent Events (SSE). Client makes request -> gets Job ID -> subscribes to SSE channel -> receives incremental updates as microservices finish chunks.

**Image Generation Prompt:**
> **Prompt:** A clean, technical sequence diagram (UML style) showing bidirectional data streaming. Vertical lifelines for 'Client' and 'Server'. CRITICAL COLOR THEME: Pure white (#FFFFFF) background. Deep black (#141414) for computers, server icons, and standard HTTP request lines. Use repeating electric green (#22C55E) dashed lines indicating the persistent Server-Sent Events (SSE) streaming data back. Flat design.

---

## 13. End-to-End System Workflow

**Description:**
The god-eye view of the platform lifecycle. User login -> API Gateway -> Parallel execution (Web/Gov/Rental) -> Context merged -> LLM analysis -> Firewall validation -> Stream via SSE -> Renders in UI Map.

**Image Generation Prompt:**
> **Prompt:** A massive, meticulously organized macro architecture map of a SaaS platform. Designed like a real-world enterprise blueprint via Visio or Lucidchart. Strictly 2D flat vectors. CRITICAL COLOR THEME: Warm off-white (#E4E3E0) canvas. Use light gray (#D9D8D6) for structural container boundaries. Deep black (#141414) for all distinct nodes and typography. Tie the entire journey together using strict, right-angled electric green (#22C55E) data flow arrows. Professional, understated elegance, matching corporate branding exactly.
---

## 4.3 Research Input and Progress Interface

**Description:**
The interactive intake layer where users define business parameters, upload proprietary documents, and track real-time research progress. Features a dynamic questionnaire (`FormIntake`), document drop-zone for supporting PDFs, and a live progress tracker showing which harvesters (Web / Gov / Rental) have completed their cycles. All inputs are validated against the LGD mapping and NAICS ontology before fan-out.

**Image Generation Prompt:**
> **Prompt:** A clean, minimalist UI dashboard interface showing a research intake form and progress tracker. Flat 2D vector design. Left: A structured questionnaire card with input fields. Right: A vertical progress pipeline showing three sequential stages — "Ingesting," "Harvesting," "Synthesizing" — with checkmarks. CRITICAL COLOR THEME: Warm off-white (#E4E3E0) background. Deep black (#141414) for all typography, borders, and form fields. Light gray (#D9D8D6) for subtle divider lines and inactive progress bars. Use electric green (#22C55E) exclusively for active progress indicators, completed checkmarks, and the primary submit / track button. No 3D, no gradients, purely flat corporate documentation style.

---

## 4.4 Competitor Intelligence Results Data Room

**Description:**
A secured, shareable data room that aggregates verified competitor analysis, pricing benchmarks, and market positioning findings. Presents structured comparison matrices, citation-linked source documents, and geo-tagged competitor location maps. All claims inside the Data Room have passed the Hallucination Firewall and include direct links back to the original harvested sources.

**Image Generation Prompt:**
> **Prompt:** A professional data-room layout diagram showing a secure comparison workspace. Flat 2D vector design with three distinct zones: Top header bar labeled "Competitor Intelligence Data Room"; Middle section showing a structured table comparing metrics (Pricing, Market Share, Ratings); Bottom section showing linked source document thumbnails. CRITICAL COLOR THEME: Warm off-white (#E4E3E0) background. Deep black (#141414) for all table borders, typography, and document icons. Light gray (#D9D8D6) for subtle grid lines and inactive table headers. Highlight the verified / verified-badge icons and active comparison rows with electric green (#22C55E). Strict grid alignment, flat corporate aesthetic, no shadows or 3D elements.

---

## 4.5 Government Statistics Dashboard

**Description:**
A dedicated visualization layer rendering cleaned government statistics (Census, LGD, budget allocations) as interactive charts, choropleth maps, and filtered tables. Data is pulled directly from the Gov Data Engine / ChromaDB cache and standardized against LGD mappings. Users can toggle between district-level and subdistrict-level views and export the underlying CSV for further analysis.

**Image Generation Prompt:**
> **Prompt:** A clean, minimalist analytics dashboard showing government statistics visualizations. Flat 2D vector design. Top: A horizontal filter bar with dropdown selectors. Middle-left: A choropleth map of India with color-coded districts. Middle-right: A vertical bar chart showing statistical metrics. Bottom: A clean data table with standardized LGD names. CRITICAL COLOR THEME: Warm off-white (#E4E3E0) background. Deep black (#141414) for all map outlines, chart axes, typography, and table borders. Light gray (#D9D8D6) for grid lines and secondary chart elements. Use electric green (#22C55E) exclusively for highlighted data points on the map, active chart bars, and primary filter buttons. No 3D, pure flat infographic style.

---

## 4.6 Final Verified Feasibility Report Render

**Description:**
The terminal output stage where all harvested data (Web, Gov, Rental) is merged with firewall-verified claims to produce a polished, citation-rich feasibility report. The render delivers structured sections — Executive Summary, Verified Findings, Geo-Mapped Evidence, Competitor Benchmark, and Government Context — each with inline citations and downloadable PDF / Markdown exports. Every assertion in this report has passed the deterministic math-check and citation cross-reference.

**Image Generation Prompt:**
> **Prompt:** A polished final report layout showing a multi-section feasibility document. Flat 2D vector design resembling a high-end corporate PDF render. Top: Title header "Verified Feasibility Report" with a green verification seal. Middle: Structured sections with clear headings — Executive Summary, Verified Findings, Geo Evidence, Competitor Analysis, Government Statistics. Bottom: A footer with citation index and export buttons. CRITICAL COLOR THEME: Pure white (#FFFFFF) background for document pages, warm off-white (#E4E3E0) for section dividers and header bands. Deep black (#141414) for all headings, body text, and section borders. Light gray (#D9D8D6) for subtle vertical dividers and table grid lines. Highlight the verification seal, active section headers, and export action buttons with electric green (#22C55E). Strict typography hierarchy, absolutely flat, professional editorial design.

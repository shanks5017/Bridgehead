

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string; // Unique username for login
  avatar?: string; // URL or placeholder
  bio?: string;
  phone?: string;
  profilePicture?: string; // URL to image file (or legacy base64)
  originalProfilePicture?: string; // URL to original image for re-editing
  profilePictureFile?: File; // File object for new upload (frontend only)
  originalProfilePictureFile?: File; // Original file for re-editing (frontend only)
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  business_stage?: string;
  primary_city?: string;
  business_type_interest?: string;
  total_budget_range?: string;
  founder_experience?: string;
  onboarding_completed?: boolean;
}

export enum View {
  HOME,
  DASHBOARD,
  FEED,
  DEMAND_FEED,
  POST_DEMAND,
  RENTAL_LISTINGS,
  POST_RENTAL,
  AI_SUGGESTIONS,
  COMMUNITY_FEED,
  DEMAND_DETAIL,
  RENTAL_DETAIL,
  SAVED_POSTS,
  AI_MATCHES,
  COLLABORATION,
  SIGN_IN,
  SIGN_UP,
  PROFILE,
  RESEARCH,
  BUSINESS_RESEARCH,
  TESTING,
}

// ── Dashboard & Execution Types ──────────────────────────────────────────────

export interface DashboardTask {
  id: string;
  title: string;
  category: 'legal' | 'space' | 'capex' | 'marketing' | 'operations' | 'general';
  isCompleted: boolean;
  dueDate?: string;
  source?: string;
}

export interface VentureTimelineConfig {
  timelineDays: number; // e.g. 30, 45, 60, 90, 180, 365, or custom
  targetLaunchDate: string; // ISO date string
  startDate: string;
  label?: string;
}

// ── Research Engine Types ─────────────────────────────────────────────────────

export interface ResearchInput {
  businessType: string;
  location: string;
  budget: number;
  spaceReq: string;
  businessFormat: string;
  targetCustomer?: string;
  openToAlternate?: boolean;
}

export interface FeasibilityReport {
  '00_verdict_bar': {
    score: { value: number; tag: string; logic: string };
    label: 'GO' | 'CAUTION' | 'STOP';
    brutal_honesty: string;
    _verdict: string;
  };
  '01_money_reality': {
    avg_rent: { value: number; tag: string; source: string };
    price_range: string;
    budget_runway_months: { value: number; tag: string };
    cheaper_zones: { area: string; est_rent: string; reason: string }[];
    _verdict: string;
  };
  '02_competitor_landscape': {
    density: { radius_1km: number; radius_3km: number; radius_5km: number };
    top_competitors: { name: string; rating: string; price: string; usp: string }[];
    gap_analysis: string;
    _verdict: string;
  };
  '03_demand_signals': {
    zone_type: string;
    addressable_market: { estimate: number; calculation: string; tag: string };
    search_trend: string;
    proximity_flags: { colleges: string; offices: string };
    _verdict: string;
  };
  '04_startup_cost_reality': {
    equipment: { value: number; tag: string };
    deposit: { value: number; tag: string };
    interiors: { value: number; tag: string };
    licensing: { value: number; tag: string };
    total_setup_cost: { value: number; tag: string };
    budget_gap: { value: number; tag: string };
    breakeven_members: number;
    _verdict: string;
  };
  '05_govt_and_civic': {
    civic_impact: string;
    schemes: { name: string; max_amount: string; how_to_apply: string }[];
    licenses: { name: string; cost: string; where: string }[];
    _verdict: string;
  };
  '06_risk_register': { severity: string; title: string; description: string; mitigation: string; cost: string }[];
  '07_final_verdict_and_action_plan': {
    final_verdict: string;
    action_plan: { week: number; task: string; detail: string }[];
    alternatives_if_stop: { business: string; reason: string }[];
    data_confidence_pct: Record<string, string>;
    _verdict: string;
  };
  _firewall?: { violations_corrected: number };
  _fallback?: boolean;
}

// ── Business Research Engine Types ───────────────────────────────────────────

export interface BusinessResearchInput {
  // Core
  businessName?: string;
  businessType: string;
  businessDescription?: string;
  businessFormat: string; // "Brick & Mortar" | "Online" | "Hybrid" | "SaaS" | "Service"
  // Location
  location: string;
  targetMarket?: string;
  // Financial
  totalBudget: number;
  workingCapital?: number;
  monthlyBurnTarget?: number;
  revenueGoal12Months?: number;
  pricingModel?: string;
  avgTicketSize?: number;
  // Model
  businessModel?: string; // B2C | B2B | B2B2C | Marketplace | SaaS
  uniqueValueProposition?: string;
  knownCompetitors?: string[];
  differentiators?: string[];
  // Operations
  spaceRequired?: string;
  expectedTeamSize?: number;
  launchTimeline?: string;
  currentStage?: string;
  // Founder
  founderExperience?: string;
  targetCustomerPersona?: string;
  primaryChannel?: string;
  existingLicences?: string[];
  // Report config
  reportSections?: string[];
  includeRoadmap?: boolean;
  includeFinancials?: boolean;
  includeMarketing?: boolean;
  includeCompetitors?: boolean;
  includeSOPs?: boolean;
}

export interface FullBusinessReport {
  _meta: {
    generated_at: string;
    input_summary: Record<string, any>;
    evidence_sources: Record<string, any>;
    firewall_violations: number;
  };
  business_plan?: {
    executive_summary: {
      one_liner: string;
      problem: string;
      solution: string;
      market_opportunity: string;
      competitive_moat: string;
      verdict: 'GO' | 'CAUTION' | 'STOP';
      verdict_rationale: string;
    };
    jobs_to_be_done: {
      functional_jobs: string[];
      social_jobs: string[];
      emotional_jobs: string[];
      current_substitutes: string[];
      desired_outcomes: string[];
    };
    offer_design: {
      core_offer: string;
      offer_stack: string[];
      dream_outcome: string;
      perceived_likelihood: string;
      time_to_result: string;
      effort_required: string;
    };
    monopoly_analysis: {
      first_market: string;
      proprietary_tech_or_data: string;
      network_effects: string;
      economies_of_scale: string;
      brand: string;
      copycat_barrier_6_months: string;
    };
    product_definition: {
      one_brilliant_thing: string;
      first_5_minutes_experience: string[];
      what_to_cut: string[];
      mvp_scope: string[];
    };
  };
  financials?: {
    startup_costs: {
      setup_total: number;
      breakdown: { item: string; amount: number; source: string }[];
      budget_gap: number;
      contingency_recommended: number;
      data_confidence: string;
    };
    unit_economics: {
      avg_revenue_per_customer: number;
      cogs_per_unit: number;
      gross_margin_pct: number;
      cac_estimate: number;
      ltv_estimate: number;
      ltv_to_cac_ratio: number;
      payback_months: number;
      notes: string;
    };
    monthly_projections_12m: {
      month: number; customers: number; revenue: number;
      expenses: number; net: number; cumulative_burn: number;
    }[];
    scenarios: {
      conservative: { monthly_customers: number; break_even_month: number; year1_revenue: number };
      base: { monthly_customers: number; break_even_month: number; year1_revenue: number };
      optimistic: { monthly_customers: number; break_even_month: number; year1_revenue: number };
    };
    pricing_analysis: {
      recommended_price_tier: string;
      price_too_cheap_threshold: number;
      price_too_expensive_threshold: number;
      ideal_range_min: number;
      ideal_range_max: number;
      pricing_rationale: string;
    };
    runway: {
      months_of_runway: number;
      critical_milestone: string;
      fundraise_or_revenue_flag: string;
    };
  };
  competitive_analysis?: {
    competitor_matrix: {
      name: string; type: string; strengths: string[];
      weaknesses: string[]; pricing: string;
      market_share_estimate: string; threat_level: string;
    }[];
    competitive_gaps: { gap: string; opportunity_size: string; how_to_exploit: string }[];
    blue_ocean_grid: { eliminate: string[]; reduce: string[]; raise: string[]; create: string[] };
    five_forces: Record<string, string>;
    positioning_recommendation: {
      positioning_statement: string;
      price_positioning: string;
      differentiation_axes: string[];
    };
  };
  marketing_strategy?: {
    storybrand_script: {
      character: string;
      problem: { external: string; internal: string; philosophical: string };
      guide: string;
      plan: string[];
      call_to_action: { direct: string; transitional: string };
      failure_avoided: string;
      success_achieved: string;
    };
    landing_page_wireframe: {
      hero_headline: string;
      hero_subheadline: string;
      social_proof_hook: string;
      primary_cta: string;
      three_step_simplifier: string[];
      objection_crushers: { objection: string; response: string }[];
      secondary_cta: string;
    };
    acquisition_channels: {
      channel: string; cac_estimate: string; time_to_results: string;
      effort: string; recommended_tactics: string[]; priority: number;
    }[];
    content_strategy: {
      hook_formula: string; content_pillars: string[];
      first_30_days_plan: string[]; lead_magnet_idea: string;
    };
    launch_sequence: { pre_launch: string[]; launch_day: string[]; post_launch: string[] };
  };
  roadmap?: {
    '90_day_roadmap': {
      month_1: any; month_2: any; month_3: any;
    };
    critical_milestones: { milestone: string; target_date: string; success_metric: string; risk_if_missed: string }[];
    sops: { process_name: string; trigger: string; steps: string[]; owner: string; tools_needed: string[]; quality_check: string }[];
    risk_register: { risk: string; probability: string; impact: string; mitigation: string; contingency: string }[];
    licensing_checklist: { licence: string; authority: string; timeline: string; cost_estimate: string; status: string }[];
    team_structure: { day_1_roles: any[]; month_3_roles: any[]; tools_stack: any[] };
  };
  evidence?: {
    rentals?: any[];
    competitors?: any[];
    govSchemes?: any[];
    schemes?: any[];
    demandSignals?: any[];
  };
  evidence_summary?: {
    rentals?: any[];
    competitors?: any[];
    schemes?: any[];
  };
}

export interface BusinessResearchSSEEvent {
  type: 'research_started' | 'progress' | 'section_complete' | 'report_ready' | 'error';
  stage?: string;
  section?: string;
  label?: string;
  message?: string;
  pct?: number;
  report?: FullBusinessReport;
  evidence_summary?: any;
  firewall_violations_total?: number;
  timestamp?: string;
}

export interface SSEEvent {
  stage: string;
  status?: string;
  message?: string;
  url?: string;
  count?: number;
  platforms?: string[];
  topNames?: string[];
}

export interface MatchResult {
  demandId: string;
  rentalId: string;
  reasoning: string;
  confidenceScore: number;
}

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

export interface DemandPost {
  id: string;
  title: string;
  category: string;
  description: string;
  location: Location;
  images: string[]; // Array of base64 strings
  upvotes: number;
  upvotedBy?: string[];
  createdAt: string;
  phone?: string;
  email?: string;
  openToCollaboration: boolean;
  status?: 'active' | 'solved';
  createdBy?: string; // User ID who created this post
  hashtags?: string[];
}

export interface RentalPost {
  id: string;
  title: string;
  category: string;
  description: string;
  location: Location;
  images: string[]; // Array of base64 strings
  price: number; // Monthly rent
  squareFeet: number;
  upvotes: number;
  upvotedBy?: string[];
  createdAt: string;
  phone?: string;
  email?: string;
  openToCollaboration: boolean;
  status?: 'active' | 'rented';
  createdBy?: string; // User ID who created this post
  hashtags?: string[];
}

export interface MediaItem {
  type: 'image' | 'video';
  url: string; // base64 string
}

export interface CommunityPost {
  id: string;
  author: string;
  username: string;
  avatar: string; // URL or placeholder identifier
  content: string;
  media?: MediaItem[];
  likes: number;
  reposts: number;
  replies: number;
  isLiked: boolean;
  isReposted: boolean;
  createdAt: string;
  topic?: string;
  hashtags?: string[];
}

export interface Message {
  id: string;
  senderId: 'currentUser' | string;
  text: string;
  media?: MediaItem[];
  timestamp: string;
}

export interface Conversation {
  id: string;
  postId: string; // The post this conversation is about
  participant: {
    id: string;
    name: string;
    avatar: string; // URL or placeholder
    postTitle: string;
  };
  messages: Message[];
  lastMessageTimestamp: string;
  unreadCount: number;
  role: 'owner' | 'seeker'; // 'owner' = My Demand, 'seeker' = Opportunity
}
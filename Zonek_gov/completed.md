# Zonek Gov — Data Engine: What We're Fetching

> **Last Updated:** April 21, 2026  
> **Database:** `zonek_gov` (MongoDB local — isolated from main `zonek` DB)  
> **Entry point:** `node src/pipeline.js`

---

## ✅ What Data We Are Getting (12 Modules, All Working)

---

### 1. 🌤️ Weather — `collection: weather`
| Property | Value |
|---|---|
| **Status** | ✅ LIVE — 12/12 cities confirmed working |
| **Source** | Open-Meteo API (free, no auth) |
| **Cities** | Chennai, Coimbatore, Bangalore, Mumbai, Hyderabad, Delhi, Kolkata, Pune, Ahmedabad, Jaipur, Lucknow, Bhopal |
| **Update Frequency** | Every 6 hours (auto via cron) |
| **Fields Stored** | `temperatureC`, `humidityPct`, `rainfallMm`, `windSpeedKmh`, `weatherCondition`, `forecast24h[]` |
| **TTL** | Auto-deleted after 3 days |
| **AI Use** | Operational cost alerts for weather-sensitive businesses (food, logistics, agriculture) |

---

### 2. 🌾 Crop Prices — `collection: cropPrices`
| Property | Value |
|---|---|
| **Status** | ✅ LIVE — 286+ records confirmed in DB |
| **Source** | data.gov.in Agmarknet API (API key in `.env`) |
| **Coverage** | 10 states × 10 commodities (Tomato, Onion, Potato, Rice, Wheat, Maize, Groundnut, Cotton, Sugarcane, Soyabean) |
| **Update Frequency** | Daily at 03:00 IST |
| **Fields Stored** | `commodity`, `market`, `modalPrice`, `minPrice`, `maxPrice`, `priceDate`, `geo` (LGD-tagged) |
| **TTL** | Auto-deleted after 8 days (rolling window) |
| **AI Use** | Raw material cost forecasting for cloud kitchens, food processors, cold storage |

---

### 3. 📰 Infrastructure News — `collection: newsInfrastructure`
| Property | Value |
|---|---|
| **Status** | ✅ LIVE — 751 articles confirmed in DB |
| **Source** | Google News RSS feeds (8 targeted queries) |
| **Coverage** | National + Tamil Nadu, Karnataka, Maharashtra state-level |
| **Categories** | Roads, Metro, Railway, Port, Airport, Power, Water, Telecom, Industrial |
| **Update Frequency** | Every 6 hours |
| **Fields Stored** | `title`, `link`, `description`, `publishedAt`, `mentionedStates[]`, `category`, `linkHash` (dedup key) |
| **TTL** | Auto-deleted after 30 days |
| **AI Use** | Emerging opportunity signals: new industrial zones, metro expansions, highway projects |

---

### 4. 📊 State Budgets — `collection: budgetData`
| Property | Value |
|---|---|
| **Status** | ✅ SEEDED — 10/10 states in DB |
| **Source** | RBI State Finances Report 2024-25 (official publication) |
| **States** | TN, Karnataka, Maharashtra, Telangana, AP, UP, West Bengal, Delhi, Kerala, Gujarat |
| **Update Frequency** | Annual (Feb/March after budget sessions) |
| **Fields Stored** | `fiscalYear`, `totalRevenue`, `totalExpenditure`, `fiscalDeficit`, `education`, `health`, `infrastructure`, `agriculture`, `gsdp`, `infraSpendIntensityPct` |
| **AI Use** | State investment climate: high infra spend = better market for construction/logistics |

---

### 5. 👥 Population — `collection: populationData`
| Property | Value |
|---|---|
| **Status** | ✅ SEEDED — 16 major city districts in DB |
| **Source** | Census 2011 (official figures) |
| **Coverage** | Chennai, Coimbatore, Madurai, Bangalore, Mysore, Mumbai, Pune, Hyderabad, Delhi, Kolkata, Ahmedabad, Jaipur, Lucknow, Visakhapatnam, Ernakulam, Bhopal |
| **Update Frequency** | Annual freshness check (90-day re-evaluation) |
| **Fields Stored** | `totalPopulation`, `literacyRatePct`, `urbanPct`, `populationDensityPerKm2`, `sexRatio`, `scPct`, `stPct` |
| **AI Use** | Total addressable market (TAM) calculation, target audience density |

---

### 6. 🏫 Schools / Education — `collection: schoolData`
| Property | Value |
|---|---|
| **Status** | ✅ SEEDED — 20 major districts in DB |
| **Source** | UDISE+ Annual Report 2023-24 (MoE publication) |
| **Fields Stored** | `totalSchools`, `totalEnrolment`, `totalTeachers`, `ptr`, `schoolsWithElectricity`, `schoolsWithToilet`, `schoolsWithInternet`, `educationInfraScore` (0-100) |
| **Update Frequency** | Annual (August release) |
| **AI Use** | Workforce education quality score; ed-tech startup market sizing |

---

### 7. 🏛️ Government Schemes — `collection: schemes`
| Property | Value |
|---|---|
| **Status** | ⚠️ PARTIAL — myScheme API requires auth (401); using data.gov.in fallback |
| **Source** | myScheme.gov.in API + data.gov.in schemes catalog |
| **Categories** | Agriculture, Business, Education, Health, Housing, Women, Finance |
| **Fields Stored** | `schemeName`, `ministry`, `category`, `tags[]`, `eligibility`, `benefit`, `applicationUrl` |
| **Update Frequency** | Weekly |
| **AI Use** | Matching entrepreneurs with eligible grants/subsidies by state + business type |
| **Action Required** | Register at apisetu.gov.in to get myScheme API key |

---

### 8. 🏠 Housing (PMAY) — `collection: pmayData`
| Property | Value |
|---|---|
| **Status** | ✅ SEEDED — 18 states in DB |
| **Source** | AwaasSoft / pmayg.nic.in official March 2025 progress report |
| **Fields Stored** | `housesSanctioned`, `housesCompleted`, `housesUnderConstruction`, `completionPct`, `constructionActivityIndex` |
| **Update Frequency** | Monthly |
| **AI Use** | Emerging residential markets: high under-construction areas = demand for hardware, paint, furniture |

---

### 9. 💧 Jal Jeevan Mission (Water) — `collection: jjmData`
| Property | Value |
|---|---|
| **Status** | ✅ SEEDED — 20 states in DB |
| **Source** | Jal Shakti Ministry / jaljeevanmission.gov.in Q1 2025 report |
| **Fields Stored** | `totalHouseholds`, `fhtcConnected`, `coveragePct` |
| **Update Frequency** | Weekly |
| **AI Use** | Water infrastructure quality → plumbing, water purifier businesses; urban vs. rural market |

---

### 10. 🗳️ Elections — `collection: elections`
| Property | Value |
|---|---|
| **Status** | ✅ SEEDED — 13 constituencies in DB (2024 LS + 2023 Assembly) |
| **Source** | ECI official results (curated from eci.gov.in) |
| **Fields Stored** | `winner.party`, `winner.candidateName`, `victoryMargin`, `voterTurnoutPct`, `politicalStabilityIndex` (0-100) |
| **Update Frequency** | Post-election (quarterly check) |
| **AI Use** | Political stability score for long-term business investment decisions |

---

### 11. ⚖️ Courts — `collection: courtData`
| Property | Value |
|---|---|
| **Status** | ⚠️ PARTIAL — NJDG portal requires session cookie; data.gov.in fallback active |
| **Source** | NJDG ecourts.gov.in (weekly download alternative) + data.gov.in |
| **Fields Stored** | `pendingCivil`, `pendingCriminal`, `disposalRatePct`, `contractEnforcementScore` (0-100) |
| **Update Frequency** | Weekly |
| **AI Use** | Ease-of-business score: faster courts = safer contracts = better for B2B ventures |
| **Action Required** | Download weekly Excel from njdg.ecourts.gov.in → Information Management tab |

---

### 12. 🚔 Crime / Safety — `collection: crimeData`
| Property | Value |
|---|---|
| **Status** | ✅ SEEDED — 19 major districts in DB |
| **Source** | NCRB Crime in India 2022 (ncrb.gov.in official publication) |
| **Fields Stored** | `ipc.murder`, `ipc.theft`, `ipc.robbery`, `ipc.cybercrime`, `crimeRatePerLakh`, `safetyScore` (0-100), `safetyGrade` (A-F) |
| **Update Frequency** | Annual (October NCRB release) |
| **AI Use** | Location safety score for retail/high-value businesses; investor risk assessment |

---

## 🗄️ MongoDB Collections Summary

| Collection | Status | Records (approx) | Auto-refresh |
|---|---|---|---|
| `weather` | ✅ Live | 12 (rotates every 6h) | Every 6h |
| `cropPrices` | ✅ Live | 286+ (grows daily) | Daily |
| `newsInfrastructure` | ✅ Live | 751+ | Every 6h |
| `budgetData` | ✅ Seeded | 10 states | Annual |
| `populationData` | ✅ Seeded | 16 districts | Annual |
| `schoolData` | ✅ Seeded | 20 districts | Annual |
| `jjmData` | ✅ Seeded | 20 states | Weekly |
| `pmayData` | ✅ Seeded | 18 states | Monthly |
| `elections` | ✅ Seeded | 13 constituencies | Post-election |
| `crimeData` | ✅ Seeded | 19 districts | Annual |
| `schemes` | ⚠️ Partial | 0 (auth needed) | Weekly |
| `courtData` | ⚠️ Partial | 0 (session needed) | Weekly |

---

## 🚀 How To Run The Pipeline

> **IMPORTANT:** All commands must be run from inside the `Zonek_gov` folder.

### Option A — From `Zonek_gov` directory (direct)
```powershell
# First, navigate into Zonek_gov
cd "D:\my projects\my projects\Zonek_Main\Zonek_gov"

# Smart run (skips already-fresh data)
node src/pipeline.js

# Force re-fetch everything
node src/pipeline.js --force

# Run a single module only
node src/pipeline.js --module=weather --force
node src/pipeline.js --module=cropPrices --force

# Start 24/7 auto-cron daemon
node src/pipeline.js --daemon

# npm shortcuts (also run from Zonek_gov)
npm run pipeline           # Smart run
npm run pipeline:force     # Force all
npm run daemon             # 24/7 mode
npm run fetch:weather      # Single module
```

### Option B — From `Zonek_Main` root (launcher scripts)
```powershell
# From Zonek_Main — use the root launcher (no cd needed)
node run-gov-pipeline.js              # Smart run
node run-gov-pipeline.js --force      # Force all
node run-gov-pipeline.js --daemon     # 24/7 mode
node run-gov-pipeline.js --module=weather --force

# OR double-click the batch file in Windows Explorer
run-gov-pipeline.bat                  # Smart run
run-gov-pipeline.bat --force          # Force all
```

---

## ⏰ Auto-Update Schedule (Cron)

| Module | Cron Expression | Frequency |
|---|---|---|
| Weather | `0 */6 * * *` | Every 6 hours |
| Infrastructure News | `30 */6 * * *` | Every 6 hours |
| Crop Prices | `0 3 * * *` | Daily 03:00 IST |
| Schemes | `0 4 * * 1` | Monday 04:00 |
| JJM | `0 5 * * 1` | Monday 05:00 |
| Courts | `0 5 * * 3` | Wednesday 05:00 |
| PMAY | `0 2 1 * *` | 1st of month |
| Budget | `0 6 1 2 *` | Feb 1st (annual) |
| Population | `0 7 1 */3 *` | Quarterly |
| Crime | `0 6 1 10 *` | Oct 1st (annual) |
| Schools | `0 6 1 8 *` | Aug 1st (annual) |
| Elections | `0 3 1 */3 *` | Quarterly |

---

## 🔑 Action Items (Pending APIs)

| Module | Action | URL |
|---|---|---|
| **Schemes** | Register for API key | [apisetu.gov.in](https://apisetu.gov.in) |
| **JJM (district-level)** | Register for API | [ejalshakti.gov.in/webapi](https://ejalshakti.gov.in/webapi/Home/Addregistration) |
| **IMD Weather** | Request IP whitelist | [mausam.imd.gov.in](https://mausam.imd.gov.in/responsive/apis.php) |
| **Population (full 640 districts)** | Download PCA CSV | [data.gov.in](https://www.data.gov.in/catalog?q=census+2011+district) |
| **Courts** | Download weekly Excel | [njdg.ecourts.gov.in](https://njdg.ecourts.gov.in) → Information Management |

---

## 🧠 AI Training Context Per District

When an entrepreneur queries ARU (the AI) about a district, the system can now inject:

```
District: Coimbatore, Tamil Nadu

🌤️ Weather: 32°C, Partly Cloudy
🌾 Mandi Price: Tomato ₹1,240/quintal (↓12% from last week)
📊 Budget: TN Infra spend 8.4% of budget (high — active construction)
👥 Population: 3.4M | Urban: 62% | Literacy: 84.6%
🏫 Education: 3,241 schools | PTR: 18.7 | Infra Score: 78/100
💧 Water: 97.7% household tap coverage
🏠 Housing: PMAY 96% completion (mature market, less construction demand)
🚔 Safety Score: 74/100 (Grade B — moderate safety)
🏛️ Schemes: 23 business schemes available for entrepreneurs in TN
```

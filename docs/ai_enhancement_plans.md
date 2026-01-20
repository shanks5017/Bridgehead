# 🤖 AI Enhancement Plans - Bridgehead

> **Document Version**: 1.0  
> **Last Updated**: December 24, 2025  
> **Parent Document**: [plans.md](file:///d:/og%20project/Bridgehead/docs/plans.md)  
> **Priority**: 🟡 MEDIUM

---

## 📋 Table of Contents

1. [Current AI Implementation](#current-ai-implementation)
2. [Backend AI Service Layer](#backend-ai-service-layer)
3. [Ollama Integration](#ollama-integration)
4. [ARU Bot Enhancement](#aru-bot-enhancement)
5. [Cost Optimization](#cost-optimization)
6. [Questions for Clarification](#questions-for-clarification)

---

## 📍 Current AI Implementation

### Existing Features

| Feature | File | Model | Status |
|---------|------|-------|--------|
| Business Ideas | `geminiService.ts` | Gemini 2.5-flash/pro | ✅ Working |
| Demand-Rental Matching | `geminiService.ts` | Gemini 2.5-flash | ✅ Working |
| Chatbot (ARU) | `Chatbot.tsx` | Gemini 2.5-flash | ⚠️ API key exposed |

### Critical Issue

```typescript
// Chatbot.tsx - DANGEROUS
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
// API key bundled in frontend JS, visible to anyone!
```

---

## 🔧 Backend AI Service Layer

### Target Architecture

```
Frontend → fetch('/api/ai/...') → Backend API → AI Service → Gemini/Ollama
                                       ↓
                                  API_KEY (secure)
```

### New API Endpoints

| Endpoint | Purpose | Rate Limit |
|----------|---------|------------|
| POST `/api/ai/chat` | Chatbot conversations | 20/min |
| POST `/api/ai/ideas` | Business suggestions | 10/min |
| POST `/api/ai/matches` | Demand-Rental matching | 5/min |
| POST `/api/ai/geocode` | Address geocoding | 30/min |

### Files to Create

- `backend/controllers/aiController.ts` - AI API handlers
- `backend/routes/ai.ts` - Route definitions
- `backend/services/aiService.ts` - Gemini wrapper

---

## 🦙 Ollama Integration

### Why Ollama?

| Gemini | Ollama |
|--------|--------|
| Pay per token | Free (self-hosted) |
| Data to Google | Data stays local |
| Rate limited | Always available |

### Setup

```bash
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull llama3.2:3b    # Fast, 2GB RAM
ollama pull mistral:7b     # Better quality, 4GB RAM
```

### Hybrid Strategy

- Simple queries → Ollama (free)
- Complex analysis → Gemini (paid)

---

## 🤖 ARU Bot Enhancement

### Enhanced System Prompt

```
You are ARU, the AI assistant for Bridgehead.

Your Knowledge:
- Bridgehead connects demands with entrepreneurs
- Users post demands & browse rentals
- AI matches demands with properties

Your Capabilities:
- Answer platform questions
- Guide posting/listings
- Provide business advice

Personality: Helpful, concise, encouraging
```

### Platform Context Integration

- Include recent demands in context
- Reference success stories
- RAG-style knowledge retrieval

---

## 💰 Cost Optimization

### Strategies

| Strategy | Savings |
|----------|---------|
| Use Flash for simple tasks | ~80% |
| Cache common responses | ~30% |
| Use Ollama for FAQs | ~100% |
| Limit response length | ~20% |

### Token Tracking

Track daily usage per model for budget monitoring.

---

## ❓ Questions for Clarification

### AI Strategy
1. **Model Preference**: Gemini only, Ollama only, or hybrid?
2. **Monthly AI Budget**: < $10, $10-50, or $50+?
3. **Fine-tuning**: Any custom models planned?

### Features
4. **RAG Depth**: Basic (recent posts) or deep (full platform)?
5. **Ollama Hosting**: Same server or separate?

---

## 📁 Files to Create

| File | Purpose | Priority |
|------|---------|----------|
| `backend/controllers/aiController.ts` | AI endpoints | 🔴 CRITICAL |
| `backend/routes/ai.ts` | AI routes | 🔴 CRITICAL |
| `backend/services/aiService.ts` | AI service | 🔴 CRITICAL |
| `backend/services/ollamaService.ts` | Ollama client | 🟡 MEDIUM |

### Files to Modify

| File | Changes | Priority |
|------|---------|----------|
| `Chatbot.tsx` | Use backend API | 🔴 CRITICAL |
| `AISuggestions.tsx` | Use backend API | 🔴 HIGH |
| `services/geminiService.ts` | Move to backend | 🔴 CRITICAL |

---

*Last updated: December 24, 2025*

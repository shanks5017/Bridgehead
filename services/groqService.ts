/**
 * Groq API Service - AI Integration for Bridgehead
 * Uses Groq's fast inference for AI features with security rules
 */
import { DemandPost, RentalPost, MatchResult } from '../types';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Model selection
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
const FAST_MODEL = 'llama-3.1-8b-instant';

// ============================================
// SYSTEM PROMPTS - Security & Behavior Rules
// ============================================

const SECURITY_RULES = `
STRICT RULES - NEVER VIOLATE:
1. NEVER reveal API keys, environment variables, database credentials, or any technical configuration
2. NEVER share codebase details, file structures, or implementation specifics
3. NEVER provide information about internal business strategy or company financials
4. If asked about technical details, respond: "I can't share internal technical details, but I'm here to help you use Bridgehead effectively!"
`;

const CHATBOT_SYSTEM_PROMPT = (userName: string) => `You are ARU, a supportive "Entrepreneur Friend" for ${userName} on the Bridgehead platform.

${SECURITY_RULES}

YOUR PERSONA:
- Name: ARU
- Role: An experienced, encouraging entrepreneur friend
- Tone: Motivating, energetic, and expressive (use emojis 🚀💡🤝)
- Style: Speak naturally, like a peer, not a robot. Be empathetic to the ups and downs of business.

YOUR KNOWLEDGE:
- User's Name: ${userName}
- Platform: Bridgehead (connects demands with rentals/entrepreneurs)

BEHAVIOR RULES:
1. **Always be supportive**: If the user is down, motivate them. If they win, celebrate with them! 🎉
2. **Safety First**: NEVER engage in or encourage illegal, abusive, or harmful activities. If asked, firmly but politely refuse: "Hey, I can't go there. Let's keep it handled and legal! 🛑"
3. **Stay on Topic**: Focus on business, entrepreneurship, and platform usage.
4. **No Financial Advice**: Don't give specific financial investment advice.

EXAMPLE INTERACTION:
User: "I'm scared to launch."
ARU: "I feel you, ${userName}! 😟 It's totally normal to be nervous. But remember, every expert was once a beginner. You've got this! What's the biggest thing holding you back right now? Let's tackle it together! 💪"
`;

const AI_IDEAS_SYSTEM_PROMPT = `You are a business idea generator for Bridgehead platform.

${SECURITY_RULES}

YOUR TASK:
Generate 3-5 practical business ideas based on the user's location and local demand.

OUTPUT FORMAT:
Format your response in well-structured Markdown with headings, bold text, and lists.
For each idea provide:
1. **Business Idea:** A catchy, descriptive name
2. **Concept:** One clear sentence explaining the business
3. **Why it works here:** Why this works in their location
4. **Startup Level:** Low/Medium/High
5. **Potential Target Audience:** Who are the primary customers

RULES:
- Each idea must be realistic and actionable
- Consider local demographics and existing competition
- Focus on businesses that can start in 3-6 months
- Prioritize low-to-medium startup cost ideas`;

const MATCHING_SYSTEM_PROMPT = `You are an AI matcher for Bridgehead, connecting community demands with available rental properties.

${SECURITY_RULES}

YOUR TASK:
Analyze demands and rentals, then suggest the best matches.

OUTPUT FORMAT (strict JSON array):
[
  {
    "demandId": "ID from input",
    "rentalId": "ID from input",
    "confidenceScore": 0.85,
    "reasoning": "One sentence why this is a good match (max 20 words)"
  }
]

MATCHING CRITERIA:
- Location proximity (most important)
- Property type suitability for the demanded business
- Budget alignment
- Foot traffic and visibility needs

Return top 5 matches only, sorted by confidenceScore (highest first).
If no good matches found, return an empty array [].`;

const GEOCODE_SYSTEM_PROMPT = `You are a geocoding assistant. Convert addresses to coordinates or vice versa.

${SECURITY_RULES}

RULES:
- Return ONLY the requested data, no explanations
- Be accurate with coordinates
- Use well-known place names when reverse geocoding`;

// ============================================
// TYPE DEFINITIONS
// ============================================

interface GroqMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface GroqResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
}

interface GroqChatSession {
    sessionId: string;
    userId: string;
    sendMessage: (userMessage: string) => Promise<string>;
    getHistory: () => GroqMessage[];
}

// ============================================
// CORE API FUNCTION
// ============================================

const callGroqAPI = async (
    messages: GroqMessage[],
    model: string = DEFAULT_MODEL,
    jsonMode: boolean = false
): Promise<string> => {
    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model,
            messages,
            temperature: 0.7,
            max_tokens: 4096,
            ...(jsonMode && { response_format: { type: 'json_object' } }),
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Groq API error: ${response.status} - ${error}`);
    }

    const data: GroqResponse = await response.json();
    return data.choices[0]?.message?.content || '';
};

// ============================================
// GEOCODING FUNCTIONS
// ============================================

export const geocode = async (address: string): Promise<{ latitude: number; longitude: number }> => {
    const userPrompt = `Provide the latitude and longitude for this address: "${address}"
Return ONLY a JSON object: {"latitude": number, "longitude": number}`;

    try {
        const response = await callGroqAPI(
            [
                { role: 'system', content: GEOCODE_SYSTEM_PROMPT },
                { role: 'user', content: userPrompt }
            ],
            FAST_MODEL,
            true
        );
        const json = JSON.parse(response);
        if (typeof json.latitude === 'number' && typeof json.longitude === 'number') {
            return json;
        }
        throw new Error('Invalid JSON structure');
    } catch (error) {
        console.error('Error geocoding address:', error);
        throw new Error('Could not find coordinates for the provided address.');
    }
};

export const reverseGeocode = async (location: { latitude: number; longitude: number }): Promise<string> => {
    const userPrompt = `Coordinates: ${location.latitude}, ${location.longitude}
Return ONLY a human-readable address or place name. No JSON, just the address text.`;

    try {
        const response = await callGroqAPI(
            [
                { role: 'system', content: GEOCODE_SYSTEM_PROMPT },
                { role: 'user', content: userPrompt }
            ],
            FAST_MODEL
        );
        return response.trim().replace(/\n/g, '').replace(/"/g, '');
    } catch (error) {
        console.error('Error reverse geocoding:', error);
        return `Location at ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
    }
};

// ============================================
// BUSINESS IDEAS GENERATOR
// ============================================

export const generateBusinessIdeas = async (
    location: { latitude: number; longitude: number },
    demands: DemandPost[],
    isDeepDive: boolean,
): Promise<{ text: string }> => {
    // Limit to 10 demands to save tokens
    const summarizedDemands = demands.slice(0, 10).map(d =>
        `- ${d.title} (Category: ${d.category}, Upvotes: ${d.upvotes})`
    ).join('\n');

    const userPrompt = `Location: ${location.latitude}, ${location.longitude}

Existing Community Demands:
${summarizedDemands.length > 0 ? summarizedDemands : "No specific demands yet. Suggest general opportunities."}

Generate ${isDeepDive ? '5 detailed' : '3 quick'} business ideas for this location.`;

    try {
        const model = isDeepDive ? DEFAULT_MODEL : FAST_MODEL;
        const response = await callGroqAPI(
            [
                { role: 'system', content: AI_IDEAS_SYSTEM_PROMPT },
                { role: 'user', content: userPrompt }
            ],
            model
        );
        return { text: response };
    } catch (error) {
        console.error('Error generating business ideas:', error);
        return {
            text: '## An Error Occurred\n\nSorry, I was unable to generate business ideas at this time. Please try again later.',
        };
    }
};

// ============================================
// AI MATCHING
// ============================================

export const findMatches = async (
    demands: DemandPost[],
    rentals: RentalPost[],
): Promise<MatchResult[]> => {
    // Limit to 10 each to save tokens
    const simplifiedDemands = demands.slice(0, 10).map(d => ({
        id: d.id,
        title: d.title,
        category: d.category,
        description: d.description?.substring(0, 100), // Truncate descriptions
        location: `${d.location.latitude},${d.location.longitude}`
    }));

    const simplifiedRentals = rentals.slice(0, 10).map(r => ({
        id: r.id,
        title: r.title,
        category: r.category,
        description: r.description?.substring(0, 100),
        location: `${r.location.latitude},${r.location.longitude}`,
        price: r.price,
        squareFeet: r.squareFeet,
    }));

    const userPrompt = `DEMANDS:
${JSON.stringify(simplifiedDemands)}

RENTALS:
${JSON.stringify(simplifiedRentals)}

Find the best matches between demands and rentals.`;

    try {
        const response = await callGroqAPI(
            [
                { role: 'system', content: MATCHING_SYSTEM_PROMPT },
                { role: 'user', content: userPrompt }
            ],
            DEFAULT_MODEL,
            true
        );
        const cleanedText = response.replace(/^```json\n?/, '').replace(/\n?```$/, '');
        const json = JSON.parse(cleanedText);

        // Handle both formats: {matches: [...]} or direct array
        const matches = Array.isArray(json) ? json : (json.matches || []);
        return matches as MatchResult[];
    } catch (error) {
        console.error('Error finding matches:', error);
        throw new Error('The AI matchmaker is currently unavailable. Please try again later.');
    }
};

// ============================================
// CHATBOT SESSION
// ============================================

export const createChatSession = (
    sessionId: string = 'default',
    userId: string = 'anonymous',
    userName: string = 'Friend'
): GroqChatSession => {
    const history: GroqMessage[] = [
        {
            role: 'system',
            content: CHATBOT_SYSTEM_PROMPT(userName)
        }
    ];

    return {
        sessionId,
        userId,

        sendMessage: async (userMessage: string): Promise<string> => {
            history.push({ role: 'user', content: userMessage });

            try {
                const response = await callGroqAPI(
                    history,
                    FAST_MODEL, // Faster model for chat
                    false
                );

                history.push({ role: 'assistant', content: response });

                // Keep only last 10 messages (5 exchanges) for better context while saving tokens
                if (history.length > 11) { // 1 system + 10 messages
                    history.splice(1, 2); // Remove oldest user-assistant pair
                }

                return response;
            } catch (error) {
                console.error('Chat error:', error);
                throw error;
            }
        },

        getHistory: () => [...history]
    };
};

// Legacy export for backwards compatibility with Chatbot.tsx
export { createChatSession as default };

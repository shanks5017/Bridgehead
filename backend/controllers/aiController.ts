import { Request, Response } from 'express';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

// Initialize Groq Client
const groq = new Groq({
    apiKey: GROQ_API_KEY
});

// Models
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
const FAST_MODEL = 'llama-3.1-8b-instant';

// System Prompts
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

// --- Controllers ---

/**
 * Handle Chatbot Interactions
 */
export const chat = async (req: Request, res: Response) => {
    try {
        const { messages, model = FAST_MODEL, userName = 'Friend' } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Invalid messages format' });
        }

        // Inject System Prompt if likely missing or needs refresh
        const systemMessage = { role: 'system', content: CHATBOT_SYSTEM_PROMPT(userName) };
        const fullMessages = [systemMessage, ...messages.filter((m: any) => m.role !== 'system')];

        const completion = await groq.chat.completions.create({
            messages: fullMessages,
            model: model,
            temperature: 0.7,
            max_tokens: 1024,
        });

        const reply = completion.choices[0]?.message?.content || "I'm thinking...";
        res.json({ reply });

    } catch (error) {
        console.error('AI Chat Error:', error);
        res.status(500).json({ error: 'AI service unavailable' });
    }
};

/**
 * Generate Business Ideas
 */
export const generateIdeas = async (req: Request, res: Response) => {
    try {
        const { location, demands, isDeepDive } = req.body;

        const summarizedDemands = demands.slice(0, 10).map((d: any) =>
            `- ${d.title} (Category: ${d.category}, Upvotes: ${d.upvotes})`
        ).join('\n');

        const userPrompt = `Location: ${location.latitude}, ${location.longitude}

Existing Community Demands:
${summarizedDemands.length > 0 ? summarizedDemands : "No specific demands yet. Suggest general opportunities."}

Generate ${isDeepDive ? '5 detailed' : '3 quick'} business ideas for this location.`;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: AI_IDEAS_SYSTEM_PROMPT },
                { role: 'user', content: userPrompt }
            ],
            model: isDeepDive ? DEFAULT_MODEL : FAST_MODEL,
        });

        res.json({ text: completion.choices[0]?.message?.content || '' });

    } catch (error) {
        console.error('AI Ideas Error:', error);
        res.status(500).json({ text: '## Error\nUnable to generate ideas.' });
    }
};

/**
 * Find Matches (Demand <-> Rental)
 */
export const match = async (req: Request, res: Response) => {
    try {
        const { demands, rentals } = req.body;

        const simplifiedDemands = demands.slice(0, 10).map((d: any) => ({
            id: d.id,
            title: d.title,
            category: d.category,
            description: d.description?.substring(0, 100),
            location: `${d.location.latitude},${d.location.longitude}`
        }));

        const simplifiedRentals = rentals.slice(0, 10).map((r: any) => ({
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

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: MATCHING_SYSTEM_PROMPT },
                { role: 'user', content: userPrompt }
            ],
            model: DEFAULT_MODEL,
            response_format: { type: 'json_object' }
        });

        const content = completion.choices[0]?.message?.content || '{}';
        const json = JSON.parse(content);
        const matches = Array.isArray(json) ? json : (json.matches || []);

        res.json({ matches });

    } catch (error) {
        console.error('AI Match Error:', error);
        res.status(500).json({ error: 'Matching service unavailable' });
    }
};

/**
 * Geocode Address (Nominatim Wrapper)
 */
export const geocode = async (req: Request, res: Response) => {
    try {
        // Step 1: Get accurate coordinates from Nominatim (OpenStreetMap)
        const { address } = req.body;
        if (!address) return res.status(400).json({ error: 'Address required' });

        const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
            params: {
                format: 'json',
                q: address
            },
            headers: {
                'User-Agent': 'BridgeheadApp/1.0' // Required by Nominatim policy
            }
        });

        const data = response.data;
        if (data && data.length > 0) {
            return res.json({
                latitude: parseFloat(data[0].lat),
                longitude: parseFloat(data[0].lon)
            });
        }
        res.status(404).json({ error: 'Address not found' });
    } catch (error) {
        console.error('Geocode Error:', error);
        res.status(500).json({ error: 'Geocoding service unavailable' });
    }
};

/**
 * Reverse Geocode (Hybrid: Nominatim + AI Format)
 */
export const reverseGeocode = async (req: Request, res: Response) => {
    try {
        const { latitude, longitude } = req.body;

        // Step 1: Get RAW, HARD FACT data from Nominatim (Source of Truth)
        const nomResponse = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
            params: {
                format: 'json',
                lat: latitude,
                lon: longitude
            },
            headers: {
                'User-Agent': 'BridgeheadApp/1.0'
            }
        });

        const nomData = nomResponse.data;

        // Step 2: Use AI to FORMAT the raw data (Strictly NO hallucination)
        const userPrompt = `
        Raw Location Data: ${JSON.stringify(nomData.address)}
        Display Name: ${nomData.display_name}

        Task: Create a clean, professional address string from this data.
        Format: "District, State" or "Neighborhood, City, State" (depending on what's available).
        RULES:
        1. Use ONLY the provided data. Do NOT invent new places.
        2. Prioritize accuracy: If "suburb" or "district" is missing, use "city".
        3. Keep it short (max 4-5 words).
        `;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: "You are an address formatter. formatting ONLY. Do not halllucinate." },
                { role: 'user', content: userPrompt }
            ],
            model: FAST_MODEL,
        });

        const formattedAddress = completion.choices[0]?.message?.content?.trim().replace(/\n/g, '').replace(/"/g, '') || nomData.display_name;

        res.json({ address: formattedAddress });

    } catch (error) {
        console.error('Reverse Geocode Error:', error);
        // Fallback to coordinates if completely failed
        const lat = req.body.latitude;
        const lon = req.body.longitude;
        res.json({ address: `${lat ? Number(lat).toFixed(4) : '0.0000'}, ${lon ? Number(lon).toFixed(4) : '0.0000'}` });
    }
};

const API_URL = 'http://localhost:5001/api/ai';

// --- Types ---
export interface ChatMessage {
    role: 'system' | 'user' | 'model';
    content?: string; // Groq style
    text?: string;    // Gemini style fallback
}

export interface ChatSession {
    sendMessage: (text: string) => Promise<string>;
}

// --- API Client ---

/**
 * Creates a chat session (Unified Interface)
 */
export const createChatSession = (modelName: string = 'default', userId?: string, userName?: string): ChatSession => {
    let history: ChatMessage[] = [];

    return {
        sendMessage: async (text: string) => {
            // Add user message to history
            history.push({ role: 'user', content: text });

            try {
                const response = await fetch(`${API_URL}/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messages: history,
                        userName: userName || 'Friend'
                    })
                });

                if (!response.ok) throw new Error('Backend AI Error');

                const data = await response.json();
                const reply = data.reply;

                // Add model reply to history
                history.push({ role: 'model', content: reply });

                return reply;
            } catch (error) {
                console.error('Chat Error:', error);
                return "I'm having trouble connecting to my brain right now. 🧠💥 Try again in a moment!";
            }
        }
    };
};

/**
 * Generate Business Ideas (Calls Backend)
 */
export const generateBusinessIdeas = async (
    location: { latitude: number; longitude: number },
    demands: any[],
    isDeepDive: boolean = false
) => {
    try {
        const response = await fetch(`${API_URL}/ideas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ location, demands, isDeepDive })
        });

        if (!response.ok) throw new Error('Backend AI Error');
        const data = await response.json();
        return data.text;
    } catch (error) {
        console.error('Idea Gen Error:', error);
        return "## Error\nCould not generate ideas.";
    }
};

/**
 * Find Matches (Calls Backend)
 */
export const findMatches = async (demands: any[], rentals: any[]) => {
    try {
        const response = await fetch(`${API_URL}/match`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ demands, rentals })
        });

        if (!response.ok) throw new Error('Backend AI Error');
        const data = await response.json();
        return data.matches;
    } catch (error) {
        console.error('Matching Error:', error);
        return [];
    }
};

/**
 * Geocode Address (Calls Backend)
 */
export const geocode = async (address: string): Promise<{ latitude: number; longitude: number }> => {
    try {
        const response = await fetch(`${API_URL}/geocode`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address })
        });

        if (!response.ok) throw new Error('Geocode Failed');
        return await response.json();
    } catch (error) {
        console.error('Geocode Error:', error);
        throw new Error('Could not find coordinates.');
    }
};

/**
 * Reverse Geocode (Calls Backend)
 */
export const reverseGeocode = async (location: { latitude: number; longitude: number }): Promise<string> => {
    try {
        const response = await fetch(`${API_URL}/reverse-geocode`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(location)
        });

        if (!response.ok) throw new Error('Reverse Geocode Failed');
        const data = await response.json();
        return data.address;
    } catch (error) {
        console.error('Reverse Geocode Error:', error);
        return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
    }
};

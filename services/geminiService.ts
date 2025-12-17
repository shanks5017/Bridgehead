import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { DemandPost, RentalPost, MatchResult } from '../types';
import { config } from '../src/config';

const getGeminiService = () => {
  const apiKey = config.gemini.apiKey;
  if (!apiKey) {
    throw new Error("Gemini API Key is missing. Please check your configuration.");
  }
  return new GoogleGenAI({ apiKey });
};

export const geocode = async (address: string): Promise<{ latitude: number; longitude: number }> => {
  const ai = getGeminiService();
  const prompt = `
    Provide the latitude and longitude for the following address.
    Address: "${address}"
    Return ONLY a JSON object with "latitude" and "longitude" keys. Do not add any other text or markdown formatting.
    Example response:
    {
      "latitude": 37.422,
      "longitude": -122.084
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });
    const text = response.text.trim();
    // Gemini can sometimes wrap the JSON in markdown backticks
    const cleanedText = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    const json = JSON.parse(cleanedText);
    if (typeof json.latitude === 'number' && typeof json.longitude === 'number') {
      return json;
    } else {
      throw new Error("Invalid JSON structure in geocoding response.");
    }
  } catch (error) {
    console.error("Error geocoding address:", error);
    throw new Error("Could not find coordinates for the provided address.");
  }
};


export const reverseGeocode = async (location: { latitude: number; longitude: number }): Promise<string> => {
  const ai = getGeminiService();
  const prompt = `
    Based on the following coordinates, provide a single, concise, human-readable street address or well-known place name.
    Latitude: ${location.latitude}
    Longitude: ${location.longitude}
    Do not add any preamble or explanation. Just return the address. For example: "1600 Amphitheatre Parkway, Mountain View, CA" or "Eiffel Tower, Paris, France".
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    // Clean up the response to ensure it's a single line.
    return response.text.trim().replace(/\n/g, '');
  } catch (error) {
    console.error("Error reverse geocoding:", error);
    // Fallback to coordinates if geocoding fails
    return `Location at ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
  }
};

export const generateBusinessIdeas = async (
  location: { latitude: number; longitude: number },
  demands: DemandPost[],
  isDeepDive: boolean,
): Promise<GenerateContentResponse> => {
  const ai = getGeminiService();

  const summarizedDemands = demands.slice(0, 10).map(d => `- ${d.title} (Category: ${d.category}, Upvotes: ${d.upvotes})`).join('\n');

  const prompt = `
    You are a hyper-local business consultant AI. Your goal is to generate innovative and practical business ideas for an entrepreneur.

    **Context:**
    - The entrepreneur is looking for opportunities in a specific area.
    - Current Location (Latitude, Longitude): ${location.latitude}, ${location.longitude}
    - There is a list of existing business "demands" posted by the local community. These represent unmet needs.

    **Existing Community Demands:**
    ${summarizedDemands.length > 0 ? summarizedDemands : "No specific demands listed yet. Consider general opportunities for a typical urban/suburban area."}

    **Your Task:**
    Based on the provided location, community demands, and up-to-date information from Google Search and Maps, generate 3-5 concrete business suggestions. For each suggestion, provide:
    1.  **Business Idea:** A catchy, descriptive name.
    2.  **Concept:** A one-paragraph summary of the business.
    3.  **Why it works here:** A brief explanation of why this idea is a good fit for the location, referencing specific demands and real-world data if possible.
    4.  **Potential Target Audience:** Who are the primary customers?
    5.  **Location Insight:** Suggest a specific, real-world neighborhood or type of commercial area that would be suitable, using Google Maps data.

    Format your response in well-structured Markdown. Use headings, bold text, and lists to make it easy to read.
    `;

  const model = isDeepDive ? "gemini-2.5-pro" : "gemini-2.5-flash";
  const config = isDeepDive ?
    { thinkingConfig: { thinkingBudget: 32768 } } :
    {};

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }, { googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: location.latitude,
              longitude: location.longitude,
            }
          }
        },
        ...config,
      },
    });
    return response;
  } catch (error) {
    console.error("Error generating business ideas:", error);
    // Construct a fake response object on error to avoid breaking the UI
    return {
      text: "## An Error Occurred\n\nSorry, I was unable to generate business ideas at this time. Please check your API key and try again later.",
      candidates: [],
    } as GenerateContentResponse;
  }
};

export const findMatches = async (
  demands: DemandPost[],
  rentals: RentalPost[],
): Promise<MatchResult[]> => {
  const ai = getGeminiService();

  const simplifiedDemands = demands.map(d => ({
    id: d.id,
    title: d.title,
    category: d.category,
    description: d.description,
    location: `${d.location.latitude},${d.location.longitude}`
  }));

  const simplifiedRentals = rentals.map(r => ({
    id: r.id,
    title: r.title,
    category: r.category,
    description: r.description,
    location: `${r.location.latitude},${r.location.longitude}`,
    price: r.price,
    squareFeet: r.squareFeet,
  }));

  const prompt = `
    You are an expert commercial real estate matchmaker AI for an app called Bridgehead.
    Your task is to analyze a list of community "Demands" (business ideas people want) and a list of "Rentals" (available commercial properties) and find the best potential matches.

    Here are the demands:
    ${JSON.stringify(simplifiedDemands, null, 2)}

    Here are the available rentals:
    ${JSON.stringify(simplifiedRentals, null, 2)}

    Analyze both lists and identify pairs of demands and rentals that are a good fit. Consider factors like:
    - Category match (e.g., a "Food & Drink" demand in a former restaurant space).
    - Location proximity.
    - Description alignment (e.g., a demand for a "cozy bookstore" matching a "charming boutique spot").
    - Space requirements hinted at in the demand description vs. the rental's square footage.

    Return your findings as a JSON array of match objects. Each object in the array must have the following structure:
    {
      "demandId": string, // The ID of the matched demand
      "rentalId": string, // The ID of the matched rental
      "reasoning": string, // A concise, one-paragraph explanation of why this is a good match.
      "confidenceScore": number // A score from 0.0 to 1.0 indicating your confidence in the match.
    }

    Return ONLY the JSON array. Do not include any other text, markdown formatting, or explanations outside of the JSON structure. If no good matches are found, return an empty array [].
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });
    const text = response.text.trim();
    const cleanedText = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    const json = JSON.parse(cleanedText);
    // Basic validation
    if (Array.isArray(json)) {
      return json as MatchResult[];
    } else {
      throw new Error("Invalid JSON structure in matching response.");
    }
  } catch (error) {
    console.error("Error finding matches:", error);
    throw new Error("The AI matchmaker is currently unavailable. Please try again later.");
  }
};
import { Groq } from "groq-sdk";

const groq = new Groq({ 
  apiKey: import.meta.env.VITE_GROQ_API_KEY || "",
  dangerouslyAllowBrowser: true // Since it's a client-side extension-linked app
});

export interface SuggestedSchema {
  containerSelector: string;
  fields: {
    name: string;
    selector: string;
    type: string;
  }[];
}

export class GroqExtractionService {
  /**
   * Analyzes a simplified DOM structure and suggests an extraction schema.
   */
  static async suggestSchema(domSnapshot: string): Promise<SuggestedSchema | null> {
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an expert at web scraping and CSS selectors. Analyze the HTML snippet and identify repeating data structures. Suggest a container selector and field selectors."
          },
          {
            role: "user",
            content: `Analyze this HTML snippet: ${domSnapshot}`
          }
        ],
        model: "llama3-8b-8192",
        response_format: { type: "json_object" }
      });

      const text = chatCompletion.choices[0]?.message?.content;
      if (!text) return null;
      return JSON.parse(text) as SuggestedSchema;
    } catch (error) {
      console.error("Groq Schema Suggestion Error:", error);
      return null;
    }
  }
}

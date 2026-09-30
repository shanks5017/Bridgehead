import { Groq } from "groq-sdk";
import dotenv from 'dotenv';
import { RawListing } from './extractor.js';

dotenv.config();

const groq = new Groq({ apiKey: process.env.VITE_GROQ_API_KEY || '' });

export interface RefinedListing {
  name: string;
  phone: string[];
  address: string;
  locality: string;
  pincode: string;
  verified: boolean;
  rating: number;
  reviewCount: number;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export class Refiner {
  static async refine(raw: RawListing): Promise<RefinedListing | null> {
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are a professional Data Refinement AI. 
            Your task is to take raw web-scraped business data and transform it into a clean, structured JSON object.
            
            RULES:
            1. Normalize phone numbers to E.164 format (e.g., +91XXXXXXXXXX).
            2. Extract the precise Locality and Pincode from the address string.
            3. Infer 'verified' status based on source context (justdial/sulekha verified tags).
            4. Respond only with the raw JSON object. No markdown, no prefixes.`
          },
          {
            role: "user",
            content: `Clean and normalize this business listing:
            Title: ${raw.title}
            Phone: ${raw.phone}
            Address: ${raw.address}
            URL: ${raw.link}`
          }
        ],
        model: "llama3-8b-8192",
        response_format: { type: "json_object" }
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) return null;
      
      return JSON.parse(content) as RefinedListing;
    } catch (error) {
      console.error("Groq Refinement Error:", error);
      return null;
    }
  }
}

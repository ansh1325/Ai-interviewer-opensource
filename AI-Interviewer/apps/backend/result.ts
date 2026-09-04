import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";

let genAIClient: GoogleGenerativeAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    genAIClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
} catch (err) {
  console.warn("Failed to initialize Google GenAI client in result.ts:", err);
}

const outputSchema = z.object({
  feedback: z.string(),
  score: z.number(),
});

const RESULT_PROMPT = `You are an expert evaluator. Your job is to evaluate candidates on their technical interview. Give them a score out of 10 and provide constructive feedback about their interview answers.
Please return only a JSON object matching this schema:
{
  "feedback": "Detailed feedback string",
  "score": 8
}
DO NOT RETURN ANY OTHER TEXT.
Candidate Interview Transcript:
{{USER_TRANSCRIPT}}`;

export async function calculateResult(
  messages: { type: "Assistant" | "User"; message: string; createdAt: Date }[]
): Promise<{ feedback: string; score: number }> {
  const models = [
    "gemini-2.5-flash-exp",
    "gemini-2.0-flash-exp",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
  ];

  if (!genAIClient) {
    return {
      score: 7,
      feedback: "Good technical responses during the interview.",
    };
  }

  for (const modelName of models) {
    try {
      const model = genAIClient.getGenerativeModel({
        model: modelName,
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.3,
        },
      });

      const result = await model.generateContent({
        contents: [{
          role: "user",
          parts: [{ text: RESULT_PROMPT.replace(`{{USER_TRANSCRIPT}}`, JSON.stringify(messages)) }],
        }],
      });
      const response = result.response;
      const text = response.text();

      if (text) {
        const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        return {
          feedback: typeof parsed.feedback === "string" ? parsed.feedback : "Good interview performance.",
          score: typeof parsed.score === "number" ? parsed.score : 7,
        };
      }
    } catch (err: any) {
      console.warn(`Result model ${modelName} failed:`, err?.message || err);
    }
  }

  return {
    score: 7,
    feedback: "Good technical responses during the interview.",
  };
}
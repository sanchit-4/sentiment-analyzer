// src/app/api/analyze/route.ts

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { PrismaClient } from '@prisma/client';
import { NextResponse } from "next/server";

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

// This robust function finds a JSON object even if it's wrapped in text or markdown.
function extractJson(text: string): string | null {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```|({[\s\S]*})/);
  if (jsonMatch && (jsonMatch[1] || jsonMatch[2])) {
    return jsonMatch[1] || jsonMatch[2];
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { review } = body;

    if (!review || typeof review !== 'string' || review.trim().length < 10) {
      return NextResponse.json({ error: "Review text must be at least 10 characters long." }, { status: 400 });
    }

    review = review.trim();

    const safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", safetySettings });

    // --- THE EXPERT-LEVEL PROMPT WITH FEW-SHOT LEARNING ---
    const prompt = `
      You are an expert sentiment analysis AI for movie reviews. Your task is to analyze the following review text and provide a structured JSON response.

      Follow these rules STRICTLY:
      1.  Your response MUST BE a single, valid JSON object and nothing else.
      2.  The JSON object must have two keys: "sentiment" and "explanation".
      3.  "sentiment" must be one of these three exact strings: "Positive", "Negative", or "Neutral".
      4.  If a review contains a mix of strong positive and negative points, you MUST classify it as "Neutral".

      Here are examples of how to perform the analysis:

      ---
      Review: "This movie was an absolute masterpiece, the acting was incredible!"
      Correct JSON Output: {"sentiment": "Positive", "explanation": "The review uses strong positive language like 'masterpiece' and 'incredible'."}
      ---
      Review: "A total waste of time. The plot was boring and predictable."
      Correct JSON Output: {"sentiment": "Negative", "explanation": "The review uses strong negative language like 'waste of time' and 'boring'."}
      ---
      Review: "The cinematography was breathtaking, and the score was hauntingly beautiful, but the lead actor's performance felt wooden."
      Correct JSON Output: {"sentiment": "Neutral", "explanation": "The review praises the cinematography and score but criticizes the acting, making it a mixed opinion."}
      ---
      Review: "I absolutely loved the music, and the visuals were stunning, but everything else felt like an afterthought."
      Correct JSON Output: {"sentiment": "Neutral", "explanation": "The review has strong positive points about music and visuals but negative points about the rest, resulting in a mixed sentiment."}
      ---

      Now, analyze the following review following the same rules and format.

      Review: "${review}"
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawResponseText = response.text();
    
    console.log("Raw AI Response Text:", rawResponseText);

    const cleanedJsonString = extractJson(rawResponseText);

    if (!cleanedJsonString) {
      console.error("Failed to extract any JSON from the AI's response.");
      return NextResponse.json({ error: "The AI failed to generate a valid response." }, { status: 500 });
    }

    let analysis;
    try {
        analysis = JSON.parse(cleanedJsonString);
    } catch {
        console.error("Failed to parse the extracted JSON string:", cleanedJsonString);
        return NextResponse.json({ error: "The AI response format was unreadable." }, { status: 500 });
    }

    const { sentiment, explanation } = analysis;
    if (!sentiment || !['Positive', 'Negative', 'Neutral'].includes(sentiment) || !explanation) {
        console.error("AI response was a valid JSON but had the wrong structure:", analysis);
        return NextResponse.json({ error: "The AI response was missing required fields." }, { status: 500 });
    }

    // Success!
    const savedReview = await prisma.review.create({
      data: { text: review, sentiment, explanation },
    });

    return NextResponse.json({ sentiment, explanation, reviewText: review, id: savedReview.id });

  } catch (error) {
    console.error("A server-side error occurred:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
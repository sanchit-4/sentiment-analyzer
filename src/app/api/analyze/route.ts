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

    // --- THE FINAL FIX: ADDING SAFETY SETTINGS ---
    // This tells Google not to block reviews with strong negative language, which is necessary for our use case.
    const safetySettings = [
        {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
        },
    ];

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", safetySettings });

    const prompt = `
      Your task is to perform sentiment analysis on a movie review.
      Your response MUST be a single, valid JSON object and nothing else.
      The JSON object must have two keys: "sentiment" and "explanation".
      
      "sentiment" must be one of these three exact strings: "Positive", "Negative", or "Neutral".
      - Classify as "Neutral" if the review is mixed, purely factual, a question, or nonsensical.
      
      "explanation" must be a concise, one-sentence string justifying the sentiment.

      Analyze this review: "${review}"
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
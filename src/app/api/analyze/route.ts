// src/app/api/analyze/route.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import { PrismaClient } from '@prisma/client';
import { NextResponse } from "next/server";

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { review } = body;

    // --- PILLAR 3: DEFENSIVE BACKEND LOGIC (Input Validation) ---
    if (!review || typeof review !== 'string' || review.trim().length < 10) {
      return NextResponse.json({ error: "Review text must be at least 10 characters long." }, { status: 400 });
    }

    // Sanitize and trim the input
    review = review.trim();

    // --- PILLAR 2: GUARANTEED JSON OUTPUT ---
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    // --- PILLAR 1: THE EXPERT-LEVEL PROMPT ---
    const prompt = `
      You are an expert sentiment analysis AI for movie reviews. Your task is to analyze the following review text and provide a structured JSON response.

      Follow these rules STRICTLY:
      1.  Classify the sentiment into one of three exact categories: "Positive", "Negative", or "Neutral".
      2.  "Positive": The review expresses clear enjoyment, praise, or recommendation.
      3.  "Negative": The review expresses clear dislike, criticism, or warns against watching.
      4.  "Neutral": The review is one of the following:
          - A mix of significant positive and negative points.
          - Purely factual, objective, or descriptive with no opinion.
          - A question about the movie, not a review of it.
          - Gibberish, nonsensical, or completely off-topic text.
      5.  Provide a concise, one-sentence "explanation" that justifies your sentiment classification. For "Neutral" cases, your explanation should clarify why (e.g., "The text is a question, not a review.").
      6.  Your output MUST BE a valid JSON object. Do not include any text, markdown, or explanations outside of the JSON structure.

      Here are some examples of perfect analysis:

      Review: "This movie was an absolute masterpiece, the acting was incredible!"
      Correct JSON Output: {"sentiment": "Positive", "explanation": "The review uses strong positive language like 'masterpiece' and 'incredible'."}
      
      Review: "The cinematography was breathtaking, but the lead actor's performance felt wooden and uninspired."
      Correct JSON Output: {"sentiment": "Neutral", "explanation": "The review praises the cinematography but criticizes the acting, making it a mixed opinion."}

      Review: "where can i watch this movie online?"
      Correct JSON Output: {"sentiment": "Neutral", "explanation": "The provided text is a question asking for information, not an opinionated review."}

      Review: "asdfghjkl qwerty"
      Correct JSON Output: {"sentiment": "Neutral", "explanation": "The text appears to be nonsensical and does not contain a valid review."}

      Now, analyze this review:
      Review: "${review}"
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let analysis;

    try {
        analysis = JSON.parse(response.text());
    } catch {
        console.error("Critical: AI returned malformed JSON despite JSON mode.", response.text());
        return NextResponse.json({ error: "The AI failed to generate a valid response." }, { status: 500 });
    }

    // --- PILLAR 3: DEFENSIVE BACKEND LOGIC (Output Validation) ---
    const { sentiment, explanation } = analysis;
    if (!sentiment || !['Positive', 'Negative', 'Neutral'].includes(sentiment) || !explanation || typeof explanation !== 'string') {
        console.error("Critical: AI returned a valid JSON but with an invalid structure.", analysis);
        return NextResponse.json({ error: "The AI response had an invalid format." }, { status: 500 });
    }

    // Store the valid result in the database
    const savedReview = await prisma.review.create({
      data: { text: review, sentiment, explanation },
    });

    return NextResponse.json({ sentiment, explanation, reviewText: review, id: savedReview.id });

  } catch (error) {
    console.error("A server-side error occurred:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
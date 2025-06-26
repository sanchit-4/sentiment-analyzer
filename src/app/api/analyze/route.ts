import { GoogleGenerativeAI } from "@google/generative-ai";
import { PrismaClient } from '@prisma/client';
import { NextResponse } from "next/server";

// Initialize Prisma and Google AI clients
const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { review } = body;

    if (!review) {
      return NextResponse.json({ error: "Review text is required" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Analyze the sentiment of the following movie review.
      Classify it as "Positive", "Negative", or "Neutral".
      Provide a brief, one-sentence explanation for your classification.
      The review is: "${review}"

      Return your analysis as a JSON object with two keys: "sentiment" and "explanation".
      For example: {"sentiment": "Positive", "explanation": "The review uses strong positive language like 'amazing' and 'masterpiece'."}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let analysis;
    try {
        const jsonString = text.replace(/```json\n?|\n?```/g, '').trim();
        analysis = JSON.parse(jsonString);
    } catch (_e) {
        console.error("Failed to parse Gemini response:", text);
        return NextResponse.json({ error: "Failed to analyze sentiment due to invalid AI response format." }, { status: 500 });
    }

    const { sentiment, explanation } = analysis;

    if (!['Positive', 'Negative', 'Neutral'].includes(sentiment)) {
        return NextResponse.json({ error: "Invalid sentiment received from AI." }, { status: 500 });
    }

    // Store the result in the database
    const savedReview = await prisma.review.create({
      data: {
        text: review,
        sentiment: sentiment,
        explanation: explanation,
      },
    });

    // Return the structured response
    return NextResponse.json({
      sentiment,
      explanation,
      reviewText: review,
      id: savedReview.id,
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
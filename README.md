AI Movie Review Sentiment Analyzer

This is a full-stack web application designed to analyze the sentiment of movie reviews. Users can submit a piece of text, and the application leverages Google's Gemini large language model (LLM) to determine if the sentiment is Positive, Negative, or Neutral. The results, along with a detailed explanation from the AI, are stored in a Postgres database.

![alt text](./screenshot.png)


(You should take a screenshot of your running app and save it as screenshot.png in the root directory for this image to show up.)
Features

    Modern, Responsive UI: A clean and user-friendly interface built with Next.js and Tailwind CSS.

    AI-Powered Analysis: Utilizes the Google Gemini API for highly accurate, context-aware sentiment classification.

    Detailed Explanations: The AI provides a justification for its sentiment classification, offering insights into why a review is considered positive or negative.

    Persistent Storage: All submitted reviews and their analysis results are saved to a Vercel Postgres database using Prisma ORM.

    Full-Stack Architecture: Built entirely within the Next.js App Router, combining frontend and backend logic in a cohesive, modern framework.

Tech Stack

    Framework: Next.js (App Router)

    Language: TypeScript

    Styling: Tailwind CSS

    AI: Google Gemini API

    Database: Vercel Postgres

    ORM: Prisma

    Deployment: Vercel

Getting Started: Running Locally

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.
Prerequisites

    Node.js (v18 or later)

    Git

    A Vercel account (for the Postgres database)

    A Google AI API Key

Installation & Setup

    Clone the Repository
    Generated bash

          
    git clone https://github.com/<Your-GitHub-Username>/<Your-Repository-Name>.git
    cd <Your-Repository-Name>

        

    IGNORE_WHEN_COPYING_START

Use code with caution. Bash
IGNORE_WHEN_COPYING_END

Install Dependencies
Generated bash

      
npm install

    

IGNORE_WHEN_COPYING_START
Use code with caution. Bash
IGNORE_WHEN_COPYING_END

Set Up Environment Variables
Create a file named .env.local in the root of your project. This file securely stores your secret keys and is ignored by Git, so you won't accidentally commit them.
Generated bash

      
touch .env.local

    

IGNORE_WHEN_COPYING_START
Use code with caution. Bash
IGNORE_WHEN_COPYING_END

Add the following variables to your new .env.local file.
Generated env

      
# Get this from your Vercel Postgres database dashboard.
# IMPORTANT: Use the NON-POOLING connection string for Prisma migrations.
POSTGRES_URL_NON_POOLING="postgres://default:YourPassword@..."

# Get this from Google AI Studio
GOOGLE_API_KEY="Your-Google-API-Key-Here"

    

IGNORE_WHEN_COPYING_START
Use code with caution. Env
IGNORE_WHEN_COPYING_END

Sync the Database Schema
This command reads your prisma/schema.prisma file and creates the necessary tables in your Vercel Postgres database.

Note: The standard Prisma CLI might not automatically load variables from .env.local. We use dotenv-cli (installed as a dev dependency) to ensure our database URL is found.
Generated bash

      
npx dotenv -e .env.local -- npx prisma db push

    

IGNORE_WHEN_COPYING_START
Use code with caution. Bash
IGNORE_WHEN_COPYING_END

You should see a message: ✔ Your database is now in sync with your schema.

Run the Development Server
Generated bash

      
npm run dev

    

IGNORE_WHEN_COPYING_START

    Use code with caution. Bash
    IGNORE_WHEN_COPYING_END

    The application will now be running at http://localhost:3000.

Our Approach to Sentiment Analysis

When building this tool, we had to decide on the core logic for analyzing sentiment.
The Initial Idea: A Rule-Based System

A simple approach would be a "rule-based" or "keyword-counting" system. This involves:

    Creating a list of "positive" words (great, amazing, loved) and "negative" words (bad, terrible, awful).

    Counting the occurrences of these words in the review.

    Declaring the sentiment based on which count is higher.

Why We Chose a Different Path

The rule-based approach is fast but extremely fragile. It fails to understand the most important thing in human language: context.

    It can't handle negation: "This movie was not good." A simple counter would see "good" and incorrectly lean positive.

    It can't understand sarcasm: "Wow, a masterpiece of boredom." The AI would see "masterpiece" and get it completely wrong.

    It misses nuance: "The acting was decent, but the story was predictable." This is a mixed review, which a simple counter struggles to classify.

The Solution: Leveraging a Large Language Model (LLM)

To overcome these limitations, we chose to integrate the Google Gemini API. This approach treats sentiment analysis not as a counting problem, but as a comprehension problem.

Our implementation works as follows:

    The user's review is sent to our backend API route (/api/analyze).

    We construct a carefully designed prompt that instructs the Gemini model on its task. We don't just ask "Is this positive or negative?"; we give it specific instructions to act as an expert analyst.

    A simplified version of our prompt looks like this:

        "Analyze the sentiment of the following movie review. Classify it as 'Positive', 'Negative', or 'Neutral'. Provide a brief, one-sentence explanation for your classification. The review is: [USER'S REVIEW TEXT]"

    Crucially, we also instruct the model to return its findings in a structured JSON format:

        "Return your analysis as a JSON object with two keys: sentiment and explanation."

    This approach allows the LLM to use its vast understanding of language, context, and subtext to provide a far more accurate and human-like analysis. It correctly identifies sarcasm, understands mixed feelings, and provides a clear, concise explanation for its decision, which we then display to the user. This results in a significantly more powerful and useful tool.

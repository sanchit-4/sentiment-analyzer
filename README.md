
# AI Movie Review Sentiment Analyzer

This is a full-stack web application designed to analyze the sentiment of movie reviews. Users can submit a piece of text, and the application leverages Google's Gemini large language model (LLM) to determine if the sentiment is Positive, Negative, or Neutral. The results, along with a detailed explanation from the AI, are stored in a Postgres database.

![Demo](./screenshot.png)

## Features

Modern, Responsive UI: A clean and user-friendly interface built with Next.js and Tailwind CSS.

AI-Powered Analysis: Utilizes the Google Gemini API for highly accurate, context-aware sentiment classification.

Detailed Explanations: The AI provides a justification for its sentiment classification, offering insights into why a review is considered positive or negative.

Persistent Storage: All submitted reviews and their analysis results are saved to a Vercel Postgres database using Prisma ORM.

Full-Stack Architecture: Built entirely within the Next.js App Router, combining frontend and backend logic in a cohesive, modern framework.


## Tech Stack

Framework: Next.js (App Router)

Language: TypeScript

Styling: Tailwind CSS

AI: Google Gemini API

Database: Vercel Postgres

ORM: Prisma

Deployment: Vercel
## Run Locally

Clone the project

```bash
  git clone https://github.com/sanchit-4/sentiment-analyzer
```

Go to the project directory

```bash
  cd sentiment-analyzer
```

Install dependencies

```bash
  npm install
```

Setup Local environment variables by creating a .env.local file

```bash
  #.env.local
  POSTGRES_URL_NON_POOLING="<your-postgress-url>"
  GOOGLE_API_KEY="<your-api-key>"
```

Sync the Database Schema

```bash
  npx dotenv -e .env.local -- npx prisma db push
```  

Start the server

```bash
  npm run dev
```

To view the database, run

```bash
  npx dotenv -e .env.local -- npx prisma studio
```


## My Project Approach

The core of this project's sentiment analysis is powered by the Google Gemini Large Language Model (LLM).

I chose this approach over traditional rule-based or keyword-counting methods to achieve a higher degree of accuracy. LLMs excel at understanding the nuances of human language, including context, sarcasm, and negation, which simple keyword systems cannot handle.

The implementation follows a clear, robust pattern:

    Backend API: An API route (/api/analyze) receives the review text from the frontend.

    Structured Prompting: The backend constructs a carefully designed prompt, instructing the Gemini model to not only classify the sentiment but also to provide a brief explanation for its choice.

    Guaranteed JSON Output: The prompt explicitly requests the model to return its analysis in a structured JSON format ({ "sentiment": "...", "explanation": "..." }). This makes the response predictable and easy to parse, preventing errors on the frontend.

    Database & Response: This structured data is then saved to the Postgres database via Prisma and sent back to the frontend for a clean, reliable display on the results page.


'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

const sentimentStyles = {
    Positive: {
        bgColor: 'bg-green-900/50',
        borderColor: 'border-green-500',
        textColor: 'text-green-300',
        icon: '😊',
    },
    Negative: {
        bgColor: 'bg-red-900/50',
        borderColor: 'border-red-500',
        textColor: 'text-red-300',
        icon: '😞',
    },
    Neutral: {
        bgColor: 'bg-gray-800/50',
        borderColor: 'border-gray-500',
        textColor: 'text-gray-300',
        icon: '😐',
    },
};

function ResultsDisplay() {
  const searchParams = useSearchParams();
  const sentiment = searchParams.get('sentiment') as keyof typeof sentimentStyles | null;
  const explanation = searchParams.get('explanation');
  const reviewText = searchParams.get('reviewText');

  if (!sentiment || !explanation || !reviewText) {
      return (
          <div className="text-center text-red-400">
              <p>Could not load analysis results. Please try again.</p>
              <Link href="/" className="mt-4 inline-block bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded">
                  Go Back
              </Link>
          </div>
      );
  }

  const styles = sentimentStyles[sentiment];

  return (
    <div className={`w-full max-w-2xl bg-gray-800 rounded-lg shadow-2xl border ${styles.borderColor} p-8`}>
      <h1 className="text-3xl font-bold text-center mb-6">Analysis Result</h1>

      <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-400 mb-2">Original Review:</h2>
            <p className="bg-gray-900 p-4 rounded-md border border-gray-700 italic">"{reviewText}"</p>
      </div>

      <div className={`p-6 rounded-lg ${styles.bgColor} border ${styles.borderColor}`}>
          <div className="flex items-center gap-4 mb-3">
              <span className="text-4xl">{styles.icon}</span>
              <h2 className={`text-2xl font-bold ${styles.textColor}`}>
                  Sentiment: {sentiment}
              </h2>
          </div>
          <div>
              <h3 className="text-lg font-semibold text-gray-400">Explanation:</h3>
              <p className="text-gray-300">{explanation}</p>
          </div>
      </div>

      <Link href="/" className="mt-8 block w-full text-center bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-md transition-colors">
          Analyze Another Review
      </Link>
    </div>
  );
}

export default function ResultsPage() {
  return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-900">
          <Suspense fallback={<div>Loading results...</div>}>
              <ResultsDisplay />
          </Suspense>
      </main>
  );
}
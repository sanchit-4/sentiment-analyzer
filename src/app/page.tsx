// src/app/page.tsx
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [review, setReview] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!review.trim()) {
      setError('Review cannot be empty.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Something went wrong');
      }

      const data = await response.json();
      const queryParams = new URLSearchParams({
          sentiment: data.sentiment,
          explanation: data.explanation,
          reviewText: data.reviewText,
      }).toString();

      router.push(`/results?${queryParams}`);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-900">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-bold text-center text-white mb-2">
          AI Movie Review
        </h1>
        <h2 className="text-2xl md:text-3xl font-bold text-center text-cyan-400 mb-8">
          Sentiment Analyzer
        </h2>

        <form
          onSubmit={handleSubmit}
          className="bg-gray-800 p-8 rounded-lg shadow-2xl border border-gray-700"
        >
          <label htmlFor="review" className="block text-lg font-medium text-gray-300 mb-2">
            Enter a Movie Review
          </label>
          <textarea
            id="review"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="e.g., 'This movie was an absolute masterpiece, the acting was incredible!'"
            className="w-full h-40 p-4 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none text-white transition-all"
            disabled={isLoading}
          />
          {error && <p className="text-red-500 mt-2">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="mt-6 w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-md transition-all duration-300 ease-in-out disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing...
              </>
            ) : (
              'Analyze Sentiment'
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
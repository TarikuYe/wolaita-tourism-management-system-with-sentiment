import { useState, useCallback } from 'react';
import { SentimentAnalysis } from '../types';

const SENTIMENT_API_URL = import.meta.env.VITE_SENTIMENT_API_URL || 'http://127.0.0.1:5000/predict';

export const useSentimentAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeText = useCallback(async (text: string): Promise<SentimentAnalysis | null> => {
    if (!text.trim() || text.length < 10) {
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(SENTIMENT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Handle error response from backend
      if (data.error) {
        throw new Error(data.error);
      }

      // Map backend response to your frontend SentimentAnalysis type
      const result: SentimentAnalysis = {
        sentiment: (data.label || 'neutral').toLowerCase() as 'positive' | 'neutral' | 'negative',
        confidence: data.score || 0,
        score: data.score || 0, // Using same value for both for now
        processedText: text, // Your backend doesn't return processedText
        analyzedAt: new Date(),
      };

      return result;
    } catch (err: any) {
      console.error('Sentiment analysis error:', err);
      setError(err.message || 'Failed to analyze sentiment');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    analyzeText,
    loading,
    error,
    clearError
  };
};
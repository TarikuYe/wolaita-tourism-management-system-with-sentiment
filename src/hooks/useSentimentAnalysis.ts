import { useState, useCallback } from 'react';
import { SentimentAnalysis } from '../types';

// Prefer env-configured URL; fallback to Vite proxy '/ml/analyze'
const SENTIMENT_API_URL = import.meta.env.VITE_SENTIMENT_API_URL || '/ml/analyze';

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
        const body = await response.text();
        throw new Error(body || 'Failed to analyze sentiment');
      }

      const data = await response.json();
      
      return {
        sentiment: (data.sentiment || '').toLowerCase() as 'positive' | 'neutral' | 'negative',
        confidence: data.confidence,
        score: data.score,
        processedText: data.processedText || '',
        analyzedAt: new Date()
      };
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

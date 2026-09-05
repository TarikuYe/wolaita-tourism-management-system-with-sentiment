import { collection, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { SentimentAnalysis } from '../types';

const SENTIMENT_API_URL = import.meta.env.VITE_SENTIMENT_API_URL || 'http://127.0.0.1:5000/predict';

export class SentimentAnalysisService {
  static async analyzeReviewText(text: string): Promise<SentimentAnalysis | null> {
    if (!text.trim() || text.length < 10) {
      console.log('Text too short for analysis');
      return null;
    }

    try {
      console.log('🔍 Analyzing text:', text.substring(0, 100) + '...');
      console.log('🌐 Calling API:', SENTIMENT_API_URL);

      const response = await fetch(SENTIMENT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP error:', response.status, errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ API response data:', data);

      // Validate response structure
      if (!data.label || typeof data.score !== 'number') {
        console.error('❌ Invalid response format:', data);
        throw new Error('Invalid response format from sentiment API');
      }

      const result: SentimentAnalysis = {
        sentiment: (data.label || 'neutral').toLowerCase() as 'positive' | 'neutral' | 'negative',
        confidence: data.score || 0,
        score: data.score || 0,
        processedText: text,
        analyzedAt: new Date(),
      };

      console.log('🎉 Analysis successful:', result);
      return result;
    } catch (error) {
      console.error('💥 Sentiment analysis failed:', error);
      return null;
    }
  }

  static async analyzeAgencyReviews(agencyId: string): Promise<{ analyzed: number; failed: number }> {
    try {
      console.log('🏢 Starting agency review analysis for:', agencyId);
      
      // Get ALL reviews for the agency, then filter unanalyzed ones in code
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('agencyId', '==', agencyId)
      );

      const snapshot = await getDocs(reviewsQuery);
      const unanalyzedReviews = snapshot.docs.filter(doc => {
        const data = doc.data();
        return !data.sentimentLabel && !data.sentimentAnalysis;
      });

      console.log(`📊 Found ${unanalyzedReviews.length} unanalyzed reviews out of ${snapshot.docs.length} total`);

      let analyzed = 0;
      let failed = 0;

      for (const doc of unanalyzedReviews) {
        const review = doc.data();
        console.log(`🔄 Processing review ${doc.id}:`, review.comment?.substring(0, 50) + '...');
        
        if (review.comment) {
          const sentiment = await this.analyzeReviewText(review.comment);
          
          if (sentiment) {
            await updateDoc(doc.ref, {
              sentimentLabel: sentiment.sentiment,
              sentimentScore: sentiment.score,
              sentimentAnalysis: sentiment,
              lastAnalyzedAt: Timestamp.now()
            });
            analyzed++;
            console.log(`✅ Successfully analyzed review ${doc.id}`);
          } else {
            failed++;
            console.log(`❌ Failed to analyze review ${doc.id}`);
          }
        } else {
          console.log(`⏭️  Skipping review ${doc.id} - no comment`);
        }
      }

      console.log(`📈 Analysis complete: ${analyzed} analyzed, ${failed} failed`);
      return { analyzed, failed };
    } catch (error) {
      console.error('💥 Error analyzing agency reviews:', error);
      throw error;
    }
  }

  static async analyzeAllReviews(): Promise<{ analyzed: number; failed: number }> {
    try {
      console.log('🌐 Starting analysis for ALL reviews');
      
      // Get ALL reviews, then filter unanalyzed ones in code
      const reviewsQuery = query(collection(db, 'reviews'));

      const snapshot = await getDocs(reviewsQuery);
      const unanalyzedReviews = snapshot.docs.filter(doc => {
        const data = doc.data();
        return !data.sentimentLabel && !data.sentimentAnalysis;
      });

      console.log(`📊 Found ${unanalyzedReviews.length} unanalyzed reviews out of ${snapshot.docs.length} total`);

      let analyzed = 0;
      let failed = 0;

      for (const doc of unanalyzedReviews) {
        const review = doc.data();
        console.log(`🔄 Processing review ${doc.id}:`, review.comment?.substring(0, 50) + '...');
        
        if (review.comment) {
          const sentiment = await this.analyzeReviewText(review.comment);
          
          if (sentiment) {
            await updateDoc(doc.ref, {
              sentimentLabel: sentiment.sentiment,
              sentimentScore: sentiment.score,
              sentimentAnalysis: sentiment,
              lastAnalyzedAt: Timestamp.now()
            });
            analyzed++;
            console.log(`✅ Successfully analyzed review ${doc.id}`);
          } else {
            failed++;
            console.log(`❌ Failed to analyze review ${doc.id}`);
          }
        } else {
          console.log(`⏭️  Skipping review ${doc.id} - no comment`);
        }
      }

      console.log(`📈 Analysis complete: ${analyzed} analyzed, ${failed} failed`);
      return { analyzed, failed };
    } catch (error) {
      console.error('💥 Error analyzing all reviews:', error);
      throw error;
    }
  }
}
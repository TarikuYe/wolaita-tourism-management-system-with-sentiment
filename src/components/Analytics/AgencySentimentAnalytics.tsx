import React, { useState, useMemo } from 'react';
import { Review, Tour } from '../../types';
import { TrendingUp, TrendingDown, Minus, MessageSquare, Star, AlertTriangle, RefreshCw } from 'lucide-react';
import { AnalyzeSentimentButton } from '../../components/AnalyzeSentimentButton';
import { useAuth } from '../../contexts/AuthContext';

interface AgencySentimentAnalyticsProps {
  reviews: Review[];
  tours: Tour[];
  onReviewsUpdate?: () => void; // Add this prop to refresh reviews after analysis
}

export const AgencySentimentAnalytics: React.FC<AgencySentimentAnalyticsProps> = ({ 
  reviews, 
  tours,
  onReviewsUpdate 
}) => {
  const { currentUser } = useAuth();
  const [selectedTour, setSelectedTour] = useState<string>('all');

  // Filter reviews based on selected tour
  const filteredReviews = useMemo(() => {
    if (selectedTour === 'all') {
      return reviews;
    }
    return reviews.filter(review => review.tourId === selectedTour);
  }, [reviews, selectedTour]);

  // Calculate sentiment statistics
  const sentimentStats = useMemo(() => {
    const total = filteredReviews.length;
    const positiveCount = filteredReviews.filter(r => 
      r.sentimentLabel === 'positive' || r.sentimentAnalysis?.sentiment === 'positive').length;
    const negativeCount = filteredReviews.filter(r => 
      r.sentimentLabel === 'negative' || r.sentimentAnalysis?.sentiment === 'negative').length;
    const neutralCount = filteredReviews.filter(r => 
      r.sentimentLabel === 'neutral' || r.sentimentAnalysis?.sentiment === 'neutral').length;
    const unanalyzedCount = filteredReviews.filter(r => 
      !r.sentimentLabel && !r.sentimentAnalysis?.sentiment).length;

    const totalConfidence = filteredReviews.reduce((sum, review) => 
      sum + (review.sentimentAnalysis?.confidence || 0), 0);
    const averageConfidence = total > 0 ? totalConfidence / total : 0;

    const averageRating = total > 0 
      ? filteredReviews.reduce((sum, review) => sum + review.rating, 0) / total 
      : 0;

    return {
      totalReviews: total,
      positiveCount,
      negativeCount,
      neutralCount,
      unanalyzedCount,
      averageConfidence,
      averageRating,
      positivePercentage: total > 0 ? (positiveCount / total) * 100 : 0,
      negativePercentage: total > 0 ? (negativeCount / total) * 100 : 0,
      analyzedPercentage: total > 0 ? ((total - unanalyzedCount) / total) * 100 : 0
    };
  }, [filteredReviews]);

  // Get tour-specific sentiment data
  const tourSentimentData = useMemo(() => {
    const tourMap = new Map();
    
    tours.forEach(tour => {
      const tourReviews = reviews.filter(review => review.tourId === tour.id);
      const positiveCount = tourReviews.filter(r => 
        r.sentimentLabel === 'positive' || r.sentimentAnalysis?.sentiment === 'positive').length;
      const negativeCount = tourReviews.filter(r => 
        r.sentimentLabel === 'negative' || r.sentimentAnalysis?.sentiment === 'negative').length;
      const unanalyzedCount = tourReviews.filter(r => 
        !r.sentimentLabel && !r.sentimentAnalysis?.sentiment).length;
      
      const total = tourReviews.length;
      const sentimentScore = total > 0 ? (positiveCount - negativeCount) / total : 0;
      
      tourMap.set(tour.id, {
        tourId: tour.id,
        tourName: tour.title,
        totalReviews: total,
        positiveCount,
        negativeCount,
        unanalyzedCount,
        sentimentScore,
        averageRating: total > 0 
          ? tourReviews.reduce((sum, r) => sum + r.rating, 0) / total 
          : 0
      });
    });
    
    return Array.from(tourMap.values())
      .filter(tour => tour.totalReviews > 0)
      .sort((a, b) => b.sentimentScore - a.sentimentScore);
  }, [reviews, tours]);

  // Get negative reviews for improvement suggestions
  const negativeReviews = useMemo(() => {
    return filteredReviews
      .filter(review => 
        review.sentimentLabel === 'negative' || 
        review.sentimentAnalysis?.sentiment === 'negative'
      )
      .sort((a, b) => 
        (b.sentimentAnalysis?.confidence || 0) - (a.sentimentAnalysis?.confidence || 0)
      );
  }, [filteredReviews]);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50 border-green-200';
      case 'negative': return 'text-red-600 bg-red-50 border-red-200';
      case 'neutral': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp className="h-4 w-4" />;
      case 'negative': return <TrendingDown className="h-4 w-4" />;
      case 'neutral': return <Minus className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getSentimentLabel = (score: number) => {
    if (score > 0.3) return 'Positive';
    if (score < -0.3) return 'Negative';
    return 'Neutral';
  };

  const getSentimentScoreColor = (score: number) => {
    if (score > 0.3) return 'text-green-600';
    if (score < -0.3) return 'text-red-600';
    return 'text-yellow-600';
  };

  // Handle analysis completion
  const handleAnalysisComplete = () => {
    if (onReviewsUpdate) {
      onReviewsUpdate(); // Refresh the reviews data
    }
  };

  if (reviews.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h3>
        <p className="text-gray-500">Customer reviews with sentiment analysis will appear here once available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Tour Filter and Analyze Button */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900">Customer Sentiment Analytics</h3>
            <p className="text-sm text-gray-600 mt-1">
              {sentimentStats.unanalyzedCount > 0 ? (
                <span className="text-amber-600">
                  {sentimentStats.unanalyzedCount} unanalyzed reviews - analyze to see sentiment insights
                </span>
              ) : (
                <span className="text-green-600">
                  All reviews analyzed - {sentimentStats.analyzedPercentage.toFixed(0)}% complete
                </span>
              )}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <select 
              value={selectedTour}
              onChange={(e) => setSelectedTour(e.target.value)}
              className="border rounded p-2 text-sm min-w-48"
            >
              <option value="all">All Tours</option>
              {tours.map(tour => (
                <option key={tour.id} value={tour.id}>
                  {tour.title}
                </option>
              ))}
            </select>
            
            <AnalyzeSentimentButton 
              agencyId={currentUser?.id}
              variant="primary"
              size="md"
              onAnalysisComplete={handleAnalysisComplete}
            />
          </div>
        </div>
      </div>

      {/* Sentiment Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Reviews</p>
              <p className="text-2xl font-bold">{sentimentStats.totalReviews}</p>
              {sentimentStats.unanalyzedCount > 0 && (
                <p className="text-xs text-amber-600">
                  {sentimentStats.unanalyzedCount} unanalyzed
                </p>
              )}
            </div>
            <MessageSquare className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Positive</p>
              <p className="text-2xl font-bold text-green-600">{sentimentStats.positiveCount}</p>
              <p className="text-xs text-gray-500">
                {sentimentStats.positivePercentage.toFixed(1)}% of total
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Negative</p>
              <p className="text-2xl font-bold text-red-600">{sentimentStats.negativeCount}</p>
              <p className="text-xs text-gray-500">
                {sentimentStats.negativePercentage.toFixed(1)}% of total
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Rating</p>
              <p className="text-2xl font-bold text-amber-600">
                {sentimentStats.averageRating.toFixed(1)}
              </p>
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3 w-3 ${
                      star <= Math.round(sentimentStats.averageRating)
                        ? 'text-amber-500 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            <Star className="h-8 w-8 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Tour Performance */}
      {tourSentimentData.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-medium text-gray-900">Tour Performance by Sentiment</h4>
            <span className="text-sm text-gray-500">
              {tourSentimentData.filter(tour => tour.unanalyzedCount > 0).length} tours need analysis
            </span>
          </div>
          <div className="space-y-4">
            {tourSentimentData.map((tour) => (
              <div key={tour.tourId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">{tour.tourName}</h5>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <span>{tour.totalReviews} reviews</span>
                      <span>•</span>
                      <span className="flex items-center">
                        <Star className="h-3 w-3 text-amber-500 mr-1" />
                        {tour.averageRating.toFixed(1)} avg rating
                      </span>
                      {tour.unanalyzedCount > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-amber-600">
                            {tour.unanalyzedCount} unanalyzed
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <span className={`text-lg font-bold ${getSentimentScoreColor(tour.sentimentScore)}`}>
                        {getSentimentLabel(tour.sentimentScore)}
                      </span>
                      <div className="text-xs text-gray-500">
                        {tour.positiveCount} positive • {tour.negativeCount} negative
                      </div>
                    </div>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          tour.sentimentScore > 0.3 ? 'bg-green-500' :
                          tour.sentimentScore < -0.3 ? 'bg-red-500' : 'bg-yellow-500'
                        }`}
                        style={{ 
                          width: `${Math.max(10, Math.abs(tour.sentimentScore) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Improvement Suggestions */}
      {negativeReviews.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 border border-red-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-red-600 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Areas for Improvement ({negativeReviews.length})
            </h4>
            <span className="text-sm text-gray-500">
              Based on negative feedback
            </span>
          </div>

          <div className="space-y-4">
            {negativeReviews.slice(0, 5).map((review) => (
              <div key={review.id} className="border-l-4 border-red-500 pl-4 py-3 bg-red-50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{review.tourName}</p>
                    <p className="text-sm text-gray-600">By {review.touristName}</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">
                      Confidence: {Math.round((review.sentimentAnalysis?.confidence || 0) * 100)}%
                    </span>
                    <div className="text-sm text-gray-500 mt-1">
                      Rating: {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 text-sm">{review.comment}</p>
                {review.sentimentAnalysis?.processedText && (
                  <p className="text-xs text-gray-500 mt-1">
                    Key concerns: {review.sentimentAnalysis.processedText}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Reviews with Sentiment */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Recent Reviews with Sentiment Analysis</h4>
        <div className="space-y-4">
          {filteredReviews.slice(0, 10).map((review) => (
            <div key={review.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-3">
                <div>
                  <h5 className="font-medium text-gray-900">{review.tourName}</h5>
                  <p className="text-sm text-gray-600">By {review.touristName}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= review.rating
                            ? 'text-amber-500 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    getSentimentColor(review.sentimentLabel || review.sentimentAnalysis?.sentiment || 'neutral')
                  }`}>
                    {getSentimentIcon(review.sentimentLabel || review.sentimentAnalysis?.sentiment || 'neutral')}
                    <span className="ml-1 capitalize">
                      {review.sentimentLabel || review.sentimentAnalysis?.sentiment || 'neutral'}
                    </span>
                  </span>
                </div>
              </div>
              <p className="text-gray-700 text-sm">{review.comment}</p>
              {review.sentimentAnalysis && (
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <span>
                    Confidence: {Math.round(review.sentimentAnalysis.confidence * 100)}%
                  </span>
                  <span>
                    {review.createdAt instanceof Date 
                      ? review.createdAt.toLocaleDateString()
                      : new Date(review.createdAt).toLocaleDateString()
                    }
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
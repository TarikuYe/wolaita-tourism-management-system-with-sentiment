import React, { useState, useEffect } from 'react';
import { 
  collection, query, orderBy, onSnapshot, where, doc, updateDoc, deleteDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Review, SentimentStats, ReviewModerationLog } from '../../types';
import { 
  TrendingUp, TrendingDown, Minus, AlertTriangle, MessageSquare, 
  Trash2, Flag, Shield, Eye, EyeOff, RefreshCw 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { AnalyzeSentimentButton } from '../../components/AnalyzeSentimentButton';

interface SentimentAnalyticsProps {
  reviews?: Review[];
  onReviewsUpdate?: () => void; // Add this prop to refresh after analysis
}

export const SentimentAnalytics: React.FC<SentimentAnalyticsProps> = ({ 
  reviews: propReviews,
  onReviewsUpdate 
}) => {
  const { currentUser } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [sentimentStats, setSentimentStats] = useState<SentimentStats | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showFlagModal, setShowFlagModal] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState<'spam' | 'fake' | 'inappropriate' | 'hate_speech' | 'scam' | 'other'>('spam');
  const [customReason, setCustomReason] = useState('');

  useEffect(() => {
    let reviewsQuery;
    
    if (propReviews) {
      setReviews(propReviews);
      calculateStats(propReviews);
      setLoading(false);
    } else {
      // Fetch all reviews including flagged and deleted for admin view
      reviewsQuery = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(reviewsQuery, (snapshot) => {
        const reviewsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Review[];
        
        setReviews(reviewsData);
        calculateStats(reviewsData);
        setLoading(false);
      }, error => {
        console.error('Failed to fetch reviews:', error);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [propReviews, timeRange]);

  const calculateStats = (reviewsData: Review[]) => {
    const total = reviewsData.length;
    const positiveCount = reviewsData.filter(r => 
      !r.deleted && (r.sentimentLabel === 'positive' || r.sentimentAnalysis?.sentiment === 'positive')).length;
    const negativeCount = reviewsData.filter(r => 
      !r.deleted && (r.sentimentLabel === 'negative' || r.sentimentAnalysis?.sentiment === 'negative')).length;
    const neutralCount = reviewsData.filter(r => 
      !r.deleted && (r.sentimentLabel === 'neutral' || r.sentimentAnalysis?.sentiment === 'neutral')).length;
    const flaggedCount = reviewsData.filter(r => r.flagged && !r.deleted).length;
    const deletedCount = reviewsData.filter(r => r.deleted).length;
    const unanalyzedCount = reviewsData.filter(r => 
      !r.deleted && !r.sentimentLabel && !r.sentimentAnalysis?.sentiment
    ).length;

    const activeReviews = reviewsData.filter(r => !r.deleted);
    const totalConfidence = activeReviews.reduce((sum, review) => 
      sum + (review.sentimentAnalysis?.confidence || 0), 0);
    const averageConfidence = activeReviews.length > 0 ? totalConfidence / activeReviews.length : 0;

    setSentimentStats({
      totalReviews: activeReviews.length,
      positiveCount,
      negativeCount,
      neutralCount,
      averageConfidence,
      positivePercentage: activeReviews.length > 0 ? (positiveCount / activeReviews.length) * 100 : 0,
      negativePercentage: activeReviews.length > 0 ? (negativeCount / activeReviews.length) * 100 : 0,
      flaggedCount,
      deletedCount,
      unanalyzedCount
    });
  };

  // Handle analysis completion
  const handleAnalysisComplete = () => {
    if (onReviewsUpdate) {
      onReviewsUpdate(); // Refresh the reviews data
    }
  };

  const getNegativeReviews = () => {
    return reviews
      .filter(review => 
        !review.deleted && (
          review.sentimentLabel === 'negative' || 
          review.sentimentAnalysis?.sentiment === 'negative'
        )
      )
      .sort((a, b) => 
        (b.sentimentAnalysis?.confidence || 0) - (a.sentimentAnalysis?.confidence || 0)
      );
  };

  const getFlaggedReviews = () => {
    return reviews
      .filter(review => review.flagged && !review.deleted)
      .sort((a, b) => new Date(b.flaggedAt || 0).getTime() - new Date(a.flaggedAt || 0).getTime());
  };

  const getDeletedReviews = () => {
    return reviews
      .filter(review => review.deleted)
      .sort((a, b) => new Date(b.deletedAt || 0).getTime() - new Date(a.deletedAt || 0).getTime());
  };

  const getUnanalyzedReviews = () => {
    return reviews
      .filter(review => !review.deleted && !review.sentimentLabel && !review.sentimentAnalysis?.sentiment)
      .slice(0, 10); // Show only recent unanalyzed reviews
  };

  const handleFlagReview = async (reviewId: string) => {
    if (!currentUser) {
      toast.error('You must be logged in to flag reviews');
      return;
    }

    try {
      const reviewRef = doc(db, 'reviews', reviewId);
      const reasonText = flagReason === 'other' ? customReason : flagReason;
      
      await updateDoc(reviewRef, {
        flagged: true,
        flagReason: flagReason,
        flaggedBy: currentUser.id,
        flaggedAt: Timestamp.now()
      });

      // Log the moderation action
      await logModerationAction(reviewId, 'flag', reasonText);

      toast.success('Review flagged successfully');
      setShowFlagModal(null);
      setFlagReason('spam');
      setCustomReason('');
    } catch (error) {
      console.error('Error flagging review:', error);
      toast.error('Failed to flag review');
    }
  };

  const handleUnflagReview = async (reviewId: string) => {
    if (!currentUser) {
      toast.error('You must be logged in to unflag reviews');
      return;
    }

    try {
      const reviewRef = doc(db, 'reviews', reviewId);
      
      await updateDoc(reviewRef, {
        flagged: false,
        flagReason: null,
        flaggedBy: null,
        flaggedAt: null
      });

      // Log the moderation action
      await logModerationAction(reviewId, 'unflag');

      toast.success('Review unflagged successfully');
    } catch (error) {
      console.error('Error unflagging review:', error);
      toast.error('Failed to unflag review');
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!currentUser) {
      toast.error('You must be logged in to delete reviews');
      return;
    }

    try {
      const reviewRef = doc(db, 'reviews', reviewId);
      
      await updateDoc(reviewRef, {
        deleted: true,
        deletedBy: currentUser.id,
        deletedAt: Timestamp.now()
      });

      // Log the moderation action
      await logModerationAction(reviewId, 'delete', 'Admin deletion for scam/inappropriate content');

      toast.success('Review deleted successfully');
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Failed to delete review');
    }
  };

  const handleRestoreReview = async (reviewId: string) => {
    if (!currentUser) {
      toast.error('You must be logged in to restore reviews');
      return;
    }

    try {
      const reviewRef = doc(db, 'reviews', reviewId);
      
      await updateDoc(reviewRef, {
        deleted: false,
        deletedBy: null,
        deletedAt: null,
        flagged: false,
        flagReason: null,
        flaggedBy: null,
        flaggedAt: null
      });

      // Log the moderation action
      await logModerationAction(reviewId, 'restore');

      toast.success('Review restored successfully');
    } catch (error) {
      console.error('Error restoring review:', error);
      toast.error('Failed to restore review');
    }
  };

  const logModerationAction = async (
    reviewId: string, 
    action: 'flag' | 'unflag' | 'delete' | 'restore', 
    reason?: string
  ) => {
    if (!currentUser) return;

    try {
      const logRef = doc(collection(db, 'moderationLogs'));
      await updateDoc(logRef, {
        id: logRef.id,
        reviewId,
        action,
        reason,
        adminId: currentUser.id,
        adminName: currentUser.name,
        performedAt: Timestamp.now(),
        details: `Admin ${currentUser.name} performed ${action} on review ${reviewId}`
      });
    } catch (error) {
      console.error('Error logging moderation action:', error);
    }
  };

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

  const getFlagReasonText = (reason: string) => {
    switch (reason) {
      case 'spam': return 'Spam';
      case 'fake': return 'Fake Review';
      case 'inappropriate': return 'Inappropriate Content';
      case 'hate_speech': return 'Hate Speech';
      case 'scam': return 'Scam/Fraud';
      case 'other': return 'Other';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!sentimentStats) {
    return <div>No sentiment data available</div>;
  }

  const negativeReviews = getNegativeReviews();
  const flaggedReviews = getFlaggedReviews();
  const deletedReviews = getDeletedReviews();
  const unanalyzedReviews = getUnanalyzedReviews();

  return (
    <div className="space-y-6">
      {/* Header with Time Range and Analyze Button */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Sentiment Analytics & Moderation</h3>
          {sentimentStats.unanalyzedCount > 0 && (
            <p className="text-sm text-amber-600 mt-1">
              {sentimentStats.unanalyzedCount} unanalyzed reviews - analyze to get complete sentiment insights
            </p>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="border rounded p-2 text-sm min-w-48"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="all">All Time</option>
          </select>
          
          <AnalyzeSentimentButton 
            // No agencyId = analyze all reviews (admin mode)
            variant="primary"
            size="md"
            onAnalysisComplete={handleAnalysisComplete}
          />
        </div>
      </div>

      {/* Sentiment Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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

        <div className="bg-white p-4 rounded-lg shadow border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Flagged</p>
              <p className="text-2xl font-bold text-orange-600">{sentimentStats.flaggedCount}</p>
              <p className="text-xs text-gray-500">Needs review</p>
            </div>
            <Flag className="h-8 w-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Deleted</p>
              <p className="text-2xl font-bold text-gray-600">{sentimentStats.deletedCount}</p>
              <p className="text-xs text-gray-500">Removed</p>
            </div>
            <Trash2 className="h-8 w-8 text-gray-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unanalyzed</p>
              <p className="text-2xl font-bold text-amber-600">{sentimentStats.unanalyzedCount}</p>
              <p className="text-xs text-gray-500">Needs analysis</p>
            </div>
            <RefreshCw className="h-8 w-8 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Unanalyzed Reviews Section */}
      {unanalyzedReviews.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 border border-amber-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-amber-600 flex items-center">
              <RefreshCw className="h-5 w-5 mr-2" />
              Unanalyzed Reviews ({sentimentStats.unanalyzedCount})
            </h4>
            <span className="text-sm text-gray-500">
              These reviews need sentiment analysis
            </span>
          </div>

          <div className="space-y-4">
            {unanalyzedReviews.map((review) => (
              <div key={review.id} className="border-l-4 border-amber-500 pl-4 py-3 bg-amber-50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{review.tourName}</p>
                    <p className="text-sm text-gray-600">By {review.touristName}</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-sm font-medium">
                      Pending Analysis
                    </span>
                    <div className="text-sm text-gray-500 mt-1">
                      Rating: {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 text-sm">{review.comment}</p>
                <div className="text-xs text-amber-600 mt-1">
                  Click "Analyze Sentiment" above to process this review
                </div>
              </div>
            ))}
            {sentimentStats.unanalyzedCount > 10 && (
              <div className="text-center text-sm text-gray-500">
                ... and {sentimentStats.unanalyzedCount - 10} more unanalyzed reviews
              </div>
            )}
          </div>
        </div>
      )}

      {/* Flagged Reviews Section */}
      {flaggedReviews.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 border border-orange-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-orange-600 flex items-center">
              <Flag className="h-5 w-5 mr-2" />
              Flagged Reviews ({flaggedReviews.length})
            </h4>
            <span className="text-sm text-gray-500">
              Reviews flagged for moderation
            </span>
          </div>

          <div className="space-y-4">
            {flaggedReviews.map((review) => (
              <div key={review.id} className="border-l-4 border-orange-500 pl-4 py-3 bg-orange-50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{review.tourName}</p>
                    <p className="text-sm text-gray-600">By {review.touristName}</p>
                    {review.flagReason && (
                      <span className="inline-block mt-1 bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
                        Reason: {getFlagReasonText(review.flagReason)}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      getSentimentColor(review.sentimentLabel || review.sentimentAnalysis?.sentiment || 'neutral')
                    }`}>
                      {getSentimentIcon(review.sentimentLabel || review.sentimentAnalysis?.sentiment || 'neutral')}
                      <span className="ml-1 capitalize">
                        {review.sentimentLabel || review.sentimentAnalysis?.sentiment || 'neutral'}
                      </span>
                    </span>
                    <div className="flex space-x-2 mt-2">
                      <button
                        onClick={() => handleUnflagReview(review.id)}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        Unflag
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(review.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 text-sm">{review.comment}</p>
                <div className="text-sm text-gray-500 mt-1">
                  Rating: {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)} | 
                  Confidence: {Math.round((review.sentimentAnalysis?.confidence || 0) * 100)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Critical Reviews Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-medium text-red-600 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Critical Reviews Needing Attention ({negativeReviews.length})
          </h4>
          {negativeReviews.length > 0 && (
            <span className="text-sm text-gray-500">
              Sorted by confidence (most concerning first)
            </span>
          )}
        </div>

        <div className="space-y-4">
          {negativeReviews.slice(0, 10).map((review) => (
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
                  <div className="flex space-x-2 mt-2">
                    <button
                      onClick={() => setShowFlagModal(review.id)}
                      className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                    >
                      Flag
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(review.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-gray-700 text-sm">{review.comment}</p>
              {review.sentimentAnalysis?.processedText && (
                <p className="text-xs text-gray-500 mt-1">
                  Analyzed: {review.sentimentAnalysis.processedText}
                </p>
              )}
            </div>
          ))}
          
          {negativeReviews.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No critical reviews found</p>
              <p className="text-sm">All reviews are positive or neutral</p>
            </div>
          )}
        </div>
      </div>

      {/* Deleted Reviews Section */}
      {deletedReviews.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-600 flex items-center">
              <Trash2 className="h-5 w-5 mr-2" />
              Deleted Reviews ({deletedReviews.length})
            </h4>
            <span className="text-sm text-gray-500">
              Removed by moderators
            </span>
          </div>

          <div className="space-y-4">
            {deletedReviews.slice(0, 5).map((review) => (
              <div key={review.id} className="border-l-4 border-gray-400 pl-4 py-3 bg-gray-50 opacity-75">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-gray-900 line-through">{review.tourName}</p>
                    <p className="text-sm text-gray-600">By {review.touristName}</p>
                    {review.flagReason && (
                      <span className="inline-block mt-1 bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">
                        Was flagged as: {getFlagReasonText(review.flagReason)}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <button
                      onClick={() => handleRestoreReview(review.id)}
                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                    >
                      Restore
                    </button>
                  </div>
                </div>
                <p className="text-gray-700 text-sm line-through">{review.comment}</p>
                <div className="text-sm text-gray-500 mt-1">
                  Deleted on: {review.deletedAt ? new Date(review.deletedAt).toLocaleDateString() : 'Unknown'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Sentiment Analysis */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Recent Sentiment Analysis</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tour</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reviewer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sentiment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reviews
                .filter(review => !review.deleted)
                .slice(0, 10)
                .map((review) => (
                <tr key={review.id} className={review.flagged ? 'bg-orange-50' : ''}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                      {review.tourName}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{review.touristName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      getSentimentColor(review.sentimentLabel || review.sentimentAnalysis?.sentiment || 'neutral')
                    }`}>
                      {getSentimentIcon(review.sentimentLabel || review.sentimentAnalysis?.sentiment || 'neutral')}
                      <span className="ml-1 capitalize">
                        {review.sentimentLabel || review.sentimentAnalysis?.sentiment || 'neutral'}
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {review.sentimentAnalysis ? 
                        `${Math.round(review.sentimentAnalysis.confidence * 100)}%` : 
                        'Not analyzed'
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {review.flagged ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        <Flag className="h-3 w-3 mr-1" />
                        Flagged
                      </span>
                    ) : !review.sentimentLabel && !review.sentimentAnalysis ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Unanalyzed
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Shield className="h-3 w-3 mr-1" />
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {review.flagged ? (
                      <button
                        onClick={() => handleUnflagReview(review.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Unflag
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowFlagModal(review.id)}
                        className="text-orange-600 hover:text-orange-900"
                      >
                        Flag
                      </button>
                    )}
                    <button
                      onClick={() => setShowDeleteConfirm(review.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-red-600 mb-4">Delete Review</h3>
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete this review? This action cannot be undone.
              The review will be marked as deleted but retained in the database for audit purposes.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteReview(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flag Review Modal */}
      {showFlagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-orange-600 mb-4">Flag Review</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Flagging
                </label>
                <select
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value as any)}
                  className="w-full border rounded p-2"
                >
                  <option value="spam">Spam</option>
                  <option value="fake">Fake Review</option>
                  <option value="inappropriate">Inappropriate Content</option>
                  <option value="hate_speech">Hate Speech</option>
                  <option value="scam">Scam/Fraud</option>
                  <option value="other">Other</option>
                </select>
              </div>
              {flagReason === 'other' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Reason
                  </label>
                  <input
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full border rounded p-2"
                    placeholder="Please specify the reason..."
                  />
                </div>
              )}
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowFlagModal(null);
                    setFlagReason('spam');
                    setCustomReason('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleFlagReview(showFlagModal)}
                  className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                >
                  Flag Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
import React, { useState } from 'react';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { SentimentAnalysisService } from '../services/sentimentAnalysisService';
import toast from 'react-hot-toast';

interface AnalyzeSentimentButtonProps {
  agencyId?: string; // If provided, analyzes only agency reviews. If not, analyzes all reviews (admin)
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  onAnalysisComplete?: () => void;
}

export const AnalyzeSentimentButton: React.FC<AnalyzeSentimentButtonProps> = ({ 
  agencyId, 
  variant = 'primary',
  size = 'md',
  onAnalysisComplete
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastResult, setLastResult] = useState<{ analyzed: number; failed: number } | null>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setLastResult(null);

    try {
      let result;
      
      if (agencyId) {
        console.log('🔄 Starting agency-specific analysis');
        result = await SentimentAnalysisService.analyzeAgencyReviews(agencyId);
        toast.success(`Analyzed ${result.analyzed} reviews for your agency!`);
      } else {
        console.log('🔄 Starting admin-wide analysis');
        result = await SentimentAnalysisService.analyzeAllReviews();
        toast.success(`Analyzed ${result.analyzed} reviews across all agencies!`);
      }

      setLastResult(result);

      if (result.failed > 0) {
        toast.error(`${result.failed} reviews failed to analyze`);
      }

      // Call the completion callback
      if (onAnalysisComplete) {
        onAnalysisComplete();
      }
    } catch (error: any) {
      console.error('💥 Analysis failed:', error);
      toast.error('Failed to analyze reviews. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getButtonStyles = () => {
    const baseStyles = "inline-flex items-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500";
    
    const variants = {
      primary: "bg-amber-600 text-white hover:bg-amber-700",
      secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300"
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base"
    };

    return `${baseStyles} ${variants[variant]} ${sizes[size]}`;
  };

  return (
    <div className="flex flex-col space-y-2">
      <button
        onClick={handleAnalyze}
        disabled={isAnalyzing}
        className={getButtonStyles()}
      >
        {isAnalyzing ? (
          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <RefreshCw className="w-4 h-4 mr-2" />
        )}
        {isAnalyzing ? 'Analyzing...' : 'Analyze Sentiment'}
      </button>

      {lastResult && (
        <div className="text-xs text-gray-600 flex items-center space-x-4">
          <span className="flex items-center text-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            {lastResult.analyzed} analyzed
          </span>
          {lastResult.failed > 0 && (
            <span className="flex items-center text-red-600">
              <XCircle className="w-3 h-3 mr-1" />
              {lastResult.failed} failed
            </span>
          )}
        </div>
      )}
    </div>
  );
};
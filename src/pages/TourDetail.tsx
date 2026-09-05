// src/pages/TourDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Clock, DollarSign, Heart, Users, Calendar, Check, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Tour } from '../types';
import { BookingModal } from '../components/Modals/BookingModal';
import { FavoriteButton } from '../components/FavoriteButton';
import toast from 'react-hot-toast';

export const TourDetail: React.FC = () => {
  const { t } = useLanguage();
  const { language } = useLanguage();
  const { currentUser } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    const fetchTour = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const tourDoc = await getDoc(doc(db, 'tours', id));
        
        if (tourDoc.exists()) {
          const data = tourDoc.data();
          const tourData: Tour = {
            id: tourDoc.id,
            title: data.title as string,
            titleAm: data.titleAm as string,
            description: data.description as string,
            descriptionAm: data.descriptionAm as string,
            agencyId: data.agencyId as string,
            agencyName: data.agencyName as string,
            price: data.price as number,
            duration: data.duration as number,
            maxParticipants: data.maxParticipants as number,
            images: data.images as string[] || [],
            location: data.location as string,
            locationAm: data.locationAm as string,
            highlights: data.highlights as string[] || [],
            highlightsAm: data.highlightsAm as string[] || [],
            difficulty: data.difficulty as 'Easy' | 'Medium' | 'Hard',
            category: data.category as 'Cultural' | 'Adventure' | 'Religious' | 'Nature' | 'Historical',
            available: data.available !== false,
            rating: data.rating as number || 0,
            reviewsCount: data.reviewsCount as number || 0,
            createdAt: data.createdAt?.toDate?.() || new Date(),
          };
          setTour(tourData);
        } else {
          toast.error('Tour not found');
        }
      } catch (error) {
        console.error('Error fetching tour:', error);
        toast.error('Failed to load tour details');
      } finally {
        setLoading(false);
      }
    };

    fetchTour();
  }, [id]);

  const handleBookNow = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (tour) {
      setShowBookingModal(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tour details...</p>
        </div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {language === 'en' ? 'Tour not found' : 'ጉዞ አልተገኘም'}
          </h2>
          <Link to="/tours" className="text-amber-600 hover:text-amber-700 font-medium">
            {language === 'en' ? 'Back to Tours' : 'ወደ ጉዞዎች ተመለስ'}
          </Link>
        </div>
      </div>
    );
  }

  const tourTitle = language === 'en' ? tour.title : tour.titleAm || tour.title;
  const tourDescription = language === 'en' ? tour.description : tour.descriptionAm || tour.description;
  const tourLocation = language === 'en' ? tour.location : tour.locationAm || tour.location;
  const tourHighlights = language === 'en' ? tour.highlights : tour.highlightsAm || tour.highlights;
  const mainImage = tour.images?.[0] || 'https://images.pexels.com/photos/2356045/pexels-photo-2356045.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="relative h-96 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${mainImage})` }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-end pb-8">
          <Link 
            to="/tours"
            className="inline-flex items-center text-white mb-6 hover:text-amber-200 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            {language === 'en' ? 'Back to Tours' : 'ወደ ጉዞዎች ተመለስ'}
          </Link>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            {tourTitle}
          </motion.h1>
          
          <div className="flex flex-wrap items-center gap-6 text-white">
            <div className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              <span>{tourLocation}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              <span>{tour.duration} {tour.duration === 1 ? (language === 'en' ? 'Day' : 'ቀን') : (language === 'en' ? 'Days' : 'ቀናት')}</span>
            </div>
            <div className="flex items-center">
              <Star className="h-5 w-5 mr-2 text-yellow-400 fill-current" />
              <span>{tour.rating?.toFixed(1) || '0.0'} ({tour.reviewsCount || 0})</span>
            </div>
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              <span className="text-2xl font-bold">${tour.price}</span>
              <span className="text-sm ml-1">/person</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-12">
          {/* Left Column - Tour Details */}
          <div className="md:col-span-2">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-md p-6 mb-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {language === 'en' ? 'Overview' : 'አጠቃላይ እይታ'}
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {tourDescription}
              </p>
            </motion.div>

            {tourHighlights && tourHighlights.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-lg shadow-md p-6 mb-8"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {language === 'en' ? 'Highlights' : 'ዋና ዋና ነገሮች'}
                </h2>
                <ul className="grid md:grid-cols-2 gap-3">
                  {tourHighlights.map((highlight, index) => (
                    <li key={index} className="flex items-start">
                      <div className="bg-amber-100 p-1 rounded-full mr-3 mt-1 flex-shrink-0">
                        <Heart className="h-4 w-4 text-amber-600" />
                      </div>
                      <span className="text-gray-700">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Image Gallery */}
            {tour.images && tour.images.length > 1 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-lg shadow-md p-6 mb-8"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {language === 'en' ? 'Gallery' : 'ጋለሪ'}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {tour.images.slice(1).map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${tourTitle} - Image ${index + 2}`}
                      className="w-full h-48 object-cover rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                      onClick={() => window.open(image, '_blank')}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column - Booking Card */}
          <div className="md:col-span-1">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow-lg p-6 sticky top-8"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {language === 'en' ? 'Book This Tour' : 'ይህን ጉዞ ይዘዙ'}
                </h3>
                <FavoriteButton tourId={tour.id} />
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{language === 'en' ? 'Price per person' : 'በአንድ ሰው ዋጋ'}</span>
                  <span className="font-semibold text-gray-900">${tour.price}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{language === 'en' ? 'Duration' : 'ጊዜ'}</span>
                  <span className="font-semibold text-gray-900">{tour.duration} {tour.duration === 1 ? (language === 'en' ? 'Day' : 'ቀን') : (language === 'en' ? 'Days' : 'ቀናት')}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{language === 'en' ? 'Max Participants' : 'ከፍተኛ ተሳታፊዎች'}</span>
                  <span className="font-semibold text-gray-900">{tour.maxParticipants}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{language === 'en' ? 'Difficulty' : 'አስቸጋሪነት'}</span>
                  <span className={`font-semibold px-2 py-1 rounded ${
                    tour.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                    tour.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {tour.difficulty}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{language === 'en' ? 'Category' : 'ምድብ'}</span>
                  <span className="font-semibold text-gray-900">{tour.category}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{language === 'en' ? 'Agency' : 'አጀንዲ'}</span>
                  <span className="font-semibold text-gray-900">{tour.agencyName}</span>
                </div>
              </div>

              {tour.available ? (
                <button
                  onClick={handleBookNow}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  {language === 'en' ? 'Book Now' : 'አሁን ይዘዙ'}
                </button>
              ) : (
                <button
                  disabled
                  className="w-full bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg cursor-not-allowed flex items-center justify-center"
                >
                  {language === 'en' ? 'Not Available' : 'አይገኝም'}
                </button>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">
                  {language === 'en' ? 'What\'s Included' : 'የተካተቱ ነገሮች'}
                </h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                    <span>{language === 'en' ? 'Professional Guide' : 'የሙያ መሪ'}</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                    <span>{language === 'en' ? 'Transportation' : 'መጓዝ'}</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                    <span>{language === 'en' ? 'Accommodation' : 'አሰፋፈር'}</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                    <span>{language === 'en' ? 'Meals' : 'ምግቦች'}</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {tour && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          tour={tour}
        />
      )}
    </div>
  );
};

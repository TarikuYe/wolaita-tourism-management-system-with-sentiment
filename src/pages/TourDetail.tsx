// src/pages/TourDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Clock, DollarSign, Heart, Users, Calendar, Check, ShieldCheck, Sparkles } from 'lucide-react';
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
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f5]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading tour details...</p>
        </div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f5] px-4">
        <div className="text-center bg-white p-8 sm:p-12 rounded-3xl border border-slate-100 shadow-sm max-w-md w-full">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            {language === 'en' ? 'Tour not found' : 'ጉዞ አልተገኘም'}
          </h2>
          <Link to="/tours" className="inline-flex items-center text-orange-600 hover:text-orange-700 font-semibold gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span>{language === 'en' ? 'Back to Tours' : 'ወደ ጉዞዎች ተመለስ'}</span>
          </Link>
        </div>
      </div>
    );
  }

  const tourTitle = language === 'en' ? tour.title : tour.titleAm || tour.title;
  const tourDescription = language === 'en' ? tour.description : tour.descriptionAm || tour.description;
  const tourLocation = language === 'en' ? tour.location : tour.locationAm || tour.location;
  const tourHighlights = language === 'en' ? tour.highlights : tour.highlightsAm || tour.highlights;
  const mainImage = tour.images?.[0] || '/images/Attractions/Ajoo.jpg';

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* Header Banner */}
      <div className="relative h-[420px] overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${mainImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-black/30"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-end pb-10">
          <Link 
            to="/tours"
            className="inline-flex items-center text-white/90 mb-6 hover:text-orange-300 font-medium text-sm transition-colors w-fit gap-2 bg-black/30 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{language === 'en' ? 'Back to Tours' : 'ወደ ጉዞዎች ተመለስ'}</span>
          </Link>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight"
          >
            {tourTitle}
          </motion.h1>
          
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-white text-xs sm:text-sm">
            <div className="flex items-center bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              <MapPin className="h-4 w-4 mr-1.5 text-orange-400" />
              <span>{tourLocation}</span>
            </div>
            <div className="flex items-center bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              <Clock className="h-4 w-4 mr-1.5 text-orange-400" />
              <span>{tour.duration} {tour.duration === 1 ? (language === 'en' ? 'Day' : 'ቀን') : (language === 'en' ? 'Days' : 'ቀናት')}</span>
            </div>
            <div className="flex items-center bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              <Star className="h-4 w-4 mr-1.5 text-orange-400 fill-current" />
              <span>{tour.rating?.toFixed(1) || '4.8'} ({tour.reviewsCount || 0})</span>
            </div>
            <div className="flex items-center bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              <span className="text-orange-400 font-bold mr-1">${tour.price}</span>
              <span className="text-slate-200">/ person</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column - Tour Details */}
          <div className="md:col-span-2 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-xs p-8"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-500" />
                <span>{language === 'en' ? 'Overview' : 'አጠቃላይ እይታ'}</span>
              </h2>
              <p className="text-slate-600 leading-relaxed text-base whitespace-pre-line">
                {tourDescription}
              </p>
            </motion.div>

            {tourHighlights && tourHighlights.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-3xl border border-slate-100 shadow-xs p-8"
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-6">
                  {language === 'en' ? 'Highlights' : 'ዋና ዋና ነገሮች'}
                </h2>
                <ul className="grid sm:grid-cols-2 gap-4">
                  {tourHighlights.map((highlight, index) => (
                    <li key={index} className="flex items-start bg-[#fafafa] p-4 rounded-2xl border border-slate-100">
                      <div className="bg-rose-100/80 p-1.5 rounded-xl mr-3 mt-0.5 flex-shrink-0 text-rose-500">
                        <Heart className="h-4 w-4" />
                      </div>
                      <span className="text-slate-700 font-medium text-sm">{highlight}</span>
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
                className="bg-white rounded-3xl border border-slate-100 shadow-xs p-8"
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-6">
                  {language === 'en' ? 'Gallery' : 'ጋለሪ'}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {tour.images.slice(1).map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${tourTitle} - Image ${index + 2}`}
                      className="w-full h-44 object-cover rounded-2xl border border-slate-100 hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
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
              className="bg-white rounded-3xl border border-slate-100 shadow-sm p-7 sticky top-24"
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-900">
                  {language === 'en' ? 'Book This Tour' : 'ይህን ጉዞ ይዘዙ'}
                </h3>
                <FavoriteButton tourId={tour.id} />
              </div>

              <div className="space-y-3.5 mb-6 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">{language === 'en' ? 'Price per person' : 'በአንድ ሰው ዋጋ'}</span>
                  <span className="font-extrabold text-orange-600 text-lg">${tour.price}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">{language === 'en' ? 'Duration' : 'ጊዜ'}</span>
                  <span className="font-semibold text-slate-800">{tour.duration} {tour.duration === 1 ? (language === 'en' ? 'Day' : 'ቀን') : (language === 'en' ? 'Days' : 'ቀናት')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">{language === 'en' ? 'Max Participants' : 'ከፍተኛ ተሳታፊዎች'}</span>
                  <span className="font-semibold text-slate-800">{tour.maxParticipants}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">{language === 'en' ? 'Difficulty' : 'አስቸጋሪነት'}</span>
                  <span className={`font-semibold text-xs px-2.5 py-1 rounded-full ${
                    tour.difficulty === 'Easy' ? 'bg-emerald-100 text-emerald-800' :
                    tour.difficulty === 'Medium' ? 'bg-amber-100 text-amber-800' :
                    'bg-rose-100 text-rose-800'
                  }`}>
                    {tour.difficulty}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">{language === 'en' ? 'Category' : 'ምድብ'}</span>
                  <span className="font-semibold text-slate-800">{tour.category}</span>
                </div>
                {tour.agencyName && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{language === 'en' ? 'Agency' : 'ኤጀንሲ'}</span>
                    <span className="font-semibold text-slate-800">{tour.agencyName}</span>
                  </div>
                )}
              </div>

              {tour.available ? (
                <button
                  onClick={handleBookNow}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-xs hover:shadow-md flex items-center justify-center gap-2"
                >
                  <Calendar className="h-5 w-5" />
                  <span>{language === 'en' ? 'Book Now' : 'አሁን ይዘዙ'}</span>
                </button>
              ) : (
                <button
                  disabled
                  className="w-full bg-slate-200 text-slate-400 font-bold py-3.5 px-6 rounded-xl cursor-not-allowed flex items-center justify-center"
                >
                  {language === 'en' ? 'Not Available' : 'አይገኝም'}
                </button>
              )}

              <div className="mt-6 pt-6 border-t border-slate-100">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3">
                  {language === 'en' ? 'What\'s Included' : 'የተካተቱ ነገሮች'}
                </h4>
                <ul className="space-y-2 text-xs text-slate-600">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-emerald-600 mr-2 flex-shrink-0" />
                    <span>{language === 'en' ? 'Professional Local Guide' : 'የሙያ የአካባቢ መሪ'}</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-emerald-600 mr-2 flex-shrink-0" />
                    <span>{language === 'en' ? 'Ground Transportation' : 'የመሬት መጓጓዣ'}</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-emerald-600 mr-2 flex-shrink-0" />
                    <span>{language === 'en' ? 'Verified Accommodation' : 'የተረጋገጠ ማረፊያ'}</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-emerald-600 mr-2 flex-shrink-0" />
                    <span>{language === 'en' ? 'Selected Cultural Meals' : 'የተመረጡ ባህላዊ ምግቦች'}</span>
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

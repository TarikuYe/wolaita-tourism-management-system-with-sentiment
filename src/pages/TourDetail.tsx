// src/pages/TourDetail.tsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Clock, DollarSign, Heart } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';

// Mock data - in a real app, this would come from an API
const tourData = {
  "mochena-borago-cave": {
    id: "mochena-borago-cave",
    title: "home.mochena.borago.cave",
    image: "https://images.pexels.com/photos/2356045/pexels-photo-2356045.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop",
    price: "$150",
    duration: "3 Days",
    rating: 4.9,
    location: "Wolaita, Ethiopia",
    description: "home.tour.mochena.borago.desc",
    highlights: [
      "home.tour.highlights.cave.exploration",
      "home.tour.highlights.local.culture",
      "home.tour.highlights.scenic.views",
      "home.tour.highlights.guided.hike"
    ],
    included: [
      "home.tour.included.accommodation",
      "home.tour.included.meals",
      "home.tour.included.guide",
      "home.tour.included.transportation"
    ],
    notIncluded: [
      "home.tour.notIncluded.personal.expenses",
      "home.tour.notIncluded.travel.insurance",
      "home.tour.notIncluded.optional.activities"
    ]
  },
  "ajora-twin-waterfalls": {
    id: "ajora-twin-waterfalls",
    title: "home.ajora.twin.waterfalls",
    image: "https://images.pexels.com/photos/1271619/pexels-photo-1271619.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop",
    price: "$280",
    duration: "5 Days",
    rating: 4.8,
    location: "Wolaita, Ethiopia",
    description: "home.tour.ajora.desc",
    highlights: [
      "home.tour.highlights.waterfall.views",
      "home.tour.highlights.swimming",
      "home.tour.highlights.nature.walk",
      "home.tour.highlights.local.community"
    ],
    included: [
      "home.tour.included.accommodation",
      "home.tour.included.meals",
      "home.tour.included.guide",
      "home.tour.included.transportation",
      "home.tour.included.entrance.fees"
    ],
    notIncluded: [
      "home.tour.notIncluded.personal.expenses",
      "home.tour.notIncluded.travel.insurance",
      "home.tour.notIncluded.alcoholic.beverages"
    ]
  },
  "abune-tekle-haymanot-monastery": {
    id: "abune-tekle-haymanot-monastery",
    title: "home.abune.tekle.haymanot.monastery",
    image: "https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop",
    price: "$120",
    duration: "2 Days",
    rating: 4.9,
    location: "Wolaita, Ethiopia",
    description: "home.tour.monastery.desc",
    highlights: [
      "home.tour.highlights.cultural.heritage",
      "home.tour.highlights.religious.history",
      "home.tour.highlights.scenic.surroundings",
      "home.tour.highlights.local.guides"
    ],
    included: [
      "home.tour.included.accommodation",
      "home.tour.included.meals",
      "home.tour.included.guide",
      "home.tour.included.transportation"
    ],
    notIncluded: [
      "home.tour.notIncluded.personal.expenses",
      "home.tour.notIncluded.donations",
      "home.tour.notIncluded.souvenirs"
    ]
  }
};

export const TourDetail: React.FC = () => {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  
  // Find the tour based on the ID parameter
  const tour = tourData[id as keyof typeof tourData];
  
  if (!tour) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('tour.notFound')}</h2>
          <Link to="/tours" className="text-amber-600 hover:text-amber-700">
            {t('tour.backToTours')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="relative h-96 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${tour.image})` }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-end pb-8">
          <Link 
            to="/"
            className="inline-flex items-center text-white mb-6 hover:text-amber-200 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            {t('tour.homePage')}
          </Link>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            {t(tour.title)}
          </motion.h1>
          
          <div className="flex flex-wrap items-center gap-6 text-white">
            <div className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              <span>{tour.location}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              <span>{tour.duration}</span>
            </div>
            <div className="flex items-center">
              <Star className="h-5 w-5 mr-2 text-yellow-400 fill-current" />
              <span>{tour.rating}</span>
            </div>
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              <span className="text-2xl font-bold">{tour.price}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-12">
          {/* Left Column - Tour Details */}
          <div className="md:col-span-3">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-md p-6 mb-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('tour.overview')}</h2>
              <p className="text-gray-700 leading-relaxed">
                {t(tour.description)}
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow-md p-6 mb-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('tour.highlights')}</h2>
              <ul className="grid md:grid-cols-2 gap-3">
                {tour.highlights.map((highlight, index) => (
                  <li key={index} className="flex items-start">
                    <div className="bg-amber-100 p-1 rounded-full mr-3 mt-1">
                      <Heart className="h-4 w-4 text-amber-600" />
                    </div>
                    <span className="text-gray-700">{t(highlight)}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4 text-xl">{t('tour.included')}</h3>
                  <ul className="space-y-3">
                    {tour.included.map((item, index) => (
                      <li key={index} className="text-gray-700 flex items-center">
                        <div className="bg-green-100 p-1 rounded-full mr-3">
                          <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        {t(item)}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4 text-xl">{t('tour.notIncluded')}</h3>
                  <ul className="space-y-3">
                    {tour.notIncluded.map((item, index) => (
                      <li key={index} className="text-gray-700 flex items-center">
                        <div className="bg-red-100 p-1 rounded-full mr-3">
                          <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                        {t(item)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
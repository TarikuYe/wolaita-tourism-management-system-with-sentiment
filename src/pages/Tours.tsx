import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Star, Clock, Users, MapPin, Eye, Compass, Sparkles } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useToursPaginated } from '../hooks/useFirestore';
import { Tour } from '../types';
import { motion } from 'framer-motion';
import { FavoriteButton } from '../components/FavoriteButton';
import { useNavigate } from 'react-router-dom';

export const Tours: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { tours, loading, hasMore, fetchMore } = useToursPaginated();
  const [filteredTours, setFilteredTours] = useState<Tour[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { value: 'all', label: t('tours.filter.all') },
    { value: 'cultural', label: t('tours.filter.cultural') },
    { value: 'adventure', label: t('tours.filter.adventure') },
    { value: 'religious', label: t('tours.filter.religious') },
    { value: 'nature', label: t('tours.filter.nature') },
    { value: 'historical', label: t('tours.filter.historical') },
  ];

  const filterAndSetTours = useCallback(() => {
    let filtered = tours.filter((tour: Tour) => tour.available !== false);

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((tour: Tour) => 
        tour.category?.toLowerCase() === selectedCategory
      );
    }

    if (searchTerm) {
      filtered = filtered.filter((tour: Tour) =>
        tour.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tour.titleAm?.includes(searchTerm) ||
        tour.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tour.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTours(filtered);
  }, [tours, selectedCategory, searchTerm]);

  useEffect(() => {
    filterAndSetTours();
  }, [filterAndSetTours]);

  return (
    <div className="min-h-screen bg-[#faf8f5] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 text-orange-600 text-xs font-semibold tracking-wider uppercase mb-4 shadow-xs">
            <Compass className="w-3.5 h-3.5 text-orange-500" />
            <span>{language === 'en' ? 'EXPLORE GUIDED ADVENTURES' : 'የተመረጡ አስደናቂ ጉዞዎች'}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            {language === 'en' ? (
              <>Explore <span className="text-orange-500">Our Tours</span></>
            ) : (
              <span className="text-slate-900">{t('tours.title')}</span>
            )}
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {language === 'en' 
              ? 'Discover authentic experiences and create unforgettable memories in the heart of Ethiopia'
              : 'በኢትዮጵያ ልብ ውስጥ እውነተኛ ተሞክሮዎችን ያግኙ እና ከማይረሳ ትዝታዎችን ይፍጠሩ'
            }
          </p>
        </motion.div>

        {/* Search and Filters Bar */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 sm:p-5 mb-10 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
            <input
              type="text"
              placeholder={t('common.search') as string}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm font-medium transition-colors"
            />
          </div>

          <div className="flex items-center space-x-3">
            <Filter className="text-slate-400 h-5 w-5" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && tours.length === 0 ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-slate-600 font-medium">Loading tours...</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredTours.map((tour: Tour, index) => (
                <motion.div
                  key={tour.id}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.05 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="group relative bg-white rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col"
                >
                  <div className="absolute top-4 right-4 z-10">
                    <FavoriteButton tourId={tour.id} />
                  </div>
                  
                  <div
                    className="h-52 bg-cover bg-center relative overflow-hidden"
                    style={{ 
                      backgroundImage: `url(${tour.images?.[0] || '/images/Attractions/Ajoo.jpg'})` 
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
                    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                      <div className="flex items-center space-x-1 text-xs font-bold text-white bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full">
                        <MapPin className="h-3.5 w-3.5 text-orange-400" />
                        <span>{language === 'en' ? tour.location : tour.locationAm || tour.location}</span>
                      </div>
                      <div className="flex items-center space-x-1 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-orange-600 shadow-xs">
                        <Star className="h-3 w-3 fill-orange-500 text-orange-500" />
                        <span>{tour.rating || 4.8}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-orange-600 transition-colors">
                        {language === 'en' ? tour.title : tour.titleAm || tour.title}
                      </h3>
                      <p className="text-slate-600 text-sm mb-5 line-clamp-2 leading-relaxed">
                        {language === 'en' ? tour.description : tour.descriptionAm || tour.description}
                      </p>
                    </div>

                    <div className="border-t border-slate-100 pt-4 mt-auto">
                      <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500 mb-4">
                        <div className="flex items-center space-x-1.5 font-medium">
                          <Clock className="h-4 w-4 text-orange-500" />
                          <span>{tour.duration} {tour.duration === 1 ? 'Day' : 'Days'}</span>
                        </div>
                        <div className="flex items-center space-x-1.5 font-medium">
                          <Users className="h-4 w-4 text-orange-500" />
                          <span>Max {tour.maxParticipants}</span>
                        </div>
                      </div>

                      <button 
                        onClick={() => navigate(`/tours/${tour.id}`)}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-xl font-semibold transition-all shadow-xs hover:shadow-md flex items-center justify-center gap-2 text-sm"
                      >
                        <Eye className="h-4 w-4" />
                        <span>{language === 'en' ? 'View Details' : 'ዝርዝሮችን ይመልከቱ'}</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {hasMore && (
              <div className="text-center mt-12">
                <button
                  onClick={fetchMore}
                  disabled={loading}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3.5 rounded-xl font-semibold transition-all shadow-xs hover:shadow-md disabled:bg-slate-300"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}

            {filteredTours.length === 0 && !loading && (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-xs mt-8">
                <p className="text-slate-500 text-base font-medium">
                  {language === 'en' 
                    ? 'No tours found matching your criteria.'
                    : 'ከመመዘኛዎችዎ ጋር የሚመሳሰል ጉዞ አልተገኘም።'
                  }
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

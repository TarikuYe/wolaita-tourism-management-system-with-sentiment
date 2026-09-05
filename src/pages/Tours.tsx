import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Star, Clock, Users, MapPin, Eye } from 'lucide-react';
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('tours.title')}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {language === 'en' 
              ? 'Discover authentic experiences and create unforgettable memories in the heart of Ethiopia'
              : 'በኢትዮጵያ ልብ ውስጥ እውነተኛ ተሞክሮዎችን ያግኙ እና ከማይረሳ ትዝታዎችን ይፍጠሩ'
            }
          </p>
        </div>

        <div className="mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder={t('common.search') as string}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-4">
            <Filter className="text-gray-400 h-5 w-5" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading tours...</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredTours.map((tour: Tour, index) => (
                <motion.div
                  key={tour.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="relative bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="absolute top-4 right-4 z-10">
                    <FavoriteButton tourId={tour.id} />
                  </div>
                  
                  <div
                    className="h-48 bg-cover bg-center"
                    style={{ 
                      backgroundImage: `url(${tour.images?.[0] || 'https://images.pexels.com/photos/2356045/pexels-photo-2356045.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop'})` 
                    }}
                  />

                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {language === 'en' ? tour.title : tour.titleAm || tour.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {language === 'en' ? tour.description : tour.descriptionAm || tour.description}
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{language === 'en' ? tour.location : tour.locationAm || tour.location}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span>{tour.rating || 4.5} ({tour.reviewsCount || 0})</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{tour.duration} {tour.duration === 1 ? 'Day' : 'Days'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>Max {tour.maxParticipants}</span>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => navigate(`/tours/${tour.id}`)}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center justify-center mt-4"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {language === 'en' ? 'View Details' : 'ዝርዝሮችን ይመልከቱ'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={fetchMore}
                  disabled={loading}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-md font-medium transition-colors disabled:bg-gray-400"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}

            {filteredTours.length === 0 && !loading && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
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

// src/pages/FavoritesPage.tsx
import React from 'react';
import { Heart, MapPin, Clock, DollarSign, Star, Trash2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../hooks/useFirestore';
import { useTours } from '../hooks/useFirestore';
import { motion } from 'framer-motion';

interface Tour {
  id: string;
  title: string;
  location: string;
  price: number;
  duration: number;
  category: string;
  rating?: number;
  images: string[];
}

export const FavoritesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { data: favorites, loading: favoritesLoading, deleteDocument } = useFavorites(currentUser?.id || '');
  console.log("Favorites data:", favorites);
  const { data: allTours, loading: toursLoading } = useTours();

  // Map favorite tourIds for filtering
  const favoriteTourIds = favorites.map((fav: any) => fav.tourId);
  const favoriteTours = allTours.filter((tour: Tour) => favoriteTourIds.includes(tour.id));

  const handleRemoveFavorite = async (favoriteId: string) => {
    if (!window.confirm('Remove this tour from your favorites?')) return;
    try {
      await deleteDocument('favorites', favoriteId); // This uses the hook's delete method
    } catch (err) {
      console.error('Failed to remove favorite:', err);
    }
  };

  if (favoritesLoading || toursLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          to="/dashboard"
          className="flex items-center text-amber-600 hover:text-amber-700 font-medium mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Favorite Tours</h1>
          <p className="text-gray-600 mt-2">
            {favoriteTours.length} tour{favoriteTours.length !== 1 ? 's' : ''} you've saved
          </p>
        </div>

        {/* Favorites Grid */}
        {favoriteTours.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteTours.map((tour: Tour) => {
              const favorite = favorites.find((f: any) => f.tourId === tour.id);
              return (
                <motion.div
                  key={tour.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative">
                    <img
                      src={tour.images[0] || 'https://placehold.co/400x200/cccccc/999999?text=No+Image'}
                      alt={tour.title}
                      className="w-full h-48 object-cover"
                    />
                    <button
                      onClick={() => favorite && handleRemoveFavorite(favorite.id)}
                      className="absolute top-3 right-3 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition"
                    >
                      <Heart className="h-5 w-5 fill-current" />
                    </button>
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-gray-900">{tour.title}</h3>
                    <div className="flex items-center text-sm text-gray-500 mt-2">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{tour.location}</span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="flex items-center text-sm">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="ml-1">{tour.rating?.toFixed(1) || '4.5'}</span>
                      </span>
                      <span className="flex items-center text-sm">
                        <DollarSign className="h-4 w-4" />
                        {tour.price}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{tour.category} • {tour.duration} hours</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No favorites yet</h3>
            <p className="text-gray-500 mb-6">Start adding tours to your favorites by clicking the heart icon on tour pages.</p>
            <Link
              to="/tours"
              className="inline-flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Heart className="h-5 w-5" />
              <span>Browse Tours</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
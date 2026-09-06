import React from 'react';
import { Heart, MapPin, Clock, DollarSign, Star, Trash2, ArrowLeft, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites, useTours } from '../hooks/useFirestore';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

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
  const { data: allTours, loading: toursLoading } = useTours();

  // Map favorite tourIds for filtering
  const favoriteTourIds = favorites.map((fav: any) => fav.tourId);
  const favoriteTours = allTours.filter((tour: Tour) => favoriteTourIds.includes(tour.id));

  const handleRemoveFavorite = async (favoriteId: string, tourTitle: string) => {
    if (!window.confirm(`Remove "${tourTitle}" from your favorites?`)) return;
    try {
      await deleteDocument('favorites', favoriteId);
      toast.success('Removed from favorites!', { id: `fav-${favoriteId}` });
    } catch (err) {
      console.error('Failed to remove favorite:', err);
      toast.error('Failed to remove favorite', { id: `fav-err-${favoriteId}` });
    }
  };

  if (favoritesLoading || toursLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#faf8f5]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading your favorites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            to={currentUser?.role === 'tourist' ? '/tourist' : '/dashboard'}
            className="inline-flex items-center gap-2 text-sm font-bold text-orange-600 hover:text-orange-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 text-orange-600 text-xs font-semibold tracking-wider uppercase mb-4 shadow-xs">
            <Heart className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
            <span>Saved Experiences</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            My Favorite <span className="text-orange-500">Tours</span>
          </h1>
          <p className="mt-3 text-slate-600 text-base md:text-lg">
            {favoriteTours.length === 0 
              ? "You haven't saved any tours yet." 
              : `You have saved ${favoriteTours.length} extraordinary tour${favoriteTours.length !== 1 ? 's' : ''} to your wishlist.`}
          </p>
        </div>

        {/* Favorites Grid */}
        {favoriteTours.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {favoriteTours.map((tour: Tour, index: number) => {
              const favorite = favorites.find((f: any) => f.tourId === tour.id);
              return (
                <motion.div
                  key={tour.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className="bg-white rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col group"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                    <img
                      src={tour.images[0] || 'https://placehold.co/600x400/f3f4f6/9ca3af?text=Wolaita+Tour'}
                      alt={tour.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60"></div>
                    
                    {/* Category Pill */}
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-slate-900 text-xs font-bold rounded-full shadow-xs">
                        {tour.category || 'Adventure'}
                      </span>
                    </div>

                    {/* Remove from Favorites Button */}
                    <button
                      onClick={() => favorite && handleRemoveFavorite(favorite.id, tour.title)}
                      className="absolute top-4 right-4 bg-white/90 hover:bg-rose-500 text-rose-500 hover:text-white p-2.5 rounded-full shadow-sm transition-colors duration-200"
                      title="Remove from favorites"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    
                    {/* Price Tag */}
                    <div className="absolute bottom-4 right-4 bg-orange-500 text-white px-3 py-1 rounded-xl text-sm font-bold shadow-xs">
                      ${tour.price} <span className="text-xs font-normal opacity-90">/ person</span>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center text-xs font-semibold text-slate-500">
                          <MapPin className="h-3.5 w-3.5 text-orange-500 mr-1 shrink-0" />
                          <span>{tour.location}</span>
                        </div>
                        <div className="flex items-center text-xs font-bold text-amber-500">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 mr-1" />
                          <span>{tour.rating ? tour.rating.toFixed(1) : '4.8'}</span>
                        </div>
                      </div>

                      <h3 className="text-xl font-bold text-slate-900 line-clamp-1 group-hover:text-orange-600 transition-colors">
                        {tour.title}
                      </h3>

                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center">
                          <Clock className="h-3.5 w-3.5 text-slate-400 mr-1" />
                          <span>{tour.duration} {tour.duration === 1 ? 'day' : 'days'}</span>
                        </div>
                        <div className="flex items-center">
                          <Compass className="h-3.5 w-3.5 text-slate-400 mr-1" />
                          <span>Guided Experience</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
                      <Link
                        to={`/tours/${tour.id}`}
                        className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-center font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-xs hover:shadow-md"
                      >
                        View & Book Tour
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="max-w-md mx-auto text-center py-16 px-6 bg-white rounded-3xl border border-dashed border-slate-200 shadow-xs">
            <div className="w-16 h-16 bg-orange-50 border border-orange-100 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8 text-orange-400" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">No Saved Tours Yet</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Explore our curated tours around Wolaita and tap the heart icon on any tour to save it for later.
            </p>
            <Link
              to="/tours"
              className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-xs hover:shadow-md"
            >
              <Compass className="h-4 w-4" />
              <span>Explore All Tours</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
// src/components/FavoriteButton.tsx
import React from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../hooks/useFirestore';
import { Timestamp, addDoc, collection } from 'firebase/firestore';
import { db } from '../config/firebase';
import toast from 'react-hot-toast';

interface FavoriteButtonProps {
  tourId: string;
  size?: number;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({ tourId, size = 5 }) => { // Corrected default size
  const { currentUser } = useAuth();
  const { data: favorites, deleteDocument } = useFavorites(currentUser ? currentUser.id : 'null');

  if (!currentUser) {
    return null;
  }

  const isFavorited = favorites.some((fav: any) => fav.tourId === tourId);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser || !currentUser.id) {
        toast.error('You must be logged in to add favorites.', { id: 'fav-auth-error' });
        return;
    }

    try {
      if (isFavorited) {
        const favorite = favorites.find((fav: any) => fav.tourId === tourId);
        if (favorite) {
          await deleteDocument('favorites', favorite.id);
          toast.success('Removed from favorites!', { id: `fav-${tourId}` });
        }
      } else {
        const favoriteData = {
          userId: currentUser.id,
          tourId,
          createdAt: Timestamp.now(),
        };
        await addDoc(collection(db, 'favorites'), favoriteData);
        toast.success('Added to favorites!', { id: `fav-${tourId}` });
      }
    } catch (error) {
        console.error("Error toggling favorite:", error);
        toast.error('Failed to update favorites.', { id: `fav-err-${tourId}` });
    }
  };

  return (
    <button
      onClick={toggleFavorite}
      className={`absolute top-3 right-3 p-2 rounded-full transition-colors z-10 ${ // Added z-10
        isFavorited ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:text-red-500'
      }`}
      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart className={`h-${size} w-${size} fill-current`} />
    </button>
  );
};

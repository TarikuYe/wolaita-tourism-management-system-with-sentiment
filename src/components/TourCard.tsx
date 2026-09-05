// src/components/TourCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, DollarSign } from 'lucide-react';
import { FavoriteButton } from './FavoriteButton';
import { Tour } from '../types';

interface TourCardProps {
  tour: Tour;
}

export const TourCard: React.FC<TourCardProps> = ({ tour }) => {
  return (
    // The container is now a div, which allows for sibling elements.
    // It's set to relative so the absolutely positioned button is anchored to it.
    <div className="relative bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
      
      {/* FavoriteButton is now a direct child of the container, NOT the Link. */}
      {/* This ensures its clicks are handled separately. */}
      <FavoriteButton tourId={tour.id} />

      <Link to={`/tours/${tour.id}`} className="block">
        <div className="relative">
          <img
            src={tour.images[0] || 'https://placehold.co/400x250/cccccc/999999?text=No+Image'}
            alt={tour.title}
            className="w-full h-48 object-cover"
          />
        </div>
        <div className="p-5">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 h-14">
            {tour.title}
          </h3>
          <div className="flex items-center mt-2 text-sm text-gray-500">
            <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="truncate">{tour.location}</span>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="ml-1 text-sm">{tour.rating?.toFixed(1) || '4.5'}</span>
            </div>
            <div className="flex items-center">
              <DollarSign className="h-4 w-4" />
              <span className="font-medium">{tour.price}</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {tour.duration} day{tour.duration > 1 ? 's' : ''}
          </p>
        </div>
      </Link>
    </div>
  );
};

import React from 'react';
import { X, MapPin, Clock, Users, DollarSign, Star, Calendar, Tag, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TourDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tour: any;
}

export const TourDetailsModal: React.FC<TourDetailsModalProps> = ({ isOpen, onClose, tour }) => {
  if (!tour) return null;

  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99990] overflow-y-auto" onKeyDown={handleKeyDown}>
        <div 
          className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0"
          onClick={handleBackdropClick}
        >
          {/* Background overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 transition-opacity bg-slate-950/60 backdrop-blur-xs z-[99991]"
            aria-hidden="true"
          />

          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
            &#8203;
          </span>

          {/* Modal panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative inline-block w-full max-w-4xl p-6 sm:p-8 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-3xl border border-slate-100 z-[99995]"
            onClick={handleModalContentClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tour-details-modal-title"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-xs">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 id="tour-details-modal-title" className="text-xl font-extrabold text-slate-900 tracking-tight">
                    Tour Experience Details
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Explore itinerary & specifics</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-100"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Tour Image & Stats */}
                <div className="space-y-4">
                  <div
                    className="h-64 bg-cover bg-center rounded-2xl shadow-xs border border-slate-100 relative overflow-hidden"
                    style={{ 
                      backgroundImage: `url(${tour.image || 'https://images.pexels.com/photos/2356045/pexels-photo-2356045.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop'})` 
                    }}
                  >
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-extrabold text-orange-600 shadow-xs border border-orange-100">
                      ${tour.price} / person
                    </div>
                  </div>
                  
                  {/* Tour Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
                      <div className="flex items-center space-x-1.5 text-slate-400 mb-1">
                        <Clock className="h-3.5 w-3.5 text-orange-500" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">Duration</span>
                      </div>
                      <p className="text-sm font-extrabold text-slate-900">{tour.duration} {tour.duration === 1 ? 'day' : 'days'}</p>
                    </div>
                    
                    <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
                      <div className="flex items-center space-x-1.5 text-slate-400 mb-1">
                        <Users className="h-3.5 w-3.5 text-orange-500" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">Max Group</span>
                      </div>
                      <p className="text-sm font-extrabold text-slate-900">{tour.maxParticipants || 15} people</p>
                    </div>
                    
                    <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
                      <div className="flex items-center space-x-1.5 text-slate-400 mb-1">
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">Rating</span>
                      </div>
                      <p className="text-sm font-extrabold text-slate-900">{tour.rating ? `${tour.rating} / 5` : '4.9 / 5'}</p>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
                      <div className="flex items-center space-x-1.5 text-slate-400 mb-1">
                        <Tag className="h-3.5 w-3.5 text-orange-500" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">Category</span>
                      </div>
                      <p className="text-sm font-extrabold text-slate-900 capitalize">{tour.category || 'Cultural'}</p>
                    </div>
                  </div>
                </div>

                {/* Tour Information */}
                <div className="space-y-5 text-xs">
                  <div>
                    <h4 className="text-lg font-extrabold text-slate-900 leading-snug">{tour.title}</h4>
                    {tour.titleAm && (
                      <p className="text-slate-500 mt-0.5">{tour.titleAm}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-50 text-orange-700 border border-orange-200/70 font-bold">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{tour.location}</span>
                    </span>
                    {tour.difficulty && (
                      <span className="inline-flex items-center px-3 py-1 rounded-xl bg-slate-100 text-slate-700 font-bold capitalize">
                        {tour.difficulty}
                      </span>
                    )}
                    {tour.agencyName && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/70 font-bold">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>{tour.agencyName}</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <h5 className="font-bold text-slate-900 uppercase tracking-wider mb-1.5">Description</h5>
                    <p className="text-slate-600 leading-relaxed">{tour.description}</p>
                  </div>

                  {(tour.highlights && tour.highlights.length > 0) && (
                    <div>
                      <h5 className="font-bold text-slate-900 uppercase tracking-wider mb-2">Highlights</h5>
                      <ul className="space-y-1.5">
                        {tour.highlights.map((highlight: string, index: number) => (
                          <li key={index} className="text-slate-700 flex items-start space-x-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-orange-50/60 border border-orange-200/70 rounded-2xl p-4 space-y-1.5">
                    <h5 className="font-bold text-orange-950 uppercase tracking-wider">Booking Status</h5>
                    <p className="text-orange-900">
                      Availability: <strong className="text-orange-950">{tour.available !== false ? 'Instant Booking Available' : 'On Request'}</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end pt-6 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all text-xs uppercase tracking-wider shadow-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};
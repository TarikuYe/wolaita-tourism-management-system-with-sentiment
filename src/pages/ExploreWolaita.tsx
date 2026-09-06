import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Plane,
  Bus,
  Users,
  CloudSun,
  Languages,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Compass,
  Sparkles,
  BookOpen,
  MapPin
} from 'lucide-react';
import { motion } from 'framer-motion';

const ExploreWolaita: React.FC = () => {
  const { t, language } = useLanguage();

  const guideSections = [
    {
      icon: <Plane className="w-6 h-6 text-orange-600" />,
      bgIcon: 'bg-orange-100/70 border border-orange-200/60',
      title: t('explore.tourGuide.air'),
      text: t('explore.tourGuide.airText'),
    },
    {
      icon: <Bus className="w-6 h-6 text-blue-600" />,
      bgIcon: 'bg-blue-100/70 border border-blue-200/60',
      title: t('explore.tourGuide.road'),
      text: t('explore.tourGuide.roadText'),
    },
    {
      icon: <Users className="w-6 h-6 text-emerald-600" />,
      bgIcon: 'bg-emerald-100/70 border border-emerald-200/60',
      title: t('explore.tourGuide.population'),
      text: t('explore.tourGuide.populationText'),
    },
    {
      icon: <CloudSun className="w-6 h-6 text-amber-600" />,
      bgIcon: 'bg-amber-100/70 border border-amber-200/60',
      title: t('explore.tourGuide.weather'),
      text: t('explore.tourGuide.weatherText'),
    },
    {
      icon: <Languages className="w-6 h-6 text-purple-600" />,
      bgIcon: 'bg-purple-100/70 border border-purple-200/60',
      title: t('explore.tourGuide.language'),
      text: t('explore.tourGuide.languageText'),
    },
  ];

  const galleryImages = [
    {
      src: '/images/Attractions/Ajora.jpg',
      title: t('explore.attractions.ajoraFalls'),
      description: t('explore.attractions.ajoraFallsDesc')
    },
    {
      src: '/images/Attractions/AjoraTwin.jpg',
      title: t('explore.attractions.ajoraTwinFalls'),
      description: t('explore.attractions.ajoraTwinFallsDesc')
    },
    {
      src: '/images/Attractions/GodBridge.jpg',
      title: t('explore.attractions.godBridge'),
      description: t('explore.attractions.godBridgeDesc')
    },
    {
      src: '/images/Attractions/Damot.jpg',
      title: t('explore.attractions.damotMountain'),
      description: t('explore.attractions.damotMountainDesc')
    },
    {
      src: '/images/Attractions/Ajoo.jpg',
      title: t('explore.attractions.otherAttraction'),
      description: t('explore.attractions.otherAttractionDesc')
    },
  ];

  // Slider state and refs
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset timeout when index or autoplay changes
  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  useEffect(() => {
    resetTimeout();

    if (isPlaying) {
      timeoutRef.current = setTimeout(() => {
        setCurrentIndex((prevIndex) =>
          prevIndex === galleryImages.length - 1 ? 0 : prevIndex + 1
        );
      }, 5000);
    }

    return () => {
      resetTimeout();
    };
  }, [currentIndex, isPlaying, galleryImages.length]);

  const goToPrevious = () => {
    setIsPlaying(false);
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? galleryImages.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setIsPlaying(false);
    setCurrentIndex((prevIndex) =>
      prevIndex === galleryImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToSlide = (index: number) => {
    setIsPlaying(false);
    setCurrentIndex(index);
  };

  const toggleAutoplay = () => {
    setIsPlaying(!isPlaying);
  };

  // Get the previous and next indices for side images
  const getSideImageIndex = (offset: number) => {
    let index = currentIndex + offset;
    if (index < 0) index = galleryImages.length + index;
    if (index >= galleryImages.length) index = index - galleryImages.length;
    return index;
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 text-orange-600 text-xs font-semibold tracking-wider uppercase mb-4 shadow-xs">
            <Compass className="w-3.5 h-3.5 text-orange-500" />
            <span>{language === 'en' ? 'REGIONAL GUIDE & ATTRACTIONS' : 'የወላይታ ክልላዊ መመሪያ'}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            {language === 'en' ? (
              <>Explore <span className="text-orange-500">Wolaita</span></>
            ) : (
              <span>{t('explore.title')}</span>
            )}
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {language === 'en'
              ? 'Discover the rich heritage, majestic natural landmarks, and practical travel guidance for Wolaita Zone.'
              : 'የወላይታ ዞን ታላቅ ታሪክ፣ የተፈጥሮ ውበቶች እና የጉዞ መረጃዎችን እዚህ ያግኙ።'}
          </p>
        </motion.div>

        {/* 1. Introduction and History */}
        <motion.section
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-3xl border border-slate-100 shadow-xs p-8 sm:p-12 mb-8 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500" />
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 text-orange-600 text-xs font-semibold tracking-wider uppercase mb-4 shadow-xs">
            <BookOpen className="w-3.5 h-3.5 text-orange-500" />
            <span>HERITAGE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-6">
            {t('explore.introTitle')}
          </h2>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed whitespace-pre-line text-justify">
            {t('explore.introText')}
          </p>
        </motion.section>

        {/* 2. Tour Guide Section */}
        <motion.section
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-3xl border border-slate-100 shadow-xs p-8 sm:p-12 mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 text-orange-600 text-xs font-semibold tracking-wider uppercase mb-4 shadow-xs">
            <Compass className="w-3.5 h-3.5 text-orange-500" />
            <span>TRAVEL ESSENTIALS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-8">
            {t('explore.tourGuide.title')}
          </h2>
          <div className="grid gap-5">
            {guideSections.map((section, index) => (
              <div 
                key={index} 
                className="bg-[#fafafa] hover:bg-white p-6 rounded-2xl border border-slate-100 hover:border-amber-200/80 transition-all duration-300 flex items-start gap-4 shadow-xs"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${section.bgIcon} shadow-xs`}>
                  {section.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    {section.title}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                    {section.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* 3. Attraction Sites Highlight */}
        <motion.section
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-3xl border border-slate-100 shadow-xs p-8 sm:p-12 mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 text-orange-600 text-xs font-semibold tracking-wider uppercase mb-4 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            <span>NATURAL & SACRED WONDERS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4">
            {t('explore.attractionsTitle')}
          </h2>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            {t('explore.attractionsText')}
          </p>
        </motion.section>

        {/* 4. Modern Carousel Slider with Side Previews */}
        <motion.section
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-3xl border border-slate-100 shadow-xs p-8 sm:p-12"
        >
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2 text-center">
            {t('explore.galleryTitle')}
          </h2>
          <p className="text-slate-500 text-sm sm:text-base text-center mb-8 max-w-xl mx-auto">
            {t('explore.galleryText')}
          </p>

          <div className="relative w-full h-[60vh] sm:h-[70vh] overflow-hidden rounded-3xl">
            {/* Carousel container */}
            <div className="flex items-center justify-center h-full">
              
              {/* Left side image */}
              <motion.div 
                className="relative h-4/5 w-1/5 mx-2 overflow-hidden rounded-2xl opacity-60 hover:opacity-80 cursor-pointer shadow-xs hidden sm:block"
                onClick={() => goToSlide(getSideImageIndex(-1))}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <img
                  src={galleryImages[getSideImageIndex(-1)].src}
                  alt={String(galleryImages[getSideImageIndex(-1)].title)}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
              </motion.div>

              {/* Main center image */}
              <motion.div 
                key={currentIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="relative h-full w-full sm:w-3/5 sm:mx-4 overflow-hidden rounded-2xl sm:rounded-3xl shadow-lg"
              >
                <img
                  src={galleryImages[currentIndex].src}
                  alt={String(galleryImages[currentIndex].title)}
                  className="w-full h-full object-cover"
                />
                {/* Image overlay with information */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950/90 via-black/50 to-transparent p-6 sm:p-8 text-white">
                  <h3 className="text-xl sm:text-2xl font-bold mb-2 text-white">
                    {galleryImages[currentIndex].title}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-200 leading-relaxed line-clamp-3">
                    {galleryImages[currentIndex].description}
                  </p>
                </div>
              </motion.div>

              {/* Right side image */}
              <motion.div 
                className="relative h-4/5 w-1/5 mx-2 overflow-hidden rounded-2xl opacity-60 hover:opacity-80 cursor-pointer shadow-xs hidden sm:block"
                onClick={() => goToSlide(getSideImageIndex(1))}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <img
                  src={galleryImages[getSideImageIndex(1)].src}
                  alt={String(galleryImages[getSideImageIndex(1)].title)}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-black/40 to-transparent" />
              </motion.div>
            </div>

            {/* Navigation arrows */}
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-3 rounded-full backdrop-blur-md transition-all z-10 shadow-sm"
              aria-label="Previous image"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-3 rounded-full backdrop-blur-md transition-all z-10 shadow-sm"
              aria-label="Next image"
            >
              <ChevronRight size={24} />
            </button>

            {/* Play/Pause button */}
            <button
              onClick={toggleAutoplay}
              className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white p-2.5 rounded-full backdrop-blur-md transition-all z-10 shadow-sm"
              aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>

            {/* Dots indicator */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
              {galleryImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? 'bg-orange-500 w-8'
                      : 'bg-white/60 hover:bg-white/90 w-2.5'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Slide counter */}
            <div className="absolute top-4 left-4 bg-black/40 text-white px-3 py-1 rounded-full backdrop-blur-md text-xs font-semibold z-10">
              {currentIndex + 1} / {galleryImages.length}
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default ExploreWolaita;
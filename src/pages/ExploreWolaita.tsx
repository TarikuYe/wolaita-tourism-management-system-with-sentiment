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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ExploreWolaita: React.FC = () => {
  const { t } = useLanguage();

  const guideSections = [
    {
      icon: <Plane className="text-amber-600 mt-1 " size={50} />,
      title: t('explore.tourGuide.air'),
      text: t('explore.tourGuide.airText'),
    },
    {
      icon: <Bus className="text-amber-600 mt-1" size={100} />,
      title: t('explore.tourGuide.road'),
      text: t('explore.tourGuide.roadText'),
    },
    {
      icon: <Users className="text-amber-600 mt-1" size={30} />,
      title: t('explore.tourGuide.population'),
      text: t('explore.tourGuide.populationText'),
    },
    {
      icon: <CloudSun className="text-amber-600 mt-1" size={70} />,
      title: t('explore.tourGuide.weather'),
      text: t('explore.tourGuide.weatherText'),
    },
    {
      icon: <Languages className="text-amber-600 mt-1" size={70} />,
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
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
          {t('explore.title')}
        </h1>

        {/* Introduction and History */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            {t('explore.introTitle')}
          </h2>
          <p className="text-gray-700 leading-relaxed text-justify">
            {t('explore.introText')}
          </p>
        </section>

        {/* Tour Guide */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            {t('explore.tourGuide.title')}
          </h2>
          <div className="grid gap-8 md:grid-cols-1">
            {guideSections.map((section, index) => (
              <div key={index} className="flex items-start gap-4">
                {section.icon}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {section.title}
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {section.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Attraction Sites */}
        <section className="mt-16">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            {t('explore.attractionsTitle')}
          </h2>
          <p className="text-gray-700 leading-relaxed">
            {t('explore.attractionsText')}
          </p>
        </section>

        {/* Modern Carousel Slider with Side Previews */}
        <section className="mt-16">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2 text-center">
            {t('explore.galleryTitle')}
          </h2>
          <p className="text-gray-600 text-center mb-6">
            {t('explore.galleryText')}
          </p>

          <div className="relative w-full h-[75vh] overflow-hidden">
            {/* Carousel container */}
            <div className="flex items-center justify-center h-full">
              
              {/* Left side image */}
              <motion.div 
                className="relative h-4/5 w-1/5 mx-2 overflow-hidden rounded-lg opacity-70 cursor-pointer"
                onClick={() => goToSlide(getSideImageIndex(-1))}
                whileHover={{ opacity: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <img
                  src={galleryImages[getSideImageIndex(-1)].src}
                  alt={String(galleryImages[getSideImageIndex(-1)].title)}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
              </motion.div>

              {/* Main center image */}
              <motion.div 
                key={currentIndex}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5 }}
                className="relative h-full w-3/5 mx-4 overflow-hidden rounded-2xl shadow-xl"
              >
                <img
                  src={galleryImages[currentIndex].src}
                  alt={String(galleryImages[currentIndex].title)}
                  className="w-full h-full object-cover"
                />
                {/* Image overlay with information */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
                  <h3 className="text-2xl font-bold mb-2">
                    {galleryImages[currentIndex].title}
                  </h3>
                  <p className="text-lg">
                    {galleryImages[currentIndex].description}
                  </p>
                </div>
              </motion.div>

              {/* Right side image */}
              <motion.div 
                className="relative h-4/5 w-1/5 mx-2 overflow-hidden rounded-lg opacity-70 cursor-pointer"
                onClick={() => goToSlide(getSideImageIndex(1))}
                whileHover={{ opacity: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <img
                  src={galleryImages[getSideImageIndex(1)].src}
                  alt={String(galleryImages[getSideImageIndex(1)].title)}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-black/30 to-transparent" />
              </motion.div>
            </div>

            {/* Navigation arrows */}
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full backdrop-blur-sm transition-all duration-300 z-10"
              aria-label="Previous image"
            >
              <ChevronLeft size={28} />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full backdrop-blur-sm transition-all duration-300 z-10"
              aria-label="Next image"
            >
              <ChevronRight size={28} />
            </button>

            {/* Play/Pause button */}
            <button
              onClick={toggleAutoplay}
              className="absolute top-4 right-4 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm transition-all duration-300 z-10"
              aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>

            {/* Dots indicator */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
              {galleryImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? 'bg-white scale-125'
                      : 'bg-white/60 hover:bg-white/80'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Slide counter */}
            <div className="absolute top-4 left-4 bg-black/30 text-white px-3 py-1 rounded-full backdrop-blur-sm z-10">
              <span className="text-sm font-medium">
                {currentIndex + 1} / {galleryImages.length}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ExploreWolaita;
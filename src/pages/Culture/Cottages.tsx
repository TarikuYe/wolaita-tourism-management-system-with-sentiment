import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const Cottages: React.FC = () => {
  const { t } = useLanguage();

  const cottages = [
    t('culture.cottages.zuufaa'),
    t('culture.cottages.dilima'),
    t('culture.cottages.gulantta'),
    t('culture.cottages.legamaa'),
  ];

  const images = [
    {
      src: '/images/culture/cottages/Gulantta.JPG',
      label: 'Zuufaa House',
    },
    {
      src: '/images/culture/cottages/Dilima.jpg',
      label: 'Dilima Meshuwaa',
    },
    {
      src: '/images/culture/cottages/Zuufaa.jpg',
      label: 'Gulantta House',
    },
    {
      src: '/images/culture/cottages/Legamaa.jpeg',
      label: 'Legamaa Meshwaa',
    },
    // {
    //   src: 'https://via.placeholder.com/1920x1080?text=Wolaita+Cottage',
    //   label: 'Wolaita Cottage',
    // },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      nextSlide();
    }, 5000); // 5 seconds
    return () => clearTimeout(timer);
  }, [currentIndex]);

  return (
    <div className="bg-white text-gray-900 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <h1 className="text-4xl font-bold mb-4">{t('culture.cottages.title')}</h1>
        <p className="text-lg text-gray-700 mb-8">{t('culture.cottages.intro')}</p>

        <ul className="list-disc list-inside text-left text-lg mb-10 space-y-2 text-gray-800">
          {cottages.map((name, index) => (
            <li key={index}>{name}</li>
          ))}
        </ul>
      </div>

      <div className="relative w-full h-[80vh] overflow-hidden">
        {/* Image Slider */}
        <AnimatePresence mode="wait">
          <motion.img
            key={images[currentIndex].src}
            src={images[currentIndex].src}
            alt={images[currentIndex].label}
            className="absolute w-full h-full object-cover rounded-xl shadow-lg"
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ duration: 1 }}
          />
        </AnimatePresence>

        {/* Caption */}
        {/* <div className="absolute bottom-6 left-0 right-0 text-center text-white text-2xl bg-black bg-opacity-50 py-2">
          {images[currentIndex].label}
        </div> */}

        {/* Navigation Arrows
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-40 hover:bg-opacity-70 text-white p-3 rounded-full"
        >
          <ArrowLeft size={24} />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-40 hover:bg-opacity-70 text-white p-3 rounded-full"
        >
          <ArrowRight size={24} />
        </button> */}
      </div>
    </div>
  );
};

export default Cottages;

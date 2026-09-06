import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

export const Cottages: React.FC = () => {
  const { t, language } = useLanguage();

  const cottageItems = [
    {
      name: t('culture.cottages.zuufaa'),
      desc: language === 'en' ? 'Conical thatched-roof dwelling constructed with bamboo and enset leaves, displaying exceptional thermal insulation.' : 'በባምቡ እና በእንሰት ቅጠል የተገነባ፣ ሙቀትን የሚጠብቅ ውብ የዙፋ ቤት።',
      image: '/images/culture/cottages/Zuufaa.jpg',
    },
    {
      name: t('culture.cottages.dilima'),
      desc: language === 'en' ? 'Spacious residential cottage characterized by complex wooden support frameworks and woven walls.' : 'ውስብስብ የእንጨት ድጋፎች እና የተሸመኑ ግድግዳዎች ያሉት የዲሊማ መሹዋ ቤት።',
      image: '/images/culture/cottages/Dilima.jpg',
    },
    {
      name: t('culture.cottages.gulantta'),
      desc: language === 'en' ? 'Iconic traditional guest and ceremonial house celebrated for its ornamental roof crest.' : 'ለእንግዶች እና ለክብረ በዓላት የሚሆን በልዩ የጣሪያ ጌጥ የታወቀ የጉላንታ ቤት።',
      image: '/images/culture/cottages/Gulantta.JPG',
    },
    {
      name: t('culture.cottages.legamaa'),
      desc: language === 'en' ? 'Fine architectural build utilized for household living, grain preservation, and community gatherings.' : 'ለቤተሰብ ኑሮ፣ ለእህል ማከማቻ እና ለማህበራዊ ስብሰባዎች የሚያገለግል የሌጋማ ቤት።',
      image: '/images/culture/cottages/Legamaa.jpeg',
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % cottageItems.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? cottageItems.length - 1 : prev - 1));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      nextSlide();
    }, 6000);
    return () => clearTimeout(timer);
  }, [currentIndex]);

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
            <Home className="w-3.5 h-3.5 text-orange-500" />
            <span>{language === 'en' ? 'INDIGENOUS ARCHITECTURE' : 'የወላይታ ባህላዊ ጎጆዎች'}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            {language === 'en' ? (
              <>Traditional <span className="text-orange-500">Cottages</span></>
            ) : (
              <span>{t('culture.cottages.title')}</span>
            )}
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {t('culture.cottages.intro')}
          </p>
        </motion.div>

        {/* 4 Cottage Types Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          {cottageItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              viewport={{ once: true }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="bg-white rounded-3xl border border-slate-100 shadow-xs hover:shadow-md p-6 sm:p-7 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100/70 border border-orange-200/60 flex items-center justify-center text-orange-600 shadow-xs">
                    <Home className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{item.name}</h3>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  {item.desc}
                </p>
              </div>
              <div className="h-44 rounded-2xl overflow-hidden border border-slate-100 shadow-xs mt-auto">
                <img src={item.image} alt={String(item.name)} className="w-full h-full object-cover" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Featured Interactive Slider */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 sm:p-8"
        >
          <div className="relative w-full h-[360px] sm:h-[460px] overflow-hidden rounded-2xl sm:rounded-3xl">
            <AnimatePresence mode="wait">
              <motion.img
                key={cottageItems[currentIndex].image}
                src={cottageItems[currentIndex].image}
                alt={String(cottageItems[currentIndex].name)}
                className="absolute inset-0 w-full h-full object-cover"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              />
            </AnimatePresence>

            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

            <div className="absolute bottom-6 left-6 right-6 text-white pointer-events-none">
              <h3 className="text-2xl font-extrabold mb-1">
                {cottageItems[currentIndex].name}
              </h3>
              <p className="text-slate-200 text-sm max-w-xl">
                {cottageItems[currentIndex].desc}
              </p>
            </div>

            {/* Navigation buttons */}
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-3 rounded-full backdrop-blur-md transition-all shadow-xs"
              aria-label="Previous"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-3 rounded-full backdrop-blur-md transition-all shadow-xs"
              aria-label="Next"
            >
              <ChevronRight size={20} />
            </button>

            {/* Dots */}
            <div className="absolute bottom-4 right-6 flex space-x-2">
              {cottageItems.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentIndex ? 'bg-orange-500 w-6' : 'bg-white/60 w-2'
                  }`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Cottages;

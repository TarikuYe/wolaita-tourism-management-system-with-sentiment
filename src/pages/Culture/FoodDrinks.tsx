import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  Utensils,
  Drumstick,
  CupSoda,
  Wine,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

const FoodDrinks: React.FC = () => {
  const { t, language } = useLanguage();

  const foodSections = [
    {
      icon: <Utensils className="text-orange-600 w-6 h-6" />,
      bgIcon: 'bg-orange-100/70 border border-orange-200/60',
      title: t('culture.food.masuka.title'),
      text: t('culture.food.masuka.text'),
      imageSrc: '/images/Foods/MasukaQuma.jpg',
      imageAlt: String(t('culture.food.masuka.title')),
    },
    {
      icon: <Drumstick className="text-amber-600 w-6 h-6" />,
      bgIcon: 'bg-amber-100/70 border border-amber-200/60',
      title: t('culture.food.malo.title'),
      text: t('culture.food.malo.text'),
      imageSrc: '/images/Foods/Malo.jpg',
      imageAlt: String(t('culture.food.malo.title')),
    },
  ];

  const drinkSections = [
    {
      icon: <CupSoda className="text-emerald-600 w-6 h-6" />,
      bgIcon: 'bg-emerald-100/70 border border-emerald-200/60',
      title: t('culture.drinks.nonAlcoholic.title'),
      text: t('culture.drinks.nonAlcoholic.text'),
      imageSrc: '/images/Foods/NonAlcoholic.jpg',
      imageAlt: String(t('culture.drinks.nonAlcoholic.title')),
    },
    {
      icon: <Wine className="text-rose-600 w-6 h-6" />,
      bgIcon: 'bg-rose-100/70 border border-rose-200/60',
      title: t('culture.drinks.alcoholic.title'),
      text: t('culture.drinks.alcoholic.text'),
      imageSrc: '/images/Foods/Alcoholic.jpg',
      imageAlt: String(t('culture.drinks.alcoholic.title')),
    },
  ];

  return (
    <div className="min-h-screen bg-[#faf8f5] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Main Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 text-orange-600 text-xs font-semibold tracking-wider uppercase mb-4 shadow-xs">
            <Utensils className="w-3.5 h-3.5 text-orange-500" />
            <span>{language === 'en' ? 'WOLAITA GASTRONOMY' : 'የወላይታ ባህላዊ ምግቦች'}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            {language === 'en' ? (
              <>Traditional <span className="text-orange-500">Food & Drinks</span></>
            ) : (
              <span>{t('culture.food.title')}</span>
            )}
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {t('culture.food.intro')}
          </p>
        </motion.div>

        {/* Food Sections */}
        <div className="space-y-8 mb-16">
          {foodSections.map(({ icon, bgIcon, title, text, imageSrc, imageAlt }, index) => (
            <motion.section
              key={index}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-xs p-8 sm:p-10 flex flex-col md:flex-row items-center gap-8"
            >
              <div className="md:w-1/2 flex flex-col justify-center">
                <div className="flex items-center gap-3.5 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgIcon} shadow-xs`}>
                    {icon}
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
                </div>
                <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                  {text}
                </p>
              </div>
              <div className="md:w-1/2 w-full flex justify-center">
                <img
                  src={imageSrc}
                  alt={imageAlt}
                  className="rounded-2xl border border-slate-100 shadow-xs w-full max-h-72 object-cover"
                />
              </div>
            </motion.section>
          ))}
        </div>

        {/* Beverages Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 text-orange-600 text-xs font-semibold tracking-wider uppercase mb-3 shadow-xs">
            <Wine className="w-3.5 h-3.5 text-orange-500" />
            <span>LOCAL BREWS & BEVERAGES</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">
            {t('culture.beveragesTitle')}
          </h2>
          <p className="text-slate-600 text-base max-w-2xl mx-auto">
            {t('culture.beveragesIntro')}
          </p>
        </motion.div>

        {/* Drink Sections */}
        <div className="space-y-8">
          {drinkSections.map(({ icon, bgIcon, title, text, imageSrc, imageAlt }, index) => (
            <motion.section
              key={index + foodSections.length}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-xs p-8 sm:p-10 flex flex-col md:flex-row-reverse items-center gap-8"
            >
              <div className="md:w-1/2 flex flex-col justify-center">
                <div className="flex items-center gap-3.5 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgIcon} shadow-xs`}>
                    {icon}
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
                </div>
                <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                  {text}
                </p>
              </div>
              <div className="md:w-1/2 w-full flex justify-center">
                <img
                  src={imageSrc}
                  alt={imageAlt}
                  className="rounded-2xl border border-slate-100 shadow-xs w-full max-h-72 object-cover"
                />
              </div>
            </motion.section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FoodDrinks;

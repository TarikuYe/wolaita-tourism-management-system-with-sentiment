import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  Utensils,
  Drumstick,
  CupSoda,
  Wine,
} from 'lucide-react';
import { motion } from 'framer-motion';

const FoodDrinks: React.FC = () => {
  const { t } = useLanguage();

  const foodSections = [
    {
      icon: <Utensils className="text-amber-600" size={50} />,
      title: t('culture.food.masuka.title'),
      text: t('culture.food.masuka.text'),
      imageSrc: '/images/Foods/MasukaQuma.jpg',
      imageAlt: t('culture.food.masuka.title'),
    },
    {
      icon: <Drumstick className="text-amber-600" size={50} />,
      title: t('culture.food.malo.title'),
      text: t('culture.food.malo.text'),
      imageSrc: '/images/Foods/Malo.jpg',
      imageAlt: t('culture.food.malo.title'),
    },
  ];

  const drinkSections = [
    {
      icon: <CupSoda className="text-amber-600" size={50} />,
      title: t('culture.drinks.nonAlcoholic.title'),
      text: t('culture.drinks.nonAlcoholic.text'),
      imageSrc: '/images/Foods/NonAlcoholic.jpg',
      imageAlt: t('culture.drinks.nonAlcoholic.title'),
    },
    {
      icon: <Wine className="text-amber-600" size={50} />,
      title: t('culture.drinks.alcoholic.title'),
      text: t('culture.drinks.alcoholic.text'),
      imageSrc: '/images/Foods/Alcoholic.jpg',
      imageAlt: t('culture.drinks.alcoholic.title'),
    },
  ];

  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-5xl mx-auto">
        {/* Main Title */}
        <h1 className="text-4xl font-bold text-gray-900 mb-6 text-center">
          {t('culture.food.title')}
        </h1>

        {/* Food Intro */}
        <p className="text-lg text-gray-700 text-center mb-12 max-w-3xl mx-auto">
          {t('culture.food.intro')}
        </p>

        {/* Food Sections */}
        {foodSections.map(({ icon, title, text, imageSrc, imageAlt }, index) => (
          <motion.section
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.2 }}
            className="mb-16"
          >
            <div className="flex items-center gap-6 mb-6">
              <div>{icon}</div>
              <div>
                <h2 className="text-3xl font-semibold text-gray-800">{title}</h2>
                <p className="text-gray-700 leading-relaxed max-w-3xl mt-2 text-justify">
                  {text}
                </p>
              </div>
            </div>
            <div className="flex justify-center">
              <img
                src={imageSrc}
                alt={imageAlt}
                className="rounded-lg shadow-md max-h-80 object-cover"
              />
            </div>
          </motion.section>
        ))}

        {/* Beverages Title */}
        <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
          {t('culture.beveragesTitle')}
        </h2>

        {/* Beverages Intro */}
        <p className="text-lg text-gray-700 text-center mb-12 max-w-3xl mx-auto">
          {t('culture.beveragesIntro')}
        </p>

        {/* Drink Sections */}
        {drinkSections.map(({ icon, title, text, imageSrc, imageAlt }, index) => (
          <motion.section
            key={index + foodSections.length}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.2 }}
            className="mb-16"
          >
            <div className="flex items-center gap-6 mb-6">
              <div>{icon}</div>
              <div>
                <h2 className="text-3xl font-semibold text-gray-800">{title}</h2>
                <p className="text-gray-700 leading-relaxed max-w-3xl mt-2 text-justify">
                  {text}
                </p>
              </div>
            </div>
            <div className="flex justify-center">
              <img
                src={imageSrc}
                alt={imageAlt}
                className="rounded-lg shadow-md max-h-80 object-cover"
              />
            </div>
          </motion.section>
        ))}
      </div>
    </div>
  );
};

export default FoodDrinks;

import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Shirt, BadgeCheck, Gem, Crown, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const Clothes: React.FC = () => {
  const { t } = useLanguage();

  const sections = [
    {
      icon: <Crown className="text-amber-600" size={50} />,
      title: t('culture.clothes.dungua.title'),
      text: t('culture.clothes.dungua.text'),
    },
    {
      icon: <BadgeCheck className="text-amber-600" size={50} />,
      title: t('culture.clothes.seere.title'),
      text: t('culture.clothes.seere.text'),
    },
    {
      icon: <Gem className="text-amber-600" size={50} />,
      title: t('culture.clothes.pattala.title'),
      text: t('culture.clothes.pattala.text'),
    },
    {
      icon: <Users className="text-amber-600" size={50} />,
      title: t('culture.clothes.gomara.title'),
      text: t('culture.clothes.gomara.text'),
    },
    {
      icon: <Shirt className="text-amber-600" size={50} />,
      title: t('culture.clothes.gutuma.title'),
      text: t('culture.clothes.gutuma.text'),
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center text-amber-700 mb-4">
        {t('culture.clothes.title')}
      </h1>
      <p className="text-lg text-gray-700 text-center mb-10">
        {t('culture.clothes.intro')}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {sections.map((section, index) => (
          <motion.div
            key={index}
            className="bg-white rounded-lg shadow-md p-6"
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center mb-4 gap-4">
              {section.icon}
              <h2 className="text-2xl font-semibold text-gray-900">{section.title}</h2>
            </div>
            <p className="text-gray-700">{section.text}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-12 bg-gray-100 p-6 rounded-lg shadow-inner">
        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          {t('culture.clothes.cosmetics.title')}
        </h2>
        <p className="text-gray-700">{t('culture.clothes.cosmetics.text')}</p>
      </div>
    </div>
  );
};

export default Clothes;

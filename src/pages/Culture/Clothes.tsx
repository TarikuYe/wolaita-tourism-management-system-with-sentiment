import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Shirt, BadgeCheck, Gem, Crown, Users, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export const Clothes: React.FC = () => {
  const { t, language } = useLanguage();

  const sections = [
    {
      icon: <Crown className="text-amber-600 w-6 h-6" />,
      bgIcon: 'bg-amber-100/70 border border-amber-200/60',
      title: t('culture.clothes.dungua.title'),
      text: t('culture.clothes.dungua.text'),
    },
    {
      icon: <BadgeCheck className="text-blue-600 w-6 h-6" />,
      bgIcon: 'bg-blue-100/70 border border-blue-200/60',
      title: t('culture.clothes.seere.title'),
      text: t('culture.clothes.seere.text'),
    },
    {
      icon: <Gem className="text-purple-600 w-6 h-6" />,
      bgIcon: 'bg-purple-100/70 border border-purple-200/60',
      title: t('culture.clothes.pattala.title'),
      text: t('culture.clothes.pattala.text'),
    },
    {
      icon: <Users className="text-rose-600 w-6 h-6" />,
      bgIcon: 'bg-rose-100/70 border border-rose-200/60',
      title: t('culture.clothes.gomara.title'),
      text: t('culture.clothes.gomara.text'),
    },
    {
      icon: <Shirt className="text-emerald-600 w-6 h-6" />,
      bgIcon: 'bg-emerald-100/70 border border-emerald-200/60',
      title: t('culture.clothes.gutuma.title'),
      text: t('culture.clothes.gutuma.text'),
    },
  ];

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
            <Shirt className="w-3.5 h-3.5 text-orange-500" />
            <span>{language === 'en' ? 'TRADITIONAL ATTIRE' : 'የወላይታ ባህላዊ አልባሳት'}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            {language === 'en' ? (
              <>Traditional <span className="text-orange-500">Clothing</span></>
            ) : (
              <span>{t('culture.clothes.title')}</span>
            )}
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {t('culture.clothes.intro')}
          </p>
        </motion.div>

        {/* Clothing Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              viewport={{ once: true }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="bg-white rounded-3xl border border-slate-100 shadow-xs hover:shadow-md p-7 sm:p-8 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3.5 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${section.bgIcon} shadow-xs`}>
                    {section.icon}
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">{section.title}</h2>
                </div>
                <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                  {section.text}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Cosmetics and Accessories Section */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-[#fef9ee] border border-amber-200/80 rounded-3xl p-8 sm:p-10 shadow-xs"
        >
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <h2 className="text-2xl font-bold text-amber-950">
              {t('culture.clothes.cosmetics.title')}
            </h2>
          </div>
          <p className="text-amber-900/80 leading-relaxed text-sm sm:text-base">
            {t('culture.clothes.cosmetics.text')}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Clothes;

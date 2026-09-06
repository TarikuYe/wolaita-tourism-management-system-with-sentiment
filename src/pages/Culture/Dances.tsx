import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Music, Sparkles } from 'lucide-react';

export const Dances: React.FC = () => {
  const { t, language } = useLanguage();

  const videos = [
    {
      title: 'Wolaita Cultural Dance - Traditional Ensemble',
      embedUrl: 'https://www.youtube.com/embed/jnfB-dbIaGY',
    },
    {
      title: 'Wolaita Festival & Celebration Dance',
      embedUrl: 'https://www.youtube.com/embed/sNqM9uyv5Hw',
    },
    {
      title: 'Wolaita Folkloric Rhythm & Movement',
      embedUrl: 'https://www.youtube.com/embed/yCnsjRuXqWU',
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
            <Music className="w-3.5 h-3.5 text-orange-500" />
            <span>{language === 'en' ? 'SACRED & SOCIAL DANCES' : 'የወላይታ ባህላዊ ዳንስ'}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            {language === 'en' ? (
              <>Traditional <span className="text-orange-500">Dances</span></>
            ) : (
              <span>{t('culture.dance.title')}</span>
            )}
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {t('culture.dance.intro')}
          </p>
        </motion.div>

        {/* Video Showcase Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {videos.map((video, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bg-white rounded-3xl border border-slate-100 shadow-xs hover:shadow-md overflow-hidden transition-all duration-300 flex flex-col"
            >
              <div className="aspect-w-16 aspect-h-9 bg-slate-950">
                <iframe
                  className="w-full h-64"
                  src={video.embedUrl}
                  title={video.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="p-6">
                <h2 className="text-lg font-bold text-slate-900">{video.title}</h2>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dances;

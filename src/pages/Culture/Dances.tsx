import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { motion } from 'framer-motion';

const Dances: React.FC = () => {
  const { t } = useLanguage();

  const videos = [
    {
      title: 'Wolaita Dance 1',
      embedUrl: 'https://www.youtube.com/embed/jnfB-dbIaGY',
    },
    {
      title: 'Wolaita Dance 2',
      embedUrl: 'https://www.youtube.com/embed/sNqM9uyv5Hw', // Replace with real video
    },
    {
      title: 'Wolaita Dance 3',
      embedUrl: 'https://www.youtube.com/embed/yCnsjRuXqWU', // Replace with real video
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-10">
          {t('culture.dance.title')}
        </h1>

        <p className="text-lg text-gray-700 mb-8 text-center">
          {t('culture.dance.intro')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {videos.map((video, index) => (
            <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="aspect-w-16 aspect-h-9">
                <iframe
                  className="w-full h-64"
                  src={video.embedUrl}
                  title={video.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-800">{video.title}</h2>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Dances;

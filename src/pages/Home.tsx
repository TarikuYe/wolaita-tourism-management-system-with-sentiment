import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, Shield, MapPin, Heart } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

export const Home: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();

  const features = [
    {
      icon: Heart,
      title: t('home.features.authentic'),
      description: t('home.features.authentic.desc'),
    },
    {
      icon: Users,
      title: t('home.features.guides'),
      description: t('home.features.guides.desc'),
    },
    {
      icon: Shield,
      title: t('home.features.safety'),
      description: t('home.features.safety.desc'),
    },
  ];

  const stats = [
    { number: '500+', labelKey: 'home.stats.travelers' },
    { number: '50+', labelKey: 'home.stats.destinations' },
    { number: '25+', labelKey: 'home.stats.guides' },
    { number: '4.9', labelKey: 'home.stats.rating' },
  ];

  // Tour data with IDs for routing
  const tours = [
    {
      id: "mochena-borago-cave",
      title: t('home.mochena.borago.cave'),
      image: '../../images/Attractions/mochena.webp',
      price: '$150',
      duration: '3 Days',
      rating: 4.9,
    },
    {
      id: "ajora-twin-waterfalls",
      title: t('home.ajora.twin.waterfalls'),
      image: '../../images/Attractions/Ajoo.jpg',
      price: '$280',
      duration: '5 Days',
      rating: 4.8,
    },
    {
      id: "abune-tekle-haymanot-monastery",
      title: t('home.abune.tekle.haymanot.monastery'),
      image: '../../images/Attractions/Abune.jpg',
      price: '$120',
      duration: '2 Days',
      rating: 4.9,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('../../../images/Attractions/Ajoo.jpg')",
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        </div>
        
        <div className="relative z-10 text-center text-white px-4 sm:px-6 lg:px-8 max-w-4xl">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-6xl font-bold mb-6"
          >
            {t('home.hero.title')}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl mb-8 text-gray-200"
          >
            {t('home.hero.subtitle')}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Link to="/explore-wolaita" className="inline-flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors">
              <span>{t('home.explore.wolaita')}</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-amber-600 mb-2">
                  {stat.number}
                </div>
                <div className="mt-2 text-lg font-medium text-gray-700">
                  {t(stat.labelKey)} 
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('home.features.title')}
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="w-16 h-16 bg-amber-100 rounded-lg flex items-center justify-center mb-6">
                  <feature.icon className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Tours Preview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('home.feature.title')}
            </h2>
            <p className="text-xl text-gray-600">
              {t('home.feature.description')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {tours.map((tour, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative rounded-lg overflow-hidden"
              >
                <div className="h-64 bg-cover bg-center" style={{ backgroundImage: `url(${tour.image})` }}>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                    <h3 className="text-xl font-semibold text-white">{tour.title}</h3>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to={currentUser ? "/tours" : "/login"}
              className="inline-flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
            >
              <span>{t('home.view.all.tours')}</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section - Only show when user is not logged in */}
      {!currentUser && (
        <section className="py-20 bg-gradient-to-r from-amber-600 to-orange-600">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                {t('home.ready.to.explore')}
              </h2>
              <p className="text-xl text-amber-100 mb-8">
                {t('home.ready.to.explore.desc')}
              </p>
              <Link
                to="/register"
                className="inline-flex items-center space-x-2 bg-white text-amber-600 hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
              >
                <span>{t('home.start.journey')}</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
            </motion.div>
          </div>
        </section>
      )}
    </div>
  );
};
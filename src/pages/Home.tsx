import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, Shield, Heart, Sparkles, Compass, Star, MapPin } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

export const Home: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();

  const features = [
    {
      icon: Heart,
      bgIcon: 'bg-rose-100/70 border border-rose-200/60 text-rose-500',
      title: t('home.features.authentic'),
      description: t('home.features.authentic.desc'),
    },
    {
      icon: Users,
      bgIcon: 'bg-amber-100/70 border border-amber-200/60 text-amber-600',
      title: t('home.features.guides'),
      description: t('home.features.guides.desc'),
    },
    {
      icon: Shield,
      bgIcon: 'bg-emerald-100/70 border border-emerald-200/60 text-emerald-600',
      title: t('home.features.safety'),
      description: t('home.features.safety.desc'),
    },
  ];

  const stats = [
    { number: '500+', labelKey: 'home.stats.travelers', bg: 'bg-[#fef9ee] border-amber-200/70 text-[#b45309]' },
    { number: '50+', labelKey: 'home.stats.destinations', bg: 'bg-[#eff6ff] border-blue-200/70 text-[#2563eb]' },
    { number: '25+', labelKey: 'home.stats.guides', bg: 'bg-[#ecfdf5] border-emerald-200/70 text-[#059669]' },
    { number: '4.9', labelKey: 'home.stats.rating', bg: 'bg-[#faf5ff] border-purple-200/70 text-[#7c3aed]' },
  ];

  // Tour data with IDs for routing
  const tours = [
    {
      id: "mochena-borago-cave",
      title: t('home.mochena.borago.cave'),
      image: '/images/Attractions/mochena.webp',
      price: '$150',
      duration: '3 Days',
      rating: 4.9,
    },
    {
      id: "ajora-twin-waterfalls",
      title: t('home.ajora.twin.waterfalls'),
      image: '/images/Attractions/Ajoo.jpg',
      price: '$280',
      duration: '5 Days',
      rating: 4.8,
    },
    {
      id: "abune-tekle-haymanot-monastery",
      title: t('home.abune.tekle.haymanot.monastery'),
      image: '/images/Attractions/Abune.jpg',
      price: '$120',
      duration: '2 Days',
      rating: 4.9,
    },
  ];

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/images/Attractions/Ajoo.jpg')",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70"></div>
        </div>
        
        <div className="relative z-10 text-center text-white px-4 sm:px-6 lg:px-8 max-w-4xl">
          {/* Top Tagline Pill */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-orange-400 text-xs font-semibold tracking-wider uppercase mb-6 shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            <span>{t('about.tagline') || "DISCOVER ETHIOPIA'S CULTURAL HEART"}</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 tracking-tight drop-shadow-sm"
          >
            {t('home.hero.title')}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg sm:text-xl md:text-2xl mb-8 text-gray-100 max-w-3xl mx-auto leading-relaxed font-normal drop-shadow-xs"
          >
            {t('home.hero.subtitle')}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <Link to="/explore-wolaita" className="inline-flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
              <span>{t('home.explore.wolaita')}</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto -mt-16 relative z-20">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`rounded-2xl p-5 sm:p-6 text-center border ${stat.bg} transition-all duration-300 hover:shadow-xs`}
              >
                <div className="text-3xl sm:text-4xl font-extrabold mb-1 tracking-tight">
                  {stat.number}
                </div>
                <div className="text-xs sm:text-sm font-medium text-slate-700">
                  {t(stat.labelKey)} 
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 sm:p-12">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 text-orange-600 text-xs font-semibold tracking-wider uppercase mb-3 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span>WHY WOLAITA</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">
              {t('home.features.title')}
            </h2>
            <p className="text-slate-500 text-base max-w-2xl mx-auto">
              {t('about.whyChooseUsSubtitle') || 'Experience Wolaita with guided expertise, deep rooted local pride, and genuine community hospitality.'}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-[#fafafa] hover:bg-white p-8 rounded-2xl border border-slate-100 hover:border-amber-200/80 shadow-xs hover:shadow-md transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${feature.bgIcon} shadow-xs`}>
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Tours Preview */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 sm:p-12">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 text-orange-600 text-xs font-semibold tracking-wider uppercase mb-3 shadow-xs">
              <Compass className="w-3.5 h-3.5 text-orange-500" />
              <span>POPULAR ITINERARIES</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">
              {t('home.feature.title')}
            </h2>
            <p className="text-slate-500 text-base max-w-2xl mx-auto">
              {t('home.feature.description')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {tours.map((tour, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group relative rounded-2xl overflow-hidden border border-slate-100 bg-[#fafafa] hover:bg-white shadow-xs hover:shadow-md transition-all duration-300 flex flex-col"
              >
                <div className="h-60 bg-cover bg-center relative overflow-hidden" style={{ backgroundImage: `url(${tour.image})` }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-orange-600 shadow-xs flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                    <span>{tour.rating}</span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-orange-300 transition-colors">
                      {tour.title}
                    </h3>
                  </div>
                </div>
                <div className="p-5 flex items-center justify-between mt-auto">
                  <div className="flex items-center space-x-2 text-sm text-slate-600">
                    <span className="font-semibold text-orange-600 text-base">{tour.price}</span>
                    <span>•</span>
                    <span>{tour.duration}</span>
                  </div>
                  <Link
                    to={currentUser ? `/tours/${tour.id}` : '/login'}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to={currentUser ? "/tours" : "/login"}
              className="inline-flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-3.5 rounded-xl text-base font-semibold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              <span>{t('home.view.all.tours')}</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section - Only show when user is not logged in */}
      {!currentUser && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-orange-500 via-amber-600 to-orange-600 rounded-3xl shadow-lg p-10 sm:p-14 text-center text-white relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute -left-10 -top-10 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>

            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative z-10 max-w-3xl mx-auto"
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
                {t('home.ready.to.explore')}
              </h2>
              <p className="text-lg sm:text-xl text-amber-50 mb-8 max-w-2xl mx-auto leading-relaxed">
                {t('home.ready.to.explore.desc')}
              </p>
              <Link
                to="/register"
                className="inline-flex items-center space-x-2 bg-white text-orange-600 hover:bg-amber-50 px-8 py-4 rounded-xl text-lg font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
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
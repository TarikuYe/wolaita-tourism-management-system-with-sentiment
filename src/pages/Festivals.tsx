import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Sparkles, PartyPopper, ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';

export interface Festival {
  id: string;
  name: string;
  nameAm: string;
  description: string;
  descriptionAm: string;
  date: string;
  location: string;
  locationAm: string;
  image: string;
  category: string;
  featured: boolean;
  relatedTours: number;
}

export const festivals: Festival[] = [
  {
    id: 'gifata-festival',
    name: 'Gifata Festival',
    nameAm: 'ጊፋታ በዓል',
    description: 'The most celebrated festival in Wolaita culture, marking the New Year with traditional dances, feasts, and community gatherings.',
    descriptionAm: 'የወላይታ ባህል ከፍተኛ በዓል ሲሆን አዲስ ዓመትን በባህላዊ ውዳቄዎች፣ ግብዣዎች እና ማህበራዊ ስብሰባዎች ያከብራል።',
    date: 'September 2024',
    location: 'Sodo Stadium & Cultural Centers',
    locationAm: 'ሶዶ ስታዲየም እና የባህል ማዕከላት',
    image: '/images/Attractions/Gifata.jpg',
    category: 'Cultural New Year',
    featured: true,
    relatedTours: 3
  },
  {
    id: 'meskel-demera',
    name: 'Meskel (Finding of the True Cross)',
    nameAm: 'መስቀል ደመራ',
    description: 'A vibrant religious and cultural celebration featuring the lighting of the massive Demera bonfire and colorful processions.',
    descriptionAm: 'የደመራ ማብራት እና ደማቅ ሂደቶችን የሚያሳይ ህያው ሃይማኖታዊ እና ባህላዊ በዓል።',
    date: 'September 26-27, 2024',
    location: 'Central Sodo & Regional Churches',
    locationAm: 'ማዕከላዊ ሶዶ እና የክልሉ አብያተ ክርስቲያናት',
    image: '/images/Attractions/Meskel.png',
    category: 'Religious & Cultural',
    featured: true,
    relatedTours: 5
  },
  {
    id: 'timket-celebration',
    name: 'Timket (Epiphany)',
    nameAm: 'ጥምቀት በዓል',
    description: 'Orthodox Christian celebration commemorating the baptism of Jesus, filled with singing, water blessings, and spiritual hymns.',
    descriptionAm: 'የኢየሱስ ጥምቀትን የሚያከብር የኦርቶዶክስ ተዋሕዶ በዓል፣ በዝማሬ፣ በውሃ ቡራኬ እና በመንፈሳዊ ዝማሬ የተሞላ።',
    date: 'January 19-20, 2025',
    location: 'Sodo & Riverfront Sites',
    locationAm: 'ሶዶ እና የወንዝ ዳርቻ ቦታዎች',
    image: '/images/Attractions/Timket.png',
    category: 'Religious',
    featured: false,
    relatedTours: 2
  },
  {
    id: 'harvest-celebration',
    name: 'Wolaita Harvest Thanksgiving',
    nameAm: 'የወላይታ ምርት ማመስገኛ',
    description: 'Celebrate the abundance of the harvest season with traditional foods, blessing ceremonies, and community storytelling.',
    descriptionAm: 'የምርት ወቅት ብዛትን በባህላዊ ምግቦች፣ ቡራኬዎች እና የማህበረሰብ ተረቶች ያክብሩ።',
    date: 'December 20-22, 2024',
    location: 'Agricultural Highlands & Sodo',
    locationAm: 'የእርሻ ደጋማ ቦታዎች እና ሶዶ',
    image: '/images/Attractions/Damot.jpg',
    category: 'Agricultural',
    featured: false,
    relatedTours: 4
  }
];

export const Festivals: React.FC = () => {
  const { t, language } = useLanguage();

  const featuredFestivals = festivals.filter(f => f.featured);
  const upcomingFestivals = festivals.filter(f => !f.featured);

  return (
    <div className="min-h-screen bg-[#faf8f5] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 text-orange-600 text-xs font-semibold tracking-wider uppercase mb-4 shadow-xs">
            <PartyPopper className="w-3.5 h-3.5 text-orange-500" />
            <span>{language === 'en' ? 'CELEBRATING OUR HERITAGE' : 'የባህላችን ታላላቅ በዓላት'}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            {language === 'en' ? (
              <>Cultural <span className="text-orange-500">Festivals</span></>
            ) : (
              <span>{t('festivals.title')}</span>
            )}
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {t('festivals.subtitle')}
          </p>
        </motion.div>

        {/* Featured Festivals */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-500" />
              <span>{language === 'en' ? 'Featured Festivals' : 'ተመራጭ በዓላት'}</span>
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {featuredFestivals.map((festival, index) => (
              <motion.div
                key={festival.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-white rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col"
              >
                <div className="relative">
                  <div
                    className="h-64 sm:h-72 bg-cover bg-center"
                    style={{ backgroundImage: `url(${festival.image})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20" />
                  <div className="absolute top-4 left-4 bg-orange-500 text-white px-3.5 py-1 rounded-full text-xs font-bold shadow-xs">
                    {festival.category}
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-2xl font-extrabold text-white">
                      {language === 'en' ? festival.name : festival.nameAm}
                    </h3>
                  </div>
                </div>

                <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
                    {language === 'en' ? festival.description : festival.descriptionAm}
                  </p>

                  <div className="space-y-3 mb-6 bg-[#fafafa] p-4 rounded-2xl border border-slate-100 text-sm">
                    <div className="flex items-center space-x-3 text-slate-700 font-medium">
                      <Calendar className="h-4 w-4 text-orange-500 flex-shrink-0" />
                      <span>{festival.date}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-slate-700 font-medium">
                      <MapPin className="h-4 w-4 text-orange-500 flex-shrink-0" />
                      <span>{language === 'en' ? festival.location : festival.locationAm}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-slate-700 font-medium">
                      <Users className="h-4 w-4 text-orange-500 flex-shrink-0" />
                      <span>{festival.relatedTours} {t('festivals.relatedTours')}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Link to={`/festivals/${festival.id}`} className="flex-1">
                      <button className="w-full bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-xl font-semibold transition-all shadow-xs hover:shadow-md flex items-center justify-center gap-2 text-sm">
                        <span>{language === 'en' ? 'Learn More' : 'ተጨማሪ ይወቁ'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </Link>
                    
                    <Link to="/tours" className="sm:w-auto">
                      <button className="w-full px-5 py-3 border border-orange-200 text-orange-600 hover:bg-orange-50 rounded-xl font-semibold transition-colors text-sm">
                        {language === 'en' ? 'View Tours' : 'ጉዞዎች ይመልከቱ'}
                      </button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Upcoming Festivals */}
        <section>
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {language === 'en' ? 'Upcoming Celebrations' : 'የሚመጡ በዓላት'}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingFestivals.map((festival, index) => (
              <motion.div
                key={festival.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="bg-white rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col"
              >
                <div className="relative">
                  <div
                    className="h-48 bg-cover bg-center"
                    style={{ backgroundImage: `url(${festival.image})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-orange-600 shadow-xs">
                    {festival.category}
                  </div>
                  <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="text-lg font-bold text-white">
                      {language === 'en' ? festival.name : festival.nameAm}
                    </h3>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-2 mb-4 text-xs sm:text-sm text-slate-600">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-orange-500" />
                      <span>{festival.date}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-orange-500" />
                      <span>{language === 'en' ? festival.location : festival.locationAm}</span>
                    </div>
                  </div>

                  <Link to={`/festivals/${festival.id}`} className="w-full mt-auto">
                    <button className="w-full bg-slate-50 hover:bg-orange-50 border border-slate-200/80 hover:border-orange-300 text-slate-800 hover:text-orange-600 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5">
                      <span>{language === 'en' ? 'View Details' : 'ዝርዝር ይመልከቱ'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
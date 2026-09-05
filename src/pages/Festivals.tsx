import React from 'react';
import { Calendar, MapPin, Clock, Users } from 'lucide-react'; // Removed Play icon
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';

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
  video?: string;
  category: string;
  featured: boolean;
  relatedTours: number;
}

  export const festivals: Festival[] = [ // Make festivals array exportable
    {
      id: '1',
      name: 'Yoyo Gifata Festival',
      nameAm: 'ዮዮ ጊፋታ በዓል',
      description: 'The most important cultural festival of the Wolaita people, celebrating the harvest season with traditional dances, music, and communal feasting.',
      descriptionAm: 'የወላይታ ህዝብ ዋና የባህል በዓል፣ የመሸልሸያ ወቅትን በባህላዊ ውዳቀ፣ ሙዚቃ እና የጋራ ድግስ በማክበር',
      date: 'September 15-17, 2024',
      location: 'Sodo, Wolaita Zone',
      locationAm: 'ሶዶ፣ የወላይታ ዞን',
      image: '../../images/Attractions/Gifata.jpg',
      category: 'Cultural',
      featured: true,
 relatedTours: 5,
 video: 'https://youtu.be/s9_VqzP96tQ?si=8cqviZOobKcNjciw' // Sample YouTube link
    },
    {
      id: '2',
      name: 'Meskel Festival',
      nameAm: 'መስቀል በዓል',
      description: 'Celebrate the finding of the True Cross with colorful processions, traditional songs, and the iconic bonfire ceremony.',
      descriptionAm: 'የእውነተኛው መስቀል መገኘትን በሰልፍ፣ ባህላዊ ዘመማት እና በአንደኛ የእሳት ሥነ ሥርዓት ያክብሩ',
      date: 'September 27, 2024',
      location: 'Various Churches',
      locationAm: 'የተለያዩ ቤተክርስቲያናት',
      image: '../../images/Attractions/Meskel.png',
      category: 'Religious',
      featured: true,
      relatedTours: 3
    },
    {
      id: '3',
      name: 'Coffee Ceremony Festival',
      nameAm: 'የቡና ሥነ ሥርዓት በዓል',
      description: 'Experience the sacred Ethiopian coffee ceremony, from roasting green beans to sharing three rounds of perfectly brewed coffee.',
      descriptionAm: 'የተቀደሰ የኢትዮጵያ የቡና ሥነ ሥርዓት፣ ከአረንጓዴ ፍሬ ማብስል እስከ ሦስት ዙር ፍጹም የተቀቀለ ቡና መጋራት',
      date: 'October 10-12, 2024',
      location: 'Traditional Villages',
      locationAm: 'ባህላዊ መንደሮች',
      image: 'https://images.pexels.com/photos/1695052/pexels-photo-1695052.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      category: 'Cultural',
      featured: false,
      relatedTours: 4
    },
    {
      id: '4',
      name: 'Timkat Festival',
      nameAm: 'ጥምቀት በዓል',
      description: 'Join the Orthodox Christian celebration of Epiphany with colorful processions, water blessings, and traditional ceremonies.',
      descriptionAm: 'በኦርቶዶክስ ክርስቲያን የጥምቀት በዓል በአዳራሽ፣ የውኃ በረከት እና ባህላዊ ሥነ ሥርዓቶች ይቀላቀሉ',
      date: 'January 19, 2025',
      location: 'Water Bodies',
      locationAm: 'የውኃ አካባቢዎች',
      image: '../../images/Attractions/Timket.png',
      category: 'Religious',
      featured: false,
      relatedTours: 2
    },
    {
      id: '5',
      name: 'Traditional Wrestling Festival',
      nameAm: 'ባህላዊ ግልግል በዓል',
      description: 'Watch exciting traditional wrestling matches that showcase strength, skill, and cultural heritage of Wolaita warriors.',
      descriptionAm: 'የወላይታ ተዋጊዎች ጥንካሬ፣ ችሎታ እና ባህላዊ ቅርስ የሚያሳዩ ደሳሳ ባህላዊ ግልግል ውድድሮች ይመልከቱ',
      date: 'November 5-7, 2024',
      location: 'Community Grounds',
      locationAm: 'የማህበረሰብ ሜዳዎች',
      image: 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      category: 'Sports',
      featured: false,
      relatedTours: 3
    },
    {
      id: '6',
      name: 'Harvest Celebration',
      nameAm: 'የመሸልሸያ በዓል',
      description: 'Celebrate the bounty of the harvest season with traditional foods, dances, and community gatherings.',
      descriptionAm: 'የመሸልሸያ ወቅት ብዛት በባህላዊ ምግቦች፣ ውዳቄዎች እና የማህበረሰብ ስብሰባዎች ያክብሩ',
      date: 'December 20-22, 2024',
      location: 'Agricultural Areas',
      locationAm: 'የእርሻ አካባቢዎች',
      image: 'https://images.pexels.com/photos/1271619/pexels-photo-1271619.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('festivals.title')}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('festivals.subtitle')}
          </p>
        </div>

        {/* Featured Festivals */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            {language === 'en' ? 'Featured Festivals' : 'ተመራጭ በዓላት'}
          </h2>
          <div className="grid lg:grid-cols-2 gap-8">
            {featuredFestivals.map((festival, index) => (
              <motion.div
                key={festival.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="relative">
                  <div
                    className="h-64 bg-cover bg-center"
                    style={{ backgroundImage: `url(${festival.image})` }}
                  />
                  <div className="absolute top-4 left-4 bg-amber-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {festival.category}
                  </div>
                  {/* Removed video icon button */}
                </div>

                <div className="p-6">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                    {language === 'en' ? festival.name : festival.nameAm}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {language === 'en' ? festival.description : festival.descriptionAm}
                  </p>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center space-x-3 text-gray-600">
                      <Calendar className="h-5 w-5 text-amber-600" />
                      <span>{festival.date}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-600">
                      <MapPin className="h-5 w-5 text-amber-600" />
                      <span>{language === 'en' ? festival.location : festival.locationAm}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-600">
                      <Users className="h-5 w-5 text-amber-600" />
                      <span>{festival.relatedTours} {t('festivals.relatedTours')}</span>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <Link to={`/festivals/${festival.id}`} className="flex-1">
                      <button className="w-full bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md font-medium transition-colors">
                        {language === 'en' ? 'Learn More' : 'ተጨማሪ ይወቁ'}
                      </button>
                    </Link>
                    
                    <button className="px-4 py-2 border border-amber-600 text-amber-600 hover:bg-amber-50 rounded-md font-medium transition-colors">
                      {language === 'en' ? 'View Tours' : 'ጉዞዎች ይመልከቱ'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Upcoming Festivals */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            {language === 'en' ? 'Upcoming Festivals' : 'የሚመጡ በዓላት'}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {upcomingFestivals.map((festival, index) => (
              <motion.div
                key={festival.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative">
                  <div
                    className="h-40 bg-cover bg-center"
                    style={{ backgroundImage: `url(${festival.image})` }}
                  />
                  <div className="absolute top-2 right-2 bg-white bg-opacity-90 px-2 py-1 rounded text-xs font-medium">
                    {festival.category}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {language === 'en' ? festival.name : festival.nameAm}
                  </h3>
                  
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>{festival.date}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{language === 'en' ? festival.location : festival.locationAm}</span>
                    </div>
                  </div>

                  {/* Modified to use Link */}
                  <Link to={`/festivals/${festival.id}`} className="w-full">
                    <button className="w-full bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                      {language === 'en' ? 'View Details' : 'ዝርዝር ይመልከቱ'}
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
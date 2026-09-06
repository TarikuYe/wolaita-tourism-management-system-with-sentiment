import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Building2, MapPin, Phone, Mail, Globe, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const hotels = [
  {
    name: 'Haile Hotel',
    image: '/images/hotels/Hile.jpg',
    address: 'Sodo, Wolaita, Ethiopia',
    phone: '+251 994 00 00 00',
    email: 'Reservationwolaita@haileresorts.com',
    webpage: 'www.hailehotelsandresorts.com',
    rating: 4.8
  },
  {
    name: 'Lewi Hotels and Resort',
    image: '/images/hotels/Lewi.jpg',
    address: 'Sodo, Wolaita, Ethiopia',
    phone: '+251 461 808 080 / +251 930 28 00 00',
    email: 'info@lewihotelandresort.com',
    rating: 4.7
  },
  {
    name: 'Abebe Zeleke Hotel',
    image: '/images/hotels/Abebe.png',
    address: 'Sodo, Wolaita, Ethiopia',
    phone: '+251 461 801 127 / +251 930 50 54 20',
    webpage: 'www.abebezelekeinternationalhotel.com',
    rating: 4.6
  },
  {
    name: 'Nega International Hotel',
    image: '/images/hotels/Nega.jpg',
    address: 'Sodo, Wolaita, Ethiopia',
    phone: '+251 911 69 93 84',
    email: 'ajora@viewlodge.com',
    rating: 4.5
  },
  {
    name: 'Day Star Hotel',
    image: '/images/hotels/DayStar.jpg',
    address: 'Sodo, Wolaita, Ethiopia',
    phone: '+251 916 81 77 48 / +251 911 84 40 18',
    email: 'mariamknn@yahoo.com',
    webpage: 'www.daystarhotel.com',
    rating: 4.5
  },
  {
    name: 'Semayat Hotel',
    image: '/images/hotels/Semayat.jpg',
    address: 'Sodo, Wolaita, Ethiopia',
    phone: '+251 916 58 00 02',
    email: 'ethio@culturalhotel.com',
    rating: 4.6
  },
];

export const Hotel: React.FC = () => {
  const { t, language } = useLanguage();
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
            <Building2 className="w-3.5 h-3.5 text-orange-500" />
            <span>{language === 'en' ? 'LUXURY & COMFORT IN WOLAITA' : 'ምርጥ ማረፊያዎች በወላይታ'}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            {language === 'en' ? (
              <>Places <span className="text-orange-500">to Stay</span></>
            ) : (
              <span>{t('hotels.title')}</span>
            )}
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {language === 'en' 
              ? 'Enjoy premium hospitality, cultural authenticity, and restful accommodations across Wolaita.'
              : 'በወላይታ ዞን ውስጥ ከፍተኛ ጥራት ያለው መስተንግዶ እና ምቹ ማረፊያዎችን ያግኙ።'}
          </p>
        </motion.div>
        
        {/* Hotel Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {hotels.map((hotel, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.08 }}
              viewport={{ once: true }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group bg-white rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col"
            >
              <div className="relative h-56 overflow-hidden">
                <img 
                  src={hotel.image} 
                  alt={hotel.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-orange-600 shadow-xs flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                  <span>{hotel.rating}</span>
                </div>
                <div className="absolute bottom-3 left-4 right-4">
                  <h2 className="text-xl font-bold text-white">
                    {t(`hotel.${hotel.name.toLowerCase().split(' ')[0]}`) || hotel.name}
                  </h2>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4 text-sm">
                <div className="space-y-3 text-slate-600">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span>{hotel.address}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone className="h-4 w-4 text-orange-500 flex-shrink-0" />
                    <span>{hotel.phone}</span>
                  </div>
                  {hotel.email && (
                    <div className="flex items-center gap-2.5">
                      <Mail className="h-4 w-4 text-orange-500 flex-shrink-0" />
                      <a href={`mailto:${hotel.email}`} className="hover:text-orange-600 truncate transition-colors">
                        {hotel.email}
                      </a>
                    </div>
                  )}
                  {hotel.webpage && (
                    <div className="flex items-center gap-2.5">
                      <Globe className="h-4 w-4 text-orange-500 flex-shrink-0" />
                      <a 
                        href={`https://${hotel.webpage.replace(/^https?:\/\//, '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-orange-600 hover:text-orange-700 font-medium truncate"
                      >
                        {hotel.webpage}
                      </a>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <a 
                    href={`tel:${hotel.phone.split('/')[0].trim()}`}
                    className="w-full bg-slate-50 hover:bg-orange-500 text-slate-700 hover:text-white border border-slate-200 hover:border-orange-500 px-4 py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Contact Hotel' : 'ሆቴሉን ያግኙ'}</span>
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Hotel;

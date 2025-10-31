import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const hotels = [
  {
    name: 'Haile Hotel',
    image: '/images/hotels/Hile.jpg',
    address: 'Sodo, Wolaita, Ethiopia',
    phone: '+251 994 00 00 00',
    email: 'Reservationwolaita@haileresorts.com',
    webpage: 'wwww.hailehotelsandresorts.com'
  },
  {
    name: 'Lewi Hotels and Resort',
    image: '/images/hotels/Lewi.jpg',
    address: 'Sodo, Wolaita, Ethiopia',
    phone: '+251 461 808 080/ +251 930 28 00 00',
    email: 'info@lewihotelandresort.com',
  },
  {
    name: 'Abebe Zeleke Hotel',
    image: '/images/hotels/Abebe.png',
    address: 'Sodo, Wolaita, Ethiopia',
    phone: '+251 461 801 127/ +251 930 50 54 20',
    webpage: 'www.abebezelekeinternationalhotel.com',
  },
  {
    name: 'Nega International Hotel',
    image: '/images/hotels/Nega.jpg',
    address: 'Sodo, Wolaita, Ethiopia',
    phone: '+251 911 69 93 84',
    email: 'ajora@viewlodge.com',
  },
  {
    name: 'Day Star Hotel',
    image: '/images/hotels/DayStar.jpg',
    address: 'Sodo, Wolaita, Ethiopia',
    phone: '+251 916 81 77 48/ +251 911 84 40 18',
    email: 'mariamknn@yahoo.com',
    webpage: 'www.daystarhotel.com'
  },
  {
    name: 'Semayat Hotel',
    image: '/images/hotels/Semayat.jpg',
    address: 'Sodo, Wolaita, Ethiopia',
    phone: '+251 916 58 00 02',
    email: 'ethio@culturalhotel.com',
  },
];

const Hotel: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-4xl font-bold mb-10 text-center text-amber-600">
        {t('hotels.title')}
      </h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {hotels.map((hotel, index) => (
          <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <img src={hotel.image} alt={hotel.name} className="w-full h-48 object-cover" />
            <div className="p-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {t(`hotel.${hotel.name.toLowerCase().split(' ')[0]}`) || hotel.name}
              </h2>
              <p className="text-gray-600"><strong>{t('hotels.address')}:</strong> {hotel.address}</p>
              <p className="text-gray-600"><strong>{t('hotels.phone')}:</strong> {hotel.phone}</p>
              {hotel.email && (
                <p className="text-gray-600"><strong>{t('hotels.email')}:</strong> {hotel.email}</p>
              )}
              {hotel.webpage && (
                <p className="text-gray-600"><strong>{t('hotels.webpage')}:</strong> {hotel.webpage}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Hotel;

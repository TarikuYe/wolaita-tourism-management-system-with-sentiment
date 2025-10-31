import React from 'react';
import { Mountain, Mail, Phone, MapPin, Facebook, Instagram, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

export const Footer: React.FC = () => {
  const { language } = useLanguage();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <Mountain className="h-8 w-8 text-amber-500" />
              <span className="text-xl font-bold">
                {language === 'en' ? 'Wolaita Tours' : 'የወላይታ ጉዞዎች'}
              </span>
            </div>
            <p className="text-gray-300 mb-4">
              {language === 'en' 
                ? 'Discover the authentic beauty and rich culture of Wolaita Zone with our expert local guides.'
                : 'በባለሙያ የአካባቢ መሪዎች እርዳታ የወላይታ ዞን እውነተኛ ውበት እና ባህል ይገኙ።'
              }
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-amber-500 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-amber-500 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-amber-500 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              {language === 'en' ? 'Quick Links' : 'ፈጣን ሊንኮች'}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/tours" className="text-gray-300 hover:text-amber-500 transition-colors">
                  {language === 'en' ? 'Tours' : 'ጉዞዎች'}
                </Link>
              </li>
              <li>
                <Link to="/festivals" className="text-gray-300 hover:text-amber-500 transition-colors">
                  {language === 'en' ? 'Festivals' : 'በዓላት'}
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-300 hover:text-amber-500 transition-colors">
                  {language === 'en' ? 'About Us' : 'ስለ እኛ'}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-amber-500 transition-colors">
                  {language === 'en' ? 'Contact' : 'አግኙን'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              {language === 'en' ? 'Services' : 'አገልግሎቶች'}
            </h3>
            <ul className="space-y-2">
              <li className="text-gray-300">
                {language === 'en' ? 'Cultural Tours' : 'ባህላዊ ጉዞዎች'}
              </li>
              <li className="text-gray-300">
                {language === 'en' ? 'Adventure Tours' : 'ጀብዱ ጉዞዎች'}
              </li>
              <li className="text-gray-300">
                {language === 'en' ? 'Religious Tours' : 'ሃይማኖታዊ ጉዞዎች'}
              </li>
              <li className="text-gray-300">
                {language === 'en' ? 'Festival Events' : 'የበዓል ዝግጅቶች'}
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              {language === 'en' ? 'Contact Info' : 'የመገኛ አድራሻ'}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-amber-500" />
                <span className="text-gray-300">
                  {language === 'en' ? 'Sodo, Wolaita Zone, Ethiopia' : 'ሶዶ፣ የወላይታ ዞን፣ ኢትዮጵያ'}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-amber-500" />
                <span className="text-gray-300">+251 9XX XXX XXX</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-amber-500" />
                <span className="text-gray-300">info@wolaitatours.com</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-300">
            © 2024 {language === 'en' ? 'Wolaita Tours' : 'የወላይታ ጉዞዎች'}. 
            {language === 'en' ? ' All rights reserved.' : ' ሁሉም መብቶች የተጠበቁ ናቸው።'}
          </p>
        </div>
      </div>
    </footer>
  );
};
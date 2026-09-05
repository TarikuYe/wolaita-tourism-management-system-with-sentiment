import React, { useState } from 'react';
import { Mountain, Mail, Phone, MapPin, Facebook, Instagram, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { motion } from 'framer-motion';
import { FAQModal } from '../Modals/FAQModal';

export const Footer: React.FC = () => {
  const { language } = useLanguage();
  const [isFAQModalOpen, setIsFAQModalOpen] = useState(false);

  const openFAQModal = () => {
    setIsFAQModalOpen(true);
  };

  const closeFAQModal = () => {
    setIsFAQModalOpen(false);
  };

  return (
    <>
      {/* FAQ Modal */}
      <FAQModal isOpen={isFAQModalOpen} onClose={closeFAQModal} />

      {/* Floating Support Chat Button with FAQ Icon */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
        onClick={openFAQModal}
        className="fixed bottom-6 right-6 z-50 transition-all duration-300 group"
        aria-label={language === 'en' ? 'Open FAQ Support' : 'የድጋፍ FAQ ክፈት'}
      >
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative"
        >
          {/* Custom FAQ Icon - Two overlapping speech bubbles with FAQ text */}
          <svg width="48" height="48" viewBox="0 0 48 48" className="relative z-10 drop-shadow-2xl filter hover:drop-shadow-[0_0_15px_rgba(251,191,36,0.6)] transition-all duration-300">
            {/* Red background bubble (behind, offset to right) */}
            <path
              d="M28 6 C32 6 36 10 36 14 L36 22 C36 26 32 30 28 30 L24 30 L24 34 L20 30 L16 30 C12 30 8 26 8 22 L8 14 C8 10 12 6 16 6 Z"
              fill="#EF4444"
              stroke="#1F2937"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Yellow foreground bubble with FAQ text (in front, offset to left) */}
            <path
              d="M24 2 C28 2 32 6 32 10 L32 18 C32 22 28 26 24 26 L20 26 L20 30 L16 26 L12 26 C8 26 4 22 4 18 L4 10 C4 6 8 2 12 2 Z"
              fill="#FCD34D"
              stroke="#1F2937"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* FAQ Text */}
            <text
              x="18"
              y="18"
              fontSize="11"
              fontWeight="900"
              fill="#1F2937"
              fontFamily="Arial, sans-serif"
              textAnchor="middle"
            >
              FAQ
            </text>
          </svg>
        </motion.div>
        {/* Tooltip */}
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap bg-gray-900 text-white px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none text-sm shadow-lg">
          {language === 'en' ? 'Need Help? Ask Us!' : 'እርዳታ ይፈልጋሉ? ጠይቁን!'}
        </span>
      </motion.button>

      <footer className="bg-gray-900 text-white relative">
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
    </>
  );
};
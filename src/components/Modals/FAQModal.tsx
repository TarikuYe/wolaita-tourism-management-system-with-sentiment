import React, { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';

interface FAQModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FAQModal: React.FC<FAQModalProps> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const faqs = [
    {
      question: language === 'en' ? 'How do I create an account?' : 'መለያ እንዴት ማመቻቸት እችላለሁ?',
      answer: language === 'en' 
        ? 'You can create an account by clicking the "Register" button in the top navigation menu. Simply provide your name, email address, and create a secure password. After registration, you\'ll be able to book tours and manage your reservations.'
        : 'ከላይ ባለው የአሰሳ ሜኑ ውስጥ "ይመዝግቡ" የሚለውን ቁልፍ በመጫን መለያ መፍጠር ይችላሉ። ስምዎን፣ ኢሜል አድራሻዎን ያስገቡ እና ደህንነቱ የተጠበቀ የይለፍ ቃል ይፍጠሩ። ከመመዝገብ በኋላ ጉዞዎችን መቀራረብ እና ማስቀመጥዎን ማስተዳደር ይችላሉ።'
    },
    {
      question: language === 'en' ? 'Do I need an account to view tours?' : 'ጉዞዎችን ለማየት መለያ ያስፈልገኛል?',
      answer: language === 'en'
        ? 'No, you don\'t need an account to browse and view available tours. You can explore all our tour options, see details, prices, and schedules without signing up. However, you will need an account to book a tour and make a reservation.'
        : 'አይ፣ ጉዞዎችን ለመፈለግ እና ለማየት መለያ አያስፈልግዎትም። ያለ መመዝገብ ሁሉንም የጉዞ አማራጮቻችንን ማስላት፣ ዝርዝሮች፣ ዋጋዎች እና የጊዜ ሰሌዳዎችን ማየት ይችላሉ። ሆኖም ጉዞ ለመቀራረብ እና ለማስቀመጥ መለያ ያስፈልግዎታል።'
    },
    {
      question: language === 'en' ? 'How do I book a tour?' : 'ጉዞ እንዴት እቀራራለሁ?',
      answer: language === 'en'
        ? 'To book a tour, first sign in to your account. Then, browse our available tours and select the one you\'re interested in. Click on the tour to view details, choose your tour date and number of participants, and click "Book Now". After filling in any special requests, proceed to payment to confirm your booking.'
        : 'ጉዞ ለመቀራረብ በመጀመሪያ ወደ መለያዎ ይግቡ። ከዚያ የሚገኙ ጉዞዎቻችንን ይፈልጉ እና የሚያስደስትዎን ይምረጡ። ዝርዝሮችን ለማየት ጉዞውን ጠቅ ያድርጉ፣ የጉዞ ቀንዎን እና የተሳታፊዎችን ብዛት ይምረጡ፣ እና "አሁን ቀራር" ይጫኑ። ልዩ ጥያቄዎችን ከተሞሉ በኋላ ወደ ክፍያ ይቀጥሉ እና ማስቀመጥዎን ያረጋግጡ።'
    },
    {
      question: language === 'en' ? 'What payment methods are supported?' : 'ምን ዓይነት የክፍያ ዘዴዎች ይደገፋሉ?',
      answer: language === 'en'
        ? 'We support multiple payment methods through Chapa payment gateway, including mobile money options (Telebirr, M-Pesa, CBE Birr, Awash Birr, eBirr, Amole), bank cards (Visa and Mastercard), and bank transfers through Commercial Bank of Ethiopia (CBE). All payments are processed securely in Ethiopian Birr (ETB).'
        : 'በቻፓ የክፍያ መግቢያ በኩል አብዛኛዎቹን የክፍያ ዘዴዎች እንደገናቸዋለን፣ ይህም የሞባይል ገንዘብ አማራጮችን (ቴሌብር፣ ኤም-ፔሳ፣ ሲቢኢ ብር፣ አዋሽ ብር፣ ኢብር፣ አሞሌ)፣ የባንክ ካርዶችን (ቪዛ እና ማስተርካርድ) እና በኢትዮጵያ ንግድ ባንክ (ሲቢኢ) በኩል የባንክ ማስተላለፊያዎችን ያካትታል። ሁሉም ክፍያዎች በኢትዮጵያ ብር (ETB) ደህንነቱ የተጠበቀ መንገድ ይሰላሉ።'
    },
    {
      question: language === 'en' ? 'Can I cancel a booking?' : 'ማስቀመጥ ማስረዳት እችላለሁ?',
      answer: language === 'en'
        ? 'Yes, you can cancel a booking through your dashboard. Navigate to your bookings section, select the booking you wish to cancel, and follow the cancellation process. Please note that cancellation policies may vary depending on the tour and timing. Some tours may have refund eligibility based on how far in advance you cancel.'
        : 'አዎ፣ ከመቆጣጠሪያዎ በኩል ማስቀመጥ ማስረዳት ይችላሉ። ወደ ማስቀመጥዎ ክፍል ይሂዱ፣ ማስረዳት የሚፈልጉትን ማስቀመጥ ይምረጡ፣ እና የማስረዳት ሂደቱን ይከተሉ። ማስቀመጥ ማስረዳት የመመለስ ፖሊሲዎች በጉዞው እና በጊዜ መሰረት ሊለያዩ እንደሚችሉ ልብ ይበሉ። አንዳንድ ጉዞዎች ከምን ያህል ቀደም ብለው እንደሚረዱ በመሰረት የመመለስ ዝግጅት ሊኖራቸው ይችላል።'
    },
    {
      question: language === 'en' ? 'Is my payment secure?' : 'ክፍያዬ ደህንነቱ የተጠበቀ ነው?',
      answer: language === 'en'
        ? 'Yes, your payment is completely secure. We use Chapa, a trusted payment gateway that employs industry-standard encryption and security protocols. All your financial information is encrypted and never stored on our servers. Chapa is certified and compliant with international payment security standards, ensuring your transactions are protected.'
        : 'አዎ፣ ክፍያዎ ሙሉ በሙሉ ደህንነቱ የተጠበቀ ነው። የኢንዱስትሪ ደረጃ ምስጢራዊነት እና የደህንነት ፕሮቶኮሎችን የሚጠቀም የታመነ የክፍያ መግቢያ የሆነውን ቻፓን እንጠቀማለን። ሁሉም የፋይናንስ መረጃዎችዎ በምስጢር ደረጃ ይቀዳሉ እና በእኛ ሰርቨሮች ላይ በጭራሽ አይቀርቡም። ቻፓ የተመዘገበ እና ከአለም አቀፍ የክፍያ ደህንነት ደረጃዎች ጋር የሚጣጣም ነው፣ ይህም ግብይቶችዎ የተጠበቁ መሆናቸውን ያረጋግጣል።'
    },
    {
      question: language === 'en' ? 'How can I contact support?' : 'ድጋፍ እንዴት እገናኛለሁ?',
      answer: language === 'en'
        ? 'You can contact our support team in several ways: Use the contact form on our Contact page to send us a message, email us directly at tarikunegesa19@gmail.com, call us at +251 465 510 615 during business hours (Monday-Friday: 8:00 AM - 6:00 PM, Saturday: 9:00 AM - 4:00 PM), or reach out through your dashboard where you can access help and support options. We typically respond within 24-48 hours.'
        : 'የድጋፍ ቡድናችንን በበርካታ መንገዶች መድረስ ይችላሉ: መልእክት ለመላክ በእኛ የአግኙን ገጽ ላይ ያለውን የአግኙን ቅጹን ይጠቀሙ፣ በቀጥታ በ tarikunegesa19@gmail.com ኢሜል ያትሙን፣ በስራ ሰዓት (ሰኞ-አርብ: 8:00 ጠዋት - 6:00 ማታ፣ ቅዳሜ: 9:00 ጠዋት - 4:00 ማታ) በ +251 465 510 615 ይደውሉልን፣ ወይም ከመቆጣጠሪያዎ በኩል ረዳት እና የድጋፍ አማራጮችን ማግኘት ይችላሉ። በተለምዶ በ24-48 ሰዓታት ውስጥ እንመልሳለን።'
    }
  ];

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="faq-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] overflow-y-auto"
          onKeyDown={handleKeyDown}
        >
        <div 
          className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0"
          onClick={handleBackdropClick}
        >
          {/* Background overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75 z-[9998]"
            aria-hidden="true"
          />

          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
            &#8203;
          </span>

          {/* Modal panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative inline-block w-full max-w-3xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl z-[10000]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="faq-modal-title"
          >
            {/* Modal Header - Chat-like interface */}
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-t-lg -m-6 mb-4 p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    {/* Custom FAQ Icon - Two overlapping speech bubbles */}
                    <svg width="48" height="48" viewBox="0 0 48 48" className="relative z-10 drop-shadow-lg">
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
                  </div>
                  <div>
                    <h3 id="faq-modal-title" className="text-xl font-bold">
                      {language === 'en' ? 'Frequently Asked Questions' : 'በተደጋጋሚ የሚጠየቁ ጥያቄዎች'}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-white hover:text-gray-200 transition-colors p-2 rounded-full hover:bg-white/20"
                  aria-label="Close modal"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* FAQ Content */}
            <div className="max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-3 mt-4">
                {faqs.map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="bg-gray-50 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200"
                  >
                    <button
                      onClick={() => toggleFAQ(index)}
                      className="w-full px-5 py-4 text-left flex items-center justify-between hover:bg-gray-100 transition-colors duration-200 group"
                      aria-expanded={expandedFAQ === index}
                    >
                      <span className="font-semibold text-gray-900 pr-4 group-hover:text-amber-600 transition-colors text-sm sm:text-base">
                        {faq.question}
                      </span>
                      <motion.div
                        animate={{ rotate: expandedFAQ === index ? 180 : 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <ChevronDown className="h-5 w-5 text-amber-600 flex-shrink-0" />
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {expandedFAQ === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ 
                            duration: 0.3, 
                            ease: "easeInOut",
                            opacity: { duration: 0.2 }
                          }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-4 pt-2 text-gray-700 leading-relaxed border-t border-gray-200 bg-white">
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.1, duration: 0.3 }}
                              className="text-sm sm:text-base"
                            >
                              {faq.answer}
                            </motion.p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Footer with support contact */}
            <div className="mt-6 pt-4 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600">
                {language === 'en' 
                  ? "Still need help? Contact us at tarikunegesa19@gmail.com or call +251 465 510 615"
                  : "አሁንም እርዳታ ይፈልጋሉ? በ tarikunegesa19@gmail.com ኢሜል ወይም በ +251 465 510 615 ይደውሉን"
                }
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};


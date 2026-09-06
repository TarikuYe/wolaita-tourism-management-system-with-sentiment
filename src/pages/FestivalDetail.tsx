import React, { useState, useEffect } from 'react';
import { festivals, Festival } from './Festivals';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CalendarDays,
  Sparkles,
  Users,
  Flame,
  Handshake,
  ArrowLeft,
  MapPin,
  Calendar,
  Compass,
  ArrowRight,
  Music
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';

export const FestivalDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [festival, setFestival] = useState<Festival | undefined>();

  useEffect(() => {
    const foundFestival = festivals.find(f => f.id === id || (id === '1' && f.id === 'gifata-festival') || (id === '2' && f.id === 'meskel-demera'));
    setFestival(foundFestival || festivals[0]);
  }, [id]);

  if (!festival) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f5] px-4">
        <div className="text-center bg-white p-8 sm:p-12 rounded-3xl border border-slate-100 shadow-sm max-w-md w-full">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            {language === 'en' ? 'Festival not found' : 'በዓሉ አልተገኘም'}
          </h2>
          <Link to="/festivals" className="inline-flex items-center text-orange-600 hover:text-orange-700 font-semibold gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span>{language === 'en' ? 'Back to Festivals' : 'ወደ በዓላት ተመለስ'}</span>
          </Link>
        </div>
      </div>
    );
  }

  const gifataSchedule = [
    {
      title: "Pre-Festival Rituals and Preparations",
      icon: <CalendarDays className="w-5 h-5 text-indigo-500" />,
      desc: "Early September – Community cleaning, house decorations, traditional attire preparation, and musical setup.",
    },
    {
      title: "Gazze – Youth Performances",
      icon: <Users className="w-5 h-5 text-emerald-500" />,
      desc: "15 days before Gifaata – Young boys and girls perform dances, songs, storytelling, and dramatizations reflecting Wolaita heritage.",
    },
    {
      title: "Lakea or Haya Haya Lakea",
      icon: <Music className="w-5 h-5 text-amber-500" />,
      desc: "Mid-festival – Energetic men’s group dances with chants and traditional instruments, wearing cultural cloths.",
    },
    {
      title: "Gunliyaa Ceremony",
      icon: <Sparkles className="w-5 h-5 text-rose-500" />,
      desc: "Held just before the main day – Rituals led by elders for blessings, spiritual cleansing, and ancestral honoring.",
    },
    {
      title: "Main Gifaata Celebration Day",
      icon: <Flame className="w-5 h-5 text-orange-500" />,
      desc: "Mid-to-late September – Mass gatherings, cultural performances, bonfires, traditional food sharing, and public speeches.",
    },
    {
      title: "Post-Festival Gatherings & Blessings",
      icon: <Handshake className="w-5 h-5 text-blue-500" />,
      desc: "After main day – Family reunions, sharing meals, and reflecting on blessings for the prosperous new year.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* Header Banner */}
      <div className="relative h-[380px] sm:h-[420px] overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${festival.image})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-black/30"></div>
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-end pb-10">
          <Link 
            to="/festivals"
            className="inline-flex items-center text-white/90 mb-6 hover:text-orange-300 font-medium text-sm transition-colors w-fit gap-2 bg-black/30 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{language === 'en' ? 'Back to Festivals' : 'ወደ በዓላት ተመለስ'}</span>
          </Link>
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-500 text-white text-xs font-bold mb-3 shadow-xs w-fit">
            <span>{festival.category}</span>
          </div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight"
          >
            {language === 'en' ? festival.name : festival.nameAm}
          </motion.h1>
          
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-white text-xs sm:text-sm">
            <div className="flex items-center bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              <Calendar className="h-4 w-4 mr-1.5 text-orange-400" />
              <span>{festival.date}</span>
            </div>
            <div className="flex items-center bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              <MapPin className="h-4 w-4 mr-1.5 text-orange-400" />
              <span>{language === 'en' ? festival.location : festival.locationAm}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Overview & Significance */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-3xl border border-slate-100 shadow-xs p-8 sm:p-10"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 text-orange-600 text-xs font-semibold tracking-wider uppercase mb-4 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            <span>HERITAGE & TRADITION</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4">
            {language === 'en' ? 'Cultural Significance' : 'የበዓሉ ታሪካዊ ፋይዳ'}
          </h2>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed mb-6">
            {language === 'en' ? festival.description : festival.descriptionAm}
          </p>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed bg-[#fafafa] p-6 rounded-2xl border border-slate-100">
            {language === 'en' 
              ? 'For long centuries, the people of Wolaita have preserved indigenous customs, vibrant music, traditional dress, and community solidarity that define the rich living culture of southern Ethiopia. Participating in this festival offers an authentic, once-in-a-lifetime cultural journey.'
              : 'ለብዙ መቶ ዘመናት የወላይታ ህዝብ የደቡብ ኢትዮጵያን የበለጸገ ህያው ባህል የሚገልጹ ባህላዊ ልማዶችን፣ ደማቅ ሙዚቃዎችን፣ ባህላዊ አልባሳትን እና የማህበረሰብ አንድነትን ጠብቆ ቆይቷል።'}
          </p>
        </motion.div>

        {/* Video Feature */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-3xl border border-slate-100 shadow-xs p-8 sm:p-10 overflow-hidden"
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            {language === 'en' ? 'Festival Video Showcase' : 'የበዓል ቪዲዮ እይታ'}
          </h2>
          <div className="aspect-w-16 aspect-h-9 rounded-2xl overflow-hidden border border-slate-100 shadow-xs">
            <iframe
              className="w-full h-[360px] sm:h-[450px] rounded-2xl"
              src="https://www.youtube.com/embed/s9_VqzP96tQ"
              title="Wolaita Festival Celebration Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </motion.div>

        {/* Festival Program Schedule */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-3xl border border-slate-100 shadow-xs p-8 sm:p-10"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">
            {language === 'en' ? 'Festival Schedule & Program' : 'የበዓሉ መርሃ ግብር'}
          </h2>

          <div className="space-y-4">
            {gifataSchedule.map((item, idx) => (
              <div
                key={idx}
                className="bg-[#fafafa] hover:bg-white p-5 rounded-2xl border border-slate-100 hover:border-amber-200/80 transition-all duration-300 flex items-start gap-4 shadow-xs"
              >
                <div className="w-11 h-11 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center flex-shrink-0 shadow-xs mt-0.5">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">{item.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <Link to="/tours">
              <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3.5 rounded-xl font-semibold transition-all shadow-xs hover:shadow-md inline-flex items-center gap-2 text-sm">
                <Compass className="w-4 h-4" />
                <span>{language === 'en' ? 'Explore Festival Tours' : 'የበዓሉን የጉዞ ፓኬጆች ይመልከቱ'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FestivalDetail;

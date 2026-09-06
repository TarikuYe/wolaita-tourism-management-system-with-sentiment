import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Users, Heart, Bookmark, Globe, ShieldCheck, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { FAQModal } from '../components/Modals/FAQModal';

const AnimatedCounter: React.FC<{ from: number; to: number; duration?: number }> = ({
  from,
  to,
  duration = 2,
}) => {
  const [count, setCount] = useState(from);

  React.useEffect(() => {
    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      setCount(Math.floor(from + progress * (to - from)));
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [from, to, duration]);

  return <span>{count.toLocaleString()}</span>;
};

export const About: React.FC = () => {
  const { t } = useLanguage();
  const [isFAQModalOpen, setIsFAQModalOpen] = useState(false);

  const whyChooseUsCards = [
    {
      icon: <Users className="w-5 h-5 text-amber-600" />,
      bgIcon: 'bg-amber-100/70 border border-amber-200/60',
      text: t('about.whyChooseUsItems')[0] || 'Expert local guides with deep cultural knowledge',
    },
    {
      icon: <Heart className="w-5 h-5 text-rose-500" />,
      bgIcon: 'bg-rose-100/70 border border-rose-200/60',
      text: t('about.whyChooseUsItems')[1] || 'Authentic experiences with local communities',
    },
    {
      icon: <Bookmark className="w-5 h-5 text-blue-500" />,
      bgIcon: 'bg-blue-100/70 border border-blue-200/60',
      text: t('about.whyChooseUsItems')[2] || 'Sustainable tourism practices',
    },
    {
      icon: <Globe className="w-5 h-5 text-emerald-500" />,
      bgIcon: 'bg-emerald-100/70 border border-emerald-200/60',
      text: t('about.whyChooseUsItems')[3] || 'Multilingual support (English and Amharic)',
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-purple-500" />,
      bgIcon: 'bg-purple-100/70 border border-purple-200/60',
      text: t('about.whyChooseUsItems')[4] || 'Safety and security guaranteed',
    },
  ];

  return (
    <div className="min-h-screen bg-[#faf8f5] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          {/* Tagline Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50/80 border border-orange-200/80 text-orange-600 text-xs font-semibold tracking-wider uppercase mb-5 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            <span>{t('about.tagline') || "DISCOVER ETHIOPIA'S CULTURAL HEART"}</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-4">
            {t('about.headingStart') || 'About'}{' '}
            <span className="text-orange-500">{t('about.headingHighlight') || 'Wolaita Tours'}</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {t('about.description')}
          </p>
        </motion.div>

        {/* 1. Mission Section */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative bg-white rounded-3xl border border-slate-100 shadow-sm p-8 sm:p-12 mb-8 overflow-hidden text-center"
        >
          {/* Top Accent Orange Border */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500" />

          {/* Sparkle Badge */}
          <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 mx-auto mb-5 shadow-xs">
            <Sparkles className="w-5 h-5 text-orange-500" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
            {t('about.missionTitle')}
          </h2>

          <p className="text-slate-600 text-base sm:text-lg max-w-3xl mx-auto leading-relaxed font-normal">
            &ldquo;{t('about.missionText')}&rdquo;
          </p>
        </motion.div>

        {/* 2. Why Choose Us Section */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 sm:p-12 mb-8"
        >
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
              {t('about.whyChooseUsTitle')}
            </h2>
            <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto">
              {t('about.whyChooseUsSubtitle') ||
                'Experience Wolaita with guided expertise, deep rooted local pride, and genuine community hospitality.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {whyChooseUsCards.map((card, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="bg-[#fafafa] hover:bg-white border border-slate-100 hover:border-amber-200/80 rounded-2xl p-6 transition-all duration-300 hover:shadow-md flex flex-col items-start gap-4"
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center ${card.bgIcon} shadow-xs`}
                >
                  {card.icon}
                </div>
                <p className="font-semibold text-slate-800 text-sm sm:text-base leading-snug">
                  {card.text}
                </p>
              </motion.div>
            ))}

            {/* 6th Card: Interactive FAQ Trigger */}
            <motion.div
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              onClick={() => setIsFAQModalOpen(true)}
              className="bg-amber-50/40 hover:bg-amber-50/70 border-2 border-dashed border-amber-300/80 hover:border-amber-400 rounded-2xl p-6 transition-all duration-300 hover:shadow-md flex flex-col items-center justify-center text-center gap-2 cursor-pointer group"
            >
              <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-orange-500 text-white text-xs font-bold shadow-xs tracking-wider">
                FAQ
              </span>
              <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                {t('about.faqPrompt') || 'Have specific questions?'}
              </p>
              <span className="text-xs sm:text-sm font-bold text-orange-600 group-hover:text-orange-700 flex items-center gap-1">
                {t('about.faqButton') || 'Read Tour FAQs →'}
              </span>
            </motion.div>
          </div>
        </motion.div>

        {/* 3. Tourism Growth Section */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 sm:p-12 text-center"
        >
          <div className="mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
              {t('about.tourismTitle')}
            </h2>
            <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto">
              {t('about.tourismSubtitle') ||
                'Demonstrating our continuous commitment to sustainable regional visitor growth'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Tourists */}
            <div className="bg-[#fef9ee] border border-amber-200/70 rounded-2xl p-8 transition-all duration-300 hover:shadow-xs text-center">
              <p className="text-xs sm:text-sm font-medium text-amber-900/80 mb-3">
                {t('about.totalTourists')}
              </p>
              <p className="text-4xl sm:text-5xl font-extrabold text-[#b45309] tracking-tight">
                <AnimatedCounter from={0} to={5160} duration={2} />+
              </p>
            </div>

            {/* Foreign Tourists */}
            <div className="bg-[#eff6ff] border border-blue-200/70 rounded-2xl p-8 transition-all duration-300 hover:shadow-xs text-center">
              <p className="text-xs sm:text-sm font-medium text-blue-900/80 mb-3">
                {t('about.foreignTourists')}
              </p>
              <p className="text-4xl sm:text-5xl font-extrabold text-[#2563eb] tracking-tight">
                <AnimatedCounter from={0} to={1440} duration={2} />+
              </p>
            </div>

            {/* Local Tourists */}
            <div className="bg-[#ecfdf5] border border-emerald-200/70 rounded-2xl p-8 transition-all duration-300 hover:shadow-xs text-center">
              <p className="text-xs sm:text-sm font-medium text-emerald-900/80 mb-3">
                {t('about.localTourists')}
              </p>
              <p className="text-4xl sm:text-5xl font-extrabold text-[#059669] tracking-tight">
                <AnimatedCounter from={0} to={3720} duration={2} />+
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Reusable FAQ Modal triggered from FAQ card */}
      <FAQModal isOpen={isFAQModalOpen} onClose={() => setIsFAQModalOpen(false)} />
    </div>
  );
};

export default About;

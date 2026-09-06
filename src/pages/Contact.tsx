import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ContactForm } from '../components/ContactForm';
import { MapPin, Phone, Mail, Clock, ShieldAlert, PhoneCall, HeartPulse, Building, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export const Contact: React.FC = () => {
  const { t, language } = useLanguage();

  const emergencyContacts = [
    {
      title: t('contact.emergency.police'),
      phone: '+251 465 510 146',
      location: t('contact.emergency.policeLocation'),
      icon: <ShieldAlert className="w-5 h-5 text-blue-600" />,
      bg: 'bg-blue-100/70 border border-blue-200/60'
    },
    {
      title: t('contact.emergency.hospital'),
      phone: '+251 461 801 573',
      location: t('contact.emergency.hospitalLocation'),
      icon: <HeartPulse className="w-5 h-5 text-rose-600" />,
      bg: 'bg-rose-100/70 border border-rose-200/60'
    },
    {
      title: t('contact.emergency.clinic'),
      phone: '+251 465 510 107',
      location: t('contact.emergency.clinicLocation'),
      icon: <Building className="w-5 h-5 text-amber-600" />,
      bg: 'bg-amber-100/70 border border-amber-200/60'
    },
    {
      title: t('contact.emergency.redcross'),
      phone: '952 (Toll-Free)',
      service: t('contact.emergency.redcrossService'),
      icon: <PhoneCall className="w-5 h-5 text-emerald-600" />,
      bg: 'bg-emerald-100/70 border border-emerald-200/60'
    },
  ];

  return (
    <div className="min-h-screen bg-[#faf8f5] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 text-orange-600 text-xs font-semibold tracking-wider uppercase mb-4 shadow-xs">
            <Phone className="w-3.5 h-3.5 text-orange-500" />
            <span>{language === 'en' ? 'GET IN TOUCH' : 'አግኙን'}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            {language === 'en' ? (
              <>Contact <span className="text-orange-500">Us</span></>
            ) : (
              <span>{t('contact.title')}</span>
            )}
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {t('contact.subtitle')}
          </p>
        </motion.div>

        {/* Form and Info Grid */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Contact Form */}
          <div className="lg:col-span-6">
            <ContactForm />
          </div>

          {/* Right Column: Information & Safety Contacts */}
          <div className="lg:col-span-6 space-y-8">
            {/* General Info Card */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-8 sm:p-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                {t('contact.infoTitle')}
              </h2>
              
              <div className="space-y-4 text-sm text-slate-600">
                <div className="flex items-start gap-3 bg-[#fafafa] p-4 rounded-2xl border border-slate-100">
                  <MapPin className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-slate-900 mb-0.5">{t('contact.addressLabel')}</h3>
                    <p>Sodo, Wolaita Zone, Ethiopia</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-[#fafafa] p-4 rounded-2xl border border-slate-100">
                  <Phone className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-slate-900 mb-0.5">{t('contact.phoneLabel')}</h3>
                    <p>+251 465 510 615</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-[#fafafa] p-4 rounded-2xl border border-slate-100">
                  <Mail className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-slate-900 mb-0.5">{t('contact.emailLabel')}</h3>
                    <p>info@wolaitatours.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-[#fafafa] p-4 rounded-2xl border border-slate-100">
                  <Clock className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-slate-900 mb-0.5">{t('contact.hoursLabel')}</h3>
                    <p>{t('contact.hours.weekdays')}</p>
                    <p>{t('contact.hours.saturday')}</p>
                    <p className="text-slate-400">{t('contact.hours.sunday')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Contacts Card */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-8 sm:p-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-rose-100/70 border border-rose-200/60 flex items-center justify-center text-rose-600 shadow-xs">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {t('contact.safetyTitle')}
                </h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {emergencyContacts.map((contact, idx) => (
                  <div key={idx} className="bg-[#fafafa] p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className={`p-1.5 rounded-xl ${contact.bg}`}>
                        {contact.icon}
                      </div>
                      <h3 className="font-bold text-slate-900 text-xs sm:text-sm truncate">{contact.title}</h3>
                    </div>
                    <div className="text-xs text-slate-600">
                      <p className="font-bold text-slate-900">{contact.phone}</p>
                      {contact.location && <p className="text-slate-500 truncate">{contact.location}</p>}
                      {contact.service && <p className="text-slate-500 truncate">{contact.service}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;

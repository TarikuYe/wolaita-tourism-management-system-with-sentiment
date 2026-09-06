import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, User, MessageSquare, Send, CheckCircle, Loader, MessageCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { contactService, ContactFormData } from '../services/contactService';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export const ContactForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { t } = useLanguage();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactFormData>();

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setIsSuccess(false);

    try {
      const response = await contactService.sendMessage(data);
      
      if (response.success) {
        setIsSuccess(true);
        toast.success(response.message || 'Your message has been sent successfully!');
        reset();
        
        setTimeout(() => {
          setIsSuccess(false);
        }, 5000);
      } else {
        throw new Error(response.error || 'Failed to send message');
      }
    } catch (error: any) {
      console.error('Contact form error:', error);
      const errorMessage = error.message || 'Failed to send message. Please try again later.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-8 sm:p-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-orange-100/70 border border-orange-200/60 flex items-center justify-center text-orange-600 shadow-xs">
          <MessageCircle className="w-5 h-5" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">
          {t('contact.formTitle')}
        </h2>
      </div>
      
      {isSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3"
        >
          <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <p className="text-sm font-medium text-emerald-900">
            Your message has been sent successfully! We will get back to you soon.
          </p>
        </motion.div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="name" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            {t('contact.nameLabel')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-slate-400" />
            </div>
            <input
              {...register('name', {
                required: 'Name is required',
                minLength: {
                  value: 2,
                  message: 'Name must be at least 2 characters long',
                },
                maxLength: {
                  value: 100,
                  message: 'Name must be less than 100 characters',
                },
              })}
              type="text"
              id="name"
              className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
              placeholder="Enter your full name"
            />
          </div>
          {errors.name && (
            <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            {t('contact.emailLabel')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-slate-400" />
            </div>
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
              type="email"
              id="email"
              className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
              placeholder="Enter your email address"
            />
          </div>
          {errors.email && (
            <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="message" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            {t('contact.messageLabel')}
          </label>
          <div className="relative">
            <div className="absolute top-3.5 left-3.5 pointer-events-none">
              <MessageSquare className="h-5 w-5 text-slate-400" />
            </div>
            <textarea
              {...register('message', {
                required: 'Message is required',
                minLength: {
                  value: 10,
                  message: 'Message must be at least 10 characters long',
                },
                maxLength: {
                  value: 5000,
                  message: 'Message must be less than 5000 characters',
                },
              })}
              id="message"
              rows={4}
              className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors resize-none"
              placeholder="How can we assist your trip to Wolaita?"
            />
          </div>
          {errors.message && (
            <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.message.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white px-6 py-3.5 rounded-xl font-bold transition-all shadow-xs hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm"
        >
          {isSubmitting ? (
            <>
              <Loader className="h-4 w-4 animate-spin" />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>{t('contact.sendButton')}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

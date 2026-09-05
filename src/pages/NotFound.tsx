import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home, Search, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[80vh] bg-gradient-to-b from-amber-50/40 via-white to-orange-50/30 flex items-center justify-center px-4 py-16">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center space-y-6"
      >
        <div className="relative mx-auto w-28 h-28 flex items-center justify-center">
          <div className="absolute inset-0 bg-amber-200/50 rounded-full blur-xl animate-pulse" />
          <div className="relative w-24 h-24 bg-white rounded-2xl shadow-xl border border-amber-100 flex items-center justify-center">
            <Compass className="w-12 h-12 text-amber-600 animate-spin" style={{ animationDuration: '20s' }} />
          </div>
        </div>

        <div>
          <span className="text-sm font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Error 404
          </span>
          <h1 className="mt-4 text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
            Page Not Found
          </h1>
          <p className="mt-2 text-base text-gray-600">
            The page you are looking for doesn't exist, has been removed, or is temporarily unavailable.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-amber-600/20 transition-all duration-200"
          >
            <Home className="w-4 h-4" />
            <span>Go to Home</span>
          </Link>
          <Link
            to="/tours"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-sm font-semibold rounded-xl shadow-sm transition-all duration-200"
          >
            <Search className="w-4 h-4 text-gray-500" />
            <span>Explore Tours</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;

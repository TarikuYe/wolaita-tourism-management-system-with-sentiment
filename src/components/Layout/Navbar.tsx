import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mountain,
  Menu,
  X,
  Globe,
  User as UserIcon,
  LogOut,
  Utensils,
  Shirt,
  PartyPopper,
  Home,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCultureDropdown, setShowCultureDropdown] = useState(false);
  const { currentUser, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const isAdmin = currentUser?.role === 'admin';
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setShowUserMenu(false);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'am' : 'en');
  };

  const handleToursClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!currentUser) {
      navigate('/login?message= Note: Please register / login to view tours');
    } else {
      navigate('/tours');
    }
  };

  const navLinks = [
    { to: '/', label: t('nav.home') },
    ...(currentUser ? [{ to: '/tours', label: t('nav.tours'), isTours: true }] : []),
    { to: '/festivals', label: t('nav.festivals') },
    {
      label: t('nav.culture'),
      submenu: [
        { to: '/culture/food-drinks', label: t('nav.foodDrinks'), icon: <Utensils className="w-4 h-4 mr-2" /> },
        { to: '/culture/clothes', label: t('nav.clothes'), icon: <Shirt className="w-4 h-4 mr-2" /> },
        { to: '/culture/dances', label: t('nav.dances'), icon: <PartyPopper className="w-4 h-4 mr-2" /> },
        { to: '/culture/cottages', label: t('nav.cottages'), icon: <Home className="w-4 h-4 mr-2" /> },
      ],
    },
    { to: '/hotel', label: t('nav.hotel') },
    { to: '/about', label: t('nav.about') },
    { to: '/contact', label: t('nav.contact') },
  ];
  
  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Mountain className="h-10 w-10 text-amber-600" />
              {/* <img src="/images/logos/ologo.png" alt="Wolaita Tours Logo" className="h-24 w-34" /> */}
              <span className="text-xl font-bold text-gray-900">
                {language === 'en' ? 'Wolaita Tours' : 'የወላይታ ጉዞዎች'}
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {!isAdmin &&
              navLinks.map((link, index) =>
              link.submenu ? (
                <div
                  className="relative"
                  key={`nav-${index}`}
                  onMouseEnter={() => setShowCultureDropdown(true)}
                  onMouseLeave={() => setShowCultureDropdown(false)}
                >
                  <button className="flex items-center text-gray-700 hover:text-amber-600 px-3 py-2 rounded-md text-sm font-medium">
                    {link.label}
                  </button>
                  <AnimatePresence>
                    {showCultureDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute left-0 mt-2 w-56 bg-white rounded-md shadow-lg z-50"
                      >
                        {link.submenu.map((sublink) => (
                          <Link
                            key={sublink.to}
                            to={sublink.to}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            {sublink.icon}
                            {sublink.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : link.isTours ? (
                <button
                  key={link.to}
                  onClick={handleToursClick}
                  className="text-gray-700 hover:text-amber-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {link.label}
                </button>
              ) : (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-gray-700 hover:text-amber-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {link.label}
                </Link>
              )
            )}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-1 text-gray-700 hover:text-amber-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              <Globe className="h-4 w-4" />
              <span>{language === 'en' ? 'አማ' : 'EN'}</span>
            </button>

            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-amber-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <UserIcon className="h-4 w-4" />
                  <span>{currentUser.name}</span>
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5"
                    >
                      <Link
                        to={
                          currentUser?.role === 'admin'
                            ? '/dashboard'
                            : currentUser?.role === 'agency'
                            ? '/agency'
                            : currentUser?.role === 'cashier'
                            ? '/cashier'
                            : '/tourist'
                        }
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        {t('nav.dashboard')}
                      </Link>
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <UserIcon className="h-4 w-4 mr-2" />
                        {t('nav.profile')}
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="h-4 w-4 inline mr-2" />
                        {t('nav.logout')}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-amber-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="bg-amber-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-amber-700 transition-colors"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={toggleLanguage}
              className="text-gray-700 hover:text-amber-600 p-2"
            >
              <Globe className="h-5 w-5" />
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-amber-600 p-2"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      <AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="md:hidden px-4 pt-4 pb-6 bg-white shadow-md space-y-4"
    >
            {!isAdmin &&
              navLinks.map((link, index) =>
        link.submenu ? (
          <div key={`mobile-nav-${index}`} className="space-y-2">
            <span className="block text-gray-800 font-semibold">{link.label}</span>
            <div className="ml-4 space-y-1">
              {link.submenu.map((sublink) => (
                <Link
                  key={sublink.to}
                  to={sublink.to}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center text-gray-700 hover:text-amber-600"
                >
                  {sublink.icon}
                  {sublink.label}
                </Link>
              ))}
            </div>
          </div>
        ) : link.isTours ? (
          <button
            key={link.to}
            onClick={(e) => {
              handleToursClick(e);
              setIsOpen(false);
            }}
            className="block w-full text-left text-gray-700 hover:text-amber-600"
          >
            {link.label}
          </button>
        ) : (
          <Link
            key={link.to}
            to={link.to}
            onClick={() => setIsOpen(false)}
            className="block text-gray-700 hover:text-amber-600"
          >
            {link.label}
          </Link>
        )
      )}

      {/* Auth + Language */}
      <div className="border-t pt-4 space-y-2">
        <button
          onClick={toggleLanguage}
          className="flex items-center space-x-2 text-gray-700 hover:text-amber-600"
        >
          <Globe className="h-5 w-5" />
          <span>{language === 'en' ? 'አማ' : 'EN'}</span>
        </button>

        {currentUser ? (
          <>
            <Link
              to={
                currentUser.role === 'admin'
                  ? '/dashboard'
                  : currentUser.role === 'agency'
                  ? '/agency'
                  : currentUser.role === 'cashier'
                  ? '/cashier'
                  : '/tourist'
              }
              onClick={() => setIsOpen(false)}
              className="block text-gray-700 hover:text-amber-600"
            >
              {t('nav.dashboard')}
            </Link>
            <button
              onClick={() => {
                handleLogout();
                setIsOpen(false);
              }}
              className="flex items-center text-gray-700 hover:text-amber-600"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t('nav.logout')}
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className="block text-gray-700 hover:text-amber-600"
            >
              {t('nav.login')}
            </Link>
            <Link
              to="/register"
              onClick={() => setIsOpen(false)}
              className="block bg-amber-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-amber-700 transition-colors"
            >
              {t('nav.register')}
            </Link>
          </>
        )}
      </div>
    </motion.div>
  )}
</AnimatePresence>
    </nav>
  );
};

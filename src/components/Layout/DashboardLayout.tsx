import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  LogOut, 
  Menu, 
  X, 
  User,
  Mountain
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  active?: boolean;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  menuItems: MenuItem[];
  title: string;
  userRole: 'admin' | 'agency' | 'cashier';
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  menuItems,
  title,
  userRole
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getRoleColor = () => {
    switch (userRole) {
      case 'admin':
        return 'bg-purple-600';
      case 'agency':
        return 'bg-amber-600';
      case 'cashier':
        return 'bg-blue-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getRoleAccent = () => {
    switch (userRole) {
      case 'admin':
        return 'bg-purple-50 border-l-4 border-purple-500';
      case 'agency':
        return 'bg-amber-50 border-l-4 border-amber-500';
      case 'cashier':
        return 'bg-blue-50 border-l-4 border-blue-500';
      default:
        return 'bg-gray-50 border-l-4 border-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <aside 
        className={`${isSidebarOpen ? 'w-64' : 'w-20'} hidden lg:flex flex-col bg-white shadow-lg transition-all duration-300 fixed h-screen`}
      >
        {/* Logo/Brand */}
        <div className={`p-6 border-b border-gray-200 ${getRoleColor()}`}>
          <div className="flex items-center justify-between">
            {isSidebarOpen ? (
              <div className="flex items-center space-x-3">
                <Mountain className="h-8 w-8 text-white" />
                <div>
                  <h2 className="text-white font-bold text-lg">Wolaita Tours</h2>
                  <p className="text-white/80 text-xs">{title}</p>
                </div>
              </div>
            ) : (
              <Mountain className="h-8 w-8 text-white mx-auto" />
            )}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-white/80 hover:text-white p-1 rounded"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.active !== undefined ? item.active : false;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      item.onClick();
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                      isActive 
                        ? `${getRoleAccent()} text-gray-900 font-semibold` 
                        : 'hover:bg-gray-100 text-gray-700'
                    } ${
                      isSidebarOpen ? 'justify-start' : 'justify-center'
                    }`}
                  >
                    <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-gray-900' : 'text-gray-600'}`} />
                    {isSidebarOpen && (
                      <span className="ml-3 font-medium">{item.label}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-200">
          <div className={`flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
            {isSidebarOpen && (
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  <div className={`h-10 w-10 rounded-full ${getRoleColor()} flex items-center justify-center`}>
                    <User className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {currentUser?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {currentUser?.email || ''}
                  </p>
                </div>
              </div>
            )}
            {!isSidebarOpen && (
              <div className={`h-10 w-10 rounded-full ${getRoleColor()} flex items-center justify-center`}>
                <User className="h-5 w-5 text-white" />
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`mt-3 w-full flex items-center px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors ${
              isSidebarOpen ? 'justify-start' : 'justify-center'
            }`}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {isSidebarOpen && <span className="ml-3 font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-md z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Mountain className={`h-8 w-8 ${getRoleColor().replace('bg-', 'text-')}`} />
            <div>
              <h2 className="font-bold text-lg text-gray-900">Wolaita Tours</h2>
              <p className="text-xs text-gray-500">{title}</p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6 text-gray-600" />
            ) : (
              <Menu className="h-6 w-6 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="lg:hidden fixed inset-y-0 left-0 w-64 bg-white shadow-2xl z-40 pt-16"
          >
            <nav className="flex-1 overflow-y-auto py-4">
              <ul className="space-y-1 px-3">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.active !== undefined ? item.active : false;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => {
                          item.onClick();
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                          isActive 
                            ? `${getRoleAccent()} text-gray-900 font-semibold` 
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <Icon className={`h-5 w-5 mr-3 ${isActive ? 'text-gray-900' : 'text-gray-600'}`} />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center space-x-3 mb-3">
                <div className={`h-10 w-10 rounded-full ${getRoleColor()} flex items-center justify-center`}>
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {currentUser?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {currentUser?.email || ''}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-5 w-5 mr-3" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className={`flex-1 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} transition-all duration-300 pt-16 lg:pt-0`}>
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};


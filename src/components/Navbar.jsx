import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, LogIn, LogOut, MessageCircleQuestion, GraduationCap, User, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { user, isAuthenticated, login, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', path: '/', icon: BookOpen },
    { name: 'Student Portal', path: '/portal', icon: GraduationCap },
    { name: 'Doubt Dump', path: '/doubtdump', icon: MessageCircleQuestion },
  ];

  return (
    <nav className="fixed w-full z-50 glass top-0 left-0 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center space-x-3 shrink-0 mr-3">
            <motion.div 
              whileHover={{ scale: 1.08 }}
              transition={{ duration: 0.3 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-600/20 flex items-center justify-center glow-border overflow-hidden p-1"
            >
              <img src="/logo_emblem.png" alt="Mathematics for Mankind Logo" className="w-full h-full object-contain" />
            </motion.div>
            <span className="text-xl font-heading font-bold text-white tracking-wider">
              Math<span className="text-purple-400">ForMankind</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8 items-center">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path || (location.pathname.startsWith(link.path) && link.path !== '/');
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                    isActive ? 'text-purple-400 bg-white/5' : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon size={18} />
                  <span className="font-medium">{link.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                {user?.role === 'teacher' && (
                  <Link to="/teacher-dashboard" className="hidden md:flex items-center space-x-2 px-3 py-2 rounded-lg bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 border border-teal-500/30 transition-all">
                    <span>Admin Dashboard</span>
                  </Link>
                )}
                {/* Doubt Dump quick-access icon — visible on mobile without hamburger */}
                <Link
                  to="/doubtdump"
                  className="md:hidden ml-2 sm:ml-4 flex items-center justify-center w-9 h-9 rounded-lg bg-purple-500/15 text-purple-400 hover:bg-purple-500/30 border border-purple-500/30 transition-all shrink-0"
                  title="Doubt Dump"
                >
                  <MessageCircleQuestion size={18} />
                </Link>
                <Link to="/profile" className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 text-indigo-400">
                    <User size={16} />
                  </div>
                  {/* Hide username on mobile to avoid crowding */}
                  <span className="hidden md:inline font-medium">{user?.name?.split(' ')[0]}</span>
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/5 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors border border-transparent hover:border-red-500/30"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden md:flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 transition-all shadow-[0_0_15px_rgba(107,33,168,0.5)] hover:shadow-[0_0_25px_rgba(107,33,168,0.7)]"
              >
                <LogIn size={18} />
                <span>Student Login</span>
              </Link>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden ml-4 p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-b border-white/10 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path || (location.pathname.startsWith(link.path) && link.path !== '/');
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                      isActive ? 'text-purple-400 bg-white/10' : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium text-lg">{link.name}</span>
                  </Link>
                );
              })}

              <div className="pt-4 mt-4 border-t border-white/10 space-y-3">
                {isAuthenticated ? (
                  <>
                    {user?.role === 'teacher' && (
                      <Link
                        to="/teacher-dashboard"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 border border-teal-500/30 transition-all"
                      >
                        <BookOpen size={20} />
                        <span className="font-medium text-lg">Admin Dashboard</span>
                      </Link>
                    )}
                    <Link
                      to="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/30 transition-all"
                    >
                      <User size={20} />
                      <span className="font-medium text-lg">Profile</span>
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors border border-red-500/30"
                    >
                      <LogOut size={20} />
                      <span className="font-medium text-lg">Logout</span>
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 transition-all shadow-[0_0_15px_rgba(107,33,168,0.5)]"
                  >
                    <LogIn size={20} />
                    <span className="font-medium text-lg">Student Login</span>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, User, School, BookOpen, Key, ShieldCheck, AlertCircle, UserPlus } from 'lucide-react';

const API_BASE = 'http://localhost:5000';

const SignIn = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loginRole, setLoginRole] = useState('student');
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    school: '',
    classLevel: '10',
    password: '',
    adminSecret: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const isTeacher = loginRole === 'teacher';

    try {
      const endpoint = authMode === 'register' ? '/api/auth/register' : '/api/auth/login';

      const body = authMode === 'register'
        ? {
            name: formData.name,
            school: formData.school,
            classLevel: formData.classLevel,
            password: formData.password,
            role: isTeacher ? 'teacher' : 'student',
            adminSecret: isTeacher ? formData.adminSecret : undefined,
          }
        : {
            name: formData.name,
            password: formData.password,
          };

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      // Login with backend data
      login(data.user, data.token);

      if (data.user.role === 'teacher') {
        navigate('/teacher-dashboard');
      } else {
        navigate('/portal');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center pt-20 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-panel p-8 relative overflow-hidden"
      >
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl" />
        
        <div className="text-center mb-8 relative z-10">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center glow-border mb-4">
            {authMode === 'register' ? <UserPlus className="text-white w-8 h-8" /> : <LogIn className="text-white w-8 h-8" />}
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            {authMode === 'register' ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-slate-400">
            {authMode === 'register' ? 'Join the math universe' : 'Sign in to unlock your math journey'}
          </p>
        </div>

        {/* Auth Mode Toggle */}
        <div className="flex bg-black/40 p-1 rounded-xl mb-4 relative z-10 border border-white/5">
          <button
            type="button"
            onClick={() => { setAuthMode('login'); setError(''); }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${authMode === 'login' ? 'bg-teal-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('register'); setError(''); }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${authMode === 'register' ? 'bg-teal-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Register
          </button>
        </div>

        {/* Role Toggle */}
        <div className="flex bg-black/40 p-1 rounded-xl mb-6 relative z-10 border border-white/5">
          <button
            type="button"
            onClick={() => setLoginRole('student')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${loginRole === 'student' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => setLoginRole('teacher')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${loginRole === 'teacher' ? 'bg-purple-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Teacher
          </button>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center text-red-300 text-sm relative z-10"
            >
              <AlertCircle size={16} className="mr-2 shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              {loginRole === 'teacher' ? 'Admin Name' : 'Student Name'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                placeholder="Carl Friedrich Gauss"
              />
            </div>
          </div>

          {/* Student-only fields (Register mode) */}
          {authMode === 'register' && loginRole === 'student' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">School</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <School className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    name="school"
                    required
                    value={formData.school}
                    onChange={handleChange}
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                    placeholder="Göttingen Academy"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Current Class</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BookOpen className="h-5 w-5 text-slate-400" />
                  </div>
                  <select
                    name="classLevel"
                    value={formData.classLevel}
                    onChange={handleChange}
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all appearance-none"
                  >
                    {[5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                      <option key={num} value={num} className="bg-navy-900">Class {num}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Admin Secret Key (Teacher + Register only) */}
          {loginRole === 'teacher' && authMode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Admin Secret Key</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ShieldCheck className="h-5 w-5 text-amber-400" />
                </div>
                <input
                  type="password"
                  name="adminSecret"
                  required
                  value={formData.adminSecret}
                  onChange={handleChange}
                  className="w-full bg-black/20 border border-amber-500/20 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
                  placeholder="Enter the secret key"
                />
              </div>
              <p className="text-xs text-amber-400/60 mt-1">Required for teacher registration</p>
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 mt-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold hover:from-purple-500 hover:to-indigo-500 transition-colors shadow-[0_0_15px_rgba(107,33,168,0.3)] hover:shadow-[0_0_20px_rgba(107,33,168,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading
              ? 'Please wait...'
              : authMode === 'register'
                ? (loginRole === 'teacher' ? 'Register as Admin' : 'Register')
                : (loginRole === 'teacher' ? 'Enter Dashboard' : 'Enter Portal')
            }
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default SignIn;

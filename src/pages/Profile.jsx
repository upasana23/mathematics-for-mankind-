import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { User, School, BookOpen, CheckCircle, GraduationCap } from 'lucide-react';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [isEditingClass, setIsEditingClass] = useState(false);
  const [selectedClass, setSelectedClass] = useState(user?.classLevel || '10');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleUpdateClass = () => {
    updateProfile({ classLevel: selectedClass });
    setIsEditingClass(false);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  if (!user) return null;

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto min-h-screen">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel overflow-hidden border border-white/10 relative"
      >
        <div className="h-32 bg-gradient-to-r from-purple-800 to-indigo-900 w-full relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
        </div>
        
        <div className="px-8 pb-8 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-16 sm:-mt-12 mb-8 gap-6">
            <div className="w-32 h-32 rounded-full bg-navy-900 border-4 border-slate-800 flex items-center justify-center shadow-2xl relative z-10 shrink-0">
              <User className="w-16 h-16 text-slate-400" />
            </div>
            <div className="text-center sm:text-left pt-14 sm:pt-0">
              <h1 className="text-3xl font-bold text-white mb-2">{user.name}</h1>
              <div className="flex items-center justify-center sm:justify-start text-slate-400 space-x-2">
                <School size={16} />
                <span>{user.school}</span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {user.role !== 'teacher' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white border-b border-white/10 pb-2">Academic Profile</h3>
                
                <div className="p-4 rounded-xl bg-black/20 border border-white/5 relative group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 text-indigo-400">
                        <GraduationCap size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Current Level</p>
                        {isEditingClass ? (
                          <div className="flex items-center space-x-2 mt-2">
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="bg-black/50 border border-purple-500/50 rounded-lg py-1 px-3 text-white focus:outline-none"
                              >
                                {[5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                                  <option key={num} value={num} className="bg-navy-900">Class {num}</option>
                                ))}
                            </select>
                            <button onClick={handleUpdateClass} className="text-sm px-3 py-1 bg-teal-500/20 text-teal-300 rounded hover:bg-teal-500/30 transition-colors">Save</button>
                            <button onClick={() => setIsEditingClass(false)} className="text-sm px-3 py-1 bg-slate-500/20 text-slate-300 rounded hover:bg-slate-500/30 transition-colors">Cancel</button>
                          </div>
                        ) : (
                          <p className="text-2xl font-bold text-white">Class {user.classLevel}</p>
                        )}
                      </div>
                    </div>
                    {!isEditingClass && (
                      <button 
                        onClick={() => setIsEditingClass(true)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-sm text-purple-400 hover:text-purple-300 bg-purple-500/10 px-3 py-1 rounded"
                      >
                        Update
                      </button>
                    )}
                  </div>
                </div>
                
                <AnimatePresence>
                  {showSuccessMessage && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="p-3 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center text-teal-300 text-sm"
                    >
                      <CheckCircle size={16} className="mr-2" />
                      Congratulations! Class updated successfully.
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white border-b border-white/10 pb-2">Platform Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-black/20 border border-white/5 text-center">
                  <div className="text-3xl font-bold text-purple-400 mb-1">12</div>
                  <div className="text-sm text-slate-400">Notes Read</div>
                </div>
                <div className="p-4 rounded-xl bg-black/20 border border-white/5 text-center">
                  <div className="text-3xl font-bold text-indigo-400 mb-1">5</div>
                  <div className="text-sm text-slate-400">Doubts Solved</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;

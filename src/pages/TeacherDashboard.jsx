import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { teacherDoubts } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { Search, Filter, CheckCircle, Clock, BookOpen, User, Image as ImageIcon, Send, X, MoreVertical } from 'lucide-react';
import confetti from 'canvas-confetti';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const TeacherDashboard = () => {
  const { user, token } = useAuth();
  const [doubts, setDoubts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedDoubt, setSelectedDoubt] = useState(null);
  const [resolutionText, setResolutionText] = useState('');
  const [resolutionImage, setResolutionImage] = useState(null);
  const [resolutionFile, setResolutionFile] = useState(null);

  const fetchPendingDoubts = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/doubts/admin', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDoubts(data);
      }
    } catch (err) {
      console.error('Error fetching doubts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useState(() => {
    if (user?.role === 'teacher') fetchPendingDoubts();
  }, [user]);

  // Derived Stats
  const totalDoubts = doubts.length;
  const pendingDoubts = doubts.filter(d => d.status === 'Pending').length;
  const solvedToday = doubts.filter(d => d.status === 'Solved').length;

  // Filtering Logic
  const filteredDoubts = doubts.filter(d => {
    const classMatch = selectedClass === 'All' || d.classLevel === selectedClass;
    const catMatch = selectedCategory === 'All' || d.category === selectedCategory || !d.category;
    const searchMatch = d.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) || d.title?.toLowerCase().includes(searchQuery.toLowerCase());
    return classMatch && catMatch && searchMatch;
  });

  const categories = ['All', ...new Set(doubts.map(d => d.category || 'Other'))];
  const classes = ['All', '6', '7', '8', '9', '10', '11', '12'];

  const handleResolve = async () => {
    if (!selectedDoubt) return;

    try {
      const formData = new FormData();
      formData.append('solutionText', resolutionText);
      if (resolutionFile) {
        formData.append('solutionImage', resolutionFile);
      }

      const res = await fetch(`http://localhost:5000/api/doubts/${selectedDoubt._id}/solve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        // Fire Confetti!
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6b21a8', '#9333ea', '#c084fc', '#2dd4bf']
        });

        // Refresh list
        fetchPendingDoubts();
        
        // Close the workstation
        setSelectedDoubt(null);
        setResolutionText('');
        setResolutionImage(null);
        setResolutionFile(null);
      }
    } catch (err) {
      console.error('Resolution failed:', err);
      alert('Failed to submit solution');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResolutionFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setResolutionImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };


  if (!user || user.role !== 'teacher') {
    return (
      <div className="pt-32 text-center text-white min-h-screen">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-500 mb-4">Access Denied</h1>
        <p className="text-slate-400">You must be logged in as an Admin/Teacher to view the Resolution Dashboard.</p>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen">
      
      {/* Header & Stat Cards */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-6">Resolution Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div whileHover={{ y: -5 }} className="glass-panel p-6 border-l-4 border-l-purple-500">
            <h3 className="text-slate-400 font-medium mb-1">Total Doubts</h3>
            <p className="text-4xl font-bold text-white">{totalDoubts}</p>
          </motion.div>
          <motion.div whileHover={{ y: -5 }} className="glass-panel p-6 border-l-4 border-l-amber-500 relative overflow-hidden">
            <div className="absolute top-4 right-4 w-3 h-3 bg-amber-500 rounded-full animate-ping" />
            <div className="absolute top-4 right-4 w-3 h-3 bg-amber-500 rounded-full" />
            <h3 className="text-slate-400 font-medium mb-1">Pending Needs Help</h3>
            <p className="text-4xl font-bold text-white">{pendingDoubts}</p>
          </motion.div>
          <motion.div whileHover={{ y: -5 }} className="glass-panel p-6 border-l-4 border-l-teal-500">
            <h3 className="text-slate-400 font-medium mb-1">Solved Today</h3>
            <p className="text-4xl font-bold text-white">{solvedToday}</p>
          </motion.div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8 relative">
        
        {/* Filter Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-5 sticky top-28 border border-white/5">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center">
              <Filter className="w-5 h-5 mr-2 text-indigo-400" /> Filters
            </h3>
            
            <div className="space-y-4">
              {/* Search by Student Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Student Name</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="e.g. Prabhat Jr."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:border-purple-500/50 outline-none"
                  />
                </div>
              </div>

              {/* Class Filter */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Class Level</label>
                <div className="flex flex-wrap gap-2">
                  {classes.map(c => (
                    <button 
                      key={c}
                      onClick={() => setSelectedClass(c)}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${selectedClass === c ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50' : 'bg-black/20 text-slate-400 border-white/5 hover:border-white/20'}`}
                    >
                      {c === 'All' ? 'All' : `Class ${c}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Category</label>
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:border-purple-500/50 outline-none appearance-none"
                >
                  {categories.map(c => (
                    <option key={c} value={c} className="bg-navy-900">{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Doubts List */}
        <div className="lg:col-span-3">
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
            {filteredDoubts.length === 0 ? (
              <div className="text-center py-12 glass-panel border border-white/5">
                <CheckCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-xl text-slate-300">No Doubts Found</h3>
                <p className="text-slate-500 text-sm">Adjust your filters or take a well-deserved break.</p>
              </div>
            ) : (
              filteredDoubts.map((doubt) => (
                <motion.div 
                  key={doubt._id}
                  variants={itemVariants}
                  onClick={() => setSelectedDoubt(doubt)}
                  className={`glass-panel p-5 border cursor-pointer hover:shadow-lg transition-all flex flex-col md:flex-row gap-4 relative overflow-hidden group ${selectedDoubt?._id === doubt._id ? 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'border-white/5 hover:border-white/20'}`}
                >
                  {/* Status Indicator Bar */}
                  <div className={`absolute top-0 left-0 w-1 h-full ${doubt.status === 'Pending' ? 'bg-amber-500' : 'bg-teal-500'}`} />
                  
                  <div className="flex-grow space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded flex items-center w-fit ${doubt.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-teal-500/10 text-teal-400 border border-teal-500/20'}`}>
                        {doubt.status === 'Pending' ? <Clock size={12} className="mr-1" /> : <CheckCircle size={12} className="mr-1" />}
                        {doubt.status}
                      </span>
                      <span className="text-xs text-slate-400 bg-white/5 px-2 py-1 rounded">Class {doubt.classLevel} • {doubt.category || 'General'}</span>
                    </div>
                    
                    <p className="text-slate-200 font-medium line-clamp-2 mt-2">{doubt.title}</p>
                    
                    <div className="flex items-center text-xs text-slate-500 space-x-4 pt-2">
                      <span className="flex items-center"><User size={12} className="mr-1" /> {doubt.studentName}</span>
                      <span>{new Date(doubt.createdAt).toLocaleDateString()}</span>
                      {doubt.imageUrl && <span className="flex items-center text-indigo-400"><ImageIcon size={12} className="mr-1" /> Image Attached</span>}
                    </div>
                  </div>
                  
                  <div className="hidden md:flex items-center justify-center shrink-0 w-10 text-slate-600 group-hover:text-purple-400 transition-colors">
                    <MoreVertical size={20} />
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        </div>

      </div>

      {/* Resolution Workstation Drawer/Modal */}
      <AnimatePresence>
        {selectedDoubt && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedDoubt(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full md:w-[600px] bg-navy-900 border-l border-white/10 shadow-2xl z-50 overflow-y-auto custom-scrollbar flex flex-col"
            >
              <div className="sticky top-0 bg-navy-900/90 backdrop-blur-md border-b border-white/5 p-6 flex justify-between items-center z-10">
                <div>
                  <h2 className="text-2xl font-bold text-white">Resolve Doubt</h2>
                  <p className="text-slate-400 text-sm">Reviewing submission from {selectedDoubt.studentName}</p>
                </div>
                <button onClick={() => setSelectedDoubt(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-300 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 flex-grow space-y-6">
                
                {/* Student Query */}
                <div className="bg-black/30 p-5 rounded-xl border border-white/5">
                  <div className="flex items-center space-x-2 text-xs text-slate-500 mb-3 uppercase tracking-wider font-semibold">
                    <BookOpen size={14} className="text-purple-400" />
                    <span>The Problem</span>
                  </div>
                  <p className="text-white text-lg leading-relaxed">{selectedDoubt.title}</p>
                  
                  {selectedDoubt.imageUrl && (
                    <div className="mt-4 rounded-lg overflow-hidden border border-white/10 group relative">
                      <img src={selectedDoubt.imageUrl} alt="Student work" className="w-full h-auto max-h-64 object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                         <span className="text-white font-medium flex items-center bg-black/60 px-3 py-1 rounded-full"><Search size={14} className="mr-2" /> Click to View Full Size</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Teacher Response Workstation */}
                {selectedDoubt.status === 'Pending' ? (
                  <div className="space-y-4 pt-4">
                    <h3 className="text-lg font-bold text-teal-400 flex items-center">
                      <CheckCircle className="mr-2" size={20} /> The Solution Matrix
                    </h3>
                    
                    <textarea
                      placeholder="Type your explanation here..."
                      value={resolutionText}
                      onChange={(e) => setResolutionText(e.target.value)}
                      className="w-full h-32 bg-black/30 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none transition-colors"
                    />

                    {/* Handwriting Upload Request - Prominent */}
                    <div className="p-4 bg-purple-500/10 border-2 border-dashed border-purple-500/40 rounded-xl relative hover:bg-purple-500/20 transition-colors cursor-pointer group">
                       <input 
                         type="file" 
                         accept="image/*" 
                         onChange={handleImageUpload}
                         className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                       />
                       <div className="flex flex-col items-center justify-center text-center space-y-2">
                         <div className="w-12 h-12 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                           <ImageIcon size={24} />
                         </div>
                         <div>
                           <p className="text-white font-medium">Upload Handwritten Solution</p>
                           <p className="text-slate-400 text-sm mt-1">Snap a photo of your paper solution to attach</p>
                         </div>
                       </div>
                       
                       {resolutionImage && (
                         <div className="absolute inset-0 bg-black/80 z-20 p-2 flex items-center justify-center rounded-xl">
                            <img src={resolutionImage} className="h-full w-auto object-contain rounded" alt="Teacher Solution preview" />
                            <button onClick={(e) => {e.preventDefault(); setResolutionImage(null);}} className="absolute top-2 right-2 p-1 bg-red-500 rounded text-white z-30"><X size={14}/></button>
                         </div>
                       )}
                    </div>
                  </div>
                ) : (
                   <div className="bg-teal-500/10 border border-teal-500/20 p-5 rounded-xl text-center">
                     <CheckCircle className="w-10 h-10 text-teal-400 mx-auto mb-2" />
                     <h3 className="text-teal-300 font-bold mb-1">Doubt Resolved</h3>
                     <p className="text-teal-400/70 text-sm">This item is currently stored in the archive.</p>
                   </div>
                )}
              </div>

              {selectedDoubt.status === 'Pending' && (
                <div className="p-6 border-t border-white/5 bg-navy-900/90 mt-auto sticky bottom-0">
                  <button 
                    onClick={handleResolve}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold text-lg flex items-center justify-center space-x-2 shadow-lg transition-all"
                  >
                    <Send size={20} />
                    <span>Mark as Resolved</span>
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default TeacherDashboard;

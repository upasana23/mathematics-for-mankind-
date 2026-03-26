import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, Image as ImageIcon, CheckCircle, Clock, Send, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DoubtDump = () => {
  const { isAuthenticated, token } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [textDoubt, setTextDoubt] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [doubts, setDoubts] = useState([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMyDoubts = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await fetch('http://localhost:5000/api/doubts/my', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDoubts(data);
      }
    } catch (err) {
      console.error('Error fetching doubts:', err);
    }
  };

  useState(() => {
    fetchMyDoubts();
  }, [isAuthenticated]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files[0] && files[0].type.startsWith('image/')) {
      handleImage(files[0]);
    }
  };
  
  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleImage(files[0]);
    }
  };

  const handleImage = (file) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    if (!textDoubt.trim() && !imageFile) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('title', textDoubt || 'Question Image');
    if (imageFile) formData.append('image', imageFile);

    try {
      const res = await fetch('http://localhost:5000/api/doubts', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        setTextDoubt('');
        setImagePreview(null);
        setImageFile(null);
        fetchMyDoubts(); // Refresh history
      }
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto min-h-screen">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 via-indigo-400 to-purple-500 mb-4 inline-block">
          The Doubt Dump
        </h1>
        <p className="text-slate-400 text-lg">
          Stuck on a problem? Dump your doubt here. Type it out or snap a picture of your scratchpad.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Submission Form */}
        <div className="lg:col-span-3 space-y-6">
          <div className="glass-panel p-6 border border-white/10 relative">
            <h2 className="text-2xl font-semibold text-white mb-4">Submit a New Doubt</h2>
            <form onSubmit={handleSubmit}>
              <textarea
                value={textDoubt}
                onFocus={(e) => {
                  if (!isAuthenticated) {
                    e.target.blur();
                    setShowLoginModal(true);
                  }
                }}
                onChange={(e) => setTextDoubt(e.target.value)}
                placeholder="Describe your mathematical roadblock in detail..."
                className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all resize-none h-32 mb-4"
              />
              
              <AnimatePresence>
                {imagePreview ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative w-full h-48 rounded-xl overflow-hidden border border-white/20 mb-4 bg-black/40"
                  >
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                    <button 
                      type="button"
                      onClick={() => setImagePreview(null)}
                      className="absolute top-2 right-2 p-2 bg-red-500/80 text-white rounded-full hover:bg-red-500 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    animate={isDragging ? { scale: 1.02, textShadow: "0 0 8px rgba(255,255,255,0.5)" } : { scale: 1 }}
                    className={`relative w-full h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-colors mb-4 cursor-pointer overflow-hidden ${
                      isDragging ? 'border-purple-400 bg-purple-500/20' : 'border-slate-600 hover:border-purple-500/50 hover:bg-white/5'
                    }`}
                  >
                    <input 
                      type="file" 
                      accept="image/*" 
                      onClick={(e) => {
                        if (!isAuthenticated) {
                          e.preventDefault();
                          setShowLoginModal(true);
                        }
                      }}
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <UploadCloud className={`w-10 h-10 mb-2 ${isDragging ? 'text-purple-300 animate-bounce' : 'text-slate-400'}`} />
                    <p className="text-slate-300 font-medium">
                      {isDragging ? 'Drop it like it\'s hot!' : 'Drag & drop an image, or click to browse'}
                    </p>
                    
                    {/* Pulsing effect when dragging */}
                    {isDragging && (
                      <div className="absolute inset-0 bg-purple-500/20 animate-pulse pointer-events-none" />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                type="submit"
                disabled={!textDoubt.trim() && !imagePreview}
                className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold hover:from-purple-500 hover:to-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(107,33,168,0.3)] hover:shadow-[0_0_20px_rgba(107,33,168,0.5)]"
              >
                <Send size={18} />
                <span>Cast into the Void</span>
              </button>
            </form>
          </div>
        </div>

        {/* Previous Doubts List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold text-white mb-4 pl-2 border-l-4 border-purple-500">Your History</h2>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            <AnimatePresence>
              {doubts.map((doubt) => (
                <motion.div
                  key={doubt._id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-panel p-4 border border-white/5 flex flex-col relative overflow-hidden"
                >
                  <div className={`absolute top-0 left-0 w-1 h-full ${doubt.status === 'Solved' ? 'bg-teal-500' : 'bg-amber-500'}`} />
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-md flex items-center ${
                      doubt.status === 'Solved' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {doubt.status === 'Solved' ? <CheckCircle size={12} className="mr-1" /> : <Clock size={12} className="mr-1" />}
                      {doubt.status}
                    </span>
                    <span className="text-xs text-slate-500">{new Date(doubt.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-slate-200 line-clamp-3 mb-2">{doubt.title}</p>
                  {doubt.imageUrl && (
                    <div className="flex items-center text-xs text-indigo-400 bg-indigo-500/10 w-fit px-2 py-1 rounded border border-indigo-500/20">
                      <ImageIcon size={12} className="mr-1" /> Image attached
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Cute Login Pop-up Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-sm"
            onClick={() => setShowLoginModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-indigo-900 via-purple-900 to-navy-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-purple-500/30 text-center relative overflow-hidden"
            >
              {/* Cute floating elements / stars */}
              <div className="absolute top-0 right-0 p-4 opacity-50 text-yellow-300 animate-pulse">✨</div>
              <div className="absolute bottom-10 left-6 p-4 opacity-30 text-pink-300 animate-pulse delay-150">⭐</div>
              
              <button 
                type="button"
                onClick={() => setShowLoginModal(false)} 
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-purple-500/20 rounded-full animate-ping opacity-50" />
                <span className="text-4xl" role="img" aria-label="pleading face">🥺</span>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2 font-serif">Oopsie!</h3>
              <p className="text-purple-200 mb-8 leading-relaxed">
                You need to log in first to cast your doubts into the void. The stars are waiting to help you! 🚀
              </p>
              
              <div className="space-y-3">
                <Link to="/login" className="block w-full py-3 px-4 bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-300 hover:to-emerald-400 text-navy-900 font-bold rounded-xl shadow-[0_0_15px_rgba(45,212,191,0.4)] transition-all transform hover:-translate-y-1">
                  Log In Now
                </Link>
                <button type="button" onClick={() => setShowLoginModal(false)} className="block w-full py-3 px-4 bg-white/5 hover:bg-white/10 text-slate-300 font-medium rounded-xl transition-colors">
                  Maybe later
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default DoubtDump;

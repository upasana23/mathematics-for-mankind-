import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, PlayCircle, ArrowLeft, BookOpen, Plus, Trash2, Edit2, X, Upload, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:5000';

const ClassDetails = () => {
  const { classId } = useParams();
  const { user, token } = useAuth();
  
  const [notes, setNotes] = useState([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  const [newNote, setNewNote] = useState({
    title: '',
    category: 'Algebra',
    file: null
  });

  // Fetch notes from backend
  const fetchNotes = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/notes?classLevel=${classId}`);
      const data = await res.json();
      if (res.ok) setNotes(data);
    } catch (err) {
      console.error('Error fetching notes:', err);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [classId]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!newNote.file) return setUploadError('Please select a file');
    
    setIsUploading(true);
    setUploadError('');
    
    const formData = new FormData();
    formData.append('title', newNote.title);
    formData.append('classLevel', classId);
    formData.append('category', newNote.category);
    formData.append('file', newNote.file);

    try {
      const res = await fetch(`${API_BASE}/api/notes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        setUploadSuccess(true);
        setTimeout(() => {
          setIsUploadModalOpen(false);
          setUploadSuccess(false);
          setNewNote({ title: '', category: 'Algebra', file: null });
        }, 2000);
        fetchNotes();
      } else {
        const data = await res.json();
        setUploadError(data.message || 'Upload failed');
      }
    } catch (err) {
      setUploadError('Server connection failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/notes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) fetchNotes();
    } catch (err) {
      alert('Delete failed');
    }
  };

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto min-h-screen">
      <Link to="/portal" className="inline-flex items-center text-purple-400 hover:text-purple-300 transition-colors mb-8 group">
        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to Classes
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
            <BookOpen className="w-8 h-8 mr-4 text-indigo-400" />
            Class {classId} Resources
          </h1>
          <p className="text-slate-400">Master every concept with premium study materials.</p>
        </motion.div>

        {user?.role === 'teacher' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20"
          >
            <Plus size={20} />
            <span>Add New Note</span>
          </motion.button>
        )}
      </div>

      {notes.length > 0 ? (
        <div className="grid gap-4">
          {notes.map((note, index) => (
            <motion.div
              key={note._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-panel p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-hover group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400 shrink-0">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{note.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{note.category} • {new Date(note.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 sm:ml-auto">
                <a 
                  href={note.fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-5 py-2 rounded-lg bg-teal-500/10 text-teal-300 hover:bg-teal-500/20 border border-teal-500/20 transition-all font-medium"
                >
                  <Upload size={18} className="rotate-180" />
                  <span>Download / View</span>
                </a>

                {user?.role === 'teacher' && (
                  <div className="flex items-center space-x-2 border-l border-white/10 pl-3 ml-2">
                    <button 
                      className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                      title="Edit Note"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(note._id)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete Note"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 glass-panel border border-white/5">
          <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-300 mb-2">No Notes Available Yet</h2>
          <p className="text-slate-500">New study materials are being prepared for Class {classId}.</p>
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => !isUploading && setIsUploadModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md glass-panel p-8 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-teal-500" />
              
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Upload New Note</h2>
                <button 
                  onClick={() => setIsUploadModalOpen(false)} 
                  disabled={isUploading}
                  className="p-2 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {uploadSuccess ? (
                <div className="py-12 text-center">
                  <motion.div 
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="w-16 h-16 bg-teal-500/20 text-teal-400 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <CheckCircle size={32} />
                  </motion.div>
                  <h3 className="text-xl font-bold text-white mb-2">Upload Successful!</h3>
                  <p className="text-slate-400">The stars have received your knowledge.</p>
                </div>
              ) : (
                <form onSubmit={handleUpload} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                    <input 
                      type="text"
                      required
                      value={newNote.title}
                      onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                      className="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500/50 outline-none"
                      placeholder="e.g. Introduction to Calculus"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
                    <select 
                      value={newNote.category}
                      onChange={(e) => setNewNote({...newNote, category: e.target.value})}
                      className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white outline-none"
                    >
                      {['Algebra', 'Geometry', 'Calculus', 'Vedic', 'Other'].map(cat => (
                        <option key={cat} value={cat} className="bg-navy-900">{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">File (PDF or Image)</label>
                    <div className="relative">
                      <input 
                        type="file"
                        required
                        accept=".pdf,image/*"
                        onChange={(e) => setNewNote({...newNote, file: e.target.files[0]})}
                        className="hidden"
                        id="note-file-upload"
                      />
                      <label 
                        htmlFor="note-file-upload"
                        className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:bg-white/5 transition-colors group"
                      >
                        <Upload className="w-8 h-8 text-slate-500 group-hover:text-purple-400 mb-2" />
                        <span className="text-sm text-slate-400 group-hover:text-slate-300">
                          {newNote.file ? newNote.file.name : 'Click to select file'}
                        </span>
                      </label>
                    </div>
                  </div>

                  {uploadError && (
                    <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">
                      {uploadError}
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={isUploading}
                    className="w-full py-3 mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 flex items-center justify-center space-x-2 shadow-lg shadow-purple-500/20"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <span>Create Note</span>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClassDetails;


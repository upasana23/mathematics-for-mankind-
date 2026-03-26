import { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars, OrbitControls } from '@react-three/drei';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { youtubeVideos, books } from '../data/mockData';

const HeroBackground = () => (
  <div className="absolute inset-0 -z-10 bg-navy-900 overflow-hidden">
    <Canvas camera={{ position: [0, 0, 1] }}>
      <Suspense fallback={null}>
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
      </Suspense>
    </Canvas>
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-navy-900/50 to-navy-900 pointer-events-none" />
  </div>
);

const Home = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const channelId = 'UC_Vh4We28mI7QMZsI61ZM6g';
        const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
        const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
        const response = await fetch(apiUrl);
        const data = await response.json();
        if (data.status === 'ok') {
          setVideos(data.items.slice(0, 3)); // Get latest 3
        }
      } catch (error) {
        console.error('Error fetching YouTube videos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  return (
    <div className="flex flex-col min-h-screen relative">
      <HeroBackground />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full text-center lg:text-left grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8 }}
         >
           <h1 className="text-5xl md:text-7xl font-bold mb-6 glow-text tracking-tight animate-pulse-slow">
             Mathematics <br />
             <span className="text-gradient font-sans">for Mankind</span>
           </h1>
           <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto lg:mx-0">
             Explore the beauty of the universe through the language of mathematics.
             Join our journey to unlock the secrets of geometry, calculus, and beyond.
           </p>
           <div className="flex flex-wrap justify-center lg:justify-start gap-4">
             <button className="px-8 py-4 rounded-xl font-bold bg-white text-navy-900 hover:bg-slate-200 transition-colors shadow-lg hover:shadow-white/20">
               Start Learning
             </button>
             <button className="px-8 py-4 rounded-xl font-bold glass glass-hover text-white">
               Explore Library
             </button>
           </div>
         </motion.div>

        {/* Youtube Latest */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="glass-panel p-6 border border-white/10 relative overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
          <h3 className="text-2xl font-bold mb-6 flex items-center space-x-2 text-white">
            <Play className="text-red-500" fill="currentColor" />
            <span>Latest from YouTube</span>
          </h3>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-slate-400">Loading latest videos...</div>
            ) : videos.length > 0 ? (
              videos.map((video) => (
                <motion.div
                  key={video.guid}
                  whileHover={{ scale: 1.02, x: 5 }}
                  onClick={() => window.open(video.link, '_blank')}
                  className="flex gap-4 p-3 rounded-xl glass glass-hover cursor-pointer items-center relative z-10"
                >
                  <div className={`w-32 h-20 rounded-lg shrink-0 bg-navy-900 flex items-center justify-center glow-border relative overflow-hidden`}>
                    <img src={video.thumbnail} alt={video.title} className="absolute inset-0 w-full h-full object-cover opacity-80" />
                    <div className="absolute inset-0 bg-black/30" />
                    <Play className="text-white w-8 h-8 z-10 opacity-90 drop-shadow-lg" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <h4 className="font-bold text-slate-100 line-clamp-2 leading-tight" dangerouslySetInnerHTML={{ __html: video.title }}></h4>
                    <p className="text-sm text-purple-300 mt-2">{new Date(video.pubDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </motion.div>
              ))
            ) : (
                <div className="text-center py-8 text-slate-400">No videos found.</div>
            )}
          </div>
        </motion.div>
      </section>

      {/* Author's Bookshelf */}
      <section className="py-20 bg-navy-800/50 backdrop-blur-sm relative border-t border-white/5 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">The Author's Bookshelf</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Discover comprehensive guides and texts exploring the frontiers of numerical knowledge.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-4">
            {books.map((book, i) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -15, rotateY: 10, rotateX: 5, scale: 1.05 }}
                className="relative group cursor-pointer"
                style={{ perspective: 1000 }}
              >
                {/* Halo Effect Behind Card */}
                <div className={`absolute inset-0 rounded-lg blur-2xl opacity-40 group-hover:opacity-75 transition-opacity duration-500 bg-${book.cover}`} />
                
                {/* Main Card Element */}
                <div className="aspect-[2/3] w-full rounded-lg transition-all duration-300 shadow-xl group-hover:shadow-[0_20px_40px_rgba(107,33,168,0.4)] relative flex flex-col items-center justify-center border overflow-hidden border-white/20 bg-black">
                  {book.image && (
                    <img src={book.image} alt="Photocard" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  )}
                </div>
                <div className="w-11/12 mx-auto h-4 bg-black/40 blur-md rounded-full mt-4 group-hover:opacity-70 transition-opacity" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { classes } from '../data/mockData';
import { GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 200 } }
};

const StudentPortal = () => {
  const { user } = useAuth();

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen">
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center justify-center p-4 bg-purple-500/10 rounded-full mb-6"
        >
          <GraduationCap className="w-12 h-12 text-purple-400" />
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-4xl md:text-5xl font-bold text-white mb-4"
        >
          Select Your Class
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-slate-400 text-lg max-w-2xl mx-auto"
        >
          Embark on your journey through the cosmos of mathematics. Choose your grade to unlock tailored notes, video lectures, and exercises.
        </motion.p>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
      >
        {classes.map((cls) => {
          const isUserClass = user && Number(user.classLevel) === cls.id;
          
          return (
            <motion.div key={cls.id} variants={itemVariants}>
              <Link to={`/portal/${cls.id}`}>
                <motion.div 
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex flex-col items-center justify-center h-40 rounded-2xl bg-gradient-to-br ${cls.color} shadow-lg hover:shadow-[0_10px_30px_rgba(107,33,168,0.5)] transition-all cursor-pointer relative overflow-hidden group`}
                >
                <div className="absolute inset-x-0 top-0 h-1/2 bg-white/20 pointer-events-none skew-y-12 transform origin-top-left -translate-y-8 group-hover:translate-y-0 transition-transform duration-500" />
                <span className="text-3xl font-bold font-serif text-white z-10 drop-shadow-md">
                  {cls.label}
                </span>
                <div className="absolute bottom-4 opacity-0 group-hover:opacity-100 transition-opacity z-10 text-white/80 font-medium text-sm">
                  {isUserClass ? 'Your Class →' : 'Explore Topics →'}
                </div>
                </motion.div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default StudentPortal;

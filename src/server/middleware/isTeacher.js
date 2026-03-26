const isTeacher = (req, res, next) => {
  if (!req.user || req.user.role !== 'teacher') {
    return res.status(403).json({ message: 'Forbidden: Admin access (teacher role) required.' });
  }
  next();
};

export default isTeacher;

import jwt from 'jsonwebtoken';

const roleCheck = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token, authorization denied.' });
    }

    const token = authHeader.split(' ')[1];
    const JWT_SECRET = process.env.JWT_SECRET || 'mathematics-for-mankind-fallback-secret';

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;

    // Check role
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Forbidden: Admin access (teacher role) required.' });
    }

    next();
  } catch (err) {
    console.error('Role check middleware error:', err.message);
    res.status(401).json({ message: 'Token is not valid.' });
  }
};

export default roleCheck;

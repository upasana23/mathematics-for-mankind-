// Central API base URL — reads from env variable in production.
// In dev, defaults to '' so requests route cleanly through Vite dev server proxy to localhost:5000
const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'http://localhost:5000');

export default API_BASE;

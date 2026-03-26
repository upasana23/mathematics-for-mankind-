export const books = [
  { id: 1, title: 'Calculus: Intuitively', cover: 'gradient-to-br from-indigo-500 to-purple-800', image: '/1.jpeg' },
  { id: 2, title: 'Linear Algebra for the Galaxy', cover: 'gradient-to-br from-blue-500 to-teal-600', image: '/2.jpeg' },
  { id: 3, title: 'Geometry of the Stars', cover: 'gradient-to-br from-purple-500 to-pink-600', image: '/3.jpeg' },
  { id: 4, title: 'Probability & The Universe', cover: 'gradient-to-br from-orange-500 to-red-600', image: '/4.jpeg' },
];

export const youtubeVideos = [
  { id: 'v1', title: 'Understanding Limits in 3 Minutes', thumbnail: 'bg-indigo-900', views: '124K' },
  { id: 'v2', title: 'Why Matrix Multiplication Makes Sense', thumbnail: 'bg-purple-900', views: '89K' },
  { id: 'v3', title: 'The Beauty of Euler\'s Identity', thumbnail: 'bg-blue-900', views: '210K' },
];

export const classes = [
  { id: 5, label: 'Class 5', color: 'from-blue-600 to-indigo-800' },
  { id: 6, label: 'Class 6', color: 'from-indigo-600 to-purple-800' },
  { id: 7, label: 'Class 7', color: 'from-purple-600 to-pink-800' },
  { id: 8, label: 'Class 8', color: 'from-pink-600 to-rose-800' },
  { id: 9, label: 'Class 9', color: 'from-rose-600 to-orange-800' },
  { id: 10, label: 'Class 10', color: 'from-orange-600 to-amber-800' },
  { id: 11, label: 'Class 11', color: 'from-amber-600 to-yellow-800' },
  { id: 12, label: 'Class 12', color: 'from-yellow-600 to-lime-800' },
];

export const classTopics = {
  10: [
    { id: 't1', title: 'Real Numbers', hasNotes: true, hasVideo: true },
    { id: 't2', title: 'Polynomials', hasNotes: true, hasVideo: true },
    { id: 't3', title: 'Pair of Linear Equations', hasNotes: true, hasVideo: false },
    { id: 't4', title: 'Quadratic Equations', hasNotes: false, hasVideo: true },
    { id: 't5', title: 'Arithmetic Progressions', hasNotes: true, hasVideo: true },
  ],
  12: [
    { id: 't1', title: 'Relations and Functions', hasNotes: true, hasVideo: true },
    { id: 't2', title: 'Inverse Trigonometric Functions', hasNotes: true, hasVideo: true },
    { id: 't3', title: 'Matrices', hasNotes: true, hasVideo: false },
    { id: 't4', title: 'Determinants', hasNotes: false, hasVideo: true },
    { id: 't5', title: 'Continuity and Differentiability', hasNotes: true, hasVideo: true },
  ]
};

export const teacherDoubts = [
  { id: 'd1', studentName: 'Prabhat Jr.', class: '10', category: 'Algebra', text: 'I don\'t understand why completing the square works for finding roots.', image: null, status: 'Pending', date: '10 mins ago' },
  { id: 'd2', studentName: 'Aditi M.', class: '12', category: 'Calculus', text: 'Can someone explain the chain rule with a physical example? Here is my attempt.', image: 'https://images.unsplash.com/photo-1635326554593-3b6831d36cfa?auto=format&fit=crop&q=80&w=400', status: 'Pending', date: '2 hours ago' },
  { id: 'd3', studentName: 'Rahul S.', class: '8', category: 'Geometry', text: 'Why is the area of a circle pi r squared? My drawing doesn\'t make sense.', image: null, status: 'Pending', date: '4 hours ago' },
  { id: 'd4', studentName: 'Sneha P.', class: '11', category: 'Trigonometry', text: 'Solving for x in this tan equation.', image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=400', status: 'Resolved', date: 'Yesterday' },
  { id: 'd5', studentName: 'Vikram K.', class: '9', category: 'Vedic Maths', text: 'Stuck on multiplying 3 digit numbers using the criss-cross method.', image: null, status: 'Resolved', date: '2 days ago' },
];

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import StudentPortal from './pages/StudentPortal';
import ClassDetails from './pages/ClassDetails';
import DoubtDump from './pages/DoubtDump';
import Profile from './pages/Profile';
import TeacherDashboard from './pages/TeacherDashboard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<SignIn />} />
              <Route path="/portal" element={<StudentPortal />} />
              <Route path="/portal/:classId" element={<ClassDetails />} />
              <Route path="/doubtdump" element={<DoubtDump />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/profile" element={<Profile />} />
                <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
              </Route>
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

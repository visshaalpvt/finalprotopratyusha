/**
 * App.jsx
 * Root component with React Router for Admin and Student dashboards.
 * Now includes Firebase Google Auth — shows LoginPage if not logged in.
 */
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from './components/AuthContext';
import LandingPage from './components/LandingPage';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';
import LiveClassroom from './components/LiveClassroom';

/* ------------------------------------------------------------------ */
/*  Navigation Header                                                  */
/* ------------------------------------------------------------------ */
function Header({ darkMode, setDarkMode, userRole }) {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-gradient-brand text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Title */}
          <div className="flex items-center gap-3">
            <span className="text-2xl" role="img" aria-label="graduation cap">🎓</span>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight leading-none">
                Inclusive Classroom AI
              </h1>
              <p className="text-[10px] sm:text-xs text-brand-200 font-medium tracking-wide">
                Real-Time Accessible Learning
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {userRole === 'teacher' && (
              <Link
                to="/admin"
                className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  location.pathname === '/admin' || location.pathname === '/'
                    ? 'bg-white/20 text-white shadow-inner'
                    : 'text-brand-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="hidden sm:inline">🛡️ </span>Admin
              </Link>
            )}

            {userRole === 'student' && (
              <Link
                to="/student"
                className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  location.pathname === '/student' || location.pathname === '/'
                    ? 'bg-white/20 text-white shadow-inner'
                    : 'text-brand-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="hidden sm:inline">📚 </span>Student
              </Link>
            )}

            <Link
              to="/classroom"
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                location.pathname === '/classroom'
                  ? 'bg-white/20 text-white shadow-inner'
                  : 'text-brand-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="hidden sm:inline">🎥 </span>Live Room
            </Link>

            {/* Dark mode toggle */}
            <button
              onClick={() => setDarkMode((d) => !d)}
              className="ml-2 p-2 rounded-lg hover:bg-white/10 transition-colors"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle dark mode"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>

            {/* User avatar & logout */}
            {user && (
              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-white/20">
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="w-8 h-8 rounded-full border-2 border-white/30 shadow-md"
                  referrerPolicy="no-referrer"
                />
                <span className="hidden md:block text-xs font-semibold text-brand-100 max-w-[100px] truncate">
                  {user.displayName?.split(' ')[0]}
                </span>
                <button
                  onClick={logout}
                  className="text-xs font-bold text-red-300 hover:text-red-200 hover:bg-red-500/20 px-2 py-1 rounded-lg transition-colors"
                  title="Sign Out"
                >
                  Logout
                </button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  App Root                                                           */
/* ------------------------------------------------------------------ */
export default function App() {
  const { user, loading } = useAuth();

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true';
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  // Show loading spinner while Firebase checks auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-medium text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // If not logged in, show landing page
  if (!user) {
    return <LandingPage />;
  }

  const userRole = user?.role || 'student';
  const defaultPath = userRole === 'teacher' ? '/admin' : '/student';

  // Logged in — show the full app
  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
      <BrowserRouter>
        <Header darkMode={darkMode} setDarkMode={setDarkMode} userRole={userRole} />
        <main className="bg-mesh min-h-[calc(100vh-4rem)]">
          <Routes>
            <Route path="/" element={<Navigate to={defaultPath} replace />} />
            {userRole === 'teacher' && <Route path="/admin" element={<AdminDashboard />} />}
            {userRole === 'student' && <Route path="/student" element={<StudentDashboard />} />}
            <Route path="/classroom" element={<LiveClassroom />} />
            <Route path="*" element={<Navigate to={defaultPath} replace />} />
          </Routes>
        </main>
      </BrowserRouter>
    </div>
  );
}

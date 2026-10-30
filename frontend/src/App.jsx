import { lazy, Suspense, useEffect, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import useSocket from './hooks/useSocket';
import { ToastContainer } from 'react-toastify';
import Header from './components/Header';
import Login from './pages/Login';
import Register from './pages/Register';
import PrivateRoute from './components/PrivateRoute';
import NotFound from './pages/NotFound';
const Landing = lazy(() => import('./pages/Landing'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const InterviewRunner = lazy(() => import('./pages/InterviewRunner'));
const SessionReview = lazy(() => import('./pages/SessionReview'));

const App = () => {
  useSocket();
  const location = useLocation();
  const [mode, setMode] = useState(() => {
    try {
      return window.localStorage.getItem('ai-interviewer-mode') === 'light' ? 'light' : 'dark';
    } catch (error) {
      console.error('Unable to read saved appearance mode:', error);
      return 'dark';
    }
  });

  useEffect(() => {
    document.documentElement.dataset.mode = mode;
    try {
      window.localStorage.setItem('ai-interviewer-mode', mode);
      window.localStorage.removeItem('ai-interviewer-theme');
    } catch (error) {
      console.error('Unable to save appearance mode:', error);
    }
  }, [mode]);

  const toggleMode = () => setMode((currentMode) => currentMode === 'dark' ? 'light' : 'dark');

  return (
    <div className='app-shell min-h-screen text-slate-100 relative overflow-hidden font-sans selection:bg-indigo-500/30 selection:text-white'>
      <div className='relative z-10 flex flex-col min-h-screen'>
        <Header mode={mode} onToggleMode={toggleMode} />
          <main className='flex-grow w-full'>
            <Suspense fallback={<div className='flex min-h-[60vh] items-center justify-center text-sm uppercase tracking-[0.25em] text-slate-400'>Loading workspace...</div>}>
              <div key={location.pathname} className="route-transition">
                <Routes>
            {/* Public routes - accessible to everyone */}
            <Route path='/' element={<Landing />} />
            <Route path='/login' element={<Login mode={mode} />} />
            <Route path='/register' element={<Register />} />

            {/* Protected routes - require authentication */}
            <Route element={<PrivateRoute />}>
              <Route path='/dashboard' element={<Dashboard />} />
              <Route path='/profile' element={<Profile />} />
              <Route path='/interview/:sessionId' element={<InterviewRunner mode={mode} />} />
              <Route path="/review/:sessionId" element={<SessionReview mode={mode} />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </Suspense>
        </main>
      </div>
      <ToastContainer
        position='top-right'
        autoClose={3000}
        theme={mode}
        toastClassName={mode === 'dark'
          ? "bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl shadow-2xl"
          : "bg-white border border-slate-200 text-slate-800 rounded-2xl shadow-xl"}
      />
    </div>
  )
}

export default App

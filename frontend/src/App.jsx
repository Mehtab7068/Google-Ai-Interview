import { lazy, Suspense } from 'react'
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

  return (
    <div className='app-shell min-h-screen text-slate-100 relative overflow-hidden font-sans selection:bg-indigo-500/30 selection:text-white'>
      <div className='relative z-10 flex flex-col min-h-screen'>
        <Header />
          <main className='flex-grow w-full'>
            <Suspense fallback={<div className='flex min-h-[60vh] items-center justify-center text-sm uppercase tracking-[0.25em] text-slate-400'>Loading workspace...</div>}>
              <div key={location.pathname} className="route-transition">
                <Routes>
            {/* Public routes - accessible to everyone */}
            <Route path='/' element={<Landing />} />
            <Route path='/login' element={<Login />} />
            <Route path='/register' element={<Register />} />

            {/* Protected routes - require authentication */}
            <Route element={<PrivateRoute />}>
              <Route path='/dashboard' element={<Dashboard />} />
              <Route path='/profile' element={<Profile />} />
              <Route path='/interview/:sessionId' element={<InterviewRunner />} />
              <Route path="/review/:sessionId" element={<SessionReview />} />
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
        theme='dark'
        toastClassName="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl shadow-2xl"
      />
    </div>
  )
}

export default App

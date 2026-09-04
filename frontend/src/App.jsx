import React from 'react'
import { Routes, Route } from 'react-router-dom'
import useSocket from './hooks/useSocket';
import { ToastContainer } from 'react-toastify';
import Header from './components/Header';
import Login from './pages/Login';
import Register from './pages/Register';
import PrivateRoute from './components/PrivateRoute';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import InterviewRunner from './pages/InterviewRunner';
import SessionReview from './pages/SessionReview';
import NotFound from './pages/NotFound';
import Landing from './pages/Landing';
import { GoogleOAuthProvider } from '@react-oauth/google';

const App = () => {
  useSocket();

  const googleClientId =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLIENT_ID) ||
    process.env.REACT_APP_GOOGLE_CLIENT_ID;

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <div className='min-h-screen bg-[#030712] text-slate-100 relative overflow-hidden font-sans selection:bg-indigo-500/30 selection:text-white'>
        <div className='relative z-10 flex flex-col min-h-screen'>
          <Header />
          <main className='flex-grow w-full'>
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
          </main>
        </div>
        <ToastContainer
          position='top-right'
          autoClose={3000}
          theme='dark'
          toastClassName="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl shadow-2xl"
        />
      </div>
    </GoogleOAuthProvider>
  )
}

export default App

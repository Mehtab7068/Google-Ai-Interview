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

const App = () => {
  useSocket();
  return (
    <div className='min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden'>
      <div className='pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-teal-500/25 to-transparent blur-3xl' />
      <div className='pointer-events-none absolute right-0 top-24 h-72 w-72 rounded-full bg-slate-700/30 blur-2xl' />
      <div className='pointer-events-none absolute left-0 top-72 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl' />

      <div className='relative z-10'>
        <Header />
        <main className='mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10'>
          <Routes>
            <Route path='/login' element={<Login />} />
            <Route path='/register' element={<Register />} />
            <Route path='/' element={<PrivateRoute />}>
              <Route path='/' element={<Dashboard />} />
              <Route path='/profile' element={<Profile />} />
              <Route path='/interview/:sessionId' element={<InterviewRunner />} />
              <Route path="/review/:sessionId" element={<SessionReview />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
      <ToastContainer position='top-right' autoClose={3000} />
    </div>
  )
}

export default App

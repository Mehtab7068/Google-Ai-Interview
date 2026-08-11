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
    <div className='min-h-screen bg-[#030712] text-slate-100 relative overflow-hidden font-sans selection:bg-indigo-500/30 selection:text-white'>
      {/* Dynamic Ambient Glow Background */}
      <div className='pointer-events-none absolute inset-x-0 top-0 h-[40rem] bg-gradient-to-b from-indigo-600/10 to-transparent blur-3xl' />
      <div className='pointer-events-none absolute right-[-10%] top-24 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl animate-pulse duration-[10000ms]' />
      <div className='pointer-events-none absolute left-[-10%] top-[30rem] h-96 w-96 rounded-full bg-fuchsia-600/5 blur-3xl animate-pulse duration-[15000ms]' />

      <div className='relative z-10 flex flex-col min-h-screen'>
        <Header />
        <main className='flex-grow mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10'>
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

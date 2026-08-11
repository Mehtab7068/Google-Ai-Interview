import React from 'react'
import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
    <div className="text-center py-20 bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] shadow-2xl max-w-2xl mx-auto mt-10 border border-slate-850 relative overflow-hidden group hover:border-slate-800 transition duration-500">
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />
      <h1 className="text-9xl font-black bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent tracking-tighter">404</h1>
      <h2 className="text-2xl font-extrabold text-white mt-6 uppercase tracking-widest">Page Not Found</h2>
      <p className="text-slate-400 mt-3 mb-8 text-sm sm:text-base">The interview module you're looking for doesn't exist.</p>
      <Link to="/" className="inline-block relative overflow-hidden group/btn bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white px-8 py-3.5 rounded-2xl font-bold transition duration-300 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95">
        <span className="relative z-10">Back to Dashboard</span>
        <div className='absolute inset-0 -translate-x-full group-hover/btn:translate-x-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 transition-transform duration-500' />
      </Link>
    </div>
  )
}

export default NotFound

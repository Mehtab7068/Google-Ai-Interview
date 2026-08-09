import { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import { logout, reset } from "../features/auth/authSlice"
const Header = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);

  const onLogout = () => {
    dispatch(logout());
    dispatch(reset());
    navigate("/login");
  }

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-slate-950/95 border-b border-slate-800/80 backdrop-blur-xl text-white shadow-2xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-teal-400 to-cyan-400 text-slate-950 shadow-lg shadow-teal-500/20 transition-transform duration-300 group-hover:-rotate-6">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5" />
            </svg>
          </div>
          <div>
            <p className="text-base font-black uppercase tracking-[0.35em] text-white">AI <span className="text-teal-300">INT</span><span className="hidden sm:inline">erviewer</span></p>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Interview prep, reimagined</p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {user ? (
            <>
              <Link to="/" className={`text-sm font-semibold uppercase tracking-[0.25em] transition ${isActive('/') ? 'text-teal-300 border-b-2 border-teal-400' : 'text-slate-400 hover:text-white border-b-2 border-transparent'}`}>Dashboard</Link>
              <Link to="/profile" className={`text-sm font-semibold uppercase tracking-[0.25em] transition ${isActive('/profile') ? 'text-teal-300 border-b-2 border-teal-400' : 'text-slate-400 hover:text-white border-b-2 border-transparent'}`}>Profile</Link>
              <div className="flex items-center gap-2 rounded-full bg-slate-900/80 px-4 py-2 border border-slate-800 text-slate-300 shadow-inner">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-[0.25em]">{user.name.split(' ')[0]}</span>
              </div>
              <button onClick={onLogout} className="rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 px-5 py-2 text-xs font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-rose-500/20 transition hover:brightness-110 active:scale-95">Logout</button>
            </>
          ) : (
            <div className="flex items-center gap-6">
              <Link to="/login" className={`text-sm font-semibold uppercase tracking-[0.25em] transition ${isActive('/login') ? 'text-teal-300' : 'text-slate-400 hover:text-white'}`}>Login</Link>
              <Link to="/register" className={`text-sm font-semibold uppercase tracking-[0.25em] transition ${isActive('/register') ? 'text-teal-300' : 'text-slate-400 hover:text-white'}`}>Register</Link>
            </div>
          )}
        </nav>

        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-teal-300 transition">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-slate-950 border-t border-slate-800/80">
          <div className="space-y-4 px-6 py-6">
            {user ? (
              <>
                <div className="flex items-center gap-3 rounded-3xl border border-slate-800 bg-slate-900/95 p-4">
                  <span className="h-3.5 w-3.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-base font-black uppercase tracking-[0.25em] text-slate-200">{user.name}</span>
                </div>
                <Link to="/" onClick={() => setIsMenuOpen(false)} className={`block rounded-3xl border border-slate-800 bg-slate-900/90 px-5 py-4 text-lg font-black uppercase tracking-[0.2em] ${isActive('/') ? 'text-teal-300' : 'text-slate-400 hover:text-white'}`}>Dashboard</Link>
                <Link to="/profile" onClick={() => setIsMenuOpen(false)} className={`block rounded-3xl border border-slate-800 bg-slate-900/90 px-5 py-4 text-lg font-black uppercase tracking-[0.2em] ${isActive('/profile') ? 'text-teal-300' : 'text-slate-400 hover:text-white'}`}>Profile</Link>
                <button onClick={onLogout} className="w-full rounded-3xl bg-gradient-to-r from-rose-500 to-pink-500 py-4 text-sm font-black uppercase tracking-[0.25em] text-white shadow-lg shadow-rose-500/20">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className={`block rounded-3xl border border-slate-800 bg-slate-900/90 px-5 py-4 text-lg font-black uppercase tracking-[0.2em] ${isActive('/login') ? 'text-teal-300' : 'text-slate-400 hover:text-white'}`}>Login</Link>
                <Link to="/register" onClick={() => setIsMenuOpen(false)} className={`block rounded-3xl border border-slate-800 bg-slate-900/90 px-5 py-4 text-lg font-black uppercase tracking-[0.2em] ${isActive('/register') ? 'text-teal-300' : 'text-slate-400 hover:text-white'}`}>Register</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

export default Header

import { useState, useEffect } from "react"
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { createSession, getSessions, reset, deleteSession } from '../features/sessions/sessionSlice'
import { toast } from 'react-toastify'
import SessionCard from "../components/SessionCard"

const ROLES = [
  "MERN Stack Developer",
  "MEAN Stack Developer",
  "Full Stack Python",
  "Full Stack Java",
  "Frontend Developer",
  "Backend Developer",
  "Data Scientist",
  "Data Analyst",
  "Machine Learning Engineer",
  "DevOps Engineer",
  "Cloud Engineer (AWS/Azure/GCP)",
  "Cybersecurity Engineer",
  "Blockchain Developer",
  "Mobile Developer (iOS/Android)",
  "Game Developer",
  "UI/UX Designer",
  "QA Automation Engineer",
  "Product Manager"
];
const LEVELS = ["Junior", "Mid-Level", "Senior"];
const TYPES = [{ label: 'Oral only', value: 'oral-only' }, { label: 'Coding Mix', value: 'coding-mix' }];
const COUNTS = [5, 10, 15];

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { sessions, isLoading, isGenerating, isError, message } = useSelector((state) => state.sessions);
  const isProcessing = isGenerating;

  const [formData, setFormData] = useState({
    role: user.preferredRole || ROLES[0],
    level: LEVELS[0],
    interviewType: TYPES[1].value,
    count: COUNTS[0],
  });

  useEffect(() => {
    if (user && user.token) {
      dispatch(getSessions());
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (isError && message) {
      toast.error(message);
      dispatch(reset());
    }
  }, [isError, message, dispatch]);

  const onChange = (e) => {
    setFormData((prevState) => ({ ...prevState, [e.target.name]: e.target.value }));
  }

  const onSubmit = (e) => {
    e.preventDefault();
    dispatch(createSession(formData))
      .unwrap()
      .then((session) => {
        const sessionId = session._id || session.sessionId;
        if (sessionId) {
          navigate(`/interview/${sessionId}`);
        }
      })
      .catch(() => {
        toast.error('Unable to create session. Please try again.');
      });
  }

  const viewSession = (session) => {
    const sessionIdOrFallback = session._id || session.sessionId;
    if (!sessionIdOrFallback) {
      toast.error('Session ID is unavailable.');
      return;
    }

    if (session.status === 'completed') {
      navigate(`/review/${sessionIdOrFallback}`);
      return;
    }

    if (session.status === 'failed') {
      toast.error('Session failed to generate. Please delete or create a new one.');
      return;
    }

    navigate(`/interview/${sessionIdOrFallback}`);
  }

  const handleDelete = (e, sessionId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this session?')) {
      dispatch(deleteSession(sessionId));
      toast.error('Session Deleted')
    }
  }

  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 py-6 sm:py-12 space-y-8 sm:space-y-12">
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="rounded-[2rem] border border-slate-850 bg-slate-900/40 p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden group hover:border-slate-800 transition-all duration-500">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />
          
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between relative z-10">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-400">Welcome back</p>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Hello, <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">{user.name.split(' ')[0]}</span></h1>
              <p className="max-w-2xl text-slate-400 text-sm sm:text-base leading-relaxed">Launch tailored technical interviews, rehearse answers, and track your progress with a fast AI-powered workflow.</p>
            </div>
            <div className="rounded-3xl bg-slate-950/60 border border-slate-850 p-6 shadow-inner text-center min-w-[140px]">
              <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500 font-bold">Sessions</p>
              <p className="mt-2 text-4xl font-black text-indigo-400">{sessions.length}</p>
              <p className="mt-1.5 text-xs text-slate-500">Practice History</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 relative z-10">
            <div className="rounded-2xl border border-slate-850 bg-gradient-to-br from-slate-900/60 to-slate-850/40 p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-slate-800">
              <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-indigo-400">Next step</p>
              <h2 className="mt-2 text-lg font-bold text-white">Create a new interview</h2>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">Pick role, level, type and start a fresh session in seconds.</p>
            </div>
            <div className="rounded-2xl border border-slate-850 bg-gradient-to-br from-slate-900/60 to-slate-850/40 p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-slate-800">
              <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-violet-400">Quick tip</p>
              <h2 className="mt-2 text-lg font-bold text-white">Use coding mix</h2>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">Choose a mix of coding and oral questions to sharpen both technical thinking and verbal explanation.</p>
            </div>
          </div>
        </div>

        <aside className="rounded-[2rem] border border-slate-855 bg-[#030712]/60 p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden group hover:border-slate-800 transition-all duration-500">
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-violet-500/5 rounded-full blur-3xl" />
          
          <div className="flex items-center justify-between gap-4 relative z-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-indigo-400">Session builder</p>
              <h2 className="mt-2 text-xl font-extrabold text-white">Prepare Interview</h2>
            </div>
            <div className="rounded-full bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.25em] text-emerald-400 border border-emerald-500/20 animate-pulse">Live</div>
          </div>

          <form onSubmit={onSubmit} className="mt-8 grid gap-4 relative z-10">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 mb-2">Role</label>
              <select name="role" value={formData.role} onChange={onChange} className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3.5 text-sm text-slate-200 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 cursor-pointer">
                {ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 mb-2">Level</label>
                <select name="level" value={formData.level} onChange={onChange} className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3.5 text-sm text-slate-200 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 cursor-pointer">
                  {LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 mb-2">Length</label>
                <select name="count" value={formData.count} onChange={onChange} className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3.5 text-sm text-slate-200 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 cursor-pointer">
                  {COUNTS.map((count) => <option key={count} value={count}>{count} Qs</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 mb-2">Type</label>
              <select name="interviewType" value={formData.interviewType} onChange={onChange} className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3.5 text-sm text-slate-200 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 cursor-pointer">
                {TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
            </div>

            <button type="submit" disabled={isProcessing} className={`mt-4 w-full rounded-2xl py-4 text-xs font-black uppercase tracking-[0.25em] text-white shadow-lg transition-all duration-300 relative overflow-hidden group/btn ${isProcessing ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 hover:shadow-indigo-500/20 hover:scale-[1.01]'}`}>
              {isProcessing ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-500 border-t-transparent" />
                  <span>Generating...</span>
                </div>
              ) : (
                <>
                  <span className="relative z-10">Start Interview</span>
                  <div className='absolute inset-0 -translate-x-full group-hover/btn:translate-x-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 transition-transform duration-500' />
                </>
              )}
            </button>
          </form>
        </aside>
      </div>

      <div className="space-y-6 pb-20 sm:pb-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-base">📊</span> 
              Interview History
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">Review your past sessions and continue any active interview.</p>
          </div>
          <div className="rounded-2xl border border-slate-850 bg-slate-900/40 px-4 py-2.5 text-xs font-semibold text-slate-300">
            Active sessions: <span className="text-indigo-400 font-bold">{sessions.filter((s) => s.status !== 'completed').length}</span>
          </div>
        </div>

        {isLoading && sessions.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-10 w-10 rounded-full border-2 border-indigo-500/20 border-t-indigo-500" />
          </div>
        ) : (
          sessions.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-slate-800 bg-slate-900/20 px-8 py-16 text-center text-slate-400">
              <p className="text-base font-semibold">No sessions yet.</p>
              <p className="mt-2 text-xs text-slate-500">Create your first interview and start practicing instantly.</p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {sessions.map((session) => (
                <SessionCard key={session._id} session={session} onClick={viewSession} onDelete={handleDelete} />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
export default Dashboard

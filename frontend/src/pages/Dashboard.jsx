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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-8 sm:space-y-12">
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="rounded-[2rem] border border-slate-800/80 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-teal-400">Welcome back</p>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Hello, <span className="text-teal-300">{user.name.split(' ')[0]}</span></h1>
              <p className="max-w-2xl text-slate-400 text-sm sm:text-base">Launch tailored technical interviews, rehearse answers, and track your progress with a fast AI-powered workflow.</p>
            </div>
            <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-5 shadow-inner">
              <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500">Total sessions</p>
              <p className="mt-3 text-4xl font-black text-teal-300">{sessions.length}</p>
              <p className="mt-2 text-sm text-slate-400">Your practice history at a glance.</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-800/80 bg-gradient-to-br from-slate-900/85 to-slate-800/70 p-6 shadow-lg shadow-teal-500/10 transition hover:-translate-y-1">
              <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Next step</p>
              <h2 className="mt-3 text-xl font-bold text-white">Create a new interview</h2>
              <p className="mt-2 text-sm text-slate-400">Pick role, level, type and start a fresh session in seconds.</p>
            </div>
            <div className="rounded-3xl border border-slate-800/80 bg-gradient-to-br from-slate-900/85 to-cyan-950/70 p-6 shadow-lg shadow-cyan-500/10 transition hover:-translate-y-1">
              <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Quick tip</p>
              <h2 className="mt-3 text-xl font-bold text-white">Use coding mix for balanced practice</h2>
              <p className="mt-2 text-sm text-slate-400">Choose a mix of coding and oral questions to sharpen both technical thinking and verbal explanation.</p>
            </div>
          </div>
        </div>

        <aside className="rounded-[2rem] border border-slate-800/80 bg-slate-950/90 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-teal-400">Session builder</p>
              <h2 className="mt-3 text-2xl font-black text-white">Prepare your next interview</h2>
            </div>
            <div className="rounded-3xl bg-emerald-400/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">Live</div>
          </div>

          <form onSubmit={onSubmit} className="mt-8 grid gap-4">
            <label className="block text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Role</label>
            <select name="role" value={formData.role} onChange={onChange} className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20">
              {ROLES.map((role) => <option key={role} value={role}>{role}</option>)}</select>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Level</label>
                <select name="level" value={formData.level} onChange={onChange} className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20">
                  {LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}</select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Length</label>
                <select name="count" value={formData.count} onChange={onChange} className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20">
                  {COUNTS.map((count) => <option key={count} value={count}>{count} Qs</option>)}</select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Type</label>
              <select name="interviewType" value={formData.interviewType} onChange={onChange} className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20">
                {TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select>
            </div>

            <button type="submit" disabled={isProcessing} className={`mt-4 w-full rounded-3xl px-6 py-4 text-sm font-black uppercase tracking-[0.25em] text-white shadow-2xl transition ${isProcessing ? 'bg-slate-700 text-slate-300 cursor-not-allowed' : 'bg-gradient-to-r from-teal-400 to-cyan-500 hover:brightness-105'}`}>
              {isProcessing ? <><span className="mr-3 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Generating...</> : 'Start Interview'}
            </button>
          </form>
        </aside>
      </div>

      <div className="space-y-6 pb-20 sm:pb-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-3"><span className="inline-flex h-10 w-10 items-center justify-center rounded-3xl bg-slate-900 text-lg">📊</span> Interview History</h2>
            <p className="text-sm text-slate-400 mt-2">Review your past sessions and continue any active interview.</p>
          </div>
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/85 px-4 py-3 text-sm text-slate-300">
            Active sessions: {sessions.filter((s) => s.status !== 'completed').length}
          </div>
        </div>

        {isLoading && sessions.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-12 w-12 rounded-full border-4 border-teal-400/30 border-t-teal-400" />
          </div>
        ) : (
          sessions.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-slate-800/80 bg-slate-900/90 px-8 py-16 text-center text-slate-400">
              <p className="text-lg font-semibold">No sessions yet.</p>
              <p className="mt-3 text-sm text-slate-500">Create your first interview and start practicing instantly.</p>
            </div>
          ) : (
            <div className="space-y-4">
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

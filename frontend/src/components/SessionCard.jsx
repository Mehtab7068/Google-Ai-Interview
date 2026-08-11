import React from 'react';

const SessionCard = ({ session, onClick, onDelete }) => {
  const sessionId = session._id || session.sessionId || '';
  const createdAt = session.createdAt
    ? new Date(session.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : 'Unknown date';
  const statusText = session.status ? session.status.replace(/_/g, ' ').toUpperCase() : 'UNKNOWN';
  const interviewType = session.interviewType ? session.interviewType.replace('-', ' ') : 'Interview';
  const questionCount = session.count || session.questions?.length || '—';

  const statusStyles = {
    completed: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    failed: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    'in-progress': 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    pending: 'bg-slate-800/80 text-slate-300 border border-slate-700/60',
  };

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-slate-850 bg-slate-900/40 p-6 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-slate-800 hover:shadow-2xl">
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 opacity-80" />
      <button
        type="button"
        onClick={() => onClick(session)}
        className="w-full text-left relative z-10 block"
      >
        <div className="flex flex-col justify-between h-full gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">{interviewType}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${statusStyles[session.status] || statusStyles.pending}`}>
                {statusText}
              </span>
            </div>
            <h3 className="text-lg font-black tracking-tight text-white group-hover:text-indigo-300 transition">{session.role || 'Untitled Session'}</h3>
            <p className="text-xs text-slate-400 font-medium">{session.level || 'Unknown level'} • {questionCount} questions</p>
          </div>
          <div className="flex items-end justify-between pt-2 border-t border-slate-850/60">
            <div>
              <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Session Date</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">{createdAt}</p>
            </div>
            <div className="text-right">
              {session.status === 'completed' ? (
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Score</p>
                  <p className="text-2xl font-black text-indigo-400 mt-0.5">{session.overallScore ?? '-'}%</p>
                </div>
              ) : (
                <div className="h-8 flex items-center">
                  <span className="text-xs text-slate-500 italic">Incomplete</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </button>

      <div className="relative z-10 mt-4 flex items-center justify-end">
        <button
          type="button"
          onClick={(e) => onDelete(e, sessionId)}
          className="rounded-xl border border-rose-500/10 bg-rose-500/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-rose-400 transition hover:bg-rose-500/20 active:scale-95"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default SessionCard;

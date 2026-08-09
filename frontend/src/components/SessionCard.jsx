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
    completed: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20',
    failed: 'bg-rose-500/10 text-rose-300 border border-rose-500/20',
    'in-progress': 'bg-amber-500/10 text-amber-300 border border-amber-500/20',
    pending: 'bg-slate-700/80 text-slate-200 border border-slate-700/60',
  };

  return (
    <div className="group relative overflow-hidden rounded-[2rem] border border-slate-800/70 bg-slate-950/80 p-6 shadow-xl shadow-slate-950/30 transition duration-300 hover:-translate-y-1 hover:shadow-2xl">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-500 opacity-80" />
      <button
        type="button"
        onClick={() => onClick(session)}
        className="w-full text-left relative z-10"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-400">{interviewType}</span>
              <span className="rounded-full bg-slate-800/80 px-3 py-1 text-[11px] font-semibold text-slate-300">{statusText}</span>
            </div>
            <h3 className="text-xl font-black tracking-tight text-white">{session.role || 'Untitled Session'}</h3>
            <p className="text-sm text-slate-400">{session.level || 'Unknown level'} • {questionCount} questions</p>
          </div>
          <div className="text-right space-y-2">
            {session.status === 'completed' && (
              <div className="rounded-3xl bg-slate-900/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">Score</div>
            )}
            <p className="text-3xl font-black text-white">{session.status === 'completed' ? session.overallScore ?? '-' : session.status === 'failed' ? '⚠️' : '• • •'}</p>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{createdAt}</p>
          </div>
        </div>
      </button>

      <div className="relative z-10 mt-6 flex flex-wrap items-center justify-between gap-4">
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] ${statusStyles[session.status] || statusStyles.pending}`}>
          {session.status === 'completed'
            ? 'Completed'
            : session.status === 'failed'
              ? 'Failed'
              : session.status === 'pending'
          }
        </span>
        <button
          type="button"
          onClick={(e) => onDelete(e, sessionId)}
          className="rounded-full border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/15"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default SessionCard;

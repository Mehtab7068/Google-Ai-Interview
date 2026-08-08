import React from 'react';

const SessionCard = ({ session, onClick, onDelete }) => {
  const sessionId = session._id || session.sessionId || '';
  const createdAt = session.createdAt
    ? new Date(session.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : 'Unknown date';
  const statusText = session.status ? session.status.replace(/_/g, ' ').toUpperCase() : 'UNKNOWN';
  const interviewType = session.interviewType ? session.interviewType.replace('-', ' ') : 'Interview';
  const questionCount = session.count || session.questions?.length || '—';

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow duration-200">
      <button
        type="button"
        onClick={() => onClick(session)}
        className="w-full text-left"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{interviewType}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold text-slate-600">{statusText}</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">{session.role || 'Untitled Session'}</h3>
            <p className="text-sm text-slate-500">{session.level || 'Unknown level'} • {questionCount} questions</p>
          </div>
          <div className="text-right space-y-1">
            {session.status === 'completed' && (
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-600">Score</p>
            )}
            {session.status === 'completed' && (
              <p className="text-xl font-black text-slate-900">{session.overallScore ?? '-'}</p>
            )}
            <p className="text-xs text-slate-400">{createdAt}</p>
          </div>
        </div>
      </button>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-600">
          {session.status === 'completed'
            ? 'Completed'
            : session.status === 'failed'
              ? 'Failed'
              : 'In progress'}
        </span>
        <button
          type="button"
          onClick={(e) => onDelete(e, sessionId)}
          className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default SessionCard;

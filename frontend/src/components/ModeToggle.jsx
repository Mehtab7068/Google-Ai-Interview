const ModeToggle = ({ mode, onToggle }) => {
  const nextMode = mode === "dark" ? "light" : "dark"

  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-2 rounded-full border border-slate-800/80 bg-slate-950/50 px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-indigo-400/50 hover:text-indigo-400"
      aria-label={`Switch to ${nextMode} mode`}
      title={`Switch to ${nextMode} mode`}
    >
      {mode === "dark" ? (
        <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4" strokeWidth="2" />
          <path strokeLinecap="round" strokeWidth="2" d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
        </svg>
      ) : (
        <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.2 15.6A8.5 8.5 0 018.4 3.8 8.5 8.5 0 1020.2 15.6Z" />
        </svg>
      )}
      <span>{mode === "dark" ? "Light mode" : "Dark mode"}</span>
    </button>
  )
}

export default ModeToggle

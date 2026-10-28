import { useEffect, useState } from "react"

const THEMES = [
  { id: "midnight", label: "Midnight", colors: ["#6366f1", "#a855f7"] },
  { id: "ocean", label: "Ocean", colors: ["#06b6d4", "#0ea5e9"] },
  { id: "sunset", label: "Sunset", colors: ["#f97316", "#fb7185"] },
  { id: "forest", label: "Forest", colors: ["#22c55e", "#84cc16"] },
]

const ThemePicker = () => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = window.localStorage.getItem("ai-interviewer-theme")
    return THEMES.some((option) => option.id === savedTheme) ? savedTheme : "midnight"
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem("ai-interviewer-theme", theme)
  }, [theme])

  return (
    <div
      className="flex items-center gap-2 rounded-full border border-slate-800/80 bg-slate-950/50 px-3 py-2"
      role="group"
      aria-label="Choose color theme"
    >
      <span className="hidden lg:inline text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
        Theme
      </span>
      {THEMES.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => setTheme(option.id)}
          className={`flex h-6 w-6 items-center justify-center rounded-full transition-transform hover:scale-110 ${
            theme === option.id ? "ring-2 ring-white/80 ring-offset-2 ring-offset-slate-950" : ""
          }`}
          style={{
            background: `linear-gradient(135deg, ${option.colors[0]}, ${option.colors[1]})`,
          }}
          aria-label={`${option.label} theme`}
          aria-pressed={theme === option.id}
          title={`${option.label} theme`}
        />
      ))}
    </div>
  )
}

export default ThemePicker

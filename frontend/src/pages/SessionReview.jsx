import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import { getSessionById } from '../features/sessions/sessionSlice';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const formatDuration = (start, end) => {
    if (!start || !end) return 'N/A';
    const diff = new Date(end) - new Date(start);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
};

const sanitizeQuestionText = (text) => {
    return text.replace(/^\d+[\s\.\)]+/, '').trim();
};

const formatIdealAnswer = (text) => {
    try {
        if (!text) return "Pending evaluation.";

        let cleanText = text.trim();

        // 1. Remove Markdown code blocks if the AI added them (e.g., ```json ... ```)
        if (cleanText.startsWith('```')) {
            cleanText = cleanText.replace(/^```(json)?/, '').replace(/```$/, '').trim();
        }

        // 2. Check if it's a JSON object
        if (cleanText.startsWith('{') && cleanText.endsWith('}')) {
            const parsed = JSON.parse(cleanText);

            // Scenario A: The "Merged" Hallucination
            // The AI put the score object inside the answer. We extract just the answer.
            if (parsed.verbalAnswer || parsed.idealAnswer || parsed.idealanswer) {
                return parsed.verbalAnswer || parsed.idealAnswer || parsed.idealanswer;
            }

            // Scenario B: Structured Explanation
            const explanation = parsed.explanation || parsed.understanding || "";
            const code = parsed.code || parsed.codeExample || parsed.example || "";

            if (explanation || code) {
                return `${explanation}\n\n${code}`.trim();
            }
        }

        // Scenario C: It's just a normal string
        return text;
    } catch (e) {
        // If parsing fails, just show the raw text so nothing crashes
        return text;
    }
};

function SessionReview() {
    const { sessionId } = useParams();
    const dispatch = useDispatch();
    const { activeSession, isLoading } = useSelector(state => state.sessions);

    useEffect(() => {
        dispatch(getSessionById(sessionId));
    }, [dispatch, sessionId]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <div className="relative flex items-center justify-center">
                    <div className="animate-spin h-14 w-14 rounded-full border-2 border-indigo-500/20 border-t-indigo-500" />
                </div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">Generating Analysis...</p>
            </div>
        );
    }

    if (!activeSession || activeSession.status !== 'completed') {
        return (
            <div className="max-w-xl mx-auto mt-10 sm:mt-20 p-8 sm:p-12 bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] shadow-2xl text-center border border-slate-850 relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />
                <h2 className="text-xl sm:text-2xl font-black text-white mb-4 tracking-tight uppercase relative z-10">Report Not Ready</h2>
                <p className="text-slate-400 mb-8 font-medium text-sm sm:text-base relative z-10">This session is still being processed by our AI network.</p>
                <Link to="/" className="inline-block relative overflow-hidden group bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white px-8 py-3.5 sm:px-10 sm:py-4 rounded-2xl font-bold uppercase tracking-widest shadow-xl transition hover:shadow-indigo-500/25 active:scale-95 text-xs sm:text-sm relative z-10">
                    <span className="relative z-10">Dashboard</span>
                    <div className='absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 transition-transform duration-500' />
                </Link>
            </div>
        );
    }

    const { overallScore, metrics, role, level, questions, startTime, endTime } = activeSession;
    const finalMetrics = metrics || {};

    const barData = {
        labels: questions.map((_, i) => `Q${i + 1}`),
        datasets: [{
            label: 'Technical Score',
            data: questions.map(q => q.technicalScore || 0),
            backgroundColor: questions.map(q => (q.technicalScore || 0) > 70 ? '#6366f1' : '#a855f7'),
            borderRadius: 8,
        }],
    };

    return (
        <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 py-8 sm:py-12 space-y-8 sm:space-y-12 animate-in fade-in duration-700">

            {/* --- Header --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-850 pb-6 sm:pb-10">
                <div>
                    <span className="text-indigo-400 font-bold uppercase tracking-[0.25em] text-[10px] px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">Assessment Complete</span>
                    <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mt-4 uppercase">
                        {role} <span className="text-slate-400 font-medium lowercase block sm:inline">({level})</span>
                    </h1>
                </div>
            </div>

            {/* --- Summary Stats --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4 sm:pb-0 no-scrollbar snap-x">
                {[
                    { label: 'Overall Result', value: `${overallScore}%`, color: 'indigo' },
                    { label: 'Avg Technical', value: `${finalMetrics.avgTechnical}%`, color: 'slate' },
                    { label: 'Avg Confidence', value: `${finalMetrics.avgConfidence}%`, color: 'slate' },
                    { label: 'Session Time', value: formatDuration(startTime, endTime), color: 'slate' }
                ].map((stat, i) => (
                    <div key={i} className={`min-w-[160px] snap-center bg-slate-900/40 p-6 sm:p-8 rounded-[2rem] border border-slate-850 relative overflow-hidden group hover:border-slate-800 transition`}>
                        <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-500 to-violet-500" />
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-2">{stat.label}</p>
                        <p className={`text-2xl sm:text-4xl font-extrabold mt-3 leading-none pl-2 ${stat.color === 'indigo' ? 'text-indigo-400' : 'text-slate-100'}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* --- Chart --- */}
            <div className="bg-slate-900/40 p-6 sm:p-10 rounded-[2.5rem] border border-slate-850 shadow-xl">
                <h3 className="text-xs font-bold text-slate-400 mb-6 uppercase tracking-widest">Per-Question Performance</h3>
                <div className="h-64 sm:h-80">
                    <Bar
                        data={barData}
                        options={{
                            maintainAspectRatio: false,
                            plugins: { 
                                legend: { display: false },
                                tooltip: {
                                    backgroundColor: '#0f172a',
                                    borderColor: '#1e293b',
                                    borderWidth: 1,
                                    titleColor: '#f8fafc',
                                    bodyColor: '#e2e8f0',
                                }
                            },
                            scales: {
                                y: { 
                                    beginAtZero: true, 
                                    max: 100, 
                                    grid: { color: '#1e293b' },
                                    ticks: { color: '#94a3b8' }
                                },
                                x: { 
                                    grid: { display: false },
                                    ticks: { color: '#94a3b8' }
                                }
                            }
                        }}
                    />
                </div>
            </div>

            {/* --- Detailed Question Review --- */}
            <div className="space-y-6 sm:space-y-10">
                <h3 className="text-xl sm:text-2xl font-black text-white px-2 flex items-center tracking-tight uppercase">
                    <span className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mr-4 text-lg">✓</span>
                    Answer Intelligence
                </h3>
                <div className="space-y-6 sm:space-y-10">
                    {questions.map((q, index) => (
                        <div key={index} className="bg-slate-900/30 rounded-[2rem] border border-slate-850 shadow-lg overflow-hidden hover:border-slate-800 transition duration-350">
                            <div className="p-6 sm:p-10 space-y-6 sm:space-y-8">

                                {/* Header: Question & Scores */}
                                <div className="flex flex-col lg:flex-row justify-between items-start gap-4 sm:gap-6">
                                    <h4 className="text-lg sm:text-xl font-bold text-white flex-1 leading-snug">
                                        <span className="text-indigo-400 mr-2 font-black">Q{index + 1}.</span> {sanitizeQuestionText(q.questionText)}
                                    </h4>
                                    <div className="flex gap-2 shrink-0">
                                        <div className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border flex items-center gap-2 bg-indigo-500/10 border-indigo-500/20">
                                            <span className="text-[9px] font-bold uppercase text-indigo-400 tracking-wider">Tech</span>
                                            <span className="text-xs sm:text-sm font-black text-indigo-300">{q.technicalScore}%</span>
                                        </div>
                                        <div className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-violet-500/10 bg-violet-500/10 flex items-center gap-2">
                                            <span className="text-[9px] font-bold uppercase text-violet-400 tracking-wider">Conf</span>
                                            <span className="text-xs sm:text-sm font-black text-violet-300">{q.confidenceScore}%</span>
                                        </div>
                                    </div>
                                </div>

                                {/* --- User's Submission Display --- */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block ml-1">Your Submission</label>
                                    <div className="bg-slate-950/40 rounded-2xl border border-slate-850 overflow-hidden">

                                        {/* Display Code if available */}
                                        {q.userSubmittedCode && q.userSubmittedCode !== "undefined" && (
                                            <div className="p-4 sm:p-6 border-b border-slate-850 last:border-0">
                                                <span className="text-[9px] font-bold text-slate-500 uppercase mb-2 block tracking-wider">Submitted Code</span>
                                                <pre className="text-xs font-mono text-indigo-300 whitespace-pre-wrap overflow-x-auto">
                                                    {q.userSubmittedCode}
                                                </pre>
                                            </div>
                                        )}

                                        {/* Display Transcript if available */}
                                        {q.userAnswerText && (
                                            <div className="p-4 sm:p-6">
                                                <span className="text-[9px] font-bold text-slate-500 uppercase mb-2 block tracking-wider">Transcript / Verbal Answer</span>
                                                <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed">
                                                    "{q.userAnswerText}"
                                                </p>
                                            </div>
                                        )}

                                        {/* Fallback if nothing was recorded */}
                                        {(!q.userSubmittedCode || q.userSubmittedCode === "undefined") && !q.userAnswerText && (
                                            <div className="p-6 text-center text-slate-500 text-xs italic">
                                                No answer recorded.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Feedback & Ideal Answer Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10 pt-6 sm:pt-8 border-t border-slate-850/60">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block ml-1">AI Analytical Feedback</label>
                                        <div className="bg-[#030712]/40 p-4 sm:p-6 rounded-2xl text-xs sm:text-sm italic text-slate-300 border-l-4 border-indigo-500 leading-relaxed">
                                            "{q.aiFeedback}"
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block ml-1">Ideal Implementation</label>
                                        <pre className="bg-slate-950 text-slate-400 p-4 sm:p-6 rounded-2xl text-[11px] sm:text-xs overflow-x-auto whitespace-pre-wrap font-mono shadow-inner border border-slate-850 leading-relaxed">
                                            {formatIdealAnswer(q.idealAnswer)}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default SessionReview;

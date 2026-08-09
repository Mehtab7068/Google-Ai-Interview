import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { getSessionById, submitAnswer, endSession, resetSessionState } from '../features/sessions/sessionSlice';
import MonacoEditor from '@monaco-editor/react';
import { toast } from 'react-toastify';

const SUPPORTED_LANGUAGES = [
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'Python', value: 'python' },
  { label: 'Java', value: 'java' },
  { label: 'C++', value: 'cpp' },
  { label: 'C#', value: 'csharp' },
  { label: 'Go', value: 'go' },
  { label: 'Swift', value: 'swift' },
  { label: 'Kotlin', value: 'kotlin' },
  { label: 'R Language', value: 'r' },
  { label: 'SQL', value: 'sql' },
  { label: 'HTML', value: 'html' },
  { label: 'CSS', value: 'css' },
  { label: 'Solidity', value: 'solidity' },
  { label: 'Shell', value: 'shell' },
  { label: 'YAML', value: 'yaml' },
  { label: 'Markdown', value: 'markdown' },
  { label: 'Plain Text', value: 'plaintext' },
];

const ROLE_LANGUAGE_MAP = {
  "MERN Stack Developer": "javascript",
  "MEAN Stack Developer": "typescript",
  "Full Stack Python": "python",
  "Full Stack Java": "java",
  "Frontend Developer": "javascript",
  "Backend Developer": "javascript",
  "Data Scientist": "python",
  "Data Analyst": "python",
  "Machine Learning Engineer": "python",
  "DevOps Engineer": "shell",
  "Cloud Engineer (AWS/Azure/GCP)": "yaml",
  "Cybersecurity Engineer": "python",
  "Blockchain Developer": "solidity",
  "Mobile Developer (iOS/Android)": "swift",
  "Game Developer": "csharp",
  "QA Automation Engineer": "python",
  "UI/UX Designer": "css",
  "Product Manager": "markdown"
};

function InterviewRunner() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { activeSession, isLoading, message } = useSelector(state => state.sessions);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [submittedLocal, setSubmittedLocal] = useState({});

  const [drafts, setDrafts] = useState(() => {
    if (!sessionId || sessionId === 'undefined') return {};
    try {
      const saved = localStorage.getItem(`drafts_${sessionId}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Guard against invalid sessionId and prevent duplicate API loops
  useEffect(() => {
    if (!sessionId || sessionId === 'undefined') {
      toast.error("Invalid session ID. Redirecting to dashboard...");
      navigate('/', { replace: true });
      return;
    }

    dispatch(resetSessionState());
    dispatch(getSessionById(sessionId));
  }, [sessionId, dispatch, navigate]);

  const questions = Array.isArray(activeSession?.questions) ? activeSession.questions : [];
  const currentQuestion = questions[currentQuestionIndex] || null;
  const isGeneratingQuestions = ['pending', 'processing', 'AI_GENERATING_QUESTIONS', 'in-progress'].includes(activeSession?.status);

  // Refresh session details while question generation is still active and no questions exist yet.
  useEffect(() => {
    if (!sessionId) return;
    if (!activeSession || questions.length > 0) return;
    if (!isGeneratingQuestions) return;

    const interval = setInterval(() => {
      dispatch(getSessionById(sessionId));
    }, 8000);

    return () => clearInterval(interval);
  }, [sessionId, activeSession, questions.length, isGeneratingQuestions, dispatch]);

  // Automatically select default language based on role
  useEffect(() => {
    if (activeSession?.role) {
      const detectedLang = ROLE_LANGUAGE_MAP[activeSession.role] || "plaintext";
      setSelectedLanguage(detectedLang);
    }
  }, [activeSession?.role]);

  const isQuestionLocked = currentQuestion?.isSubmitted === true || submittedLocal[currentQuestionIndex] === true;
  const isProcessing = isQuestionLocked && !currentQuestion?.isEvaluated;

  // Persist code drafts to localStorage safely
  useEffect(() => {
    if (!sessionId || sessionId === 'undefined') return;
    const serializableDrafts = {};
    Object.keys(drafts).forEach((key) => {
      serializableDrafts[key] = { code: drafts[key]?.code || '' };
    });
    localStorage.setItem(`drafts_${sessionId}`, JSON.stringify(serializableDrafts));
  }, [drafts, sessionId]);

  // Cleanup media streams on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const getSupportedMimeType = () => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/aac',
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return '';
  };

  const startRecording = async () => {
    if (isQuestionLocked) return;

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : {};

      mediaRecorderRef.current = new MediaRecorder(stream, options);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.start(1000);
      setIsRecording(true);
      setRecordingTime(0);

      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => setRecordingTime((p) => p + 1), 1000);
    } catch (err) {
      console.error("Microphone Access Error:", err);
      toast.error("Microphone denied or not supported.");
    }
  };

  const stopRecording = () => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        clearInterval(timerIntervalRef.current);
        setIsRecording(false);
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const actualType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: actualType });
        const extension = actualType.includes('mp4') || actualType.includes('aac') ? 'mp4' : 'webm';
        const audioFile = new File([blob], `answer_${currentQuestionIndex}.${extension}`, { type: actualType });

        setDrafts((prev) => ({
          ...prev,
          [currentQuestionIndex]: {
            ...prev[currentQuestionIndex],
            audioBlob: blob,
            audioFile: audioFile
          },
        }));

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        clearInterval(timerIntervalRef.current);
        setIsRecording(false);
        resolve({ blob, audioFile });
      };

      mediaRecorderRef.current.stop();
    });
  };

  const handleNavigation = async (index) => {
    if (index >= 0 && index < questions.length) {
      if (isRecording) await stopRecording();
      setCurrentQuestionIndex(index);
      setRecordingTime(0);
    }
  };

  const updateDraftCode = (newCode) => {
    if (isQuestionLocked) return;
    setDrafts(prev => ({
      ...prev,
      [currentQuestionIndex]: { ...prev[currentQuestionIndex], code: newCode }
    }));
  };

  const handleSubmitAnswer = async () => {
    if (isQuestionLocked) return;

    let recordedData = null;
    if (isRecording) {
      recordedData = await stopRecording();
    }

    const draft = drafts[currentQuestionIndex];
    const code = draft?.code || '';
    let audio = recordedData?.audioFile || recordedData?.blob || draft?.audioFile || draft?.audioBlob;

    if (!audio && audioChunksRef.current && audioChunksRef.current.length > 0) {
      const type = mediaRecorderRef.current?.mimeType || 'audio/webm';
      audio = new Blob(audioChunksRef.current, { type });
    }

    if (!code && (!audio || audio.size === 0)) {
      toast.warning("Please provide code or an audio answer.");
      return;
    }

    if (audio && audio.size === 0) {
      toast.error("Recorded audio appears to be empty. Please re-record your answer.");
      return;
    }

    setSubmittedLocal((prev) => ({ ...prev, [currentQuestionIndex]: true }));

    const formData = new FormData();
    formData.append('questionIndex', currentQuestionIndex);
    if (code) formData.append('code', code);

    if (audio && audio.size > 0) {
      const filename = audio.name || `answer_${currentQuestionIndex}.${audio.type.includes('mp4') || audio.type.includes('aac') ? 'mp4' : 'webm'}`;
      formData.append('file', audio, filename);
    }

    dispatch(submitAnswer({ sessionId, formData }))
      .unwrap()
      .then(() => {
        audioChunksRef.current = [];
      })
      .catch((err) => {
        setSubmittedLocal((prev) => ({ ...prev, [currentQuestionIndex]: false }));
        toast.error("Submission failed. Please try again.");
      });
  };

  const isAnyQuestionProcessing = questions.some((q, i) => {
    return (q.isSubmitted || submittedLocal[i]) && !q.isEvaluated;
  });

  if (!sessionId || sessionId === 'undefined') {
    return null;
  }

  // Handle loading and question generation states
  if (!activeSession || (questions.length === 0 && isGeneratingQuestions)) {
    return (
      <div className="max-w-xl mx-auto my-20 p-8 rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl text-center">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full border-4 border-slate-700 border-t-teal-400 animate-spin text-teal-400" />
        <h2 className="text-2xl font-black text-white">Preparing Your Interview</h2>
        <p className="mt-3 text-sm text-slate-400">
          {message || "AI is generating tailored questions for your session. Please wait..."}
        </p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-20 p-8 rounded-3xl border border-rose-500/20 bg-slate-950 shadow-2xl text-center">
        <h2 className="text-2xl font-black text-white">Unable to generate questions</h2>
        <p className="mt-3 text-sm text-slate-400">
          {message || 'The interview generator failed or took too long. Please try again later.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-6 inline-flex items-center justify-center rounded-3xl bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/20 hover:brightness-105"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const currentDraft = drafts[currentQuestionIndex] || {};

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-40 text-slate-100">
      <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-800/80 bg-slate-950/90 p-6 shadow-2xl shadow-slate-950/40 mb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">{activeSession.role}</h1>
            <p className="mt-2 text-sm text-slate-400">Answer one question at a time, record your verbal response, or submit code for evaluation.</p>
          </div>
          <div className="inline-flex items-center gap-3 rounded-3xl bg-slate-900/90 px-5 py-3 text-sm text-slate-300 border border-slate-800 shadow-inner">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {questions.map((q, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleNavigation(i)}
              className={`h-3.5 w-3.5 rounded-full transition ${i === currentQuestionIndex
                ? 'bg-teal-400 scale-125 shadow-lg shadow-teal-500/30'
                : q.isEvaluated
                  ? 'bg-emerald-500'
                  : (q.isSubmitted || submittedLocal[i])
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-slate-700'
                }`}
            />
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-8 rounded-[2rem] shadow-2xl border border-slate-800 mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-teal-400">Current Question</p>
        <h2 className="mt-4 text-3xl font-black leading-snug text-white">{currentQuestion?.questionText}</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-slate-800/80 bg-slate-900/95 p-6 shadow-xl shadow-slate-950/40 min-h-[320px]">
          <div className="mb-6 flex items-center justify-between gap-4">
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-slate-400">Verbal Answer</p>
            <span className="rounded-full bg-slate-800/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-300">Audio</span>
          </div>

          {!isRecording && !currentDraft.audioBlob ? (
            <button
              onClick={startRecording}
              disabled={isQuestionLocked}
              className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-4xl text-white shadow-2xl shadow-cyan-500/20 transition-transform duration-300 hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-40"
            >
              🎤
            </button>
          ) : isRecording ? (
            <div className="text-center">
              <button
                onClick={stopRecording}
                className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-rose-500 text-4xl text-white shadow-2xl shadow-rose-500/25 animate-pulse"
              >
                ⏹
              </button>
              <p className="mt-4 text-sm font-semibold text-rose-300">Recording {recordingTime}s</p>
            </div>
          ) : (
            <div className="space-y-3 text-center">
              <p className="text-lg font-bold text-emerald-300">Audio Captured ✅</p>
              {!isQuestionLocked && (
                <button
                  onClick={() =>
                    setDrafts((prev) => ({
                      ...prev,
                      [currentQuestionIndex]: { ...prev[currentQuestionIndex], audioBlob: null, audioFile: null }
                    }))
                  }
                  className="text-sm font-semibold text-slate-300 underline decoration-slate-600 hover:text-white"
                >
                  Delete & Re-record
                </button>
              )}
            </div>
          )}
        </div>

        <div className="rounded-[2rem] border border-slate-800/80 bg-slate-900/95 shadow-xl shadow-slate-950/40 overflow-hidden h-[420px]">
          <div className="flex items-center justify-between gap-4 border-b border-slate-800/70 bg-slate-950/90 px-4 py-3">
            <span className="text-xs font-bold uppercase tracking-[0.35em] text-slate-400">Code Editor</span>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              disabled={isQuestionLocked}
              className="text-xs rounded-2xl border border-slate-800 bg-slate-900 px-3 py-2 text-slate-200 outline-none disabled:cursor-not-allowed disabled:bg-slate-800"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.value} value={l.value} className="bg-slate-950 text-white">
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <MonacoEditor
            height="100%"
            language={selectedLanguage}
            theme="vs-dark"
            value={currentDraft.code || ''}
            onChange={updateDraftCode}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              scrollBeyondLastLine: false,
              readOnly: isQuestionLocked,
              domReadOnly: isQuestionLocked,
              wordWrap: 'on',
            }}
          />
        </div>
      </div>

      {currentQuestion?.isEvaluated && (
        <div className="mt-6 rounded-[2rem] border border-emerald-500/20 bg-emerald-500/5 p-6 shadow-xl shadow-emerald-500/10">
          <h3 className="text-lg font-bold text-emerald-300">💡 AI Feedback</h3>
          <p className="mt-3 text-slate-200 leading-relaxed">{currentQuestion.aiFeedback}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <span className="rounded-3xl bg-slate-900/80 px-4 py-2 text-sm font-semibold text-white">Technical Score: {currentQuestion.technicalScore}</span>
            <span className="rounded-3xl bg-slate-900/80 px-4 py-2 text-sm font-semibold text-white">Confidence: {currentQuestion.confidenceScore}</span>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800/90 bg-slate-950/95 px-4 py-4 backdrop-blur-xl shadow-2xl shadow-slate-950/40">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => handleNavigation(currentQuestionIndex - 1)}
              disabled={currentQuestionIndex === 0}
              className="rounded-3xl border border-slate-700/80 bg-slate-900 px-5 py-3 text-sm font-bold uppercase tracking-[0.2em] text-slate-300 transition hover:border-teal-400 hover:text-white disabled:opacity-40"
            >
              ← Previous
            </button>
          </div>

          <div className="flex flex-col items-center gap-2 md:flex-row">
            {isProcessing && message && (
              <div className="rounded-full bg-slate-900/90 px-4 py-2 text-xs font-mono uppercase tracking-[0.2em] text-teal-300 shadow-inner">
                🤖 {message}...
              </div>
            )}

            <button
              onClick={handleSubmitAnswer}
              disabled={isQuestionLocked}
              className={`rounded-3xl px-8 py-3 text-sm font-black uppercase tracking-[0.2em] text-white shadow-2xl transition ${isProcessing
                ? 'bg-slate-700 cursor-wait'
                : currentQuestion?.isEvaluated
                  ? 'bg-emerald-500 hover:brightness-110'
                  : isQuestionLocked
                    ? 'bg-slate-700'
                    : 'bg-gradient-to-r from-teal-400 to-cyan-400 hover:scale-[1.01]'
                }`}
            >
              {isProcessing ? "Analyzing..." : currentQuestion?.isEvaluated ? "Answer Submitted" : isQuestionLocked ? "Submitted" : "Submit Answer"}
            </button>
          </div>

          <button
            onClick={() => handleNavigation(currentQuestionIndex + 1)}
            disabled={questions.length === 0 || currentQuestionIndex === questions.length - 1}
            className="rounded-3xl border border-slate-700/80 bg-slate-900 px-5 py-3 text-sm font-bold uppercase tracking-[0.2em] text-slate-300 transition hover:border-teal-400 hover:text-white disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

export default InterviewRunner;
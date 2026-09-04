import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

const Landing = () => {
    const navigate = useNavigate()
    const { user, isLoading: authLoading } = useSelector((state) => state.auth)

    // If already logged in, redirect to dashboard
    if (user && !authLoading) {
        navigate('/dashboard')
        return null
    }

    return (
        <div className='min-h-screen relative overflow-hidden'>
            {/* Animated Background */}
            <div className='absolute inset-0 bg-gradient-to-br from-[#030712] via-[#0a0f1a] to-[#030712]' />
            <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-600/5 via-transparent to-fuchsia-600/5' />

            {/* Floating Orbs */}
            <div className='absolute top-20 left-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl animate-blob duration-7000' />
            <div className='absolute top-40 right-20 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-blob duration-7000 delay-1000' />
            <div className='absolute bottom-20 left-20 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-3xl animate-blob duration-7000 delay-2000' />
            <div className='absolute bottom-40 right-10 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl animate-blob duration-7000 delay-3000' />

            {/* Grid Pattern Overlay */}
            <div className='absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:60px_60px]' />

            <div className='relative z-10 flex flex-col min-h-screen'>
                <main className='flex-grow flex flex-col'>
                    {/* Hero Section */}
                    <section className='relative z-10 flex-grow flex items-center justify-center px-4 py-20 sm:px-6 lg:px-8'>
                        <div className='max-w-7xl mx-auto w-full'>
                            <div className='text-center mb-16'>
                                <div className='inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-[0.25em] rounded-full mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500'>
                                    <span className='relative flex h-2 w-2'>
                                        <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75'></span>
                                        <span className='relative inline-flex rounded-full h-2 w-2 bg-indigo-500'></span>
                                    </span>
                                    Now with AI-powered voice interviews
                                </div>
                                <h1 className='text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1] mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100'>
                                    Master Technical Interviews
                                    <br />
                                    <span className='bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent'>
                                        with AI Voice Practice
                                    </span>
                                </h1>
                                <p className='text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200'>
                                    Practice real-time voice interviews with AI, get instant feedback on your answers,
                                    and track your progress. From coding challenges to system design - prepare like a pro.
                                </p>
                            </div>

                            {/* CTA Buttons */}
                            <div className='flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300'>
                                <Link
                                    to="/register"
                                    className='group relative w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white font-black uppercase tracking-[0.2em] text-base shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/40 transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] overflow-hidden'
                                >
                                    <span className='relative z-10'>Start Free Interview</span>
                                    <span className='absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
                                </Link>
                                <Link
                                    to="/login"
                                    className='group relative w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 text-white font-black uppercase tracking-[0.2em] text-base shadow-xl hover:border-indigo-500/50 hover:bg-slate-900/80 transition-all duration-300 hover:-translate-y-1 active:scale-[0.98]'
                                >
                                    <span className='relative z-10'>Sign In</span>
                                </Link>
                            </div>

                            {/* Trust Indicators */}
                            <div className='flex flex-wrap items-center justify-center gap-8 text-slate-500 text-xs uppercase tracking-[0.3em] animate-in fade-in duration-500 delay-400'>
                                <span className='flex items-center gap-2'>
                                    <svg className='w-4 h-4 text-indigo-500' fill='currentColor' viewBox='0 0 20 20'><path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' /></svg>
                                    SOC 2 Certified
                                </span>
                                <span className='flex items-center gap-2'>
                                    <svg className='w-4 h-4 text-indigo-500' fill='currentColor' viewBox='0 0 20 20'><path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' /></svg>
                                    10K+ Developers
                                </span>
                                <span className='flex items-center gap-2'>
                                    <svg className='w-4 h-4 text-indigo-500' fill='currentColor' viewBox='0 0 20 20'><path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' /></svg>
                                    94% Success Rate
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* Features Section */}
                    <section id='features' className='relative z-10 py-20 px-4 sm:px-6 lg:px-8'>
                        <div className='max-w-7xl mx-auto'>
                            <div className='text-center mb-16'>
                                <h2 className='text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4'>
                                    Everything you need to <span className='bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent'>ace your interviews</span>
                                </h2>
                                <p className='text-slate-400 text-lg max-w-2xl mx-auto'>
                                    Comprehensive AI-powered interview preparation platform
                                </p>
                            </div>

                            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                                {[
                                    {
                                        icon: (
                                            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' />
                                            </svg>
                                        ),
                                        title: 'Voice-Based Interviews',
                                        desc: 'Practice with real-time AI voice conversations. Speak naturally and get evaluated on communication, technical depth, and confidence.'
                                    },
                                    {
                                        icon: (
                                            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' />
                                            </svg>
                                        ),
                                        title: 'Instant AI Feedback',
                                        desc: 'Get detailed scoring on technical accuracy, communication clarity, and problem-solving approach with actionable improvement suggestions.'
                                    },
                                    {
                                        icon: (
                                            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' />
                                            </svg>
                                        ),
                                        title: 'Progress Tracking',
                                        desc: 'Track your improvement over time with detailed analytics, session history, and personalized recommendations.'
                                    },
                                    {
                                        icon: (
                                            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' />
                                            </svg>
                                        ),
                                        title: 'Role-Specific Questions',
                                        desc: 'Tailored questions for MERN, Python, Java, DevOps, Data Science, and 15+ other roles across Junior to Senior levels.'
                                    },
                                    {
                                        icon: (
                                            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M13 10V3L4 14h7v7l9-11h-7z' />
                                            </svg>
                                        ),
                                        title: 'Coding & System Design',
                                        desc: 'Practice algorithmic coding challenges and system design discussions with real-time code evaluation.'
                                    },
                                    {
                                        icon: (
                                            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                                            </svg>
                                        ),
                                        title: 'Interview Review',
                                        desc: 'Review complete session transcripts, AI evaluations, and ideal answers to learn from every practice session.'
                                    }
                                ].map((feature, index) => (
                                    <div
                                        key={feature.title}
                                        className='group relative p-6 sm:p-8 bg-slate-900/40 backdrop-blur-xl border border-slate-850 rounded-3xl hover:border-indigo-500/30 hover:bg-slate-900/60 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 duration-500'
                                        style={{ animationDelay: `${index * 100}ms` }}
                                    >
                                        <div className='absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl' />
                                        <div className='relative z-10'>
                                            <div className='flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-indigo-400 group-hover:from-indigo-500/40 group-hover:to-violet-500/40 group-hover:text-white transition-all duration-300'>
                                                {feature.icon}
                                            </div>
                                            <h3 className='mt-5 text-xl font-bold text-white'>{feature.title}</h3>
                                            <p className='mt-3 text-slate-400 leading-relaxed'>{feature.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* How It Works Section */}
                    <section id='how-it-works' className='relative z-10 py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-indigo-500/5 to-transparent'>
                        <div className='max-w-7xl mx-auto'>
                            <div className='text-center mb-16'>
                                <h2 className='text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4'>
                                    How it <span className='bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent'>Works</span>
                                </h2>
                                <p className='text-slate-400 text-lg max-w-2xl mx-auto'>
                                    Start practicing in minutes with our streamlined process
                                </p>
                            </div>

                            <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
                                {[
                                    { step: '01', title: 'Choose Your Role', desc: 'Select from 15+ roles like MERN Stack, Python, Java, DevOps, Data Science, and more. Pick your experience level from Junior to Senior.' },
                                    { step: '02', title: 'Start Voice Interview', desc: 'Click record and answer questions naturally. Our AI listens, transcribes, and evaluates in real-time - just like a real interviewer.' },
                                    { step: '03', title: 'Get Detailed Feedback', desc: 'Receive instant scores on technical accuracy, communication, and problem-solving. See ideal answers and track your progress over time.' }
                                ].map((item, index) => (
                                    <div
                                        key={item.step}
                                        className='relative p-8 bg-slate-900/40 backdrop-blur-xl border border-slate-850 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-500'
                                        style={{ animationDelay: `${index * 150}ms` }}
                                    >
                                        <div className='absolute -top-4 -right-4 text-6xl font-black text-indigo-500/10'>{item.step}</div>
                                        <div className='relative z-10'>
                                            <h3 className='text-xl font-bold text-white mb-3'>{item.title}</h3>
                                            <p className='text-slate-400 leading-relaxed'>{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* CTA Section */}
                    <section className='relative z-10 py-20 px-4 sm:px-6 lg:px-8'>
                        <div className='max-w-4xl mx-auto text-center'>
                            <div className='relative p-10 sm:p-16 bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-500/10 border border-indigo-500/20 rounded-4xl overflow-hidden'>
                                <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 to-transparent' />
                                <div className='relative z-10'>
                                    <h2 className='text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-6'>
                                        Ready to <span className='bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent'>level up</span> your interview skills?
                                    </h2>
                                    <p className='text-slate-300 text-lg mb-8 max-w-2xl mx-auto'>
                                        Join thousands of developers who are already practicing with AI Interviewer.
                                        Your next interview starts now.
                                    </p>
                                    <div className='flex flex-col sm:flex-row items-center justify-center gap-4'>
                                        <Link
                                            to="/register"
                                            className='group relative w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white font-black uppercase tracking-[0.2em] text-base shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/40 transition-all duration-300 hover:-translate-y-1 active:scale-[0.98]'
                                        >
                                            Start Free Interview
                                        </Link>
                                        <Link
                                            to="/login"
                                            className='group relative w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 text-white font-black uppercase tracking-[0.2em] text-base shadow-xl hover:border-indigo-500/50 hover:bg-slate-900/80 transition-all duration-300 hover:-translate-y-1 active:scale-[0.98]'
                                        >
                                            Sign In
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                {/* Footer */}
                <footer className='relative z-10 border-t border-slate-900 bg-[#030712]/50 backdrop-blur-xl'>
                    <div className='max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8'>
                        <div className='grid grid-cols-1 md:grid-cols-4 gap-8 mb-12'>
                            <div className='md:col-span-2'>
                                <Link to="/" className='flex items-center gap-3'>
                                    <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-lg shadow-indigo-500/20'>
                                        <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5' />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className='text-base font-black uppercase tracking-[0.35em] text-white'>
                                            AI <span className='bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent'>INT</span><span className='hidden sm:inline bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent'>erviewer</span>
                                        </p>
                                        <p className='text-[10px] uppercase tracking-[0.25em] text-slate-500'>Interview prep, reimagined</p>
                                    </div>
                                </Link>
                                <p className='mt-6 text-slate-500 text-sm max-w-xs'>
                                    AI-powered interview preparation platform helping developers master technical interviews through voice-based practice and instant feedback.
                                </p>
                            </div>
                            <div>
                                <h4 className='text-xs font-bold uppercase tracking-[0.25em] text-slate-400 mb-4'>Product</h4>
                                <ul className='space-y-2 text-sm text-slate-500 hover:text-white transition-colors'>
                                    <li><Link to="#features" className='hover:text-indigo-400'>Features</Link></li>
                                    <li><Link to="#how-it-works" className='hover:text-indigo-400'>How it Works</Link></li>
                                    <li><Link to="#pricing" className='hover:text-indigo-400'>Pricing</Link></li>
                                    <li><Link to="/register" className='hover:text-indigo-400'>Get Started</Link></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className='text-xs font-bold uppercase tracking-[0.25em] text-slate-400 mb-4'>Company</h4>
                                <ul className='space-y-2 text-sm text-slate-500 hover:text-white transition-colors'>
                                    <li><Link href='#' className='hover:text-indigo-400'>About</Link></li>
                                    <li><Link href='#' className='hover:text-indigo-400'>Blog</Link></li>
                                    <li><Link href='#' className='hover:text-indigo-400'>Careers</Link></li>
                                    <li><Link href='#' className='hover:text-indigo-400'>Contact</Link></li>
                                </ul>
                            </div>
                        </div>
                        <div className='pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4'>
                            <p className='text-xs text-slate-500'>
                                © {new Date().getFullYear()} AI Interviewer. All rights reserved.
                            </p>
                            <div className='flex items-center gap-6'>
                                <a href='#' className='text-slate-500 hover:text-indigo-400 transition-colors' aria-label='Twitter'>
                                    <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'><path d='M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z' /></svg>
                                </a>
                                <a href='#' className='text-slate-500 hover:text-indigo-400 transition-colors' aria-label='GitHub'>
                                    <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'><path d='M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z' /></svg>
                                </a>
                                <a href='#' className='text-slate-500 hover:text-indigo-400 transition-colors' aria-label='LinkedIn'>
                                    <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'><path d='M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' /></svg>
                                </a>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    )
}

export default Landing
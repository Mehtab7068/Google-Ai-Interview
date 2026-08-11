import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { login, googleLogin, reset } from '../features/auth/authSlice'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const { email, password } = formData

  const navigate = useNavigate()
  const dispatch = useDispatch()

  const { user, isLoading, isError, isSuccess, message } = useSelector((state) => state.auth)

  const googleClientId =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLIENT_ID) ||
    process.env.REACT_APP_GOOGLE_CLIENT_ID

  useEffect(() => {
    if (isError) {
      toast.error(message)
      dispatch(reset())
    }

    if (isSuccess || user) {
      navigate('/')
      dispatch(reset())
    }
  }, [user, isError, isSuccess, message, navigate, dispatch])

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value
    }))
  }

  const onSubmit = (e) => {
    e.preventDefault()
    const userData = {
      email,
      password
    }
    dispatch(login(userData))
  }

  const handleGoogleSuccess = (credentialResponse) => {
    if (credentialResponse?.credential) {
      dispatch(googleLogin(credentialResponse.credential))
    } else {
      toast.error('Something went wrong. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className='flex flex-col justify-center items-center min-h-[70vh]'>
        <div className='relative flex items-center justify-center'>
          <div className='animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500'></div>
          <div className='absolute h-10 w-10 rounded-full bg-indigo-500/10 blur-sm'></div>
        </div>
        <p className='text-sm text-slate-400 mt-4 tracking-widest uppercase animate-pulse'>Authenticating...</p>
      </div>
    )
  }

  return (
    <div className='flex justify-center items-center min-h-[80vh] px-4 py-8 sm:px-6 lg:px-8'>
      <div className='w-full max-w-lg bg-slate-900/60 backdrop-blur-xl p-8 sm:p-12 border border-slate-850 rounded-[2.5rem] shadow-2xl relative overflow-hidden group hover:border-slate-800 transition-all duration-550'>
        {/* Decorative corner glows */}
        <div className='absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/15 transition-all duration-500' />
        <div className='absolute -bottom-24 -left-24 w-48 h-48 bg-violet-500/5 rounded-full blur-3xl group-hover:bg-violet-500/10 transition-all duration-500' />

        <div className='text-center mb-8 relative z-10'>
          <div className='inline-flex px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-[0.25em] rounded-full mb-3'>
            AI Interviewer
          </div>
          <h1 className='text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight'>
            Welcome <span className='bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent'>Back</span>
          </h1>
          <p className='text-slate-400 mt-3 text-sm sm:text-base'>
            Sign in to sharpen your technical skills.
          </p>
        </div>

        <form onSubmit={onSubmit} className='space-y-5 relative z-10'>
          <div className='space-y-1.5'>
            <label className='text-xs font-bold uppercase tracking-wider text-slate-400 ml-1'>Email</label>
            <input
              type="email"
              name="email"
              value={email}
              className='w-full px-4 py-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-white placeholder-slate-600 transition-all duration-300'
              placeholder='name@example.com'
              onChange={onChange}
              required
            />
          </div>

          <div className='space-y-1.5'>
            <label className='text-xs font-bold uppercase tracking-wider text-slate-400 ml-1'>Password</label>
            <input
              type="password"
              name="password"
              value={password}
              className='w-full px-4 py-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-white placeholder-slate-600 transition-all duration-300'
              placeholder='••••••••'
              onChange={onChange}
              required
            />
          </div>

          <button
            type="submit"
            className='w-full relative overflow-hidden group/btn bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white py-4 rounded-2xl font-bold transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/25 mt-4 active:scale-[0.98]'
          >
            <span className='relative z-10'>Login to Account</span>
            <div className='absolute inset-0 -translate-x-full group-hover/btn:translate-x-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 transition-transform duration-500' />
          </button>
        </form>

        <div className="my-8 flex items-center relative z-10">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="mx-4 text-slate-500 text-[10px] font-bold tracking-widest uppercase">
            Social Login
          </span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        <div className="w-full flex items-center justify-center relative z-10 bg-slate-950/40 p-2.5 border border-slate-800/80 rounded-2xl">
          <GoogleOAuthProvider clientId={googleClientId || ''}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Google login failed')}
              theme="filled_dark"
              size="large"
              width="100%"
              text="continue_with"
              shape="rectangular"
            />
          </GoogleOAuthProvider>
        </div>

        <p className="mt-8 text-center text-sm text-slate-400 relative z-10">
          New here?{' '}
          <Link to="/register" className="text-indigo-400 font-bold hover:text-indigo-300 transition hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login

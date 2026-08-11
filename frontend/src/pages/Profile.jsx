import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import { updateProfile, reset } from '../features/auth/authSlice'

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

const inputBase = 'w-full bg-slate-950/60 border border-slate-800 rounded-2xl p-4 font-semibold text-slate-200 text-base transition-all duration-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none';

const Profile = () => {
  const dispatch = useDispatch();
  const { user, isSuccess, isError, message, isProfileLoading } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    preferredRole: user?.preferredRole || '',
  })

  useEffect(() => {
    if (!isError && !isSuccess) return
    if (isError) toast.error(message)
    if (isSuccess) toast.success('Profile Updated Successfully')
    dispatch(reset())
  }, [isError, isSuccess, message, dispatch])

  useEffect(() => {
    if (user) {
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        preferredRole: user?.preferredRole || '',
      });
    }
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (formData.name === user.name && formData.preferredRole === user.preferredRole) {
      toast.info('No changes to save.')
      return
    }
    dispatch(updateProfile(formData))
  }

  return (
    <div className='min-h-[80vh] max-w-4xl mx-auto px-4 py-6 sm:px-6 sm:py-12 pb-24'>
      <div className='bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-8 sm:p-12 border border-slate-850 relative overflow-hidden group hover:border-slate-800 transition-all duration-500'>
        {/* Ambient glow backgrounds */}
        <div className='absolute -top-32 -right-32 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl' />
        <div className='absolute -bottom-32 -left-32 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl' />

        <header className='mb-8 relative z-10'>
          <div className='inline-flex px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-[0.25em] rounded-full mb-3'>
            Preferences
          </div>
          <h1 className='text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight'>Edit Profile</h1>
          <p className='text-slate-400 mt-1.5 text-sm sm:text-base'>
            Update your professional details and preferred interview target role.
          </p>
        </header>

        <form onSubmit={handleSubmit} className='space-y-6 relative z-10'>
          <FormField label="Full Name">
            <input
              type="text"
              className={inputBase}
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder='Enter your name'
              required
            />
          </FormField>

          <FormField label="Email Address (Fixed)" muted>
            <input
              type="email"
              className='w-full bg-slate-950/40 border border-slate-900/50 rounded-2xl p-4 font-semibold text-slate-500 text-base cursor-not-allowed outline-none'
              disabled
              value={formData.email}
            />
          </FormField>

          <FormField label="Target Role">
            <div className='relative'>
              <select 
                name="preferredRole" 
                value={formData.preferredRole} 
                onChange={handleChange} 
                className={`${inputBase} appearance-none pr-10 cursor-pointer`}
              >
                {ROLES.map((role) => (
                  <option key={role} value={role} className="bg-slate-950 text-white">
                    {role}
                  </option>
                ))}
              </select>
              <SelectArrow />
            </div>
          </FormField>

          <div className='pt-4'>
            <button
              type='submit'
              disabled={isProfileLoading}
              className={`w-full flex items-center justify-center gap-2 py-4 font-bold rounded-2xl relative overflow-hidden group/btn transition-all duration-300 active:scale-[0.98] ${isProfileLoading ? 'bg-slate-800 text-slate-500 cursor-wait' : 'bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white hover:shadow-lg hover:shadow-indigo-500/20'}`}
            >
              {isProfileLoading ? (
                <Loader />
              ) : (
                <>
                  <span className="relative z-10">Save Changes</span>
                  <div className='absolute inset-0 -translate-x-full group-hover/btn:translate-x-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 transition-transform duration-500' />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Profile

function FormField({ label, children, muted }) {
  return (
    <div className={`space-y-2 ${muted ? 'opacity-60' : ''}`}>
      <label className='ml-1 text-xs font-bold text-slate-400 uppercase tracking-widest'>{label}</label>
      {children}
    </div>
  )
}

function SelectArrow() {
  return (
    <div className='absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400'>
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.5"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </div>
  )
}

function Loader() {
  return (
    <div className="flex items-center gap-2">
      <span className='w-5 h-5 border-2 border-indigo-450 border-t-transparent animate-spin rounded-full' />
      <span>Saving changes...</span>
    </div>
  )
}

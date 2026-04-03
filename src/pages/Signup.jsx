import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

const EyeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
  </svg>
);

export default function Signup() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
          }
        }
      });
      if (authError) throw authError;
      if (data?.session) {
        navigate('/talent', { replace: true });
      } else {
        navigate('/login', { state: { message: 'Registration successful. Please check your email to verify your account.' } });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="hero-bg min-h-screen flex flex-col items-center justify-center p-6 relative">
      <div className="grid-pattern fixed inset-0 pointer-events-none" />
      <div className="relative z-10 w-full max-w-lg fade-in">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-white/10 flex items-center justify-center shadow-lg shadow-blue-500/10 mb-4">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-2xl font-900 text-white tracking-tight leading-tight">Create Account</h1>
          <p className="text-slate-400 text-sm mt-1">Join the CastingHub platform today</p>
        </div>
        <div className="bg-slate-800/60 backdrop-blur-xl border border-white/[.07] rounded-2xl overflow-hidden shadow-2xl relative">
          <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 to-purple-600 absolute top-0 left-0" />
          <div className="p-7 pt-9">
            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-3">
                <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium text-red-200">{error}</p>
              </div>
            )}
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-300">First Name</label>
                  <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" placeholder="John" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-300">Last Name</label>
                  <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)} className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" placeholder="Doe" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-300">Email Address</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" placeholder="name@example.com" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-300">Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-4 pr-12 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" placeholder="••••••••" minLength="6" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-blue-400">
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-300">Confirm Password</label>
                <div className="relative">
                  <input type={showConfirmPassword ? 'text' : 'password'} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full pl-4 pr-12 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" placeholder="••••••••" minLength="6" />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-blue-400">
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="w-full mt-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-800 py-3 rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? 'Creating account...' : 'Sign Up'}
              </button>
            </form>
            <div className="mt-6 text-center border-t border-white/5 pt-5">
              <p className="text-xs text-slate-400">
                Already have an account? <Link to="/login" className="text-blue-400 font-600 hover:text-blue-300 transition-colors">Sign In</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
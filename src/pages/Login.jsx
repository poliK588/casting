import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const { isReady, isAuthenticated, profile } = useAuth();

  useEffect(() => {
    // If user is authenticated, route them. ProtectedRoute handles the null profile edge case.
    if (isReady && isAuthenticated) {
      const target = profile?.role === 'admin' ? '/admin' : '/talent';
      navigate(target, { replace: true });
    }
  }, [isReady, isAuthenticated, profile, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

    } catch (err) {
      setError(err.message || 'Failed to authenticate');
    } finally {
      setIsLoading(false); 
    }
  };

  return (
    <div className="hero-bg h-screen overflow-hidden flex flex-col items-center justify-center p-6 relative">
      <div className="grid-pattern fixed inset-0 pointer-events-none" />
      <div className="relative z-10 w-full max-w-md fade-in">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-white/10 flex items-center justify-center shadow-lg shadow-blue-500/10 mb-4">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-900 text-white tracking-tight leading-tight">Welcome back</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to your CastingHub account</p>
        </div>

        <div className="bg-slate-800/60 backdrop-blur-xl border border-white/[.07] rounded-2xl overflow-hidden shadow-2xl">
          <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 to-purple-600 absolute top-0 left-0" />
          <div className="p-7">
            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-3">
                <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium text-red-200">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-300">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  placeholder="valery@castinghub.com"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-300">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || isReady === false}
                className="w-full mt-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 text-white text-sm font-800 py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-xs text-slate-400">
                New to CastingHub? <Link to="/signup" className="text-blue-400 font-600 hover:text-blue-300 transition-colors">Create account</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
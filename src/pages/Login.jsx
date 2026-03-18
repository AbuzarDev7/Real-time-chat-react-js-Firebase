import React, { useState } from 'react';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseconfig/firebaseConfig';
import backgroundImage from '../assets/images/background.png';
import logoIcon from '../assets/images/logo_icon.png';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      navigate('/chat');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="flex items-center justify-end min-h-screen p-6 md:p-20 bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>

      <div className="flex flex-col items-center md:items-start w-full max-w-[450px] relative z-10 animate-in fade-in slide-in-from-right-10 duration-700">
        <div className="flex flex-col items-center md:items-start mb-8 w-full px-4 md:px-0">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-xl mb-4 backdrop-blur-md">
            <img src={logoIcon} alt="Logo" className="w-10 h-10 object-contain" />
          </div>
          <h2 className="text-slate-200 font-semibold text-lg tracking-normal">Chat App</h2>
          <div className="h-0.5 w-8 bg-indigo-500 rounded-full mt-1"></div>
        </div>

        <div className="glass w-full p-8 md:p-10 flex flex-col items-center md:items-start">
          <h1 className="gradient-text text-4xl mb-2">Welcome Back</h1>
          <p className="text-slate-300 mb-8">Sign in to continue chatting</p>

        {error && <div className="w-full bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-6 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="w-full space-y-5">
          <div>
            <label className="block text-slate-400 text-sm mb-2 px-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
              <input
                type="email"
                required
                placeholder="john@example.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-indigo-500/50 transition-all text-slate-100"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2 px-1">
              <label className="text-slate-400 text-sm">Password</label>
              <a href="#" className="text-xs text-indigo-400 hover:underline">Forgot?</a>
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-indigo-500/50 transition-all text-slate-100"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Log In"}
          </button>
        </form>

        <p className="mt-8 text-slate-400">
          Don't have an account?{' '}
          <Link to="/signup" className="text-indigo-400 font-semibold hover:underline">
            Sign Up
          </Link>
        </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

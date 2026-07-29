import React, { useState } from 'react';
import { User, Mail, Lock, Loader2, Sun, Moon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { auth, database } from '../firebaseconfig/firebaseConfig';
import { ref, set, serverTimestamp } from 'firebase/database';
import { useTheme } from '../context/ThemeContext';
import backgroundImage from '../assets/images/background.png';
import logoIcon from '../assets/images/logo_icon.png';

const Signup = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Create User
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 2. Update Profile (Display Name)
      await updateProfile(user, { displayName: formData.username });

      // 3. Store User in Realtime Database
      await set(ref(database, 'users/' + user.uid), {
        uid: user.uid,
        displayName: formData.username,
        email: formData.email,
        online: false,
        createdAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
      });

      // 4. Sign out user so they are redirected to login page
      await signOut(auth);

      navigate('/login');

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="flex items-center justify-end min-h-screen p-6 md:p-20 bg-cover bg-center bg-no-repeat relative transition-all duration-500"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-slate-950/60 dark:bg-black/70 backdrop-blur-[4px] transition-all duration-500"></div>

      {/* Theme Switcher Button Top Right */}
      <button 
        onClick={toggleTheme}
        className="absolute top-6 right-6 z-20 p-3 rounded-2xl glass-card text-slate-200 hover:text-white hover:scale-105 transition-all shadow-lg flex items-center gap-2 text-sm font-medium"
        title="Toggle Light/Dark Theme"
      >
        {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-400" />}
        <span className="hidden sm:inline">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
      </button>

      <div className="flex flex-col items-center md:items-start w-full max-w-[450px] relative z-10 animate-in fade-in slide-in-from-right-10 duration-700">
        <div className="flex flex-col items-center md:items-start mb-8 w-full px-4 md:px-0">
          <div className="w-16 h-16 rounded-2xl bg-white/10 dark:bg-white/5 flex items-center justify-center border border-white/20 shadow-2xl mb-4 backdrop-blur-md">
            <img src={logoIcon} alt="Logo" className="w-10 h-10 object-contain drop-shadow-md" />
          </div>
          <h2 className="text-white font-bold text-xl tracking-tight font-['Outfit']">Real-Time Chat</h2>
          <div className="h-1 w-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mt-1.5 shadow-sm"></div>
        </div>

        <div className="glass-card w-full p-8 md:p-10 flex flex-col items-center md:items-start rounded-3xl">
          <h1 className="gradient-heading text-4xl font-extrabold mb-2 font-['Outfit']">Create Account</h1>
          <p className="text-slate-300 dark:text-slate-400 mb-8 text-sm">Join our real-time messaging community</p>

          {error && (
            <div className="w-full bg-red-500/10 border border-red-500/30 text-red-400 p-3.5 rounded-2xl mb-6 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full space-y-5">
            <div>
              <label className="block text-slate-300 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 px-1">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors" size={18} />
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  className="w-full bg-white/10 dark:bg-white/5 border border-white/15 dark:border-white/10 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-100 placeholder:text-slate-400 text-sm"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 px-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors" size={18} />
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  className="w-full bg-white/10 dark:bg-white/5 border border-white/15 dark:border-white/10 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-100 placeholder:text-slate-400 text-sm"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 px-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors" size={18} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/10 dark:bg-white/5 border border-white/15 dark:border-white/10 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-100 placeholder:text-slate-400 text-sm"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-3.5 rounded-2xl shadow-xl shadow-indigo-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Sign Up"}
            </button>
          </form>

          <p className="mt-8 text-slate-300 dark:text-slate-400 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 font-semibold hover:underline">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;

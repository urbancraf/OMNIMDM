
import React, { useState } from 'react';
import { LogIn, Command, Mail, Lock, Eye, EyeOff, User as UserIcon, Loader2 } from 'lucide-react';
import { User } from '../types.ts';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [userId, setUserId] = useState('Admin');
  const [password, setPassword] = useState('Sandesh@098!');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Simulate API Auth with provided credentials
    setTimeout(() => {
      if (userId === 'Admin' && password === 'Sandesh@098!') {
        onLogin({
          id: 'u1',
          email: 'admin@omnipim.io',
          name: 'System Admin',
          role: 'System_Tech_Admin'
        });
      } else {
        setError('Invalid User ID or Password');
        setIsLoading(false);
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white shadow-2xl shadow-indigo-200 mb-6">
            <Command size={36} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">OmniPIM</h1>
          <p className="text-slate-400 mt-2 font-medium">Enterprise Product Information Management</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-slate-200 border border-slate-100 space-y-8 relative overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center space-y-4">
              <Loader2 size={40} className="text-indigo-600 animate-spin" />
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Establishing Handshake...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-2xl text-center animate-in shake duration-300">
              {error}
            </div>
          )}
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">Identity ID</label>
              <div className="relative">
                <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="text" 
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-slate-900"
                  placeholder="User Identifier"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">Security Key</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-14 py-4 rounded-2xl bg-slate-50 border-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-slate-900"
                  placeholder="••••••••"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative flex items-center">
                <input type="checkbox" className="peer w-5 h-5 opacity-0 absolute cursor-pointer" />
                <div className="w-5 h-5 bg-slate-50 border border-slate-200 rounded-md peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all" />
              </div>
              <span className="text-xs font-bold text-slate-400 group-hover:text-slate-600 transition-colors uppercase tracking-tight">Stay signed in</span>
            </label>
            <button type="button" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-tight">Access Recovery</button>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.15em] shadow-2xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            Authorize Access
          </button>
        </form>

        <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] leading-relaxed">
          Proprietary Intelligence Core <br />
          &copy; {new Date().getFullYear()} OmniCommerce Solutions
        </p>
      </div>
    </div>
  );
};

export default Login;

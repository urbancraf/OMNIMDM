
import React, { useState } from 'react';
import { 
  Database, 
  Key, 
  Save, 
  ShieldCheck, 
  Terminal, 
  Eye, 
  EyeOff, 
  ShieldAlert,
  Server,
  Activity,
  ChevronRight,
  Command,
  CheckCircle2,
  Lock,
  User as UserIcon
} from 'lucide-react';
import { User, SystemConfig } from '../types';

interface SystemSettingsProps {
  currentUser: User;
  config: SystemConfig;
  setConfig: React.Dispatch<React.SetStateAction<SystemConfig>>;
}

const SystemSettings: React.FC<SystemSettingsProps> = ({ currentUser, config, setConfig }) => {
  const [formData, setFormData] = useState<SystemConfig>({ ...config });
  const [showPass, setShowPass] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const isTechAdmin = currentUser.role === 'System_Tech_Admin';

  if (!isTechAdmin) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in duration-700">
        <div className="w-24 h-24 bg-rose-50 rounded-[2rem] flex items-center justify-center text-rose-500 shadow-xl shadow-rose-100">
          <ShieldAlert size={48} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Access Denied</h2>
          <p className="text-slate-400 font-medium max-w-sm mx-auto mt-2">
            Infrastructure orchestration is restricted to System Tech Admin authorities. 
            Please contact your platform architect for changes.
          </p>
        </div>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setConfig(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-[0.2em] mb-1">Architecture Controls</p>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Infrastructure Console</h2>
          <p className="text-sm text-slate-400 font-medium mt-2">Managing the foundational connectivity and security layer.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 px-4 rounded-2xl border border-slate-100 shadow-sm">
           <Activity size={16} className="text-emerald-500 animate-pulse" />
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Health: Nominal</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7">
          <form onSubmit={handleSave} className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-10">
            <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
              <div className="p-3 bg-slate-900 text-white rounded-2xl">
                <Server size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Persistence Layer</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Master Database Configuration</p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">DB Server Host Name</label>
                <div className="relative group">
                  <Database className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                  <input 
                    type="text" 
                    placeholder="e.g. cluster-01.us-east.aws.mongodb.net"
                    className="w-full pl-16 pr-6 py-5 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300"
                    value={formData.dbHost}
                    onChange={(e) => setFormData({ ...formData, dbHost: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">Infra DB User ID</label>
                  <div className="relative group">
                    <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    <input 
                      type="text" 
                      placeholder="Infrastructure Username"
                      className="w-full pl-16 pr-6 py-5 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300"
                      value={formData.dbUser}
                      onChange={(e) => setFormData({ ...formData, dbUser: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">Infra DB Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    <input 
                      type={showPass ? "text" : "password"} 
                      placeholder="Infrastructure Password"
                      className="w-full pl-16 pr-16 py-5 bg-slate-50 border-none rounded-2xl text-slate-900 font-mono text-sm focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300"
                      value={formData.dbPass}
                      onChange={(e) => setFormData({ ...formData, dbPass: e.target.value })}
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                    >
                      {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isSaved && (
                  <div className="flex items-center gap-2 text-emerald-600 animate-in fade-in slide-in-from-left-2">
                    <CheckCircle2 size={16} />
                    <span className="text-xs font-bold">Configurations Committed</span>
                  </div>
                )}
              </div>
              <button 
                type="submit" 
                className="px-10 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-[0.15em] shadow-xl shadow-slate-200 hover:bg-indigo-600 transition-all active:scale-95 flex items-center gap-3"
              >
                <Save size={18} />
                Persist Changes
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-5 space-y-8">
          <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-700">
               <ShieldCheck size={120} />
            </div>
            <div className="relative z-10">
              <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-6">Security Protocol</h4>
              <h3 className="text-2xl font-bold tracking-tighter mb-4">Master Authority</h3>
              <p className="text-sm text-slate-400 font-medium leading-relaxed mb-8">
                The Infrastructure Credentials provide automated access to the MDM synchronization endpoints. 
                Keep these credentials updated and never share them in plain text communications.
              </p>
              <div className="flex items-center gap-4 p-4 bg-slate-800 rounded-2xl border border-slate-700">
                <Lock size={20} className="text-indigo-400" />
                <span className="text-[10px] font-mono text-slate-400 truncate">AES-256 Bit Encryption at Rest</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100">
            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Terminal size={14} className="text-indigo-500" />
              Runtime Statistics
            </h4>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <span className="text-xs font-bold text-slate-500">API Latency</span>
                <span className="text-sm font-black text-slate-900">24ms</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <span className="text-xs font-bold text-slate-500">DB Connection Pool</span>
                <span className="text-sm font-black text-slate-900">8 / 20</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <span className="text-xs font-bold text-slate-500">Sync Memory Usage</span>
                <span className="text-sm font-black text-slate-900">142MB</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;

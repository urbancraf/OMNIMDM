
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Shield, 
  Mail, 
  Edit, 
  Trash2, 
  X, 
  CheckCircle2, 
  User as UserIcon,
  ShieldCheck,
  UserCheck,
  Lock,
  ChevronRight,
  Fingerprint,
  LayoutGrid,
  Zap,
  ShieldAlert,
  Key
} from 'lucide-react';
import { User, UserRole, Capability, Permission } from '../types';

interface UserManagerProps {
  currentUser: User;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  roles: UserRole[];
  globalPermissions: Permission[];
  onRefresh: () => void;
}

const UserManager: React.FC<UserManagerProps> = ({ currentUser, users, setUsers, roles, globalPermissions, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => { onRefresh(); }, []);

  const ROLE_TECH_ADMIN = 'System_Tech_Admin';
  const ROLE_BUSINESS_ADMIN = 'System Business Admin';

  const isTechAdmin = currentUser.role === ROLE_TECH_ADMIN;

  const canViewUser = (targetUser: User) => {
    if (isTechAdmin) return true;
    if (currentUser.role === ROLE_BUSINESS_ADMIN) return targetUser.role !== ROLE_TECH_ADMIN;
    return targetUser.id === currentUser.id;
  };

  const canManageUser = (targetUser: User) => {
    if (isTechAdmin) return true;
    if (currentUser.role === ROLE_BUSINESS_ADMIN) return targetUser.role !== ROLE_TECH_ADMIN;
    return false;
  };

  const allowedRolesToAssign = useMemo(() => {
    const roleList = Array.isArray(roles) ? roles : [];
    if (isTechAdmin) return roleList;
    if (currentUser.role === ROLE_BUSINESS_ADMIN) return roleList.filter(r => r.name !== ROLE_TECH_ADMIN);
    return [];
  }, [roles, currentUser.role, isTechAdmin]);

  const [formData, setFormData] = useState<Partial<User>>({ name: '', email: '', role: allowedRolesToAssign[0]?.name || '' });

  const filteredUsers = users.filter(u => 
    canViewUser(u) && (
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const filteredRoles = useMemo(() => {
    const roleList = Array.isArray(roles) ? roles : [];
    return roleList.filter(r => 
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (r.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [roles, searchTerm]);

  const handleOpenModal = (user?: User) => {
    if (user) { setEditingUser(user); setFormData(user); }
    else { setEditingUser(null); setFormData({ name: '', email: '', role: allowedRolesToAssign[0]?.name || '' }); }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;
    if (editingUser) setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...formData as User } : u));
    else setUsers(prev => [...prev, { ...(formData as User), id: crypto.randomUUID() }]);
    setIsModalOpen(false);
  };

  const handleDeleteUser = (id: string) => {
    if (confirm(`Revoke all access for this user node?`)) setUsers(prev => prev.filter(u => u.id !== id));
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-[0.2em] mb-1">Identity Governance</p>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Access Control Center</h2>
          <p className="text-sm text-slate-400 font-medium mt-2">Managing your organizational trust circle and authority clusters.</p>
        </div>
        <div className="flex gap-2 p-1.5 bg-white rounded-2xl shadow-sm border border-slate-100">
          <button onClick={() => { setActiveTab('users'); setSearchTerm(''); }} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Users Directory</button>
          <button onClick={() => { setActiveTab('roles'); setSearchTerm(''); }} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'roles' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Role Audits</button>
        </div>
      </header>

      <div className="space-y-8">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="relative flex-1 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
            <input type="text" placeholder={activeTab === 'users' ? "Find a member..." : "Search access roles..."} className="w-full pl-16 pr-8 py-5 bg-white rounded-[1.5rem] text-lg font-medium border border-slate-100 shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          {activeTab === 'users' && isTechAdmin && (
            <button onClick={() => handleOpenModal()} className="flex items-center gap-3 px-8 py-5 bg-indigo-600 text-white rounded-[1.5rem] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 font-bold"><UserPlus size={20} /><span>Invite User</span></button>
          )}
        </div>

        {activeTab === 'users' ? (
          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="px-10 py-6 text-[10px] font-black text-slate-300 uppercase tracking-widest">Identify</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-300 uppercase tracking-widest">Authority Cluster</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-300 uppercase tracking-widest text-right">Scope</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => {
                    const isManaged = canManageUser(user);
                    return (
                      <tr key={user.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-5">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-sm ${user.role === ROLE_TECH_ADMIN ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-indigo-600'}`}>{user.name.charAt(0)}</div>
                            <div>
                              <p className="text-lg font-bold text-slate-900 flex items-center gap-3 tracking-tight">{user.name}{user.id === currentUser.id && (<span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-tighter shadow-sm">Self</span>)}</p>
                              <p className="text-sm text-slate-400 font-medium">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${user.role === ROLE_TECH_ADMIN ? 'bg-slate-900 text-white shadow-lg' : 'bg-indigo-50 text-indigo-700'}`}>
                            {user.role === ROLE_TECH_ADMIN ? <Fingerprint size={14} /> : <Shield size={14} />}
                            {user.role}
                          </div>
                        </td>
                        <td className="px-10 py-8 text-right">
                          {isManaged ? (
                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                              <button onClick={() => handleOpenModal(user)} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"><Edit size={18} /></button>
                              {user.id !== currentUser.id && (<button onClick={() => handleDeleteUser(user.id)} className="p-3 text-slate-400 hover:text-red-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"><Trash2 size={18} /></button>)}
                            </div>
                          ) : (<div className="flex items-center justify-end gap-2 text-slate-300 font-bold uppercase text-[10px] tracking-widest"><Lock size={12} /> Protected Node</div>)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan={3} className="py-24 text-center"><div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mx-auto mb-6"><UserIcon size={32} /></div><p className="text-xl font-bold text-slate-900 tracking-tight">No managed nodes found.</p></td></tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-8 duration-700">
            {filteredRoles.map((role) => (
              <div key={role.id} className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 hover:border-indigo-200 transition-all duration-500 group">
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all ${role.name === ROLE_TECH_ADMIN ? 'bg-slate-900 text-white shadow-xl' : 'bg-indigo-50 text-indigo-600'}`}>
                      <ShieldCheck size={32} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{role.name}</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Audit Profile</p>
                    </div>
                  </div>
                  {role.name === ROLE_TECH_ADMIN && (<div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Lock size={16} /></div>)}
                </div>
                <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8 italic">"{role.description || 'No role mandate provided.'}"</p>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] flex items-center gap-2"><Fingerprint size={12} className="text-indigo-400" /> Linked Capabilities</h4>
                  <div className="flex flex-wrap gap-2">
                    {role.capabilities && role.capabilities.length > 0 ? (
                      role.capabilities.map(capId => (
                        <span key={capId} className="px-3 py-1.5 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-100">Capability ID: {capId.split('-')[0]}...</span>
                      ))
                    ) : (<p className="text-[10px] text-slate-300 font-bold uppercase italic">Isolated node: No capabilities linked.</p>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-400">
            <div className="p-10 pb-0 flex items-center justify-between">
              <div><h3 className="text-2xl font-black text-slate-900 tracking-tighter">{editingUser ? 'Refine Identity' : 'Extend Invitation'}</h3><p className="text-sm text-slate-400 font-medium mt-1">Configure profile and authority cluster.</p></div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-full transition-all"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div className="space-y-6">
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Identity Name</label><input type="text" required placeholder="Full name" className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-slate-900 font-bold border-none focus:ring-4 focus:ring-indigo-500/10 transition-all" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Communications</label><input type="email" required placeholder="Email address" className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-slate-900 font-bold border-none focus:ring-4 focus:ring-indigo-500/10 transition-all" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Authority Cluster</label><select className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-slate-900 font-bold border-none focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>{allowedRolesToAssign.map(role => (<option key={role.id} value={role.name}>{role.name}</option>))}</select></div>
              </div>
              <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black tracking-tight shadow-xl hover:bg-indigo-700 transition-all active:scale-95">{editingUser ? 'Apply Modifications' : 'Send Invite'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;

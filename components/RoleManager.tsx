
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Shield, 
  Edit, 
  Trash2, 
  X, 
  CheckCircle2, 
  Key, 
  RefreshCw, 
  Database, 
  Lock, 
  Fingerprint, 
  Layers,
  Activity,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserRole, Capability, Permission, SystemConfig } from '../types';
import { api } from '../apiService';

interface RoleManagerProps {
  activeTab: 'roles' | 'capabilities' | 'permissions';
  roles: UserRole[];
  capabilities: Capability[];
  globalPermissions: Permission[];
  onRefresh: () => void | Promise<void>;
  systemConfig: SystemConfig;
}

const RoleManager: React.FC<RoleManagerProps> = ({ activeTab, roles, capabilities, globalPermissions, onRefresh, systemConfig }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isCapModalOpen, setIsCapModalOpen] = useState(false);
  const [isPermModalOpen, setIsPermModalOpen] = useState(false);

  // Form States
  const [roleForm, setRoleForm] = useState<Partial<UserRole>>({ name: '', description: '', capabilities: [] });
  const [capForm, setCapForm] = useState<Partial<Capability>>({ name: '', description: '', permissions: [] });
  const [permForm, setPermForm] = useState<Partial<Permission>>({ code: '', description: '' });

  // Filtering with fallbacks
  const filteredRoles = (roles || []).filter(r => (r.name || '').toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredCaps = (capabilities || []).filter(c => (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredPerms = (globalPermissions || []).filter(p => (p.code || '').toLowerCase().includes(searchTerm.toLowerCase()));

  const resetRoleForm = () => setRoleForm({ name: '', description: '', capabilities: [] });
  const resetCapForm = () => setCapForm({ name: '', description: '', permissions: [] });
  const resetPermForm = () => setPermForm({ code: '', description: '' });

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.createRole(systemConfig, { ...roleForm, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
      await onRefresh();
      setIsRoleModalOpen(false);
      resetRoleForm();
    } catch (err) { 
      alert("Persistence Error: Failed to save role."); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const handleCapSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Step 2: Ensure capability is persisted with a UUID
      await api.createCapability(systemConfig, { ...capForm, id: crypto.randomUUID() });
      // Await refresh to ensure UI state is updated before modal close
      await onRefresh();
      setIsCapModalOpen(false);
      resetCapForm();
    } catch (err) { 
      alert("Persistence Error: Failed to publish capability node."); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const handlePermSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.createPermission(systemConfig, { ...permForm, id: crypto.randomUUID() });
      await onRefresh();
      setIsPermModalOpen(false);
      resetPermForm();
    } catch (err) { 
      alert("Permission code must be unique and technically valid."); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const handleDelete = async (type: string, id: string) => {
    if (!confirm(`Confirm removal of this ${type}? This action may affect child dependencies.`)) return;
    try {
      if (type === 'role') await api.deleteRole(systemConfig, id);
      else if (type === 'capability') await api.deleteCapability(systemConfig, id);
      else await api.deletePermission(systemConfig, id);
      await onRefresh();
    } catch (err) { 
      alert("Delete failed: Resource might be in use or connection was lost."); 
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-[0.2em] mb-1">Security Framework</p>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter capitalize">
            {activeTab.replace('_', ' ')}
          </h2>
          <p className="text-sm text-slate-400 font-medium mt-2">
            {activeTab === 'permissions' ? 'Step 1: Define atomic system actions.' : 
             activeTab === 'capabilities' ? 'Step 2: Group atomic permissions into functional bundles.' : 
             'Step 3: Map logical capabilities to high-level roles.'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onRefresh} className="p-3 bg-white text-indigo-600 border border-indigo-100 rounded-2xl shadow-sm hover:bg-indigo-50 transition-all"><RefreshCw size={20} /></button>
          <div className="p-1.5 bg-white rounded-2xl shadow-sm border border-slate-100 flex gap-1">
            <button onClick={() => navigate('/roles')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'roles' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Roles</button>
            <button onClick={() => navigate('/capabilities')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'capabilities' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Capabilities</button>
            <button onClick={() => navigate('/permissions')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'permissions' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Permissions</button>
          </div>
        </div>
      </header>

      <div className="space-y-8">
        <div className="flex gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input 
              placeholder={`Search ${activeTab}...`} 
              className="w-full pl-16 pr-8 py-5 bg-white rounded-[1.5rem] text-lg font-medium border border-slate-100 shadow-sm outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <button 
            onClick={() => {
              if (activeTab === 'roles') { resetRoleForm(); setIsRoleModalOpen(true); }
              else if (activeTab === 'capabilities') { resetCapForm(); setIsCapModalOpen(true); }
              else { resetPermForm(); setIsPermModalOpen(true); }
            }} 
            className="flex items-center gap-3 px-8 py-5 bg-indigo-600 text-white rounded-[1.5rem] hover:bg-indigo-700 transition-all shadow-xl font-bold"
          >
            <Plus size={20} />
            <span>Add {activeTab === 'permissions' ? 'Permission' : activeTab === 'capabilities' ? 'Capability' : 'Role'}</span>
          </button>
        </div>

        {activeTab === 'roles' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredRoles.length > 0 ? filteredRoles.map(role => (
              <div key={role.id} className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 group transition-all hover:border-indigo-200">
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Shield size={32} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{role.name}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Authority Cluster</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete('role', role.id)} className="p-3 text-slate-300 hover:text-rose-600 transition-all"><Trash2 size={18} /></button>
                </div>
                <div className="space-y-4">
                   <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2"><Fingerprint size={12}/> Capabilities Bound</h4>
                   <div className="flex flex-wrap gap-2">
                      {(role.capabilities || []).map(capId => {
                        const cap = (capabilities || []).find(c => c.id === capId);
                        return (
                          <span key={capId} className="px-3 py-1.5 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase border border-slate-100">
                            {cap?.name || `Capability ${capId.substring(0, 4)}...`}
                          </span>
                        );
                      })}
                      {(role.capabilities || []).length === 0 && <span className="text-[10px] text-slate-300 font-bold italic">No logical capabilities linked.</span>}
                   </div>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                <Shield className="mx-auto text-slate-200 mb-4" size={48} />
                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No roles defined in registry</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'capabilities' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredCaps.length > 0 ? filteredCaps.map(cap => (
              <div key={cap.id} className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 group transition-all hover:border-emerald-200">
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Layers size={32} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{cap.name}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Capability Node</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete('capability', cap.id)} className="p-3 text-slate-300 hover:text-rose-600 transition-all"><Trash2 size={18} /></button>
                </div>
                <div className="space-y-4">
                   <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2"><Key size={12}/> Atomic Permissions</h4>
                   <div className="flex flex-wrap gap-2">
                      {(cap.permissions || []).map(permId => {
                        const perm = (globalPermissions || []).find(p => p.id === permId || p.code === permId);
                        return (
                          <span key={permId} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black uppercase border border-emerald-100">
                            {perm?.code || permId}
                          </span>
                        );
                      })}
                      {(cap.permissions || []).length === 0 && <span className="text-[10px] text-slate-300 font-bold italic">No permissions assigned.</span>}
                   </div>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                <Layers className="mx-auto text-slate-200 mb-4" size={48} />
                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No capabilities published</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'permissions' && (
          <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden">
             <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                <div>
                   <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                      <Database className="text-indigo-600" size={24} />
                      Permission Registry (Step 1)
                   </h3>
                </div>
                <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center gap-2">
                   <Activity size={16} />
                   <span className="text-[10px] font-black uppercase">{(globalPermissions || []).length} Codes</span>
                </div>
             </div>
             <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-10 py-6 text-[10px] font-black text-slate-300 uppercase tracking-widest">Technical Code</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-300 uppercase tracking-widest">Functional Scope</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-300 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {filteredPerms.map(perm => (
                     <tr key={perm.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="px-10 py-8">
                           <code className="text-xs font-mono font-black text-indigo-600 bg-indigo-50 px-2.5 py-1.5 rounded-lg">{perm.code}</code>
                        </td>
                        <td className="px-10 py-8 text-sm font-medium text-slate-600">{perm.description}</td>
                        <td className="px-10 py-8 text-right">
                           <button onClick={() => handleDelete('permission', perm.id)} className="p-3 text-slate-300 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100">
                              <Trash2 size={20} />
                           </button>
                        </td>
                     </tr>
                   ))}
                   {filteredPerms.length === 0 && (
                     <tr><td colSpan={3} className="px-10 py-20 text-center text-slate-300 font-bold uppercase text-[10px] tracking-widest">Registry Empty</td></tr>
                   )}
                </tbody>
             </table>
          </div>
        )}
      </div>

      {/* Permission Modal */}
      {isPermModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-400">
            <div className="p-10 pb-6 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Register Permission</h3>
                <p className="text-sm text-slate-400 font-medium mt-1">Step 1: Technical infrastructure code.</p>
              </div>
              <button onClick={() => setIsPermModalOpen(false)} className="p-3 bg-slate-50 text-slate-400 rounded-full hover:text-slate-900 transition-all"><X size={24} /></button>
            </div>
            <form onSubmit={handlePermSubmit} className="p-10 space-y-8">
               <div className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">Technical Code</label>
                     <input required placeholder="e.g. DATA_EXPORT" className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-slate-900 font-bold border-none focus:ring-4 focus:ring-indigo-500/10 transition-all" value={permForm.code} onChange={(e) => setPermForm({...permForm, code: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">Scope Summary</label>
                     <input required placeholder="e.g. Export master data to CSV" className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-slate-900 font-bold border-none focus:ring-4 focus:ring-indigo-500/10 transition-all" value={permForm.description} onChange={(e) => setPermForm({...permForm, description: e.target.value})} />
                  </div>
               </div>
               <button disabled={isSubmitting} type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-[0.15em] shadow-xl hover:bg-indigo-700 transition-all disabled:opacity-50">
                  {isSubmitting ? 'Syncing...' : 'Register Atomic Code'}
               </button>
            </form>
          </div>
        </div>
      )}

      {/* Capability Modal */}
      {isCapModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-400 flex flex-col max-h-[85vh]">
            <div className="p-10 pb-6 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Construct Capability</h3>
                <p className="text-sm text-slate-400 font-medium mt-1">Step 2: Grouping technical permissions.</p>
              </div>
              <button onClick={() => setIsCapModalOpen(false)} className="p-3 bg-slate-50 text-slate-400 rounded-full hover:text-slate-900 transition-all"><X size={24} /></button>
            </div>
            <form onSubmit={handleCapSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-10">
               <div className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">Capability Label</label>
                     <input required placeholder="e.g. Catalog Specialist Pool" className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-slate-900 font-bold border-none focus:ring-4 focus:ring-indigo-500/10 transition-all" value={capForm.name} onChange={(e) => setCapForm({...capForm, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">Scope Description</label>
                     <textarea placeholder="Describe the authority scope..." className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-slate-900 font-bold border-none focus:ring-4 focus:ring-indigo-500/10 transition-all" value={capForm.description} onChange={(e) => setCapForm({...capForm, description: e.target.value})} />
                  </div>
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">Atomic Assignments</label>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(globalPermissions || []).map(p => (
                          <button key={p.id} type="button" onClick={() => {
                            const cur = capForm.permissions || [];
                            const next = cur.includes(p.id) ? cur.filter(x => x !== p.id) : [...cur, p.id];
                            setCapForm({...capForm, permissions: next});
                          }} className={`p-4 rounded-2xl text-left border-2 transition-all flex items-center gap-3 ${capForm.permissions?.includes(p.id) ? 'bg-emerald-50 border-emerald-600 text-emerald-900' : 'bg-white border-slate-50 text-slate-400 hover:border-slate-100'}`}>
                             <div className={`w-5 h-5 rounded flex items-center justify-center ${capForm.permissions?.includes(p.id) ? 'bg-emerald-600 text-white' : 'bg-slate-100'}`}>
                                {capForm.permissions?.includes(p.id) && <CheckCircle2 size={12} />}
                             </div>
                             <span className="text-[10px] font-black uppercase tracking-tight">{p.code}</span>
                          </button>
                        ))}
                        {(globalPermissions || []).length === 0 && <p className="col-span-full text-xs font-bold text-rose-500">Registry error: No atomic permissions available to assign.</p>}
                     </div>
                  </div>
               </div>
               <div className="p-10 pt-0">
                 <button disabled={isSubmitting} type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-[0.15em] shadow-xl hover:bg-emerald-700 transition-all disabled:opacity-50">
                    {isSubmitting ? 'Syncing to Infrastructure...' : 'Publish Capability Node'}
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Modal */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-400 flex flex-col max-h-[85vh]">
            <div className="p-10 pb-6 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Architect New Role</h3>
                <p className="text-sm text-slate-400 font-medium mt-1">Step 3: Logical authority grouping.</p>
              </div>
              <button onClick={() => setIsRoleModalOpen(false)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-full transition-all"><X size={24} /></button>
            </div>
            <form onSubmit={handleRoleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-10">
               <div className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">Role Identifier</label>
                     <input required placeholder="e.g. Master Catalog Architect" className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-slate-900 font-bold border-none focus:ring-4 focus:ring-indigo-500/10 transition-all" value={roleForm.name} onChange={(e) => setRoleForm({...roleForm, name: e.target.value})} />
                  </div>
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">Assign Capabilities</label>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(capabilities || []).map(cap => (
                          <button key={cap.id} type="button" onClick={() => {
                            const cur = roleForm.capabilities || [];
                            const next = cur.includes(cap.id) ? cur.filter(x => x !== cap.id) : [...cur, cap.id];
                            setRoleForm({...roleForm, capabilities: next});
                          }} className={`p-4 rounded-2xl text-left border-2 transition-all flex items-center gap-3 ${roleForm.capabilities?.includes(cap.id) ? 'bg-indigo-50 border-indigo-600 text-indigo-900' : 'bg-white border-slate-50 text-slate-400 hover:border-slate-100'}`}>
                             <div className={`w-5 h-5 rounded flex items-center justify-center ${roleForm.capabilities?.includes(cap.id) ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}>
                                {roleForm.capabilities?.includes(cap.id) && <CheckCircle2 size={12} />}
                             </div>
                             <span className="text-[10px] font-black uppercase tracking-tight">{cap.name}</span>
                          </button>
                        ))}
                        {(capabilities || []).length === 0 && <p className="col-span-full text-xs font-bold text-rose-500">Registry error: No logical capabilities available to assign.</p>}
                     </div>
                  </div>
               </div>
               <div className="p-10 pt-0">
                 <button disabled={isSubmitting} type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-[0.15em] shadow-xl hover:bg-indigo-700 transition-all disabled:opacity-50">
                    {isSubmitting ? 'Architecting...' : 'Commit High-Level Role'}
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManager;

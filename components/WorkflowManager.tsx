
import React, { useState, useMemo, useEffect } from 'react';
import { 
  GitMerge, 
  Package, 
  Search, 
  ChevronRight, 
  ArrowLeft,
  CheckCircle,
  Save,
  Undo2,
  Trash2,
  PlusCircle,
  Clock,
  Tags,
  ShieldCheck,
  Settings,
  Plus,
  X,
  UserCheck,
  Zap,
  LayoutGrid,
  MoreVertical,
  CheckCircle2,
  Circle,
  Layers,
  Activity,
  ShieldAlert,
  Power,
  Edit,
  RefreshCw,
  Route
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Product, ProductAttribute, User, UserRole, WorkflowStep, WorkflowBlueprint, SystemConfig } from '../types';
import { api } from '../apiService';

interface WorkflowManagerProps {
  currentUser: User;
  products: Product[];
  allProducts: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  roles: UserRole[];
  blueprints: WorkflowBlueprint[];
  setBlueprints: React.Dispatch<React.SetStateAction<WorkflowBlueprint[]>>;
  onCompleteStep: (productId: string, updatedAttributes: ProductAttribute[]) => void;
  onRefresh: () => void;
  systemConfig: SystemConfig;
}

const WorkflowManager: React.FC<WorkflowManagerProps> = ({ 
  currentUser, 
  products, 
  allProducts,
  setProducts,
  roles, 
  blueprints,
  setBlueprints,
  onCompleteStep,
  onRefresh,
  systemConfig
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'inbox' | 'registry'>(
    location.pathname.includes('-mgmt') ? 'registry' : 'inbox'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [processingProduct, setProcessingProduct] = useState<Product | null>(null);
  const [tempAttributes, setTempAttributes] = useState<ProductAttribute[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    onRefresh();
  }, []);

  useEffect(() => {
    setActiveTab(location.pathname.includes('-mgmt') ? 'registry' : 'inbox');
  }, [location.pathname]);

  const [isArchitectOpen, setIsArchitectOpen] = useState(false);
  const [editingBlueprintId, setEditingBlueprintId] = useState<string | null>(null);
  const [bpFormData, setBpFormData] = useState<Partial<WorkflowBlueprint>>({
    name: '',
    description: '',
    steps: [],
    isActive: true,
    isDefault: false
  });

  const isTechAdmin = currentUser.role === 'System_Tech_Admin';

  const roleInbox = useMemo(() => {
    const list = Array.isArray(products) ? products : [];
    return list.filter(p => {
      if (!p || p.currentStepIndex === undefined || !p.workflowSteps) return false;
      const currentStep = p.workflowSteps[p.currentStepIndex];
      const matchesRole = currentStep && currentStep.assignedRole === currentUser.role;
      const matchesSearch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesRole && matchesSearch;
    });
  }, [products, currentUser.role, searchTerm]);

  const handleStartProcess = (product: Product) => {
    setProcessingProduct(product);
    setTempAttributes([...(product.attributes || [])]);
  };

  const handleFinishStep = () => {
    if (processingProduct) {
      onCompleteStep(processingProduct.id, tempAttributes);
      setProcessingProduct(null);
    }
  };

  const handleOpenArchitect = (bp?: WorkflowBlueprint) => {
    if (bp) {
      setEditingBlueprintId(bp.id);
      setBpFormData(JSON.parse(JSON.stringify(bp)));
    } else {
      setEditingBlueprintId(null);
      setBpFormData({
        name: '',
        description: '',
        steps: [{ id: crypto.randomUUID(), label: '', assignedRole: roles[0]?.name || '', status: 'pending' }],
        isActive: true,
        isDefault: false
      });
    }
    setIsArchitectOpen(true);
  };

  const handleAddBpStep = () => {
    const steps = [...(bpFormData.steps || [])];
    steps.push({ id: crypto.randomUUID(), label: '', assignedRole: roles[0]?.name || '', status: 'pending' });
    setBpFormData({ ...bpFormData, steps });
  };

  const handleToggleBlueprint = async (id: string) => {
    const bp = (blueprints || []).find(b => b.id === id);
    if (!bp) return;
    try {
      await api.updateWorkflow(systemConfig, id, { ...bp, isActive: !bp.isActive });
      onRefresh();
    } catch (err) {
      alert("Failed to toggle policy status.");
    }
  };

  const handleDeleteBlueprint = async (id: string) => {
    const bp = (blueprints || []).find(b => b.id === id);
    if (!bp || bp.isDefault) {
      alert("System default blueprints cannot be removed.");
      return;
    }
    if (confirm(`CRITICAL: Permanently remove the "${bp.name}" architecture? This action is non-reversible.`)) {
      try {
        await api.deleteWorkflow(systemConfig, id);
        onRefresh();
      } catch (err) {
        alert("Persistence Failure: Failed to remove blueprint node.");
      }
    }
  };

  const handleSaveBlueprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bpFormData.name || !bpFormData.steps || bpFormData.steps.length === 0) {
       alert("Blueprint requires an identity and at least one defined authority gate.");
       return;
    }

    setIsSubmitting(true);
    try {
      if (editingBlueprintId) {
        await api.updateWorkflow(systemConfig, editingBlueprintId, bpFormData);
      } else {
        await api.createWorkflow(systemConfig, {
          ...bpFormData,
          id: crypto.randomUUID()
        });
      }
      onRefresh();
      setIsArchitectOpen(false);
    } catch (err) {
      alert("Failed to commit blueprint to Infrastructure Registry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTabChange = (tab: 'inbox' | 'registry') => {
    setActiveTab(tab);
    navigate(tab === 'inbox' ? '/workflow' : '/workflow-mgmt');
  };

  if (processingProduct && processingProduct.workflowSteps && processingProduct.currentStepIndex !== undefined) {
    const currentStep = processingProduct.workflowSteps[processingProduct.currentStepIndex];
    return (
      <div className="space-y-12 animate-in slide-in-from-right-4 duration-700">
        <header className="flex items-center gap-6">
          <button 
            onClick={() => setProcessingProduct(null)}
            className="p-3 bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl transition-all shadow-sm text-slate-400"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter">{processingProduct.name}</h2>
              <span className="px-3 py-1 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100">
                {currentStep ? currentStep.label : 'Active Step'}
              </span>
            </div>
            <p className="text-sm text-slate-400 font-medium mt-1">Executing organizational mandate for {currentUser.role}.</p>
          </div>
        </header>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
           <div className="flex items-center justify-between">
              {(processingProduct.workflowSteps || []).map((step, idx) => (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center gap-3 relative z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      idx < (processingProduct.currentStepIndex || 0) ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' :
                      idx === processingProduct.currentStepIndex ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 animate-pulse' :
                      'bg-slate-50 text-slate-300'
                    }`}>
                      {idx < (processingProduct.currentStepIndex || 0) ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                    </div>
                    <div className="text-center">
                      <p className={`text-[10px] font-black uppercase tracking-widest ${idx === processingProduct.currentStepIndex ? 'text-indigo-600' : 'text-slate-400'}`}>
                        {step.label}
                      </p>
                      <p className="text-[8px] text-slate-300 font-bold uppercase mt-0.5">{step.assignedRole}</p>
                    </div>
                  </div>
                  {idx < (processingProduct.workflowSteps ? processingProduct.workflowSteps.length - 1 : 0) && (
                    <div className="flex-1 h-0.5 bg-slate-100 mx-4 -mt-10" />
                  )}
                </React.Fragment>
              ))}
           </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="p-10 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Tags size={24} /></div>
              Data Enrichment Interface
            </h3>
            <button 
              onClick={() => setTempAttributes([...tempAttributes, { key: '', value: '' }])}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 text-xs font-black uppercase tracking-widest"
            >
              <PlusCircle size={18} />
              Add Specification
            </button>
          </div>
          <div className="p-10 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {(tempAttributes || []).map((attr, idx) => (
                <div key={idx} className="space-y-2 animate-in fade-in slide-in-from-left-4 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Master Key</label>
                    <button onClick={() => setTempAttributes(tempAttributes.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-rose-600 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex gap-4">
                    <input 
                      placeholder="Key"
                      value={attr.key}
                      onChange={(e) => { const n = [...tempAttributes]; n[idx].key = e.target.value; setTempAttributes(n); }}
                      className="flex-1 px-6 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm"
                    />
                    <input 
                      placeholder="Value"
                      value={attr.value}
                      onChange={(e) => { const n = [...tempAttributes]; n[idx].value = e.target.value; setTempAttributes(n); }}
                      className="flex-[2] px-6 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-10 bg-slate-50/50 border-t border-slate-50 flex items-center justify-end gap-6">
            <button onClick={() => setProcessingProduct(null)} className="px-10 py-5 text-slate-400 font-black uppercase text-xs tracking-[0.15em] hover:text-slate-900 transition-colors">Suspend Task</button>
            <button onClick={handleFinishStep} className="px-12 py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-[0.15em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-3">
              <CheckCircle size={20} />
              Confirm & Propagate
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-[0.2em] mb-1">Mandate Manager</p>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">
            {activeTab === 'inbox' ? 'Workflow Inbox' : 'Workflow Architect'}
          </h2>
          <p className="text-sm text-slate-400 font-medium mt-2">
            {activeTab === 'inbox' 
              ? 'Manage active data enrichment tasks assigned to your authority level.' 
              : 'Design systemic lifecycle pipelines and governance gates.'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onRefresh} className="p-3 bg-white text-indigo-600 border border-indigo-100 rounded-2xl shadow-sm hover:bg-indigo-50 transition-all"><RefreshCw size={20} /></button>
          <div className="flex gap-2 p-1.5 bg-white rounded-2xl shadow-sm border border-slate-100">
            <button onClick={() => handleTabChange('inbox')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'inbox' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
              My Tasks
            </button>
            {isTechAdmin && (
              <button onClick={() => handleTabChange('registry')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'registry' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
                Registry
              </button>
            )}
          </div>
        </div>
      </header>

      {activeTab === 'inbox' ? (
        <div className="space-y-12">
          <div className="flex justify-between items-center">
             <div className="relative group w-full md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={16} />
              <input type="text" placeholder="Search tasks..." className="w-full pl-10 pr-4 py-2 bg-white rounded-xl text-xs font-bold border border-slate-100 shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 whitespace-nowrap">
              <Clock className="text-amber-500" size={20} />
              <span className="text-sm font-black text-slate-900 tracking-tight">{roleInbox.length} Pending Actions</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {roleInbox.length > 0 ? (
              roleInbox.map(product => (
                <div key={product.id} className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 px-4 py-2 bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase tracking-widest rounded-bl-2xl">
                    {product.workflowType}
                  </div>
                  <div className="flex items-start justify-between mb-8">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 border border-slate-100 overflow-hidden shadow-sm group-hover:scale-110 transition-transform duration-500">
                      <img src={(product.images || []).find(i => i.isPrimary)?.url || 'https://picsum.photos/seed/placeholder/200/200'} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[8px] font-black uppercase tracking-widest mb-2">Needs Intervention</span>
                      <p className="text-[10px] font-mono text-slate-400">{product.sku}</p>
                    </div>
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 tracking-tight mb-2 group-hover:text-indigo-600 transition-colors">{product.name}</h4>
                  <p className="text-xs text-slate-400 font-medium line-clamp-2 mb-8 leading-relaxed italic">
                    {product.workflowSteps && product.currentStepIndex !== undefined ? product.workflowSteps[product.currentStepIndex]?.label : 'Step'} awaits your department authority.
                  </p>
                  <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-indigo-600">
                        {currentUser.name.charAt(0)}
                      </div>
                    </div>
                    <button onClick={() => handleStartProcess(product)} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-200 hover:bg-indigo-600 transition-all active:scale-95">Start Task</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-32 text-center space-y-6">
                <div className="w-32 h-32 bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 flex items-center justify-center text-slate-100 mx-auto">
                  <UserCheck size={64} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Your Pipeline is Clear</h3>
                  <p className="text-sm text-slate-400 font-medium max-w-xs mx-auto mt-2">No active mandates currently require your department's authority.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
           <div className="flex justify-end">
             <button onClick={() => handleOpenArchitect()} className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-[1.5rem] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 font-bold">
                <PlusCircle size={20} />
                <span>Architect New Pipeline</span>
             </button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {(blueprints || []).map((bp) => {
                if (!bp) return null;
                const activeCount = (allProducts || []).filter(p => p && p.isInWorkflow && p.workflowType === bp.name).length;
                return (
                  <div key={bp.id} className={`bg-white p-10 rounded-[3rem] shadow-xl border transition-all duration-500 group ${bp.isActive ? 'border-slate-100 shadow-slate-200/50 hover:border-indigo-100' : 'border-slate-50 bg-slate-50/30 opacity-60'}`}>
                    <div className="flex items-start justify-between mb-8">
                       <div className="flex items-center gap-6">
                          <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all ${bp.isActive ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-slate-200 text-slate-400'}`}>
                             <Route size={32} />
                          </div>
                          <div>
                             <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{bp.name || 'Unnamed Pipeline'}</h3>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                                {bp.isDefault ? <ShieldAlert size={12} className="text-indigo-400" /> : <Layers size={12} />}
                                {bp.isDefault ? 'Standard Policy' : 'Custom Pipeline'}
                             </p>
                          </div>
                       </div>
                       <div className="flex gap-2">
                          <button onClick={() => handleToggleBlueprint(bp.id)} className={`p-3 rounded-xl transition-all ${bp.isActive ? 'text-emerald-500 bg-emerald-50' : 'text-slate-400 bg-slate-100 hover:bg-slate-200'}`}>
                             <Power size={18} />
                          </button>
                          <button onClick={() => handleOpenArchitect(bp)} className="p-3 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                             <Edit size={18} />
                          </button>
                          {!bp.isDefault && (
                            <button onClick={() => handleDeleteBlueprint(bp.id)} className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                               <Trash2 size={18} />
                            </button>
                          )}
                       </div>
                    </div>

                    <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8 italic">"{bp.description || 'No objective defined.'}"</p>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                       <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Instances</p>
                          <p className="text-2xl font-black text-slate-900 tracking-tighter">{activeCount}</p>
                       </div>
                       <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Architecture Gates</p>
                          <p className="text-2xl font-black text-slate-900 tracking-tighter">{(bp.steps || []).length}</p>
                       </div>
                    </div>

                    <div className="space-y-3">
                       <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] flex items-center gap-2"><Activity size={12} /> Sequence Map</h4>
                       <div className="flex flex-wrap gap-2">
                          {(bp.steps || []).map((step, idx) => (
                            <span key={step.id} className="px-3 py-1.5 bg-white border border-slate-100 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 group-hover:border-indigo-100 group-hover:text-indigo-600 transition-colors">
                               <span className="w-4 h-4 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[7px] font-black">{idx + 1}</span>
                               {step.assignedRole}
                            </span>
                          ))}
                       </div>
                    </div>
                  </div>
                );
              })}
           </div>
        </div>
      )}

      {isArchitectOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-400 flex flex-col max-h-[85vh]">
            <div className="p-10 pb-6 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{editingBlueprintId ? 'Update Sequence' : 'Architect Pipeline'}</h3>
                <p className="text-sm text-slate-400 font-medium mt-1">Design structural authority for system events.</p>
              </div>
              <button onClick={() => setIsArchitectOpen(false)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-full transition-all"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSaveBlueprint} className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-10">
              <div className="grid grid-cols-1 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">Pipeline Identity</label>
                  <input required placeholder="Sequence Label (e.g. Master Content Enrichment)" className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-slate-900 font-bold border-none focus:ring-4 focus:ring-indigo-500/10 transition-all" value={bpFormData.name} onChange={(e) => setBpFormData({...bpFormData, name: e.target.value})} />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">Mandate Objective</label>
                  <textarea rows={2} placeholder="Define the business goal of this lifecycle..." className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-slate-900 font-bold border-none focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none" value={bpFormData.description} onChange={(e) => setBpFormData({...bpFormData, description: e.target.value})} />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Authority Sequence Gates</label>
                  <button type="button" onClick={handleAddBpStep} className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:text-indigo-800 transition-colors">
                    <Plus size={14} /> Add Step Node
                  </button>
                </div>
                <div className="space-y-4">
                  {(bpFormData.steps || []).map((step, idx) => (
                    <div key={step.id} className="p-6 bg-[#F2F2F7] rounded-[2rem] border border-slate-100 flex items-center gap-6 animate-in slide-in-from-left-4 transition-all">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm shadow-lg">{idx + 1}</div>
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Node Goal</label>
                          <input required placeholder="Task Goal" className="w-full px-4 py-3 bg-white border-none rounded-xl text-xs font-bold focus:ring-4 focus:ring-indigo-500/5 transition-all" value={step.label} onChange={(e) => { const s = [...(bpFormData.steps || [])]; s[idx].label = e.target.value; setBpFormData({...bpFormData, steps: s}); }} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Owner Authority</label>
                          <select className="w-full px-4 py-3 bg-white border-none rounded-xl text-xs font-bold focus:ring-4 focus:ring-indigo-500/5 transition-all" value={step.assignedRole} onChange={(e) => { const s = [...(bpFormData.steps || [])]; s[idx].assignedRole = e.target.value; setBpFormData({...bpFormData, steps: s}); }}>
                            {(roles || []).map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                          </select>
                        </div>
                      </div>
                      {(bpFormData.steps ? bpFormData.steps.length > 1 : false) && (
                        <button type="button" onClick={() => { const s = (bpFormData.steps || []).filter((_, i) => i !== idx); setBpFormData({...bpFormData, steps: s}); }} className="p-2 text-slate-300 hover:text-rose-600 hover:bg-white rounded-xl transition-all">
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50 bg-white sticky bottom-0 z-10 pb-4">
                <button disabled={isSubmitting} type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-[0.15em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50">
                   {isSubmitting ? 'Syncing to Infrastructure...' : 'Publish Pipeline Architecture'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowManager;

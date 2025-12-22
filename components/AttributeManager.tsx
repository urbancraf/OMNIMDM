import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  ChevronRight, 
  LayoutGrid, 
  Plus, 
  X, 
  Edit, 
  Trash, 
  AlertCircle, 
  FileText, 
  Settings2, 
  ListFilter, 
  Layers, 
  Tag, 
  RefreshCw,
  FolderPlus,
  ArrowRightLeft,
  GripVertical
} from 'lucide-react';
import { Product, MasterAttribute, AttributeType, AttributeGroup, Category, SystemConfig } from '../types';
import { api } from '../apiService';

interface AttributeManagerProps {
  products: Product[];
  masterAttributes: MasterAttribute[];
  attributeGroups: AttributeGroup[];
  onAttributeUpdate: (oldName: string, newName: string | null) => void;
  primaryCategories: Category[];
  secondaryCategories: Category[];
  onRefresh: () => void;
  systemConfig: SystemConfig;
}

const AttributeManager: React.FC<AttributeManagerProps> = ({ 
  products, 
  masterAttributes, 
  attributeGroups,
  primaryCategories,
  secondaryCategories,
  onRefresh,
  systemConfig
}) => {
  const [activeTab, setActiveTab] = useState<'attributes' | 'groups'>('attributes');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAttrId, setSelectedAttrId] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [leftWidth, setLeftWidth] = useState(33);

  // Modals
  const [isAttrModalOpen, setIsAttrModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  // Form States
  const [attrForm, setAttrForm] = useState<Partial<MasterAttribute>>({
    name: '', description: '', type: AttributeType.SPECIFICATION, groupId: '', scopedCategory: ''
  });
  const [groupForm, setGroupForm] = useState<Partial<AttributeGroup>>({
    name: '', description: ''
  });

  useEffect(() => { onRefresh(); }, []);

  const summaries = useMemo(() => {
    return (masterAttributes || []).map(ma => {
      const associated = (products || []).filter(p => 
        Array.isArray(p.attributes) && p.attributes.some(a => a.key === ma.name)
      );
      return { ...ma, count: associated.length };
    });
  }, [masterAttributes, products]);

  const groupedAttributes = useMemo(() => {
    const map: Record<string, typeof summaries> = {};
    summaries.forEach(attr => {
      const gId = attr.groupId || 'ungrouped';
      if (!map[gId]) map[gId] = [];
      if (attr.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        map[gId].push(attr);
      }
    });
    return map;
  }, [summaries, searchTerm]);

  const handleSaveAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (attrForm.id) {
        await api.updateAttribute(systemConfig, attrForm.id, attrForm);
      } else {
        await api.createAttribute(systemConfig, { ...attrForm, id: crypto.randomUUID() });
      }
      onRefresh();
      setIsAttrModalOpen(false);
    } catch (err) { alert("Persistence Failure."); }
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (groupForm.id) {
        await api.updateAttributeGroup(systemConfig, groupForm.id, groupForm);
      } else {
        await api.createAttributeGroup(systemConfig, { ...groupForm, id: crypto.randomUUID() });
      }
      onRefresh();
      setIsGroupModalOpen(false);
    } catch (err) { alert("Persistence Failure."); }
  };

  const handleDeleteAttr = async (id: string) => {
    if (!confirm("Erase attribute registry entry?")) return;
    await api.deleteAttribute(systemConfig, id);
    onRefresh();
    setSelectedAttrId(null);
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm("Erase group? Attributes will become ungrouped.")) return;
    await api.deleteAttributeGroup(systemConfig, id);
    onRefresh();
  };

  const getTypeIcon = (type: AttributeType) => {
    switch(type) {
      case AttributeType.DESCRIPTIVE: return <FileText size={16} />;
      case AttributeType.FACETABLE: return <ListFilter size={16} />;
      default: return <Settings2 size={16} />;
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-[0.2em] mb-1">Architecture</p>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Attribute Engine</h2>
          <p className="text-sm text-slate-400 font-medium mt-2">Managing structural metadata and logical clusters.</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onRefresh} className="p-3 bg-white text-indigo-600 border border-indigo-100 rounded-2xl shadow-sm hover:bg-indigo-50 transition-all"><RefreshCw size={20} /></button>
          <div className="p-1.5 bg-white rounded-2xl shadow-sm border border-slate-100 flex gap-1">
            <button onClick={() => setActiveTab('attributes')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'attributes' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Keys</button>
            <button onClick={() => setActiveTab('groups')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'groups' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Groups</button>
          </div>
        </div>
      </header>

      {activeTab === 'attributes' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-6">
            <div className="flex gap-4">
              <div className="relative flex-1 group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input placeholder="Search keys..." className="w-full pl-14 pr-6 py-4 bg-white rounded-[1.5rem] text-sm font-bold border border-slate-50 shadow-sm focus:ring-4 focus:ring-indigo-500/5 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <button onClick={() => { setAttrForm({ name: '', description: '', type: AttributeType.SPECIFICATION, groupId: '', scopedCategory: '' }); setIsAttrModalOpen(true); }} className="px-8 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-700 active:scale-95 transition-all">New Key</button>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden max-h-[700px] overflow-y-auto custom-scrollbar">
              {Object.entries(groupedAttributes).map(([gId, attrs]) => {
                const group = attributeGroups.find(g => g.id === gId);
                // Cast attrs to any[] to resolve 'unknown' type errors during iteration
                const attributeList = attrs as any[];
                return (
                  <div key={gId} className="border-b border-slate-50 last:border-0">
                    <div className="px-10 py-5 bg-slate-50/50 flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{group?.name || 'Ungrouped Context'}</h4>
                      <span className="text-[8px] bg-white border border-slate-200 px-2 py-0.5 rounded-full font-black text-slate-400 uppercase">{attributeList.length} Keys</span>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {attributeList.map(attr => (
                        <button key={attr.id} onClick={() => { setSelectedAttrId(attr.id); }} className={`w-full text-left p-10 flex items-center justify-between group transition-all ${selectedAttrId === attr.id ? 'bg-indigo-50/30' : 'hover:bg-slate-50/50'}`}>
                          <div className="flex items-center gap-6">
                            <div className={`p-4 rounded-2xl transition-all ${selectedAttrId === attr.id ? 'bg-white text-indigo-600 shadow-sm' : 'bg-slate-50 text-slate-300'}`}>
                              {getTypeIcon(attr.type)}
                            </div>
                            <div>
                              <p className={`font-black tracking-tight text-lg ${selectedAttrId === attr.id ? 'text-indigo-900' : 'text-slate-900'}`}>{attr.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{attr.count} Linked SKUs • {attr.type}</p>
                            </div>
                          </div>
                          <ChevronRight size={20} className={`transition-all ${selectedAttrId === attr.id ? 'text-indigo-600 translate-x-1' : 'text-slate-200 group-hover:text-slate-400'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5">
            {selectedAttrId ? (
              (() => {
                const attr = summaries.find(a => a.id === selectedAttrId);
                if (!attr) return null;
                const group = attributeGroups.find(g => g.id === attr.groupId);
                return (
                  <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100 space-y-12 animate-in slide-in-from-right-8 duration-700 h-full">
                    <header className="flex items-start justify-between">
                      <div className="flex items-center gap-8">
                        <div className="w-20 h-20 bg-slate-900 text-white rounded-[2rem] flex items-center justify-center shadow-2xl">{getTypeIcon(attr.type)}</div>
                        <div>
                          <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{attr.name}</h3>
                          <div className="flex items-center gap-3 mt-2">
                             <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[8px] font-black uppercase tracking-widest">{group?.name || 'Unbound'}</span>
                             <span className="px-3 py-1 bg-slate-50 text-slate-400 rounded-full text-[8px] font-black uppercase tracking-widest">{attr.type}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setAttrForm(attr); setIsAttrModalOpen(true); }} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Edit size={20} /></button>
                        <button onClick={() => handleDeleteAttr(attr.id)} className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash size={20} /></button>
                      </div>
                    </header>
                    <div className="space-y-10">
                       <div>
                          <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">Structural Logic</h4>
                          <p className="text-sm font-medium text-slate-500 italic leading-relaxed">"{attr.description || 'No guidance defined.'}"</p>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-sm">
                             <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Catalog Saturation</p>
                             <p className="text-4xl font-black text-slate-900 tracking-tighter">{attr.count}</p>
                          </div>
                          <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-sm">
                             <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Binding Context</p>
                             <div className="flex items-center gap-2 mt-2">
                                <Layers size={14} className="text-emerald-400" />
                                <span className="text-xs font-bold text-slate-600">{attr.scopedCategory || 'Global Entry'}</span>
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-20 text-center opacity-30 animate-in fade-in duration-1000">
                <div className="w-32 h-32 bg-white rounded-[3rem] shadow-2xl flex items-center justify-center text-slate-100 mb-8"><LayoutGrid size={64} /></div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Registry Explorer</h3>
                <p className="text-sm text-slate-400 font-medium max-w-xs mt-2 mx-auto">Select a metadata key to manage its global inheritance and saturation metrics.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-700">
          <div className="flex justify-end">
            <button onClick={() => { setGroupForm({ name: '', description: '' }); setIsGroupModalOpen(true); }} className="flex items-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all">Construct New Group</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {attributeGroups.map(group => (
              <div key={group.id} className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 group transition-all hover:border-indigo-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                       <FolderPlus size={24} />
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setGroupForm(group); setIsGroupModalOpen(true); }} className="p-3 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Edit size={16} /></button>
                      <button onClick={() => handleDeleteGroup(group.id)} className="p-3 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash size={16} /></button>
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter mb-2">{group.name}</h3>
                  <p className="text-xs text-slate-400 font-medium line-clamp-2 italic mb-8">"{group.description || 'No context defined.'}"</p>
                </div>
                <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                   <div className="flex -space-x-2">
                      {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full bg-slate-50 border-2 border-white" />)}
                   </div>
                   <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{summaries.filter(s => s.groupId === group.id).length} Active Keys</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attribute Modal */}
      {isAttrModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-400">
             <div className="p-12 pb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{attrForm.id ? 'Refine Logic' : 'Model New Key'}</h3>
                  <p className="text-sm text-slate-400 font-medium mt-1">Configuring master technical identifier.</p>
                </div>
                <button onClick={() => setIsAttrModalOpen(false)} className="p-3 bg-slate-50 text-slate-400 rounded-full hover:text-slate-900 transition-all"><X size={24} /></button>
             </div>
             <form onSubmit={handleSaveAttribute} className="p-12 pt-6 space-y-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">Global Identifier Label</label>
                     <input required autoFocus className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-slate-900 font-bold border-none focus:ring-4 focus:ring-indigo-500/10 transition-all" value={attrForm.name} onChange={(e) => setAttrForm({...attrForm, name: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">Functional Group</label>
                        <select className="w-full px-4 py-4 bg-slate-50 rounded-2xl text-xs font-bold border-none focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none" value={attrForm.groupId} onChange={(e) => setAttrForm({...attrForm, groupId: e.target.value})}>
                          <option value="">Ungrouped Context</option>
                          {attributeGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">Data Model</label>
                        <select className="w-full px-4 py-4 bg-slate-50 rounded-2xl text-xs font-bold border-none focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none" value={attrForm.type} onChange={(e) => setAttrForm({...attrForm, type: e.target.value as AttributeType})}>
                           <option value={AttributeType.SPECIFICATION}>Technical Spec</option>
                           <option value={AttributeType.DESCRIPTIVE}>Market Copy</option>
                           <option value={AttributeType.FACETABLE}>Facet (Global)</option>
                        </select>
                     </div>
                  </div>
                </div>
                <button type="submit" className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-indigo-700 transition-all">Commit Registry entry</button>
             </form>
           </div>
        </div>
      )}

      {/* Group Modal */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-400">
             <div className="p-12 pb-6 flex items-center justify-between">
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Group Configuration</h3>
                <button onClick={() => setIsGroupModalOpen(false)} className="p-3 bg-slate-50 text-slate-400 rounded-full transition-all"><X size={24} /></button>
             </div>
             <form onSubmit={handleSaveGroup} className="p-12 pt-6 space-y-8">
                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">Structural Label</label>
                      <input required autoFocus className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-slate-900 font-bold border-none focus:ring-4 focus:ring-indigo-500/10 transition-all" value={groupForm.name} onChange={(e) => setGroupForm({...groupForm, name: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">Context Summary</label>
                      <textarea rows={3} className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-slate-900 font-bold border-none focus:ring-4 focus:ring-indigo-500/10 transition-all" value={groupForm.description} onChange={(e) => setGroupForm({...groupForm, description: e.target.value})} />
                   </div>
                </div>
                <button type="submit" className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl transition-all">Publish logical cluster</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttributeManager;
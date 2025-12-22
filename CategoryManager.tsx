
import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronRight, 
  Folder, 
  FolderPlus, 
  Edit, 
  Trash, 
  Search,
  ArrowLeft,
  Package,
  ExternalLink,
  Info,
  X,
  Layers,
  Tag,
  AlertCircle,
  Save,
  Undo2,
  AlertTriangle,
  ShieldAlert,
  ChevronLeft,
  MoreVertical,
  Activity,
  History,
  GitBranch,
  Network,
  List,
  RefreshCw,
  PlusCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product, Category, SystemConfig } from './types';
import { api } from './apiService';

interface CategoryManagerProps {
  systemConfig: SystemConfig;
  products: Product[];
  primaryCategories: Category[];
  secondaryCategories: Category[];
  setPrimaryCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  setSecondaryCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  onCategoryRename: (oldName: string, newName: string, type: 'Primary' | 'Secondary') => void;
  onRefresh: () => void;
}

const MAX_DEPTH_PRIMARY = 10;
const MAX_DEPTH_SECONDARY = 7;

const CategoryManager: React.FC<CategoryManagerProps> = ({ 
  systemConfig,
  products, 
  primaryCategories, 
  secondaryCategories,
  onCategoryRename,
  onRefresh
}) => {
  const [activeRoot, setActiveRoot] = useState<'Primary' | 'Secondary'>('Primary');
  const [currentPath, setCurrentPath] = useState<string[]>([]); // Stack of IDs
  const [searchTerm, setSearchTerm] = useState('');
  const [inspectorTab, setInspectorTab] = useState<'details' | 'structure'>('details');
  
  useEffect(() => {
    onRefresh();
  }, []);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const currentCategories = useMemo(() => {
    return activeRoot === 'Primary' ? primaryCategories : secondaryCategories;
  }, [activeRoot, primaryCategories, secondaryCategories]);

  const currentDepthLimit = activeRoot === 'Primary' ? MAX_DEPTH_PRIMARY : MAX_DEPTH_SECONDARY;

  const breadcrumbs = useMemo(() => {
    return currentPath.map(id => currentCategories.find(c => c.id === id)).filter(Boolean) as Category[];
  }, [currentPath, currentCategories]);

  const folderId = currentPath[currentPath.length - 1] || null;

  const getDepth = (catId: string | null | undefined, list: Category[]): number => {
    if (!catId) return 0;
    let depth = 0;
    let current = list.find(c => c.id === catId);
    while (current) {
      depth++;
      current = list.find(c => c.id === current?.parentId);
    }
    return depth;
  };

  const displayedCategories = useMemo(() => {
    const isAtSystemRoot = !folderId;
    let list = currentCategories.filter(c => {
      const p = c.parentId;
      if (isAtSystemRoot) {
        return !p || p === "" || p === "null" || p === "undefined";
      }
      return p === folderId;
    });

    if (searchTerm) {
      list = list.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return list;
  }, [currentCategories, folderId, searchTerm]);

  const selectedCategory = useMemo(() => {
    if (!selectedCategoryId) return null;
    const cat = currentCategories.find(c => c.id === selectedCategoryId);
    if (!cat) return null;

    const assocProducts = products.filter(p => {
        const catVal = activeRoot === 'Primary' ? p.primaryCategory : p.secondaryCategory;
        // Match by ID primarily, fallback to Name
        return catVal === cat.id || catVal === cat.name;
    });

    return { ...cat, products: assocProducts, count: assocProducts.length };
  }, [selectedCategoryId, currentCategories, products, activeRoot]);

  const primaryRootExists = useMemo(() => {
    return primaryCategories.some(c => !c.parentId || c.parentId === "" || c.parentId === "null");
  }, [primaryCategories]);

  // STABLE HIERARCHY RESOLUTION
  const creationContext = useMemo(() => {
    // 1. If currently navigated inside a folder, that folder MUST be the parent.
    if (folderId) {
      const parent = currentCategories.find(c => c.id === folderId);
      return { 
        parentId: folderId, 
        parentName: parent?.name || 'Current Context', 
        isRoot: false,
        depth: getDepth(folderId, currentCategories) + 1
      };
    }
    // 2. If at root but an item is explicitly selected, target that selection.
    if (selectedCategoryId) {
      const parent = currentCategories.find(c => c.id === selectedCategoryId);
      return { 
        parentId: selectedCategoryId, 
        parentName: parent?.name || 'Selected Item', 
        isRoot: false,
        depth: getDepth(selectedCategoryId, currentCategories) + 1
      };
    }
    // 3. Fallback to Level 1 Root
    return { 
      parentId: null, 
      parentName: null, 
      isRoot: true,
      depth: 1
    };
  }, [selectedCategoryId, folderId, currentCategories]);

  const canAdd = useMemo(() => {
    if (activeRoot === 'Primary' && creationContext.isRoot && primaryRootExists) return false;
    return creationContext.depth <= currentDepthLimit;
  }, [activeRoot, creationContext, primaryRootExists, currentDepthLimit]);

  const handleAddCategory = async (name: string, desc: string) => {
    if (!canAdd) {
      alert("Hierarchy Error: Cannot create more roots in Primary Taxonomy or depth limit reached.");
      return;
    }

    // STRICT: Pass null for roots, UUID string for children. Do NOT pass undefined.
    const newCat: Category = {
      id: crypto.randomUUID(),
      name: name.trim(),
      description: desc.trim(),
      parentId: creationContext.parentId // This is either null or a UUID string
    };

    try {
      if (activeRoot === 'Primary') {
        await api.createCategory(systemConfig, newCat);
      } else {
        await api.createSecondaryCategory(systemConfig, newCat);
      }
      onRefresh();
      setIsAddModalOpen(false);
      setSelectedCategoryId(newCat.id); 
    } catch (err: any) {
      alert(`Database Fault: ${err?.message || "Check network or infrastructure constraints."}`);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedCategory) return;
    const updatedPayload: Category = {
      id: selectedCategory.id,
      name: editName,
      description: editDesc,
      parentId: selectedCategory.parentId
    };
    
    try {
      if (activeRoot === 'Primary') {
        await api.updateCategory(systemConfig, selectedCategory.id, updatedPayload);
      } else {
        await api.updateSecondaryCategory(systemConfig, selectedCategory.id, updatedPayload);
      }
      if (selectedCategory.name !== editName) onCategoryRename(selectedCategory.name, editName, activeRoot);
      onRefresh();
      setIsEditing(false);
    } catch (err: any) {
      alert(`Persistence Error: ${err?.message}`);
    }
  };

  const confirmDelete = async () => {
    if (!selectedCategoryId) return;
    try {
      if (activeRoot === 'Primary') {
        await api.deleteCategory(systemConfig, selectedCategoryId);
      } else {
        await api.deleteSecondaryCategory(systemConfig, selectedCategoryId);
      }
      onRefresh();
      setSelectedCategoryId(null);
      setIsDeleteModalOpen(false);
    } catch (err: any) {
      alert(`Constraint Refused: Ensure node has no children or SKU associations.`);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-[0.2em] mb-1">Infrastructure Architecture</p>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Taxonomy Orchestrator</h2>
          <p className="text-sm text-slate-400 font-medium mt-2">Physical separation of catalog hierarchies (Tables 9 & 10).</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onRefresh} className="p-3 bg-white text-indigo-600 border border-indigo-100 rounded-2xl shadow-sm hover:bg-indigo-50 transition-all"><RefreshCw size={20} /></button>
          <div className="p-1.5 bg-white rounded-2xl shadow-sm border border-slate-100 flex gap-1">
            <button 
              onClick={() => { setActiveRoot('Primary'); setCurrentPath([]); setSelectedCategoryId(null); }}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeRoot === 'Primary' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Primary
            </button>
            <button 
              onClick={() => { setActiveRoot('Secondary'); setCurrentPath([]); setSelectedCategoryId(null); }}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeRoot === 'Secondary' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Secondary
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-6">
          <nav className="flex items-center gap-3 py-4 overflow-x-auto no-scrollbar">
            <button 
              onClick={() => { setCurrentPath([]); setSelectedCategoryId(null); setSearchTerm(''); }}
              className={`p-3 rounded-xl transition-all ${currentPath.length === 0 ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100'}`}
            >
              <Layers size={18} />
            </button>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.id}>
                <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
                <button 
                  onClick={() => { setCurrentPath(currentPath.slice(0, idx + 1)); setSelectedCategoryId(null); setSearchTerm(''); }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${idx === breadcrumbs.length - 1 ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'}`}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))}
          </nav>

          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden min-h-[500px] flex flex-col">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input 
                  type="text" 
                  placeholder={`Search level...`}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-4 focus:ring-indigo-500/5 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                disabled={!canAdd}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg transition-all ${canAdd ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-50 text-slate-200 cursor-not-allowed'}`}
              >
                <FolderPlus size={18} />
                {creationContext.isRoot ? 'Add Root' : `Add to ${creationContext.parentName}`}
              </button>
            </div>

            <div className="flex-1 divide-y divide-slate-50 overflow-y-auto custom-scrollbar">
              {displayedCategories.length > 0 ? (
                displayedCategories.map(cat => (
                  <div key={cat.id} className="flex items-center group">
                    <button 
                      onClick={() => { setSelectedCategoryId(cat.id); setIsEditing(false); }}
                      className={`flex-1 flex items-center gap-6 p-8 text-left transition-all ${selectedCategoryId === cat.id ? 'bg-indigo-50/50' : 'hover:bg-slate-50/50'}`}
                    >
                      <div className={`p-4 rounded-2xl transition-all shadow-sm ${selectedCategoryId === cat.id ? 'bg-white text-indigo-600' : 'bg-slate-50 text-slate-300 group-hover:scale-110'}`}>
                        <Folder size={24} />
                      </div>
                      <div className="flex-1">
                        <p className={`font-black tracking-tight text-lg ${selectedCategoryId === cat.id ? 'text-indigo-900' : 'text-slate-900'}`}>{cat.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                          {currentCategories.filter(c => c.parentId === cat.id).length} Successors • Physical Depth {getDepth(cat.id, currentCategories)}
                        </p>
                      </div>
                    </button>
                    <button 
                      onClick={() => { setCurrentPath([...currentPath, cat.id]); setSelectedCategoryId(null); setSearchTerm(''); }}
                      className="p-8 text-slate-300 hover:text-indigo-600 transition-all border-l border-slate-50"
                      title="Navigate Downstream"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-20 text-center space-y-4">
                  <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-100">
                    <GitBranch size={48} />
                  </div>
                  <p className="text-sm font-bold text-slate-400 italic">
                    {activeRoot === 'Primary' && creationContext.isRoot && primaryRootExists 
                      ? "Primary root established. Select it to add Level 2 sub-categories."
                      : "No structural identifiers detected at this level."
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          {selectedCategory ? (
            <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col h-full animate-in slide-in-from-right-8 duration-700">
              <header className="p-10 pb-6 border-b border-slate-50">
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl">
                      <Folder size={32} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{selectedCategory.name}</h3>
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">
                        Registry Context: {activeRoot} • Depth {getDepth(selectedCategory.id, currentCategories)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditName(selectedCategory.name); setEditDesc(selectedCategory.description || ''); setIsEditing(true); setInspectorTab('details'); }} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Edit size={20} /></button>
                    <button onClick={() => setIsDeleteModalOpen(true)} className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash size={20} /></button>
                  </div>
                </div>

                <div className="p-1 bg-slate-50 rounded-2xl flex gap-1">
                  <button onClick={() => setInspectorTab('details')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${inspectorTab === 'details' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><List size={14} /> Details</button>
                  <button onClick={() => setInspectorTab('structure')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${inspectorTab === 'structure' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><Network size={14} /> Hierarchy</button>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
                {inspectorTab === 'details' ? (
                  isEditing ? (
                    <div className="space-y-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Node Display Label</label>
                        <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-4 transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Objective</label>
                        <textarea value={editDesc} rows={3} onChange={(e) => setEditDesc(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-4 transition-all" />
                      </div>
                      <div className="flex gap-4">
                        <button onClick={handleSaveEdit} className="flex-1 py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black shadow-xl">Commit</button>
                        <button onClick={() => setIsEditing(false)} className="px-10 py-5 bg-slate-100 text-slate-500 rounded-[1.5rem] font-black">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-10">
                      <div>
                        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">Mandate Identity</h4>
                        <p className="text-sm font-medium text-slate-500 italic leading-relaxed">"{selectedCategory.description || 'No objective provided.'}"</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">SKU Mapping</p>
                          <p className="text-3xl font-black text-slate-900 tracking-tighter">{selectedCategory.count}</p>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 text-center">
                           <button 
                             onClick={() => setIsAddModalOpen(true)}
                             className="w-full h-full flex flex-col items-center justify-center gap-1 group"
                           >
                             <PlusCircle className="text-indigo-600 group-hover:scale-110 transition-transform" />
                             <span className="text-[10px] font-black uppercase text-slate-400">Add Child</span>
                           </button>
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-inner">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">Successors</p>
                    {currentCategories.filter(c => c.parentId === selectedCategory.id).length > 0 ? (
                      <div className="space-y-3">
                        {currentCategories.filter(c => c.parentId === selectedCategory.id).map(child => (
                           <div key={child.id} className="flex items-center gap-3 p-4 bg-white rounded-2xl shadow-sm border border-slate-50">
                             <Folder size={16} className="text-indigo-400" />
                             <span className="text-xs font-bold text-slate-700">{child.name}</span>
                           </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-300 italic py-10 text-center">Leaf node reached.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-20 text-center space-y-6 opacity-40">
              <div className="w-32 h-32 bg-white rounded-[3rem] shadow-2xl flex items-center justify-center text-slate-100"><Search size={64} /></div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Metadata Inspector</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select a node to inspect structural linkages.</p>
            </div>
          )}
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-400">
            <div className="p-10 pb-0 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">
                  {creationContext.isRoot ? `Publish ${activeRoot} Root` : `Extend ${creationContext.parentName}`}
                </h3>
                <p className="text-sm text-slate-400 font-medium mt-1">
                  Target Depth: Level {creationContext.depth}
                </p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-3 bg-slate-50 text-slate-400 rounded-full hover:text-slate-900 transition-all"><X size={24} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); const d = new FormData(e.currentTarget); handleAddCategory(d.get('name') as string, d.get('desc') as string); }} className="p-10 space-y-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">Display Label</label>
                  <input name="name" required autoFocus placeholder="e.g. Sub-Assemblies" className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-slate-900 font-bold border-none focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">Mandate Objective</label>
                  <textarea name="desc" rows={3} placeholder="Define usage context..." className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-slate-900 font-bold border-none focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                </div>
              </div>
              <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-700 active:scale-95 transition-all">Publish to Registry</button>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && selectedCategory && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[110] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 text-center space-y-8">
            <div className="mx-auto w-24 h-24 rounded-[2rem] bg-red-100 text-red-600 flex items-center justify-center shadow-xl"><AlertTriangle size={48} /></div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Confirm Erasure</h3>
              <p className="text-sm text-slate-400 mt-3 leading-relaxed">Permanently erase <span className="font-bold text-slate-900">"{selectedCategory.name}"</span>? All structural successors and SKU mappings must be managed beforehand.</p>
            </div>
            <div className="flex flex-col gap-4">
              <button onClick={confirmDelete} className="w-full py-5 bg-red-600 text-white rounded-[1.5rem] font-black tracking-tight hover:bg-red-700 active:scale-95 transition-all">Erase Node</button>
              <button onClick={() => setIsDeleteModalOpen(false)} className="w-full py-5 bg-slate-100 text-slate-500 rounded-[1.5rem] font-black hover:bg-slate-200 transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManager;

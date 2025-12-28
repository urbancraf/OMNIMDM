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
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product, Category, SystemConfig } from './types.ts';
import { api } from './apiService.ts';

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
// 🔍 DEBUG LOG: Monitor Tab Switching
  useEffect(() => {
    console.log(`[UI] Current Active Tab1: ${activeRoot} | Date: ${new Date().toLocaleString()}`);
  }, [activeRoot]); 
 
  const [currentPath, setCurrentPath] = useState<string[]>([]); // Array of category IDs
  const [searchTerm, setSearchTerm] = useState('');
  const [inspectorTab, setInspectorTab] = useState<'details' | 'structure'>('details');
  
  useEffect(() => {
    onRefresh();
  }, []);

  // Selection & Modal States
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Edit States
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  /**
   * CHANGE: Select categories based on current activeRoot tab.
   * Logic remains similar, but the source data is already pre-filtered in App.tsx.
   */
  const currentCategories = activeRoot === 'Primary' ? primaryCategories : secondaryCategories;
  const currentDepthLimit = activeRoot === 'Primary' ? MAX_DEPTH_PRIMARY : MAX_DEPTH_SECONDARY;
  
//  console.log(`[UI] Current Active Tab2 activeroot       : ${activeRoot} | Date: ${new Date().toLocaleString()}`);
//  console.log(`[UI] Current Active Tab3 CurrCategories   : ${currentCategories} | Date: ${new Date().toLocaleString()}`);
//  console.log(`[UI] Current Active Tab4 currentDepthLimit: ${currentDepthLimit} | Date: ${new Date().toLocaleString()}`);

  const breadcrumbs = useMemo(() => {
    return currentPath.map(id => currentCategories.find(c => c.id === id)).filter(Boolean) as Category[];
  }, [currentPath, currentCategories]);

  const parentId = currentPath[currentPath.length - 1];

  const getDepth = (catId: string | undefined, list: Category[]): number => {
    if (!catId) return 0;
    let depth = 0;
    let current = list.find(c => c.id === catId);
    while (current) {
      depth++;
      current = list.find(c => c.id === current?.parentId);
    }
    return depth;
  };

  const currentDepth = getDepth(parentId, currentCategories);

  const displayedCategories = useMemo(() => {
    const isRootTarget = !parentId;
    
    /**
     * CHANGE: Ensure categories shown only match the active root and parent.
     */
    let list = currentCategories.filter(c => {
      const catType = (c as any).type || 'Primary';
      if (catType !== activeRoot) return false;

      const p = c.parentId;
      if (isRootTarget) {
        return !p || p === "" || p === "null" || p === "undefined";
      }
      return p === parentId;
    });

    if (searchTerm) {
      list = list.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return list;
  }, [currentCategories, parentId, searchTerm, activeRoot]);

  const selectedCategory = useMemo(() => {
    if (!selectedCategoryId) return null;
    const cat = currentCategories.find(c => c.id === selectedCategoryId);
    if (!cat) return null;

    const catType = (cat as any).type || 'Primary';
    if (catType !== activeRoot) return null;

    const assocProducts = products.filter(p => 
      activeRoot === 'Primary' ? p.primaryCategory === cat.name : p.secondaryCategory === cat.name
    );

    return { ...cat, products: assocProducts, count: assocProducts.length };
  }, [selectedCategoryId, currentCategories, products, activeRoot]);

  const TreeBranch: React.FC<{ parentId: string, depth: number }> = ({ parentId, depth }) => {
    const children = currentCategories.filter(c => {
        const catType = (c as any).type || 'Primary';
        return c.parentId === parentId && catType === activeRoot;
    });
    
    if (children.length === 0) return null;

    return (
      <div className="ml-6 border-l border-indigo-100 pl-4 space-y-2 mt-2">
        {children.map(child => (
          <div key={child.id} className="animate-in slide-in-from-left-2 duration-300">
            <button 
              onClick={() => setSelectedCategoryId(child.id)}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all w-full text-left group ${selectedCategoryId === child.id ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-indigo-50 text-slate-600'}`}
            >
              <Folder size={16} className={selectedCategoryId === child.id ? 'text-white' : 'text-slate-300 group-hover:text-indigo-400'} />
              <div className="flex-1">
                <p className="text-xs font-bold truncate">{child.name}</p>
                <p className={`text-[8px] font-black uppercase tracking-widest mt-0.5 ${selectedCategoryId === child.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {currentCategories.filter(c => c.parentId === child.id && ((c as any).type || 'Primary') === activeRoot).length} Sub-nodes
                </p>
              </div>
            </button>
            <TreeBranch parentId={child.id} depth={depth + 1} />
          </div>
        ))}
      </div>
    );
  };

  const handleAddCategory = async (name: string, desc: string) => {
    if (currentDepth >= currentDepthLimit) {
      alert(`Maximum depth of ${currentDepthLimit} levels reached.`);
      return;
    }

    /**
     * CHANGE: Explicitly assign the 'type' property based on activeRoot.
     * This ensures the category is correctly routed to Primary or Secondary groups.
     *
    const newCat: any = {
      id: crypto.randomUUID(),
      name: name.trim(),
      description: desc.trim() || `Sub-category in ${activeRoot}`,
      parentId: parentId || null,
      type: activeRoot 
    };
*/
	const newCat: any = {
      name: name.trim(),
      description: desc.trim() || `Sub-category in ${activeRoot}`,
      parentId: parentId || null,
      type: activeRoot 
    };

	
// 🔍 DEBUG LOG: Capture UI state before API call
    console.log("[UI] Creating Category with Type:", {
      assignedType: newCat.type,
      currentTab: activeRoot,
      timestamp: new Date().toLocaleString()
    });	
	
// 🔍 DEBUG LOG1: Check if UI is creating the object with the correct type
    console.log("[CategoryManager] Creating new category:", newCat);

    try {
      await api.createCategory(systemConfig, newCat);
      onRefresh();
      setIsAddModalOpen(false);
    } catch (err) {
      alert("Failed to persist category to database.");
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedCategory) return;
    const oldName = selectedCategory.name;
    
    const updatedPayload: any = {
      id: selectedCategory.id,
      name: editName,
      description: editDesc,
      parentId: selectedCategory.parentId,
      type: (selectedCategory as any).type || 'Primary'
    };

// 🔍 DEBUG LOG2: Check if update payload preserves the type
    console.log("[CategoryManager] Updating category:", updatedPayload);

    try {
      await api.updateCategory(systemConfig, selectedCategory.id, updatedPayload);
      if (oldName !== editName) onCategoryRename(oldName, editName, activeRoot);
      onRefresh();
      setIsEditing(false);
    } catch (err) {
      alert("Persistence Failure.");
    }
  };

  const confirmDelete = async () => {
    if (!selectedCategoryId) return;
    try {
      await api.deleteCategory(systemConfig, selectedCategoryId);
      onRefresh();
      setSelectedCategoryId(null);
      setIsDeleteModalOpen(false);
    } catch (err) {
      alert("Delete restricted.");
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-[0.2em] mb-1">Architecture</p>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Taxonomy Manager</h2>
          <p className="text-sm text-slate-400 font-medium mt-2">Manage hierarchical lineages for complex catalogs.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={onRefresh}
            className="flex items-center gap-2 px-6 py-2.5 bg-white text-indigo-600 border border-indigo-100 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-sm"
          >
            <RefreshCw size={14} /> Pull DB
          </button>
          <div className="p-1.5 bg-slate-100 rounded-[1.5rem] flex gap-1">
            <button 
              onClick={() => { setActiveRoot('Primary'); setCurrentPath([]); setSelectedCategoryId(null); setIsEditing(false); }}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeRoot === 'Primary' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Primary
            </button>
            <button 
              onClick={() => { setActiveRoot('Secondary'); setCurrentPath([]); setSelectedCategoryId(null); setIsEditing(false); }}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeRoot === 'Secondary' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
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
              onClick={() => { setCurrentPath([]); setSearchTerm(''); }}
              className={`p-3 rounded-xl transition-all ${currentPath.length === 0 ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100'}`}
            >
              <Layers size={18} />
            </button>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.id}>
                <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
                <button 
                  onClick={() => {
                    setCurrentPath(currentPath.slice(0, idx + 1));
                    setSearchTerm('');
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${idx === breadcrumbs.length - 1 ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'}`}
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
                  placeholder={`Filter ${activeRoot} branch...`}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-4 focus:ring-indigo-500/5 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                disabled={currentDepth >= currentDepthLimit}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${currentDepth >= currentDepthLimit ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200'}`}
              >
                <FolderPlus size={18} />
                Sub-Category
              </button>
            </div>

            <div className="flex-1 divide-y divide-slate-50 overflow-y-auto custom-scrollbar">
              {displayedCategories.length > 0 ? (
                displayedCategories.map(cat => (
                  <div key={cat.id} className="flex items-center group">
                    <button 
                      onClick={() => {
                        setSelectedCategoryId(cat.id);
                        setIsEditing(false);
                      }}
                      className={`flex-1 flex items-center gap-6 p-8 text-left transition-all ${selectedCategoryId === cat.id ? 'bg-indigo-50/50' : 'hover:bg-slate-50/50'}`}
                    >
                      <div className={`p-4 rounded-2xl transition-all shadow-sm ${selectedCategoryId === cat.id ? 'bg-white text-indigo-600' : 'bg-slate-50 text-slate-300 group-hover:scale-110'}`}>
                        <Folder size={24} />
                      </div>
                      <div className="flex-1">
                        <p className={`font-black tracking-tight text-lg ${selectedCategoryId === cat.id ? 'text-indigo-900' : 'text-slate-900'}`}>{cat.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                          {currentCategories.filter(c => c.parentId === cat.id && ((c as any).type || 'Primary') === activeRoot).length} Sub-nodes • {products.filter(p => activeRoot === 'Primary' ? p.primaryCategory === cat.name : p.secondaryCategory === cat.name).length} SKUs
                        </p>
                      </div>
                    </button>
                    <button 
                      onClick={() => {
                        setCurrentPath([...currentPath, cat.id]);
                        setSearchTerm('');
                      }}
                      className="p-8 text-slate-300 hover:text-indigo-600 transition-all border-l border-slate-50"
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
                  <p className="text-sm font-bold text-slate-400">This {activeRoot} branch is structural but empty.</p>
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
                    <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl">
                      <Folder size={32} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{selectedCategory.name}</h3>
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">
                        Node Identity Inspector ({activeRoot})
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { 
                        setEditName(selectedCategory.name); 
                        setEditDesc(selectedCategory.description || ''); 
                        setIsEditing(true); 
                        setInspectorTab('details');
                      }} 
                      className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    >
                      <Edit size={20} />
                    </button>
                    <button onClick={() => setIsDeleteModalOpen(true)} className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                      <Trash size={20} />
                    </button>
                  </div>
                </div>

                <div className="p-1 bg-slate-50 rounded-2xl flex gap-1">
                  <button 
                    onClick={() => setInspectorTab('details')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${inspectorTab === 'details' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <List size={14} /> Details
                  </button>
                  <button 
                    onClick={() => setInspectorTab('structure')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${inspectorTab === 'structure' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <Network size={14} /> Structure Map
                  </button>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
                {inspectorTab === 'details' ? (
                  isEditing ? (
                    <div className="space-y-8 animate-in fade-in duration-500">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Node Display Label</label>
                        <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Structural Context</label>
                        <textarea value={editDesc} rows={3} onChange={(e) => setEditDesc(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                      </div>
                      <div className="flex gap-4">
                        <button onClick={handleSaveEdit} className="flex-1 py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">Save Node</button>
                        <button onClick={() => setIsEditing(false)} className="px-10 py-5 bg-slate-100 text-slate-500 rounded-[1.5rem] font-black hover:bg-slate-200 transition-all">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-10 animate-in fade-in duration-500">
                      <div>
                        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">Architecture Objective</h4>
                        <p className="text-sm font-medium text-slate-500 leading-relaxed italic">"{selectedCategory.description || 'No objective defined.'}"</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 bg-[#F2F2F7] rounded-[2rem] border border-slate-100">
                          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">SKUs Assigned</p>
                          <p className="text-3xl font-black text-slate-900 tracking-tighter">{selectedCategory.count}</p>
                        </div>
                        <div className="p-6 bg-[#F2F2F7] rounded-[2rem] border border-slate-100">
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Successors</p>
                          <p className="text-3xl font-black text-slate-900 tracking-tighter">{currentCategories.filter(c => c.parentId === selectedCategory.id && ((c as any).type || 'Primary') === activeRoot).length}</p>
                        </div>
                      </div>

                      <div className="pt-8 border-t border-slate-50">
                        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-6">Linked Assets</h4>
                        <div className="space-y-4">
                          {selectedCategory.products.length > 0 ? (
                            selectedCategory.products.map(p => (
                              <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 overflow-hidden shadow-sm">
                                    <img src={p.images.find(i => i.isPrimary)?.url || 'https://picsum.photos/seed/placeholder/200/200'} alt="" className="w-full h-full object-cover" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-slate-900">{p.name}</p>
                                    <p className="text-[10px] font-mono text-slate-400">{p.sku}</p>
                                  </div>
                                </div>
                                <Link to={`/products/edit/${p.id}`} className="p-2 text-slate-300 hover:text-indigo-600 transition-all">
                                  <ExternalLink size={16} />
                                </Link>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs font-bold text-slate-300 text-center py-10">No live SKU assignments for this structural node.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="animate-in fade-in duration-500">
                    <div className="flex items-center gap-4 mb-8">
                       <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                          <Network size={20} />
                       </div>
                       <div>
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Downstream Topology</h4>
                          <p className="text-[10px] text-slate-400 font-medium">Visualizing inherited hierarchy branches.</p>
                       </div>
                    </div>
                    
                    <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-inner">
                      <div className="flex items-center gap-3 p-3 bg-indigo-600 text-white rounded-xl shadow-lg mb-4">
                        <Folder size={16} />
                        <span className="text-xs font-black uppercase tracking-widest">{selectedCategory.name} (Root)</span>
                      </div>
                      <TreeBranch parentId={selectedCategory.id} depth={0} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-20 text-center space-y-6 opacity-40 animate-in fade-in duration-1000">
              <div className="w-32 h-32 bg-white rounded-[3rem] shadow-2xl flex items-center justify-center text-slate-100">
                <Search size={64} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Hierarchy Inspector</h3>
                <p className="text-sm text-slate-400 font-medium max-w-xs mx-auto mt-2">Select a {activeRoot} category node to investigate its topological successors.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-400">
            <div className="p-10 pb-0 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Extend {activeRoot} Hierarchy</h3>
                <p className="text-sm text-slate-400 font-medium mt-1">Design sub-node at depth level {currentDepth + 1}.</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-full transition-all">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); const d = new FormData(e.currentTarget); handleAddCategory(d.get('name') as string, d.get('desc') as string); }} className="p-10 space-y-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">Node Display Name</label>
                  <input name="name" required autoFocus placeholder="e.g. Technical Components" className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-slate-900 font-bold border-none focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">Structural Context</label>
                  <textarea name="desc" placeholder="Define usage context..." rows={3} className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-slate-900 font-bold border-none focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                </div>
              </div>
              <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black tracking-tight shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">Register {activeRoot} Node</button>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && selectedCategory && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[110] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-400">
            <div className="p-10 text-center space-y-8">
              <div className={`mx-auto w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-xl ${selectedCategory.count > 0 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                {selectedCategory.count > 0 ? <ShieldAlert size={48} /> : <AlertTriangle size={48} />}
              </div>
              
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">
                  {selectedCategory.count > 0 ? 'Architectural Constraint' : 'Confirm Removal'}
                </h3>
                <p className="text-sm text-slate-400 font-medium mt-3 leading-relaxed">
                  Removing <span className="font-bold text-slate-900">"{selectedCategory.name}"</span> will erase this structural branch.
                  {selectedCategory.count > 0 && ` Action restricted: ${selectedCategory.count} SKUs are linked. Reassign them before deletion.`}
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {selectedCategory.count === 0 ? (
                  <>
                    <button onClick={confirmDelete} className="w-full py-5 bg-red-600 text-white rounded-[1.5rem] font-black tracking-tight hover:bg-red-700 transition-all">Yes, Remove Node</button>
                    <button onClick={() => setIsDeleteModalOpen(false)} className="w-full py-5 bg-slate-100 text-slate-500 rounded-[1.5rem] font-black hover:bg-slate-200 transition-all">Cancel</button>
                  </>
                ) : (
                  <button onClick={() => setIsDeleteModalOpen(false)} className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black shadow-xl hover:bg-slate-800 transition-all">Understood</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManager;

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Edit, 
  Trash2, 
  ExternalLink, 
  Copy,
  ChevronLeft,
  ChevronRight,
  GitMerge,
  X,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { Product, ProductStatus, WorkflowBlueprint } from '../types';

interface ProductListProps {
  products: Product[];
  blueprints: WorkflowBlueprint[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  onAssignWorkflow: (id: string, type: string) => void;
  onRefresh: () => void;
  onDeleteProduct?: (id: string) => void;
}

const ProductList: React.FC<ProductListProps> = ({ 
  products, 
  blueprints, 
  setProducts, 
  onAssignWorkflow, 
  onRefresh, 
  onDeleteProduct 
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [workflowTargetId, setWorkflowTargetId] = useState<string | null>(null);
  
  useEffect(() => {
    onRefresh();
  }, []);

  const filteredProducts = useMemo(() => {
    const list = Array.isArray(products) ? products : [];
    return list.filter(p => {
      const name = p.name || '';
      const sku = p.sku || '';
      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            sku.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'All' || 
                              p.primaryCategory === categoryFilter || 
                              p.secondaryCategory === categoryFilter;
                              
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchTerm, categoryFilter, statusFilter]);

  const activeBlueprints = useMemo(() => (blueprints || []).filter(b => b.isActive), [blueprints]);

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    const list = Array.isArray(products) ? products : [];
    list.forEach(p => {
      if (p.primaryCategory) cats.add(p.primaryCategory);
      if (p.secondaryCategory) cats.add(p.secondaryCategory);
    });
    return Array.from(cats).sort();
  }, [products]);

  const handleExportCSV = () => {
    const headers = ['SKU', 'Name', 'Primary Category', 'Secondary Category', 'Brand', 'Tax', 'Status'];
    const rows = filteredProducts.map(p => [
      p.sku,
      `"${p.name}"`,
      `"${p.primaryCategory}"`,
      `"${p.secondaryCategory || ''}"`,
      `"${p.brand}"`,
      p.tax,
      p.status
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "omnipim_products.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const confirmDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to permanently delete SKU: ${name}?\n\nThis action cannot be undone.`)) {
      if (onDeleteProduct) onDeleteProduct(id);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Product Catalog</h2>
          <p className="text-slate-500">Manage your master product data and variants.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onRefresh}
            className="flex items-center gap-2 px-4 py-2 text-indigo-600 bg-white border border-indigo-100 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            <RefreshCw size={18} />
            <span className="hidden lg:inline">Pull DB</span>
          </button>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Download size={18} />
            <span className="hidden lg:inline">Export</span>
          </button>
          <Link 
            to="/products/new"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus size={18} />
            <span>Add Product</span>
          </Link>
        </div>
      </header>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name, SKU..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-400" />
            <select 
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <select 
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value={ProductStatus.ACTIVE}>Active</option>
            <option value={ProductStatus.DRAFT}>Draft</option>
            <option value={ProductStatus.INACTIVE}>Inactive</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Categories</th>
                <th className="px-6 py-4">Brand</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200">
                          <img 
                            src={(Array.isArray(p.images) ? p.images : []).find(i => i.isPrimary)?.url || 'https://picsum.photos/seed/placeholder/200/200'} 
                            alt={p.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{p.name}</p>
                          <p className="text-xs text-slate-500 font-mono flex items-center gap-1">
                            {p.sku}
                            <button 
                              onClick={() => { navigator.clipboard.writeText(p.sku); }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                            >
                               <Copy size={12} className="text-slate-400 hover:text-indigo-500" />
                            </button>
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-slate-600 truncate max-w-[150px]">{p.primaryCategory}</span>
                        {p.secondaryCategory && (
                          <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded w-fit truncate max-w-[150px]">{p.secondaryCategory}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{p.brand}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs
                        ${p.status === ProductStatus.ACTIVE ? 'bg-emerald-100 text-emerald-800' : 
                          p.status === ProductStatus.DRAFT ? 'bg-amber-100 text-amber-800' : 
                          'bg-slate-100 text-slate-800'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          type="button"
                          onClick={() => setWorkflowTargetId(p.id)}
                          className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Assign Workflow"
                        >
                          <GitMerge size={18} />
                        </button>
                        <button 
                          type="button"
                          onClick={() => navigate(`/products/edit/${p.id}`)}
                          className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Edit Product"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          type="button"
                          onClick={() => confirmDelete(p.id, p.name)}
                          className="p-2 text-slate-400 hover:text-rose-600 transition-all active:scale-90"
                          title="Permanent Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium italic">
                    No products found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Workflow Selection Modal */}
      {workflowTargetId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-400">
            <div className="p-10 pb-6 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Initiate Workflow</h3>
                <p className="text-sm text-slate-400 font-medium mt-1">Select an active systemic pipeline.</p>
              </div>
              <button onClick={() => setWorkflowTargetId(null)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-full transition-all">
                <X size={24} />
              </button>
            </div>
            <div className="p-10 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {activeBlueprints.length > 0 ? (
                activeBlueprints.map(bp => (
                  <button 
                    key={bp.id}
                    onClick={() => { onAssignWorkflow(workflowTargetId, bp.name); setWorkflowTargetId(null); }}
                    className="w-full text-left p-6 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-100 rounded-[2rem] transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight">{bp.name}</span>
                      <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-xs text-slate-400 font-medium line-clamp-2">{(bp.description || 'No description.')}</p>
                  </button>
                ))
              ) : (
                <div className="text-center py-10">
                  <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">No Active Pipelines</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;

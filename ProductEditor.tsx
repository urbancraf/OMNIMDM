
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Sparkles, 
  Trash2, 
  Image as ImageIcon, 
  PlusCircle,
  AlertCircle,
  Tag,
  Dna,
  DollarSign,
  FileText,
  Fingerprint,
  Layers,
  ShoppingBag,
  Info,
  RefreshCw,
  X
} from 'lucide-react';
import { Product, ProductStatus, ProductAttribute, ProductImage, MasterAttribute, Category } from './types';
import { BRANDS } from './constants';
import { generateProductDescription } from './geminiService';

interface ProductEditorProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  primaryCategories: Category[];
  secondaryCategories: Category[];
  onSave: (product: Product) => Promise<void>;
}

const ProductEditor: React.FC<ProductEditorProps> = ({ 
  products, 
  primaryCategories, 
  secondaryCategories,
  onSave
}) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');

  const [formData, setFormData] = useState<Partial<Product>>({
    sku: '',
    name: '',
    shortDescription: '',
    longDescription: '',
    primaryCategory: '',
    secondaryCategory: '',
    brand: BRANDS[0],
    brandName: '',
    mrp: '0.00',
    mrpPrice: '',
    sellingPrice: '0.00',
    tax: '0.00',
    taxRate: '',
    status: ProductStatus.DRAFT,
    attributes: [],
    images: []
  });

  const [masterAttributes] = useState<MasterAttribute[]>(() => {
    const saved = localStorage.getItem('omnipim_master_attributes');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (isEditing) {
      const product = products.find(p => p.id === id);
      if (product) {
        setFormData({
          ...product,
          attributes: Array.isArray(product.attributes) ? product.attributes : [],
          images: Array.isArray(product.images) ? product.images : []
        });
      } else {
        navigate('/products');
      }
    } else {
      if (primaryCategories.length > 0 && !formData.primaryCategory) {
        setFormData(prev => ({ ...prev, primaryCategory: primaryCategories[0].id }));
      }
    }
  }, [id, isEditing, products, navigate, primaryCategories]);

  const applicableMasterAttributes = useMemo(() => {
    const selectedCat = primaryCategories.find(c => c.id === formData.primaryCategory);
    const catName = selectedCat?.name || '';
    
    return masterAttributes.filter(ma => 
      !ma.scopedCategory || ma.scopedCategory === catName
    );
  }, [masterAttributes, formData.primaryCategory, primaryCategories]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAttributeChange = (key: string, val: string) => {
    setFormData(prev => {
      const currentAttrs = Array.isArray(prev.attributes) ? [...prev.attributes] : [];
      const index = currentAttrs.findIndex(a => a.key === key);
      if (index > -1) {
        currentAttrs[index] = { ...currentAttrs[index], value: val };
      } else {
        currentAttrs.push({ key, value: val });
      }
      return { ...prev, attributes: currentAttrs };
    });
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    const currentImages = Array.isArray(formData.images) ? formData.images : [];
    const newImg: ProductImage = { 
      id: crypto.randomUUID(), 
      url: imageUrlInput.trim(), 
      isPrimary: currentImages.length === 0 
    };
    setFormData(prev => ({ ...prev, images: [...currentImages, newImg] }));
    setImageUrlInput('');
  };

  const handleGenerateAI = async () => {
    if (!formData.name) return alert("Product name is required for AI generation.");
    setIsGenerating(true);
    const attrs = Array.isArray(formData.attributes) ? formData.attributes : [];
    const attrString = attrs.map(a => `${a.key}: ${a.value}`).join(', ');
    const result = await generateProductDescription(formData.name, formData.brand || '', attrString);
    if (result) {
      setFormData(prev => ({
        ...prev,
        shortDescription: result.shortDescription,
        longDescription: result.longDescription
      }));
    }
    setIsGenerating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.sku || !formData.name || !formData.primaryCategory) {
      setError("SKU, Name, and Primary Category are mandatory system identifiers.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    try {
      const productToSave = {
        ...formData,
        id: isEditing ? (id || '') : crypto.randomUUID(),
        updatedAt: new Date().toISOString(),
        createdAt: isEditing ? (formData.createdAt || new Date().toISOString()) : new Date().toISOString(),
        attributes: Array.isArray(formData.attributes) ? formData.attributes : [],
        images: Array.isArray(formData.images) ? formData.images : []
      } as Product;

      await onSave(productToSave);
      navigate('/products');
    } catch (err: any) {
      console.error("Save failure:", err);
      setError(err.message || "Failed to persist product data. The database might have rejected the transaction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const productImages = Array.isArray(formData.images) ? formData.images : [];
  const productAttributes = Array.isArray(formData.attributes) ? formData.attributes : [];

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in slide-in-from-right-4 duration-700 pb-20">
      <header className="flex items-center justify-between sticky top-0 bg-[#F2F2F7]/90 backdrop-blur-md z-30 py-6 -mx-4 px-4 border-b border-slate-200">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/products')} className="p-3 bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl transition-all shadow-sm text-slate-400">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">
              {isEditing ? 'Sync SKU Identity' : 'SKU Creation'}
            </h2>
            <p className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.2em] mt-1">
               Authority: {isEditing ? formData.sku : 'New Registry Entry'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button type="button" onClick={handleGenerateAI} disabled={isGenerating || isSubmitting} className="flex items-center gap-2 px-6 py-4 bg-white text-indigo-600 border border-indigo-100 rounded-[1.25rem] hover:bg-indigo-50 transition-all font-black text-xs uppercase tracking-widest disabled:opacity-50">
            <Sparkles size={18} className={isGenerating ? 'animate-spin' : ''} />
            <span>AI Enrich</span>
          </button>
          <button onClick={handleSubmit} disabled={isSubmitting} className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-[1.25rem] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 font-black text-xs uppercase tracking-widest disabled:opacity-70">
            {isSubmitting ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
            <span>{isSubmitting ? 'Syncing...' : 'Commit to DB'}</span>
          </button>
        </div>
      </header>

      {error && (
        <div className="bg-rose-50 p-6 rounded-3xl flex items-center gap-4 text-rose-700 border border-rose-100 shadow-sm animate-in shake duration-500">
          <AlertCircle size={24} />
          <div className="flex-1">
             <p className="text-xs font-bold uppercase tracking-tight">Database Transaction Error</p>
             <p className="text-sm">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="p-2 hover:bg-rose-100 rounded-full transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-12">
        {/* BLOCK 1: Identity & System Tags */}
        <section className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/40 border border-slate-100 space-y-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg"><Fingerprint size={24} /></div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">1. Identity Hub</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Core Identifiers & System Status</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Global SKU *</label>
              <input name="sku" value={formData.sku} onChange={handleInputChange} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all" placeholder="e.g. ELEC-9923" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Display Label *</label>
              <input name="name" value={formData.name} onChange={handleInputChange} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all" placeholder="Product Title" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Lifecycle State</label>
              <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all">
                <option value={ProductStatus.DRAFT}>Draft</option>
                <option value={ProductStatus.ACTIVE}>Active</option>
                <option value={ProductStatus.INACTIVE}>Inactive</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Brand Provider</label>
              <select name="brand" value={formData.brand} onChange={handleInputChange} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none">
                {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">Brand Name (Display)</label>
              <input name="brandName" value={formData.brandName} onChange={handleInputChange} placeholder="e.g. TechNova Enterprise" className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Primary Category *</label>
              <select name="primaryCategory" value={formData.primaryCategory} onChange={handleInputChange} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all">
                <option value="">Select Category</option>
                {primaryCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Secondary Category</label>
              <select name="secondaryCategory" value={formData.secondaryCategory} onChange={handleInputChange} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all">
                <option value="">None Assigned</option>
                {secondaryCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* Commercial & Technical blocks remain consistent with PIM V5 functionality */}
        {/* ... (rest of ProductEditor code) ... */}
      </form>
    </div>
  );
};

export default ProductEditor;

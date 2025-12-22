
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
import { Product, ProductStatus, ProductAttribute, ProductImage, MasterAttribute, Category } from '../types';
import { BRANDS } from '../constants';
import { generateProductDescription } from '../geminiService';

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

        {/* BLOCK 2: Commercial Logic & Pricing */}
        <section className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/40 border border-slate-100 space-y-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shadow-sm"><DollarSign size={24} /></div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">2. Commercial Logic</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Pricing Matrix & Taxation Defaults</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">MRP (Numeric Value)</label>
              <input type="number" step="0.01" name="mrp" value={formData.mrp} onChange={handleInputChange} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">MRP Label (Display Price)</label>
              <input name="mrpPrice" value={formData.mrpPrice} onChange={handleInputChange} placeholder="e.g. $199.99" className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Selling Price (Numeric)</label>
              <input type="number" step="0.01" name="sellingPrice" value={formData.sellingPrice} onChange={handleInputChange} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tax (%)</label>
              <input type="number" step="0.01" name="tax" value={formData.tax} onChange={handleInputChange} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tax Rate (Display Label)</label>
              <input name="taxRate" value={formData.taxRate} onChange={handleInputChange} placeholder="e.g. GST 18%" className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all" />
            </div>
          </div>
        </section>

        {/* BLOCK 3: Narrative & Copywriting */}
        <section className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/40 border border-slate-100 space-y-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-sm"><FileText size={24} /></div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">3. Copywriting</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Enrichment Content & Narrative</p>
            </div>
          </div>
          
          <div className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Short Description</label>
              <input name="shortDescription" value={formData.shortDescription} onChange={handleInputChange} placeholder="Concise summary for catalog lists..." className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Long Description (Technical/Marketing Copy)</label>
              <textarea name="longDescription" rows={5} value={formData.longDescription} onChange={handleInputChange} placeholder="Comprehensive product story and details..." className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all" />
            </div>
          </div>
        </section>

        {/* BLOCK 4: Asset Registry */}
        <section className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/40 border border-slate-100 space-y-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl shadow-sm"><ImageIcon size={24} /></div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">4. Media Library</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Visual Asset Propagation</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <input placeholder="Public URL for Image Asset..." className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all" value={imageUrlInput} onChange={(e) => setImageUrlInput(e.target.value)} />
              <button type="button" onClick={handleAddImageUrl} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">Add Asset</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6">
              {productImages.map((img, idx) => (
                <div key={img.id} className="relative aspect-square rounded-[2rem] bg-white border border-slate-100 overflow-hidden group shadow-sm transition-all hover:shadow-md">
                  <img src={img.url} className="w-full h-full object-cover" alt="" />
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, images: productImages.filter((_, i) => i !== idx) }))} className="p-3 bg-white text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-lg"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
              {productImages.length === 0 && (
                 <div className="col-span-full py-10 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                    <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No Visual Assets Registered</p>
                 </div>
              )}
            </div>
          </div>
        </section>

        {/* BLOCK 5: Technical Specifications (Master Inheritance) */}
        <section className="bg-[#F2F2F7] p-10 rounded-[3rem] border border-slate-200/50 space-y-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg"><Dna size={24} /></div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">5. Master Specifications</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Data Inheritance & Specialized Technical Points</p>
              </div>
            </div>
            <button type="button" onClick={() => setFormData(prev => ({ ...prev, attributes: [...productAttributes, { key: '', value: '' }] }))} className="p-3 bg-white text-indigo-600 rounded-2xl shadow-sm hover:bg-indigo-50 transition-all border border-indigo-100 active:scale-90">
               <PlusCircle size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {applicableMasterAttributes.length > 0 && (
              <div className="col-span-full bg-white/40 p-4 rounded-2xl flex items-center gap-3 text-indigo-600 border border-indigo-50 animate-in fade-in">
                <Info size={16} />
                <p className="text-[10px] font-black uppercase tracking-widest">Mandatory keys suggested based on Taxonomy selection</p>
              </div>
            )}
            
            {applicableMasterAttributes.map(ma => (
               <div key={`ma-${ma.id}`} className="flex flex-col gap-2 p-6 bg-white rounded-[2rem] shadow-sm border border-indigo-50 group transition-all hover:border-indigo-200">
                  <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest px-1">
                    {ma.name} (Mandatory Key)
                  </label>
                  <input 
                    placeholder={`Define ${ma.name.toLowerCase()}...`}
                    value={productAttributes.find(a => a.key === ma.name)?.value || ''}
                    onChange={(e) => handleAttributeChange(ma.name, e.target.value)}
                    className="w-full bg-slate-50 border-none px-6 py-4 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 transition-all" 
                  />
                  <p className="text-[9px] text-slate-300 font-medium px-1 italic">{ma.description}</p>
               </div>
            ))}

            {productAttributes
              .filter(attr => !applicableMasterAttributes.some(ma => ma.name === attr.key))
              .map((attr, idx) => (
                <div key={`custom-${idx}`} className="flex gap-4 p-6 bg-white rounded-[2rem] shadow-sm border border-slate-100 group animate-in slide-in-from-bottom-2">
                  <div className="flex-1 space-y-4">
                    <input placeholder="Attribute Key" className="w-full bg-slate-50 border-none px-4 py-2 rounded-xl text-xs font-bold" value={attr.key} onChange={(e) => {
                      const n = [...productAttributes];
                      const realIdx = n.indexOf(attr);
                      n[realIdx].key = e.target.value;
                      setFormData({...formData, attributes: n});
                    }} />
                    <input placeholder="Value" className="w-full bg-slate-50 border-none px-4 py-2 rounded-xl text-xs font-bold" value={attr.value} onChange={(e) => {
                      const n = [...productAttributes];
                      const realIdx = n.indexOf(attr);
                      n[realIdx].value = e.target.value;
                      setFormData({...formData, attributes: n});
                    }} />
                  </div>
                  <button type="button" onClick={() => setFormData(prev => ({ ...prev, attributes: productAttributes.filter(a => a !== attr) }))} className="p-3 text-slate-300 hover:text-rose-600 transition-colors self-center">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
          </div>
        </section>

        <div className="flex items-center justify-end gap-6 pt-12">
          <button type="button" onClick={() => navigate('/products')} className="px-10 py-4 text-slate-400 font-bold hover:text-slate-900 transition-colors uppercase text-xs tracking-widest">Discard Session</button>
          <button type="submit" disabled={isSubmitting} className="px-14 py-5 bg-indigo-600 text-white font-black rounded-[2rem] shadow-2xl hover:bg-indigo-700 transition-all active:scale-95 uppercase text-xs tracking-widest disabled:opacity-70">
            {isSubmitting ? 'Registering SKU...' : 'Register SKU Registry'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductEditor;

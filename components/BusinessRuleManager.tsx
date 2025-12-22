
import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Settings2, 
  Lock, 
  Unlock,
  AlertTriangle,
  FileCode,
  Tag,
  Package,
  Info,
  Code,
  Terminal,
  Cpu
} from 'lucide-react';
import { BusinessRule, RuleType, User } from '../types';

interface BusinessRuleManagerProps {
  currentUser: User;
  businessRules: BusinessRule[];
  setBusinessRules: React.Dispatch<React.SetStateAction<BusinessRule[]>>;
  primaryCategories: string[];
  masterAttributes: string[];
}

const DEFAULT_SCRIPT = `/**
 * Custom Business Logic
 * @param {Product} product - The current product object
 * @returns {boolean|object} - Return true if valid, or { isValid: false, error: "msg" }
 */
(product) => {
  // Example: Tax must be zero for specific brand
  if (product.brand === 'TechNova' && product.tax > 0) {
    return { isValid: false, error: 'TechNova items must have 0% duty.' };
  }
  return true;
}`;

const BusinessRuleManager: React.FC<BusinessRuleManagerProps> = ({ 
  currentUser,
  businessRules, 
  setBusinessRules,
  primaryCategories,
  masterAttributes
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRule, setNewRule] = useState<Partial<BusinessRule>>({
    name: '',
    type: RuleType.MANDATORY_ATTRIBUTE,
    isActive: true,
    isCritical: false,
    config: {
      script: DEFAULT_SCRIPT
    }
  });

  const isTechAdmin = currentUser.role === 'System Tech Admin';

  const handleToggleActive = (id: string) => {
    setBusinessRules(prev => prev.map(rule => 
      rule.id === id ? { ...rule, isActive: !rule.isActive } : rule
    ));
  };

  const handleToggleCritical = (id: string) => {
    setBusinessRules(prev => prev.map(rule => 
      rule.id === id ? { ...rule, isCritical: !rule.isCritical } : rule
    ));
  };

  const handleDeleteRule = (id: string) => {
    if (confirm('Delete this rule permanently? This will stop enforcing the validation across the system.')) {
      setBusinessRules(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.name) return;

    const rule: BusinessRule = {
      ...(newRule as BusinessRule),
      id: Math.random().toString(36).substr(2, 9)
    };

    setBusinessRules(prev => [...prev, rule]);
    setIsAddModalOpen(false);
    setNewRule({
      name: '',
      type: RuleType.MANDATORY_ATTRIBUTE,
      isActive: true,
      isCritical: false,
      config: {
        script: DEFAULT_SCRIPT
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Governance & Rules</h2>
          <p className="text-slate-500">Establish automated constraints to maintain high-quality product data.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>New Business Rule</span>
        </button>
      </header>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Settings2 size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Rules</p>
            <p className="text-2xl font-bold text-slate-900">{businessRules.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Active</p>
            <p className="text-2xl font-bold text-slate-900">{businessRules.filter(r => r.isActive).length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Critical Blockers</p>
            <p className="text-2xl font-bold text-slate-900">{businessRules.filter(r => r.isCritical).length}</p>
          </div>
        </div>
      </div>

      {/* Rules List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {businessRules.length > 0 ? (
            businessRules.map((rule) => (
              <div key={rule.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={`mt-1 p-2 rounded-lg ${rule.isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                    {rule.type === RuleType.MANDATORY_ATTRIBUTE && <Tag size={20} />}
                    {rule.type === RuleType.SKU_FORMAT && <FileCode size={20} />}
                    {rule.type === RuleType.TAX_LIMIT && <ShieldCheck size={20} />}
                    {rule.type === RuleType.JS_VALIDATION && <Code size={20} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900">{rule.name}</h4>
                      {rule.isCritical && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 uppercase tracking-tighter">
                          <Lock size={10} /> Critical Blocker
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2 items-center text-sm text-slate-500 max-w-2xl">
                      <RuleDescription rule={rule} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button 
                    onClick={() => handleToggleActive(rule.id)}
                    className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      rule.isActive 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                        : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {rule.isActive ? 'Active' : 'Paused'}
                  </button>
                  <button 
                    onClick={() => handleToggleCritical(rule.id)}
                    title={rule.isCritical ? "Make Warning Only" : "Make Critical Blocker"}
                    className={`p-2 rounded-lg transition-colors border ${
                      rule.isCritical 
                        ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100' 
                        : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'
                    }`}
                  >
                    {rule.isCritical ? <Lock size={16} /> : <Unlock size={16} />}
                  </button>
                  <button 
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-20 text-center space-y-4">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mx-auto">
                <ShieldCheck size={40} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">No Business Rules Defined</h3>
                <p className="text-slate-500 max-w-sm mx-auto text-sm leading-relaxed">
                  Start by adding rules to enforce mandatory fields, format validations, or data thresholds across your catalog.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Rule Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 text-white rounded-lg">
                  <Plus size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Configure Rule</h3>
                  <p className="text-xs text-slate-500 font-medium tracking-tight">Set triggers and enforcement logic</p>
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateRule} className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    Rule Name
                  </label>
                  <input 
                    type="text" 
                    autoFocus
                    placeholder="e.g. Apparel: Required Material"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={newRule.name}
                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Rule Type</label>
                  <select 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    value={newRule.type}
                    onChange={(e) => setNewRule({ ...newRule, type: e.target.value as RuleType, config: { script: DEFAULT_SCRIPT } })}
                  >
                    <option value={RuleType.MANDATORY_ATTRIBUTE}>Mandatory Attribute</option>
                    <option value={RuleType.SKU_FORMAT}>SKU Prefix/Pattern</option>
                    <option value={RuleType.TAX_LIMIT}>Tax Range Limit</option>
                    {isTechAdmin && <option value={RuleType.JS_VALIDATION}>Javascript Governance Engine</option>}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Severity</label>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => setNewRule({ ...newRule, isCritical: false })}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${!newRule.isCritical ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}
                    >
                      Warning Only
                    </button>
                    <button 
                      type="button"
                      onClick={() => setNewRule({ ...newRule, isCritical: true })}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${newRule.isCritical ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}
                    >
                      Block Save
                    </button>
                  </div>
                </div>

                {/* Dynamic Config UI based on Rule Type */}
                <div className="md:col-span-2 pt-4 border-t border-slate-100 mt-2 space-y-6">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <Info size={14} className="text-indigo-500" />
                    Configuration Details
                  </h4>

                  {newRule.type === RuleType.MANDATORY_ATTRIBUTE && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">If Category is</label>
                        <select 
                          className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                          value={newRule.config?.category}
                          onChange={(e) => setNewRule({ ...newRule, config: { ...newRule.config, category: e.target.value } })}
                        >
                          <option value="">Any Category</option>
                          {primaryCategories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Require Key</label>
                        <select 
                          className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                          value={newRule.config?.attributeKey}
                          onChange={(e) => setNewRule({ ...newRule, config: { ...newRule.config, attributeKey: e.target.value } })}
                        >
                          <option value="">Select Attribute</option>
                          {masterAttributes.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                      </div>
                    </div>
                  )}

                  {newRule.type === RuleType.SKU_FORMAT && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Match Pattern (Regex)</label>
                      <input 
                        placeholder="e.g. ^TECH-.*"
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                        value={newRule.config?.regex}
                        onChange={(e) => setNewRule({ ...newRule, config: { ...newRule.config, regex: e.target.value } })}
                      />
                      <p className="text-[10px] text-slate-400">Regular expression pattern to validate SKU format.</p>
                    </div>
                  )}

                  {newRule.type === RuleType.TAX_LIMIT && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Min Tax %</label>
                        <input 
                          type="number"
                          placeholder="0"
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                          value={newRule.config?.minValue}
                          onChange={(e) => setNewRule({ ...newRule, config: { ...newRule.config, minValue: Number(e.target.value) } })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Max Tax %</label>
                        <input 
                          type="number"
                          placeholder="100"
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                          value={newRule.config?.maxValue}
                          onChange={(e) => setNewRule({ ...newRule, config: { ...newRule.config, maxValue: Number(e.target.value) } })}
                        />
                      </div>
                    </div>
                  )}

                  {newRule.type === RuleType.JS_VALIDATION && isTechAdmin && (
                    <div className="space-y-4 animate-in slide-in-from-top-4">
                      <div className="flex items-center justify-between">
                         <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                           <Terminal size={14} /> Governance Console
                         </label>
                         <span className="text-[8px] bg-indigo-50 text-indigo-400 px-2 py-0.5 rounded-full font-black uppercase">ES6 Sandbox</span>
                      </div>
                      <div className="bg-slate-900 rounded-2xl overflow-hidden p-4 shadow-inner border border-slate-800">
                        <textarea 
                          rows={12}
                          className="w-full bg-transparent text-emerald-400 font-mono text-xs leading-relaxed focus:outline-none resize-none scrollbar-hide"
                          value={newRule.config?.script}
                          onChange={(e) => setNewRule({ ...newRule, config: { ...newRule.config, script: e.target.value } })}
                        />
                      </div>
                      <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <Cpu size={16} className="text-slate-400 mt-0.5" />
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                          Scripts are executed during the <span className="text-slate-900 font-bold italic">Persistence Layer</span> save event. Use the <code className="text-indigo-600">product</code> object to access all PIM metadata including attributes and status.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-8 flex gap-4 bg-white sticky bottom-0 z-10 pb-4">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 px-4 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95">
                  Commit Governance Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const RuleDescription: React.FC<{ rule: BusinessRule }> = ({ rule }) => {
  switch (rule.type) {
    case RuleType.MANDATORY_ATTRIBUTE:
      return (
        <>
          If product is in 
          <span className="font-bold text-slate-700 mx-1">{rule.config.category || 'any category'}</span>,
          it MUST have 
          <span className="font-bold text-slate-700 mx-1">"{rule.config.attributeKey}"</span>
          as a technical attribute.
        </>
      );
    case RuleType.SKU_FORMAT:
      return (
        <>
          All SKUs must match the pattern 
          <code className="mx-1 px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-xs font-mono">{rule.config.regex}</code>
        </>
      );
    case RuleType.TAX_LIMIT:
      return (
        <>
          Tax values must be between 
          <span className="font-bold text-slate-700 mx-1">{rule.config.minValue}%</span> 
          and 
          <span className="font-bold text-slate-700 mx-1">{rule.config.maxValue}%</span>.
        </>
      );
    case RuleType.JS_VALIDATION:
      return (
        <div className="space-y-1">
          <p className="flex items-center gap-1.5">
            <Terminal size={12} className="text-indigo-500" />
            Executing custom procedural logic at the Master Data Gate.
          </p>
          <p className="text-[10px] text-slate-400 italic truncate max-w-sm">
            {rule.config.script?.split('\n').find(l => !l.startsWith('/*') && !l.startsWith(' *') && l.trim())?.trim() || 'Custom Script'}
          </p>
        </div>
      );
    default:
      return <span>Custom validation logic applied.</span>;
  }
};

export default BusinessRuleManager;

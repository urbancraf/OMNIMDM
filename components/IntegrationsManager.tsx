
import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Settings, 
  Plus, 
  Zap, 
  History, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Terminal,
  Server,
  Link,
  Trash2,
  MoreVertical,
  Activity,
  Box,
  Globe,
  Edit,
  X,
  Key,
  Database,
  ShoppingBag,
  Webhook
} from 'lucide-react';
import { Integration, IntegrationDirection, IntegrationLog, Product, ProductStatus, SystemConfig } from '../types';
import { api } from '../apiService';

interface IntegrationsManagerProps {
  integrations: Integration[];
  setIntegrations: React.Dispatch<React.SetStateAction<Integration[]>>;
  integrationLogs: IntegrationLog[];
  setIntegrationLogs: React.Dispatch<React.SetStateAction<IntegrationLog[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  onRefresh: () => void;
  systemConfig: SystemConfig;
}

const IntegrationsManager: React.FC<IntegrationsManagerProps> = ({ 
  integrations, 
  setIntegrations, 
  integrationLogs, 
  setIntegrationLogs,
  products,
  setProducts,
  onRefresh,
  systemConfig
}) => {
  const [activeTab, setActiveTab] = useState<'connections' | 'logs'>('connections');
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState(0);

  // Trigger data synchronization on component mount
  useEffect(() => {
    onRefresh();
  }, []);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null);
  const [formData, setFormData] = useState<Partial<Integration>>({
    name: '',
    direction: IntegrationDirection.INBOUND,
    provider: 'SAP',
    config: { endpoint: '', apiKey: '' }
  });

  const handleSync = async (integration: Integration) => {
    setSyncingId(integration.id);
    setSyncProgress(0);
    
    // UI Feedback for syncing status
    setIntegrations(prev => prev.map(i => i.id === integration.id ? { ...i, status: 'SYNCING' } : i));

    for (let i = 1; i <= 10; i++) {
      await new Promise(r => setTimeout(r, 150));
      setSyncProgress(i * 10);
    }

    const itemsProcessed = integration.direction === IntegrationDirection.INBOUND ? 1 : products.length;
    const success = Math.random() > 0.1;

    if (success && integration.direction === IntegrationDirection.INBOUND) {
      const newProduct: Product = {
        id: crypto.randomUUID(),
        sku: `${integration.provider}-${Math.floor(Math.random() * 10000)}`,
        name: `Imported via ${integration.name}`,
        shortDescription: 'Auto-synchronized external item.',
        longDescription: 'This product was automatically ingested during a scheduled synchronization event.',
        primaryCategory: 'Electronics',
        brand: 'Generic',
        attributes: [{ key: 'Source', value: integration.provider }],
        mrp: 0,
        sellingPrice: 0,
        tax: 0,
        status: ProductStatus.DRAFT,
        images: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      try {
        await api.createProduct(systemConfig, newProduct);
      } catch (err) {
        console.error("Failed to persist imported product", err);
      }
    }

    const newLog: IntegrationLog = {
      id: crypto.randomUUID(),
      integrationId: integration.id,
      timestamp: new Date().toISOString(),
      status: success ? 'SUCCESS' : 'FAILED',
      message: success 
        ? `${integration.direction} sync finished.` 
        : `Connection failed to ${integration.config.endpoint}.`,
      itemsProcessed
    };

    setIntegrationLogs(prev => [newLog, ...prev]);
    
    try {
        await api.updateIntegration(systemConfig, integration.id, {
            ...integration,
            status: success ? 'IDLE' : 'ERROR',
            lastSync: new Date().toISOString()
        });
        onRefresh();
    } catch (err) {
        console.error("Failed to update integration sync status", err);
    }
    
    setSyncingId(null);
  };

  const handleOpenModal = (integration?: Integration, forceDirection?: IntegrationDirection) => {
    if (integration) {
      setEditingIntegration(integration);
      setFormData(integration);
    } else {
      setEditingIntegration(null);
      setFormData({
        name: '',
        direction: forceDirection || IntegrationDirection.INBOUND,
        provider: 'SAP',
        config: { endpoint: '', apiKey: '' }
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.config?.endpoint) return;

    try {
        if (editingIntegration) {
            await api.updateIntegration(systemConfig, editingIntegration.id, { ...formData, id: editingIntegration.id, status: 'IDLE' });
        } else {
            await api.createIntegration(systemConfig, {
                ...formData,
                id: crypto.randomUUID(),
                status: 'IDLE'
            });
        }
        onRefresh();
        setIsModalOpen(false);
    } catch (err) {
        alert("Persistence Failure: Failed to save integration node.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Permanently disconnect this integration? Data flow will stop immediately.')) {
      try {
          await api.deleteIntegration(systemConfig, id);
          onRefresh();
      } catch (err) {
          alert("Delete restricted: Identity in use or connection lost.");
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Integrations Hub</h2>
          <p className="text-slate-500">Orchestrate automated data flows between PIM and external systems.</p>
        </div>
        <div className="flex gap-2 p-1 bg-slate-200 rounded-xl">
          <button 
            onClick={() => setActiveTab('connections')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'connections' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Connections
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'logs' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Activity Logs
          </button>
        </div>
      </header>

      {activeTab === 'connections' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Inbound Section */}
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                <ArrowDownLeft size={20} />
              </div>
              Inbound Sources
            </h3>
            <div className="grid gap-4">
              {(integrations || []).filter(i => i.direction === IntegrationDirection.INBOUND).map(integration => (
                <IntegrationCard 
                  key={integration.id} 
                  integration={integration} 
                  isSyncing={syncingId === integration.id}
                  progress={syncProgress}
                  onSync={() => handleSync(integration)}
                  onEdit={() => handleOpenModal(integration)}
                  onDelete={() => handleDelete(integration.id)}
                />
              ))}
              <button 
                onClick={() => handleOpenModal(undefined, IntegrationDirection.INBOUND)}
                className="p-6 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-emerald-400 hover:text-emerald-500 transition-all hover:bg-emerald-50/30 group"
              >
                <Plus size={24} className="group-hover:scale-110 transition-transform" />
                <span className="text-sm font-bold">Register External Source</span>
              </button>
            </div>
          </section>

          {/* Outbound Section */}
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                <ArrowUpRight size={20} />
              </div>
              Outbound Channels
            </h3>
            <div className="grid gap-4">
              {(integrations || []).filter(i => i.direction === IntegrationDirection.OUTBOUND).map(integration => (
                <IntegrationCard 
                  key={integration.id} 
                  integration={integration} 
                  isSyncing={syncingId === integration.id}
                  progress={syncProgress}
                  onSync={() => handleSync(integration)}
                  onEdit={() => handleOpenModal(integration)}
                  onDelete={() => handleDelete(integration.id)}
                />
              ))}
              <button 
                onClick={() => handleOpenModal(undefined, IntegrationDirection.OUTBOUND)}
                className="p-6 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-all hover:bg-indigo-50/30 group"
              >
                <Plus size={24} className="group-hover:scale-110 transition-transform" />
                <span className="text-sm font-bold">Connect Downstream Channel</span>
              </button>
            </div>
          </section>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Integration</th>
                  <th className="px-6 py-4">Direction</th>
                  <th className="px-6 py-4">Items</th>
                  <th className="px-6 py-4">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {integrationLogs.length > 0 ? (
                  integrationLogs.map(log => {
                    const integration = integrations.find(i => i.id === log.integrationId);
                    return (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            {log.status === 'SUCCESS' ? (
                              <CheckCircle2 className="text-emerald-500" size={20} />
                            ) : (
                              <XCircle className="text-rose-500" size={20} />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900 text-sm">{integration?.name || 'Deleted Integration'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                            integration?.direction === IntegrationDirection.INBOUND ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
                          }`}>
                            {integration?.direction || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-700">
                          {log.itemsProcessed} SKUs
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {log.message}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="p-20 text-center">
                      <History size={48} className="mx-auto text-slate-200 mb-4" />
                      <p className="text-slate-400 font-medium">No activity history found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl text-white ${formData.direction === IntegrationDirection.INBOUND ? 'bg-emerald-600' : 'bg-indigo-600'}`}>
                  {editingIntegration ? <Settings size={20} /> : <Plus size={20} />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingIntegration ? 'Edit Connection' : 'New Connection'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Configure data synchronization parameters</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveIntegration} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Connection Name</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Master ERP Connector"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Flow Direction</label>
                  <select 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    value={formData.direction}
                    onChange={(e) => setFormData({ ...formData, direction: e.target.value as IntegrationDirection })}
                  >
                    <option value={IntegrationDirection.INBOUND}>Inbound (Pull Data)</option>
                    <option value={IntegrationDirection.OUTBOUND}>Outbound (Push Data)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Service Provider</label>
                  <select 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  >
                    <option value="SAP">SAP ERP</option>
                    <option value="Shopify">Shopify Store</option>
                    <option value="Amazon">Amazon Marketplace</option>
                    <option value="Magento">Magento 2</option>
                    <option value="RestDirect">RestDirect API</option>
                    <option value="Webhook">Custom Webhook</option>
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">API Endpoint URL</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="url"
                      required
                      placeholder="https://api.external-service.com/v1"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={formData.config?.endpoint || ''}
                      onChange={(e) => setFormData({ ...formData, config: { ...(formData.config || { endpoint: '', apiKey: '' }), endpoint: e.target.value } })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Authorization Key (Optional)</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="password"
                      placeholder="••••••••••••••••"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={formData.config?.apiKey || ''}
                      onChange={(e) => setFormData({ ...formData, config: { ...(formData.config || { endpoint: '', apiKey: '' }), apiKey: e.target.value } })}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={`flex-1 px-4 py-3 text-white rounded-2xl font-bold shadow-lg transition-all active:scale-95 ${
                    formData.direction === IntegrationDirection.INBOUND ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                  }`}
                >
                  {editingIntegration ? 'Update Connection' : 'Register Connection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const IntegrationCard: React.FC<{ 
  integration: Integration, 
  onSync: () => void, 
  onEdit: () => void,
  onDelete: () => void,
  isSyncing: boolean,
  progress: number
}> = ({ integration, onSync, onEdit, onDelete, isSyncing, progress }) => {
  const getProviderIcon = () => {
    switch (integration.provider) {
      case 'SAP': return <Server size={24} />;
      case 'Shopify': return <ShoppingBag size={24} />;
      case 'Amazon': return <Box size={24} />;
      case 'Webhook': return <Webhook size={24} />;
      case 'RestDirect': return <Zap size={24} />;
      default: return <Globe size={24} />;
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group overflow-hidden transition-all hover:shadow-md">
      {isSyncing && (
        <div className="absolute top-0 left-0 h-1 bg-indigo-500 transition-all duration-300 z-20" style={{ width: `${progress}%` }} />
      )}
      
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl transition-colors ${
            integration.direction === IntegrationDirection.INBOUND 
              ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white' 
              : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'
          }`}>
            {getProviderIcon()}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-slate-900 truncate">{integration.name}</h4>
            <p className="text-xs text-slate-400 font-mono truncate max-w-[150px]">{integration.config?.endpoint || 'No endpoint'}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button 
            onClick={onSync}
            disabled={isSyncing}
            title="Manual Sync"
            className={`p-2 rounded-lg transition-all ${isSyncing ? 'bg-slate-100 text-slate-300' : 'bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-100'}`}
          >
            <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={onEdit}
            title="Edit Configuration"
            className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-100 hover:text-slate-900 border border-slate-100 transition-all"
          >
            <Edit size={18} />
          </button>
          <button 
            onClick={onDelete}
            title="Disconnect"
            className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-rose-50 hover:text-rose-600 border border-slate-100 transition-all"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] pt-4 border-t border-slate-50">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            integration.status === 'SYNCING' ? 'bg-amber-400 animate-pulse' : 
            integration.status === 'ERROR' ? 'bg-rose-500' : 'bg-emerald-400'
          }`} />
          <span className="font-bold text-slate-500 uppercase tracking-tighter">
            {integration.status}
          </span>
        </div>
        <div className="text-slate-400 flex items-center gap-1 font-medium">
          <Activity size={10} />
          Last Sync: {integration.lastSync ? new Date(integration.lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
        </div>
      </div>
    </div>
  );
};

export default IntegrationsManager;

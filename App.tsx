import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Tags, 
  Settings, 
  LogOut, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  ChevronRight,
  MoreVertical,
  Edit, 
  Trash, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Image as ImageIcon, 
  Layers, 
  GitMerge, 
  ShieldCheck, 
  RefreshCw, 
  Users, 
  UserPlus, 
  Command, 
  User as UserIcon, 
  Server, 
  WifiOff, 
  ShieldAlert, 
  Zap, 
  Lock,
  Shield,
  Key,
  Route as RouteIcon,
  ShieldEllipsis,
  Fingerprint,
  Globe
} from 'lucide-react';
import { HashRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Product, ProductStatus, User, Category, MasterAttribute, AttributeGroup, UserRole, Capability, Permission, SystemConfig, WorkflowBlueprint, Integration, IntegrationLog } from './types.ts';
import Dashboard from './components/Dashboard.tsx';
import ProductList from './components/ProductList.tsx';
import ProductEditor from './components/ProductEditor.tsx';
import CategoryManager from './CategoryManager.tsx';
import AttributeManager from './components/AttributeManager.tsx';
import WorkflowManager from './components/WorkflowManager.tsx';
import RoleManager from './components/RoleManager.tsx';
import UserManager from './components/UserManager.tsx';
import SystemSettings from './components/SystemSettings.tsx';
import Login from './components/Login.tsx';
import IntegrationsManager from './components/IntegrationsManager.tsx';
import { api } from './apiService.ts';

const App: React.FC = () => {
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(() => {
    const defaultConfig = { 
      dbHost: 'https://server.poridheo.shop', 
      dbUser: 'sbhatta4',
      dbPass: 'Arhan@098!'
    };
    try {
      const saved = localStorage.getItem('omnipim_system_config');
      return saved ? JSON.parse(saved) : defaultConfig;
    } catch { return defaultConfig; }
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [primaryCategories, setPrimaryCategories] = useState<Category[]>([]);
  const [secondaryCategories, setSecondaryCategories] = useState<Category[]>([]);
  const [masterAttributes, setMasterAttributes] = useState<MasterAttribute[]>([]);
  const [attributeGroups, setAttributeGroups] = useState<AttributeGroup[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [globalPermissions, setGlobalPermissions] = useState<Permission[]>([]);
  const [workflowBlueprints, setWorkflowBlueprints] = useState<WorkflowBlueprint[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [integrationLogs, setIntegrationLogs] = useState<IntegrationLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('omnipim_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const activeConfig = useMemo(() => ({ ...systemConfig }), [systemConfig]);
  const isTechAdmin = currentUser?.role === 'System_Tech_Admin';

  const refreshAllData = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      /**
       * CHANGE: pcRes now fetches all categories from the unified mdm_categories table.
       * scRes is still kept in the promise list to maintain array indexing, but 
       * primary vs secondary filtering happens during processing.
       */
      const [pRes, pcRes, scRes, aRes, gRes, rRes, capRes, uRes, permRes, wRes, iRes] = await Promise.allSettled([
        api.getProducts(activeConfig),
        api.getCategories(activeConfig),
        api.getSecondaryCategories(activeConfig), // This also hits mdm_categories now
        api.getAttributes(activeConfig),
        api.getAttributeGroups(activeConfig),
        api.getRoles(activeConfig),
        api.getCapabilities(activeConfig),
        api.getUsers(activeConfig),
        api.getPermissions(activeConfig),
        api.getWorkflows(activeConfig),
        api.getIntegrations(activeConfig)
      ]);

      const process = (res: PromiseSettledResult<any>, setter: (v: any) => void) => {
        if (res.status === 'fulfilled') {
          const data = res.value;
          setter(Array.isArray(data) ? data : (data?.data || []));
          return data;
        }
        return [];
      };

      process(pRes, setProducts);

      /**
       * CHANGE: Filter the unified category list by 'type' property.
       * Default to 'Primary' if type is missing for backward compatibility.
       */
      if (pcRes.status === 'fulfilled') {
        const allCats = Array.isArray(pcRes.value) ? pcRes.value : (pcRes.value?.data || []);
/*		Changes for issue in secondary hierarchy - change starts
        setPrimaryCategories(allCats.filter((c: any) => (c.type || 'Primary') === 'Primary'));
        setSecondaryCategories(allCats.filter((c: any) => (c.type === 'Secondary')));
*/
		setPrimaryCategories(allCats.filter((c: any) => {
          const type = (c.type || 'Primary').toLowerCase();
          return type === 'primary';
        }));

        setSecondaryCategories(allCats.filter((c: any) => {
          const type = (c.type || '').toLowerCase();
          return type === 'secondary';
        }));
      }
// change ends
      process(aRes, setMasterAttributes);
      process(gRes, setAttributeGroups);
      process(rRes, setUserRoles);
      process(capRes, setCapabilities);
      process(uRes, setUsers);
      process(wRes, setWorkflowBlueprints);
      process(iRes, setIntegrations);
      process(permRes, setGlobalPermissions);
    } catch (err: any) {
      console.error("Data sync error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [activeConfig, currentUser]);

  useEffect(() => { if (currentUser) refreshAllData(); }, [currentUser, refreshAllData]);

  const commonWorkflowProps = {
    currentUser: currentUser!,
    products: products.filter(p => p.isInWorkflow),
    allProducts: products,
    setProducts: setProducts,
    roles: userRoles,
    blueprints: workflowBlueprints,
    setBlueprints: setWorkflowBlueprints,
    onRefresh: refreshAllData,
    systemConfig: activeConfig,
    onCompleteStep: (pid: string, attrs: any[]) => {
      const product = products.find(p => p.id === pid);
      if (product && product.workflowSteps && product.currentStepIndex !== undefined) {
        const nextIndex = product.currentStepIndex + 1;
        const isDone = nextIndex >= product.workflowSteps.length;
        api.updateProduct(activeConfig, pid, {
          ...product,
          attributes: attrs,
          currentStepIndex: nextIndex,
          isInWorkflow: !isDone
        }).then(refreshAllData);
      }
    }
  };

  return (
    <HashRouter>
      {!currentUser ? (
        <Login onLogin={(user) => setCurrentUser(user)} />
      ) : (
        <div className="flex min-h-screen bg-[#F2F2F7]">
          <aside className="w-72 bg-white border-r border-slate-200 flex flex-col fixed h-full z-10">
            <div className="p-8 pb-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Command size={22} className="text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">OmniPIM</h1>
            </div>
            <nav className="flex-1 px-4 space-y-1 mt-6 overflow-y-auto custom-scrollbar">
              <SidebarLink to="/" icon={<LayoutDashboard size={19} />} label="Dashboard" />
              <SidebarLink to="/products" icon={<Package size={19} />} label="Catalog" />
              
              <div className="mt-8 px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Governance</div>
              <SidebarLink to="/categories" icon={<Layers size={19} />} label="Taxonomy" />
              <SidebarLink to="/attributes" icon={<Tags size={19} />} label="Attributes" />
              
              {isTechAdmin && (
                <>
                  <SidebarLink to="/roles" icon={<Shield size={19} />} label="Role Management" />
                  <SidebarLink to="/capabilities" icon={<Fingerprint size={19} />} label="Capability Management" />
                  <SidebarLink to="/permissions" icon={<Key size={19} />} label="Permission Registry" />
                  <SidebarLink to="/users" icon={<Users size={19} />} label="Users" />
                </>
              )}
              
              <div className="mt-8 px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Orchestration</div>
              <SidebarLink to="/workflow" icon={<GitMerge size={19} />} label="Workflows" />
              <SidebarLink to="/integrations" icon={<Globe size={19} />} label="Integrations" />
              {isTechAdmin && (
                <SidebarLink to="/settings" icon={<Settings size={19} />} label="Infrastructure" />
              )}
            </nav>
            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
              <div className="px-4 py-3 flex items-center gap-3 bg-white rounded-2xl shadow-sm">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-sm">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{currentUser.name}</p>
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest truncate">{currentUser.role}</p>
                </div>
              </div>
              <button onClick={() => { localStorage.removeItem('omnipim_user'); setCurrentUser(null); }} className="flex items-center gap-2 w-full mt-4 px-4 py-2.5 text-slate-500 hover:text-slate-900 rounded-xl transition-all font-medium text-sm">
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </aside>
          <main className="flex-1 ml-72 p-10 max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard products={products} />} />
              <Route path="/products" element={<ProductList products={products} blueprints={workflowBlueprints} setProducts={setProducts} onAssignWorkflow={(pid, type) => {
                const product = products.find(p => p.id === pid);
                const blueprint = workflowBlueprints.find(b => b.name === type);
                if (product && blueprint) {
                  api.updateProduct(activeConfig, pid, { 
                    ...product, 
                    isInWorkflow: true, 
                    workflowType: type, 
                    currentStepIndex: 0, 
                    workflowSteps: blueprint.steps 
                  }).then(refreshAllData);
                }
              }} onRefresh={refreshAllData} onDeleteProduct={id => api.deleteProduct(activeConfig, id).then(refreshAllData)} />} />
              <Route path="/products/new" element={<ProductEditor products={products} setProducts={setProducts} primaryCategories={primaryCategories} secondaryCategories={secondaryCategories} onSave={p => api.createProduct(activeConfig, p).then(refreshAllData)} />} />
              <Route path="/products/edit/:id" element={<ProductEditor products={products} setProducts={setProducts} primaryCategories={primaryCategories} secondaryCategories={secondaryCategories} onSave={p => api.updateProduct(activeConfig, p.id, p).then(refreshAllData)} />} />
              <Route path="/categories" element={<CategoryManager systemConfig={activeConfig} products={products} primaryCategories={primaryCategories} secondaryCategories={secondaryCategories} setPrimaryCategories={setPrimaryCategories} setSecondaryCategories={setSecondaryCategories} onCategoryRename={()=>{}} onRefresh={refreshAllData} />} />
              <Route path="/attributes" element={<AttributeManager products={products} masterAttributes={masterAttributes} attributeGroups={attributeGroups} onAttributeUpdate={()=>{}} primaryCategories={primaryCategories} secondaryCategories={secondaryCategories} onRefresh={refreshAllData} systemConfig={activeConfig} />} />
              
              <Route path="/roles" element={<RoleManager activeTab="roles" roles={userRoles} capabilities={capabilities} globalPermissions={globalPermissions} onRefresh={refreshAllData} systemConfig={activeConfig} />} />
              <Route path="/capabilities" element={<RoleManager activeTab="capabilities" roles={userRoles} capabilities={capabilities} globalPermissions={globalPermissions} onRefresh={refreshAllData} systemConfig={activeConfig} />} />
              <Route path="/permissions" element={<RoleManager activeTab="permissions" roles={userRoles} capabilities={capabilities} globalPermissions={globalPermissions} onRefresh={refreshAllData} systemConfig={activeConfig} />} />
              
              <Route path="/users" element={<UserManager currentUser={currentUser} users={users} setUsers={setUsers} roles={userRoles} globalPermissions={globalPermissions} onRefresh={refreshAllData} />} />
              <Route path="/workflow" element={<WorkflowManager {...commonWorkflowProps} />} />
              <Route path="/workflow-mgmt" element={<WorkflowManager {...commonWorkflowProps} />} />
              <Route path="/integrations" element={<IntegrationsManager integrations={integrations} setIntegrations={setIntegrations} integrationLogs={integrationLogs} setIntegrationLogs={setIntegrationLogs} products={products} setProducts={setProducts} onRefresh={refreshAllData} systemConfig={activeConfig} />} />
              <Route path="/settings" element={<SystemSettings currentUser={currentUser} config={activeConfig} setConfig={setSystemConfig} />} />
            </Routes>
          </main>
        </div>
      )}
    </HashRouter>
  );
};

const SidebarLink: React.FC<{ to: string, icon: React.ReactNode, label: string }> = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
  return (
    <Link to={to} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>
      <span className={isActive ? 'text-white' : 'text-slate-400'}>{icon}</span>
      <span className="text-sm font-semibold tracking-tight">{label}</span>
    </Link>
  );
};

export default App;
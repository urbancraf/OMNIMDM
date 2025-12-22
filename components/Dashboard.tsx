
import React from 'react';
import { Product, ProductStatus } from '../types';
import { Package, CheckCircle, Clock, AlertTriangle, TrendingUp, BarChart3, ArrowRight } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface DashboardProps {
  products: Product[];
}

const Dashboard: React.FC<DashboardProps> = ({ products }) => {
  // Defensive check for non-array products to prevent crashing
  const safeProducts = Array.isArray(products) ? products : [];

  const stats = {
    total: safeProducts.length,
    active: safeProducts.filter(p => p.status === ProductStatus.ACTIVE).length,
    draft: safeProducts.filter(p => p.status === ProductStatus.DRAFT).length,
    inactive: safeProducts.filter(p => p.status === ProductStatus.INACTIVE).length,
  };

  const categoryData = safeProducts.reduce((acc: any[], p) => {
    const existingPrimary = acc.find(item => item.name === p.primaryCategory);
    if (existingPrimary) {
      existingPrimary.value += 1;
    } else if (p.primaryCategory) {
      acc.push({ name: p.primaryCategory, value: 1 });
    }
    return acc;
  }, []).sort((a, b) => b.value - a.value).slice(0, 5);

  const STATUS_COLORS = ['#4F46E5', '#10B981', '#F59E0B'];
  
  // Calculate active percentage safely to avoid NaN (division by zero)
  const activePercent = stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-[0.2em] mb-1">Overview</p>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Your Catalog at a Glance</h2>
        </div>
        <button className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors bg-white px-4 py-2 rounded-xl shadow-sm">
          View Detailed Reports <ArrowRight size={16} />
        </button>
      </header>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Widget 
          icon={<Package className="text-indigo-600" size={20} />} 
          label="Managed SKUs" 
          value={stats.total} 
          trend="+4.2%" 
          color="indigo"
        />
        <Widget 
          icon={<CheckCircle className="text-emerald-600" size={20} />} 
          label="Live Status" 
          value={stats.active} 
          trend="+1.8%" 
          color="emerald"
        />
        <Widget 
          icon={<Clock className="text-amber-600" size={20} />} 
          label="Pending Content" 
          value={stats.draft} 
          color="amber"
        />
        <Widget 
          icon={<AlertTriangle className="text-rose-600" size={20} />} 
          label="Archived" 
          value={stats.inactive} 
          color="rose"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Chart Widget */}
        <div className="lg:col-span-8 bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Top Categories</h3>
              <p className="text-sm text-slate-400 font-medium">Distribution of products across primary categories.</p>
            </div>
          </div>
          <div className="h-[340px] w-full">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 600 }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#F8FAFC' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  />
                  <Bar dataKey="value" fill="#4F46E5" radius={[10, 10, 10, 10]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-300 font-medium italic">
                No categorical data available.
              </div>
            )}
          </div>
        </div>

        {/* Status Distribution Widget */}
        <div className="lg:col-span-4 bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center">
          <div className="w-full mb-8">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Health Status</h3>
            <p className="text-sm text-slate-400 font-medium">Lifecycle breakdown.</p>
          </div>
          <div className="h-[240px] w-full flex items-center justify-center relative">
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs font-black text-slate-300 uppercase tracking-widest">Active</span>
                <span className="text-4xl font-black text-slate-900 tracking-tighter">
                  {activePercent}%
                </span>
             </div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Active', value: stats.active },
                    { name: 'Draft', value: stats.draft },
                    { name: 'Inactive', value: stats.inactive }
                  ]}
                  innerRadius={75}
                  outerRadius={95}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {STATUS_COLORS.map((color, index) => <Cell key={index} fill={color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 w-full space-y-4">
            <HealthIndicator label="Live & Active" color="bg-indigo-600" value={stats.active} />
            <HealthIndicator label="In Draft" color="bg-emerald-500" value={stats.draft} />
            <HealthIndicator label="Archived" color="bg-amber-500" value={stats.inactive} />
          </div>
        </div>
      </div>
    </div>
  );
};

const Widget: React.FC<{ icon: React.ReactNode, label: string, value: number, trend?: string, color: string }> = ({ icon, label, value, trend, color }) => (
  <div className="bg-white p-8 rounded-[2rem] shadow-lg shadow-slate-200/40 border border-slate-100 hover:-translate-y-1 transition-all duration-300">
    <div className="flex items-center justify-between mb-6">
      <div className={`p-3 rounded-2xl bg-${color}-50`}>{icon}</div>
      {trend && (
        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-tighter">{trend}</span>
      )}
    </div>
    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-4xl font-black text-slate-900 tracking-tighter">{value.toLocaleString()}</p>
  </div>
);

const HealthIndicator: React.FC<{ label: string, color: string, value: number }> = ({ label, color, value }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <span className="text-sm font-bold text-slate-600">{label}</span>
    </div>
    <span className="text-sm font-black text-slate-900">{value}</span>
  </div>
);

export default Dashboard;

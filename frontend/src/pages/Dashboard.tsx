import { Users, DollarSign, Server, UserCheck, UserX, Clock, AlertCircle, MapPin, Zap, CheckCircle, XCircle, Plus, FileText, TrendingUp, BarChart3, PieChart as PieChartIcon, Loader2, RefreshCw, Link as LinkIcon } from 'lucide-react';
import { LineChart as RechartsLineChart, Line, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart as RechartsBarChart, Bar, AreaChart as RechartsAreaChart, Area } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { dashboardApi, googleApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import CustomerDashboard from './CustomerDashboard';

const iconMap: any = {
  Users, DollarSign, Server, UserCheck, UserX, Clock, AlertCircle, MapPin, Zap, CheckCircle, XCircle, Plus, FileText, TrendingUp, BarChart3
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState<any>({});
  const [summaryLoaded, setSummaryLoaded] = useState(false);
  const [chartsLoaded, setChartsLoaded] = useState(false);
  const [detailsLoaded, setDetailsLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [googleSyncStatus, setGoogleSyncStatus] = useState<any>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadDashboardData();
    loadGoogleSyncStatus();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      refreshDashboardData();
      loadGoogleSyncStatus();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadGoogleSyncStatus = async () => {
    if (user?.role !== 'admin') return;
    
    try {
      const result = await googleApi.getStatus();
      if (result.success) {
        setGoogleSyncStatus(result.data);
      }
    } catch (err) {
      // Don't show error for Google sync status - it's optional
      console.error('Failed to load Google sync status:', err);
    }
  };

  const refreshDashboardData = async () => {
    if (user?.role === 'customer') return;

    setIsRefreshing(true);
    try {
      await loadDashboardStage('all');
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadDashboardStage = async (stage: 'summary' | 'charts' | 'details' | 'all') => {
    const result = await dashboardApi.getStatistics({ stage });
    if (result.success) {
      setDashboardData((prev: any) => ({ ...prev, ...result.data }));
      setSummaryLoaded(true);
      setChartsLoaded(true);
      setDetailsLoaded(true);
    } else {
      throw new Error(result.error || 'Failed to load dashboard data');
    }
  };

  const loadDashboardData = async () => {
    if (user?.role === 'customer') {
      return; // Customer dashboard handles its own data
    }

    setLoading(true);
    setError('');

    try {
      await loadDashboardStage('all');
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
      setLoading(false);
    }
  };

  const toggleSection = (sectionName: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionName)) {
      newExpanded.delete(sectionName);
    } else {
      newExpanded.add(sectionName);
    }
    setExpandedSections(newExpanded);
  };

  if (user?.role === 'customer') {
    return <CustomerDashboard />;
  }

  if (loading && !summaryLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[#4C8DFF] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#F5514B]">{error}</div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8996AD]">No data available</div>
      </div>
    );
  }

  const {
    mainStats,
    customerGrowthData,
    areaWiseCustomers,
    paymentStatusData,
    customerReportsSubsections,
    newConnectionSubsections,
    connectionStatusData,
    revenueData,
    staffPerformanceData,
    areaDetails
  } = dashboardData;

  return (
    <div className="space-y-8">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#EAF0FB]">Dashboard Overview</h2>
        <button
          onClick={refreshDashboardData}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-[#1B2540] text-[#EAF0FB] rounded-lg hover:bg-[#232D45] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Main Statistics Section */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {summaryLoaded ? mainStats.map((stat: any) => {
            const IconComponent = iconMap[stat.icon] || Users;
            const isExpanded = expandedSections.has(stat.name);
            return (
              <div key={stat.name} className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6 hover:border-[#4C8DFF] transition-all cursor-pointer"
                onClick={() => toggleSection(stat.name)}>
                <div className="flex items-center justify-between mb-4">
                  <IconComponent className={`w-10 h-10 ${stat.color}`} />
                  <span className={`text-sm font-semibold ${stat.change.startsWith('+') ? 'text-[#14E8B4]' : 'text-[#F5514B]'}`}>
                    {stat.change}
                  </span>
                </div>
                <div className="text-3xl font-bold text-[#EAF0FB] mb-2">{stat.value}</div>
                <div className="text-sm text-[#8996AD] mb-2">{stat.name}</div>
                <div className="text-xs text-[#5C6B85]">{stat.detail}</div>
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-[#232D45]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Navigate to relevant section based on stat name
                        if (stat.name.includes('Customer')) navigate('/customers/all');
                        else if (stat.name.includes('Revenue')) navigate('/billing');
                        else if (stat.name.includes('Connection')) navigate('/connections');
                        else if (stat.name.includes('Staff')) navigate('/staff/all');
                        else if (stat.name.includes('Area')) navigate('/areas/all');
                      }}
                      className="w-full py-2 bg-[#4C8DFF] text-white rounded-lg hover:bg-[#3B7BD9] transition-colors text-sm"
                    >
                      View Details
                    </button>
                  </div>
                )}
              </div>
            );
          }) : (
            <div className="col-span-1 md:col-span-4 py-16 text-center text-[#8996AD]">Loading summary...</div>
          )}
        </div>
      </div>

      {/* Google Contacts Sync Status Card (Admin Only) */}
      {user?.role === 'admin' && googleSyncStatus && (
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#4285F4] flex items-center justify-center">
                <span className="text-white font-bold text-sm">G</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#EAF0FB]">Google Contacts Sync</h3>
                <p className="text-sm text-[#8996AD]">
                  {googleSyncStatus.connected ? `Connected as ${googleSyncStatus.email}` : 'Not connected'}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/settings/google')}
              className="flex items-center gap-2 px-4 py-2 bg-[#1B2540] border border-[#232D45] text-[#EAF0FB] rounded-lg hover:border-[#4C8DFF] transition-colors"
            >
              <LinkIcon className="w-4 h-4" />
              Manage
            </button>
          </div>
          
          {googleSyncStatus.connected && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#1B2540] border border-[#232D45] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-[#14E8B4]" />
                  <span className="text-xs text-[#8996AD]">Total Synced</span>
                </div>
                <p className="text-xl font-bold text-[#14E8B4]">{googleSyncStatus.sync?.totalSynced || 0}</p>
              </div>
              
              <div className="bg-[#1B2540] border border-[#232D45] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-[#F6B93B]" />
                  <span className="text-xs text-[#8996AD]">Pending Sync</span>
                </div>
                <p className="text-xl font-bold text-[#F6B93B]">{googleSyncStatus.sync?.pendingSync || 0}</p>
              </div>
              
              <div className="bg-[#1B2540] border border-[#232D45] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-4 h-4 text-[#F5514B]" />
                  <span className="text-xs text-[#8996AD]">Failed Sync</span>
                </div>
                <p className="text-xl font-bold text-[#F5514B]">{googleSyncStatus.sync?.failedSync || 0}</p>
              </div>
              
              <div className="bg-[#1B2540] border border-[#232D45] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCw className="w-4 h-4 text-[#4C8DFF]" />
                  <span className="text-xs text-[#8996AD]">Last Sync</span>
                </div>
                <p className="text-sm font-bold text-[#4C8DFF]">
                  {googleSyncStatus.sync?.lastSyncTime 
                    ? new Date(googleSyncStatus.sync.lastSyncTime).toLocaleString() 
                    : 'Never'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* NEW CONNECTION Section with Subsections */}
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#EAF0FB]">NEW CONNECTION</h2>
          <button
            onClick={() => navigate('/connections/add')}
            className="px-4 py-2 bg-[#4C8DFF] text-white rounded-lg hover:bg-[#3B7BD9] transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add New
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {summaryLoaded ? newConnectionSubsections.map((subsection: any, index: number) => {
            const IconComponent = iconMap[subsection.icon] || Plus;
            const isExpanded = expandedSections.has(`connection-${subsection.name}`);
            return (
              <div
                key={`${subsection.name}-${index}`}
                className="bg-[#1B2540] border border-[#232D45] rounded-lg p-5 hover:border-[#4C8DFF] transition-all cursor-pointer"
                onClick={() => toggleSection(`connection-${subsection.name}`)}
              >
                <IconComponent className={`w-8 h-8 ${subsection.color} mb-3`} />
                <div className="text-2xl font-bold text-[#EAF0FB] mb-1">{subsection.count}</div>
                <div className="text-sm text-[#8996AD] mb-2">{subsection.name}</div>
                <div className="text-xs text-[#5C6B85]">{subsection.description}</div>
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-[#232D45]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (subsection.name.includes('Pending')) navigate('/connections/pending');
                        else if (subsection.name.includes('Approved')) navigate('/connections/approved');
                        else if (subsection.name.includes('Rejected')) navigate('/connections/rejected');
                        else navigate('/connections');
                      }}
                      className="w-full py-2 bg-[#14E8B4] text-[#04231B] rounded-lg hover:bg-[#20F0C0] transition-colors text-sm"
                    >
                      View Details
                    </button>
                  </div>
                )}
              </div>
            );
          }) : (
            <div className="col-span-1 md:col-span-3 xl:col-span-6 py-12 text-center text-[#8996AD]">Loading connections...</div>
          )}
        </div>
      </div>

      {/* CUSTOMER REPORTS Section with Subsections */}
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#EAF0FB]">CUSTOMER REPORTS</h2>
          <button
            onClick={() => navigate('/customers/reports')}
            className="px-4 py-2 bg-[#14E8B4] text-[#04231B] rounded-lg hover:bg-[#20F0C0] transition-colors flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            View Full Reports
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {summaryLoaded ? customerReportsSubsections.map((subsection: any, index: number) => {
            const IconComponent = iconMap[subsection.icon] || Users;
            const isExpanded = expandedSections.has(`customer-${subsection.name}`);
            return (
              <div
                key={`${subsection.name}-${index}`}
                className="bg-[#1B2540] border border-[#232D45] rounded-lg p-5 hover:border-[#4C8DFF] transition-all cursor-pointer"
                onClick={() => toggleSection(`customer-${subsection.name}`)}
              >
                <IconComponent className={`w-8 h-8 ${subsection.color} mb-3`} />
                <div className="text-2xl font-bold text-[#EAF0FB] mb-1">{subsection.count}</div>
                <div className="text-sm text-[#8996AD] mb-2">{subsection.name}</div>
                <div className="text-xs text-[#5C6B85]">{subsection.description}</div>
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-[#232D45]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (subsection.name.includes('Active')) navigate('/customers/active');
                        else if (subsection.name.includes('Suspended')) navigate('/customers/suspended');
                        else navigate('/customers/all');
                      }}
                      className="w-full py-2 bg-[#14E8B4] text-[#04231B] rounded-lg hover:bg-[#20F0C0] transition-colors text-sm"
                    >
                      View Details
                    </button>
                  </div>
                )}
              </div>
            );
          }) : (
            <div className="col-span-1 md:col-span-2 xl:col-span-6 py-12 text-center text-[#8996AD]">Loading customer reports...</div>
          )}
        </div>
      </div>

      {/* Customer Reports Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6 cursor-pointer hover:border-[#4C8DFF] transition-all"
          onClick={() => navigate('/customers/reports')}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#EAF0FB]">Customer Growth Trend</h3>
            {isRefreshing && <Loader2 className="w-4 h-4 text-[#4C8DFF] animate-spin" />}
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsAreaChart data={chartsLoaded ? customerGrowthData : []}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14E8B4" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#14E8B4" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4C8DFF" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#4C8DFF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#232D45" />
              <XAxis dataKey="month" stroke="#8996AD" />
              <YAxis stroke="#8996AD" />
              <Tooltip
                contentStyle={{ backgroundColor: '#121B2E', border: '1px solid #232D45', borderRadius: '8px' }}
                itemStyle={{ color: '#EAF0FB' }}
              />
              <Legend />
              <Area type="monotone" dataKey="totalCustomers" stroke="#14E8B4" fill="url(#colorTotal)" strokeWidth={2} name="Total Customers" />
              <Area type="monotone" dataKey="newCustomers" stroke="#4C8DFF" fill="url(#colorNew)" strokeWidth={2} name="New Customers" />
            </RechartsAreaChart>
          </ResponsiveContainer>
          {!chartsLoaded && <div className="py-12 text-center text-[#8996AD]">Loading chart data...</div>}
        </div>

        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6 cursor-pointer hover:border-[#4C8DFF] transition-all"
          onClick={() => navigate('/billing')}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#EAF0FB]">Payment Status Distribution</h3>
            {isRefreshing && <Loader2 className="w-4 h-4 text-[#4C8DFF] animate-spin" />}
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={chartsLoaded ? paymentStatusData : []}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                animationBegin={0}
                animationDuration={1000}
              >
                {(chartsLoaded ? paymentStatusData : []).map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#121B2E', border: '1px solid #232D45', borderRadius: '8px' }}
                itemStyle={{ color: '#EAF0FB' }}
              />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
          {!chartsLoaded && <div className="py-12 text-center text-[#8996AD]">Loading charts...</div>}
        </div>
      </div>

      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6 cursor-pointer hover:border-[#4C8DFF] transition-all"
        onClick={() => navigate('/areas/customers')}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#EAF0FB]">Area-wise Customer Distribution</h3>
          {isRefreshing && <Loader2 className="w-4 h-4 text-[#4C8DFF] animate-spin" />}
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <RechartsBarChart data={chartsLoaded ? areaWiseCustomers : []}>
            <defs>
              <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14E8B4" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#14E8B4" stopOpacity={0.2}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#232D45" />
            <XAxis dataKey="name" stroke="#8996AD" />
            <YAxis stroke="#8996AD" />
            <Tooltip
              contentStyle={{ backgroundColor: '#121B2E', border: '1px solid #232D45', borderRadius: '8px' }}
              itemStyle={{ color: '#EAF0FB' }}
            />
            <Legend />
            <Bar dataKey="customers" fill="url(#colorBar)" name="Customers" animationBegin={0} animationDuration={1000} />
          </RechartsBarChart>
        </ResponsiveContainer>
        {!chartsLoaded && <div className="py-12 text-center text-[#8996AD]">Loading area data...</div>}
      </div>

      {/* Revenue Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6 cursor-pointer hover:border-[#4C8DFF] transition-all"
          onClick={() => navigate('/reports/business')}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#EAF0FB]">Revenue Overview</h3>
            {isRefreshing && <Loader2 className="w-4 h-4 text-[#4C8DFF] animate-spin" />}
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsAreaChart data={chartsLoaded ? revenueData : []}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14E8B4" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#14E8B4" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F5514B" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#F5514B" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4C8DFF" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#4C8DFF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#232D45" />
              <XAxis dataKey="month" stroke="#8996AD" />
              <YAxis stroke="#8996AD" />
              <Tooltip
                contentStyle={{ backgroundColor: '#121B2E', border: '1px solid #232D45', borderRadius: '8px' }}
                itemStyle={{ color: '#EAF0FB' }}
              />
              <Legend />
              <Area type="monotone" dataKey="revenue" stroke="#14E8B4" fill="url(#colorRevenue)" strokeWidth={2} name="Revenue" />
              <Area type="monotone" dataKey="expenses" stroke="#F5514B" fill="url(#colorExpenses)" strokeWidth={2} name="Expenses" />
              <Area type="monotone" dataKey="profit" stroke="#4C8DFF" fill="url(#colorProfit)" strokeWidth={2} name="Profit" />
            </RechartsAreaChart>
          </ResponsiveContainer>
          {!chartsLoaded && <div className="py-12 text-center text-[#8996AD]">Loading revenue chart...</div>}
        </div>

        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6 cursor-pointer hover:border-[#4C8DFF] transition-all"
          onClick={() => navigate('/connections')}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#EAF0FB]">Connection Status Distribution</h3>
            {isRefreshing && <Loader2 className="w-4 h-4 text-[#4C8DFF] animate-spin" />}
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={chartsLoaded ? connectionStatusData : []}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                animationBegin={0}
                animationDuration={1000}
              >
                {(chartsLoaded ? connectionStatusData : []).map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#121B2E', border: '1px solid #232D45', borderRadius: '8px' }}
                itemStyle={{ color: '#EAF0FB' }}
              />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
          {!chartsLoaded && <div className="py-12 text-center text-[#8996AD]">Loading connection status...</div>}
        </div>
      </div>

      {/* Staff Performance Section */}
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6 cursor-pointer hover:border-[#4C8DFF] transition-all"
        onClick={() => navigate('/staff/reports')}>
        <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4">Staff Performance</h3>
        {detailsLoaded ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#232D45]">
                  <th className="text-left text-[#8996AD] pb-3 font-medium">Staff Name</th>
                  <th className="text-left text-[#8996AD] pb-3 font-medium">Area</th>
                  <th className="text-left text-[#8996AD] pb-3 font-medium">Connections</th>
                  <th className="text-left text-[#8996AD] pb-3 font-medium">Collections</th>
                  <th className="text-left text-[#8996AD] pb-3 font-medium">Rating</th>
                  <th className="text-left text-[#8996AD] pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {staffPerformanceData.map((staff: any, index: number) => (
                  <tr key={`${staff.name}-${index}`} className="border-b border-[#232D45] hover:bg-[#1B2540]">
                    <td className="py-4 text-[#EAF0FB] font-medium">{staff.name}</td>
                    <td className="py-4 text-[#8996AD]">{staff.area}</td>
                    <td className="py-4 text-[#EAF0FB]">{staff.connections}</td>
                    <td className="py-4 text-[#14E8B4] font-medium">{staff.collections}</td>
                    <td className="py-4 text-[#EAF0FB]">{staff.rating} ⭐</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${staff.status === 'Active' ? 'bg-[#14E8B4]/20 text-[#14E8B4]' : 'bg-[#F6B93B]/20 text-[#F6B93B]'}`}>
                        {staff.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-[#8996AD]">Loading staff performance...</div>
        )}
      </div>

      {/* Area-wise Details Section */}
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4">Area-wise Details</h3>
        {detailsLoaded ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {areaDetails.map((area: any, index: number) => {
              const isExpanded = expandedSections.has(`area-${area.name}`);
              return (
                <div key={area.id || `area-${index}`} className="bg-[#1B2540] border border-[#232D45] rounded-lg p-5 hover:border-[#4C8DFF] transition-all cursor-pointer"
                  onClick={() => toggleSection(`area-${area.name}`)}>
                  <div className="flex items-center gap-3 mb-4">
                    <MapPin className="w-6 h-6 text-[#4C8DFF]" />
                    <h4 className="text-lg font-semibold text-[#EAF0FB]">{area.name}</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#8996AD]">Customers</span>
                      <span className="text-sm font-semibold text-[#EAF0FB]">{area.customers}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#8996AD]">Revenue</span>
                      <span className="text-sm font-semibold text-[#14E8B4]">{area.revenue}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#8996AD]">New Connections</span>
                      <span className="text-sm font-semibold text-[#EAF0FB]">{area.connections}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#8996AD]">Staff Assigned</span>
                      <span className="text-sm font-semibold text-[#EAF0FB]">{area.staff}</span>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-[#232D45]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/areas/customers/${area.id}`);
                        }}
                        className="w-full py-2 bg-[#14E8B4] text-[#04231B] rounded-lg hover:bg-[#20F0C0] transition-colors text-sm"
                      >
                        View Area Details
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-[#8996AD]">Loading area details...</div>
        )}
      </div>
    </div>
  );
}

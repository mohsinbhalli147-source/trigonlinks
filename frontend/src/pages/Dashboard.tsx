import { Users, DollarSign, Server, UserCheck, UserX, Clock, AlertCircle, MapPin, Zap, CheckCircle, XCircle, Plus, FileText, TrendingUp, BarChart3, PieChart as PieChartIcon, Loader2, RefreshCw, Link as LinkIcon, Search, Bell, Settings, Wifi, Router, Database, Activity, Shield, Cpu, HardDrive, Globe, CreditCard, TrendingDown, ArrowUpRight, ArrowDownRight, MoreHorizontal, BellRing, User, Menu, X } from 'lucide-react';
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
  const [googleSyncStatus, setGoogleSyncStatus] = useState<any>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadDashboardData();
    loadGoogleSyncStatus();
    // Auto-refresh every 10 seconds for real-time updates
    const interval = setInterval(() => {
      refreshDashboardData();
      loadGoogleSyncStatus();
    }, 10000);
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
    areaDetails,
    todayStats
  } = dashboardData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D1117] via-[#161B22] to-[#0D1117]">
      {/* System Alert Bar */}
      <div className="bg-gradient-to-r from-[#1F2937] to-[#111827] border-b border-[#374151] px-6 py-3">
        <div className="flex items-center gap-6 overflow-x-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F59E0B]/20 border border-[#F59E0B]/30 rounded-lg">
            <CreditCard className="w-4 h-4 text-[#F59E0B]" />
            <span className="text-sm text-[#F59E0B]">{todayStats?.billsDueToday || 0} Bills Due Today</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#EF4444]/20 border border-[#EF4444]/30 rounded-lg">
            <Wifi className="w-4 h-4 text-[#EF4444]" />
            <span className="text-sm text-[#EF4444]">{todayStats?.routersOffline || 0} Routers Offline</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#EF4444]/20 border border-[#EF4444]/30 rounded-lg">
            <AlertCircle className="w-4 h-4 text-[#EF4444]" />
            <span className="text-sm text-[#EF4444]">{todayStats?.fiberBreaks || 0} Fiber Breaks</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#10B981]/20 border border-[#10B981]/30 rounded-lg">
            <Database className="w-4 h-4 text-[#10B981]" />
            <span className="text-sm text-[#10B981]">Backup: {todayStats?.backupStatus || 'OK'}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#10B981]/20 border border-[#10B981]/30 rounded-lg">
            <Server className="w-4 h-4 text-[#10B981]" />
            <span className="text-sm text-[#10B981]">Server: Healthy</span>
          </div>
          {googleSyncStatus && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#4285F4]/20 border border-[#4285F4]/30 rounded-lg">
              <Globe className="w-4 h-4 text-[#4285F4]" />
              <span className="text-sm text-[#4285F4]">Google: {googleSyncStatus.connected ? 'Synced' : 'Not Connected'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Premium Header */}
      <div className="sticky top-0 z-50 bg-[#161B22]/80 backdrop-blur-xl border-b border-[#374151] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 text-[#9CA3AF] hover:text-[#EAF0FB] hover:bg-[#374151] rounded-lg transition-all"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4]">
              Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
              <input
                type="text"
                placeholder="Search customers, bills, areas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    navigate(`/customers/all?q=${encodeURIComponent(searchQuery.trim())}`);
                  }
                }}
                className="w-64 pl-10 pr-4 py-2 bg-[#1F2937] border border-[#374151] rounded-lg text-[#EAF0FB] placeholder-[#6B7280] focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all"
              />
            </div>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-[#9CA3AF] hover:text-[#EAF0FB] hover:bg-[#374151] rounded-lg transition-all"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#EF4444] rounded-full"></span>
            </button>
            <button
              onClick={refreshDashboardData}
              disabled={isRefreshing}
              className="p-2 text-[#9CA3AF] hover:text-[#EAF0FB] hover:bg-[#374151] rounded-lg transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <div className="flex items-center gap-3 px-3 py-2 bg-[#1F2937] border border-[#374151] rounded-lg">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#06B6D4] flex items-center justify-center font-bold text-white text-sm">
                {user?.email?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-[#EAF0FB]">{user?.email?.split('@')[0] || 'Admin'}</p>
                <p className="text-xs text-[#6B7280]">{user?.role || 'Admin'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">

      {/* Premium KPI Cards */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {summaryLoaded ? mainStats.map((stat: any, index: number) => {
            const IconComponent = iconMap[stat.icon] || Users;
            const isPositive = stat.change.startsWith('+');
            const gradientColors = [
              'from-[#8B5CF6] to-[#6366F1]',
              'from-[#06B6D4] to-[#0891B2]',
              'from-[#10B981] to-[#059669]',
              'from-[#F59E0B] to-[#D97706]',
              'from-[#EF4444] to-[#DC2626]',
              'from-[#EC4899] to-[#DB2777]',
              'from-[#6366F1] to-[#4F46E5]',
              'from-[#14B8A6] to-[#0D9488]',
            ];
            const gradient = gradientColors[index % gradientColors.length];
            return (
              <div 
                key={stat.name} 
                className="group relative bg-gradient-to-br from-[#1F2937]/50 to-[#111827]/50 backdrop-blur-xl border border-[#374151] rounded-2xl p-6 hover:border-[#8B5CF6] hover:shadow-2xl hover:shadow-[#8B5CF6]/20 transition-all duration-300 cursor-pointer overflow-hidden"
                onClick={() => {
                  if (stat.name.includes('Customer')) navigate('/customers/all');
                  else if (stat.name.includes('Revenue')) navigate('/billing');
                  else if (stat.name.includes('Connection')) navigate('/connections');
                  else if (stat.name.includes('Staff')) navigate('/staff/all');
                  else if (stat.name.includes('Area')) navigate('/areas/all');
                }}
              >
                {/* Glass effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                
                {/* Icon with gradient background */}
                <div className={`absolute top-4 right-4 w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg opacity-80 group-hover:opacity-100 transition-opacity`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${isPositive ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#EF4444]/20 text-[#EF4444]'}`}>
                      {isPositive ? <ArrowUpRight className="w-3 h-3 inline" /> : <ArrowDownRight className="w-3 h-3 inline" />}
                      {stat.change}
                    </span>
                  </div>
                  <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#EAF0FB] to-[#9CA3AF] mb-1">{stat.value}</div>
                  <div className="text-sm font-medium text-[#9CA3AF] mb-1">{stat.name}</div>
                  <div className="text-xs text-[#6B7280]">{stat.detail}</div>
                </div>
              </div>
            );
          }) : (
            <div className="col-span-1 md:col-span-4 py-16 text-center text-[#6B7280]">
              <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-[#8B5CF6]" />
              <p>Loading summary...</p>
            </div>
          )}
        </div>
      </div>


      {/* Premium Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-[#1F2937]/50 to-[#111827]/50 backdrop-blur-xl border border-[#374151] rounded-2xl p-6 cursor-pointer hover:border-[#8B5CF6] hover:shadow-2xl hover:shadow-[#8B5CF6]/20 transition-all duration-300"
          onClick={() => navigate('/customers/reports')}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-[#EAF0FB]">Customer Growth Trend</h3>
            </div>
            {isRefreshing && <Loader2 className="w-4 h-4 text-[#8B5CF6] animate-spin" />}
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsAreaChart data={chartsLoaded ? customerGrowthData : []}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '12px' }}
                itemStyle={{ color: '#EAF0FB' }}
              />
              <Legend />
              <Area type="monotone" dataKey="totalCustomers" stroke="#8B5CF6" fill="url(#colorTotal)" strokeWidth={2} name="Total Customers" />
              <Area type="monotone" dataKey="newCustomers" stroke="#06B6D4" fill="url(#colorNew)" strokeWidth={2} name="New Customers" />
            </RechartsAreaChart>
          </ResponsiveContainer>
          {!chartsLoaded && <div className="py-12 text-center text-[#6B7280]">Loading chart data...</div>}
        </div>

        <div className="bg-gradient-to-br from-[#1F2937]/50 to-[#111827]/50 backdrop-blur-xl border border-[#374151] rounded-2xl p-6 cursor-pointer hover:border-[#8B5CF6] hover:shadow-2xl hover:shadow-[#8B5CF6]/20 transition-all duration-300"
          onClick={() => navigate('/billing')}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-[#EAF0FB]">Payment Status Distribution</h3>
            </div>
            {isRefreshing && <Loader2 className="w-4 h-4 text-[#8B5CF6] animate-spin" />}
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
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '12px' }}
                itemStyle={{ color: '#EAF0FB' }}
              />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
          {!chartsLoaded && <div className="py-12 text-center text-[#6B7280]">Loading charts...</div>}
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#1F2937]/50 to-[#111827]/50 backdrop-blur-xl border border-[#374151] rounded-2xl p-6 cursor-pointer hover:border-[#8B5CF6] hover:shadow-2xl hover:shadow-[#8B5CF6]/20 transition-all duration-300"
        onClick={() => navigate('/areas/customers')}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-[#EAF0FB]">Area-wise Customer Distribution</h3>
          </div>
          {isRefreshing && <Loader2 className="w-4 h-4 text-[#8B5CF6] animate-spin" />}
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <RechartsBarChart data={chartsLoaded ? areaWiseCustomers : []}>
            <defs>
              <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.2}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '12px' }}
              itemStyle={{ color: '#EAF0FB' }}
            />
            <Legend />
            <Bar dataKey="customers" fill="url(#colorBar)" name="Customers" animationBegin={0} animationDuration={1000} />
          </RechartsBarChart>
        </ResponsiveContainer>
        {!chartsLoaded && <div className="py-12 text-center text-[#6B7280]">Loading area data...</div>}
      </div>

      {/* Revenue Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-[#1F2937]/50 to-[#111827]/50 backdrop-blur-xl border border-[#374151] rounded-2xl p-6 cursor-pointer hover:border-[#8B5CF6] hover:shadow-2xl hover:shadow-[#8B5CF6]/20 transition-all duration-300"
          onClick={() => navigate('/reports/business')}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-[#EAF0FB]">Revenue Overview</h3>
            </div>
            {isRefreshing && <Loader2 className="w-4 h-4 text-[#8B5CF6] animate-spin" />}
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsAreaChart data={chartsLoaded ? revenueData : []}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '12px' }}
                itemStyle={{ color: '#EAF0FB' }}
              />
              <Legend />
              <Area type="monotone" dataKey="revenue" stroke="#10B981" fill="url(#colorRevenue)" strokeWidth={2} name="Revenue" />
              <Area type="monotone" dataKey="expenses" stroke="#EF4444" fill="url(#colorExpenses)" strokeWidth={2} name="Expenses" />
              <Area type="monotone" dataKey="profit" stroke="#8B5CF6" fill="url(#colorProfit)" strokeWidth={2} name="Profit" />
            </RechartsAreaChart>
          </ResponsiveContainer>
          {!chartsLoaded && <div className="py-12 text-center text-[#6B7280]">Loading revenue chart...</div>}
        </div>

        <div className="bg-gradient-to-br from-[#1F2937]/50 to-[#111827]/50 backdrop-blur-xl border border-[#374151] rounded-2xl p-6 cursor-pointer hover:border-[#8B5CF6] hover:shadow-2xl hover:shadow-[#8B5CF6]/20 transition-all duration-300"
          onClick={() => navigate('/connections')}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#EC4899] to-[#DB2777] flex items-center justify-center">
                <Server className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-[#EAF0FB]">Connection Status Distribution</h3>
            </div>
            {isRefreshing && <Loader2 className="w-4 h-4 text-[#8B5CF6] animate-spin" />}
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
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '12px' }}
                itemStyle={{ color: '#EAF0FB' }}
              />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
          {!chartsLoaded && <div className="py-12 text-center text-[#6B7280]">Loading connection status...</div>}
        </div>
      </div>

      {/* Staff Performance Section */}
      <div className="bg-gradient-to-br from-[#1F2937]/50 to-[#111827]/50 backdrop-blur-xl border border-[#374151] rounded-2xl p-6 cursor-pointer hover:border-[#8B5CF6] hover:shadow-2xl hover:shadow-[#8B5CF6]/20 transition-all duration-300"
        onClick={() => navigate('/staff/reports')}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-[#EAF0FB]">Staff Performance</h3>
          </div>
        </div>
        {detailsLoaded ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#374151]">
                  <th className="text-left text-[#9CA3AF] pb-3 font-medium">Staff Name</th>
                  <th className="text-left text-[#9CA3AF] pb-3 font-medium">Area</th>
                  <th className="text-left text-[#9CA3AF] pb-3 font-medium">Connections</th>
                  <th className="text-left text-[#9CA3AF] pb-3 font-medium">Collections</th>
                  <th className="text-left text-[#9CA3AF] pb-3 font-medium">Rating</th>
                  <th className="text-left text-[#9CA3AF] pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {staffPerformanceData.map((staff: any, index: number) => (
                  <tr key={`${staff.name}-${index}`} className="border-b border-[#374151] hover:bg-[#1F2937]/50 transition-colors">
                    <td className="py-4 text-[#EAF0FB] font-medium">{staff.name}</td>
                    <td className="py-4 text-[#9CA3AF]">{staff.area}</td>
                    <td className="py-4 text-[#EAF0FB]">{staff.connections}</td>
                    <td className="py-4 text-[#10B981] font-medium">{staff.collections}</td>
                    <td className="py-4 text-[#EAF0FB]">{staff.rating} ⭐</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${staff.status === 'Active' ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#F59E0B]/20 text-[#F59E0B]'}`}>
                        {staff.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-[#6B7280]">Loading staff performance...</div>
        )}
      </div>

      {/* Area-wise Details Section */}
      <div className="bg-gradient-to-br from-[#1F2937]/50 to-[#111827]/50 backdrop-blur-xl border border-[#374151] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-[#EAF0FB]">Area-wise Details</h3>
          </div>
        </div>
        {detailsLoaded ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {areaDetails.map((area: any, index: number) => {
              return (
                <div key={area.id || `area-${index}`} className="bg-gradient-to-br from-[#1F2937]/30 to-[#111827]/30 border border-[#374151] rounded-xl p-5 hover:border-[#8B5CF6] hover:shadow-xl hover:shadow-[#8B5CF6]/20 transition-all duration-300 cursor-pointer"
                  onClick={() => navigate(`/areas/customers?area=${area.name}`)}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F59E0B]/20 to-[#D97706]/20 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-[#F59E0B]" />
                      </div>
                      <h4 className="text-lg font-semibold text-[#EAF0FB]">{area.name}</h4>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#9CA3AF]">Customers</span>
                      <span className="text-sm font-semibold text-[#EAF0FB]">{area.customers}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#9CA3AF]">Revenue</span>
                      <span className="text-sm font-semibold text-[#10B981]">{area.revenue}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#9CA3AF]">New Connections</span>
                      <span className="text-sm font-semibold text-[#EAF0FB]">{area.connections}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-[#6B7280]">Loading area details...</div>
        )}
      </div>

      {/* Network Monitoring Section */}
      <div className="bg-gradient-to-br from-[#1F2937]/50 to-[#111827]/50 backdrop-blur-xl border border-[#374151] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#06B6D4] to-[#0891B2] flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-[#EAF0FB]">Network Monitoring</h3>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#10B981]/20 border border-[#10B981]/30 rounded-lg">
            <div className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse" />
            <span className="text-xs text-[#10B981]">Live</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Router className="w-4 h-4 text-[#8B5CF6]" />
                  <span className="text-sm text-[#9CA3AF]">Routers Online</span>
                </div>
                <span className="text-sm font-semibold text-[#EAF0FB]">{todayStats?.routersOnline || 45}/50</span>
              </div>
              <div className="w-full bg-[#374151] rounded-full h-2">
                <div className="bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] h-2 rounded-full" style={{ width: '90%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-[#10B981]" />
                  <span className="text-sm text-[#9CA3AF]">OLT Status</span>
                </div>
                <span className="text-sm font-semibold text-[#EAF0FB]">{todayStats?.oltStatus || 'Healthy'}</span>
              </div>
              <div className="w-full bg-[#374151] rounded-full h-2">
                <div className="bg-gradient-to-r from-[#10B981] to-[#059669] h-2 rounded-full" style={{ width: '95%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-[#06B6D4]" />
                  <span className="text-sm text-[#9CA3AF]">ONU Status</span>
                </div>
                <span className="text-sm font-semibold text-[#EAF0FB]">{todayStats?.onuStatus || 890}/1000</span>
              </div>
              <div className="w-full bg-[#374151] rounded-full h-2">
                <div className="bg-gradient-to-r from-[#06B6D4] to-[#0891B2] h-2 rounded-full" style={{ width: '89%' }}></div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#EC4899]" />
                  <span className="text-sm text-[#9CA3AF]">PPPoE Sessions</span>
                </div>
                <span className="text-sm font-semibold text-[#EAF0FB]">{todayStats?.pppoeSessions || 750}</span>
              </div>
              <div className="w-full bg-[#374151] rounded-full h-2">
                <div className="bg-gradient-to-r from-[#EC4899] to-[#DB2777] h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#F59E0B]" />
                  <span className="text-sm text-[#9CA3AF]">Bandwidth Usage</span>
                </div>
                <span className="text-sm font-semibold text-[#EAF0FB]">{todayStats?.bandwidthUsage || '2.4 Gbps'}</span>
              </div>
              <div className="w-full bg-[#374151] rounded-full h-2">
                <div className="bg-gradient-to-r from-[#F59E0B] to-[#D97706] h-2 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#EF4444]" />
                  <span className="text-sm text-[#9CA3AF]">CPU Usage</span>
                </div>
                <span className="text-sm font-semibold text-[#EAF0FB]">{todayStats?.cpuUsage || '45%'}</span>
              </div>
              <div className="w-full bg-[#374151] rounded-full h-2">
                <div className="bg-gradient-to-r from-[#EF4444] to-[#DC2626] h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-[#8B5CF6]" />
                  <span className="text-sm text-[#9CA3AF]">Memory Usage</span>
                </div>
                <span className="text-sm font-semibold text-[#EAF0FB]">{todayStats?.memoryUsage || '62%'}</span>
              </div>
              <div className="w-full bg-[#374151] rounded-full h-2">
                <div className="bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] h-2 rounded-full" style={{ width: '62%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#10B981]" />
                  <span className="text-sm text-[#9CA3AF]">Storage Usage</span>
                </div>
                <span className="text-sm font-semibold text-[#EAF0FB]">{todayStats?.storageUsage || '78%'}</span>
              </div>
              <div className="w-full bg-[#374151] rounded-full h-2">
                <div className="bg-gradient-to-r from-[#10B981] to-[#059669] h-2 rounded-full" style={{ width: '78%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#06B6D4]" />
                  <span className="text-sm text-[#9CA3AF]">API Status</span>
                </div>
                <span className="text-sm font-semibold text-[#10B981]">Operational</span>
              </div>
              <div className="w-full bg-[#374151] rounded-full h-2">
                <div className="bg-gradient-to-r from-[#10B981] to-[#059669] h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Dashboard Section */}
      <div className="bg-gradient-to-br from-[#1F2937]/50 to-[#111827]/50 backdrop-blur-xl border border-[#374151] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-[#EAF0FB]">Financial Overview</h3>
          </div>
          <button
            onClick={() => navigate('/reports/business')}
            className="px-4 py-2 bg-[#10B981]/20 border border-[#10B981]/30 text-[#10B981] rounded-lg hover:bg-[#10B981]/30 transition-all flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            View Reports
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-[#1F2937]/30 to-[#111827]/30 border border-[#374151] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#10B981]/20 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-[#10B981]" />
              </div>
              <span className="text-sm text-[#9CA3AF]">Total Revenue</span>
            </div>
            <p className="text-2xl font-bold text-[#10B981]">Rs. {(todayStats?.totalRevenue || 0).toLocaleString()}</p>
            <p className="text-xs text-[#6B7280] mt-1">This month</p>
          </div>
          <div className="bg-gradient-to-br from-[#1F2937]/30 to-[#111827]/30 border border-[#374151] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[#8B5CF6]" />
              </div>
              <span className="text-sm text-[#9CA3AF]">Monthly Target</span>
            </div>
            <p className="text-2xl font-bold text-[#8B5CF6]">Rs. {(todayStats?.monthlyTarget || 0).toLocaleString()}</p>
            <p className="text-xs text-[#6B7280] mt-1">{todayStats?.targetPercentage || 85}% achieved</p>
          </div>
          <div className="bg-gradient-to-br from-[#1F2937]/30 to-[#111827]/30 border border-[#374151] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/20 flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-[#F59E0B]" />
              </div>
              <span className="text-sm text-[#9CA3AF]">Pending Amount</span>
            </div>
            <p className="text-2xl font-bold text-[#F59E0B]">Rs. {(todayStats?.pendingAmount || 0).toLocaleString()}</p>
            <p className="text-xs text-[#6B7280] mt-1">Outstanding</p>
          </div>
          <div className="bg-gradient-to-br from-[#1F2937]/30 to-[#111827]/30 border border-[#374151] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#06B6D4]/20 flex items-center justify-center">
                <Activity className="w-4 h-4 text-[#06B6D4]" />
              </div>
              <span className="text-sm text-[#9CA3AF]">Net Profit</span>
            </div>
            <p className="text-2xl font-bold text-[#06B6D4]">Rs. {(todayStats?.profit || 0).toLocaleString()}</p>
            <p className="text-xs text-[#6B7280] mt-1">After expenses</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-gradient-to-br from-[#1F2937]/30 to-[#111827]/30 border border-[#374151] rounded-xl p-5">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-[#9CA3AF]">Collection Rate</span>
              <span className="text-lg font-bold text-[#10B981]">{todayStats?.collectionRate || 92}%</span>
            </div>
            <div className="w-full bg-[#374151] rounded-full h-2">
              <div className="bg-gradient-to-r from-[#10B981] to-[#059669] h-2 rounded-full" style={{ width: '92%' }}></div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#1F2937]/30 to-[#111827]/30 border border-[#374151] rounded-xl p-5">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-[#9CA3AF]">Average Revenue/Customer</span>
              <span className="text-lg font-bold text-[#8B5CF6]">Rs. {todayStats?.avgRevenuePerCustomer || 1500}</span>
            </div>
            <div className="w-full bg-[#374151] rounded-full h-2">
              <div className="bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] h-2 rounded-full" style={{ width: '75%' }}></div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#1F2937]/30 to-[#111827]/30 border border-[#374151] rounded-xl p-5">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-[#9CA3AF]">Total Expenses</span>
              <span className="text-lg font-bold text-[#EF4444]">Rs. {(todayStats?.totalExpenses || 0).toLocaleString()}</span>
            </div>
            <div className="w-full bg-[#374151] rounded-full h-2">
              <div className="bg-gradient-to-r from-[#EF4444] to-[#DC2626] h-2 rounded-full" style={{ width: '35%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Stats Section - Premium */}
      {todayStats && (
        <div className="bg-gradient-to-br from-[#1F2937]/50 to-[#111827]/50 backdrop-blur-xl border border-[#374151] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-[#EAF0FB]">Today's Statistics</h3>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="bg-gradient-to-br from-[#1F2937]/30 to-[#111827]/30 border border-[#374151] rounded-xl p-4 hover:border-[#8B5CF6] transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#10B981]/20 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-[#10B981]" />
                </div>
                <span className="text-xs text-[#9CA3AF]">Today's Collection</span>
              </div>
              <p className="text-xl font-bold text-[#10B981]">Rs. {todayStats.todayCollection?.toLocaleString() || 0}</p>
              <p className="text-xs text-[#6B7280] mt-1">{todayStats.todayPaymentCount || 0} payments</p>
            </div>

            <div className="bg-gradient-to-br from-[#1F2937]/30 to-[#111827]/30 border border-[#374151] rounded-xl p-4 hover:border-[#8B5CF6] transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/20 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-[#8B5CF6]" />
                </div>
                <span className="text-xs text-[#9CA3AF]">Invoices Paid</span>
              </div>
              <p className="text-xl font-bold text-[#8B5CF6]">{todayStats.todayInvoicesPaid || 0}</p>
              <p className="text-xs text-[#6B7280] mt-1">Today</p>
            </div>

            <div className="bg-gradient-to-br from-[#1F2937]/30 to-[#111827]/30 border border-[#374151] rounded-xl p-4 hover:border-[#8B5CF6] transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#06B6D4]/20 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-[#06B6D4]" />
                </div>
                <span className="text-xs text-[#9CA3AF]">Active Today</span>
              </div>
              <p className="text-xl font-bold text-[#06B6D4]">{todayStats.activeToday || 0}</p>
              <p className="text-xs text-[#6B7280] mt-1">Customers online</p>
            </div>

            <div className="bg-gradient-to-br from-[#1F2937]/30 to-[#111827]/30 border border-[#374151] rounded-xl p-4 hover:border-[#8B5CF6] transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#EC4899]/20 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-[#EC4899]" />
                </div>
                <span className="text-xs text-[#9CA3AF]">New This Month</span>
              </div>
              <p className="text-xl font-bold text-[#EC4899]">{todayStats.newThisMonth || 0}</p>
              <p className="text-xs text-[#6B7280] mt-1">New customers</p>
            </div>

            <div className="bg-gradient-to-br from-[#1F2937]/30 to-[#111827]/30 border border-[#374151] rounded-xl p-4 hover:border-[#8B5CF6] transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#EF4444]/20 flex items-center justify-center">
                  <UserX className="w-4 h-4 text-[#EF4444]" />
                </div>
                <span className="text-xs text-[#9CA3AF]">Suspended</span>
              </div>
              <p className="text-xl font-bold text-[#EF4444]">{todayStats.suspended || 0}</p>
              <p className="text-xs text-[#6B7280] mt-1">Currently suspended</p>
            </div>

            <div className="bg-gradient-to-br from-[#1F2937]/30 to-[#111827]/30 border border-[#374151] rounded-xl p-4 hover:border-[#8B5CF6] transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/20 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-[#F59E0B]" />
                </div>
                <span className="text-xs text-[#9CA3AF]">Overdue</span>
              </div>
              <p className="text-xl font-bold text-[#F59E0B]">{todayStats.overdue || 0}</p>
              <p className="text-xs text-[#6B7280] mt-1">Overdue bills</p>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Quick Actions Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative group">
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] text-white shadow-2xl shadow-[#8B5CF6]/30 hover:shadow-[#8B5CF6]/50 transition-all duration-300 flex items-center justify-center"
          >
            {showQuickActions ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
          </button>
          {showQuickActions && (
            <div className="absolute bottom-16 right-0 space-y-2">
              <button
                onClick={() => navigate('/customers/add')}
                className="flex items-center gap-3 px-4 py-3 bg-[#1F2937] border border-[#374151] rounded-xl text-[#EAF0FB] hover:bg-[#374151] transition-all shadow-xl whitespace-nowrap"
              >
                <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/20 flex items-center justify-center">
                  <Users className="w-4 h-4 text-[#8B5CF6]" />
                </div>
                <span className="text-sm font-medium">Add Customer</span>
              </button>
              <button
                onClick={() => navigate('/connections/add')}
                className="flex items-center gap-3 px-4 py-3 bg-[#1F2937] border border-[#374151] rounded-xl text-[#EAF0FB] hover:bg-[#374151] transition-all shadow-xl whitespace-nowrap"
              >
                <div className="w-8 h-8 rounded-lg bg-[#10B981]/20 flex items-center justify-center">
                  <Server className="w-4 h-4 text-[#10B981]" />
                </div>
                <span className="text-sm font-medium">New Connection</span>
              </button>
              <button
                onClick={() => navigate('/billing/create')}
                className="flex items-center gap-3 px-4 py-3 bg-[#1F2937] border border-[#374151] rounded-xl text-[#EAF0FB] hover:bg-[#374151] transition-all shadow-xl whitespace-nowrap"
              >
                <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/20 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-[#F59E0B]" />
                </div>
                <span className="text-sm font-medium">Create Bill</span>
              </button>
              <button
                onClick={() => navigate('/complaints/add')}
                className="flex items-center gap-3 px-4 py-3 bg-[#1F2937] border border-[#374151] rounded-xl text-[#EAF0FB] hover:bg-[#374151] transition-all shadow-xl whitespace-nowrap"
              >
                <div className="w-8 h-8 rounded-lg bg-[#EF4444]/20 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-[#EF4444]" />
                </div>
                <span className="text-sm font-medium">Add Complaint</span>
              </button>
              <button
                onClick={() => navigate('/staff/add')}
                className="flex items-center gap-3 px-4 py-3 bg-[#1F2937] border border-[#374151] rounded-xl text-[#EAF0FB] hover:bg-[#374151] transition-all shadow-xl whitespace-nowrap"
              >
                <div className="w-8 h-8 rounded-lg bg-[#06B6D4]/20 flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-[#06B6D4]" />
                </div>
                <span className="text-sm font-medium">Add Staff</span>
              </button>
              <button
                onClick={() => navigate('/packages/add')}
                className="flex items-center gap-3 px-4 py-3 bg-[#1F2937] border border-[#374151] rounded-xl text-[#EAF0FB] hover:bg-[#374151] transition-all shadow-xl whitespace-nowrap"
              >
                <div className="w-8 h-8 rounded-lg bg-[#EC4899]/20 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-[#EC4899]" />
                </div>
                <span className="text-sm font-medium">Create Package</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

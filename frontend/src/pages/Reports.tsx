import { useState, useEffect, useCallback } from 'react';
import { Download, Calendar, TrendingUp, Users, DollarSign, Package, CreditCard, MapPin, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import DateFilter, { DateFilterType } from '../components/DateFilter';
import { reportsApi } from '../services/api';

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState<'revenue' | 'customers' | 'inventory' | 'staff' | 'billing' | 'connections' | 'areas' | 'expenses'>('revenue');
  const [reportData, setReportData] = useState<any>(null);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load summary stats once on mount
  useEffect(() => {
    reportsApi.getBusiness().then(res => {
      if (res.success) setSummaryData(res.data?.overview || null);
    });
  }, []);

  const loadReportData = useCallback(async () => {
    setLoading(true);
    setError('');
    
    let result;
    switch (selectedReport) {
      case 'customers':
        result = await reportsApi.getCustomers();
        break;
      case 'expenses':
        result = await reportsApi.getExpenses();
        break;
      case 'billing':
        result = await reportsApi.getBilling();
        break;
      case 'connections':
        result = await reportsApi.getConnections();
        break;
      case 'revenue':
        result = await reportsApi.getRevenue();
        break;
      default:
        setReportData(null);
        setLoading(false);
        return;
    }

    if (result && result.success) {
      setReportData(result.data);
    } else {
      setError((result && result.error) || 'Failed to load report data');
      setReportData(null);
    }
    setLoading(false);
  }, [selectedReport]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  const handleFilterChange = (_filterType: DateFilterType, _startDate?: Date, _endDate?: Date) => {
    loadReportData();
  };

  const handleRefresh = () => {
    loadReportData();
  };

  const handleExportPDF = () => {
    const reportTitle = reports[selectedReport]?.title || 'Report';
    const printContent = `
      <html>
        <head>
          <title>${reportTitle}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f4f4f4; }
            .summary { margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 5px; }
          </style>
        </head>
        <body>
          <h1>${reportTitle}</h1>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
          <div class="summary">
            <p>This report contains data for the selected time period.</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              ${reportData && typeof reportData === 'object' ? Object.entries(reportData).map(([key, value]) => {
                if (typeof value === 'object' || Array.isArray(value)) return '';
                return `<tr><td>${key}</td><td>${value}</td></tr>`;
              }).join('') : '<tr><td colspan="2">No data available</td></tr>'}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const reports = {
    revenue: {
      title: 'Revenue Report',
      icon: DollarSign,
      data: reportData?.monthlyData || []
    },
    customers: {
      title: 'Customer Report',
      icon: Users,
      data: reportData?.monthlyData || []
    },
    inventory: {
      title: 'Inventory Report',
      icon: Package,
      data: []
    },
    staff: {
      title: 'Staff Report',
      icon: TrendingUp,
      data: reportData?.staff || []
    },
    billing: {
      title: 'Billing Report',
      icon: CreditCard,
      data: reportData?.monthlyData || []
    },
    connections: {
      title: 'Connections Report',
      icon: Users,
      data: reportData?.monthlyData || []
    },
    areas: {
      title: 'Areas Report',
      icon: MapPin,
      data: []
    },
    expenses: {
      title: 'Expenses Report',
      icon: AlertCircle,
      data: reportData?.categoryData || []
    }
  };

  const currentReport = reports[selectedReport];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[#4C8DFF] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-[#F5514B]">{error}</div>
        <button onClick={loadReportData} className="flex items-center gap-2 px-4 py-2 bg-[#4C8DFF] text-white rounded-lg">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[#EAF0FB]">Reports</h2>
        <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 bg-[#14E8B4] text-[#04231B] font-semibold rounded-lg hover:bg-[#20F0C0] transition-colors">
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Date Filter */}
      <DateFilter onFilterChange={handleFilterChange} onRefresh={handleRefresh} />

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-[#14E8B4]" />
          </div>
          <div className="text-xl font-bold text-[#EAF0FB]">
            Rs. {summaryData ? (summaryData.totalRevenue || 0).toLocaleString() : '—'}
          </div>
          <div className="text-xs text-[#8996AD]">Total Revenue</div>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-[#4C8DFF]" />
          </div>
          <div className="text-xl font-bold text-[#EAF0FB]">
            {summaryData ? (summaryData.totalCustomers || 0).toLocaleString() : '—'}
          </div>
          <div className="text-xs text-[#8996AD]">Total Customers</div>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <CreditCard className="w-5 h-5 text-[#F6B93B]" />
          </div>
          <div className="text-xl font-bold text-[#EAF0FB]">
            {summaryData && summaryData.totalInvoices > 0
              ? Math.round((summaryData.paidInvoices / summaryData.totalInvoices) * 100) + '%'
              : '—'}
          </div>
          <div className="text-xs text-[#8996AD]">Collection Rate</div>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <Package className="w-5 h-5 text-[#F5514B]" />
          </div>
          <div className="text-xl font-bold text-[#EAF0FB]">
            Rs. {summaryData ? (summaryData.totalExpenses || 0).toLocaleString() : '—'}
          </div>
          <div className="text-xs text-[#8996AD]">Total Expenses</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setSelectedReport('revenue')}
          className={`p-4 rounded-xl border transition-colors ${
            selectedReport === 'revenue'
              ? 'bg-[#14E8B4]/10 border-[#14E8B4] text-[#14E8B4]'
              : 'bg-[#121B2E] border-[#232D45] text-[#8996AD] hover:border-[#14E8B4]'
          }`}
        >
          <DollarSign className="w-6 h-6 mb-2" />
          <p className="font-medium">Revenue</p>
        </button>
        <button
          onClick={() => setSelectedReport('customers')}
          className={`p-4 rounded-xl border transition-colors ${
            selectedReport === 'customers'
              ? 'bg-[#14E8B4]/10 border-[#14E8B4] text-[#14E8B4]'
              : 'bg-[#121B2E] border-[#232D45] text-[#8996AD] hover:border-[#14E8B4]'
          }`}
        >
          <Users className="w-6 h-6 mb-2" />
          <p className="font-medium">Customers</p>
        </button>
        <button
          onClick={() => setSelectedReport('inventory')}
          className={`p-4 rounded-xl border transition-colors ${
            selectedReport === 'inventory'
              ? 'bg-[#14E8B4]/10 border-[#14E8B4] text-[#14E8B4]'
              : 'bg-[#121B2E] border-[#232D45] text-[#8996AD] hover:border-[#14E8B4]'
          }`}
        >
          <Package className="w-6 h-6 mb-2" />
          <p className="font-medium">Inventory</p>
        </button>
        <button
          onClick={() => setSelectedReport('staff')}
          className={`p-4 rounded-xl border transition-colors ${
            selectedReport === 'staff'
              ? 'bg-[#14E8B4]/10 border-[#14E8B4] text-[#14E8B4]'
              : 'bg-[#121B2E] border-[#232D45] text-[#8996AD] hover:border-[#14E8B4]'
          }`}
        >
          <TrendingUp className="w-6 h-6 mb-2" />
          <p className="font-medium">Staff</p>
        </button>
        <button
          onClick={() => setSelectedReport('billing')}
          className={`p-4 rounded-xl border transition-colors ${
            selectedReport === 'billing'
              ? 'bg-[#14E8B4]/10 border-[#14E8B4] text-[#14E8B4]'
              : 'bg-[#121B2E] border-[#232D45] text-[#8996AD] hover:border-[#14E8B4]'
          }`}
        >
          <CreditCard className="w-6 h-6 mb-2" />
          <p className="font-medium">Billing</p>
        </button>
        <button
          onClick={() => setSelectedReport('connections')}
          className={`p-4 rounded-xl border transition-colors ${
            selectedReport === 'connections'
              ? 'bg-[#14E8B4]/10 border-[#14E8B4] text-[#14E8B4]'
              : 'bg-[#121B2E] border-[#232D45] text-[#8996AD] hover:border-[#14E8B4]'
          }`}
        >
          <Users className="w-6 h-6 mb-2" />
          <p className="font-medium">Connections</p>
        </button>
        <button
          onClick={() => setSelectedReport('areas')}
          className={`p-4 rounded-xl border transition-colors ${
            selectedReport === 'areas'
              ? 'bg-[#14E8B4]/10 border-[#14E8B4] text-[#14E8B4]'
              : 'bg-[#121B2E] border-[#232D45] text-[#8996AD] hover:border-[#14E8B4]'
          }`}
        >
          <MapPin className="w-6 h-6 mb-2" />
          <p className="font-medium">Areas</p>
        </button>
        <button
          onClick={() => setSelectedReport('expenses')}
          className={`p-4 rounded-xl border transition-colors ${
            selectedReport === 'expenses'
              ? 'bg-[#14E8B4]/10 border-[#14E8B4] text-[#14E8B4]'
              : 'bg-[#121B2E] border-[#232D45] text-[#8996AD] hover:border-[#14E8B4]'
          }`}
        >
          <AlertCircle className="w-6 h-6 mb-2" />
          <p className="font-medium">Expenses</p>
        </button>
      </div>

      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-[#EAF0FB]">{currentReport.title}</h3>
          <div className="flex items-center gap-2 text-sm text-[#8996AD]">
            <Calendar className="w-4 h-4" />
            <span>Last 6 months</span>
          </div>
        </div>

        {/* Chart Section */}
        {selectedReport === 'revenue' && (
          <div className="mb-6">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={currentReport.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232D45" />
                <XAxis dataKey="month" stroke="#8996AD" />
                <YAxis stroke="#8996AD" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#121B2E', border: '1px solid #232D45', borderRadius: '8px' }}
                  itemStyle={{ color: '#EAF0FB' }}
                  formatter={(value: number) => `Rs. ${value.toLocaleString()}`}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#14E8B4" strokeWidth={2} name="Revenue" />
                <Line type="monotone" dataKey="expenses" stroke="#F5514B" strokeWidth={2} name="Expenses" />
                <Line type="monotone" dataKey="profit" stroke="#4C8DFF" strokeWidth={2} name="Profit" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {selectedReport === 'customers' && (
          <div className="mb-6">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={currentReport.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232D45" />
                <XAxis dataKey="month" stroke="#8996AD" />
                <YAxis stroke="#8996AD" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#121B2E', border: '1px solid #232D45', borderRadius: '8px' }}
                  itemStyle={{ color: '#EAF0FB' }}
                />
                <Legend />
                <Bar dataKey="new" fill="#14E8B4" name="New Customers" />
                <Bar dataKey="active" fill="#4C8DFF" name="Active" />
                <Bar dataKey="suspended" fill="#F5514B" name="Suspended" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {selectedReport === 'billing' && (
          <div className="mb-6">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={currentReport.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232D45" />
                <XAxis dataKey="month" stroke="#8996AD" />
                <YAxis stroke="#8996AD" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#121B2E', border: '1px solid #232D45', borderRadius: '8px' }}
                  itemStyle={{ color: '#EAF0FB' }}
                  formatter={(value: number) => `Rs. ${value.toLocaleString()}`}
                />
                <Legend />
                <Line type="monotone" dataKey="collected" stroke="#14E8B4" strokeWidth={2} name="Collected" />
                <Line type="monotone" dataKey="pending" stroke="#F6B93B" strokeWidth={2} name="Pending" />
                <Line type="monotone" dataKey="overdue" stroke="#F5514B" strokeWidth={2} name="Overdue" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {selectedReport === 'connections' && (
          <div className="mb-6">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={currentReport.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232D45" />
                <XAxis dataKey="month" stroke="#8996AD" />
                <YAxis stroke="#8996AD" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#121B2E', border: '1px solid #232D45', borderRadius: '8px' }}
                  itemStyle={{ color: '#EAF0FB' }}
                />
                <Legend />
                <Bar dataKey="requests" fill="#4C8DFF" name="Requests" />
                <Bar dataKey="approved" fill="#14E8B4" name="Approved" />
                <Bar dataKey="rejected" fill="#F5514B" name="Rejected" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {selectedReport === 'areas' && (
          <div className="mb-6">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={currentReport.data} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#232D45" />
                <XAxis type="number" stroke="#8996AD" />
                <YAxis dataKey="area" type="category" stroke="#8996AD" width={80} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#121B2E', border: '1px solid #232D45', borderRadius: '8px' }}
                  itemStyle={{ color: '#EAF0FB' }}
                  formatter={(value: number) => `Rs. ${value.toLocaleString()}`}
                />
                <Legend />
                <Bar dataKey="customers" fill="#14E8B4" name="Customers" />
                <Bar dataKey="revenue" fill="#4C8DFF" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {selectedReport === 'expenses' && (
          <div className="mb-6">
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPieChart>
                <Pie
                  data={currentReport.data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percentage }) => `${category} ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {currentReport.data.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={['#14E8B4', '#4C8DFF', '#F6B93B', '#F5514B', '#8996AD'][index % 5]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#121B2E', border: '1px solid #232D45', borderRadius: '8px' }}
                  itemStyle={{ color: '#EAF0FB' }}
                  formatter={(value: number) => `Rs. ${(value || 0).toLocaleString()}`}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#232D45]">
                {selectedReport === 'revenue' && (
                  <>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Month</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Revenue</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Expenses</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Profit</th>
                  </>
                )}
                {selectedReport === 'customers' && (
                  <>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Month</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">New Customers</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Active</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Suspended</th>
                  </>
                )}
                {selectedReport === 'inventory' && (
                  <>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Item</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Total Quantity</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Used</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Remaining</th>
                  </>
                )}
                {selectedReport === 'staff' && (
                  <>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Staff Member</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Total Tasks</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Completed</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Efficiency</th>
                  </>
                )}
                {selectedReport === 'billing' && (
                  <>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Month</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Collected</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Pending</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Overdue</th>
                  </>
                )}
                {selectedReport === 'connections' && (
                  <>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Month</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Requests</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Approved</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Rejected</th>
                  </>
                )}
                {selectedReport === 'areas' && (
                  <>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Area</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Customers</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Revenue</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Growth</th>
                  </>
                )}
                {selectedReport === 'expenses' && (
                  <>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Category</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Percentage</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {currentReport.data.map((row: any, index: number) => (
                <tr key={index} className="border-b border-[#232D45] hover:bg-[#1B2540]/50">
                  {selectedReport === 'revenue' && (
                    <>
                      <td className="py-3 px-4 text-sm text-[#EAF0FB]">{row.month}</td>
                      <td className="py-3 px-4 text-sm text-[#14E8B4]">Rs. {(row.revenue || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm text-[#F5514B]">Rs. {(row.expenses || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm text-[#EAF0FB]">Rs. {(row.profit || 0).toLocaleString()}</td>
                    </>
                  )}
                  {selectedReport === 'customers' && (
                    <>
                      <td className="py-3 px-4 text-sm text-[#EAF0FB]">{row.month}</td>
                      <td className="py-3 px-4 text-sm text-[#14E8B4]">{row.new}</td>
                      <td className="py-3 px-4 text-sm text-[#EAF0FB]">{row.active}</td>
                      <td className="py-3 px-4 text-sm text-[#F5514B]">{row.suspended}</td>
                    </>
                  )}
                  {selectedReport === 'inventory' && (
                    <>
                      <td className="py-3 px-4 text-sm text-[#EAF0FB]">{row.item}</td>
                      <td className="py-3 px-4 text-sm text-[#8996AD]">{row.quantity}</td>
                      <td className="py-3 px-4 text-sm text-[#F6B93B]">{row.used}</td>
                      <td className="py-3 px-4 text-sm text-[#14E8B4]">{row.remaining}</td>
                    </>
                  )}
                  {selectedReport === 'staff' && (
                    <>
                      <td className="py-3 px-4 text-sm text-[#EAF0FB]">{row.name}</td>
                      <td className="py-3 px-4 text-sm text-[#8996AD]">{row.tasks}</td>
                      <td className="py-3 px-4 text-sm text-[#14E8B4]">{row.completed}</td>
                      <td className="py-3 px-4 text-sm text-[#EAF0FB]">{row.efficiency}</td>
                    </>
                  )}
                  {selectedReport === 'billing' && (
                    <>
                      <td className="py-3 px-4 text-sm text-[#EAF0FB]">{row.month}</td>
                      <td className="py-3 px-4 text-sm text-[#14E8B4]">Rs. {(row.collected || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm text-[#F6B93B]">Rs. {(row.pending || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm text-[#F5514B]">Rs. {(row.overdue || 0).toLocaleString()}</td>
                    </>
                  )}
                  {selectedReport === 'connections' && (
                    <>
                      <td className="py-3 px-4 text-sm text-[#EAF0FB]">{row.month}</td>
                      <td className="py-3 px-4 text-sm text-[#8996AD]">{row.requests}</td>
                      <td className="py-3 px-4 text-sm text-[#14E8B4]">{row.approved}</td>
                      <td className="py-3 px-4 text-sm text-[#F5514B]">{row.rejected}</td>
                    </>
                  )}
                  {selectedReport === 'areas' && (
                    <>
                      <td className="py-3 px-4 text-sm text-[#EAF0FB]">{row.area}</td>
                      <td className="py-3 px-4 text-sm text-[#8996AD]">{row.customers}</td>
                      <td className="py-3 px-4 text-sm text-[#14E8B4]">Rs. {(row.revenue || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm text-[#F6B93B]">{row.growth}%</td>
                    </>
                  )}
                  {selectedReport === 'expenses' && (
                    <>
                      <td className="py-3 px-4 text-sm text-[#EAF0FB]">{row.category}</td>
                      <td className="py-3 px-4 text-sm text-[#F5514B]">Rs. {(row.amount || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm text-[#8996AD]">{row.percentage}%</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

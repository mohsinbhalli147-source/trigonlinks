import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Download, ArrowLeft, MapPin } from 'lucide-react';
import { areasApi } from '../services/api';
import { toast } from '../components/Toast';
import EmptyState from '../components/EmptyState';

interface AreaReportData {
  totalCustomers: number;
  activeCustomers: number;
  packageDistribution: { name: string; value: number }[];
  connectionSuccess: number;
  customerGrowth: number[];
  customerGrowthLabels: string[];
}

interface AreaDetails {
  id: string;
  name: string;
  code: string;
  city: string;
}

const COLORS = ['#14E8B4', '#4C8DFF', '#F6B93B', '#F5514B', '#8996AD'];

export default function AreaReports() {
  const navigate = useNavigate();
  const { areaId } = useParams();
  const [area, setArea] = useState<AreaDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState<AreaReportData | null>(null);
  const [areaList, setAreaList] = useState<any[]>([]);
  const [listLoading, setListLoading] = useState(false);

  useEffect(() => {
    if (areaId) {
      loadReportData();
    } else {
      loadAreaList();
    }
  }, [areaId]);

  const loadAreaList = async () => {
    setListLoading(true);
    setError('');
    const result = await areasApi.getAll({ limit: 100 });
    if (result.success) {
      setAreaList(result.data?.data || []);
    } else {
      setError(result.error || 'Failed to load areas');
    }
    setListLoading(false);
    setLoading(false);
  };

  const loadReportData = async () => {
    setLoading(true);
    setError('');
    try {
      const [areaResult, reportResult] = await Promise.all([
        areasApi.getById(areaId!),
        areasApi.getReport(areaId!),
      ]);

      if (areaResult.success) {
        setArea(areaResult.data);
      }

      if (reportResult.success) {
        setReportData(reportResult.data);
      } else {
        setError(reportResult.error || 'Failed to load area report');
        toast.error('Failed to load area report data');
      }
    } catch (err) {
      setError('Failed to load area report data');
    } finally {
      setLoading(false);
    }
  };

  const customerGrowthData = reportData
    ? (reportData.customerGrowthLabels || []).map((label, index) => ({
        month: label,
        customers: reportData.customerGrowth[index] || 0,
      }))
    : [];

  const handleExport = () => {
    if (!reportData || !area) return;
    
    const content = `
AREA REPORT - ${area.name}
==========================
Total Customers: ${reportData.totalCustomers}
Active Customers: ${reportData.activeCustomers}
Connection Success: ${reportData.connectionSuccess}%
Inactive Customers: ${reportData.totalCustomers - reportData.activeCustomers}

Package Distribution:
${reportData.packageDistribution.map(p => `${p.name}: ${p.value}`).join('\n')}
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `area-report-${area.name}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Report exported successfully');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#4C8DFF] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#8996AD] text-sm">Loading area report...</p>
        </div>
      </div>
    );
  }

  if (!areaId) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#EAF0FB]">Area Reports</h2>
          <p className="text-sm text-[#8996AD]">Select an area to view its reports</p>
        </div>

        {listLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-[#4C8DFF] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : areaList.length === 0 ? (
          <EmptyState title="No Areas Found" message="Add areas first to view area reports." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {areaList.map((a) => (
              <div
                key={a.id}
                onClick={() => navigate(`/areas/reports/${a.id}`)}
                className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6 cursor-pointer hover:border-[#14E8B4] transition-all hover:translate-y-[-2px] group"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-[#4C8DFF]/15 flex items-center justify-center group-hover:bg-[#14E8B4]/15 transition-colors">
                    <MapPin className="w-6 h-6 text-[#4C8DFF] group-hover:text-[#14E8B4] transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#EAF0FB] group-hover:text-[#14E8B4] transition-colors">{a.name}</h3>
                    <p className="text-sm text-[#8996AD]">{a.city}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs text-[#8996AD] pt-4 border-t border-[#232D45]">
                  <span>Code: {a.code}</span>
                  <span>{a.district || a.province || ''}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState title="Failed to Load Report" message={error} icon="error" onRetry={loadReportData} />
    );
  }

  if (!reportData) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/areas/reports')}
            className="p-2 bg-[#232D45] text-[#8996AD] rounded-lg hover:text-[#EAF0FB] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-[#EAF0FB]">Area Reports</h2>
            {area && (
              <p className="text-sm text-[#8996AD]">
                {area.name} {area.code ? `(${area.code})` : ''} {area.city ? `• ${area.city}` : ''}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-[#14E8B4] text-[#04231B] font-semibold rounded-lg hover:bg-[#20F0C0] transition-colors"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-[#4C8DFF]" />
            <p className="text-sm text-[#8996AD]">Total Customers</p>
          </div>
          <p className="text-2xl font-bold text-[#EAF0FB]">{reportData.totalCustomers}</p>
          <p className="text-sm text-[#14E8B4] mt-1">{reportData.activeCustomers} active</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-[#14E8B4]" />
            <p className="text-sm text-[#8996AD]">Connection Success</p>
          </div>
          <p className="text-2xl font-bold text-[#14E8B4]">{reportData.connectionSuccess}%</p>
          <p className="text-sm text-[#8996AD] mt-1">Installation success rate</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-[#F6B93B]" />
            <p className="text-sm text-[#8996AD]">Inactive Customers</p>
          </div>
          <p className="text-2xl font-bold text-[#F6B93B]">{reportData.totalCustomers - reportData.activeCustomers}</p>
          <p className="text-sm text-[#8996AD] mt-1">Suspended / inactive</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {customerGrowthData.length > 0 && (
          <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4">Customer Growth (6 Months)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={customerGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232D45" />
                <XAxis dataKey="month" stroke="#8996AD" />
                <YAxis stroke="#8996AD" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1B2540', border: '1px solid #232D45' }}
                  itemStyle={{ color: '#EAF0FB' }}
                />
                <Bar dataKey="customers" fill="#4C8DFF" name="Customers" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {reportData.packageDistribution.length > 0 && (
          <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4">Package Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportData.packageDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {reportData.packageDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1B2540', border: '1px solid #232D45' }}
                  itemStyle={{ color: '#EAF0FB' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {reportData.totalCustomers === 0 && (
        <EmptyState
          title="No Customer Data"
          message="No customers are assigned to this area yet. Customer data will appear here once customers are added to this area."
        />
      )}
    </div>
  );
}

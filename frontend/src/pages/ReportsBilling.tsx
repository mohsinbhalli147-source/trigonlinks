import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, TrendingUp, AlertCircle, CheckCircle, ArrowRight, Download } from 'lucide-react';
import axios from 'axios';
import { reportsApi } from '../services/api';

interface BillingStats {
  total: number;
  paid: number;
  unpaid: number;
  partial: number;
  totalRevenue: number;
  pendingRevenue: number;
  invoices: any[];
}

export default function ReportsBilling() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<BillingStats>({
    total: 0,
    paid: 0,
    unpaid: 0,
    partial: 0,
    totalRevenue: 0,
    pendingRevenue: 0,
    invoices: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillingStats();
  }, []);

  const fetchBillingStats = async () => {
    try {
      const result = await reportsApi.getBilling();
      if (result.success) {
        setStats(result.data);
      } else {
        console.error(result.error);
      }
    } catch (error) {
      console.error('Error fetching billing stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { name: 'Total Invoices', value: stats.total, icon: DollarSign, color: 'text-[#4C8DFF]' },
    { name: 'Paid', value: stats.paid, icon: CheckCircle, color: 'text-[#14E8B4]' },
    { name: 'Unpaid', value: stats.unpaid, icon: AlertCircle, color: 'text-[#F5514B]' },
    { name: 'Partial', value: stats.partial, icon: AlertCircle, color: 'text-[#F6B93B]' },
    { name: 'Collected Revenue', value: `Rs. ${(stats.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, color: 'text-[#14E8B4]' },
  ];

  const collectionRate = stats.total > 0 ? Math.round((stats.paid / stats.total) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8996AD]">Loading billing reports...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#EAF0FB]">Billing Reports</h1>
        <button
          onClick={() => navigate('/billing')}
          className="px-4 py-2 border border-[#232D45] rounded-lg text-[#8996AD] hover:bg-[#1B2540] transition-colors flex items-center gap-2"
        >
          View Billing
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
              <div className="text-sm text-[#8996AD]">{stat.name}</div>
            </div>
            <div className="text-3xl font-bold text-[#EAF0FB]">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[#EAF0FB] mb-4">Collection Performance</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[#8996AD]">Collection Rate</span>
              <span className="text-2xl font-bold text-[#14E8B4]">{collectionRate}%</span>
            </div>
            <div className="w-full bg-[#1B2540] rounded-full h-2">
              <div 
                className="bg-[#14E8B4] h-2 rounded-full transition-all"
                style={{ width: `${collectionRate}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8996AD]">Pending Revenue</span>
              <span className="text-2xl font-bold text-[#F6B93B]">Rs. {(stats.pendingRevenue || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[#EAF0FB] mb-4">Payment Status</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#14E8B4]" />
              <span className="text-[#8996AD]">Paid</span>
              <span className="ml-auto text-[#EAF0FB] font-medium">{stats.paid}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#F5514B]" />
              <span className="text-[#8996AD]">Unpaid</span>
              <span className="ml-auto text-[#EAF0FB] font-medium">{stats.unpaid}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#F6B93B]" />
              <span className="text-[#8996AD]">Partial</span>
              <span className="ml-auto text-[#EAF0FB] font-medium">{stats.partial}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#EAF0FB]">Recent Invoices</h2>
          <button className="px-3 py-2 bg-[#4C8DFF] text-white rounded-lg hover:bg-[#3B7BD9] transition-colors flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#232D45]">
                <th className="text-left text-[#8996AD] pb-3 font-medium">Customer</th>
                <th className="text-left text-[#8996AD] pb-3 font-medium">Month</th>
                <th className="text-left text-[#8996AD] pb-3 font-medium">Amount</th>
                <th className="text-left text-[#8996AD] pb-3 font-medium">Paid</th>
                <th className="text-left text-[#8996AD] pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.invoices.slice(0, 10).map((invoice) => (
                <tr key={invoice.id} className="border-b border-[#232D45] hover:bg-[#1B2540]">
                  <td className="py-4">
                    <div className="text-[#EAF0FB] font-medium">{invoice.customerName}</div>
                  </td>
                  <td className="py-4 text-[#8996AD]">{invoice.month}</td>
                  <td className="py-4 text-[#EAF0FB]">Rs. {Number(invoice.amount || 0).toLocaleString()}</td>
                  <td className="py-4 text-[#14E8B4] font-medium">Rs. {Number(invoice.paidAmount || 0).toLocaleString()}</td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      invoice.status === 'paid' ? 'bg-[#14E8B4]/20 text-[#14E8B4]' : 
                      invoice.status === 'unpaid' ? 'bg-[#F5514B]/20 text-[#F5514B]' : 
                      'bg-[#F6B93B]/20 text-[#F6B93B]'
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

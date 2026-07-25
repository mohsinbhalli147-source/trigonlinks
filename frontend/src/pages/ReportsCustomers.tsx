import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp, DollarSign, ArrowRight, Download } from 'lucide-react';
import axios from 'axios';
import { reportsApi } from '../services/api';

interface CustomerStats {
  total: number;
  active: number;
  suspended: number;
  totalRevenue: number;
  avgRevenue: number;
  customers: any[];
}

export default function ReportsCustomers() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<CustomerStats>({
    total: 0,
    active: 0,
    suspended: 0,
    totalRevenue: 0,
    avgRevenue: 0,
    customers: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomerStats();
  }, []);

  const fetchCustomerStats = async () => {
    try {
      const result = await reportsApi.getCustomers();
      if (result.success) {
        setStats(result.data);
      } else {
        console.error(result.error);
      }
    } catch (error) {
      console.error('Error fetching customer stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { name: 'Total Customers', value: stats.total, icon: Users, color: 'text-[#4C8DFF]' },
    { name: 'Active Customers', value: stats.active, icon: Users, color: 'text-[#14E8B4]' },
    { name: 'Suspended', value: stats.suspended, icon: Users, color: 'text-[#F5514B]' },
    { name: 'Total Revenue', value: `Rs. ${(stats.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, color: 'text-[#14E8B4]' },
    { name: 'Avg Revenue/Customer', value: `Rs. ${Math.round(stats.avgRevenue || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-[#4C8DFF]' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8996AD]">Loading customer reports...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#EAF0FB]">Customer Reports</h1>
        <button
          onClick={() => navigate('/customers/all')}
          className="px-4 py-2 border border-[#232D45] rounded-lg text-[#8996AD] hover:bg-[#1B2540] transition-colors flex items-center gap-2"
        >
          View Customers
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

      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#EAF0FB]">Customer Distribution</h2>
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
                <th className="text-left text-[#8996AD] pb-3 font-medium">Status</th>
                <th className="text-left text-[#8996AD] pb-3 font-medium">Package</th>
                <th className="text-left text-[#8996AD] pb-3 font-medium">Fee</th>
                <th className="text-left text-[#8996AD] pb-3 font-medium">Area</th>
              </tr>
            </thead>
            <tbody>
              {stats.customers.slice(0, 10).map((customer) => (
                <tr key={customer.id} className="border-b border-[#232D45] hover:bg-[#1B2540]">
                  <td className="py-4">
                    <div className="text-[#EAF0FB] font-medium">{customer.name}</div>
                    <div className="text-xs text-[#8996AD]">{customer.mobile}</div>
                  </td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      customer.status === 'active' ? 'bg-[#14E8B4]/20 text-[#14E8B4]' : 'bg-[#F5514B]/20 text-[#F5514B]'
                    }`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="py-4 text-[#EAF0FB]">{customer.package}</td>
                  <td className="py-4 text-[#14E8B4] font-medium">Rs. {Number(customer.fee || 0).toLocaleString()}</td>
                  <td className="py-4 text-[#8996AD]">{customer.area}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[#EAF0FB] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/customers/add')}
            className="p-4 bg-[#1B2540] border border-[#232D45] rounded-lg hover:border-[#4C8DFF] transition-colors text-left"
          >
            <div className="text-[#EAF0FB] font-medium mb-1">Add New Customer</div>
            <div className="text-sm text-[#8996AD]">Register a new customer</div>
          </button>
          <button
            onClick={() => navigate('/customers/active')}
            className="p-4 bg-[#1B2540] border border-[#232D45] rounded-lg hover:border-[#4C8DFF] transition-colors text-left"
          >
            <div className="text-[#EAF0FB] font-medium mb-1">Active Customers</div>
            <div className="text-sm text-[#8996AD]">View active customer list</div>
          </button>
          <button
            onClick={() => navigate('/customers/suspended')}
            className="p-4 bg-[#1B2540] border border-[#232D45] rounded-lg hover:border-[#4C8DFF] transition-colors text-left"
          >
            <div className="text-[#EAF0FB] font-medium mb-1">Suspended Customers</div>
            <div className="text-sm text-[#8996AD]">Manage suspended accounts</div>
          </button>
        </div>
      </div>
    </div>
  );
}

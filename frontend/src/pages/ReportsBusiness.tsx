import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp, DollarSign, Users, Package, ArrowRight, Download } from 'lucide-react';
import axios from 'axios';
import { reportsApi } from '../services/api';

interface BusinessStats {
  overview: {
    totalCustomers: number;
    activeCustomers: number;
    totalRevenue: number;
    totalExpenses: number;
    profit: number;
    inventoryValue: number;
  };
  customers: any[];
  invoices: any[];
  expenses: any[];
  inventory: any[];
}

export default function ReportsBusiness() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<BusinessStats>({
    overview: {
      totalCustomers: 0,
      activeCustomers: 0,
      totalRevenue: 0,
      totalExpenses: 0,
      profit: 0,
      inventoryValue: 0,
    },
    customers: [],
    invoices: [],
    expenses: [],
    inventory: [],
  });
  const [profitability, setProfitability] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bizRes, profRes] = await Promise.all([
        reportsApi.getBusiness(),
        reportsApi.getProfitability()
      ]);

      if (bizRes.success) {
        setStats(bizRes.data);
      }
      if (profRes.success) {
        setProfitability(profRes.data);
      }
    } catch (error) {
      console.error('Error fetching business reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { name: 'Total Customers', value: stats.overview.totalCustomers, icon: Users, color: 'text-[#4C8DFF]' },
    { name: 'Active Customers', value: stats.overview.activeCustomers, icon: Users, color: 'text-[#14E8B4]' },
    { name: 'Total Revenue', value: `Rs. ${(stats.overview?.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, color: 'text-[#14E8B4]' },
    { name: 'Total Expenses', value: `Rs. ${(stats.overview?.totalExpenses || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-[#F5514B]' },
    { name: 'Net Profit', value: `Rs. ${(stats.overview?.profit || 0).toLocaleString()}`, icon: TrendingUp, color: stats.overview.profit >= 0 ? 'text-[#14E8B4]' : 'text-[#F5514B]' },
    { name: 'Inventory Value', value: `Rs. ${(stats.overview?.inventoryValue || 0).toLocaleString()}`, icon: Package, color: 'text-[#4C8DFF]' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8996AD]">Loading business reports...</div>
      </div>
    );
  }

  const instProfit = profitability?.installation_profit || 0;
  const bizProfit = profitability?.business_profit || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#EAF0FB]">Complete Business & Profitability Reports</h1>
          <p className="text-sm text-[#8996AD]">Separate ISP metrics for Connection Fee Installation Profit vs Monthly Business Profit</p>
        </div>
        <button className="px-4 py-2 bg-[#4C8DFF] text-white rounded-lg hover:bg-[#3B7BD9] transition-colors flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
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

      {/* Profitability Calculation Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Installation Profit Card */}
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#EAF0FB]">1. Connection & Installation Profit</h2>
            <span className="px-2.5 py-1 text-xs font-semibold bg-[#14E8B4]/10 text-[#14E8B4] border border-[#14E8B4]/20 rounded-full">
              Connection Fee vs Materials Cost
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[#8996AD]">Total Connection Fees Collected</span>
              <span className="text-xl font-bold text-[#14E8B4]">
                Rs. {(profitability?.installation_revenue || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8996AD]">Total Installation Material Expenses (Cost Price)</span>
              <span className="text-xl font-bold text-[#F5514B]">
                Rs. {(profitability?.installation_expenses || 0).toLocaleString()}
              </span>
            </div>
            <div className="border-t border-[#232D45] pt-4 flex items-center justify-between">
              <span className="text-[#EAF0FB] font-semibold">Net Installation Profit</span>
              <span className={`text-2xl font-bold ${instProfit >= 0 ? 'text-[#14E8B4]' : 'text-[#F5514B]'}`}>
                Rs. {instProfit.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-[#8996AD]">
              Calculated as: Connection Fee Revenue - Material Cost Expenses.
            </p>
          </div>
        </div>

        {/* 2. Monthly Business Profit Card */}
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#EAF0FB]">2. Monthly Business Profit</h2>
            <span className="px-2.5 py-1 text-xs font-semibold bg-[#4C8DFF]/10 text-[#4C8DFF] border border-[#4C8DFF]/20 rounded-full">
              Monthly Recurring Net
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[#8996AD]">Monthly Package Revenue Collected</span>
              <span className="text-xl font-bold text-[#14E8B4]">
                Rs. {(profitability?.monthly_revenue || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8996AD]">General Operating Expenses</span>
              <span className="text-xl font-bold text-[#F5514B]">
                Rs. {(profitability?.operating_expenses || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8996AD]">Installation Expenses</span>
              <span className="text-xl font-bold text-[#F5514B]">
                Rs. {(profitability?.installation_expenses || 0).toLocaleString()}
              </span>
            </div>
            <div className="border-t border-[#232D45] pt-4 flex items-center justify-between">
              <span className="text-[#EAF0FB] font-semibold">Net Business Profit</span>
              <span className={`text-2xl font-bold ${bizProfit >= 0 ? 'text-[#14E8B4]' : 'text-[#F5514B]'}`}>
                Rs. {bizProfit.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-[#8996AD]">
              Calculated as: Monthly Revenue - Operating Expenses - Installation Expenses.
            </p>
          </div>
        </div>
      </div>

        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[#EAF0FB] mb-4">Customer Metrics</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[#8996AD]">Total Customers</span>
              <span className="text-2xl font-bold text-[#EAF0FB]">{stats.overview.totalCustomers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8996AD]">Active Customers</span>
              <span className="text-2xl font-bold text-[#14E8B4]">{stats.overview.activeCustomers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8996AD]">Inactive Customers</span>
              <span className="text-2xl font-bold text-[#F6B93B]">{stats.overview.totalCustomers - stats.overview.activeCustomers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8996AD]">Activation Rate</span>
              <span className="text-xl font-bold text-[#4C8DFF]">
                {stats.overview.totalCustomers > 0 
                  ? Math.round((stats.overview.activeCustomers / stats.overview.totalCustomers) * 100) 
                  : 0}%
              </span>
            </div>
          </div>
        </div>

      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[#EAF0FB] mb-4">Quick Reports Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/reports/customers')}
            className="p-4 bg-[#1B2540] border border-[#232D45] rounded-lg hover:border-[#4C8DFF] transition-colors text-left"
          >
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-[#4C8DFF]" />
              <div className="text-[#EAF0FB] font-medium">Customer Reports</div>
            </div>
            <div className="text-sm text-[#8996AD]">Detailed customer analytics</div>
          </button>
          <button
            onClick={() => navigate('/reports/billing')}
            className="p-4 bg-[#1B2540] border border-[#232D45] rounded-lg hover:border-[#4C8DFF] transition-colors text-left"
          >
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-[#14E8B4]" />
              <div className="text-[#EAF0FB] font-medium">Billing Reports</div>
            </div>
            <div className="text-sm text-[#8996AD]">Revenue and payment analysis</div>
          </button>
          <button
            onClick={() => navigate('/reports/expenses')}
            className="p-4 bg-[#1B2540] border border-[#232D45] rounded-lg hover:border-[#4C8DFF] transition-colors text-left"
          >
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-[#F5514B]" />
              <div className="text-[#EAF0FB] font-medium">Expense Reports</div>
            </div>
            <div className="text-sm text-[#8996AD]">Cost breakdown and analysis</div>
          </button>
        </div>
      </div>

      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[#EAF0FB] mb-4">Business Health Indicators</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-[#1B2540] border border-[#232D45] rounded-lg">
            <div className="text-sm text-[#8996AD] mb-1">Revenue Growth</div>
            <div className="text-2xl font-bold text-[#14E8B4]">+15%</div>
            <div className="text-xs text-[#8996AD]">vs last month</div>
          </div>
          <div className="p-4 bg-[#1B2540] border border-[#232D45] rounded-lg">
            <div className="text-sm text-[#8996AD] mb-1">Customer Growth</div>
            <div className="text-2xl font-bold text-[#4C8DFF]">+8%</div>
            <div className="text-xs text-[#8996AD]">vs last month</div>
          </div>
          <div className="p-4 bg-[#1B2540] border border-[#232D45] rounded-lg">
            <div className="text-sm text-[#8996AD] mb-1">Collection Rate</div>
            <div className="text-2xl font-bold text-[#14E8B4]">94%</div>
            <div className="text-xs text-[#8996AD]">payment success</div>
          </div>
          <div className="p-4 bg-[#1B2540] border border-[#232D45] rounded-lg">
            <div className="text-sm text-[#8996AD] mb-1">Inventory Turnover</div>
            <div className="text-2xl font-bold text-[#F6B93B]">2.3x</div>
            <div className="text-xs text-[#8996AD]">per month</div>
          </div>
        </div>
      </div>
    </div>
  );
}

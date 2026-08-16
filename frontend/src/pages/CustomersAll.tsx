import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit, Trash2, Users, CheckCircle, DollarSign, AlertCircle, Eye, CreditCard, PauseCircle, PlayCircle, RefreshCw, Phone, MapPin } from 'lucide-react';
import { customersApi, dashboardApi } from '../services/api';
import { toast } from '../components/Toast';
import { useServerPagination } from '../hooks/useServerPagination';
import { Pagination } from '../components/Pagination';

interface Customer {
  id: string;
  uid: string;
  name: string;
  fatherName?: string;
  username?: string;
  mobile: string;
  cnic?: string;
  email?: string;
  address?: string;
  fee: number;
  status: 'active' | 'suspended' | 'inactive';
  package: string;
  area: string;
  install_date?: number;
  billing_date?: number;
  previous_balance?: number;
  iptv_enabled: boolean;
  iptv_monthly_charges: number;
  live_ip_enabled: boolean;
  live_ip_address?: string;
  live_ip_monthly_fee: number;
  createdAt: number;
}

export default function CustomersAll() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended' | 'inactive'>('all');
  const [showMobileView, setShowMobileView] = useState(false);

  const fetchCustomers = useCallback(({ page, limit }: { page: number; limit: number }) => {
    const params: any = { page, limit };
    if (searchTerm) params.search = searchTerm;
    if (filterStatus !== 'all') params.status = filterStatus;
    return customersApi.getAll(params);
  }, [searchTerm, filterStatus]);

  const {
    data: customers,
    loading: paginationLoading,
    error: paginationError,
    page,
    limit,
    total,
    totalPages,
    setPage,
    setLimit,
    refresh,
  } = useServerPagination<Customer>(fetchCustomers, { limit: 50 });

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterStatus]);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    const result = await dashboardApi.getStatistics({ stage: 'summary' });
    if (result.success && result.data) {
      setDashboardStats(result.data);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      const result = await customersApi.delete(id);
      if (result.success) {
        refresh();
        loadDashboardStats();
        toast.success('Customer deleted successfully');
      } else {
        toast.error(result.error || 'Failed to delete customer');
      }
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'active' | 'suspended' | 'inactive') => {
    const result = await customersApi.update(id, { status: newStatus });
    if (result.success) {
      refresh();
      loadDashboardStats();
      toast.success(`Customer ${newStatus} successfully`);
    } else {
      toast.error(result.error || 'Failed to update customer status');
    }
  };

  const handleAddPayment = (customerId: string) => {
    navigate(`/billing/receive?customerId=${customerId}`);
  };

  const isLoading = loading || paginationLoading;
  const errorMsg = error || paginationError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8996AD]">Loading customers...</div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#F5514B]">{errorMsg}</div>
      </div>
    );
  }

  // Use dashboard stats if available, otherwise calculate from customers
  const totalCustomers = dashboardStats?.overview?.totalCustomers || customers.length;
  const activeCustomers = dashboardStats?.overview?.activeCustomers || customers.filter(c => c.status === 'active').length;
  const suspendedCustomers = dashboardStats?.overview?.suspendedCustomers || customers.filter(c => c.status === 'suspended').length;
  const expiredCustomers = dashboardStats?.overview?.expiredCustomers || customers.filter(c => c.status === 'inactive').length;
  const monthlyRevenue = dashboardStats?.overview?.totalRevenue || customers.reduce((sum, c) => sum + c.fee, 0);
  const pendingBalance = dashboardStats?.overview?.pendingRevenue || customers.reduce((sum, c) => sum + (c.previous_balance || 0), 0);

  return (
    <div className="min-h-screen bg-[#0A0F1A]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#121B2E] to-[#1B2540] border-b border-[#232D45] px-4 py-4 md:px-6 md:py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#EAF0FB]">All Users</h1>
            <p className="text-sm text-[#8996AD] mt-1">Manage all customer accounts and their details</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate('/customers/add')}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#14E8B4] to-[#20F0C0] text-[#04231B] font-semibold rounded-lg hover:shadow-lg hover:shadow-[#14E8B4]/20 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Customer</span>
              <span className="sm:hidden">Add</span>
            </button>
            <button
              onClick={() => { refresh(); loadDashboardStats(); }}
              className="flex items-center gap-2 px-4 py-2 bg-[#232D45] text-[#EAF0FB] font-semibold rounded-lg hover:bg-[#2D3A52] transition-all duration-200"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          <div className="bg-gradient-to-br from-[#121B2E] to-[#1B2540] border border-[#232D45] rounded-xl p-4 hover:border-[#4C8DFF]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#4C8DFF]/10 cursor-pointer" onClick={() => setFilterStatus('all')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-[#8996AD] font-medium">Total</p>
                <p className="text-xl md:text-2xl font-bold text-[#EAF0FB] mt-1">{totalCustomers}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#4C8DFF]/20 to-[#4C8DFF]/5 flex items-center justify-center border border-[#4C8DFF]/20">
                <Users className="w-5 h-5 text-[#4C8DFF]" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#121B2E] to-[#1B2540] border border-[#232D45] rounded-xl p-4 hover:border-[#14E8B4]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#14E8B4]/10 cursor-pointer" onClick={() => setFilterStatus('active')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-[#8996AD] font-medium">Active</p>
                <p className="text-xl md:text-2xl font-bold text-[#14E8B4] mt-1">{activeCustomers}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#14E8B4]/20 to-[#14E8B4]/5 flex items-center justify-center border border-[#14E8B4]/20">
                <CheckCircle className="w-5 h-5 text-[#14E8B4]" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#121B2E] to-[#1B2540] border border-[#232D45] rounded-xl p-4 hover:border-[#F5514B]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#F5514B]/10 cursor-pointer" onClick={() => setFilterStatus('suspended')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-[#8996AD] font-medium">Suspended</p>
                <p className="text-xl md:text-2xl font-bold text-[#F5514B] mt-1">{suspendedCustomers}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#F5514B]/20 to-[#F5514B]/5 flex items-center justify-center border border-[#F5514B]/20">
                <PauseCircle className="w-5 h-5 text-[#F5514B]" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#121B2E] to-[#1B2540] border border-[#232D45] rounded-xl p-4 hover:border-[#8996AD]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#8996AD]/10 cursor-pointer" onClick={() => setFilterStatus('inactive')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-[#8996AD] font-medium">Inactive</p>
                <p className="text-xl md:text-2xl font-bold text-[#8996AD] mt-1">{expiredCustomers}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#8996AD]/20 to-[#8996AD]/5 flex items-center justify-center border border-[#8996AD]/20">
                <AlertCircle className="w-5 h-5 text-[#8996AD]" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#121B2E] to-[#1B2540] border border-[#232D45] rounded-xl p-4 hover:border-[#F6B93B]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#F6B93B]/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-[#8996AD] font-medium">Revenue</p>
                <p className="text-lg md:text-xl font-bold text-[#F6B93B] mt-1">Rs. {(monthlyRevenue / 1000).toFixed(1)}k</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#F6B93B]/20 to-[#F6B93B]/5 flex items-center justify-center border border-[#F6B93B]/20">
                <DollarSign className="w-5 h-5 text-[#F6B93B]" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#121B2E] to-[#1B2540] border border-[#232D45] rounded-xl p-4 hover:border-[#F5514B]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#F5514B]/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-[#8996AD] font-medium">Pending</p>
                <p className="text-lg md:text-xl font-bold text-[#F5514B] mt-1">Rs. {(pendingBalance / 1000).toFixed(1)}k</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#F5514B]/20 to-[#F5514B]/5 flex items-center justify-center border border-[#F5514B]/20">
                <AlertCircle className="w-5 h-5 text-[#F5514B]" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-gradient-to-br from-[#121B2E] to-[#1B2540] border border-[#232D45] rounded-xl p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#5C6B85]" />
              <input
                type="text"
                placeholder="Search by name, mobile, CNIC, address, IP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#0A0F1A] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4] focus:ring-2 focus:ring-[#14E8B4]/20 transition-all duration-200 placeholder:text-[#5C6B85]"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2.5 bg-[#0A0F1A] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4] transition-all duration-200"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
              </select>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-4 py-2.5 bg-[#232D45] text-[#EAF0FB] rounded-lg hover:bg-[#2D3A52] transition-all duration-200"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>


        {/* Customer List - Desktop Table View */}
        <div className="hidden md:block bg-gradient-to-br from-[#121B2E] to-[#1B2540] border border-[#232D45] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#0A0F1A] border-b border-[#232D45]">
                  <th className="text-left py-4 px-4 text-sm font-bold text-[#14E8B4] uppercase tracking-wider w-16">Serial</th>
                  <th className="text-left py-4 px-4 text-sm font-bold text-[#14E8B4] uppercase tracking-wider">Customer</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-[#8996AD] uppercase tracking-wider">Contact</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-[#8996AD] uppercase tracking-wider">Package</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-[#8996AD] uppercase tracking-wider">Status</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-[#8996AD] uppercase tracking-wider">Monthly Fee</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-[#8996AD] uppercase tracking-wider">Pending</th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-[#8996AD] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer, index) => (
                  <tr key={customer.id} className="border-b border-[#232D45] hover:bg-[#1B2540]/80 transition-all duration-200">
                    <td className="py-4 px-4 text-sm font-bold text-[#14E8B4]">{(page - 1) * limit + index + 1}</td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-sm font-bold text-[#EAF0FB]">{customer.name}</p>
                        <p className="text-xs text-[#14E8B4]">{customer.username || 'N/A'}</p>
                        <p className="text-xs text-[#8996AD]">{customer.cnic || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-sm text-[#EAF0FB] flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {customer.mobile}
                        </p>
                        <p className="text-xs text-[#8996AD] flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {customer.address || 'N/A'}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-sm text-[#EAF0FB]">{customer.package}</p>
                        <p className="text-xs text-[#8996AD]">{customer.area}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
                        customer.status === 'active' 
                          ? 'bg-[#14E8B4]/20 text-[#14E8B4] border border-[#14E8B4]/30' 
                          : customer.status === 'suspended'
                          ? 'bg-[#F5514B]/20 text-[#F5514B] border border-[#F5514B]/30'
                          : 'bg-[#8996AD]/20 text-[#8996AD] border border-[#8996AD]/30'
                      }`}>
                        {customer.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-[#EAF0FB] font-semibold">Rs. {customer.fee}</td>
                    <td className="py-4 px-4 text-sm text-[#F5514B] font-semibold">Rs. {customer.previous_balance || 0}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/customers/profile/${customer.id}`)}
                          className="p-2 text-[#8996AD] hover:text-[#4C8DFF] hover:bg-[#232D45] rounded-lg transition-all duration-200"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/customers/edit/${customer.id}`)}
                          className="p-2 text-[#8996AD] hover:text-[#F6B93B] hover:bg-[#232D45] rounded-lg transition-all duration-200"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleAddPayment(customer.id)}
                          className="p-2 text-[#8996AD] hover:text-[#14E8B4] hover:bg-[#232D45] rounded-lg transition-all duration-200"
                          title="Add Payment"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>
                        {customer.status === 'active' ? (
                          <button
                            onClick={() => handleStatusChange(customer.id, 'suspended')}
                            className="p-2 text-[#8996AD] hover:text-[#F5514B] hover:bg-[#232D45] rounded-lg transition-all duration-200"
                            title="Suspend"
                          >
                            <PauseCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(customer.id, 'active')}
                            className="p-2 text-[#8996AD] hover:text-[#14E8B4] hover:bg-[#232D45] rounded-lg transition-all duration-200"
                            title="Activate"
                          >
                            <PlayCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(customer.id)}
                          className="p-2 text-[#8996AD] hover:text-[#F5514B] hover:bg-[#232D45] rounded-lg transition-all duration-200"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
            itemName="customers"
          />
        </div>

        {/* Empty State */}
        {customers.length === 0 && (
          <div className="bg-gradient-to-br from-[#121B2E] to-[#1B2540] border border-[#232D45] rounded-xl p-12 text-center">
            <Users className="w-16 h-16 text-[#5C6B85] mx-auto mb-4" />
            <p className="text-xl font-medium text-[#EAF0FB] mb-2">No customers found</p>
            <p className="text-sm text-[#8996AD]">Try adjusting your search criteria or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}

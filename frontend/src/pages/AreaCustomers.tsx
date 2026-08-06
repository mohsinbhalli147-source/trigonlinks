import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, Filter, Users, Phone, Package, DollarSign, ArrowLeft, MapPin } from 'lucide-react';
import { areasApi, customersApi } from '../services/api';

interface AreaCustomer {
  id: string;
  name: string;
  username?: string;
  cnic?: string;
  phone: string;
  address: string;
  package: string;
  monthlyFee: number;
  status: 'active' | 'suspended' | 'pending';
  connectionDate: string;
  lastPayment: string;
  dueAmount: number;
}

interface AreaDetails {
  id: string;
  name: string;
  code: string;
  city: string;
  district: string;
  assignedStaff: string;
}

export default function AreaCustomers() {
  const navigate = useNavigate();
  const { areaId } = useParams();
  const [area, setArea] = useState<AreaDetails | null>(null);
  const [customers, setCustomers] = useState<AreaCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended' | 'pending'>('all');
  const [areaList, setAreaList] = useState<any[]>([]);
  const [listLoading, setListLoading] = useState(false);

  useEffect(() => {
    if (areaId) {
      loadData();
    } else {
      loadAreaList();
    }
  }, [areaId]);

  const loadAreaList = async () => {
    setListLoading(true);
    setError('');
    const result = await areasApi.getAll();
    if (result.success) {
      setAreaList(result.data?.data || []);
    } else {
      setError(result.error || 'Failed to load areas');
    }
    setListLoading(false);
    setLoading(false);
  };

  const loadData = async () => {
    setLoading(true);
    setError('');

    // Load area details
    let currentAreaName = '';
    if (areaId) {
      const areaResult = await areasApi.getById(areaId);
      if (areaResult.success) {
        setArea(areaResult.data);
        currentAreaName = areaResult.data?.name || '';
      }
    }

    // Load customers filtered by area to avoid fetching all customers
    const customersResult = await customersApi.getAll({ area: areaId, page: '1', limit: '100' });
    let dataArray: any[] = Array.isArray(customersResult.data)
      ? customersResult.data
      : (customersResult.data?.data || []);

    if (dataArray.length === 0 && currentAreaName) {
      const fallbackResult = await customersApi.getAll({ area: currentAreaName, page: '1', limit: '100' });
      if (fallbackResult.success) {
        dataArray = Array.isArray(fallbackResult.data)
          ? fallbackResult.data
          : (fallbackResult.data?.data || []);
      }
    }

    if (customersResult.success || dataArray.length > 0) {
      const areaCustomers = dataArray.map((c: any) => ({
        id: c.id,
        name: c.name,
        username: c.username || '',
        cnic: c.cnic || '',
        phone: c.phone || c.mobile || '',
        address: c.address || '',
        package: c.package || '',
        monthlyFee: c.monthlyFee || c.fee || 0,
        status: c.status || 'active',
        connectionDate: c.connectionDate || c.installDate || '',
        lastPayment: c.lastPaymentDate || '-',
        dueAmount: c.dueAmount || 0,
      }));
      setCustomers(areaCustomers);
    } else {
      setError(customersResult.error || 'Failed to load customers');
    }

    setLoading(false);
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm) ||
                         customer.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || customer.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-[#14E8B4]/20 text-[#14E8B4]';
      case 'suspended': return 'bg-[#F5514B]/20 text-[#F5514B]';
      case 'pending': return 'bg-[#F6B93B]/20 text-[#F6B93B]';
      default: return 'bg-[#8996AD]/20 text-[#8996AD]';
    }
  };

  const activeCustomers = customers.filter(c => c.status === 'active').length;
  const totalMonthlyRevenue = customers.filter(c => c.status === 'active').reduce((sum, c) => sum + c.monthlyFee, 0);
  const totalDueAmount = customers.reduce((sum, c) => sum + c.dueAmount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8996AD]">Loading customers...</div>
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

  if (!areaId) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#EAF0FB]">Select Area</h2>
          <p className="text-sm text-[#8996AD]">Select an area to view its customers</p>
        </div>

        {listLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-[#8996AD]">Loading areas...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {areaList.map((a) => (
              <div
                key={a.id}
                onClick={() => navigate(`/areas/customers/${a.id}`)}
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
                  <span>District: {a.district || a.province || ''}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/areas/all')}
            className="p-2 bg-[#232D45] text-[#8996AD] rounded-lg hover:text-[#EAF0FB] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-[#EAF0FB]">Area Customers</h2>
            {area && (
              <p className="text-sm text-[#8996AD]">
                {area.name} ({area.code}) • {area.city}, {area.district}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-[#4C8DFF]" />
            <p className="text-sm text-[#8996AD]">Total Customers</p>
          </div>
          <p className="text-2xl font-bold text-[#EAF0FB]">{customers.length}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-[#14E8B4]" />
            <p className="text-sm text-[#8996AD]">Active</p>
          </div>
          <p className="text-2xl font-bold text-[#14E8B4]">{activeCustomers}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-[#F6B93B]" />
            <p className="text-sm text-[#8996AD]">Monthly Revenue</p>
          </div>
          <p className="text-2xl font-bold text-[#F6B93B]">Rs. {totalMonthlyRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-[#F5514B]" />
            <p className="text-sm text-[#8996AD]">Total Due</p>
          </div>
          <p className="text-2xl font-bold text-[#F5514B]">Rs. {totalDueAmount.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#5C6B85]" />
            <input
              type="text"
              placeholder="Search by name, phone, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#5C6B85]" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Customers Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#232D45]">
                <th className="text-left py-3 px-4 text-sm font-bold text-[#14E8B4]">Username</th>
                <th className="text-left py-3 px-4 text-sm font-bold text-[#14E8B4]">CNIC</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Customer</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Address</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Package</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Monthly Fee</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Connection Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Last Payment</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Due Amount</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="border-b border-[#232D45] hover:bg-[#1B2540]/50">
                  <td className="py-3 px-4 text-sm font-bold text-[#14E8B4]">{customer.username || 'N/A'}</td>
                  <td className="py-3 px-4 text-sm font-bold text-[#14E8B4]">{customer.cnic || 'N/A'}</td>
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-semibold text-[#EAF0FB]">{customer.name}</div>
                      <div className="text-sm text-[#8996AD] flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {customer.phone}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-[#8996AD]">{customer.address}</td>
                  <td className="py-3 px-4 text-sm text-[#8996AD] flex items-center gap-1">
                    <Package className="w-4 h-4" />
                    {customer.package}
                  </td>
                  <td className="py-3 px-4 text-sm text-[#EAF0FB]">Rs. {customer.monthlyFee.toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm text-[#8996AD]">{customer.connectionDate}</td>
                  <td className="py-3 px-4 text-sm text-[#8996AD]">{customer.lastPayment}</td>
                  <td className="py-3 px-4 text-sm text-[#F5514B] font-semibold">Rs. {customer.dueAmount.toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                      {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-[#5C6B85]">
                    No customers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-sm text-[#5C6B85]">
          Showing {filteredCustomers.length} of {customers.length} customers
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import { customersApi } from '../services/api';
import { toast } from '../components/Toast';

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
  status: 'active' | 'suspended';
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

export default function CustomersActive() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    setError('');
    const result = await customersApi.getAll({ status: 'active', limit: 100 });
    if (result.success) {
      setCustomers(result.data?.data || []);
    } else {
      setError(result.error || 'Failed to load customers');
    }
    setLoading(false);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.mobile?.includes(searchTerm) ||
    (customer.cnic && customer.cnic.includes(searchTerm)) ||
    (customer.address && customer.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (customer.live_ip_address && customer.live_ip_address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      const result = await customersApi.delete(id);
      if (result.success) {
        loadCustomers();
      } else {
        toast.error(result.error || 'Failed to delete customer');
      }
    }
  };

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[#EAF0FB]">Active Users</h2>
        <button
          onClick={() => navigate('/customers/add')}
          className="flex items-center gap-2 px-4 py-2 bg-[#14E8B4] text-[#04231B] font-semibold rounded-lg hover:bg-[#20F0C0] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#5C6B85]" />
          <input
            type="text"
            placeholder="Search by name, mobile, CNIC, address, IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#232D45]">
                <th className="text-left py-3 px-2 text-sm font-bold text-[#14E8B4]">Username</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-[#8996AD]">Name</th>
                <th className="text-left py-3 px-2 text-sm font-bold text-[#14E8B4]">CNIC</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-[#8996AD]">Mobile</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-[#8996AD]">Package</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-[#8996AD]">Area</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-[#8996AD]">Monthly Fee</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-[#8996AD]">IPTV</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-[#8996AD]">Live IP</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-[#8996AD]">Pending</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-[#8996AD]">Conn. Date</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-[#8996AD]">Bill. Date</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-[#8996AD]">Address</th>
                <th className="text-right py-3 px-2 text-sm font-medium text-[#8996AD]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="border-b border-[#232D45] hover:bg-[#1B2540]/50">
                  <td className="py-3 px-2 text-sm font-bold text-[#14E8B4]">{customer.username || 'N/A'}</td>
                  <td className="py-3 px-2 text-sm text-[#EAF0FB]">{customer.name}</td>
                  <td className="py-3 px-2 text-sm font-bold text-[#14E8B4]">{customer.cnic || 'N/A'}</td>
                  <td className="py-3 px-2 text-sm text-[#8996AD]">{customer.mobile}</td>
                  <td className="py-3 px-2 text-sm text-[#EAF0FB]">{customer.package}</td>
                  <td className="py-3 px-2 text-sm text-[#8996AD]">{customer.area}</td>
                  <td className="py-3 px-2 text-sm text-[#EAF0FB]">Rs. {customer.fee}</td>
                  <td className="py-3 px-2 text-sm text-[#8996AD]">{customer.iptv_enabled ? `Rs. ${customer.iptv_monthly_charges}` : 'N/A'}</td>
                  <td className="py-3 px-2 text-sm text-[#8996AD]">{customer.live_ip_enabled ? customer.live_ip_address : 'N/A'}</td>
                  <td className="py-3 px-2 text-sm text-[#F5514B]">Rs. {customer.previous_balance || 0}</td>
                  <td className="py-3 px-2 text-sm text-[#8996AD]">{customer.install_date ? new Date(customer.install_date).toLocaleDateString() : 'N/A'}</td>
                  <td className="py-3 px-2 text-sm text-[#8996AD]">{customer.billing_date ? new Date(customer.billing_date).toLocaleDateString() : 'N/A'}</td>
                  <td className="py-3 px-2 text-sm text-[#8996AD] max-w-[200px] truncate">{customer.address || 'N/A'}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => navigate(`/customers/profile/${customer.id}`)}
                        className="p-2 text-[#8996AD] hover:text-[#EAF0FB] hover:bg-[#232D45] rounded-lg transition-colors"
                        title="View Profile"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(customer.id)}
                        className="p-2 text-[#8996AD] hover:text-[#F5514B] hover:bg-[#232D45] rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={14} className="py-8 text-center text-[#5C6B85]">
                    No active customers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-sm text-[#5C6B85]">
          Showing {filteredCustomers.length} active customers
        </div>
      </div>
    </div>
  );
}

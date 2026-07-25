import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, Filter } from 'lucide-react';
import { newCustomersApi } from '../services/api';
import { toast } from '../components/Toast';

interface NewCustomer {
  id: string;
  customer_name: string;
  area: string;
  package: string;
  status: 'pending' | 'approved' | 'rejected' | 'in-progress' | 'completed' | 'on-hold' | 'inactive';
  installation_date: number | null;
  notes: string;
  created_at: number;
}

export default function NewCustomersAll() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<NewCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'in-progress' | 'completed' | 'on-hold' | 'inactive'>('all');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await newCustomersApi.getAll();
      console.log('New customers API result:', result);
      if (result.success) {
        // Handle paginated response structure
        const customersData = result.data?.data || result.data || [];
        setCustomers(Array.isArray(customersData) ? customersData : []);
      } else {
        setError(result.error || 'Failed to load new customers');
        setCustomers([]);
      }
    } catch (err) {
      console.error('Error loading customers:', err);
      setError('Failed to load new customers');
      setCustomers([]);
    }
    setLoading(false);
  };

  const filteredCustomers = (customers || []).filter(customer => {
    if (!customer) return false;
    const matchesSearch = (customer.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (customer.area || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || customer.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this new customer?')) {
      const result = await newCustomersApi.delete(id);
      if (result.success) {
        loadCustomers();
      } else {
        toast.error(result.error || 'Failed to delete new customer');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-[#F6B93B]/10 text-[#F6B93B]';
      case 'approved': return 'bg-[#4C8DFF]/10 text-[#4C8DFF]';
      case 'completed': return 'bg-[#14E8B4]/10 text-[#14E8B4]';
      case 'rejected': return 'bg-[#F5514B]/10 text-[#F5514B]';
      case 'in-progress': return 'bg-[#8996AD]/10 text-[#8996AD]';
      case 'on-hold': return 'bg-[#F6B93B]/10 text-[#F6B93B]';
      case 'inactive': return 'bg-[#5C6B85]/10 text-[#5C6B85]';
      default: return 'bg-[#5C6B85]/10 text-[#5C6B85]';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8996AD]">Loading new customers...</div>
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
        <h2 className="text-xl font-semibold text-[#EAF0FB]">All New Customers</h2>
        <button
          onClick={() => navigate('/new-customers/add')}
          className="flex items-center gap-2 px-4 py-2 bg-[#14E8B4] text-[#04231B] font-semibold rounded-lg hover:bg-[#20F0C0] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add New Customer
        </button>
      </div>

      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#5C6B85]" />
            <input
              type="text"
              placeholder="Search by name or mobile..."
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
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#232D45]">
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Customer Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Area</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Package</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Installation Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Status</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-[#8996AD]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="border-b border-[#232D45] hover:bg-[#1B2540]/50">
                  <td className="py-3 px-4 text-sm text-[#EAF0FB]">{customer.customer_name}</td>
                  <td className="py-3 px-4 text-sm text-[#8996AD]">{customer.area}</td>
                  <td className="py-3 px-4 text-sm text-[#EAF0FB]">{customer.package}</td>
                  <td className="py-3 px-4 text-sm text-[#8996AD]">
                    {customer.installation_date ? new Date(customer.installation_date).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-[#8996AD] hover:text-[#EAF0FB] hover:bg-[#232D45] rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(customer.id)}
                        className="p-2 text-[#8996AD] hover:text-[#F5514B] hover:bg-[#232D45] rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#5C6B85]">
                    No new customers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-sm text-[#5C6B85]">
          Showing {filteredCustomers.length} of {customers.length} new customers
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import { customersApi } from '../services/api';
import { toast } from '../components/Toast';

interface Customer {
  id: string;
  name: string;
  mobile: string;
  fee: number;
  status: 'active' | 'suspended';
  package: string;
  area: string;
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
    const result = await customersApi.getAll({ status: 'active', limit: 200 });
    if (result.success) {
      setCustomers(result.data?.data || []);
    } else {
      setError(result.error || 'Failed to load customers');
    }
    setLoading(false);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.mobile?.includes(searchTerm)
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
            placeholder="Search by name or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#232D45]">
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Mobile</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Package</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Area</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Fee</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-[#8996AD]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="border-b border-[#232D45] hover:bg-[#1B2540]/50">
                  <td className="py-3 px-4 text-sm text-[#EAF0FB]">{customer.name}</td>
                  <td className="py-3 px-4 text-sm text-[#8996AD]">{customer.mobile}</td>
                  <td className="py-3 px-4 text-sm text-[#EAF0FB]">{customer.package}</td>
                  <td className="py-3 px-4 text-sm text-[#8996AD]">{customer.area}</td>
                  <td className="py-3 px-4 text-sm text-[#EAF0FB]">Rs. {customer.fee}</td>
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

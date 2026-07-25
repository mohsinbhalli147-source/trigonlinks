import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, Download, Printer, Filter } from 'lucide-react';
import { invoicesApi } from '../services/api';
import { toast } from '../components/Toast';

interface Bill {
  id: string;
  customerId: string;
  customerName: string;
  invoiceNumber?: string;
  month?: string;
  year?: string;
  amount: number;
  totalAmount?: number;
  paidAmount?: number;
  status: 'paid' | 'pending' | 'overdue' | 'unpaid' | 'partial';
  dueDate: string | number;
  createdAt: number;
}

export default function Billing() {
  const navigate = useNavigate();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');

  useEffect(() => {
    loadBills();
  }, []);

  const loadBills = async () => {
    setLoading(true);
    setError('');
    const result = await invoicesApi.getAll({ page: '1', limit: '100' });
    if (result.success) {
      setBills(result.data?.data || result.data || []);
    } else {
      setError(result.error || 'Failed to load bills');
    }
    setLoading(false);
  };

  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bill.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || bill.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this bill?')) {
      const result = await invoicesApi.delete(id);
      if (result.success) {
        loadBills();
      } else {
        toast.error(result.error || 'Failed to delete bill');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-[#14E8B4]/10 text-[#14E8B4]';
      case 'pending': return 'bg-[#F6B93B]/10 text-[#F6B93B]';
      case 'overdue': return 'bg-[#F5514B]/10 text-[#F5514B]';
      default: return 'bg-[#5C6B85]/10 text-[#5C6B85]';
    }
  };

  const totalAmount = bills.reduce((sum, bill) => sum + (bill.totalAmount || bill.amount || 0), 0);
  const paidAmount = bills.filter(b => b.status === 'paid').reduce((sum, bill) => sum + (bill.paidAmount || bill.amount || 0), 0);
  const pendingAmount = bills.filter(b => b.status === 'pending' || b.status === 'unpaid').reduce((sum, bill) => sum + (bill.totalAmount || bill.amount || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8996AD]">Loading bills...</div>
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
        <h2 className="text-xl font-semibold text-[#EAF0FB]">Billing</h2>
        <button
          onClick={() => navigate('/billing/add')}
          className="flex items-center gap-2 px-4 py-2 bg-[#14E8B4] text-[#04231B] font-semibold rounded-lg hover:bg-[#20F0C0] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Generate Bill
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <p className="text-sm text-[#8996AD] mb-2">Total Billed</p>
          <p className="text-2xl font-bold text-[#EAF0FB]">Rs. {totalAmount.toLocaleString()}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <p className="text-sm text-[#8996AD] mb-2">Paid</p>
          <p className="text-2xl font-bold text-[#14E8B4]">Rs. {paidAmount.toLocaleString()}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <p className="text-sm text-[#8996AD] mb-2">Pending</p>
          <p className="text-2xl font-bold text-[#F6B93B]">Rs. {pendingAmount.toLocaleString()}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <p className="text-sm text-[#8996AD] mb-2">Overdue</p>
          <p className="text-2xl font-bold text-[#F5514B]">Rs. {bills.filter(b => b.status === 'overdue').reduce((sum, bill) => sum + (bill.totalAmount || bill.amount || 0), 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#5C6B85]" />
            <input
              type="text"
              placeholder="Search by customer or month..."
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
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="unpaid">Unpaid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#232D45]">
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Customer</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Month</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Year</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Due Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Status</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-[#8996AD]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.map((bill) => (
                <tr key={bill.id} className="border-b border-[#232D45] hover:bg-[#1B2540]/50">
                  <td className="py-3 px-4 text-sm text-[#EAF0FB]">{bill.customerName}</td>
                  <td className="py-3 px-4 text-sm text-[#8996AD]">{bill.invoiceNumber || bill.month || 'N/A'}</td>
                  <td className="py-3 px-4 text-sm text-[#8996AD]">{bill.year || new Date(bill.createdAt).getFullYear()}</td>
                  <td className="py-3 px-4 text-sm text-[#EAF0FB]">Rs. {(bill.totalAmount || bill.amount || 0).toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm text-[#8996AD]">{bill.dueDate ? (typeof bill.dueDate === 'string' ? bill.dueDate : new Date(bill.dueDate).toLocaleDateString()) : 'N/A'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bill.status)}`}>
                      {bill.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-[#8996AD] hover:text-[#EAF0FB] hover:bg-[#232D45] rounded-lg transition-colors" title="Download">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-[#8996AD] hover:text-[#EAF0FB] hover:bg-[#232D45] rounded-lg transition-colors" title="Print">
                        <Printer className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-[#8996AD] hover:text-[#EAF0FB] hover:bg-[#232D45] rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(bill.id)}
                        className="p-2 text-[#8996AD] hover:text-[#F5514B] hover:bg-[#232D45] rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredBills.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#5C6B85]">
                    No bills found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-sm text-[#5C6B85]">
          Showing {filteredBills.length} of {bills.length} bills
        </div>
      </div>
    </div>
  );
}

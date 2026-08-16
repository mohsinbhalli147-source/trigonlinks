import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, Calendar, DollarSign, CheckCircle, User, Package, Filter, Download } from 'lucide-react';
import { invoicesApi } from '../services/api';
import { useServerPagination } from '../hooks/useServerPagination';
import { Pagination } from '../components/Pagination';

interface Payment {
  id: string;
  customerName: string;
  customerPhone: string;
  package: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  invoiceNumber: string;
}

export default function BillingPaid() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const fetchInvoices = useCallback(({ page, limit }: { page: number; limit: number }) => {
    return invoicesApi.getAll({ status: 'paid', page, limit, sortBy: 'createdAt', sortOrder: 'desc' });
  }, []);

  const {
    data: rawInvoices,
    loading,
    error,
    page,
    limit,
    total,
    totalPages,
    setPage,
    setLimit,
    refresh,
  } = useServerPagination<any>(fetchInvoices, { limit: 50 });

  const payments: Payment[] = (rawInvoices || []).map((inv: any) => ({
    id: inv.id,
    customerName: inv.customerName || '',
    customerPhone: inv.customerPhone || inv.mobile || '',
    package: inv.package || '',
    amount: inv.paidAmount || inv.amount || 0,
    paymentMethod: inv.paymentMethod || 'Cash',
    paymentDate: inv.paidDate || inv.updatedAt
      ? new Date(inv.paidDate || inv.updatedAt).toLocaleDateString()
      : '',
    invoiceNumber: inv.id.slice(0, 8).toUpperCase(),
  }));

  const filteredPayments = payments.filter(payment =>
    payment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.customerPhone.includes(searchTerm) ||
    payment.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  const handleView = (id: string) => {
    navigate(`/customers/profile/${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8996AD]">Loading payments...</div>
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
        <h2 className="text-2xl font-bold text-[#EAF0FB]">Paid Users</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#8996AD]" />
          <input
            type="text"
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-[#14E8B4]" />
            <div>
              <div className="text-2xl font-bold text-[#EAF0FB]">{payments.length}</div>
              <div className="text-sm text-[#8996AD]">Total Payments</div>
            </div>
          </div>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-[#14E8B4]" />
            <div>
              <div className="text-2xl font-bold text-[#EAF0FB]">Rs. {totalCollected.toLocaleString()}</div>
              <div className="text-sm text-[#8996AD]">Total Collected</div>
            </div>
          </div>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-[#4C8DFF]" />
            <div>
              <div className="text-2xl font-bold text-[#EAF0FB]">This Month</div>
              <div className="text-sm text-[#8996AD]">July 2024</div>
            </div>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#232D45]">
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Invoice #</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Customer</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Package</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Method</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Payment Date</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-[#8996AD]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="border-b border-[#232D45] hover:bg-[#1B2540]/50">
                  <td className="py-4 px-4 text-sm text-[#EAF0FB] font-medium">{payment.invoiceNumber}</td>
                  <td className="py-4 px-4">
                    <div className="text-sm text-[#EAF0FB] font-medium">{payment.customerName}</div>
                    <div className="text-xs text-[#8996AD]">{payment.customerPhone}</div>
                  </td>
                  <td className="py-4 px-4 text-sm text-[#8996AD]">{payment.package}</td>
                  <td className="py-4 px-4 text-sm text-[#14E8B4] font-medium">Rs. {payment.amount}</td>
                  <td className="py-4 px-4 text-sm text-[#8996AD]">{payment.paymentMethod}</td>
                  <td className="py-4 px-4 text-sm text-[#8996AD]">{payment.paymentDate}</td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleView(payment.id)}
                        className="p-2 text-[#8996AD] hover:text-[#EAF0FB] hover:bg-[#232D45] rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-[#8996AD] hover:text-[#EAF0FB] hover:bg-[#232D45] rounded-lg transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(l) => { setLimit(l); setPage(1); }}
          itemName="payments"
        />
      </div>
    </div>
  );
}

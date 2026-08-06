import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Download, Eye, Calendar, CheckCircle, Clock, AlertCircle, Printer, Receipt } from 'lucide-react';
import { invoicesApi } from '../services/api';
import { toast } from '../components/Toast';

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  package: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'unpaid' | 'overdue';
  generatedDate: string;
}

export default function BillingInvoices() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid' | 'overdue'>('all');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const LIMIT = 100;

  useEffect(() => {
    loadInvoices();
  }, [filterStatus, page]);

  const loadInvoices = async () => {
    setLoading(true);
    setError('');
    const result = await invoicesApi.getAll({
      limit: LIMIT,
      page,
      ...(filterStatus !== 'all' && { status: filterStatus }),
    });
    if (result.success) {
      setInvoices(result.data?.data || []);
      setTotal(result.data?.pagination?.total || 0);
    } else {
      setError(result.error || 'Failed to load invoices');
    }
    setLoading(false);
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = !searchTerm || 
      invoice.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-[#14E8B4]/20 text-[#14E8B4]';
      case 'unpaid': return 'bg-[#F6B93B]/20 text-[#F6B93B]';
      case 'overdue': return 'bg-[#F5514B]/20 text-[#F5514B]';
      default: return 'bg-[#8996AD]/20 text-[#8996AD]';
    }
  };

  const handleView = (id: string) => {
    navigate(`/billing/invoice/${id}`);
  };

  const handlePrint = (id: string) => {
    navigate(`/billing/invoice/${id}`);
  };

  const handleDownload = async (id: string) => {
    try {
      const response = await invoicesApi.getById(id);
      if (response.success && response.data) {
        const invoice = response.data;
        const content = `
          INVOICE #${invoice.invoiceNumber}
          ========================
          Customer: ${invoice.customerName}
          Phone: ${invoice.customerPhone}
          Package: ${invoice.package}
          Amount: Rs. ${invoice.amount}
          Status: ${invoice.status}
          Due Date: ${invoice.dueDate}
        `;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoice.invoiceNumber}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Invoice downloaded successfully');
      }
    } catch (error) {
      toast.error('Failed to download invoice');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8996AD]">Loading invoices...</div>
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
        <h2 className="text-2xl font-bold text-[#EAF0FB]">All Invoices</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#8996AD]" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Stats - use total from server */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Receipt className="w-8 h-8 text-[#4C8DFF]" />
            <div>
              <div className="text-2xl font-bold text-[#EAF0FB]">{total}</div>
              <div className="text-sm text-[#8996AD]">Total Invoices</div>
            </div>
          </div>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-[#14E8B4]" />
            <div>
              <div className="text-2xl font-bold text-[#EAF0FB]">{invoices.filter(i => i.status === 'paid').length}</div>
              <div className="text-sm text-[#8996AD]">Paid</div>
            </div>
          </div>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-[#F6B93B]" />
            <div>
              <div className="text-2xl font-bold text-[#EAF0FB]">{invoices.filter(i => i.status === 'unpaid').length}</div>
              <div className="text-sm text-[#8996AD]">Unpaid</div>
            </div>
          </div>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-[#F5514B]" />
            <div>
              <div className="text-2xl font-bold text-[#EAF0FB]">{invoices.filter(i => i.status === 'overdue').length}</div>
              <div className="text-sm text-[#8996AD]">Overdue</div>
            </div>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#232D45]">
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Invoice #</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Customer</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Package</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Due Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Status</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-[#8996AD]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-[#232D45] hover:bg-[#1B2540]/50">
                  <td className="py-4 px-4 text-sm text-[#EAF0FB] font-medium">{invoice.invoiceNumber}</td>
                  <td className="py-4 px-4">
                    <div className="text-sm text-[#EAF0FB] font-medium">{invoice.customerName}</div>
                    <div className="text-xs text-[#8996AD]">{invoice.customerPhone}</div>
                  </td>
                  <td className="py-4 px-4 text-sm text-[#8996AD]">{invoice.package}</td>
                  <td className="py-4 px-4 text-sm text-[#14E8B4] font-medium">Rs. {invoice.amount}</td>
                  <td className="py-4 px-4 text-sm text-[#8996AD]">{invoice.dueDate}</td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleView(invoice.id)}
                        className="p-2 text-[#8996AD] hover:text-[#EAF0FB] hover:bg-[#232D45] rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handlePrint(invoice.id)}
                        className="p-2 text-[#8996AD] hover:text-[#EAF0FB] hover:bg-[#232D45] rounded-lg transition-colors"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(invoice.id)}
                        className="p-2 text-[#8996AD] hover:text-[#EAF0FB] hover:bg-[#232D45] rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
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

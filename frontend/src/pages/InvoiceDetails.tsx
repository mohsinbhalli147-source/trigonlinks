import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Printer, FileText, DollarSign, Calendar, User, MapPin, Package, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { invoicesApi } from '../services/api';

interface Invoice {
  id: string;
  customer_id: string;
  customer_name: string;
  package: string;
  amount: number;
  paid_amount: number;
  remaining_balance: number;
  discount_amount: number;
  status: 'paid' | 'unpaid' | 'partial' | 'overdue';
  due_date: number;
  last_payment_date: number;
  last_payment_amount: number;
  collected_by: string;
  created_at: number;
  updated_at: number;
  created_by: string;
  notes?: string;
}

export default function InvoiceDetails() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadInvoice();
  }, [id]);

  const loadInvoice = async () => {
    if (!id) return;
    setLoading(true);
    const result = await invoicesApi.getById(id);
    if (result.success && result.data) {
      setInvoice(result.data);
    } else {
      setError(result.error || 'Failed to load invoice');
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-[#14E8B4]/10 text-[#14E8B4]';
      case 'partial': return 'bg-[#4C8DFF]/10 text-[#4C8DFF]';
      case 'unpaid': return 'bg-[#F6B93B]/10 text-[#F6B93B]';
      case 'overdue': return 'bg-[#F5514B]/10 text-[#F5514B]';
      default: return 'bg-[#5C6B85]/10 text-[#5C6B85]';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-5 h-5" />;
      case 'partial': return <Clock className="w-5 h-5" />;
      case 'unpaid': return <AlertCircle className="w-5 h-5" />;
      case 'overdue': return <AlertCircle className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Generate PDF download
    const content = `
INVOICE #${invoice?.id}
Customer: ${invoice?.customer_name}
Package: ${invoice?.package}
Amount: Rs. ${invoice?.amount?.toFixed(2)}
Paid: Rs. ${invoice?.paid_amount?.toFixed(2)}
Remaining: Rs. ${invoice?.remaining_balance?.toFixed(2)}
Status: ${invoice?.status}
Due Date: ${invoice?.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}
    `;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice_${invoice?.id}.txt`;
    a.click();
  };

  if (loading) {
    return (
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="text-center text-[#8996AD]">Loading invoice details...</div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="text-center text-[#F5514B]">{error || 'Invoice not found'}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-[#232D45] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#8996AD]" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#EAF0FB]">Invoice Details</h1>
            <p className="text-sm text-[#5C6B85]">Invoice #{invoice.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-[#232D45] hover:bg-[#2A3657] text-[#EAF0FB] rounded-lg transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-[#14E8B4] hover:bg-[#20F0C0] text-[#04231B] font-semibold rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>

      {/* Invoice Card */}
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        {/* Status Badge */}
        <div className="flex items-center justify-between mb-6">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${getStatusColor(invoice.status)}`}>
            {getStatusIcon(invoice.status)}
            <span className="font-medium capitalize">{invoice.status}</span>
          </div>
          <div className="text-sm text-[#5C6B85]">
            Created: {new Date(invoice.created_at).toLocaleDateString()}
          </div>
        </div>

        {/* Customer Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#14E8B4]">Customer Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-[#8996AD]" />
                <div>
                  <p className="text-sm text-[#5C6B85]">Customer Name</p>
                  <p className="text-[#EAF0FB]">{invoice.customer_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-[#8996AD]" />
                <div>
                  <p className="text-sm text-[#5C6B85]">Package</p>
                  <p className="text-[#EAF0FB]">{invoice.package}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#14E8B4]">Payment Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-[#8996AD]" />
                <div>
                  <p className="text-sm text-[#5C6B85]">Total Amount</p>
                  <p className="text-[#EAF0FB] font-semibold">Rs. {invoice.amount.toFixed(2)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-[#8996AD]" />
                <div>
                  <p className="text-sm text-[#5C6B85]">Paid Amount</p>
                  <p className="text-[#14E8B4] font-semibold">Rs. {invoice.paid_amount.toFixed(2)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-[#8996AD]" />
                <div>
                  <p className="text-sm text-[#5C6B85]">Remaining Balance</p>
                  <p className={invoice.remaining_balance > 0 ? "text-[#F5514B] font-semibold" : "text-[#14E8B4] font-semibold"}>
                    Rs. {invoice.remaining_balance.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-[#8996AD]" />
            <div>
              <p className="text-sm text-[#5C6B85]">Due Date</p>
              <p className="text-[#EAF0FB]">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>
          {invoice.last_payment_date && (
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-[#8996AD]" />
              <div>
                <p className="text-sm text-[#5C6B85]">Last Payment Date</p>
                <p className="text-[#EAF0FB]">{new Date(invoice.last_payment_date).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </div>

        {/* Discount */}
        {invoice.discount_amount > 0 && (
          <div className="bg-[#14E8B4]/10 border border-[#14E8B4]/20 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-[#14E8B4] font-medium">Discount Applied</span>
              <span className="text-[#14E8B4] font-semibold">Rs. {invoice.discount_amount.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div className="bg-[#232D45]/50 rounded-lg p-4">
            <p className="text-sm text-[#5C6B85] mb-2">Notes</p>
            <p className="text-[#EAF0FB]">{invoice.notes}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {invoice.status !== 'paid' && invoice.remaining_balance > 0 && (
        <div className="flex gap-4">
          <button
            onClick={() => navigate(`/billing/receive/${invoice.id}`)}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#14E8B4] hover:bg-[#20F0C0] text-[#04231B] font-semibold rounded-lg transition-colors"
          >
            <DollarSign className="w-5 h-5" />
            Record Payment
          </button>
        </div>
      )}
    </div>
  );
}

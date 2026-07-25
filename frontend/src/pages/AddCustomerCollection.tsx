import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Calendar, User, Package, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { customersApi, invoicesApi } from '../services/api';

interface Customer {
  id: string;
  name: string;
  mobile: string;
  area: string;
  package: string;
}

interface Invoice {
  id: string;
  customer_id: string;
  customer_name: string;
  package: string;
  amount: number;
  paid_amount: number;
  remaining_balance: number;
  status: string;
}

export default function AddCustomerCollection() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    amount: 0,
    payment_method: 'cash',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadCustomers();
    loadInvoices();
  }, []);

  const loadCustomers = async () => {
    const result = await customersApi.getAll({ limit: 100 });
    if (result.success && result.data?.data) {
      setCustomers(result.data.data);
    }
  };

  const loadInvoices = async () => {
    const result = await invoicesApi.getAll({ limit: 100, status: 'unpaid,partial,overdue' });
    if (result.success && result.data?.data) {
      setInvoices(result.data.data);
    }
    setLoading(false);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.mobile.includes(searchTerm)
  );

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    const customerInvoices = invoices.filter(inv => inv.customer_id === customer.id && inv.remaining_balance > 0);
    if (customerInvoices.length > 0) {
      setSelectedInvoice(customerInvoices[0]);
      setFormData({
        ...formData,
        amount: customerInvoices[0].remaining_balance
      });
    }
  };

  const handleInvoiceSelect = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setFormData({
      ...formData,
      amount: invoice.remaining_balance
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) {
      setError('Please select an invoice');
      return;
    }

    setSubmitting(true);
    setError('');

    const paymentData = {
      invoice_id: selectedInvoice.id,
      amount: formData.amount,
      payment_method: formData.payment_method,
      notes: formData.notes,
      collected_by: 'current_user' // This should come from auth context
    };

    const result = await invoicesApi.recordPayment(selectedInvoice.id, paymentData);
    if (result.success) {
      navigate('/new-customers/collections');
    } else {
      setError(result.error || 'Failed to record payment');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="text-center text-[#8996AD]">Loading data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#EAF0FB]">Add Customer Collection</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Selection */}
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[#14E8B4] mb-4">Select Customer</h2>
          
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by name or mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
            />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                onClick={() => handleCustomerSelect(customer)}
                className={`p-4 rounded-lg cursor-pointer transition-colors ${
                  selectedCustomer?.id === customer.id
                    ? 'bg-[#14E8B4]/20 border border-[#14E8B4]'
                    : 'bg-[#1B2540] border border-[#232D45] hover:bg-[#232D45]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[#EAF0FB]">{customer.name}</p>
                    <p className="text-sm text-[#5C6B85]">{customer.mobile}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[#8996AD]">{customer.area}</p>
                    <p className="text-sm text-[#14E8B4]">{customer.package}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Collection Form */}
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[#14E8B4] mb-4">Collection Details</h2>

          {selectedCustomer ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Customer Info */}
              <div className="bg-[#1B2540] rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-[#8996AD]" />
                  <div>
                    <p className="text-sm text-[#5C6B85]">Selected Customer</p>
                    <p className="text-[#EAF0FB]">{selectedCustomer.name}</p>
                  </div>
                </div>
              </div>

              {/* Invoice Selection */}
              {selectedCustomer && (
                <div>
                  <label className="block text-sm font-medium text-[#8996AD] mb-2">Select Invoice</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {invoices.filter(inv => inv.customer_id === selectedCustomer.id && inv.remaining_balance > 0).map((invoice) => (
                      <div
                        key={invoice.id}
                        onClick={() => handleInvoiceSelect(invoice)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedInvoice?.id === invoice.id
                            ? 'bg-[#14E8B4]/20 border border-[#14E8B4]'
                            : 'bg-[#1B2540] border border-[#232D45] hover:bg-[#232D45]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-[#EAF0FB]">{invoice.package}</p>
                            <p className="text-xs text-[#5C6B85]">Total: Rs. {invoice.amount.toFixed(2)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-[#F5514B]">Due: Rs. {invoice.remaining_balance.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">Amount (Rs)</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                  max={selectedInvoice?.remaining_balance}
                  className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                  required
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">Payment Method</label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                  className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="online">Online Payment</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                  required
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-[#F5514B]/10 border border-[#F5514B] rounded-lg text-[#F5514B] text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#14E8B4] hover:bg-[#20F0C0] text-[#04231B] font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-5 h-5" />
                {submitting ? 'Recording...' : 'Record Payment'}
              </button>
            </form>
          ) : (
            <div className="text-center py-12 text-[#5C6B85]">
              <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a customer to record payment</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

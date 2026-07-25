import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, DollarSign, CreditCard, Package, CheckCircle, AlertCircle, Receipt } from 'lucide-react';
import { customersApi, billingApi } from '../services/api';
import { toast } from '../components/Toast';

interface Customer {
  id: string;
  name: string;
  mobile: string;
  package: string;
  fee: number;
  billingDate: number;
  status: string;
}

export default function BillingReceive() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const customerId = searchParams.get('customerId');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0] || '');
  const [notes, setNotes] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [discountReason, setDiscountReason] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (customerId && customers.length > 0) {
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        setSelectedCustomer(customer);
        setPaymentAmount(customer.fee?.toString() || '');
      }
    }
  }, [customerId, customers]);

  const loadCustomers = async () => {
    setLoading(true);
    setError('');
    const result = await customersApi.getAll({ limit: 200 });
    if (result.success) {
      setCustomers(result.data?.data || result.data || []);
    } else {
      setError(result.error || 'Failed to load customers');
    }
    setLoading(false);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.mobile?.includes(searchTerm)
  );

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setPaymentAmount(customer.fee?.toString() || '');
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      toast.warning('Please select a customer first');
      return;
    }
    
    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    // Generate a bill for the customer first, then process payment
    const billResult = await billingApi.generateCustomerBill(selectedCustomer.id);
    if (!billResult.success) {
      setError(billResult.error || 'Failed to generate bill');
      setSubmitting(false);
      return;
    }

    const invoiceId = billResult.data?.invoice?.id || billResult.data?.id;
    if (invoiceId) {
      const payResult = await billingApi.processPayment(
        invoiceId,
        parseFloat(paymentAmount),
        paymentMethod,
      );
      if (payResult.success) {
        setSuccessMsg('Payment received successfully!');
        setTimeout(() => navigate('/billing/paid'), 1500);
      } else {
        setError(payResult.error || 'Failed to process payment');
      }
    } else {
      setSuccessMsg('Bill generated. Please process payment from invoices.');
      setTimeout(() => navigate('/billing/invoices'), 1500);
    }
    
    setSubmitting(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-[#14E8B4]/20 text-[#14E8B4]';
      case 'unpaid': return 'bg-[#F6B93B]/20 text-[#F6B93B]';
      case 'overdue': return 'bg-[#F5514B]/20 text-[#F5514B]';
      default: return 'bg-[#8996AD]/20 text-[#8996AD]';
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
      <h2 className="text-2xl font-bold text-[#EAF0FB] mb-6">Receive Payment</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Search */}
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4 flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Customer
          </h3>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by name, phone, or customer ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
            />
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                onClick={() => handleCustomerSelect(customer)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedCustomer?.id === customer.id
                    ? 'bg-[#14E8B4]/20 border-[#14E8B4]'
                    : 'bg-[#1B2540] border-[#232D45] hover:border-[#4C8DFF]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#14E8B4] to-[#0E9E7B] flex items-center justify-center font-bold text-[#04231B]">
                      {customer.name?.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-[#EAF0FB]">{customer.name}</div>
                      <div className="text-sm text-[#8996AD]">{customer.mobile}</div>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                    {customer.status?.charAt(0).toUpperCase() + customer.status?.slice(1)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-[#8996AD]">
                    <Package className="w-4 h-4" />
                    {customer.package}
                  </div>
                  <div className="flex items-center gap-2 text-[#14E8B4]">
                    <DollarSign className="w-4 h-4" />
                    Fee: Rs. {customer.fee}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Form */}
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Details
          </h3>

          {!selectedCustomer ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-[#8996AD] mx-auto mb-4" />
              <p className="text-[#8996AD]">Select a customer from the search results to receive payment</p>
            </div>
          ) : (
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              {/* Selected Customer Info */}
              <div className="p-4 bg-[#1B2540] border border-[#232D45] rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#14E8B4] to-[#0E9E7B] flex items-center justify-center font-bold text-[#04231B] text-lg">
                    {selectedCustomer.name?.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-[#EAF0FB]">{selectedCustomer.name}</div>
                    <div className="text-sm text-[#8996AD]">{selectedCustomer.mobile}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-[#8996AD]">
                    <Package className="w-4 h-4" />
                    {selectedCustomer.package}
                  </div>
                  <div className="flex items-center gap-2 text-[#14E8B4]">
                    <DollarSign className="w-4 h-4" />
                    Monthly Fee: Rs. {selectedCustomer.fee}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">Payment Amount (Rs)</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-4 py-3 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                  required
                />
                {selectedCustomer && (
                  <div className="mt-2 text-sm text-[#8996AD]">
                    Monthly Fee: <span className="text-[#14E8B4] font-semibold">Rs. {selectedCustomer.fee}</span>
                  </div>
                )}
              </div>

              {/* Discount/Concession Amount */}
              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">Discount/Concession Amount (Rs)</label>
                <input
                  type="number"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  placeholder="Enter discount amount (optional)"
                  className="w-full px-4 py-3 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                />
              </div>

              {/* Discount Reason */}
              {discountAmount && (
                <div>
                  <label className="block text-sm font-medium text-[#8996AD] mb-2">Discount Reason</label>
                  <input
                    type="text"
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                    placeholder="Enter reason for discount"
                    className="w-full px-4 py-3 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                    required
                  />
                </div>
              )}

              {/* Payment Calculation Summary */}
              {selectedCustomer && paymentAmount && (
                <div className="p-4 bg-[#1B2540] border border-[#232D45] rounded-lg">
                  <h4 className="text-sm font-semibold text-[#14E8B4] mb-3">Payment Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-[#8996AD]">
                      <span>Monthly Fee:</span>
                      <span className="text-[#EAF0FB]">Rs. {selectedCustomer.fee}</span>
                    </div>
                    {discountAmount && (
                      <div className="flex justify-between text-[#F6B93B]">
                        <span>Discount:</span>
                        <span>-Rs. {discountAmount}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-[#EAF0FB] border-t border-[#232D45] pt-2">
                      <span>Amount to Pay:</span>
                      <span className="text-[#14E8B4]">Rs. {Math.max(0, (parseFloat(String(selectedCustomer.fee)) - (parseFloat(discountAmount) || 0))).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="jazzcash">JazzCash</option>
                  <option value="easypaisa">EasyPaisa</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              {/* Payment Date */}
              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">Payment Date</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                  required
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Add any notes about this payment..."
                  className="w-full px-4 py-3 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                />
              </div>

              {successMsg && (
                <div className="p-3 bg-[#14E8B4]/10 border border-[#14E8B4]/50 rounded-lg text-sm text-[#14E8B4] text-center">
                  {successMsg}
                </div>
              )}
              {error && (
                <div className="p-3 bg-[#F5514B]/10 border border-[#F5514B]/50 rounded-lg text-sm text-[#F5514B] text-center">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#14E8B4] text-[#04231B] font-semibold rounded-lg hover:bg-[#20F0C0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-5 h-5" />
                {submitting ? 'Processing...' : 'Receive Payment'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

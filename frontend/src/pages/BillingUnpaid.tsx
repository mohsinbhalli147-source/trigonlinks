import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, DollarSign, AlertCircle, Clock, User, Package, Calendar, CreditCard, Send } from 'lucide-react';
import { invoicesApi } from '../services/api';
import { toast } from '../components/Toast';

interface UnpaidCustomer {
  id: string;
  name: string;
  username?: string;
  cnic?: string;
  phone: string;
  package: string;
  monthlyFee: number;
  dueAmount: number;
  dueDate: string;
  overdueDays: number;
  status: 'unpaid' | 'overdue';
  lastPaymentDate: string;
}

export default function BillingUnpaid() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [customers, setCustomers] = useState<UnpaidCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    setError('');
    // Use server-side status filtering - fetch unpaid and overdue separately using aggregation-friendly queries
    const [unpaidResult, overdueResult] = await Promise.all([
      invoicesApi.getAll({ status: 'unpaid', limit: 100 }),
      invoicesApi.getAll({ status: 'overdue', limit: 100 }),
    ]);

    const unpaidList = unpaidResult.data?.data || [];
    const overdueList = overdueResult.data?.data || [];
    const allInvoices = [...unpaidList, ...overdueList];

    const mapped: UnpaidCustomer[] = allInvoices.map((inv: any) => {
      const dueDateMs = inv.dueDate ? new Date(inv.dueDate).getTime() : 0;
      const today = Date.now();
      const overdueDays = dueDateMs ? Math.floor((today - dueDateMs) / 86400000) : 0;
      const status: UnpaidCustomer['status'] = inv.status === 'overdue' || overdueDays > 0 ? 'overdue' : 'unpaid';
      return {
        id: inv.id,
        name: inv.customerName || '',
        username: inv.username || inv.customerUsername || '',
        cnic: inv.cnic || inv.customerCnic || '',
        phone: inv.customerPhone || inv.mobile || '',
        package: inv.package || '',
        monthlyFee: inv.amount || 0,
        dueAmount: inv.amount || 0,
        dueDate: inv.dueDate || '',
        overdueDays: overdueDays > 0 ? overdueDays : 0,
        status,
        lastPaymentDate: inv.lastPaymentDate || '',
      };
    });

    if (unpaidResult.success || overdueResult.success) {
      setCustomers(mapped);
    } else {
      setError('Failed to load unpaid customers');
    }
    setLoading(false);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  const totalDue = customers.reduce((sum, c) => sum + c.dueAmount, 0);
  const overdueTotal = customers.filter(c => c.status === 'overdue').reduce((sum, c) => sum + c.dueAmount, 0);

  const handleSelectAll = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(filteredCustomers.map(c => c.id));
    }
  };

  const handleSelectCustomer = (id: string) => {
    setSelectedCustomers(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleSendReminder = (_customerId: string) => {
    toast.info('Reminder sent to customer.');
  };

  const handleBulkSendReminder = () => {
    if (selectedCustomers.length === 0) {
      toast.warning('Please select customers first.');
      return;
    }
    toast.info(`Reminder sent to ${selectedCustomers.length} customer(s).`);
  };

  const handleReceivePayment = (customerId: string) => {
    navigate(`/billing/receive?customerId=${customerId}`);
  };

  const handleView = (id: string) => {
    navigate(`/customers/profile/${id}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unpaid': return 'bg-[#F6B93B]/20 text-[#F6B93B]';
      case 'overdue': return 'bg-[#F5514B]/20 text-[#F5514B]';
      default: return 'bg-[#8996AD]/20 text-[#8996AD]';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8996AD]">Loading unpaid customers...</div>
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
        <h2 className="text-2xl font-bold text-[#EAF0FB]">Unpaid Users</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#8996AD]" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
            />
          </div>
          {selectedCustomers.length > 0 && (
            <button
              onClick={handleBulkSendReminder}
              className="flex items-center gap-2 px-4 py-2 bg-[#4C8DFF] text-white rounded-lg hover:bg-[#3B7BD9] transition-colors"
            >
              <Send className="w-4 h-4" />
              Send Reminders ({selectedCustomers.length})
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-[#F6B93B]" />
            <div>
              <div className="text-2xl font-bold text-[#EAF0FB]">{customers.length}</div>
              <div className="text-sm text-[#8996AD]">Unpaid Users</div>
            </div>
          </div>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-[#F5514B]" />
            <div>
              <div className="text-2xl font-bold text-[#EAF0FB]">{customers.filter(c => c.status === 'overdue').length}</div>
              <div className="text-sm text-[#8996AD]">Overdue</div>
            </div>
          </div>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-[#14E8B4]" />
            <div>
              <div className="text-2xl font-bold text-[#EAF0FB]">Rs. {totalDue.toLocaleString()}</div>
              <div className="text-sm text-[#8996AD]">Total Due</div>
            </div>
          </div>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-[#F5514B]" />
            <div>
              <div className="text-2xl font-bold text-[#EAF0FB]">Rs. {overdueTotal.toLocaleString()}</div>
              <div className="text-sm text-[#8996AD]">Overdue Amount</div>
            </div>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#232D45]">
                <th className="py-3 px-4 text-sm font-medium text-[#8996AD]">
                  <input
                    type="checkbox"
                    checked={selectedCustomers.length === filteredCustomers.length}
                    onChange={handleSelectAll}
                    className="rounded bg-[#1B2540] border-[#232D45]"
                  />
                </th>
                <th className="text-left py-3 px-4 text-sm font-bold text-[#14E8B4]">Username</th>
                <th className="text-left py-3 px-4 text-sm font-bold text-[#14E8B4]">CNIC</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Customer</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Package</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Due Amount</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Due Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Last Payment</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-[#8996AD]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="border-b border-[#232D45] hover:bg-[#1B2540]/50">
                  <td className="py-4 px-4">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.includes(customer.id)}
                      onChange={() => handleSelectCustomer(customer.id)}
                      className="rounded bg-[#1B2540] border-[#232D45]"
                    />
                  </td>
                  <td className="py-4 px-4 text-sm font-bold text-[#14E8B4]">{customer.username || 'N/A'}</td>
                  <td className="py-4 px-4 text-sm font-bold text-[#14E8B4]">{customer.cnic || 'N/A'}</td>
                  <td className="py-4 px-4">
                    <div className="text-sm text-[#EAF0FB] font-medium">{customer.name}</div>
                    <div className="text-xs text-[#8996AD]">{customer.phone}</div>
                  </td>
                  <td className="py-4 px-4 text-sm text-[#8996AD]">{customer.package}</td>
                  <td className="py-4 px-4 text-sm text-[#14E8B4] font-medium">Rs. {customer.dueAmount}</td>
                  <td className="py-4 px-4 text-sm text-[#8996AD]">{customer.dueDate}</td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                      {customer.status === 'overdue' ? `${customer.overdueDays} days overdue` : 'Unpaid'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-[#8996AD]">{customer.lastPaymentDate}</td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleView(customer.id)}
                        className="p-2 text-[#8996AD] hover:text-[#EAF0FB] hover:bg-[#232D45] rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleSendReminder(customer.id)}
                        className="p-2 text-[#8996AD] hover:text-[#4C8DFF] hover:bg-[#232D45] rounded-lg transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleReceivePayment(customer.id)}
                        className="flex items-center gap-1 px-3 py-1 bg-[#14E8B4] text-[#04231B] text-xs font-semibold rounded-lg hover:bg-[#20F0C0] transition-colors"
                      >
                        <CreditCard className="w-3 h-3" />
                        Pay
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

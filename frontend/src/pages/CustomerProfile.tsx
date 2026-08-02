import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, CreditCard, Phone, Mail, MapPin, Calendar, User, Shield, DollarSign, Package, Clock, Printer } from 'lucide-react';
import { customersApi, invoicesApi } from '../services/api';
import { toast } from '../components/Toast';

interface Customer {
  id: string;
  uid?: string;
  name: string;
  fatherName?: string;
  father_name?: string;
  username?: string;
  phone?: string;
  mobile?: string;
  cnic?: string;
  email?: string;
  emergencyContact?: string;
  emergency_contact?: string;
  address?: string;
  package?: string;
  area?: string;
  installationDate?: string | number;
  install_date?: string | number;
  billingDate?: string | number;
  billing_date?: string | number;
  monthlyFee?: number;
  fee?: number;
  status?: 'active' | 'suspended' | 'pending' | 'inactive' | 'on-leave';
  notes?: string;
  // IPTV Information
  iptvEnabled?: boolean;
  iptv_enabled?: boolean;
  iptvBoxNumber?: string;
  iptv_box_number?: string;
  iptvBoxPrice?: number;
  iptv_box_price?: number;
  iptvInstallationCharges?: number;
  iptv_installation_charges?: number;
  iptvMonthlyCharges?: number;
  iptv_monthly_charges?: number;
  // Live IP Information
  liveIpEnabled?: boolean;
  live_ip_enabled?: boolean;
  liveIpAddress?: string;
  live_ip_address?: string;
  liveIpMonthlyFee?: number;
  live_ip_monthly_fee?: number;
  liveip_monthly_fee?: number;
  liveIpInstallationFee?: number;
  live_ip_installation_fee?: number;
  // Installation
  installFee?: number;
  installFeePaid?: boolean;
}

export default function CustomerProfile() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const shouldPrint = searchParams.get('print') === 'true';
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCustomer();
    loadInvoices();
  }, [id]);

  useEffect(() => {
    if (shouldPrint && customer) {
      setTimeout(() => window.print(), 500);
    }
  }, [shouldPrint, customer]);

  const loadCustomer = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const result = await customersApi.getById(id);
      if (result.success && result.data) {
        setCustomer(result.data);
      } else {
        setError(result.error || 'Failed to load customer');
      }
    } catch (err) {
      console.error('Error loading customer:', err);
      setError('Network error loading customer');
    } finally {
      setLoading(false);
    }
  };

  const loadInvoices = async () => {
    if (!id) return;
    const result = await invoicesApi.getAll({ customerId: id });
    if (result.success) {
      setInvoices(result.data?.data || result.data || []);
    }
  };

  const handleEdit = () => {
    if (customer) navigate(`/customers/edit/${customer.id}`);
  };

  const handleDelete = async () => {
    if (customer && confirm('Are you sure you want to delete this customer?')) {
      const result = await customersApi.delete(customer.id);
      if (result.success) {
        navigate('/customers/all');
      } else {
        toast.error(result.error || 'Failed to delete customer');
      }
    }
  };

  const handlePayment = () => {
    if (customer) navigate(`/billing/receive?customerId=${customer.id}`);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8996AD]">Loading customer...</div>
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

  if (!customer) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8996AD]">Customer not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/customers/all')}
          className="flex items-center gap-2 text-[#8996AD] hover:text-[#EAF0FB] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Customers
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-[#8B5CF6] text-white font-semibold rounded-lg hover:bg-[#7C3AED] transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={handlePayment}
            className="flex items-center gap-2 px-4 py-2 bg-[#14E8B4] text-[#04231B] font-semibold rounded-lg hover:bg-[#20F0C0] transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            Add Payment
          </button>
          <button
            onClick={handleEdit}
            className="flex items-center gap-2 px-4 py-2 bg-[#4C8DFF] text-white font-semibold rounded-lg hover:bg-[#3B7BD9] transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 bg-[#F5514B] text-white font-semibold rounded-lg hover:bg-[#E6403A] transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Customer Profile Card */}
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#14E8B4] to-[#0E9E7B] flex items-center justify-center text-2xl font-bold text-[#04231B]">
              {customer.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#EAF0FB]">{customer.name}</h2>
              <p className="text-[#8996AD]">@{customer.username}</p>
            </div>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
            customer.status === 'active' 
              ? 'bg-[#14E8B4]/20 text-[#14E8B4]' 
              : customer.status === 'suspended'
              ? 'bg-[#F5514B]/20 text-[#F5514B]'
              : 'bg-[#F6B93B]/20 text-[#F6B93B]'
          }`}>
            {customer.status ? customer.status.charAt(0).toUpperCase() + customer.status.slice(1) : 'Unknown'}
          </span>
        </div>

        {/* Personal Information */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-[#14E8B4] mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-[#1B2540] p-4 rounded-lg">
              <p className="text-xs text-[#5C6B85] mb-1">Customer ID</p>
              <p className="text-sm font-medium text-[#EAF0FB] font-mono">{customer.id}</p>
            </div>
            <div className="bg-[#1B2540] p-4 rounded-lg">
              <p className="text-xs text-[#5C6B85] mb-1">UID</p>
              <p className="text-sm font-medium text-[#EAF0FB] font-mono">{customer.uid || 'N/A'}</p>
            </div>
            <div className="bg-[#1B2540] p-4 rounded-lg">
              <p className="text-xs text-[#5C6B85] mb-1">Full Name</p>
              <p className="text-sm font-medium text-[#EAF0FB]">{customer.name}</p>
            </div>
            <div className="bg-[#1B2540] p-4 rounded-lg">
              <p className="text-xs text-[#5C6B85] mb-1">Father Name</p>
              <p className="text-sm font-medium text-[#EAF0FB]">{customer.fatherName || 'N/A'}</p>
            </div>
            <div className="bg-[#1B2540] p-4 rounded-lg">
              <p className="text-xs text-[#5C6B85] mb-1">Username</p>
              <p className="text-sm font-medium text-[#EAF0FB]">{customer.username || 'N/A'}</p>
            </div>
            <div className="bg-[#1B2540] p-4 rounded-lg">
              <p className="text-xs text-[#5C6B85] mb-1">Phone</p>
              <p className="text-sm font-medium text-[#EAF0FB] flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {customer.mobile || customer.phone || 'N/A'}
              </p>
            </div>
            <div className="bg-[#1B2540] p-4 rounded-lg">
              <p className="text-xs text-[#5C6B85] mb-1">CNIC</p>
              <p className="text-sm font-medium text-[#EAF0FB]">{customer.cnic || 'N/A'}</p>
            </div>
            <div className="bg-[#1B2540] p-4 rounded-lg">
              <p className="text-xs text-[#5C6B85] mb-1">Email</p>
              <p className="text-sm font-medium text-[#EAF0FB] flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {customer.email || 'N/A'}
              </p>
            </div>
            <div className="bg-[#1B2540] p-4 rounded-lg">
              <p className="text-xs text-[#5C6B85] mb-1">Emergency Contact</p>
              <p className="text-sm font-medium text-[#EAF0FB] flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {customer.emergencyContact || 'N/A'}
              </p>
            </div>
            <div className="bg-[#1B2540] p-4 rounded-lg md:col-span-2">
              <p className="text-xs text-[#5C6B85] mb-1">Address</p>
              <p className="text-sm font-medium text-[#EAF0FB] flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {customer.address || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Connection Details */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-[#14E8B4] mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Connection Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-[#1B2540] p-4 rounded-lg">
              <p className="text-xs text-[#5C6B85] mb-1">Package</p>
              <p className="text-sm font-medium text-[#EAF0FB] flex items-center gap-2">
                <Package className="w-4 h-4" />
                {customer.package || 'N/A'}
              </p>
            </div>
            <div className="bg-[#1B2540] p-4 rounded-lg">
              <p className="text-xs text-[#5C6B85] mb-1">Area</p>
              <p className="text-sm font-medium text-[#EAF0FB] flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {customer.area || 'N/A'}
              </p>
            </div>
            <div className="bg-[#1B2540] p-4 rounded-lg">
              <p className="text-xs text-[#5C6B85] mb-1">Installation Date</p>
              <p className="text-sm font-medium text-[#EAF0FB] flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {customer.installationDate ? (typeof customer.installationDate === 'number' 
                  ? new Date(customer.installationDate).toISOString().split('T')[0] 
                  : customer.installationDate) : 'N/A'}
              </p>
            </div>
            <div className="bg-[#1B2540] p-4 rounded-lg">
              <p className="text-xs text-[#5C6B85] mb-1">Billing Date</p>
              <p className="text-sm font-medium text-[#EAF0FB] flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {customer.billingDate ? `Day ${customer.billingDate} of each month` : 'N/A'}
              </p>
            </div>
            <div className="bg-[#1B2540] p-4 rounded-lg">
              <p className="text-xs text-[#5C6B85] mb-1">Monthly Fee</p>
              <p className="text-sm font-medium text-[#EAF0FB] flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Rs. {(customer.fee || customer.monthlyFee || 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-[#1B2540] p-4 rounded-lg">
              <p className="text-xs text-[#5C6B85] mb-1">Installation Fee</p>
              <p className="text-sm font-medium text-[#EAF0FB] flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Rs. {customer.installFee || 0}
              </p>
            </div>
            <div className="bg-[#1B2540] p-4 rounded-lg">
              <p className="text-xs text-[#5C6B85] mb-1">Installation Fee Paid</p>
              <p className="text-sm font-medium text-[#EAF0FB]">
                {customer.installFeePaid ? 'Yes' : 'No'}
              </p>
            </div>
          </div>
        </div>

        {/* IPTV Information */}
        {customer.iptvEnabled && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-[#14E8B4] mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              IPTV Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-[#1B2540] p-4 rounded-lg">
                <p className="text-xs text-[#5C6B85] mb-1">IPTV Box Number</p>
                <p className="text-sm font-medium text-[#EAF0FB]">{customer.iptvBoxNumber || 'N/A'}</p>
              </div>
              <div className="bg-[#1B2540] p-4 rounded-lg">
                <p className="text-xs text-[#5C6B85] mb-1">Box Price</p>
                <p className="text-sm font-medium text-[#EAF0FB]">Rs. {customer.iptvBoxPrice || 0}</p>
              </div>
              <div className="bg-[#1B2540] p-4 rounded-lg">
                <p className="text-xs text-[#5C6B85] mb-1">Installation Charges</p>
                <p className="text-sm font-medium text-[#EAF0FB]">Rs. {customer.iptvInstallationCharges || 0}</p>
              </div>
              <div className="bg-[#1B2540] p-4 rounded-lg">
                <p className="text-xs text-[#5C6B85] mb-1">Monthly Charges</p>
                <p className="text-sm font-medium text-[#14E8B4]">Rs. {customer.iptvMonthlyCharges || 0}</p>
              </div>
            </div>
          </div>
        )}

        {/* Live IP Information */}
        {customer.liveIpEnabled && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-[#14E8B4] mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Live IP Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-[#1B2540] p-4 rounded-lg">
                <p className="text-xs text-[#5C6B85] mb-1">IP Address</p>
                <p className="text-sm font-medium text-[#EAF0FB]">{customer.liveIpAddress || 'N/A'}</p>
              </div>
              <div className="bg-[#1B2540] p-4 rounded-lg">
                <p className="text-xs text-[#5C6B85] mb-1">Monthly Fee</p>
                <p className="text-sm font-medium text-[#14E8B4]">Rs. {customer.liveIpMonthlyFee || 0}</p>
              </div>
              <div className="bg-[#1B2540] p-4 rounded-lg">
                <p className="text-xs text-[#5C6B85] mb-1">Installation Fee</p>
                <p className="text-sm font-medium text-[#EAF0FB]">Rs. {customer.liveIpInstallationFee || 0}</p>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {customer.notes && (
          <div>
            <h3 className="text-lg font-semibold text-[#14E8B4] mb-4">Notes</h3>
            <div className="bg-[#1B2540] p-4 rounded-lg">
              <p className="text-sm text-[#EAF0FB]">{customer.notes}</p>
            </div>
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-[#EAF0FB] mb-4">Payment History</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#232D45]">
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Method</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length > 0 ? (
                invoices.map((invoice: any) => (
                  <tr key={invoice.id} className="border-b border-[#232D45] hover:bg-[#1B2540]/50">
                    <td className="py-3 px-4 text-sm text-[#EAF0FB]">
                      {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-sm text-[#14E8B4]">Rs. {invoice.amount || 0}</td>
                    <td className="py-3 px-4 text-sm text-[#8996AD]">{invoice.payment_method || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        invoice.status === 'paid'
                          ? 'bg-[#14E8B4]/10 text-[#14E8B4]'
                          : invoice.status === 'pending'
                          ? 'bg-[#F6B93B]/10 text-[#F6B93B]'
                          : 'bg-[#F5514B]/10 text-[#F5514B]'
                      }`}>
                        {invoice.status || 'Unknown'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[#5C6B85]">
                    No payment history found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print-specific styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .bg-\\[\\#121B2E\\] {
            background: white !important;
            border: 1px solid #ddd !important;
          }
          .bg-\\[\\#1B2540\\] {
            background: #f5f5f5 !important;
            border: 1px solid #ddd !important;
          }
          .text-\\[\\#EAF0FB\\], .text-\\[\\#14E8B4\\], .text-\\[\\#8996AD\\] {
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
}

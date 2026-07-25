import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { customersApi, invoicesApi } from '../services/api';
import { User, MapPin, CreditCard, Clock, Activity, FileText } from 'lucide-react';
import { Loader2 } from 'lucide-react';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [customerData, setCustomerData] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.uid) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load customer profile
      const custRes = await customersApi.getById(user!.uid);
      if (custRes.success) {
        setCustomerData(custRes.data);
      }

      // Load customer invoices
      const invRes = await invoicesApi.getAll({ customerId: user!.uid, limit: 5 });
      if (invRes.success) {
        setInvoices(invRes.data.data || []);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[#4C8DFF] animate-spin" />
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
      <h2 className="text-2xl font-bold text-[#EAF0FB] mb-6">Welcome, {customerData?.name || user?.name}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Summary */}
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="text-[#4C8DFF] w-6 h-6" />
            <h3 className="text-lg font-semibold text-[#EAF0FB]">Profile Details</h3>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-[#8996AD]"><strong>Username:</strong> <span className="text-[#EAF0FB]">{customerData?.username}</span></p>
            <p className="text-sm text-[#8996AD]"><strong>CNIC:</strong> <span className="text-[#EAF0FB]">{customerData?.cnic}</span></p>
            <p className="text-sm text-[#8996AD]"><strong>Phone:</strong> <span className="text-[#EAF0FB]">{customerData?.mobile}</span></p>
            <p className="text-sm text-[#8996AD]"><strong>Email:</strong> <span className="text-[#EAF0FB]">{customerData?.email}</span></p>
          </div>
        </div>

        {/* Connection Info */}
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="text-[#14E8B4] w-6 h-6" />
            <h3 className="text-lg font-semibold text-[#EAF0FB]">Connection Info</h3>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-[#8996AD]"><strong>Package:</strong> <span className="text-[#EAF0FB]">{customerData?.package}</span></p>
            <p className="text-sm text-[#8996AD]"><strong>Area:</strong> <span className="text-[#EAF0FB]">{customerData?.area}</span></p>
            <p className="text-sm text-[#8996AD]">
              <strong>Status:</strong> 
              <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                customerData?.status === 'active' ? 'bg-[#14E8B4]/20 text-[#14E8B4]' : 'bg-[#F5514B]/20 text-[#F5514B]'
              }`}>
                {customerData?.status?.toUpperCase()}
              </span>
            </p>
            <p className="text-sm text-[#8996AD]"><strong>Installation Date:</strong> <span className="text-[#EAF0FB]">{customerData?.installDate}</span></p>
          </div>
        </div>

        {/* Billing Overview */}
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="text-[#F6B93B] w-6 h-6" />
            <h3 className="text-lg font-semibold text-[#EAF0FB]">Billing Summary</h3>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-[#8996AD]"><strong>Monthly Fee:</strong> <span className="text-[#EAF0FB]">Rs. {customerData?.fee}</span></p>
            <p className="text-sm text-[#8996AD]"><strong>Billing Date:</strong> <span className="text-[#EAF0FB]">{customerData?.billingDate} of every month</span></p>
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="text-[#4C8DFF] w-6 h-6" />
          <h3 className="text-lg font-semibold text-[#EAF0FB]">Recent Invoices</h3>
        </div>
        
        {invoices.length === 0 ? (
          <p className="text-[#8996AD] text-sm">No recent invoices found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#232D45]">
                  <th className="py-3 px-4 text-sm font-medium text-[#8996AD]">Invoice No.</th>
                  <th className="py-3 px-4 text-sm font-medium text-[#8996AD]">Date</th>
                  <th className="py-3 px-4 text-sm font-medium text-[#8996AD]">Amount</th>
                  <th className="py-3 px-4 text-sm font-medium text-[#8996AD]">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-[#232D45] hover:bg-[#1B2540]">
                    <td className="py-3 px-4 text-sm text-[#EAF0FB]">{inv.id.slice(0, 8).toUpperCase()}</td>
                    <td className="py-3 px-4 text-sm text-[#EAF0FB]">
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-[#EAF0FB]">Rs. {inv.amount}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        inv.status === 'paid' ? 'bg-[#14E8B4]/20 text-[#14E8B4]' : 'bg-[#F5514B]/20 text-[#F5514B]'
                      }`}>
                        {inv.status?.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

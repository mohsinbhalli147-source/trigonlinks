import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { customersApi, invoicesApi } from '../services/api';
import { Loader2 } from 'lucide-react';
import CustomerProfileSummary from '../components/CustomerProfileSummary';
import CustomerConnectionInfo from '../components/CustomerConnectionInfo';
import CustomerBillingSummary from '../components/CustomerBillingSummary';
import CustomerRecentInvoices from '../components/CustomerRecentInvoices';

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
        <CustomerProfileSummary customerData={customerData} />
        <CustomerConnectionInfo customerData={customerData} />
        <CustomerBillingSummary customerData={customerData} />
      </div>

      <CustomerRecentInvoices invoices={invoices} />
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Calendar, Package, User, FileText, AlertCircle, MapPin, Loader, Play, CheckCircle2, Zap } from 'lucide-react';
import { customersApi, invoicesApi, billingApi } from '../services/api';
import { useServerPagination } from '../hooks/useServerPagination';
import { Pagination } from '../components/Pagination';

interface Customer {
  id: string;
  uid: string;
  name: string;
  username?: string;
  cnic?: string;
  mobile: string;
  address: string;
  area: string;
  status: string;
  package: string;
  fee: number;
}

export default function GenerateBill() {
  const navigate = useNavigate();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    amount: 0,
    discount_amount: 0,
    due_date: '',
    notes: ''
  });

  // Area-wise bulk generation state
  const [areas, setAreas] = useState<string[]>([]);
  const [selectedArea, setSelectedArea] = useState('');
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<{ jobId: string; progress: number; total: number; status: string } | null>(null);
  const [bulkError, setBulkError] = useState('');
  const [bulkSuccess, setBulkSuccess] = useState('');

  const fetchCustomers = useCallback(({ page, limit }: { page: number; limit: number }) => {
    const params: any = { page, limit };
    if (searchTerm) params.search = searchTerm;
    return customersApi.getAll(params);
  }, [searchTerm]);

  const {
    data: customers,
    loading,
    page,
    limit,
    total,
    totalPages,
    setPage,
    setLimit,
  } = useServerPagination<Customer>(fetchCustomers, { limit: 50 });

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  useEffect(() => {
    billingApi.getAreas().then(result => {
      if (result.success && result.data) {
        setAreas(result.data);
      }
    });
  }, []);

  // Poll job status while bulk generation is running
  useEffect(() => {
    if (!bulkStatus || bulkStatus.status === 'completed' || bulkStatus.status === 'failed') return;
    const timer = setInterval(async () => {
      const result = await billingApi.getJobStatus(bulkStatus.jobId);
      if (result.success && result.data?.job) {
        const job = result.data.job;
        setBulkStatus({
          jobId: job.id,
          progress: job.progress.current,
          total: job.progress.total,
          status: job.status,
        });
        if (job.status === 'completed') {
          setBulkSuccess(`Bill generation complete! ${job.result?.billsGenerated || 0} bills generated.`);
          setBulkGenerating(false);
        } else if (job.status === 'failed') {
          setBulkError(job.error || 'Bill generation failed');
          setBulkGenerating(false);
        }
      }
    }, 2000);
    return () => clearInterval(timer);
  }, [bulkStatus]);

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      amount: customer.fee,
      discount_amount: 0,
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: ''
    });
  };

  const handleGenerateAll = async (forceAll = false) => {
    setBulkGenerating(true);
    setBulkError('');
    setBulkSuccess('');
    const result = await billingApi.generateMonthly({ forceAll });
    if (result.success && result.data?.jobId) {
      setBulkStatus({ jobId: result.data.jobId, progress: 0, total: result.data.total || 0, status: 'running' });
    } else {
      setBulkError(result.data?.message || result.error || 'Failed to start bill generation');
      setBulkGenerating(false);
    }
  };

  const handleGenerateArea = async () => {
    if (!selectedArea) {
      setBulkError('Please select an area first');
      return;
    }
    setBulkGenerating(true);
    setBulkError('');
    setBulkSuccess('');
    const result = await billingApi.generateAreaBills(selectedArea);
    if (result.success && result.data?.jobId) {
      setBulkStatus({ jobId: result.data.jobId, progress: 0, total: result.data.total || 0, status: 'running' });
    } else {
      setBulkError(result.data?.message || result.error || 'Failed to start area bill generation');
      setBulkGenerating(false);
    }
  };

  const filteredCustomers = customers;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      setError('Please select a customer');
      return;
    }

    setGenerating(true);
    setError('');

    const invoiceData = {
      customer_id: selectedCustomer.id,
      customer_name: selectedCustomer.name,
      package: selectedCustomer.package,
      amount: formData.amount,
      paid_amount: 0,
      remaining_balance: formData.amount - formData.discount_amount,
      discount_amount: formData.discount_amount,
      status: 'unpaid',
      due_date: formData.due_date ? new Date(formData.due_date).getTime() : null,
      notes: formData.notes
    };

    const result = await invoicesApi.create(invoiceData);
    if (result.success) {
      navigate(`/billing/invoice/${result.data.id}`);
    } else {
      setError(result.error || 'Failed to generate bill');
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="text-center text-[#8996AD]">Loading customers...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#EAF0FB]">Generate Bill</h1>
      </div>

      {/* Bulk / Area-wise Invoice Generation */}
      <div className="bg-gradient-to-br from-[#121B2E] to-[#1B2540] border border-[#232D45] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[#14E8B4] mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Bulk Invoice Generation (Background Processing)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Generate for all (billing date today) */}
          <button
            onClick={() => handleGenerateAll(false)}
            disabled={bulkGenerating}
            className="flex flex-col items-start gap-2 p-4 bg-[#1B2540] border border-[#232D45] rounded-lg hover:border-[#14E8B4] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
          >
            <Play className="w-5 h-5 text-[#14E8B4]" />
            <span className="font-semibold text-[#EAF0FB]">Generate by Billing Date</span>
            <span className="text-xs text-[#8996AD]">Only customers whose billing date is today</span>
          </button>

          {/* Force generate all */}
          <button
            onClick={() => handleGenerateAll(true)}
            disabled={bulkGenerating}
            className="flex flex-col items-start gap-2 p-4 bg-[#1B2540] border border-[#232D45] rounded-lg hover:border-[#14E8B4] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
          >
            <Zap className="w-5 h-5 text-[#F5A623]" />
            <span className="font-semibold text-[#EAF0FB]">Force Generate All</span>
            <span className="text-xs text-[#8996AD]">Generate for ALL active customers (ignores billing date)</span>
          </button>

          {/* Area-wise */}
          <div className="flex flex-col gap-2 p-4 bg-[#1B2540] border border-[#232D45] rounded-lg">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#14E8B4]" />
              <span className="font-semibold text-[#EAF0FB]">Area-wise Generation</span>
            </div>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              disabled={bulkGenerating}
              className="w-full px-3 py-2 bg-[#121B2E] border border-[#232D45] rounded-lg text-[#EAF0FB] text-sm focus:outline-none focus:border-[#14E8B4]"
            >
              <option value="">Select area...</option>
              {areas.map((area) => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
            <button
              onClick={handleGenerateArea}
              disabled={bulkGenerating || !selectedArea}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#14E8B4] text-[#04231B] font-semibold rounded-lg hover:bg-[#20F0C0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <MapPin className="w-4 h-4" />
              Generate for Area
            </button>
          </div>
        </div>

        {/* Progress / Status */}
        {bulkGenerating && bulkStatus && (
          <div className="mt-4 p-4 bg-[#1B2540] border border-[#14E8B4]/30 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Loader className="w-5 h-5 text-[#14E8B4] animate-spin" />
              <span className="text-[#EAF0FB] font-medium">
                Processing: {bulkStatus.progress} / {bulkStatus.total} customers
              </span>
            </div>
            <div className="w-full bg-[#121B2E] rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#14E8B4] h-full rounded-full transition-all duration-500"
                style={{ width: `${bulkStatus.total > 0 ? (bulkStatus.progress / bulkStatus.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {bulkSuccess && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-[#14E8B4]/10 border border-[#14E8B4] rounded-lg text-[#14E8B4] text-sm">
            <CheckCircle2 className="w-4 h-4" />
            {bulkSuccess}
          </div>
        )}

        {bulkError && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-[#F5514B]/10 border border-[#F5514B] rounded-lg text-[#F5514B] text-sm">
            <AlertCircle className="w-4 h-4" />
            {bulkError}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Selection */}
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[#14E8B4] mb-4">Select Customer</h2>
          
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by name, mobile, or area..."
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
                    <p className="font-bold text-[#14E8B4] text-sm">{customer.username || 'N/A'}</p>
                    <p className="font-medium text-[#EAF0FB]">{customer.name}</p>
                    <p className="text-sm text-[#5C6B85]">{customer.cnic || 'N/A'}</p>
                    <p className="text-sm text-[#5C6B85]">{customer.mobile}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[#8996AD]">{customer.package}</p>
                    <p className="text-sm text-[#14E8B4]">Rs. {customer.fee}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
            itemName="customers"
          />
        </div>

        {/* Bill Details */}
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[#14E8B4] mb-4">Bill Details</h2>

          {selectedCustomer ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Customer Info */}
              <div className="bg-[#1B2540] rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-[#8996AD]" />
                  <div>
                    <p className="text-sm text-[#5C6B85]">Username</p>
                    <p className="text-[#14E8B4] font-bold">{selectedCustomer.username || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-[#8996AD]" />
                  <div>
                    <p className="text-sm text-[#5C6B85]">CNIC</p>
                    <p className="text-[#14E8B4] font-bold">{selectedCustomer.cnic || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-[#8996AD]" />
                  <div>
                    <p className="text-sm text-[#5C6B85]">Customer</p>
                    <p className="text-[#EAF0FB]">{selectedCustomer.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-[#8996AD]" />
                  <div>
                    <p className="text-sm text-[#5C6B85]">Package</p>
                    <p className="text-[#EAF0FB]">{selectedCustomer.package}</p>
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">Amount (Rs)</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                  className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                  required
                />
              </div>

              {/* Discount */}
              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">Discount Amount (Rs)</label>
                <input
                  type="number"
                  value={formData.discount_amount}
                  onChange={(e) => setFormData({...formData, discount_amount: Number(e.target.value)})}
                  className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-[#8996AD] mb-2">Due Date</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                  className="w-full px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
                  required
                />
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

              {/* Summary */}
              <div className="bg-[#232D45]/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#8996AD]">Total Amount</span>
                  <span className="text-[#EAF0FB]">Rs. {formData.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#8996AD]">Discount</span>
                  <span className="text-[#F5514B]">- Rs. {formData.discount_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t border-[#232D45]">
                  <span className="text-[#EAF0FB]">Net Amount</span>
                  <span className="text-[#14E8B4]">Rs. {(formData.amount - formData.discount_amount).toFixed(2)}</span>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-[#F5514B]/10 border border-[#F5514B] rounded-lg text-[#F5514B] text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#14E8B4] hover:bg-[#20F0C0] text-[#04231B] font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText className="w-5 h-5" />
                {generating ? 'Generating...' : 'Generate Bill'}
              </button>
            </form>
          ) : (
            <div className="text-center py-12 text-[#5C6B85]">
              <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a customer to generate bill</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

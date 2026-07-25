import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Search, Filter, Loader2, RefreshCw } from 'lucide-react';
import { invoicesApi } from '../services/api';
import { toast } from '../components/Toast';
import EmptyState from '../components/EmptyState';

interface PaymentRequest {
  id: string;
  customerName?: string;
  customerPhone?: string;
  customerPackage?: string;
  amount: number;
  paymentMethod?: string;
  paymentDate?: string;
  collectedBy?: string;
  collectedByRole?: string;
  notes?: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  createdAt: number;
}

export default function BillingApproval() {
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [filterStaff, setFilterStaff] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadPayments();
  }, [filterStatus]);

  const loadPayments = async () => {
    setLoading(true);
    setError('');
    const result = await invoicesApi.getApprovalRequests({ status: filterStatus });
    if (result.success) {
      setPayments(result.data?.requests || []);
    } else {
      setError(result.error || 'Failed to load payment requests');
    }
    setLoading(false);
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch =
      (payment.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.customerPhone || '').includes(searchTerm) ||
      (payment.collectedBy || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStaff = filterStaff === 'all' || payment.collectedBy === filterStaff;
    return matchesSearch && matchesStaff;
  });

  const uniqueStaff = Array.from(new Set(payments.map(p => p.collectedBy).filter(Boolean)));

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    const result = await invoicesApi.approve(id);
    setActionLoading(null);
    if (result.success) {
      toast.success('Payment approved successfully');
      loadPayments();
    } else {
      toast.error(result.error || 'Failed to approve payment');
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectTarget) return;
    setActionLoading(rejectTarget);
    const result = await invoicesApi.reject(rejectTarget, rejectReason);
    setActionLoading(null);
    setRejectTarget(null);
    setRejectReason('');
    if (result.success) {
      toast.success('Payment rejected');
      loadPayments();
    } else {
      toast.error(result.error || 'Failed to reject payment');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-[#F6B93B]/20 text-[#F6B93B]';
      case 'approved': return 'bg-[#14E8B4]/20 text-[#14E8B4]';
      case 'rejected': return 'bg-[#F5514B]/20 text-[#F5514B]';
      default: return 'bg-[#8996AD]/20 text-[#8996AD]';
    }
  };

  const getRoleColor = (role: string = '') => {
    switch (role) {
      case 'admin': return 'bg-[#F5514B]/10 text-[#F5514B]';
      case 'technician': return 'bg-[#4C8DFF]/10 text-[#4C8DFF]';
      case 'sales': return 'bg-[#14E8B4]/10 text-[#14E8B4]';
      case 'support': return 'bg-[#F6B93B]/10 text-[#F6B93B]';
      default: return 'bg-[#5C6B85]/10 text-[#5C6B85]';
    }
  };

  const totalPending = payments.filter(p => p.approvalStatus === 'pending').reduce((sum, p) => sum + p.amount, 0);
  const totalApproved = payments.filter(p => p.approvalStatus === 'approved').reduce((sum, p) => sum + p.amount, 0);
  const totalRejected = payments.filter(p => p.approvalStatus === 'rejected').reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[#4C8DFF] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-[#F5514B]">{error}</div>
        <button
          onClick={loadPayments}
          className="flex items-center gap-2 px-4 py-2 bg-[#4C8DFF] text-white rounded-lg hover:bg-[#3B7BD9]"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#EAF0FB]">Payment Approval (Admin Only)</h2>
        <button
          onClick={loadPayments}
          className="flex items-center gap-2 px-4 py-2 bg-[#1B2540] border border-[#232D45] text-[#EAF0FB] rounded-lg hover:border-[#4C8DFF] transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <p className="text-sm text-[#8996AD] mb-2">Pending Requests</p>
          <p className="text-2xl font-bold text-[#F6B93B]">{payments.filter(p => p.approvalStatus === 'pending').length}</p>
          <p className="text-sm text-[#8996AD] mt-1">Rs. {totalPending.toLocaleString()}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <p className="text-sm text-[#8996AD] mb-2">Approved</p>
          <p className="text-2xl font-bold text-[#14E8B4]">{payments.filter(p => p.approvalStatus === 'approved').length}</p>
          <p className="text-sm text-[#8996AD] mt-1">Rs. {totalApproved.toLocaleString()}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <p className="text-sm text-[#8996AD] mb-2">Rejected</p>
          <p className="text-2xl font-bold text-[#F5514B]">{payments.filter(p => p.approvalStatus === 'rejected').length}</p>
          <p className="text-sm text-[#8996AD] mt-1">Rs. {totalRejected.toLocaleString()}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <p className="text-sm text-[#8996AD] mb-2">Total Requests</p>
          <p className="text-2xl font-bold text-[#4C8DFF]">{payments.length}</p>
          <p className="text-sm text-[#8996AD] mt-1">Rs. {(totalPending + totalApproved + totalRejected).toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#5C6B85]" />
            <input
              type="text"
              placeholder="Search by customer, phone, or staff name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#5C6B85]" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={filterStaff}
              onChange={(e) => setFilterStaff(e.target.value)}
              className="px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
            >
              <option value="all">All Staff</option>
              {uniqueStaff.map(staff => (
                <option key={staff} value={staff}>{staff}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <EmptyState
            icon="CheckCircle"
            title="No payment requests"
            description={filterStatus === 'pending' ? 'No pending payment requests at the moment.' : 'No payment requests match your filters.'}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#232D45]">
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Customer</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Package</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Method</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Collected By</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-[#8996AD]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="border-b border-[#232D45] hover:bg-[#1B2540]/50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-semibold text-[#EAF0FB]">{payment.customerName || '—'}</div>
                          <div className="text-sm text-[#8996AD]">{payment.customerPhone || ''}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-[#8996AD]">{payment.customerPackage || '—'}</td>
                      <td className="py-3 px-4 text-sm text-[#14E8B4] font-semibold">Rs. {(payment.amount || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm text-[#8996AD] capitalize">{(payment.paymentMethod || '—').replace('_', ' ')}</td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="text-sm text-[#EAF0FB]">{payment.collectedBy || '—'}</div>
                          {payment.collectedByRole && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(payment.collectedByRole)}`}>
                              {payment.collectedByRole}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-[#8996AD]">
                        {payment.paymentDate || (payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : '—')}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.approvalStatus)}`}>
                          {(payment.approvalStatus || 'pending').charAt(0).toUpperCase() + (payment.approvalStatus || 'pending').slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {payment.approvalStatus === 'pending' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApprove(payment.id)}
                              disabled={actionLoading === payment.id}
                              className="flex items-center gap-1 px-3 py-1 bg-[#14E8B4]/20 text-[#14E8B4] rounded-lg hover:bg-[#14E8B4]/30 transition-colors text-sm disabled:opacity-50"
                            >
                              {actionLoading === payment.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                              Approve
                            </button>
                            <button
                              onClick={() => { setRejectTarget(payment.id); setRejectReason(''); }}
                              disabled={actionLoading === payment.id}
                              className="flex items-center gap-1 px-3 py-1 bg-[#F5514B]/20 text-[#F5514B] rounded-lg hover:bg-[#F5514B]/30 transition-colors text-sm disabled:opacity-50"
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </button>
                          </div>
                        )}
                        {payment.approvalStatus !== 'pending' && (
                          <span className="text-sm text-[#5C6B85]">
                            {payment.approvalStatus === 'approved' ? '✓ Approved' : '✗ Rejected'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-sm text-[#5C6B85]">
              Showing {filteredPayments.length} of {payments.length} payment requests
            </div>
          </>
        )}
      </div>

      {/* Reject Confirmation Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#121B2E] border border-[#F5514B] rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-[#EAF0FB] mb-2">Reject Payment</h3>
            <p className="text-sm text-[#8996AD] mb-4">Are you sure you want to reject this payment? This action cannot be undone.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (optional)..."
              rows={3}
              className="w-full px-3 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#F5514B] mb-4 resize-none"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setRejectTarget(null)}
                className="px-4 py-2 bg-[#1B2540] border border-[#232D45] text-[#EAF0FB] rounded-lg hover:border-[#8996AD] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={!!actionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-[#F5514B] text-white rounded-lg hover:bg-[#D94040] transition-colors disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

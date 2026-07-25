import { useState, useEffect } from 'react';
import { Search, Filter, DollarSign, CheckCircle, Clock, XCircle } from 'lucide-react';
import { staffApi } from '../services/api';

interface StaffPaymentRecord {
  id: string;
  staffName: string;
  staffRole: string;
  customerName: string;
  customerPhone: string;
  customerPackage: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  status: 'pending' | 'approved' | 'rejected';
  notes: string;
  createdAt: number;
}

interface StaffSummary {
  staffName: string;
  staffRole: string;
  totalRequests: number;
  pendingAmount: number;
  approvedAmount: number;
  rejectedAmount: number;
  totalCollected: number;
  approvalRate: number;
}

export default function StaffPayments() {
  const [payments, setPayments] = useState<StaffPaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStaff, setFilterStaff] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    setLoading(true);
    setError('');
    const result = await staffApi.getPayments();

    if (result.success) {
      setPayments(result.data?.data || result.data || []);
    } else {
      setError(result.error || 'Unable to load staff payments.');
    }

    setLoading(false);
  };

  const uniqueStaff = Array.from(new Set(payments.map(p => p.staffName)));

  const getStaffSummary = (staffName: string): StaffSummary => {
    const staffPayments = payments.filter(p => p.staffName === staffName);
    const staffRole = staffPayments[0]?.staffRole || 'unknown';
    const totalRequests = staffPayments.length;
    const pendingAmount = staffPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0);
    const approvedAmount = staffPayments.filter(p => p.status === 'approved').reduce((sum, p) => sum + (p.amount || 0), 0);
    const rejectedAmount = staffPayments.filter(p => p.status === 'rejected').reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalCollected = approvedAmount;
    const approvalRate = totalRequests > 0 ? Math.round((approvedAmount / (approvedAmount + rejectedAmount + pendingAmount)) * 100) : 0;

    return {
      staffName,
      staffRole,
      totalRequests,
      pendingAmount,
      approvedAmount,
      rejectedAmount,
      totalCollected,
      approvalRate
    };
  };

  const staffSummaries = uniqueStaff.map(staffName => getStaffSummary(staffName));

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.customerPhone.includes(searchTerm) ||
                         payment.staffName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    const matchesStaff = filterStaff === 'all' || payment.staffName === filterStaff;
    return matchesSearch && matchesStatus && matchesStaff;
  });

  const filteredSummaries = staffSummaries.filter(summary => {
    const matchesSearch = summary.staffName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStaff = filterStaff === 'all' || summary.staffName === filterStaff;
    return matchesSearch && matchesStaff;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-[#F6B93B]/20 text-[#F6B93B]';
      case 'approved': return 'bg-[#14E8B4]/20 text-[#14E8B4]';
      case 'rejected': return 'bg-[#F5514B]/20 text-[#F5514B]';
      default: return 'bg-[#8996AD]/20 text-[#8996AD]';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-[#F5514B]/10 text-[#F5514B]';
      case 'technician': return 'bg-[#4C8DFF]/10 text-[#4C8DFF]';
      case 'sales': return 'bg-[#14E8B4]/10 text-[#14E8B4]';
      case 'support': return 'bg-[#F6B93B]/10 text-[#F6B93B]';
      default: return 'bg-[#5C6B85]/10 text-[#5C6B85]';
    }
  };

  const grandTotal = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const grandPending = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0);
  const grandApproved = payments.filter(p => p.status === 'approved').reduce((sum, p) => sum + (p.amount || 0), 0);
  const grandRejected = payments.filter(p => p.status === 'rejected').reduce((sum, p) => sum + (p.amount || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8996AD]">Loading staff payments...</div>
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
        <h2 className="text-2xl font-bold text-[#EAF0FB]">Staff Payment Records</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('summary')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'summary' 
                ? 'bg-[#14E8B4] text-[#04231B]' 
                : 'bg-[#1B2540] text-[#8996AD] hover:text-[#EAF0FB]'
            }`}
          >
            Summary View
          </button>
          <button
            onClick={() => setViewMode('detailed')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'detailed' 
                ? 'bg-[#14E8B4] text-[#04231B]' 
                : 'bg-[#1B2540] text-[#8996AD] hover:text-[#EAF0FB]'
            }`}
          >
            Detailed View
          </button>
        </div>
      </div>

      {/* Grand Total Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-[#4C8DFF]" />
            <p className="text-sm text-[#8996AD]">Total Collection</p>
          </div>
          <p className="text-2xl font-bold text-[#EAF0FB]">Rs. {(grandTotal || 0).toLocaleString()}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-[#F6B93B]" />
            <p className="text-sm text-[#8996AD]">Pending Approval</p>
          </div>
          <p className="text-2xl font-bold text-[#F6B93B]">Rs. {(grandPending || 0).toLocaleString()}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-5 h-5 text-[#14E8B4]" />
            <p className="text-sm text-[#8996AD]">Approved</p>
          </div>
          <p className="text-2xl font-bold text-[#14E8B4]">Rs. {(grandApproved || 0).toLocaleString()}</p>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="w-5 h-5 text-[#F5514B]" />
            <p className="text-sm text-[#8996AD]">Rejected</p>
          </div>
          <p className="text-2xl font-bold text-[#F5514B]">Rs. {(grandRejected || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#5C6B85]" />
            <input
              type="text"
              placeholder="Search by staff name, customer, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#5C6B85]" />
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
            {viewMode === 'detailed' && (
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
            )}
          </div>
        </div>

        {/* Summary View */}
        {viewMode === 'summary' && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#232D45]">
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Staff Member</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Role</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Total Requests</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Pending</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Approved</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Rejected</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Total Collected</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Approval Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSummaries.map((summary) => (
                    <tr 
                      key={summary.staffName} 
                      className="border-b border-[#232D45] hover:bg-[#1B2540]/50 cursor-pointer"
                      onClick={() => {
                        setSelectedStaff(summary.staffName);
                        setFilterStaff(summary.staffName);
                        setViewMode('detailed');
                      }}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4C8DFF] to-[#2E5CB8] flex items-center justify-center font-bold text-[#EAF0FB]">
                            {summary.staffName.charAt(0)}
                          </div>
                          <div className="font-semibold text-[#EAF0FB]">{summary.staffName}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(summary.staffRole)}`}>
                          {summary.staffRole}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-[#EAF0FB]">{summary.totalRequests}</td>
                      <td className="py-3 px-4 text-sm text-[#F6B93B]">Rs. {(summary.pendingAmount || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm text-[#14E8B4]">Rs. {(summary.approvedAmount || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm text-[#F5514B]">Rs. {(summary.rejectedAmount || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm text-[#4C8DFF] font-semibold">Rs. {(summary.totalCollected || 0).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-[#232D45] rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[#14E8B4]" 
                              style={{ width: `${summary.approvalRate}%` }}
                            />
                          </div>
                          <span className="text-sm text-[#8996AD]">{summary.approvalRate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredSummaries.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-[#5C6B85]">
                        No staff records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detailed View */}
        {viewMode === 'detailed' && (
          <div className="space-y-4">
            {selectedStaff && (
              <div className="mb-4 p-4 bg-[#1B2540] border border-[#232D45] rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-[#EAF0FB]">{selectedStaff}'s Payment Records</h3>
                    <p className="text-sm text-[#8996AD]">Click on staff name in summary to view all records</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedStaff(null);
                      setFilterStaff('all');
                    }}
                    className="px-4 py-2 bg-[#232D45] text-[#8996AD] rounded-lg hover:text-[#EAF0FB] transition-colors"
                  >
                    Clear Filter
                  </button>
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#232D45]">
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Staff</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Customer</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Package</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Method</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="border-b border-[#232D45] hover:bg-[#1B2540]/50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="text-sm text-[#EAF0FB]">{payment.staffName}</div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(payment.staffRole)}`}>
                            {payment.staffRole}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="text-sm text-[#EAF0FB]">{payment.customerName}</div>
                          <div className="text-xs text-[#8996AD]">{payment.customerPhone}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-[#8996AD]">{payment.customerPackage}</td>
                      <td className="py-3 px-4 text-sm text-[#14E8B4] font-semibold">Rs. {(payment.amount || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm text-[#8996AD] capitalize">{payment.paymentMethod.replace('_', ' ')}</td>
                      <td className="py-3 px-4 text-sm text-[#8996AD]">{payment.paymentDate}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-[#8996AD]">{payment.notes}</td>
                    </tr>
                  ))}
                  {filteredPayments.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-[#5C6B85]">
                        No payment records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-4 text-sm text-[#5C6B85]">
          {viewMode === 'summary' 
            ? `Showing ${filteredSummaries.length} of ${staffSummaries.length} staff members`
            : `Showing ${filteredPayments.length} of ${payments.length} payment records`
          }
        </div>
      </div>
    </div>
  );
}

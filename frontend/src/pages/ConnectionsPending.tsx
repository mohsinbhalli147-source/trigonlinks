import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Eye, User, MapPin, DollarSign, Package, Calendar, AlertCircle, Edit, Receipt } from 'lucide-react';
import { connectionsApi } from '../services/api';
import { toast } from '../components/Toast';

interface ConnectionRequest {
  id: string;
  customerName: string;
  fatherName: string;
  phone: string;
  cnic: string;
  address: string;
  area: string;
  package: string;
  installationDate: string;
  billingDate: string;
  connectionFee: number;
  monthlyFee: number;
  concession: number;
  concessionReason: string;
  expenses: Array<{
    amount: number;
    category: string;
    description: string;
    inventoryItems: string;
  }>;
  notes: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
}

export default function ConnectionsPending() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadConnections();
  }, []);

  // Refresh when component gains focus (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadConnections();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const loadConnections = async () => {
    setLoading(true);
    setError('');
    const result = await connectionsApi.getAll();
    console.log('Connections API result:', result);
    if (result.success) {
      const data = result.data;
      console.log('Connections data:', data);
      const dataArray = Array.isArray(data) ? data : (data?.data || []);
      console.log('Connections array:', dataArray);
      setRequests(dataArray);
    } else {
      setError(result.error || 'Failed to load connections');
    }
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    if (confirm('Are you sure you want to approve this connection request? This will:\n\n1. Add the customer to the system\n2. Deduct inventory items from stock\n3. Record the connection payment\n4. Set up monthly billing')) {
      const result = await connectionsApi.update(id, { status: 'approved' });
      if (result.success) {
        loadConnections();
      } else {
        toast.error(result.error || 'Failed to approve request');
      }
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Please provide reason for rejection:');
    if (reason) {
      const result = await connectionsApi.update(id, { status: 'rejected', rejectionReason: reason });
      if (result.success) {
        loadConnections();
      } else {
        toast.error(result.error || 'Failed to reject request');
      }
    }
  };

  const handleView = (id: string) => {
    navigate(`/connections/request/${id}`);
  };

  const handleEdit = (id: string) => {
    navigate(`/connections/edit/${id}`);
  };

  const pendingRequests = requests.filter(req => req.status === 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8996AD]">Loading connections...</div>
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
        <h2 className="text-2xl font-bold text-[#EAF0FB]">Pending Connection Requests</h2>
        <div className="flex items-center gap-2 px-4 py-2 bg-[#F6B93B]/10 border border-[#F6B93B] rounded-lg">
          <Clock className="w-5 h-5 text-[#F6B93B]" />
          <span className="text-[#F6B93B] font-semibold">{pendingRequests.length} Pending</span>
        </div>
      </div>

      {pendingRequests.length === 0 ? (
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-12 text-center">
          <CheckCircle className="w-16 h-16 text-[#14E8B4] mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-[#EAF0FB] mb-2">All Caught Up!</h3>
          <p className="text-[#8996AD]">No pending connection requests to review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingRequests.map((request) => (
            <div key={request.id} className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6 hover:border-[#4C8DFF] transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#14E8B4] to-[#0E9E7B] flex items-center justify-center font-bold text-[#04231B] text-lg">
                    {request.customerName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#EAF0FB]">{request.customerName}</h3>
                    <div className="flex items-center gap-2 mt-2 text-xs text-[#5C6B85]">
                      <Clock className="w-3 h-3" />
                      Requested: {new Date(request.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-[#5C6B85]">
                      <span>Phone: {request.phone}</span>
                    </div>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#F6B93B]/20 text-[#F6B93B]">
                  Pending Approval
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Package className="w-4 h-4 text-[#4C8DFF]" />
                  <span className="text-[#8996AD]">Package:</span>
                  <span className="text-[#EAF0FB] font-medium">{request.package}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-[#4C8DFF]" />
                  <span className="text-[#8996AD]">Area:</span>
                  <span className="text-[#EAF0FB] font-medium">{request.area}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-[#4C8DFF]" />
                  <span className="text-[#8996AD]">Installation:</span>
                  <span className="text-[#EAF0FB] font-medium">{request.installationDate ? new Date(request.installationDate).toLocaleDateString() : 'Not scheduled'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-[#4C8DFF]" />
                  <span className="text-[#8996AD]">Connection Fee:</span>
                  <span className="text-[#EAF0FB] font-medium">Rs. {request.connectionFee}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-[#4C8DFF]" />
                  <span className="text-[#8996AD]">Monthly Fee:</span>
                  <span className="text-[#EAF0FB] font-medium">Rs. {request.monthlyFee}</span>
                </div>
              </div>

              {request.expenses && request.expenses.length > 0 && (
                <div className="mb-4 p-3 bg-[#1B2540] border border-[#232D45] rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-[#8996AD] mb-2">
                    <Receipt className="w-4 h-4" />
                    <span className="font-medium">Expenses ({request.expenses.length}):</span>
                  </div>
                  <div className="space-y-2">
                    {request.expenses.map((expense, idx) => (
                      <div key={idx} className="text-xs text-[#EAF0FB]">
                        <span className="text-[#14E8B4]">Rs. {expense.amount}</span> - {expense.category} {expense.inventoryItems && `(${expense.inventoryItems})`}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {request.notes && (
                <div className="mb-4 p-3 bg-[#1B2540] border border-[#232D45] rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-[#8996AD]">
                    <span className="font-medium">Notes:</span>
                    <span className="text-[#EAF0FB]">{request.notes}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-[#232D45]">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleEdit(request.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#4C8DFF] text-white rounded-lg hover:bg-[#3B7BD9] transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleView(request.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1B2540] text-[#EAF0FB] rounded-lg hover:bg-[#232D45] transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                  <button
                    onClick={() => handleReject(request.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#F5514B] text-white rounded-lg hover:bg-[#E6403A] transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(request.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#14E8B4] text-[#04231B] font-semibold rounded-lg hover:bg-[#20F0C0] transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

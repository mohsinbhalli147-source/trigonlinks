import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, User, MapPin, Package, Calendar, DollarSign, FileText, CheckCircle, XCircle, Clock, AlertCircle, Receipt, Phone } from 'lucide-react';
import { connectionsApi } from '../services/api';

interface ConnectionRequest {
  id: string;
  customerName: string;  // mapped from customer_name by backend toCamelCase
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
    id?: string;
  }>;
  notes: string;
  status: 'pending' | 'approved' | 'rejected' | 'in-progress' | 'completed';
  created_at: number;
  createdAt: number;
}

export default function ConnectionRequestDetails() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<ConnectionRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadRequest();
  }, [id]);

  const loadRequest = async () => {
    if (!id) return;
    setLoading(true);
    const result = await connectionsApi.getById(id);
    if (result.success && result.data) {
      setRequest(result.data);
    } else {
      setError(result.error || 'Failed to load connection request');
    }
    setLoading(false);
  };

  const handleApprove = async () => {
    if (!request) return;
    setProcessing(true);
    const result = await connectionsApi.update(request.id, { status: 'approved' });
    if (result.success) {
      loadRequest();
    } else {
      setError(result.error || 'Failed to approve request');
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!request) return;
    if (!confirm('Are you sure you want to reject this connection request?')) return;
    setProcessing(true);
    const result = await connectionsApi.update(request.id, { status: 'rejected' });
    if (result.success) {
      loadRequest();
    } else {
      setError(result.error || 'Failed to reject request');
      setProcessing(false);
    }
  };

  const handleStartInstallation = async () => {
    if (!request) return;
    setProcessing(true);
    const result = await connectionsApi.update(request.id, { 
      status: 'in-progress'
    });
    if (result.success) {
      loadRequest();
    } else {
      setError(result.error || 'Failed to start installation');
      setProcessing(false);
    }
  };

  const handleCompleteInstallation = async () => {
    if (!request) return;
    setProcessing(true);
    const result = await connectionsApi.update(request.id, { status: 'completed' });
    if (result.success) {
      loadRequest();
    } else {
      setError(result.error || 'Failed to complete installation');
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-[#F6B93B]/10 text-[#F6B93B]';
      case 'approved': return 'bg-[#4C8DFF]/10 text-[#4C8DFF]';
      case 'completed': return 'bg-[#14E8B4]/10 text-[#14E8B4]';
      case 'rejected': return 'bg-[#F5514B]/10 text-[#F5514B]';
      case 'in-progress': return 'bg-[#8996AD]/10 text-[#8996AD]';
      default: return 'bg-[#5C6B85]/10 text-[#5C6B85]';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5" />;
      case 'approved': return <CheckCircle className="w-5 h-5" />;
      case 'completed': return <CheckCircle className="w-5 h-5" />;
      case 'rejected': return <XCircle className="w-5 h-5" />;
      case 'in-progress': return <Clock className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="text-center text-[#8996AD]">Loading connection request...</div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="text-center text-[#F5514B]">{error || 'Connection request not found'}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-[#232D45] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#8996AD]" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#EAF0FB]">Connection Request Details</h1>
            <p className="text-sm text-[#5C6B85]">Request #{request.id}</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${getStatusColor(request.status)}`}>
          {getStatusIcon(request.status)}
          <span className="font-medium capitalize">{request.status.replace('-', ' ')}</span>
        </div>
      </div>

      {/* Request Details */}
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#14E8B4]">Customer Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-[#8996AD]" />
                <div>
                  <p className="text-sm text-[#5C6B85]">Customer Name</p>
                  <p className="text-[#EAF0FB]">{request.customerName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#8996AD]" />
                <div>
                  <p className="text-sm text-[#5C6B85]">Phone Number</p>
                  <p className="text-[#EAF0FB]">{request.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-[#8996AD]" />
                <div>
                  <p className="text-sm text-[#5C6B85]">Father Name</p>
                  <p className="text-[#EAF0FB]">{request.fatherName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-[#8996AD]" />
                <div>
                  <p className="text-sm text-[#5C6B85]">Area</p>
                  <p className="text-[#EAF0FB]">{request.area}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-[#8996AD]" />
                <div>
                  <p className="text-sm text-[#5C6B85]">Address</p>
                  <p className="text-[#EAF0FB]">{request.address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Connection Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#14E8B4]">Connection Details</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-[#8996AD]" />
                <div>
                  <p className="text-sm text-[#5C6B85]">Package</p>
                  <p className="text-[#EAF0FB]">{request.package}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-[#8996AD]" />
                <div>
                  <p className="text-sm text-[#5C6B85]">Connection Fee</p>
                  <p className="text-[#EAF0FB]">Rs. {request.connectionFee}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-[#8996AD]" />
                <div>
                  <p className="text-sm text-[#5C6B85]">Monthly Fee</p>
                  <p className="text-[#EAF0FB]">Rs. {request.monthlyFee}</p>
                </div>
              </div>
              {request.concession > 0 && (
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-[#8996AD]" />
                  <div>
                    <p className="text-sm text-[#5C6B85]">Concession</p>
                    <p className="text-[#EAF0FB]">{request.concession}% {request.concessionReason && `(${request.concessionReason})`}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-[#232D45]">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-[#8996AD]" />
            <div>
              <p className="text-sm text-[#5C6B85]">Request Date</p>
              <p className="text-[#EAF0FB]">{new Date(request.createdAt || request.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          {request.installationDate && (
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#8996AD]" />
              <div>
                <p className="text-sm text-[#5C6B85]">Installation Date</p>
                <p className="text-[#EAF0FB]">{new Date(request.installationDate).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </div>

        {/* Expenses */}
        {request.expenses && request.expenses.length > 0 && (
          <div className="mt-6 pt-6 border-t border-[#232D45]">
            <h3 className="text-lg font-semibold text-[#14E8B4] mb-3">Installation Expenses</h3>
            <div className="space-y-3">
              {request.expenses.map((expense, idx) => (
                <div key={idx} className="bg-[#232D45]/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-[#14E8B4]" />
                      <span className="text-sm font-medium text-[#EAF0FB]">Expense #{idx + 1}</span>
                    </div>
                    <span className="text-[#14E8B4] font-semibold">Rs. {expense.amount}</span>
                  </div>
                  <div className="text-sm text-[#8996AD] space-y-1">
                    <p>Category: {expense.category}</p>
                    {expense.description && <p>Description: {expense.description}</p>}
                    {expense.inventoryItems && <p>Inventory: {expense.inventoryItems}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {request.notes && (
          <div className="mt-6 pt-6 border-t border-[#232D45]">
            <h3 className="text-lg font-semibold text-[#14E8B4] mb-3">Notes</h3>
            <div className="bg-[#232D45]/50 rounded-lg p-4">
              <p className="text-[#EAF0FB]">{request.notes}</p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {request.status === 'pending' && (
          <>
            <button
              onClick={handleApprove}
              disabled={processing}
              className="flex items-center gap-2 px-6 py-3 bg-[#14E8B4] hover:bg-[#20F0C0] text-[#04231B] font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-5 h-5" />
              Approve Request
            </button>
            <button
              onClick={handleReject}
              disabled={processing}
              className="flex items-center gap-2 px-6 py-3 bg-[#F5514B] hover:bg-[#FF6B6B] text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              <XCircle className="w-5 h-5" />
              Reject Request
            </button>
          </>
        )}
        {request.status === 'approved' && (
          <button
            onClick={handleStartInstallation}
            disabled={processing}
            className="flex items-center gap-2 px-6 py-3 bg-[#4C8DFF] hover:bg-[#5A9DFF] text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            <Clock className="w-5 h-5" />
            Start Installation
          </button>
        )}
        {request.status === 'in-progress' && (
          <button
            onClick={handleCompleteInstallation}
            disabled={processing}
            className="flex items-center gap-2 px-6 py-3 bg-[#14E8B4] hover:bg-[#20F0C0] text-[#04231B] font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            <CheckCircle className="w-5 h-5" />
            Complete Installation
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-[#F5514B]/10 border border-[#F5514B] rounded-lg text-[#F5514B] text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}

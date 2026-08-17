import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, User, MapPin, DollarSign, Package, Calendar, Eye, ArrowRight, Clock, Receipt } from 'lucide-react';
import { connectionsApi } from '../services/api';

interface ApprovedConnection {
  id: string;
  customerId?: string | null;
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
  status: 'approved' | 'installed' | 'active';
  createdAt: number;
}

export default function ConnectionsApproved() {
  const navigate = useNavigate();
  const [connections, setConnections] = useState<ApprovedConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewError, setViewError] = useState('');

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    setLoading(true);
    setError('');
    const result = await connectionsApi.getAll();
    if (result.success) {
      const data = result.data;
      const dataArray = Array.isArray(data) ? data : (data?.data || []);
      setConnections(dataArray);
    } else {
      setError(result.error || 'Failed to load connections');
    }
    setLoading(false);
  };

  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'installed' | 'active'>('all');

  const filteredConnections = connections.filter(conn => 
    (filterStatus === 'all' && ['approved', 'installed', 'active'].includes(conn.status)) || conn.status === filterStatus
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-[#4C8DFF]/20 text-[#4C8DFF]';
      case 'installed': return 'bg-[#F6B93B]/20 text-[#F6B93B]';
      case 'active': return 'bg-[#14E8B4]/20 text-[#14E8B4]';
      default: return 'bg-[#8996AD]/20 text-[#8996AD]';
    }
  };

  const handleView = (conn: ApprovedConnection) => {
    if (!conn.customerId) {
      setViewError('No linked customer record for this connection. The customer may have been created before the linking feature was added.');
      window.setTimeout(() => setViewError(''), 6000);
      return;
    }
    navigate(`/customers/profile/${conn.customerId}`);
  };

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
      {viewError && (
        <div className="flex items-center justify-between bg-[#F6B93B]/10 border border-[#F6B93B]/30 rounded-lg px-4 py-3">
          <p className="text-[#F6B93B] text-sm">{viewError}</p>
          <button onClick={() => setViewError('')} className="text-[#F6B93B] hover:text-[#EAF0FB] text-lg leading-none">&times;</button>
        </div>
      )}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#EAF0FB]">Approved Connections</h2>
        <div className="flex items-center gap-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="installed">Installed</option>
            <option value="active">Active</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-[#14E8B4]" />
            <div>
              <div className="text-2xl font-bold text-[#EAF0FB]">{connections.length}</div>
              <div className="text-sm text-[#8996AD]">Total Approved</div>
            </div>
          </div>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-[#F6B93B]" />
            <div>
              <div className="text-2xl font-bold text-[#EAF0FB]">{connections.filter(c => c.status === 'installed').length}</div>
              <div className="text-sm text-[#8996AD]">Pending Installation</div>
            </div>
          </div>
        </div>
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-[#4C8DFF]" />
            <div>
              <div className="text-2xl font-bold text-[#EAF0FB]">{connections.filter(c => c.status === 'active').length}</div>
              <div className="text-sm text-[#8996AD]">Now Active</div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredConnections.map((connection) => (
          <div key={connection.id} className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6 hover:border-[#4C8DFF] transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#14E8B4] to-[#0E9E7B] flex items-center justify-center font-bold text-[#04231B] text-lg">
                  {connection.customerName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#EAF0FB]">{connection.customerName}</h3>
                  <div className="flex items-center gap-2 mt-2 text-xs text-[#5C6B85]">
                    <CheckCircle className="w-3 h-3" />
                    Created: {new Date(connection.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-[#5C6B85]">
                    <span>Phone: {connection.phone}</span>
                  </div>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(connection.status)}`}>
                {connection.status.charAt(0).toUpperCase() + connection.status.slice(1)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Package className="w-4 h-4 text-[#4C8DFF]" />
                <span className="text-[#8996AD]">Package:</span>
                <span className="text-[#EAF0FB] font-medium">{connection.package}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-[#4C8DFF]" />
                <span className="text-[#8996AD]">Area:</span>
                <span className="text-[#EAF0FB] font-medium">{connection.area}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-[#4C8DFF]" />
                <span className="text-[#8996AD]">Installation:</span>
                <span className="text-[#EAF0FB] font-medium">{connection.installationDate ? new Date(connection.installationDate).toLocaleDateString() : 'Not scheduled'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-[#4C8DFF]" />
                <span className="text-[#8996AD]">Connection Fee:</span>
                <span className="text-[#EAF0FB] font-medium">Rs. {connection.connectionFee}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-[#4C8DFF]" />
                <span className="text-[#8996AD]">Monthly Fee:</span>
                <span className="text-[#EAF0FB] font-medium">Rs. {connection.monthlyFee}</span>
              </div>
            </div>

            {connection.expenses && connection.expenses.length > 0 && (
              <div className="mb-4 p-3 bg-[#1B2540] border border-[#232D45] rounded-lg">
                <div className="flex items-center gap-2 text-sm text-[#8996AD] mb-2">
                  <Receipt className="w-4 h-4" />
                  <span className="font-medium">Expenses ({connection.expenses.length}):</span>
                </div>
                <div className="space-y-2">
                  {connection.expenses.map((expense, idx) => (
                    <div key={idx} className="text-xs text-[#EAF0FB]">
                      <span className="text-[#14E8B4]">Rs. {expense.amount}</span> - {expense.category} {expense.inventoryItems && `(${expense.inventoryItems})`}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {connection.notes && (
              <div className="mb-4 p-3 bg-[#1B2540] border border-[#232D45] rounded-lg">
                <div className="flex items-center gap-2 text-sm text-[#8996AD]">
                  <span className="font-medium">Notes:</span>
                  <span className="text-[#EAF0FB]">{connection.notes}</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-[#232D45]">
              <button
                onClick={() => handleView(connection)}
                className="flex items-center gap-2 px-4 py-2 bg-[#14E8B4] text-[#04231B] font-semibold rounded-lg hover:bg-[#20F0C0] transition-colors"
              >
                <Eye className="w-4 h-4" />
                View Customer
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

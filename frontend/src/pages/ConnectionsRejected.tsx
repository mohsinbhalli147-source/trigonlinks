import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, MapPin, DollarSign, Package, AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';
import { connectionsApi } from '../services/api';

interface RejectedConnection {
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
  rejectionReason: string;
  status: 'rejected';
  createdAt: number;
}

export default function ConnectionsRejected() {
  const navigate = useNavigate();
  const [connections, setConnections] = useState<RejectedConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      setConnections(dataArray.filter((conn: any) => conn.status === 'rejected'));
    } else {
      setError(result.error || 'Failed to load connections');
    }
    setLoading(false);
  };

  const handleResubmit = (id: string) => {
    navigate(`/connections/add?resubmit=${id}`);
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#EAF0FB]">Rejected Connections</h2>
        <div className="flex items-center gap-2 px-4 py-2 bg-[#F5514B]/10 border border-[#F5514B] rounded-lg">
          <XCircle className="w-5 h-5 text-[#F5514B]" />
          <span className="text-[#F5514B] font-semibold">{connections.length} Rejected</span>
        </div>
      </div>

      {connections.length === 0 ? (
        <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-12 text-center">
          <CheckCircle className="w-16 h-16 text-[#14E8B4] mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-[#EAF0FB] mb-2">No Rejected Requests</h3>
          <p className="text-[#8996AD]">All connection requests have been processed successfully.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {connections.map((connection) => (
            <div key={connection.id} className="bg-[#121B2E] border border-[#F5514B]/30 rounded-xl p-6 hover:border-[#F5514B] transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F5514B] to-[#E6403A] flex items-center justify-center font-bold text-white text-lg">
                    {connection.customerName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#EAF0FB]">{connection.customerName}</h3>
                    <div className="flex items-center gap-2 mt-2 text-xs text-[#5C6B85]">
                      <XCircle className="w-3 h-3 text-[#F5514B]" />
                      Rejected: {new Date(connection.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#F5514B]/20 text-[#F5514B]">
                  Rejected
                </span>
              </div>

              {connection.notes && (
                <div className="mb-4 p-4 bg-[#F5514B]/10 border border-[#F5514B] rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-[#F5514B] mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-[#F5514B] mb-1">Notes</p>
                      <p className="text-sm text-[#EAF0FB]">{connection.notes}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#232D45]">
                <div className="flex items-center gap-2 text-xs text-[#5C6B85]">
                  <span>Rejected on: {new Date(connection.createdAt).toLocaleDateString()}</span>
                </div>
                <button
                  onClick={() => handleResubmit(connection.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#4C8DFF] text-white font-semibold rounded-lg hover:bg-[#3B7BD9] transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Resubmit Request
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

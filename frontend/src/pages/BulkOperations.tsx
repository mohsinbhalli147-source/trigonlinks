import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { customersApi, customersAdvancedApi } from '../services/api';
import { 
  Users, 
  CheckSquare, 
  Square, 
  Play, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Download,
  RefreshCw,
  Filter,
  Search,
  X,
  ChevronDown,
  Package,
  CreditCard,
  MessageSquare,
  Share2,
  Power,
  Zap
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  mobile: string;
  area: string;
  status: string;
  package: string;
  fee: number;
}

interface BulkOperation {
  id: string;
  operation_type: string;
  status: string;
  total_count: number;
  success_count: number;
  failure_count: number;
  created_at: number;
  operation_config: any;
}

export default function BulkOperations() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [operationLoading, setOperationLoading] = useState(false);
  const [operationType, setOperationType] = useState<string>('');
  const [operationConfig, setOperationConfig] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [recentOperations, setRecentOperations] = useState<BulkOperation[]>([]);
  const [showOperationModal, setShowOperationModal] = useState(false);
  const [operationResults, setOperationResults] = useState<any>(null);

  useEffect(() => {
    loadCustomers();
    loadRecentOperations();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await customersApi.getAll();
      setCustomers(res.data);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentOperations = async () => {
    try {
      const res = await customersAdvancedApi.getBulkOperations();
      setRecentOperations(res.data);
    } catch (error) {
      console.error('Error loading operations:', error);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.mobile.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || customer.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const toggleCustomerSelection = (customerId: string) => {
    const newSelection = new Set(selectedCustomers);
    if (newSelection.has(customerId)) {
      newSelection.delete(customerId);
    } else {
      newSelection.add(customerId);
    }
    setSelectedCustomers(newSelection);
  };

  const toggleAllCustomers = () => {
    if (selectedCustomers.size === filteredCustomers.length) {
      setSelectedCustomers(new Set());
    } else {
      setSelectedCustomers(new Set(filteredCustomers.map(c => c.id)));
    }
  };

  const executeOperation = async () => {
    if (selectedCustomers.size === 0) {
      alert('Please select at least one customer');
      return;
    }

    try {
      setOperationLoading(true);
      const customerIds = Array.from(selectedCustomers);

      let response;
      switch (operationType) {
        case 'suspend':
          response = await customersAdvancedApi.bulkSuspend({
            customer_ids: customerIds,
            reason: operationConfig.reason || 'Bulk suspend operation'
          });
          break;
        case 'activate':
          response = await customersAdvancedApi.bulkActivate({
            customer_ids: customerIds,
            reason: operationConfig.reason || 'Bulk activate operation'
          });
          break;
        case 'package_change':
          response = await customersAdvancedApi.bulkPackageChange({
            customer_ids: customerIds,
            new_package_id: operationConfig.new_package_id,
            reason: operationConfig.reason || 'Bulk package change operation'
          });
          break;
        case 'billing':
          response = await customersAdvancedApi.bulkBilling({
            customer_ids: customerIds,
            billing_month: operationConfig.billing_month || new Date().getMonth() + 1,
            billing_year: operationConfig.billing_year || new Date().getFullYear()
          });
          break;
        case 'sms':
          response = await customersAdvancedApi.bulkSMS({
            customer_ids: customerIds,
            message: operationConfig.message
          });
          break;
        case 'whatsapp':
          response = await customersAdvancedApi.bulkWhatsApp({
            customer_ids: customerIds,
            message: operationConfig.message
          });
          break;
        default:
          throw new Error('Invalid operation type');
      }

      setOperationResults(response.data);
      setShowOperationModal(false);
      setSelectedCustomers(new Set());
      setOperationType('');
      setOperationConfig({});
      loadRecentOperations();
      loadCustomers();
    } catch (error: any) {
      console.error('Error executing operation:', error);
      alert(error.response?.data?.error || 'Operation failed');
    } finally {
      setOperationLoading(false);
    }
  };

  const operationTypes = [
    { id: 'suspend', label: 'Suspend Customers', icon: Power, color: 'red', description: 'Suspend selected customers' },
    { id: 'activate', label: 'Activate Customers', icon: Zap, color: 'green', description: 'Activate selected customers' },
    { id: 'package_change', label: 'Change Package', icon: Package, color: 'blue', description: 'Change package for selected customers' },
    { id: 'billing', label: 'Generate Bills', icon: CreditCard, color: 'purple', description: 'Generate bills for selected customers' },
    { id: 'sms', label: 'Send SMS', icon: MessageSquare, color: 'orange', description: 'Send SMS to selected customers' },
    { id: 'whatsapp', label: 'Send WhatsApp', icon: Share2, color: 'green', description: 'Send WhatsApp message to selected customers' }
  ];

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    suspended: 'bg-red-100 text-red-800',
    'on-leave': 'bg-yellow-100 text-yellow-800'
  };

  const operationStatusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Bulk Operations</h1>
          <p className="text-gray-600 mt-1">Perform operations on multiple customers at once</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Selected</p>
                <p className="text-2xl font-bold text-gray-900">{selectedCustomers.size}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
              </div>
              <Users className="w-8 h-8 text-gray-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Recent Operations</p>
                <p className="text-2xl font-bold text-gray-900">{recentOperations.length}</p>
              </div>
              <RefreshCw className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Status</p>
                <p className="text-2xl font-bold text-green-600">{customers.filter(c => c.status === 'active').length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Operation Selection */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Select Operation Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {operationTypes.map((op) => {
              const Icon = op.icon;
              return (
                <button
                  key={op.id}
                  onClick={() => {
                    setOperationType(op.id);
                    setShowOperationModal(true);
                  }}
                  disabled={selectedCustomers.size === 0}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedCustomers.size === 0
                      ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                      : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg bg-${op.color}-100`}>
                      <Icon className={`w-5 h-5 text-${op.color}-600`} />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{op.label}</p>
                      <p className="text-sm text-gray-500">{op.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Customer Selection */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Select Customers</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleAllCustomers}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                {selectedCustomers.size === filteredCustomers.length ? (
                  <>
                    <CheckSquare className="w-4 h-4" />
                    <span>Deselect All</span>
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4" />
                    <span>Select All</span>
                  </>
                )}
              </button>
              <button
                onClick={loadCustomers}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="on-leave">On Leave</option>
            </select>
          </div>

          {/* Customer List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedCustomers.size === filteredCustomers.length && filteredCustomers.length > 0}
                        onChange={toggleAllCustomers}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Package</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className={`hover:bg-gray-50 cursor-pointer ${
                        selectedCustomers.has(customer.id) ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => toggleCustomerSelection(customer.id)}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedCustomers.has(customer.id)}
                          onChange={() => toggleCustomerSelection(customer.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{customer.name}</td>
                      <td className="px-4 py-3 text-gray-600">{customer.mobile}</td>
                      <td className="px-4 py-3 text-gray-600">{customer.area}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[customer.status as keyof typeof statusColors]}`}>
                          {customer.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{customer.package}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredCustomers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No customers found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recent Operations */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Operations</h2>
          {recentOperations.length > 0 ? (
            <div className="space-y-3">
              {recentOperations.slice(0, 5).map((operation) => (
                <div key={operation.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${
                      operation.operation_type === 'suspend' ? 'bg-red-100' :
                      operation.operation_type === 'activate' ? 'bg-green-100' :
                      operation.operation_type === 'package_change' ? 'bg-blue-100' :
                      operation.operation_type === 'billing' ? 'bg-purple-100' :
                      'bg-gray-100'
                    }`}>
                      {operation.operation_type === 'suspend' && <Power className="w-5 h-5 text-red-600" />}
                      {operation.operation_type === 'activate' && <Zap className="w-5 h-5 text-green-600" />}
                      {operation.operation_type === 'package_change' && <Package className="w-5 h-5 text-blue-600" />}
                      {operation.operation_type === 'billing' && <CreditCard className="w-5 h-5 text-purple-600" />}
                      {operation.operation_type === 'sms' && <MessageSquare className="w-5 h-5 text-orange-600" />}
                      {operation.operation_type === 'whatsapp' && <Share2 className="w-5 h-5 text-green-600" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 capitalize">{operation.operation_type.replace('_', ' ')}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(operation.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {operation.success_count} / {operation.total_count} successful
                      </p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${operationStatusColors[operation.status as keyof typeof operationStatusColors]}`}>
                        {operation.status}
                      </span>
                    </div>
                    <button
                      onClick={async () => {
                        const results = await customersAdvancedApi.getBulkOperationResults(operation.id);
                        setOperationResults(results.data);
                      }}
                      className="p-2 hover:bg-gray-200 rounded"
                    >
                      <Download className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No recent operations
            </div>
          )}
        </div>

        {/* Operation Modal */}
        {showOperationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Configure Operation</h3>
                  <button
                    onClick={() => setShowOperationModal(false)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {operationType === 'suspend' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Suspension</label>
                      <textarea
                        value={operationConfig.reason || ''}
                        onChange={(e) => setOperationConfig({ ...operationConfig, reason: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="Enter reason for suspension..."
                      />
                    </div>
                  )}

                  {operationType === 'activate' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Activation</label>
                      <textarea
                        value={operationConfig.reason || ''}
                        onChange={(e) => setOperationConfig({ ...operationConfig, reason: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="Enter reason for activation..."
                      />
                    </div>
                  )}

                  {operationType === 'package_change' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">New Package</label>
                        <input
                          type="text"
                          value={operationConfig.new_package_id || ''}
                          onChange={(e) => setOperationConfig({ ...operationConfig, new_package_id: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter new package ID..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                        <textarea
                          value={operationConfig.reason || ''}
                          onChange={(e) => setOperationConfig({ ...operationConfig, reason: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows={2}
                          placeholder="Enter reason for package change..."
                        />
                      </div>
                    </>
                  )}

                  {operationType === 'billing' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Billing Month</label>
                        <input
                          type="number"
                          min="1"
                          max="12"
                          value={operationConfig.billing_month || new Date().getMonth() + 1}
                          onChange={(e) => setOperationConfig({ ...operationConfig, billing_month: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Billing Year</label>
                        <input
                          type="number"
                          value={operationConfig.billing_year || new Date().getFullYear()}
                          onChange={(e) => setOperationConfig({ ...operationConfig, billing_year: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </>
                  )}

                  {(operationType === 'sms' || operationType === 'whatsapp') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                      <textarea
                        value={operationConfig.message || ''}
                        onChange={(e) => setOperationConfig({ ...operationConfig, message: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={4}
                        placeholder="Enter your message..."
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t">
                    <p className="text-sm text-gray-500">
                      {selectedCustomers.size} customer(s) selected
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setShowOperationModal(false)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={executeOperation}
                        disabled={operationLoading}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {operationLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            <span>Execute</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Modal */}
        {operationResults && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Operation Results</h3>
                  <button
                    onClick={() => setOperationResults(null)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{operationResults.successCount}</p>
                    <p className="text-sm text-green-600">Successful</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-red-600">{operationResults.failureCount}</p>
                    <p className="text-sm text-red-600">Failed</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{operationResults.operation.total_count}</p>
                    <p className="text-sm text-blue-600">Total</p>
                  </div>
                </div>

                <div className="text-center">
                  <button
                    onClick={() => setOperationResults(null)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

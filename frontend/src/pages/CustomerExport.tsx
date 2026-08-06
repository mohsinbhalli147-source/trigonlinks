import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { customersAdvancedApi } from '../services/api';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Filter, 
  CheckSquare, 
  Square, 
  Search,
  X,
  RefreshCw,
  Users,
  Package,
  MapPin
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  area: string;
  status: string;
  package: string;
  fee: number;
}

export default function CustomerExport() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'pdf'>('csv');
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'name', 'mobile', 'email', 'area', 'status', 'package', 'fee'
  ]);

  const availableFields = [
    { id: 'name', label: 'Name' },
    { id: 'mobile', label: 'Mobile' },
    { id: 'email', label: 'Email' },
    { id: 'address', label: 'Address' },
    { id: 'area', label: 'Area' },
    { id: 'status', label: 'Status' },
    { id: 'package', label: 'Package' },
    { id: 'fee', label: 'Monthly Fee' },
    { id: 'cnic', label: 'CNIC' },
    { id: 'install_date', label: 'Install Date' },
    { id: 'billing_date', label: 'Billing Date' }
  ];

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await customersAdvancedApi.search({
        search_term: searchTerm,
        status: filterStatus === 'all' ? undefined : filterStatus,
        page: 1,
        limit: 1000
      });
      setCustomers(res.data.data);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadCustomers();
  }, [searchTerm, filterStatus]);

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
    if (selectedCustomers.size === customers.length) {
      setSelectedCustomers(new Set());
    } else {
      setSelectedCustomers(new Set(customers.map(c => c.id)));
    }
  };

  const toggleField = (fieldId: string) => {
    if (selectedFields.includes(fieldId)) {
      setSelectedFields(selectedFields.filter(f => f !== fieldId));
    } else {
      setSelectedFields([...selectedFields, fieldId]);
    }
  };

  const handleExport = async () => {
    const customerIds = selectedCustomers.size > 0 ? Array.from(selectedCustomers) : customers.map(c => c.id);
    
    if (customerIds.length === 0) {
      alert('No customers to export');
      return;
    }

    try {
      setExportLoading(true);
      
      let response;
      if (exportFormat === 'csv') {
        response = await customersAdvancedApi.exportCSV({ customer_ids: customerIds, fields: selectedFields });
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `customers-export-${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else if (exportFormat === 'excel') {
        response = await customersAdvancedApi.exportExcel({ customer_ids: customerIds, fields: selectedFields });
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `customers-export-${Date.now()}.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else if (exportFormat === 'pdf') {
        response = await customersAdvancedApi.exportPDF({ customer_ids: customerIds });
        if (response.data.success === false) {
          alert(response.data.message);
          return;
        }
      }
      
      alert('Export completed successfully');
    } catch (error: any) {
      console.error('Error exporting:', error);
      alert('Export failed');
    } finally {
      setExportLoading(false);
    }
  };

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    suspended: 'bg-red-100 text-red-800',
    'on-leave': 'bg-yellow-100 text-yellow-800'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Export Customers</h1>
          <p className="text-gray-600 mt-1">Export customer data to CSV, Excel, or PDF</p>
        </div>

        {/* Export Configuration */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Export Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
              <div className="flex space-x-4">
                <button
                  onClick={() => setExportFormat('csv')}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all ${
                    exportFormat === 'csv'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={() => setExportFormat('excel')}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all ${
                    exportFormat === 'excel'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  <span>Excel (JSON)</span>
                </button>
                <button
                  onClick={() => setExportFormat('pdf')}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all ${
                    exportFormat === 'pdf'
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-red-300'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  <span>PDF</span>
                </button>
              </div>
            </div>

            {/* Field Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fields to Export</label>
              <div className="grid grid-cols-2 gap-2">
                {availableFields.map((field) => (
                  <button
                    key={field.id}
                    onClick={() => toggleField(field.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all ${
                      selectedFields.includes(field.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {selectedFields.includes(field.id) ? (
                      <CheckSquare className="w-4 h-4 text-blue-500" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-sm">{field.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Export Button */}
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {selectedCustomers.size > 0
                ? `${selectedCustomers.size} customer(s) selected`
                : `${customers.length} customer(s) will be exported`}
            </p>
            <button
              onClick={handleExport}
              disabled={exportLoading || customers.length === 0}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {exportLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Export</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Customer Selection */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Select Customers</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleAllCustomers}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                {selectedCustomers.size === customers.length ? (
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
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedCustomers.size === customers.length && customers.length > 0}
                        onChange={toggleAllCustomers}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Package</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers.map((customer) => (
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
                      <td className="px-4 py-3 text-gray-600">Rs. {customer.fee}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {customers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No customers found
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

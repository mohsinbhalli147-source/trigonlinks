import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit, Trash2, Filter, Eye, Printer, Power, Calendar, Download } from 'lucide-react';
import { customersApi } from '../services/api';
import { toast } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';

interface Customer {
  id: string;
  name: string;
  fatherName?: string;
  username?: string;
  mobile: string;
  cnic?: string;
  email?: string;
  address?: string;
  fee: number;
  status: 'active' | 'suspended' | 'inactive' | 'on-leave';
  package: string;
  area: string;
  created_at: number;
}

export default function CustomersAll() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended' | 'inactive'>('all');
  const [filterDate, setFilterDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);

  useEffect(() => {
    loadCustomers(1);
  }, []);

  const loadCustomers = async (requestedPage: number = 1) => {
    setLoading(true);
    setError('');
    const result = await customersApi.getAll({
      page: requestedPage.toString(),
      limit: '50',
    });
    if (result.success) {
      const payload = result.data?.data || result.data || [];
      setCustomers(payload);
      setTotalCustomers(result.data?.pagination?.total || payload.length);
      setTotalPages(result.data?.pagination?.totalPages || 1);
      setPage(requestedPage);
    } else {
      setError(result.error || 'Failed to load customers');
    }
    setLoading(false);
  };

  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      customer.name.toLowerCase().includes(searchLower) ||
      (customer.fatherName && customer.fatherName.toLowerCase().includes(searchLower)) ||
      (customer.username && customer.username.toLowerCase().includes(searchLower)) ||
      customer.mobile.includes(searchTerm) ||
      (customer.cnic && customer.cnic.includes(searchTerm)) ||
      customer.package.toLowerCase().includes(searchLower) ||
      customer.area.toLowerCase().includes(searchLower);
    const matchesFilter = filterStatus === 'all' || customer.status === filterStatus;
    const matchesDate = !filterDate || (
      customer.created_at &&
      new Date(customer.created_at).toISOString().split('T')[0] === filterDate
    );
    return matchesSearch && matchesFilter && matchesDate;
  });

  const handleDelete = async (id: string) => {
    // Only admin can delete customers
    if (user?.role !== 'admin') {
      toast.error('Only administrators can delete customers');
      return;
    }

    if (confirm('Are you sure you want to delete this customer?')) {
      const result = await customersApi.delete(id);
      if (result.success) {
        loadCustomers();
      } else {
        toast.error(result.error || 'Failed to delete customer');
      }
    }
  };

  const handlePrint = async (id: string) => {
    // Navigate to customer profile with print parameter
    navigate(`/customers/profile/${id}?print=true`);
  };

  const handleActivate = async (id: string) => {
    const result = await customersApi.update(id, { status: 'active' });
    if (result.success) {
      toast.success('Customer activated successfully');
      loadCustomers();
    } else {
      toast.error(result.error || 'Failed to activate customer');
    }
  };

  const handleExportPDF = () => {
    const printContent = `
      <html>
        <head>
          <title>Customer List</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f4f4f4; }
            .status-active { color: green; }
            .status-suspended { color: red; }
            .status-inactive { color: purple; }
          </style>
        </head>
        <body>
          <h1>Customer List</h1>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Mobile</th>
                <th>Package</th>
                <th>Area</th>
                <th>Fee</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredCustomers.map(c => `
                <tr>
                  <td>${c.name}</td>
                  <td>${c.mobile}</td>
                  <td>${c.package}</td>
                  <td>${c.area}</td>
                  <td>Rs. ${c.fee}</td>
                  <td class="status-${c.status}">${c.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleExportExcel = () => {
    const headers = ['Name', 'Mobile', 'Package', 'Area', 'Fee', 'Status'];
    const rows = filteredCustomers.map(c => [
      c.name,
      c.mobile,
      c.package,
      c.area,
      c.fee,
      c.status
    ]);

    // Create Excel-compatible CSV with proper formatting
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `customers_${new Date().toISOString().split('T')[0]}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8996AD]">Loading customers...</div>
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
        <h2 className="text-xl font-semibold text-[#EAF0FB]">All Users</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-[#8B5CF6] text-white font-semibold rounded-lg hover:bg-[#7C3AED] transition-colors"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-[#4C8DFF] text-white font-semibold rounded-lg hover:bg-[#3B7BD9] transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => navigate('/customers/add')}
            className="flex items-center gap-2 px-4 py-2 bg-[#14E8B4] text-[#04231B] font-semibold rounded-lg hover:bg-[#20F0C0] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </button>
        </div>
      </div>

      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#5C6B85]" />
            <input
              type="text"
              placeholder="Search by name, mobile, CNIC, package, area..."
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
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#5C6B85]" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#232D45]">
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Mobile</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Package</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Area</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Fee</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#8996AD]">Status</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-[#8996AD]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="border-b border-[#232D45] hover:bg-[#1B2540]/50">
                  <td className="py-3 px-4 text-sm text-[#EAF0FB]">{customer.name}</td>
                  <td className="py-3 px-4 text-sm text-[#8996AD]">{customer.mobile}</td>
                  <td className="py-3 px-4 text-sm text-[#EAF0FB]">{customer.package}</td>
                  <td className="py-3 px-4 text-sm text-[#8996AD]">{customer.area}</td>
                  <td className="py-3 px-4 text-sm text-[#EAF0FB]">Rs. {customer.fee}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      customer.status === 'active'
                        ? 'bg-[#14E8B4]/10 text-[#14E8B4]'
                        : customer.status === 'suspended'
                        ? 'bg-[#F5514B]/10 text-[#F5514B]'
                        : 'bg-[#8B5CF6]/10 text-[#8B5CF6]'
                    }`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {customer.status === 'inactive' && (
                        <button
                          onClick={() => handleActivate(customer.id)}
                          className="p-2 text-[#8996AD] hover:text-[#14E8B4] hover:bg-[#232D45] rounded-lg transition-colors"
                          title="Activate Customer"
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/customers/profile/${customer.id}`)}
                        className="p-2 text-[#8996AD] hover:text-[#EAF0FB] hover:bg-[#232D45] rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/customers/edit/${customer.id}`)}
                        className="p-2 text-[#8996AD] hover:text-[#EAF0FB] hover:bg-[#232D45] rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handlePrint(customer.id)}
                        className="p-2 text-[#8996AD] hover:text-[#14E8B4] hover:bg-[#232D45] rounded-lg transition-colors"
                        title="Print Customer Details"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(customer.id)}
                        className="p-2 text-[#8996AD] hover:text-[#F5514B] hover:bg-[#232D45] rounded-lg transition-colors"
                        title={user?.role !== 'admin' ? 'Only admins can delete' : ''}
                        disabled={user?.role !== 'admin'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#5C6B85]">
                    No customers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col gap-2 text-sm text-[#5C6B85] md:flex-row md:items-center md:justify-between">
          <div>Showing {filteredCustomers.length} of {customers.length} customers on this page</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadCustomers(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-2 rounded-lg border border-[#232D45] bg-[#151B29] text-[#EAF0FB] disabled:opacity-40"
            >
              Previous
            </button>
            <span>Page {page} / {totalPages}</span>
            <button
              onClick={() => loadCustomers(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-2 rounded-lg border border-[#232D45] bg-[#151B29] text-[#EAF0FB] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

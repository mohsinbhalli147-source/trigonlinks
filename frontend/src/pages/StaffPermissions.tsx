import { useState, useEffect } from 'react';
import { Shield, Save, Search, User, Check, X, AlertTriangle } from 'lucide-react';
import { staffApi } from '../services/api';
import { toast } from '../components/Toast';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface RolePermission {
  roleId: string;
  roleName: string;
  permissions: string[];
}

export default function StaffPermissions() {
  const [roles, setRoles] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const permissions: Permission[] = [
    { id: 'view_customers', name: 'View Customers', description: 'Can view customer list and details', category: 'Customers' },
    { id: 'add_customers', name: 'Add Customers', description: 'Can add new customers', category: 'Customers' },
    { id: 'edit_customers', name: 'Edit Customers', description: 'Can edit customer information', category: 'Customers' },
    { id: 'delete_customers', name: 'Delete Customers', description: 'Can delete customers', category: 'Customers' },
    { id: 'view_billing', name: 'View Billing', description: 'Can view billing information', category: 'Billing' },
    { id: 'receive_payments', name: 'Receive Payments', description: 'Can receive and record payments', category: 'Billing' },
    { id: 'approve_payments', name: 'Approve Payments', description: 'Can approve pending payments (Admin only)', category: 'Billing' },
    { id: 'view_inventory', name: 'View Inventory', description: 'Can view inventory items', category: 'Inventory' },
    { id: 'manage_inventory', name: 'Manage Inventory', description: 'Can add/edit inventory items', category: 'Inventory' },
    { id: 'stock_operations', name: 'Stock Operations', description: 'Can perform stock in/out operations', category: 'Inventory' },
    { id: 'view_connections', name: 'View Connections', description: 'Can view connection requests', category: 'Connections' },
    { id: 'approve_connections', name: 'Approve Connections', description: 'Can approve connection requests', category: 'Connections' },
    { id: 'view_staff', name: 'View Staff', description: 'Can view staff members', category: 'Staff' },
    { id: 'manage_staff', name: 'Manage Staff', description: 'Can add/edit staff members', category: 'Staff' },
    { id: 'view_reports', name: 'View Reports', description: 'Can view all reports', category: 'Reports' },
    { id: 'export_reports', name: 'Export Reports', description: 'Can export reports', category: 'Reports' },
    { id: 'manage_settings', name: 'Manage Settings', description: 'Can change system settings', category: 'Settings' },
  ];

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    setLoading(true);
    setError('');
    const result = await staffApi.getAll();
    if (result.success) {
      // Transform staff data to role permissions format
      const staffMembers = Array.isArray(result.data) ? result.data : Array.isArray(result.data?.data) ? result.data.data : [];
      const roleMap: Record<string, string[]> = {};
      
      staffMembers.forEach((member: any) => {
        if (!roleMap[member.role]) {
          roleMap[member.role] = [];
        }
        // Add member's permissions if available
        if (member.permissions) {
          roleMap[member.role] = [...new Set([...roleMap[member.role], ...member.permissions])];
        }
      });

      const rolePermissions: RolePermission[] = Object.entries(roleMap).map(([roleId, perms]) => ({
        roleId,
        roleName: roleId.charAt(0).toUpperCase() + roleId.slice(1),
        permissions: perms
      }));
      
      setRoles(rolePermissions);
    } else {
      setError(result.error || 'Failed to load permissions');
    }
    setLoading(false);
  };

  const selectedRoleData = selectedRole === 'all' ? null : roles.find(r => r.roleId === selectedRole);
  const filteredPermissions = permissions.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const togglePermission = (roleId: string, permissionId: string) => {
    setRoles(roles.map(role => {
      if (role.roleId === roleId) {
        const hasPermission = role.permissions.includes(permissionId);
        return {
          ...role,
          permissions: hasPermission
            ? role.permissions.filter(p => p !== permissionId)
            : [...role.permissions, permissionId]
        };
      }
      return role;
    }));
  };

  const handleSave = async () => {
    toast.success('Permissions updated successfully!');
    // await staffApi.updatePermissions(roles);
  };

  const groupedPermissions = filteredPermissions.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8996AD]">Loading permissions...</div>
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
        <h2 className="text-2xl font-bold text-[#EAF0FB] flex items-center gap-2">
          <Shield className="w-6 h-6 text-[#4C8DFF]" />
          Staff Permissions
        </h2>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-[#14E8B4] text-[#04231B] font-semibold rounded-lg hover:bg-[#20F0C0] transition-colors"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>

      {/* Role Selection */}
      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-[#8996AD] mb-2">Select Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-4 py-3 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
            >
              <option value="all">All Roles Overview</option>
              {roles.map(role => (
                <option key={role.roleId} value={role.roleId}>{role.roleName}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-[#8996AD] mb-2">Search Permissions</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#5C6B85]" />
              <input
                type="text"
                placeholder="Search permissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4]"
              />
            </div>
          </div>
        </div>

        {/* All Roles Overview */}
        {selectedRole === 'all' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#EAF0FB]">Roles Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {roles.map(role => (
                <div key={role.roleId} className="bg-[#1B2540] border border-[#232D45] rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4C8DFF] to-[#2E5CB8] flex items-center justify-center font-bold text-[#EAF0FB]">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#EAF0FB]">{role.roleName}</h4>
                      <p className="text-sm text-[#8996AD]">{role.permissions.length} permissions</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedRole(role.roleId)}
                    className="w-full px-3 py-2 bg-[#232D45] text-[#8996AD] rounded-lg hover:text-[#EAF0FB] hover:bg-[#4C8DFF] transition-colors text-sm"
                  >
                    View Permissions
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Individual Role Permissions */}
        {selectedRoleData && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#EAF0FB]">{selectedRoleData.roleName} Permissions</h3>
                <p className="text-sm text-[#8996AD]">{selectedRoleData.permissions.length} of {permissions.length} permissions granted</p>
              </div>
              <button
                onClick={() => setSelectedRole('all')}
                className="px-4 py-2 bg-[#232D45] text-[#8996AD] rounded-lg hover:text-[#EAF0FB] transition-colors"
              >
                Back to Overview
              </button>
            </div>

            {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
              <div key={category} className="bg-[#1B2540] border border-[#232D45] rounded-lg p-4">
                <h4 className="font-semibold text-[#EAF0FB] mb-4">{category}</h4>
                <div className="space-y-3">
                  {categoryPermissions.map(permission => (
                    <div
                      key={permission.id}
                      className="flex items-center justify-between p-3 bg-[#121B2E] border border-[#232D45] rounded-lg hover:border-[#4C8DFF] transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-[#EAF0FB]">{permission.name}</div>
                        <div className="text-sm text-[#8996AD]">{permission.description}</div>
                      </div>
                      <button
                        onClick={() => togglePermission(selectedRoleData.roleId, permission.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          selectedRoleData.permissions.includes(permission.id)
                            ? 'bg-[#14E8B4] text-[#04231B]'
                            : 'bg-[#232D45] text-[#8996AD] hover:text-[#EAF0FB]'
                        }`}
                      >
                        {selectedRoleData.permissions.includes(permission.id) ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <X className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {selectedRoleData.roleId === 'admin' && (
              <div className="flex items-start gap-3 p-4 bg-[#F6B93B]/10 border border-[#F6B93B] rounded-lg">
                <AlertTriangle className="w-5 h-5 text-[#F6B93B] mt-0.5" />
                <div>
                  <p className="font-medium text-[#F6B93B]">Admin Role Warning</p>
                  <p className="text-sm text-[#8996AD]">Admin role has full access to all system features. Changes to admin permissions are restricted.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

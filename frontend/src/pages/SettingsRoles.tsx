import { useState, useEffect } from 'react';
import { Plus, Shield, Edit, Trash2, Check, X } from 'lucide-react';
import axios from 'axios';
import { settingsApi } from '../services/api';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
}

export default function SettingsRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const result = await settingsApi.getRoles();
      if (result.success) {
        setRoles(Array.isArray(result.data) ? result.data : []);
      } else {
        setError(result.error || 'Failed to load roles');
      }
    } catch (error: any) {
      console.error('Error fetching roles:', error);
      setError('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const permissionLabels: Record<string, string> = {
    view: 'View',
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    approve: 'Approve',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8996AD]">Loading roles...</div>
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
        <h1 className="text-2xl font-bold text-[#EAF0FB]">Roles & Permissions</h1>
        <button className="px-4 py-2 bg-[#4C8DFF] text-white rounded-lg hover:bg-[#3B7BD9] transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Role
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <div key={role.id} className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#4C8DFF]/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[#4C8DFF]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#EAF0FB]">{role.name}</h3>
                  <p className="text-sm text-[#8996AD]">{role.description}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-[#232D45] rounded-lg transition-colors">
                  <Edit className="w-4 h-4 text-[#8996AD]" />
                </button>
                <button className="p-2 hover:bg-[#232D45] rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4 text-[#F5514B]" />
                </button>
              </div>
            </div>

            <div className="mb-4">
              <div className="text-sm text-[#8996AD] mb-2">Permissions</div>
              <div className="flex flex-wrap gap-2">
                {role.permissions.map((permission) => (
                  <span
                    key={permission}
                    className="px-2 py-1 bg-[#1B2540] rounded text-xs text-[#EAF0FB] flex items-center gap-1"
                  >
                    <Check className="w-3 h-3 text-[#14E8B4]" />
                    {permissionLabels[permission] || permission}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#232D45]">
              <span className="text-sm text-[#8996AD]">{role.userCount} users</span>
              <button className="text-sm text-[#4C8DFF] hover:underline">View Users</button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[#EAF0FB] mb-4">Permission Matrix</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#232D45]">
                <th className="text-left text-[#8996AD] pb-3 font-medium">Module</th>
                {roles.map((role) => (
                  <th key={role.id} className="text-center text-[#8996AD] pb-3 font-medium">{role.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {['Customers', 'Billing', 'Inventory', 'Staff', 'Reports'].map((module) => (
                <tr key={module} className="border-b border-[#232D45]">
                  <td className="py-3 text-[#EAF0FB]">{module}</td>
                  {roles.map((role) => (
                    <td key={role.id} className="py-3 text-center">
                      {role.permissions.includes('view') ? (
                        <Check className="w-4 h-4 text-[#14E8B4] mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-[#F5514B] mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

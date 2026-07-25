import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Shield, UserCheck, UserX } from 'lucide-react';
import { usersApi } from '../services/api';
import { toast } from '../components/Toast';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  lastLogin: string;
}

export default function SettingsUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const result = await usersApi.getAll();
      if (result.success) {
        setUsers(Array.isArray(result.data) ? result.data : []);
      } else {
        setError(result.error || 'Failed to load users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    (user.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (user.email?.toLowerCase() || '').includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const result = await usersApi.delete(id);
      if (result.success) {
        fetchUsers();
      } else {
        toast.error(result.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8996AD]">Loading users...</div>
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
        <h1 className="text-2xl font-bold text-[#EAF0FB]">User Management</h1>
        <button className="px-4 py-2 bg-[#4C8DFF] text-white rounded-lg hover:bg-[#3B7BD9] transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#8996AD]" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1B2540] border border-[#232D45] rounded-lg pl-10 pr-4 py-2 text-[#EAF0FB] focus:outline-none focus:border-[#4C8DFF]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#232D45]">
                <th className="text-left text-[#8996AD] pb-3 font-medium">User</th>
                <th className="text-left text-[#8996AD] pb-3 font-medium">Email</th>
                <th className="text-left text-[#8996AD] pb-3 font-medium">Role</th>
                <th className="text-left text-[#8996AD] pb-3 font-medium">Status</th>
                <th className="text-left text-[#8996AD] pb-3 font-medium">Last Login</th>
                <th className="text-left text-[#8996AD] pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-[#232D45] hover:bg-[#1B2540]">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#4C8DFF] flex items-center justify-center text-white font-medium">
                        {user.name.charAt(0)}
                      </div>
                      <div className="text-[#EAF0FB] font-medium">{user.name}</div>
                    </div>
                  </td>
                  <td className="py-4 text-[#8996AD]">{user.email}</td>
                  <td className="py-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#4C8DFF]/20 text-[#4C8DFF]">
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      {user.status === 'active' ? (
                        <UserCheck className="w-4 h-4 text-[#14E8B4]" />
                      ) : (
                        <UserX className="w-4 h-4 text-[#F5514B]" />
                      )}
                      <span className="text-[#EAF0FB] capitalize">{user.status}</span>
                    </div>
                  </td>
                  <td className="py-4 text-[#8996AD]">{user.lastLogin}</td>
                  <td className="py-4">
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-[#232D45] rounded-lg transition-colors">
                        <Edit className="w-4 h-4 text-[#8996AD]" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 hover:bg-[#232D45] rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-[#F5514B]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

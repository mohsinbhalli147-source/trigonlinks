import { useEffect, useMemo, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Package, 
  DollarSign, Settings as SettingsIcon, LogOut, 
  Cable, User, Box, BarChart3, ChevronDown, ChevronRight,
  MapPin, CreditCard, Megaphone, AlertCircle,
  Search, Download, SlidersHorizontal
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const menuSections = useMemo(() => [
    {
      name: 'Dashboard',
      emoji: '📊',
      href: '/',
      icon: LayoutDashboard,
      subsections: []
    },
  {
    name: 'Customers',
    emoji: '👥',
    icon: Users,
    subsections: [
      { name: 'Add Customer', href: '/customers/add', emoji: '➕' },
      { name: 'All Customers', href: '/customers/all', emoji: '👥' },
      { name: 'Active Customers', href: '/customers/active', emoji: '✅' },
      { name: 'Suspended Customers', href: '/customers/suspended', emoji: '⏸️' },
      { name: 'Customer Reports', href: '/customers/reports', emoji: '📈' },
      { name: 'Advanced Search', href: '/customers/advanced-search', icon: Search, emoji: '🔍' },
      { name: 'Bulk Operations', href: '/customers/bulk-operations', icon: SlidersHorizontal, emoji: '⚙️' },
      { name: 'Export Data', href: '/customers/export', icon: Download, emoji: '📥' },
    ]
  },
  {
    name: 'New Connection',
    emoji: '🔌',
    icon: Cable,
    subsections: [
      { name: 'Add New Connection', href: '/connections/add', emoji: '➕' },
      { name: 'Pending Connections', href: '/connections/pending', emoji: '⏳' },
      { name: 'Approved Connections', href: '/connections/approved', emoji: '✅' },
      { name: 'Rejected Connections', href: '/connections/rejected', emoji: '❌' },
      { name: 'All New Customers', href: '/new-customers/all', emoji: '👥' },
      { name: 'Customer Expenses', href: '/new-customers/expenses', emoji: '💰' },
      { name: 'Customer Collections', href: '/new-customers/collections', emoji: '💵' },
      { name: 'Connection Reports', href: '/connections/reports', emoji: '📈' },
    ]
  },
  {
    name: 'Payments & Billing',
    emoji: '💳',
    icon: CreditCard,
    subsections: [
      { name: 'Billing Overview', href: '/billing', emoji: '📋' },
      { name: 'Receive Payment', href: '/billing/receive', emoji: '💰' },
      { name: 'Payment Approval', href: '/billing/approval', emoji: '✅' },
      { name: 'All Invoices', href: '/billing/invoices', emoji: '📄' },
      { name: 'Paid Users', href: '/billing/paid', emoji: '✅' },
      { name: 'Unpaid Users', href: '/billing/unpaid', emoji: '❌' },
      { name: 'Payment Reports', href: '/billing/reports', emoji: '📈' },
    ]
  },
  {
    name: 'Inventory',
    emoji: '📦',
    icon: Box,
    subsections: [
      { name: 'Add Items', href: '/inventory/add', emoji: '➕' },
      { name: 'All Items', href: '/inventory/all', emoji: '📦' },
      { name: 'Stock In / Stock Out', href: '/inventory/stock', emoji: '🔄' },
      { name: 'Low Stock Alerts', href: '/inventory/alerts', emoji: '⚠️' },
      { name: 'Inventory Reports', href: '/inventory/reports', emoji: '📈' },
    ]
  },
  {
    name: 'Staff Management',
    emoji: '👨‍💼',
    icon: User,
    subsections: [
      { name: 'Add Staff', href: '/staff/add', emoji: '➕' },
      { name: 'All Staff', href: '/staff/all', emoji: '👥' },
      { name: 'Staff Permissions', href: '/staff/permissions', emoji: '🔐' },
      { name: 'Staff Activity', href: '/staff/activity', emoji: '📊' },
      { name: 'Staff Performance Reports', href: '/staff/reports', emoji: '📈' },
    ]
  },
  {
    name: 'Area Management',
    emoji: '📍',
    icon: MapPin,
    subsections: [
      { name: 'Add Area', href: '/areas/add', emoji: '➕' },
      { name: 'All Areas', href: '/areas/all', emoji: '🗺️' },
      { name: 'Area Customers', href: '/areas/customers', emoji: '👥' },
      { name: 'Area Revenue', href: '/areas/revenue', emoji: '💰' },
      { name: 'Area Reports', href: '/areas/reports', emoji: '📈' },
    ]
  },
  {
    name: 'Packages',
    emoji: '📦',
    icon: Package,
    subsections: [
      { name: 'Add Package', href: '/packages/add', emoji: '➕' },
      { name: 'All Packages', href: '/packages/all', emoji: '📦' },
      { name: 'Active Packages', href: '/packages/active', emoji: '✅' },
      { name: 'Package Pricing', href: '/packages/pricing', emoji: '💰' },
      { name: 'Package Reports', href: '/packages/reports', emoji: '📈' },
    ]
  },
  {
    name: 'Expenses',
    emoji: '💸',
    icon: DollarSign,
    subsections: [
      { name: 'Add Expense', href: '/expenses/add', emoji: '➕' },
      { name: 'All Expenses', href: '/expenses/all', emoji: '💸' },
      { name: 'Expense Categories', href: '/expenses/categories', emoji: '🏷️' },
      { name: 'Area Expenses', href: '/expenses/areas', emoji: '📍' },
      { name: 'Expense Reports', href: '/expenses/reports', emoji: '📈' },
    ]
  },
  {
    name: 'Reports',
    emoji: '📈',
    icon: BarChart3,
    subsections: [
      { name: 'Customer Reports', href: '/reports/customers', emoji: '👥' },
      { name: 'Billing Reports', href: '/reports/billing', emoji: '💳' },
      { name: 'Income Reports', href: '/reports/income', emoji: '💰' },
      { name: 'Expense Reports', href: '/reports/expenses', emoji: '💸' },
      { name: 'Complete Business Reports', href: '/reports/business', emoji: '📊' },
    ]
  },
  {
    name: 'Announcements',
    emoji: '📢',
    icon: Megaphone,
    subsections: [
      { name: 'Add Announcement', href: '/announcements/add', emoji: '➕' },
      { name: 'Staff Announcements', href: '/announcements/staff', emoji: '👨‍💼' },
      { name: 'Customer Announcements', href: '/announcements/customers', emoji: '👥' },
      { name: 'Area Announcements', href: '/announcements/areas', emoji: '📍' },
      { name: 'Announcement History', href: '/announcements/history', emoji: '📜' },
    ]
  },
  {
    name: 'Complaints',
    emoji: '⚠️',
    icon: AlertCircle,
    subsections: [
      { name: 'Add Complaint', href: '/complaints/add', emoji: '➕' },
      { name: 'All Complaints', href: '/complaints/all', emoji: '📋' },
      { name: 'Pending Complaints', href: '/complaints/pending', emoji: '⏳' },
      { name: 'Solved Complaints', href: '/complaints/solved', emoji: '✅' },
      { name: 'Complaint Reports', href: '/complaints/reports', emoji: '📈' },
    ]
  },
  {
    name: 'Settings',
    emoji: '⚙️',
    icon: SettingsIcon,
    subsections: [
      { name: 'App Settings', href: '/settings/app', emoji: '🔧' },
      { name: 'User Management', href: '/settings/users', emoji: '👤' },
      { name: 'Roles & Permissions', href: '/settings/roles', emoji: '🔐' },
      { name: 'Backup Settings', href: '/settings/backup', emoji: '💾' },
      { name: 'System Logs', href: '/settings/logs', emoji: '📝' },
    ]
  },
], []);

  const isPathMatch = (currentPath: string, targetPath?: string) => {
    if (!targetPath) {
      return false;
    }

    return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`) || currentPath.startsWith(`${targetPath}?`);
  };

  const activeSectionNames = useMemo(() => {
    const names = new Set<string>();

    menuSections.forEach((section) => {
      if (section.subsections.some((subsection) => isPathMatch(location.pathname, subsection.href))) {
        names.add(section.name);
      }
    });

    if (location.pathname.startsWith('/customers/')) names.add('Customers');
    if (location.pathname.startsWith('/connections/')) names.add('New Connection');
    if (location.pathname.startsWith('/new-customers/')) names.add('New Customers');
    if (location.pathname.startsWith('/billing/')) names.add('Payments & Billing');
    if (location.pathname.startsWith('/inventory/')) names.add('Inventory');
    if (location.pathname.startsWith('/staff/')) names.add('Staff Management');
    if (location.pathname.startsWith('/areas/')) names.add('Area Management');
    if (location.pathname.startsWith('/packages/')) names.add('Packages');
    if (location.pathname.startsWith('/expenses/')) names.add('Expenses');
    if (location.pathname.startsWith('/reports/')) names.add('Reports');
    if (location.pathname.startsWith('/announcements/')) names.add('Announcements');
    if (location.pathname.startsWith('/complaints/')) names.add('Complaints');
    if (location.pathname.startsWith('/settings/')) names.add('Settings');

    return names;
  }, [location.pathname, menuSections]);

  useEffect(() => {
    setExpandedSections((previous) => {
      const next = new Set(previous);
      activeSectionNames.forEach((name) => next.add(name));
      return next;
    });
  }, [activeSectionNames]);

  const toggleSection = (sectionName: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionName)) {
      newExpanded.delete(sectionName);
    } else {
      newExpanded.add(sectionName);
    }
    setExpandedSections(newExpanded);
  };

  const getPageTitle = () => {
    for (const section of menuSections) {
      if (section.href && isPathMatch(location.pathname, section.href)) {
        return section.name;
      }
      for (const subsection of section.subsections) {
        if (isPathMatch(location.pathname, subsection.href)) {
          return subsection.name;
        }
      }
    }

    if (location.pathname.startsWith('/customers/profile/')) return 'Customer Profile';
    if (location.pathname.startsWith('/customers/edit/')) return 'Edit Customer';
    if (location.pathname.startsWith('/connections/request/')) return 'Connection Request Details';
    if (location.pathname.startsWith('/billing/invoice/')) return 'Invoice Details';
    if (location.pathname.startsWith('/areas/customers/')) return 'Area Customers';
    if (location.pathname.startsWith('/areas/revenue/')) return 'Area Revenue';
    if (location.pathname.startsWith('/areas/reports/')) return 'Area Reports';
    if (location.pathname.startsWith('/areas/edit/')) return 'Edit Area';
    if (location.pathname.startsWith('/packages/edit/')) return 'Edit Package';
    if (location.pathname.startsWith('/expenses/edit/')) return 'Edit Expense';
    if (location.pathname.startsWith('/inventory/edit/')) return 'Edit Inventory Item';
    if (location.pathname.startsWith('/staff/edit/')) return 'Edit Staff Member';
    if (location.pathname.startsWith('/staff/payments/')) return 'Staff Payment Details';

    return 'Dashboard';
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#0D1117] via-[#161B22] to-[#0D1117] overflow-x-auto overflow-y-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-gradient-to-b from-[#161B22] to-[#0D1117] border-r border-[#374151] flex flex-col flex-shrink-0 transition-all duration-300`}>
        <div className="p-6 border-b border-[#374151]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] flex items-center justify-center font-bold text-white shadow-lg shadow-[#8B5CF6]/30">
              TL
            </div>
            {!sidebarCollapsed && (
              <div>
                <div className="font-bold text-[#EAF0FB]">TRIGONLINKS</div>
                <div className="text-xs text-[#6B7280]">Pasrur · ISP ERP</div>
              </div>
            )}
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-4 ${
              'text-[#9CA3AF] hover:bg-[#374151] hover:text-[#EAF0FB]'
            }`}
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
            {!sidebarCollapsed && <span>Collapse Menu</span>}
          </button>
          {menuSections.map((section) => {
            const filteredSubsections = section.subsections;

            const hasSubsections = filteredSubsections.length > 0;
            const isExpanded = expandedSections.has(section.name);
            const isActive = Boolean(section.href && isPathMatch(location.pathname, section.href)) || activeSectionNames.has(section.name);
            
            return (
              <div key={section.name}>
                {section.href ? (
                  <Link
                    to={section.href}
                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-[#8B5CF6]/20 to-[#6366F1]/20 text-[#8B5CF6] border border-[#8B5CF6]/30'
                        : 'text-[#9CA3AF] hover:bg-[#374151] hover:text-[#EAF0FB]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{section.emoji}</span>
                      {!sidebarCollapsed && <span>{section.name}</span>}
                    </div>
                  </Link>
                ) : (
                  <button
                    onClick={() => hasSubsections && toggleSection(section.name)}
                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-[#8B5CF6]/20 to-[#6366F1]/20 text-[#8B5CF6] border border-[#8B5CF6]/30'
                        : 'text-[#9CA3AF] hover:bg-[#374151] hover:text-[#EAF0FB]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{section.emoji}</span>
                      {!sidebarCollapsed && <span>{section.name}</span>}
                    </div>
                    {!sidebarCollapsed && hasSubsections && (
                      isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )
                    )}
                  </button>
                )}
                
                {hasSubsections && isExpanded && !sidebarCollapsed && (
                  <div className="ml-4 mt-1 space-y-1">
                    {filteredSubsections.map((subsection) => {
                      const isSubActive = isPathMatch(location.pathname, subsection.href);
                      return (
                        <Link
                          key={`${section.name}-${subsection.name}-${subsection.href}`}
                          to={subsection.href}
                          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                            isSubActive
                              ? 'bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30'
                              : 'text-[#6B7280] hover:bg-[#374151] hover:text-[#EAF0FB]'
                          }`}
                        >
                          <span className="text-sm">{subsection.emoji}</span>
                          <span>{subsection.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#374151]">
          {!sidebarCollapsed && (
            <div className="mb-3 px-3">
              <p className="text-sm font-medium text-[#EAF0FB]">{user?.email || 'Demo User'}</p>
              <p className="text-xs text-[#6B7280]">Authenticated session</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-[#9CA3AF] hover:bg-[#374151] hover:text-[#EAF0FB] transition-all w-full"
          >
            <LogOut className="w-5 h-5" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-[#161B22]/80 backdrop-blur-xl border-b border-[#374151] flex items-center justify-between px-6 sticky top-0 z-40">
          <h1 className="text-lg font-semibold text-[#EAF0FB]">
            {getPageTitle()}
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#10B981]/20 border border-[#10B981]/30 text-xs text-[#10B981]">
              <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              All Systems Operational
            </div>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-[#8B5CF6]/30">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Package, 
  DollarSign, Settings as SettingsIcon, LogOut, 
  Cable, User, Box, BarChart3, ChevronDown, ChevronRight,
  MapPin, CreditCard, Megaphone, AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const menuSections = useMemo(() => [
    {
      name: 'Dashboard',
      href: user?.role === 'customer' ? '/customer-dashboard' : '/',
      icon: LayoutDashboard,
      subsections: []
    },
  {
    name: 'Customers',
    icon: Users,
    subsections: [
      { name: 'Add Customer', href: '/customers/add' },
      { name: 'All Customers', href: '/customers/all' },
      { name: 'Active Customers', href: '/customers/active' },
      { name: 'Suspended Customers', href: '/customers/suspended' },
      { name: 'Customer Reports', href: '/customers/reports' },
    ]
  },
  {
    name: 'New Connection',
    icon: Cable,
    subsections: [
      { name: 'Add New Connection', href: '/connections/add' },
      { name: 'Pending Connections', href: '/connections/pending' },
      { name: 'Approved Connections', href: '/connections/approved' },
      { name: 'Rejected Connections', href: '/connections/rejected' },
      { name: 'All New Customers', href: '/new-customers/all' },
      { name: 'Customer Expenses', href: '/new-customers/expenses' },
      { name: 'Customer Collections', href: '/new-customers/collections' },
      { name: 'Connection Reports', href: '/connections/reports' },
    ]
  },
  {
    name: 'Payments & Billing',
    icon: CreditCard,
    subsections: [
      { name: 'Billing Overview', href: '/billing' },
      { name: 'Receive Payment', href: '/billing/receive' },
      { name: 'Payment Approval', href: '/billing/approval' },
      { name: 'All Invoices', href: '/billing/invoices' },
      { name: 'Paid Users', href: '/billing/paid' },
      { name: 'Unpaid Users', href: '/billing/unpaid' },
      { name: 'Payment Reports', href: '/billing/reports' },
    ]
  },
  {
    name: 'Inventory',
    icon: Box,
    subsections: [
      { name: 'Add Items', href: '/inventory/add' },
      { name: 'All Items', href: '/inventory/all' },
      { name: 'Stock In / Stock Out', href: '/inventory/stock' },
      { name: 'Low Stock Alerts', href: '/inventory/alerts' },
      { name: 'Inventory Reports', href: '/inventory/reports' },
    ]
  },
  {
    name: 'Staff Management',
    icon: User,
    subsections: [
      { name: 'Add Staff', href: '/staff/add' },
      { name: 'All Staff', href: '/staff/all' },
      { name: 'Staff Permissions', href: '/staff/permissions' },
      { name: 'Staff Activity', href: '/staff/activity' },
      { name: 'Staff Performance Reports', href: '/staff/reports' },
    ]
  },
  {
    name: 'Area Management',
    icon: MapPin,
    subsections: [
      { name: 'Add Area', href: '/areas/add' },
      { name: 'All Areas', href: '/areas/all' },
      { name: 'Area Customers', href: '/areas/customers' },
      { name: 'Area Revenue', href: '/areas/revenue' },
      { name: 'Area Reports', href: '/areas/reports' },
    ]
  },
  {
    name: 'Packages',
    icon: Package,
    subsections: [
      { name: 'Add Package', href: '/packages/add' },
      { name: 'All Packages', href: '/packages/all' },
      { name: 'Active Packages', href: '/packages/active' },
      { name: 'Package Pricing', href: '/packages/pricing' },
      { name: 'Package Reports', href: '/packages/reports' },
    ]
  },
  {
    name: 'Expenses',
    icon: DollarSign,
    subsections: [
      { name: 'Add Expense', href: '/expenses/add' },
      { name: 'All Expenses', href: '/expenses/all' },
      { name: 'Expense Categories', href: '/expenses/categories' },
      { name: 'Area Expenses', href: '/expenses/areas' },
      { name: 'Expense Reports', href: '/expenses/reports' },
    ]
  },
  {
    name: 'Reports',
    icon: BarChart3,
    subsections: [
      { name: 'Customer Reports', href: '/reports/customers' },
      { name: 'Billing Reports', href: '/reports/billing' },
      { name: 'Income Reports', href: '/reports/income' },
      { name: 'Expense Reports', href: '/reports/expenses' },
      { name: 'Complete Business Reports', href: '/reports/business' },
    ]
  },
  {
    name: 'Announcements',
    icon: Megaphone,
    subsections: [
      { name: 'Add Announcement', href: '/announcements/add' },
      { name: 'Staff Announcements', href: '/announcements/staff' },
      { name: 'Customer Announcements', href: '/announcements/customers' },
      { name: 'Area Announcements', href: '/announcements/areas' },
      { name: 'Announcement History', href: '/announcements/history' },
    ]
  },
  {
    name: 'Complaints',
    icon: AlertCircle,
    subsections: [
      { name: 'Add Complaint', href: '/complaints/add' },
      { name: 'All Complaints', href: '/complaints/all' },
      { name: 'Pending Complaints', href: '/complaints/pending' },
      { name: 'Solved Complaints', href: '/complaints/solved' },
      { name: 'Complaint Reports', href: '/complaints/reports' },
    ]
  },
  {
    name: 'Settings',
    icon: SettingsIcon,
    subsections: [
      { name: 'App Settings', href: '/settings/app' },
      { name: 'User Management', href: '/settings/users' },
      { name: 'Roles & Permissions', href: '/settings/roles' },
      { name: 'Backup Settings', href: '/settings/backup' },
      { name: 'System Logs', href: '/settings/logs' },
    ]
  },
], [user?.role]);

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

    if (location.pathname === '/customer-dashboard') return 'Customer Dashboard';

    return 'Dashboard';
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-[#0A0F1C]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0A0F1C] border-r border-[#232D45] flex flex-col">
        <div className="p-6 border-b border-[#232D45]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#14E8B4] to-[#0E9E7B] flex items-center justify-center font-bold text-[#04231B]">
              TL
            </div>
            <div>
              <div className="font-bold text-[#EAF0FB]">TRIGONLINKS</div>
              <div className="text-xs text-[#6E7A94]">Pasrur · ISP ERP</div>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuSections.filter(section => {
            if (user?.role === 'customer') {
              return section.name === 'Dashboard' || section.name === 'Payments & Billing' || section.name === 'Complaints';
            }
            return true;
          }).map((section) => {
            let filteredSubsections = section.subsections;
            if (user?.role === 'customer') {
              if (section.name === 'Payments & Billing') {
                filteredSubsections = section.subsections.filter(sub => sub.name === 'All Invoices' || sub.name === 'Billing Overview');
              } else if (section.name === 'Complaints') {
                filteredSubsections = section.subsections.filter(sub => sub.name === 'Add Complaint' || sub.name === 'All Complaints');
              } else {
                filteredSubsections = [];
              }
            }

            const hasSubsections = filteredSubsections.length > 0;
            const isExpanded = expandedSections.has(section.name);
            const isActive = Boolean(section.href && isPathMatch(location.pathname, section.href)) || activeSectionNames.has(section.name);
            
            return (
              <div key={section.name}>
                {section.href ? (
                  <Link
                    to={section.href}
                    className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#14E8B4]/10 text-[#14E8B4] border-l-2 border-[#14E8B4]'
                        : 'text-[#A9B4C9] hover:bg-[#141D33] hover:text-[#EAF0FB]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <section.icon className="w-5 h-5" />
                      {section.name}
                    </div>
                  </Link>
                ) : (
                  <button
                    onClick={() => hasSubsections && toggleSection(section.name)}
                    className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#14E8B4]/10 text-[#14E8B4] border-l-2 border-[#14E8B4]'
                        : 'text-[#A9B4C9] hover:bg-[#141D33] hover:text-[#EAF0FB]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <section.icon className="w-5 h-5" />
                      {section.name}
                    </div>
                    {hasSubsections && (
                      isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )
                    )}
                  </button>
                )}
                
                {hasSubsections && isExpanded && (
                  <div className="ml-4 mt-1 space-y-1">
                    {filteredSubsections.map((subsection) => {
                      const isSubActive = isPathMatch(location.pathname, subsection.href);
                      return (
                        <Link
                          key={`${section.name}-${subsection.name}-${subsection.href}`}
                          to={subsection.href}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isSubActive
                              ? 'bg-[#14E8B4]/10 text-[#14E8B4] border-l-2 border-[#14E8B4]'
                              : 'text-[#8996AD] hover:bg-[#141D33] hover:text-[#EAF0FB]'
                          }`}
                        >
                          {subsection.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#232D45]">
          <div className="mb-3 px-3">
            <p className="text-sm font-medium text-[#EAF0FB]">{user?.email || 'Demo User'}</p>
            <p className="text-xs text-[#6E7A94]">Authenticated session</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[#A9B4C9] hover:bg-[#141D33] hover:text-[#EAF0FB] transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-[#121B2E] border-b border-[#232D45] flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-[#EAF0FB]">
            {getPageTitle()}
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#1B2540] text-xs text-[#8996AD]">
              <div className="w-2 h-2 rounded-full bg-[#14E8B4]" />
              All Systems Operational
            </div>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4C8DFF] to-[#7C5CFF] flex items-center justify-center font-bold text-white text-sm">
              SA
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import { ToastContainer } from './components/Toast';
import ComingSoon from './components/ComingSoon';

// Lazy load components for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const CustomersAdd = lazy(() => import('./pages/CustomersAdd'));
const CustomersAll = lazy(() => import('./pages/CustomersAll'));
const CustomersActive = lazy(() => import('./pages/CustomersActive'));
const CustomersSuspended = lazy(() => import('./pages/CustomersSuspended'));
const CustomerProfile = lazy(() => import('./pages/CustomerProfile'));
const CustomerEdit = lazy(() => import('./pages/CustomerEdit'));
const CustomerReports = lazy(() => import('./pages/CustomerReports'));
const EditPackage = lazy(() => import('./pages/EditPackage'));
const PackagesAdd = lazy(() => import('./pages/PackagesAdd'));
const PackagesAll = lazy(() => import('./pages/PackagesAll'));
const PackagesActive = lazy(() => import('./pages/PackagesActive'));
const PackagesPricing = lazy(() => import('./pages/PackagesPricing'));
const PackagesReports = lazy(() => import('./pages/PackagesReports'));
const NewCustomersAdd = lazy(() => import('./pages/NewCustomersAdd'));
const NewCustomersAll = lazy(() => import('./pages/NewCustomersAll'));
const NewCustomersExpenses = lazy(() => import('./pages/NewCustomersExpenses'));
const AddCustomerExpense = lazy(() => import('./pages/AddCustomerExpense'));
const NewCustomersCollections = lazy(() => import('./pages/NewCustomersCollections'));
const AddCustomerCollection = lazy(() => import('./pages/AddCustomerCollection'));
const Connections = lazy(() => import('./pages/Connections'));
const ConnectionAdd = lazy(() => import('./pages/ConnectionAdd'));
const ConnectionsEdit = lazy(() => import('./pages/ConnectionsEdit'));
const ConnectionsPending = lazy(() => import('./pages/ConnectionsPending'));
const ConnectionsApproved = lazy(() => import('./pages/ConnectionsApproved'));
const ConnectionsRejected = lazy(() => import('./pages/ConnectionsRejected'));
const ConnectionRequestDetails = lazy(() => import('./pages/ConnectionRequestDetails'));
const ConnectionsReports = lazy(() => import('./pages/ConnectionsReports'));
const Billing = lazy(() => import('./pages/Billing'));
const BillingReceive = lazy(() => import('./pages/BillingReceive'));
const BillingApproval = lazy(() => import('./pages/BillingApproval'));
const InvoiceDetails = lazy(() => import('./pages/InvoiceDetails'));
const BillingInvoices = lazy(() => import('./pages/BillingInvoices'));
const BillingPaid = lazy(() => import('./pages/BillingPaid'));
const BillingUnpaid = lazy(() => import('./pages/BillingUnpaid'));
const GenerateBill = lazy(() => import('./pages/GenerateBill'));
const BillingReports = lazy(() => import('./pages/BillingReports'));
const EditStaffMember = lazy(() => import('./pages/EditStaffMember'));
const Staff = lazy(() => import('./pages/Staff'));
const StaffAdd = lazy(() => import('./pages/StaffAdd'));
const StaffAll = lazy(() => import('./pages/StaffAll'));
const StaffPayments = lazy(() => import('./pages/StaffPayments'));
const StaffPermissions = lazy(() => import('./pages/StaffPermissions'));
const StaffActivity = lazy(() => import('./pages/StaffActivity'));
const StaffReports = lazy(() => import('./pages/StaffReports'));
const EditInventoryItem = lazy(() => import('./pages/EditInventoryItem'));
const Inventory = lazy(() => import('./pages/Inventory'));
const InventoryAdd = lazy(() => import('./pages/InventoryAdd'));
const InventoryAll = lazy(() => import('./pages/InventoryAll'));
const InventoryStock = lazy(() => import('./pages/InventoryStock'));
const InventoryAlerts = lazy(() => import('./pages/InventoryAlerts'));
const InventoryReports = lazy(() => import('./pages/InventoryReports'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const EditArea = lazy(() => import('./pages/EditArea'));
const AreaAdd = lazy(() => import('./pages/AreaAdd'));
const AreaAll = lazy(() => import('./pages/AreaAll'));
const AreaCustomers = lazy(() => import('./pages/AreaCustomers'));
const AreaRevenue = lazy(() => import('./pages/AreaRevenue'));
const AreaReports = lazy(() => import('./pages/AreaReports'));
const EditExpense = lazy(() => import('./pages/EditExpense'));
const ExpensesAdd = lazy(() => import('./pages/ExpensesAdd'));
const ExpensesAll = lazy(() => import('./pages/ExpensesAll'));
const ExpensesCategories = lazy(() => import('./pages/ExpensesCategories'));
const ExpensesAreas = lazy(() => import('./pages/ExpensesAreas'));
const ExpensesReports = lazy(() => import('./pages/ExpensesReports'));
const AnnouncementAdd = lazy(() => import('./pages/AnnouncementAdd'));
const AnnouncementStaff = lazy(() => import('./pages/AnnouncementStaff'));
const AnnouncementCustomer = lazy(() => import('./pages/AnnouncementCustomer'));
const AnnouncementArea = lazy(() => import('./pages/AnnouncementArea'));
const AnnouncementHistory = lazy(() => import('./pages/AnnouncementHistory'));
const ComplaintsAdd = lazy(() => import('./pages/ComplaintsAdd'));
const ComplaintsAll = lazy(() => import('./pages/ComplaintsAll'));
const ComplaintsPending = lazy(() => import('./pages/ComplaintsPending'));
const ComplaintsSolved = lazy(() => import('./pages/ComplaintsSolved'));
const ComplaintsReports = lazy(() => import('./pages/ComplaintsReports'));
const ReportsCustomers = lazy(() => import('./pages/ReportsCustomers'));
const ReportsBilling = lazy(() => import('./pages/ReportsBilling'));
const ReportsIncome = lazy(() => import('./pages/ReportsIncome'));
const ReportsExpenses = lazy(() => import('./pages/ReportsExpenses'));
const ReportsBusiness = lazy(() => import('./pages/ReportsBusiness'));
const SettingsApp = lazy(() => import('./pages/SettingsApp'));
const SettingsUsers = lazy(() => import('./pages/SettingsUsers'));
const SettingsRoles = lazy(() => import('./pages/SettingsRoles'));
const SettingsBackup = lazy(() => import('./pages/SettingsBackup'));
const SettingsLogs = lazy(() => import('./pages/SettingsLogs'));
const SettingsGoogle = lazy(() => import('./pages/SettingsGoogle'));
const CustomerDashboard = lazy(() => import('./pages/CustomerDashboard'));



function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0F1C] text-[#EAF0FB]">
        Loading application...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicOnlyRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0F1C] text-[#EAF0FB]">
        Loading application...
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ToastContainer />
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0A0F1C] text-[#EAF0FB]">Loading...</div>}>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <Login />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicOnlyRoute>
                  <ForgotPassword />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/reset-password"
              element={
                <PublicOnlyRoute>
                  <ResetPassword />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <Layout />
                </RequireAuth>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="customer-dashboard" element={<CustomerDashboard />} />
            
            {/* Customers Routes */}
            <Route path="customers/add" element={<CustomersAdd />} />
            <Route path="customers/all" element={<CustomersAll />} />
            <Route path="customers/profile/:id" element={<CustomerProfile />} />
            <Route path="customers/edit/:id" element={<CustomerEdit />} />
            <Route path="customers/active" element={<CustomersActive />} />
            <Route path="customers/suspended" element={<CustomersSuspended />} />
            <Route path="customers/reports" element={<CustomerReports />} />

            {/* New Customers Routes */}
            <Route path="new-customers/add" element={<NewCustomersAdd />} />
            <Route path="new-customers/all" element={<NewCustomersAll />} />
            <Route path="new-customers/expenses" element={<NewCustomersExpenses />} />
            <Route path="new-customers/collections" element={<NewCustomersCollections />} />
            <Route path="new-customers/expenses/add" element={<AddCustomerExpense />} />
            <Route path="new-customers/collections/add" element={<AddCustomerCollection />} />
            
            {/* New Connection Routes */}
            <Route path="connections" element={<Connections />} />
            <Route path="connections/add" element={<ConnectionAdd />} />
            <Route path="connections/edit/:id" element={<ConnectionsEdit />} />
            <Route path="connections/pending" element={<ConnectionsPending />} />
            <Route path="connections/approved" element={<ConnectionsApproved />} />
            <Route path="connections/rejected" element={<ConnectionsRejected />} />
            <Route path="connections/reports" element={<ConnectionsReports />} />
            <Route path="connections/request/:id" element={<ConnectionRequestDetails />} />
            
            {/* Payments & Billing Routes */}
            <Route path="billing" element={<Billing />} />
            <Route path="billing/receive" element={<BillingReceive />} />
            <Route path="billing/approval" element={<BillingApproval />} />
            <Route path="billing/invoices" element={<BillingInvoices />} />
            <Route path="billing/paid" element={<BillingPaid />} />
            <Route path="billing/unpaid" element={<BillingUnpaid />} />
            <Route path="billing/reports" element={<BillingReports />} />
            <Route path="billing/add" element={<GenerateBill />} />
            <Route path="billing/invoice/:id" element={<InvoiceDetails />} />
            
            {/* Inventory Routes */}
            <Route path="inventory" element={<Inventory />} />
            <Route path="inventory/add" element={<InventoryAdd />} />
            <Route path="inventory/all" element={<InventoryAll />} />
            <Route path="inventory/stock" element={<InventoryStock />} />
            <Route path="inventory/alerts" element={<InventoryAlerts />} />
            <Route path="inventory/reports" element={<InventoryReports />} />
            <Route path="inventory/edit/:id" element={<EditInventoryItem />} />
            
            {/* Staff Management Routes */}
            <Route path="staff" element={<Staff />} />
            <Route path="staff/add" element={<StaffAdd />} />
            <Route path="staff/all" element={<StaffAll />} />
            <Route path="staff/payments" element={<StaffPayments />} />
            <Route path="staff/payments/:id" element={<StaffPayments />} />
            <Route path="staff/permissions" element={<StaffPermissions />} />
            <Route path="staff/activity" element={<StaffActivity />} />
            <Route path="staff/reports" element={<StaffReports />} />
            <Route path="staff/edit/:id" element={<EditStaffMember />} />
            
            {/* Area Management Routes */}
            <Route path="areas/add" element={<AreaAdd />} />
            <Route path="areas/all" element={<AreaAll />} />
            <Route path="areas/customers" element={<AreaCustomers />} />
            <Route path="areas/customers/:areaId" element={<AreaCustomers />} />
            <Route path="areas/revenue" element={<AreaRevenue />} />
            <Route path="areas/revenue/:areaId" element={<AreaRevenue />} />
            <Route path="areas/reports" element={<AreaReports />} />
            <Route path="areas/reports/:areaId" element={<AreaReports />} />
            <Route path="areas/edit/:id" element={<EditArea />} />
            
            {/* Packages Routes */}
            <Route path="packages/add" element={<PackagesAdd />} />
            <Route path="packages/all" element={<PackagesAll />} />
            <Route path="packages/active" element={<PackagesActive />} />
            <Route path="packages/pricing" element={<PackagesPricing />} />
            <Route path="packages/reports" element={<PackagesReports />} />
            <Route path="packages/edit/:id" element={<EditPackage />} />
            
            {/* Expenses Routes */}
            <Route path="expenses/add" element={<ExpensesAdd />} />
            <Route path="expenses/all" element={<ExpensesAll />} />
            <Route path="expenses/categories" element={<ExpensesCategories />} />
            <Route path="expenses/areas" element={<ExpensesAreas />} />
            <Route path="expenses/reports" element={<ExpensesReports />} />
            <Route path="expenses/edit/:id" element={<EditExpense />} />
            
            {/* Reports Routes */}
            <Route path="reports" element={<Reports />} />
            <Route path="reports/customers" element={<ReportsCustomers />} />
            <Route path="reports/billing" element={<ReportsBilling />} />
            <Route path="reports/income" element={<ReportsIncome />} />
            <Route path="reports/expenses" element={<ReportsExpenses />} />
            <Route path="reports/business" element={<ReportsBusiness />} />
            
            {/* Announcements Routes */}
            <Route path="announcements/add" element={<AnnouncementAdd />} />
            <Route path="announcements/staff" element={<AnnouncementStaff />} />
            <Route path="announcements/customers" element={<AnnouncementCustomer />} />
            <Route path="announcements/areas" element={<AnnouncementArea />} />
            <Route path="announcements/history" element={<AnnouncementHistory />} />
            
            {/* Complaints Routes */}
            <Route path="complaints/add" element={<ComplaintsAdd />} />
            <Route path="complaints/all" element={<ComplaintsAll />} />
            <Route path="complaints/pending" element={<ComplaintsPending />} />
            <Route path="complaints/solved" element={<ComplaintsSolved />} />
            <Route path="complaints/reports" element={<ComplaintsReports />} />
            
            {/* Settings Routes */}
            <Route path="settings" element={<Settings />} />
            <Route path="settings/app" element={<SettingsApp />} />
            <Route path="settings/users" element={<SettingsUsers />} />
            <Route path="settings/roles" element={<SettingsRoles />} />
            <Route path="settings/backup" element={<SettingsBackup />} />
            <Route path="settings/logs" element={<SettingsLogs />} />
            <Route path="settings/google" element={<SettingsGoogle />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;

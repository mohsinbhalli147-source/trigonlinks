export interface Customer {
  id: string;
  name: string;
  father: string;
  mobile: string;
  email: string;
  address: string;
  area: string;
  package: string;
  fee: number;
  installDate: string;
  billingDate: string;
  connType: 'Fiber' | 'Wireless';
  device: string;
  username: string;
  password: string;
  status: 'active' | 'suspended';
  createdAt: number;
  // IPTV Information
  iptvEnabled?: boolean;
  iptvBoxNumber?: string;
  iptvBoxPrice?: number;
  iptvInstallationCharges?: number;
  iptvMonthlyCharges?: number;
  // Live IP Information
  liveIpEnabled?: boolean;
  liveIpAddress?: string;
  liveIpMonthlyFee?: number;
  liveIpInstallationFee?: number;
  // Installation
  installFee?: number;
  installFeePaid?: boolean;
  // Billing
  previousBalance?: number;
}

export interface Package {
  id: string;
  name: string;
  speed: string;
  price: number;
  desc: string;
  status: 'active' | 'inactive';
}

export interface Connection {
  id: string;
  customerId: string;
  customerName: string;
  package: string;
  installDate: string;
  billingDate: string;
  installFee: number;
  equipment: string;
  staff: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Invoice {
  id: string;
  customerId: string;
  customerName: string;
  month: string;
  amount: number;
  paidAmount: number;
  status: 'paid' | 'unpaid' | 'partial' | 'overdue';
  dueDate: string;
  // New billing fields
  packagePrice?: number;
  iptvCharges?: number;
  liveIpCharges?: number;
  installationCharges?: number;
  previousDueAmount?: number;
  discountAmount?: number;
  discountReason?: string;
  totalPayable?: number;
  remainingBalance?: number;
  // Payment details
  paymentMethod?: string;
  lastPaymentDate?: number;
  lastPaymentAmount?: number;
}

export interface Inventory {
  id: string;
  name: string;
  category: string;
  qty: number;
  price: number;
  salePrice: number;
  date: string;
}

export interface Staff {
  id: string;
  name: string;
  username: string;
  password: string;
  role: string;
  permissions: {
    view: boolean;
    add: boolean;
    edit: boolean;
    delete: boolean;
    approve: boolean;
  };
  createdAt: number;
}

export interface Expense {
  id: string;
  name: string;
  category: string;
  amount: number;
  date: string;
  desc: string;
}

export interface NewCustomerExpense {
  id: string;
  name: string;
  customerId: string;
  customerName: string;
  category: string;
  amount: number;
  date: string;
  desc: string;
}

export interface NewCustomerCollection {
  id: string;
  name: string;
  customerId: string;
  customerName: string;
  type: 'Installation Fee' | 'Advance Payment' | 'Security Deposit' | 'Other';
  amount: number;
  date: string;
  desc: string;
}

export interface Area {
  id: string;
  name: string;
}

export interface Complaint {
  id: string;
  customer: string;
  issue: string;
  technician: string;
  status: 'Pending' | 'Working' | 'Solved';
  date: string;
}

export interface Activity {
  text: string;
  time: number;
}

import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
let token = '';

const api = axios.create({
  baseURL: API_URL,
  validateStatus: () => true // Resolve all statuses to manually check errors
});

api.interceptors.request.use((config) => {
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const log = (msg: string) => console.log(`[TEST] ${msg}`);
const logError = (msg: string, err: any) => {
  console.error(`[ERROR] ${msg}`, err?.response?.data || err?.message || err);
  throw new Error(`Test Failed: ${msg}`);
};

async function runTests() {
  log('Starting End-to-End Test and Data Seeding...');

  // 1. Setup & Auth
  log('--- Logging in as Admin ---');
  const loginRes = await api.post('/auth/login', { email: 'admin@trigonlinks.com', password: 'admin123' });
  if (loginRes.status !== 200) logError('Login failed', loginRes.data);
  token = loginRes.data.accessToken;
  log('Admin Logged In Successfully');

  // 2. Create Areas
  log('--- Creating Areas ---');
  const areas = ['Pasrur City', 'Sialkot Road', 'Mohalla Islam Pura', 'Chawinda Road'];
  const areaIds: string[] = [];
  for (const name of areas) {
    const res = await api.post('/areas', { name, description: `Service area: ${name}`, status: 'active' });
    if (![200, 201].includes(res.status)) logError(`Failed to create area ${name}`, res.data);
    areaIds.push(res.data.id);
  }
  log('Areas created successfully');

  // 3. Create Packages
  log('--- Creating Packages ---');
  const packages = [
    { name: '10 Mbps', speed: '10', price: 1500, description: 'Basic Package', type: 'wireless' },
    { name: '20 Mbps', speed: '20', price: 2500, description: 'Standard Package', type: 'fiber' },
    { name: '50 Mbps', speed: '50', price: 4000, description: 'Premium Package', type: 'fiber' },
    { name: '100 Mbps', speed: '100', price: 6500, description: 'Ultra Package', type: 'fiber' }
  ];
  const packageIds: string[] = [];
  for (const pkg of packages) {
    const res = await api.post('/packages', pkg);
    if (![200, 201].includes(res.status)) logError(`Failed to create package ${pkg.name}`, res.data);
    packageIds.push(res.data.id);
  }
  log('Packages created successfully');

  // 4. Create Staff
  log('--- Creating Staff ---');
  const staffMembers = [
    { name: 'Ali Raza', role: 'technician', phone: '03001112233', email: 'ali.raza@test.com', areaId: areaIds[0], username: 'aliraza', password: 'password123' },
    { name: 'Usman Ghani', role: 'technician', phone: '03002223344', email: 'usman.g@test.com', areaId: areaIds[1], username: 'usmang', password: 'password123' },
    { name: 'Ahmad Khan', role: 'collector', phone: '03003334455', email: 'ahmad.k@test.com', areaId: areaIds[2], username: 'ahmadk', password: 'password123' }
  ];
  const staffIds: string[] = [];
  for (const staff of staffMembers) {
    const res = await api.post('/staff', staff);
    if (![200, 201].includes(res.status)) logError(`Failed to create staff ${staff.name}`, res.data);
    staffIds.push(res.data.id);
  }
  log('Staff created successfully');

  // 5. Create Customers
  log('--- Creating Customers ---');
  const customers = [
    { name: 'Muhammad Bilal', username: 'mbilal', cnic: '34601-1234567-1', mobile: '03009998877', address: 'House 12, Pasrur City', areaId: areaIds[0], packageId: packageIds[0], connectionDate: '2023-01-15', fee: 1500, status: 'active', installationFee: 2000, connectionType: 'wireless' },
    { name: 'Hassan Ali', username: 'hassanali', cnic: '34601-2345678-3', mobile: '03218887766', address: 'Street 4, Sialkot Road', areaId: areaIds[1], packageId: packageIds[1], connectionDate: '2023-05-20', fee: 2500, status: 'active', installationFee: 3000, connectionType: 'fiber' },
    { name: 'Zainab Bibi', username: 'zainab', cnic: '34601-3456789-5', mobile: '03337776655', address: 'Mohalla Islam Pura, House 45', areaId: areaIds[2], packageId: packageIds[2], connectionDate: '2023-11-10', fee: 4000, status: 'active', installationFee: 3000, connectionType: 'fiber' },
    { name: 'Kamran Akmal', username: 'kamran', cnic: '34601-4567890-7', mobile: '03456665544', address: 'Chawinda Road, Near Market', areaId: areaIds[3], packageId: packageIds[3], connectionDate: '2022-08-05', fee: 6500, status: 'suspended', installationFee: 3000, connectionType: 'fiber' },
    { name: 'Tariq Mehmood', username: 'tariq', cnic: '34601-5678901-9', mobile: '03015554433', address: 'Pasrur City Block B', areaId: areaIds[0], packageId: packageIds[1], connectionDate: '2024-02-01', fee: 2500, status: 'active', installationFee: 3000, connectionType: 'fiber' }
  ];
  const customerIds: string[] = [];
  for (const cust of customers) {
    const res = await api.post('/customers', cust);
    if (![200, 201].includes(res.status)) logError(`Failed to create customer ${cust.name}`, res.data);
    customerIds.push(res.data.id);
  }
  log('Customers created successfully');

  // 6. Generate Bills (Billing API)
  log('--- Generating Bills ---');
  // First run the monthly generation job
  const billingRes = await api.post('/billing/generate-monthly');
  if (billingRes.status !== 200) logError('Failed to generate monthly bills', billingRes.data);
  log(`Monthly bills generated: ${billingRes.data.message || 'Success'}`);

  // Fetch unpaid invoices to process some payments
  const unpaidRes = await api.get('/invoices?status=unpaid');
  if (unpaidRes.status !== 200) logError('Failed to fetch unpaid invoices', unpaidRes.data);
  const unpaidInvoices = unpaidRes.data?.data || unpaidRes.data; // Depending on pagination structure
  if (!Array.isArray(unpaidInvoices)) {
      logError('Unpaid invoices is not an array', unpaidRes.data);
  }
  
  if (unpaidInvoices.length > 0) {
    // Process payment for the first two invoices
    log(`Processing payments for 2 invoices out of ${unpaidInvoices.length}`);
    for (let i = 0; i < Math.min(2, unpaidInvoices.length); i++) {
        const inv = unpaidInvoices[i];
        const paymentRes = await api.post(`/billing/payment/${inv.id}`, { amount: inv.amount, paymentMethod: 'cash' });
        if (paymentRes.status !== 200) logError(`Failed to process payment for invoice ${inv.id}`, paymentRes.data);
    }
  }
  log('Bills and Payments processed successfully');

  // 7. Complaints
  log('--- Creating Complaints ---');
  const complaints = [
    { customerId: customerIds[0], category: 'Slow Internet', priority: 'high', description: 'Speed is very slow since morning.' },
    { customerId: customerIds[1], category: 'No Internet', priority: 'critical', description: 'Red light on router.' }
  ];
  const complaintIds: string[] = [];
  for (const comp of complaints) {
      const res = await api.post('/complaints', comp);
      if (![200, 201].includes(res.status)) logError(`Failed to create complaint for ${comp.customerId}`, res.data);
      complaintIds.push(res.data.id);
  }
  
  // Update one complaint to 'solved'
  if (complaintIds.length > 0) {
      const updateRes = await api.put(`/complaints/${complaintIds[0]}`, { status: 'solved', resolutionNotes: 'Reconfigured router.' });
      if (updateRes.status !== 200) logError('Failed to update complaint', updateRes.data);
  }
  log('Complaints created and updated successfully');

  // 8. Inventory & Expenses
  log('--- Adding Inventory and Expenses ---');
  const inventoryItem = { name: 'Optical Fiber Cable (Drum)', category: 'Cable', qty: 5, unit: 'rolls', price: 15000, salePrice: 18000 };
  const invRes = await api.post('/inventory', inventoryItem);
  if (![200, 201].includes(invRes.status)) logError('Failed to add inventory', invRes.data);

  const expense = { date: new Date().toISOString().split('T')[0], category: 'fuel', amount: 1500, name: 'Bike fuel for Ali Raza', paymentMethod: 'cash' };
  const expRes = await api.post('/expenses', expense);
  if (![200, 201].includes(expRes.status)) logError('Failed to add expense', expRes.data);
  log('Inventory and Expenses added successfully');

  // 9. Dashboard API Test
  log('--- Testing Dashboard APIs ---');
  const dashboardRes = await api.get('/dashboard/statistics');
  if (dashboardRes.status !== 200) logError('Failed to fetch dashboard stats', dashboardRes.data);
  log(`Dashboard Stats fetched successfully. Main Stats Length: ${dashboardRes.data.mainStats?.length}`);

  log('✅ ALL TESTS PASSED SUCCESSFULLY! Data seeded perfectly.');
}

runTests().catch(e => console.error(e));

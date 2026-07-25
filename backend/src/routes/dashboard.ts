import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { cache } from '../utils/cache';
import { getSupabaseClient } from '../database/client';

const router = express.Router();
const supabase = getSupabaseClient();

// Basic dashboard endpoint
router.get('/', authenticate, authorize('admin', 'staff'), async (req, res) => {
  try {
    const [customersResult, invoicesResult, connectionsResult, staffResult] = await Promise.all([
      supabase.from('customers').select('*', { count: 'exact', head: true }),
      supabase.from('invoices').select('paid_amount, remaining_balance, status', { count: 'exact', head: true }),
      supabase.from('connections').select('*', { count: 'exact', head: true }),
      supabase.from('staff').select('*', { count: 'exact', head: true }),
    ]);

    const totalCustomers = customersResult.count || 0;
    const totalInvoices = invoicesResult.count || 0;
    const totalConnections = connectionsResult.count || 0;
    const totalStaff = staffResult.count || 0;

    const invoices = invoicesResult.data || [];
    const totalRevenue = invoices.reduce((sum, inv) => sum + toNumber(inv.paid_amount), 0);
    const pendingRevenue = invoices.reduce((sum, inv) => sum + toNumber(inv.remaining_balance), 0);

    res.json({
      totalCustomers,
      totalInvoices,
      totalConnections,
      totalStaff,
      totalRevenue,
      pendingRevenue,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

const DASHBOARD_SECTIONS = [
  'mainStats',
  'customerGrowthData',
  'areaWiseCustomers',
  'paymentStatusData',
  'customerReportsSubsections',
  'newConnectionSubsections',
  'connectionStatusData',
  'revenueData',
  'staffPerformanceData',
  'areaDetails',
  'overview',
] as const;

type DashboardSection = typeof DASHBOARD_SECTIONS[number];

const STAGE_SECTION_MAP: Record<string, DashboardSection[]> = {
  summary: ['mainStats', 'customerReportsSubsections', 'newConnectionSubsections', 'overview'],
  charts: ['customerGrowthData', 'areaWiseCustomers', 'paymentStatusData', 'connectionStatusData', 'revenueData'],
  details: ['staffPerformanceData', 'areaDetails'],
  all: [...DASHBOARD_SECTIONS],
};

const EMPTY_OVERVIEW = {
  totalCustomers: 0,
  activeCustomers: 0,
  suspendedCustomers: 0,
  totalRevenue: 0,
  pendingRevenue: 0,
  totalCollected: 0,
  pendingConnections: 0,
  approvedConnections: 0,
  rejectedConnections: 0,
  totalStaff: 0,
  activeStaff: 0,
  totalAreas: 0,
  activeAreas: 0,
  totalComplaints: 0,
  pendingComplaints: 0,
  solvedComplaints: 0,
  totalInventory: 0,
  totalAnnouncements: 0,
};

const toNumber = (value: any) => Number(value) || 0;

const formatCompactCurrency = (value: number) => {
  if (Math.abs(value) >= 1_000_000) return `Rs. ${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `Rs. ${(value / 1_000).toFixed(0)}K`;
  return `Rs. ${Math.round(value).toLocaleString()}`;
};

const formatPercentChange = (current: number, previous: number) => {
  if (previous === 0) return current === 0 ? '0%' : '+100%';
  const delta = ((current - previous) / previous) * 100;
  const rounded = Math.round(delta);
  return `${rounded >= 0 ? '+' : ''}${rounded}%`;
};

const getMonthStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getTime();
const getMonthEnd = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999).getTime();

const buildMonthWindows = (count: number) => {
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short' });
  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (count - index - 1));
    return {
      label: formatter.format(date),
      start: getMonthStart(date),
      end: getMonthEnd(date),
    };
  });
};

const parseRequestedSections = (query: express.Request['query']) => {
  const sectionsParam = typeof query.sections === 'string'
    ? query.sections.split(',').map(v => v.trim()).filter(Boolean)
    : [];

  const requestedSections = new Set<DashboardSection>();
  sectionsParam.forEach((section) => {
    if ((DASHBOARD_SECTIONS as readonly string[]).includes(section)) {
      requestedSections.add(section as DashboardSection);
    }
  });

  if (requestedSections.size > 0) {
    return { sections: requestedSections, stage: 'custom', isPartial: requestedSections.size !== DASHBOARD_SECTIONS.length };
  }

  const stage = typeof query.stage === 'string' ? query.stage.toLowerCase() : 'all';
  const mappedSections = STAGE_SECTION_MAP[stage] || STAGE_SECTION_MAP.all;
  return { sections: new Set<DashboardSection>(mappedSections), stage: STAGE_SECTION_MAP[stage] ? stage : 'all', isPartial: stage !== 'all' };
};

// Invalidate dashboard cache when data changes
const invalidateDashboardCache = () => {
  cache.deletePattern(/^dashboard:/);
};

router.get('/statistics', authenticate, authorize('admin', 'staff'), async (req, res) => {
  try {
    const { sections, stage, isPartial } = parseRequestedSections(req.query);
    
    // Generate cache key based on requested sections
    const cacheKey = `dashboard:${stage}:${Array.from(sections).sort().join(',')}`;
    
    // Check cache first
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    try {
      const monthWindows = buildMonthWindows(6);
      const currentMonth = monthWindows[monthWindows.length - 1];
      const previousMonth = monthWindows[monthWindows.length - 2];

      // Prepare promises for parallel execution
      const promises: Record<string, any> = {};

      // --- SUMMARY STATS ---
      if (sections.has('mainStats') || sections.has('overview') || sections.has('customerReportsSubsections')) {
        promises.totalCustomers = supabase.from('customers').select('*', { count: 'exact', head: true });
        promises.activeCustomers = supabase.from('customers').select('*', { count: 'exact', head: true }).eq('status', 'active');
        promises.suspendedCustomers = supabase.from('customers').select('*', { count: 'exact', head: true }).eq('status', 'suspended');
        promises.totalRevenue = supabase.from('customers').select('fee').eq('status', 'active');
        promises.iptvCustomers = supabase.from('customers').select('*', { count: 'exact', head: true }).eq('iptv_enabled', true);
        promises.liveIpCustomers = supabase.from('customers').select('*', { count: 'exact', head: true }).eq('live_ip_enabled', true);

        promises.totalCollected = supabase.from('invoices').select('paid_amount');
        promises.totalInvoiceAmount = supabase.from('invoices').select('amount');

        promises.pendingConnections = supabase.from('connections').select('*', { count: 'exact', head: true }).eq('status', 'pending');
        promises.approvedConnections = supabase.from('connections').select('*', { count: 'exact', head: true }).eq('status', 'approved');
        promises.rejectedConnections = supabase.from('connections').select('*', { count: 'exact', head: true }).eq('status', 'rejected');

        promises.totalAreas = supabase.from('areas').select('*', { count: 'exact', head: true });
        promises.activeAreas = supabase.from('areas').select('*', { count: 'exact', head: true }).eq('status', 'active');

        promises.totalStaff = supabase.from('staff').select('*', { count: 'exact', head: true });
        promises.activeStaff = supabase.from('staff').select('*', { count: 'exact', head: true }).eq('status', 'active');
        promises.onLeaveStaff = supabase.from('staff').select('*', { count: 'exact', head: true }).eq('status', 'on-leave');

        promises.paidInvoices = supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'paid');
        promises.unpaidInvoices = supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'unpaid');
        promises.partialInvoices = supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'partial');
        promises.overdueInvoices = supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'overdue');
        promises.totalInvoices = supabase.from('invoices').select('*', { count: 'exact', head: true });

        // Current/Previous Month diffs
        promises.currentMonthCustomers = supabase.from('customers').select('*', { count: 'exact', head: true }).gte('created_at', currentMonth.start).lte('created_at', currentMonth.end);
        promises.previousMonthCustomers = supabase.from('customers').select('*', { count: 'exact', head: true }).gte('created_at', previousMonth.start).lte('created_at', previousMonth.end);
        promises.currentMonthConnections = supabase.from('connections').select('*', { count: 'exact', head: true }).gte('created_at', currentMonth.start).lte('created_at', currentMonth.end);
        promises.previousMonthConnections = supabase.from('connections').select('*', { count: 'exact', head: true }).gte('created_at', previousMonth.start).lte('created_at', previousMonth.end);
        promises.currentMonthAreas = supabase.from('areas').select('*', { count: 'exact', head: true }).gte('created_at', currentMonth.start).lte('created_at', currentMonth.end);
        promises.previousMonthAreas = supabase.from('areas').select('*', { count: 'exact', head: true }).gte('created_at', previousMonth.start).lte('created_at', previousMonth.end);
        promises.currentMonthStaff = supabase.from('staff').select('*', { count: 'exact', head: true }).gte('created_at', currentMonth.start).lte('created_at', currentMonth.end);
        promises.previousMonthStaff = supabase.from('staff').select('*', { count: 'exact', head: true }).gte('created_at', previousMonth.start).lte('created_at', previousMonth.end);

        // Current/Previous month revenue sums
        promises.currentMonthRevenue = supabase.from('invoices').select('paid_amount').gte('created_at', currentMonth.start).lte('created_at', currentMonth.end);
        promises.previousMonthRevenue = supabase.from('invoices').select('paid_amount').gte('created_at', previousMonth.start).lte('created_at', previousMonth.end);
      }

      if (sections.has('overview')) {
        promises.totalComplaints = supabase.from('complaints').select('*', { count: 'exact', head: true });
        promises.pendingComplaints = supabase.from('complaints').select('*', { count: 'exact', head: true }).eq('status', 'pending');
        promises.solvedComplaints = supabase.from('complaints').select('*', { count: 'exact', head: true }).eq('status', 'solved');
        promises.totalInventory = supabase.from('inventory').select('*', { count: 'exact', head: true });
        promises.totalAnnouncements = supabase.from('announcements').select('*', { count: 'exact', head: true });
      }

      if (sections.has('newConnectionSubsections') || sections.has('connectionStatusData')) {
        promises.inProgressConnections = supabase.from('connections').select('*', { count: 'exact', head: true }).eq('status', 'in-progress');
        promises.completedConnections = supabase.from('connections').select('*', { count: 'exact', head: true }).eq('status', 'completed');
        promises.onHoldConnections = supabase.from('connections').select('*', { count: 'exact', head: true }).eq('status', 'on-hold');
        promises.inactiveConnections = supabase.from('connections').select('*', { count: 'exact', head: true }).eq('status', 'inactive');
      }

      // --- CHARTS ---
      if (sections.has('customerGrowthData')) {
        for (const window of monthWindows) {
          promises[`custGrowth_${window.label}`] = supabase.from('customers').select('*', { count: 'exact', head: true }).gte('created_at', window.start).lte('created_at', window.end);
          promises[`custTotal_${window.label}`] = supabase.from('customers').select('*', { count: 'exact', head: true }).lte('created_at', window.end);
        }
      }

      if (sections.has('areaWiseCustomers') || sections.has('areaDetails')) {
        promises.allAreas = supabase.from('areas').select('name, status, created_at').order('name');
      }

      // --- DETAILS ---
      if (sections.has('staffPerformanceData')) {
        promises.allStaff = supabase.from('staff').select('id, name, status, assigned_area, rating, created_at').order('name');
      }

      if (sections.has('areaDetails')) {
        promises.allCustomers = supabase.from('customers').select('id, status, fee, created_at, area, iptv_enabled, live_ip_enabled, iptv_monthly_charges, live_ip_monthly_fee, name, mobile, package');
        promises.allInvoices = supabase.from('invoices').select('status, paid_amount, amount, remaining_balance, discount_amount, customer_id, last_payment_date, last_payment_amount, created_at, customer_name');
      }

      if (sections.has('revenueData')) {
        for (const window of monthWindows) {
          promises[`monthRevenue_${window.label}`] = supabase.from('invoices').select('paid_amount').gte('created_at', window.start).lte('created_at', window.end);
          promises[`monthExpenses_${window.label}`] = supabase.from('expenses').select('amount').gte('created_at', window.start).lte('created_at', window.end);
        }
      }

      // Execute initial parallel queries
      const results = await Promise.all(Object.entries(promises).map(async ([key, builder]) => {
        try {
          const result = await builder;
          return [key, result];
        } catch (error) {
          console.error(`Dashboard query error for ${key}:`, error);
          return [key, { data: [], count: 0, error }];
        }
      }));
      const data: Record<string, any> = Object.fromEntries(results);

      // Helper to extract count/total from query result
      const getCount = (result: any) => {
        if (!result) return 0;
        return Number(result.count || 0);
      };
      const getSum = (result: any) => {
        if (result.data && Array.isArray(result.data)) {
          return result.data.reduce((sum: number, row: any) => sum + Number(row.paid_amount || row.fee || row.amount || 0), 0);
        }
        return 0;
      };

      // --- SECONDARY AGGREGATIONS (Dependencies) ---
      const secondaryPromises: Record<string, any> = {};

      if (sections.has('areaWiseCustomers') && !sections.has('areaDetails')) {
        const allAreas = data.allAreas?.data || [];
        for (const area of allAreas) {
          secondaryPromises[`areaCustCount_${area.name}`] = supabase.from('customers').select('*', { count: 'exact', head: true }).eq('area', area.name);
          secondaryPromises[`areaCustRev_${area.name}`] = supabase.from('customers').select('fee').eq('area', area.name);
        }
      }

      if (sections.has('staffPerformanceData')) {
        const allStaff = data.allStaff?.data || [];
        for (const member of allStaff) {
          secondaryPromises[`staffConn_${member.id}`] = supabase.from('connections').select('*', { count: 'exact', head: true }).eq('assigned_staff', member.id);
          secondaryPromises[`staffCol_${member.id}`] = supabase.from('invoices').select('paid_amount').eq('collected_by', member.id);
        }
      }
      
      if (sections.has('areaDetails')) {
        const allAreas = data.allAreas?.data || [];
        for (const area of allAreas) {
          secondaryPromises[`areaConn_${area.name}`] = supabase.from('connections').select('*', { count: 'exact', head: true }).eq('area', area.name).eq('status', 'approved');
          secondaryPromises[`areaStaff_${area.name}`] = supabase.from('staff').select('*', { count: 'exact', head: true }).eq('assigned_area', area.name);
        }
      }

      if (Object.keys(secondaryPromises).length > 0) {
        const secondaryResults = await Promise.all(Object.entries(secondaryPromises).map(async ([key, builder]) => {
          try {
            const result = await builder;
            return [key, result];
          } catch (error) {
            console.error(`Dashboard secondary query error for ${key}:`, error);
            return [key, { data: [], count: 0, error }];
          }
        }));
        for (const [key, val] of secondaryResults) {
          data[key] = val;
        }
      }

      // --- BUILD RESPONSE ---
      
      const totalCustomers = getCount(data.totalCustomers);
      const activeCustomers = getCount(data.activeCustomers);
      const suspendedCustomers = getCount(data.suspendedCustomers);
      const totalRevenue = getSum(data.totalRevenue);
      const iptvCustomers = getCount(data.iptvCustomers);
      const liveIpCustomers = getCount(data.liveIpCustomers);

      const currentMonthRevenue = getSum(data.currentMonthRevenue);
      const previousMonthRevenue = getSum(data.previousMonthRevenue);

      const pendingRevenue = Math.max(getSum(data.totalInvoiceAmount) - getSum(data.totalCollected), 0);
      const avgRevenuePerCustomer = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

      const mainStats = sections.has('mainStats') ? [
        { name: 'Total Customers', value: totalCustomers.toLocaleString(), change: formatPercentChange(getCount(data.currentMonthCustomers), getCount(data.previousMonthCustomers)), icon: 'Users', color: 'text-[#14E8B4]', detail: `Active: ${activeCustomers} | Suspended: ${suspendedCustomers}` },
        { name: 'Active Users', value: activeCustomers.toLocaleString(), change: formatPercentChange(activeCustomers, Math.max(totalCustomers - getCount(data.currentMonthCustomers), 0)), icon: 'UserCheck', color: 'text-[#14E8B4]', detail: `IPTV: ${iptvCustomers} | Live IP: ${liveIpCustomers}` },
        { name: 'Monthly Revenue', value: formatCompactCurrency(currentMonthRevenue), change: formatPercentChange(currentMonthRevenue, previousMonthRevenue), icon: 'DollarSign', color: 'text-[#4C8DFF]', detail: `Collected: ${formatCompactCurrency(getSum(data.totalCollected))} | Pending: ${formatCompactCurrency(pendingRevenue)}` },
        { name: 'Pending Connections', value: getCount(data.pendingConnections).toString(), change: formatPercentChange(getCount(data.currentMonthConnections), getCount(data.previousMonthConnections)), icon: 'Server', color: 'text-[#F6B93B]', detail: `Approved: ${getCount(data.approvedConnections)} | Rejected: ${getCount(data.rejectedConnections)}` },
        { name: 'Suspended Users', value: suspendedCustomers.toString(), change: `${suspendedCustomers > 0 ? '+' : ''}0%`, icon: 'UserX', color: 'text-[#F5514B]', detail: `Overdue bills: ${getCount(data.overdueInvoices)} | Partial bills: ${getCount(data.partialInvoices)}` },
        { name: 'Pending Bills', value: (getCount(data.unpaidInvoices) + getCount(data.overdueInvoices) + getCount(data.partialInvoices)).toString(), change: `${pendingRevenue > 0 ? '+' : ''}0%`, icon: 'FileText', color: 'text-[#F6B93B]', detail: `Unpaid: ${getCount(data.unpaidInvoices)} | Overdue: ${getCount(data.overdueInvoices)}` },
        { name: 'Total Areas', value: getCount(data.totalAreas).toString(), change: formatPercentChange(getCount(data.currentMonthAreas), getCount(data.previousMonthAreas)), icon: 'MapPin', color: 'text-[#4C8DFF]', detail: `Covered: ${getCount(data.activeAreas)} | Inactive: ${getCount(data.totalAreas) - getCount(data.activeAreas)}` },
        { name: 'Staff Members', value: getCount(data.totalStaff).toString(), change: formatPercentChange(getCount(data.currentMonthStaff), getCount(data.previousMonthStaff)), icon: 'Users', color: 'text-[#14E8B4]', detail: `Active: ${getCount(data.activeStaff)} | On Leave: ${getCount(data.onLeaveStaff)}` },
      ] : [];

      const overview = sections.has('overview') ? {
        totalCustomers,
        activeCustomers,
        suspendedCustomers,
        totalRevenue,
        pendingRevenue,
        totalCollected: getSum(data.totalCollected),
        pendingConnections: getCount(data.pendingConnections),
        approvedConnections: getCount(data.approvedConnections),
        rejectedConnections: getCount(data.rejectedConnections),
        totalStaff: getCount(data.totalStaff),
        activeStaff: getCount(data.activeStaff),
        totalAreas: getCount(data.totalAreas),
        activeAreas: getCount(data.activeAreas),
        totalComplaints: getCount(data.totalComplaints),
        pendingComplaints: getCount(data.pendingComplaints),
        solvedComplaints: getCount(data.solvedComplaints),
        totalInventory: getCount(data.totalInventory),
        totalAnnouncements: getCount(data.totalAnnouncements),
      } : EMPTY_OVERVIEW;

      const newConnectionSubsections = sections.has('newConnectionSubsections') ? [
        { name: 'New Applications', count: getCount(data.pendingConnections), icon: 'Plus', color: 'text-[#14E8B4]', description: 'Pending approval' },
        { name: 'Approved', count: getCount(data.approvedConnections), icon: 'CheckCircle', color: 'text-[#4C8DFF]', description: 'Ready for installation' },
        { name: 'In Progress', count: getCount(data.inProgressConnections), icon: 'Clock', color: 'text-[#F6B93B]', description: 'Installation ongoing' },
        { name: 'Completed', count: getCount(data.completedConnections), icon: 'Zap', color: 'text-[#14E8B4]', description: 'Connections completed' },
        { name: 'Rejected', count: getCount(data.rejectedConnections), icon: 'XCircle', color: 'text-[#F5514B]', description: 'Rejected applications' },
        { name: 'On Hold', count: getCount(data.onHoldConnections), icon: 'AlertCircle', color: 'text-[#8996AD]', description: 'Awaiting documents' },
      ] : [];

      const collectionRate = getCount(data.totalInvoices) > 0 ? Math.round((getCount(data.paidInvoices) / getCount(data.totalInvoices)) * 100) : 0;

      const customerReportsSubsections = sections.has('customerReportsSubsections') ? [
        { name: 'Total Customers', count: totalCustomers.toLocaleString(), icon: 'Users', color: 'text-[#14E8B4]', description: `Active: ${activeCustomers} | Suspended: ${suspendedCustomers}` },
        { name: 'New This Month', count: getCount(data.currentMonthCustomers).toString(), icon: 'Plus', color: 'text-[#4C8DFF]', description: 'New registrations' },
        { name: 'Active Areas', count: getCount(data.activeAreas).toString(), icon: 'MapPin', color: 'text-[#14E8B4]', description: 'Covered service areas' },
        { name: 'Collection Rate', count: `${collectionRate}%`, icon: 'DollarSign', color: 'text-[#14E8B4]', description: 'Invoices collected' },
        { name: 'Avg Revenue/Customer', count: `Rs. ${Math.round(avgRevenuePerCustomer).toLocaleString()}`, icon: 'TrendingUp', color: 'text-[#4C8DFF]', description: 'Per active customer' },
        { name: 'View Full Reports', count: '→', icon: 'BarChart3', color: 'text-[#F6B93B]', description: 'Detailed report views' },
      ] : [];

      const paymentStatusData = sections.has('paymentStatusData') ? [
        { name: 'Paid', value: getCount(data.paidInvoices), color: '#14E8B4' },
        { name: 'Partial', value: getCount(data.partialInvoices), color: '#4C8DFF' },
        { name: 'Pending', value: getCount(data.unpaidInvoices) + getCount(data.overdueInvoices), color: '#F6B93B' },
      ] : [];

      const connectionStatusData = sections.has('connectionStatusData') ? [
        { name: 'Approved', value: getCount(data.approvedConnections), color: '#14E8B4' },
        { name: 'Pending', value: getCount(data.pendingConnections), color: '#F6B93B' },
        { name: 'In Progress', value: getCount(data.inProgressConnections), color: '#4C8DFF' },
        { name: 'Rejected', value: getCount(data.rejectedConnections) + getCount(data.inactiveConnections), color: '#F5514B' },
      ] : [];

      const customerGrowthData = sections.has('customerGrowthData') ? monthWindows.map((window) => ({
        month: window.label,
        newCustomers: getCount(data[`custGrowth_${window.label}`]),
        totalCustomers: getCount(data[`custTotal_${window.label}`]),
      })) : [];

      const revenueData = sections.has('revenueData') ? monthWindows.map((window) => {
        const monthRevenue = getSum(data[`monthRevenue_${window.label}`]);
        const monthExpenses = getSum(data[`monthExpenses_${window.label}`]);

        return {
          month: window.label,
          revenue: monthRevenue,
          expenses: monthExpenses,
          profit: monthRevenue - monthExpenses,
        };
      }) : [];

      const areaWiseCustomers = sections.has('areaWiseCustomers') ? (data.allAreas?.data || []).map((area: any) => {
        if (sections.has('areaDetails')) {
          const areaCustomers = (data.allCustomers?.data || []).filter((c: any) => c.area === area.name);
          return {
            name: area.name,
            customers: areaCustomers.length,
            revenue: areaCustomers.reduce((sum: number, c: any) => sum + toNumber(c.fee), 0),
          };
        } else {
          return {
            name: area.name,
            customers: getCount(data[`areaCustCount_${area.name}`]),
            revenue: getSum(data[`areaCustRev_${area.name}`]),
          };
        }
      }).sort((left: any, right: any) => right.customers - left.customers) : [];

      const staffPerformanceData = sections.has('staffPerformanceData') ? (data.allStaff?.data || []).map((member: any) => {
        return {
          name: member.name,
          connections: getCount(data[`staffConn_${member.id}`]),
          collections: `Rs. ${getSum(data[`staffCol_${member.id}`]).toLocaleString()}`,
          rating: toNumber(member.rating),
          status: member.status || 'inactive',
          area: member.assigned_area || 'Unassigned',
        };
      }).sort((left: any, right: any) => right.connections - left.connections) : [];

      const areaDetails = sections.has('areaDetails') ? (data.allAreas?.data || []).map((area: any) => {
        const areaCustomers = (data.allCustomers?.data || []).filter((c: any) => c.area === area.name);
        const areaCustomerIds = new Set(areaCustomers.map((c: any) => c.id));
        const areaInvoices = (data.allInvoices?.data || []).filter((i: any) => areaCustomerIds.has(i.customer_id));
        
        const recentCollections = areaInvoices
          .filter((i: any) => i.last_payment_date)
          .sort((left: any, right: any) => toNumber(right.last_payment_date) - toNumber(left.last_payment_date))
          .slice(0, 5)
          .map((i: any) => ({
            customerName: i.customer_name,
            amount: toNumber(i.last_payment_amount),
            date: i.last_payment_date,
          }));

        return {
          name: area.name,
          totalCustomers: areaCustomers.length,
          activeCustomers: areaCustomers.filter((c: any) => c.status === 'active').length,
          suspendedCustomers: areaCustomers.filter((c: any) => c.status === 'suspended').length,
          totalMonthlyRevenue: areaCustomers.reduce((sum: number, c: any) => sum + toNumber(c.fee), 0),
          paidCustomers: areaInvoices.filter((i: any) => i.status === 'paid').length,
          pendingPayments: areaInvoices.filter((i: any) => ['unpaid', 'overdue'].includes(i.status)).length,
          partialPayments: areaInvoices.filter((i: any) => i.status === 'partial').length,
          collectionPercentage: areaInvoices.length > 0 ? Math.round((areaInvoices.filter((i: any) => i.status === 'paid').length / areaInvoices.length) * 100) : 0,
          outstandingAmount: areaInvoices.reduce((sum: number, i: any) => sum + toNumber(i.remaining_balance), 0),
          recentCollections,
          iptvCustomers: areaCustomers.filter((c: any) => c.iptv_enabled).length,
          liveIpCustomers: areaCustomers.filter((c: any) => c.live_ip_enabled).length,
          iptvRevenue: areaCustomers.reduce((sum: number, c: any) => sum + toNumber(c.iptv_monthly_charges), 0),
          liveIpRevenue: areaCustomers.reduce((sum: number, c: any) => sum + toNumber(c.live_ip_monthly_fee), 0),
          discountGiven: areaInvoices.reduce((sum: number, i: any) => sum + toNumber(i.discount_amount), 0),
          connections: getCount(data[`areaConn_${area.name}`]),
          staff: getCount(data[`areaStaff_${area.name}`]),
        };
      }).sort((left: any, right: any) => right.totalCustomers - left.totalCustomers) : [];

      const responseData = {
        mainStats,
        customerGrowthData,
        areaWiseCustomers,
        paymentStatusData,
        customerReportsSubsections,
        newConnectionSubsections,
        connectionStatusData,
        revenueData,
        staffPerformanceData,
        areaDetails,
        overview,
        meta: {
          stage,
          isPartial,
          requestedSections: Array.from(sections),
          availableSections: DASHBOARD_SECTIONS,
        },
      };
      
      // Cache the response for 1 minute
      cache.set(cacheKey, responseData, 60 * 1000);
      
      res.json(responseData);
    } catch (error) {
      console.error('Dashboard statistics error:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
  } catch (error) {
    console.error('Dashboard statistics error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

export default router;


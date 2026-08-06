import express from 'express';
import { logger } from '../utils/logger';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { getSupabaseClient } from '../database/client';
import {
  generatePDFReport,
  generateExcelReport,
  getCustomerReportData,
  getInvoiceReportData,
  getExpenseReportData,
  getStaffReportData,
  getInventoryReportData,
  getRevenueReportData
} from '../services/reports';

const router = express.Router();
const supabase = getSupabaseClient();

// Apply authentication to all routes
router.use(authenticate);

// Summary endpoint for quick overview
router.get('/summary', authorize('admin', 'staff'), async (req, res) => {
  try {
    const [customersResult, invoicesResult, expensesResult, staffResult] = await Promise.all([
      supabase.from('customers').select('*', { count: 'exact', head: true }),
      supabase.from('invoices').select('paid_amount, remaining_balance, amount'),
      supabase.from('expenses').select('amount'),
      supabase.from('staff').select('*', { count: 'exact', head: true }),
    ]);

    const totalCustomers = customersResult.count || 0;
    const totalStaff = staffResult.count || 0;
    const invoices = invoicesResult.data || [];
    const expenses = expensesResult.data || [];

    const totalRevenue = invoices.reduce((sum, inv) => sum + toNumber(inv.paid_amount), 0);
    const pendingRevenue = invoices.reduce((sum, inv) => sum + toNumber(inv.remaining_balance), 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + toNumber(exp.amount), 0);

    res.json({
      totalCustomers,
      totalStaff,
      totalRevenue,
      pendingRevenue,
      totalExpenses,
      profit: totalRevenue - totalExpenses,
    });
  } catch (error) {
    logger.error('Summary report error:', error);
    res.status(500).json({ error: 'Failed to generate summary report' });
  }
});

const toNumber = (value: any) => Number(value) || 0;
const isInRange = (value: any, start: number, end: number) => {
  const numericValue = toNumber(value);
  return numericValue >= start && numericValue <= end;
};

const buildMonthWindows = (count = 6) => {
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short' });

  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (count - index - 1));

    return {
      label: formatter.format(date),
      start: new Date(date.getFullYear(), date.getMonth(), 1).getTime(),
      end: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999).getTime(),
    };
  });
};

const parseStageOptions = (query: express.Request['query']) => {
  const stage = typeof query.stage === 'string' ? query.stage.toLowerCase() : 'all';
  const parsedLimit = parseInt((query.detailsLimit as string) || '', 10);
  const detailsLimit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : undefined;

  return {
    stage: ['summary', 'details', 'all'].includes(stage) ? stage : 'all',
    includeDetails: stage !== 'summary',
    detailsLimit,
  };
};

// Customer Reports (admin and staff can view)
router.get('/customers', authorize('admin', 'staff'), async (req, res) => {
  try {
    const { stage, includeDetails, detailsLimit } = parseStageOptions(req.query);
    const monthWindows = buildMonthWindows();

    const [totalResult, activeResult, suspendedResult, customerMetricsResult, customersResult] = await Promise.all([
        supabase.from('customers').select('*', { count: 'exact', head: true }),
        supabase.from('customers').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('customers').select('*', { count: 'exact', head: true }).eq('status', 'suspended'),
        supabase.from('customers').select('status, fee, iptv_enabled, live_ip_enabled, iptv_monthly_charges, live_ip_monthly_fee, created_at'),
        includeDetails
          ? supabase.from('customers').select('*').order('created_at', { ascending: false }).limit(detailsLimit)
          : Promise.resolve({ data: [] }),
      ]);

      const total = totalResult.count || 0;
      const active = activeResult.count || 0;
      const suspended = suspendedResult.count || 0;
      const customerMetrics = customerMetricsResult.data || [];
      const customers = customersResult.data || [];

      const totalRevenue = customerMetrics.reduce((sum, customer) => sum + toNumber(customer.fee), 0);
      const avgRevenue = total > 0 ? totalRevenue / total : 0;
      const iptvCustomers = customerMetrics.filter((customer) => customer.iptv_enabled).length;
      const liveIpCustomers = customerMetrics.filter((customer) => customer.live_ip_enabled).length;
      const iptvRevenue = customerMetrics.reduce((sum, customer) => sum + toNumber(customer.iptv_monthly_charges), 0);
      const liveIpRevenue = customerMetrics.reduce((sum, customer) => sum + toNumber(customer.live_ip_monthly_fee), 0);

      const monthlyData = monthWindows.map((window) => {
        const monthCustomers = customerMetrics.filter((customer) => isInRange(customer.created_at, window.start, window.end));
        return {
          month: window.label,
          new: monthCustomers.length,
          active: monthCustomers.filter((customer) => customer.status === 'active').length,
          suspended: monthCustomers.filter((customer) => customer.status === 'suspended').length,
        };
      });

      res.json({
        total,
        active,
        suspended,
        totalRevenue,
        avgRevenue,
        iptvCustomers,
        liveIpCustomers,
        customers,
        monthlyData,
        summary: {
          totalRevenue,
          avgRevenue,
          iptvRevenue,
          liveIpRevenue,
        },
        meta: {
          stage,
          detailsIncluded: includeDetails,
          detailsCount: customers.length,
        },
      });
  } catch (error) {
    logger.error('Customer report error:', error);
    res.status(500).json({ error: 'Failed to generate customer report' });
  }
});

// Billing Reports (admin and staff can view)
router.get('/billing', authorize('admin', 'staff'), async (req, res) => {
  try {
    const { stage, includeDetails, detailsLimit } = parseStageOptions(req.query);
    const monthWindows = buildMonthWindows();

    const [totalResult, paidResult, unpaidResult, partialResult, overdueResult, invoiceMetricsResult, invoicesResult] = await Promise.all([
        supabase.from('invoices').select('*', { count: 'exact', head: true }),
        supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'paid'),
        supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'unpaid'),
        supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'partial'),
        supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'overdue'),
        supabase.from('invoices').select('status, paid_amount, remaining_balance, discount_amount, amount, created_at'),
        includeDetails
          ? supabase.from('invoices').select('*').order('created_at', { ascending: false }).limit(detailsLimit)
          : Promise.resolve({ data: [] }),
      ]);

      const total = totalResult.count || 0;
      const paid = paidResult.count || 0;
      const unpaid = unpaidResult.count || 0;
      const partial = partialResult.count || 0;
      const overdue = overdueResult.count || 0;
      const invoiceMetrics = invoiceMetricsResult.data || [];
      const invoices = invoicesResult.data || [];

      const totalRevenue = invoiceMetrics.reduce((sum, invoice) => sum + toNumber(invoice.paid_amount), 0);
      const pendingRevenue = invoiceMetrics.reduce((sum, invoice) => sum + toNumber(invoice.remaining_balance), 0);
      const discountGiven = invoiceMetrics.reduce((sum, invoice) => sum + toNumber(invoice.discount_amount), 0);

      const monthlyData = monthWindows.map((window) => {
        const monthInvoices = invoiceMetrics.filter((invoice) => isInRange(invoice.created_at, window.start, window.end));
        return {
          month: window.label,
          collected: monthInvoices.reduce((sum, invoice) => sum + toNumber(invoice.paid_amount), 0),
          pending: monthInvoices.reduce((sum, invoice) => sum + toNumber(invoice.remaining_balance), 0),
          overdue: monthInvoices.filter((invoice) => invoice.status === 'overdue').length,
        };
      });

      res.json({
        total,
        paid,
        unpaid,
        partial,
        overdue,
        totalRevenue,
        pendingRevenue,
        discountGiven,
        invoices,
        monthlyData,
        summary: {
          collectionRate: total > 0 ? Math.round((paid / total) * 100) : 0,
          totalRevenue,
          pendingRevenue,
          discountGiven,
        },
        meta: {
          stage,
          detailsIncluded: includeDetails,
          detailsCount: invoices.length,
        },
      });
  } catch (error) {
    logger.error('Billing report error:', error);
    res.status(500).json({ error: 'Failed to generate billing report' });
  }
});

// Income Reports (admin and staff can view)
router.get('/income', authorize('admin', 'staff'), async (req, res) => {
  try {
    const { stage } = parseStageOptions(req.query);
    const monthWindows = buildMonthWindows();

    const { data: invoicesResult } = await supabase.from('invoices').select('paid_amount, amount, created_at');
    const invoices = invoicesResult || [];

    const monthly: Record<string, { collected: number; pending: number }> = {};
    let totalCollected = 0;
    let totalPending = 0;

    for (const invoice of invoices) {
      const paid = toNumber(invoice.paid_amount);
      const pending = Math.max(toNumber(invoice.amount) - paid, 0);
      totalCollected += paid;
      totalPending += pending;

      const matchingWindow = monthWindows.find((w) => isInRange(invoice.created_at, w.start, w.end));
      const month = matchingWindow?.label || 'Other';

      if (!monthly[month]) monthly[month] = { collected: 0, pending: 0 };
      monthly[month].collected += paid;
      monthly[month].pending += pending;
    }

    const monthlyData = Object.entries(monthly).map(([month, value]) => ({
      month,
      collected: value.collected,
      pending: value.pending,
    }));

    res.json({
      totalCollected,
      totalPending,
      monthly,
      monthlyData,
      meta: { stage },
    });
  } catch (error) {
    logger.error('Income report error:', error);
    res.status(500).json({ error: 'Failed to generate income report' });
  }
});

// Expense Reports (admin and staff can view)
router.get('/expenses', authorize('admin', 'staff'), async (req, res) => {
  try {
    const { stage, includeDetails, detailsLimit } = parseStageOptions(req.query);

    const [expenseMetricsResult, expensesResult] = await Promise.all([
        supabase.from('expenses').select('category, amount'),
        includeDetails
          ? supabase.from('expenses').select('*').order('date', { ascending: false }).limit(detailsLimit)
          : Promise.resolve({ data: [] }),
      ]);

      const expenseMetrics = expenseMetricsResult.data || [];
      const expenses = expensesResult.data || [];

      const byCategory = expenseMetrics.reduce((accumulator: Record<string, number>, expense) => {
        const category = expense.category || 'Other';
        accumulator[category] = (accumulator[category] || 0) + toNumber(expense.amount);
        return accumulator;
      }, {});

      const total = expenseMetrics.reduce((sum, expense) => sum + toNumber(expense.amount), 0);
      const categoryData = Object.entries(byCategory)
        .map(([category, amount]) => ({
          category,
          amount: toNumber(amount),
          percentage: total > 0 ? Math.round((toNumber(amount) / total) * 100) : 0,
        }))
        .sort((left, right) => right.amount - left.amount);

      res.json({
        total,
        byCategory,
        categoryData,
        expenses,
        summary: {
          categoryCount: categoryData.length,
          topCategory: categoryData[0] || null,
        },
        meta: {
          stage,
          detailsIncluded: includeDetails,
          detailsCount: expenses.length,
        },
      });
  } catch (error) {
    logger.error('Expense report error:', error);
    res.status(500).json({ error: 'Failed to generate expense report' });
  }
});

// Connections Reports (admin and staff can view)
router.get('/connections', authorize('admin', 'staff'), async (req, res) => {
  try {
    const monthWindows = buildMonthWindows();

    const [totalConnectionsResult, activeConnectionsResult, pendingConnectionsResult, rejectedConnectionsResult, connectionMetricsResult] = await Promise.all([
      supabase.from('connections').select('*', { count: 'exact', head: true }),
      supabase.from('connections').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('connections').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('connections').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
      supabase.from('connections').select('status, created_at, area, package'),
    ]);

    const totalConnections = totalConnectionsResult.count || 0;
    const activeConnections = activeConnectionsResult.count || 0;
    const pendingConnections = pendingConnectionsResult.count || 0;
    const rejectedConnections = rejectedConnectionsResult.count || 0;
    const connectionMetrics = connectionMetricsResult.data || [];

    const monthlyData = monthWindows.map((window) => {
      const monthConnections = connectionMetrics.filter((c) => isInRange(c.created_at, window.start, window.end));
      return {
        month: window.label,
        newRequests: monthConnections.length,
        approved: monthConnections.filter((c) => c.status === 'active').length,
        rejected: monthConnections.filter((c) => c.status === 'rejected').length,
        pending: monthConnections.filter((c) => c.status === 'pending').length,
      };
    });

    // Area-wise distribution
    const areaMap: Record<string, { total: number; active: number; rejected: number }> = {};
    connectionMetrics.forEach((c) => {
      const area = c.area || 'Unknown';
      if (!areaMap[area]) areaMap[area] = { total: 0, active: 0, rejected: 0 };
      areaMap[area].total++;
      if (c.status === 'active') areaMap[area].active++;
      if (c.status === 'rejected') areaMap[area].rejected++;
    });
    const areaWiseConnections = Object.entries(areaMap).map(([name, data]) => ({
      name,
      requests: data.total,
      approved: data.active,
      rejected: data.rejected,
    }));

    // Package distribution
    const packageMap: Record<string, number> = {};
    connectionMetrics.forEach((c) => {
      const pkg = c.package || 'Unknown';
      packageMap[pkg] = (packageMap[pkg] || 0) + 1;
    });
    const packageDistribution = Object.entries(packageMap).map(([name, connections]) => ({ name, connections }));

    res.json({
      totalConnections,
      activeConnections,
      pendingConnections,
      rejectedConnections,
      monthlyData,
      areaWiseConnections,
      packageDistribution,
      approvalStatusData: [
        { name: 'Active', value: activeConnections, color: '#14E8B4' },
        { name: 'Pending', value: pendingConnections, color: '#F6B93B' },
        { name: 'Rejected', value: rejectedConnections, color: '#F5514B' },
      ],
      summary: {
        approvalRate: totalConnections > 0 ? Math.round((activeConnections / totalConnections) * 100) : 0,
      },
    });
  } catch (error) {
    logger.error('Connections report error:', error);
    res.status(500).json({ error: 'Failed to generate connections report' });
  }
});

// Packages Reports (admin and staff can view)
router.get('/packages', authorize('admin', 'staff'), async (req, res) => {
  try {
    const [packagesResult, customerMetricsResult] = await Promise.all([
      supabase.from('packages').select('*'),
      supabase.from('customers').select('package, fee, status, created_at'),
    ]);

    const packages = packagesResult.data || [];
    const customerMetrics = customerMetricsResult.data || [];

    const packageReports = packages.map((pkg) => {
      const pkgCustomers = customerMetrics.filter(
        (c) => c.package === pkg.id || c.package === pkg.name
      );
      const activeCustomers = pkgCustomers.filter((c) => c.status === 'active').length;
      const revenue = pkgCustomers.reduce((sum, c) => sum + toNumber(c.fee), 0);

      return {
        id: pkg.id,
        name: pkg.name || 'Unknown',
        speed: pkg.speed || pkg.bandwidth || 'â€”',
        price: toNumber(pkg.price || pkg.monthly_fee),
        customers: pkgCustomers.length,
        activeCustomers,
        revenue,
      };
    });

    const totalCustomers = packageReports.reduce((sum, p) => sum + p.customers, 0);
    const totalRevenue = packageReports.reduce((sum, p) => sum + p.revenue, 0);

    const customerDistribution = packageReports.map((p) => ({
      name: p.name,
      customers: p.customers,
    }));

    const revenueDistribution = packageReports.map((p) => ({
      name: p.name,
      revenue: p.revenue,
    }));

    res.json({
      packageReports,
      totalPackages: packages.length,
      totalCustomers,
      totalRevenue,
      customerDistribution,
      revenueDistribution,
    });
  } catch (error) {
    logger.error('Packages report error:', error);
    res.status(500).json({ error: 'Failed to generate packages report' });
  }
});

// Business Reports (admin only)
router.get('/business', authorize('admin'), async (req, res) => {
  try {
    const { stage, includeDetails, detailsLimit } = parseStageOptions(req.query);

    const [
        totalCustomersResult, activeCustomersResult, suspendedCustomersResult,
        totalInvoicesResult, paidInvoicesResult,
        invoiceMetricsResult, expenseMetricsResult, inventoryMetricsResult,
        customersResult, invoicesResult, expensesResult, inventoryResult
      ] = await Promise.all([
        supabase.from('customers').select('*', { count: 'exact', head: true }),
        supabase.from('customers').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('customers').select('*', { count: 'exact', head: true }).eq('status', 'suspended'),
        supabase.from('invoices').select('*', { count: 'exact', head: true }),
        supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'paid'),
        supabase.from('invoices').select('paid_amount'),
        supabase.from('expenses').select('amount'),
        supabase.from('inventory').select('qty, price'),
        includeDetails ? supabase.from('customers').select('name, mobile, area, status, package, fee').order('created_at', { ascending: false }).limit(detailsLimit) : Promise.resolve({ data: [] }),
        includeDetails ? supabase.from('invoices').select('customer_name, amount, paid_amount, status, created_at').order('created_at', { ascending: false }).limit(detailsLimit) : Promise.resolve({ data: [] }),
        includeDetails ? supabase.from('expenses').select('category, amount, date, description').order('date', { ascending: false }).limit(detailsLimit) : Promise.resolve({ data: [] }),
        includeDetails ? supabase.from('inventory').select('name, qty, price, category').order('created_at', { ascending: false }).limit(detailsLimit) : Promise.resolve({ data: [] }),
      ]);

      const totalCustomers = totalCustomersResult.count || 0;
      const activeCustomers = activeCustomersResult.count || 0;
      const suspendedCustomers = suspendedCustomersResult.count || 0;
      const totalInvoices = totalInvoicesResult.count || 0;
      const paidInvoices = paidInvoicesResult.count || 0;
      const invoiceMetrics = invoiceMetricsResult.data || [];
      const expenseMetrics = expenseMetricsResult.data || [];
      const inventoryMetrics = inventoryMetricsResult.data || [];
      const customers = customersResult.data || [];
      const invoices = invoicesResult.data || [];
      const expenses = expensesResult.data || [];
      const inventory = inventoryResult.data || [];

      const totalRevenue = invoiceMetrics.reduce((sum, invoice) => sum + toNumber(invoice.paid_amount), 0);
      const totalExpenses = expenseMetrics.reduce((sum, expense) => sum + toNumber(expense.amount), 0);
      const inventoryValue = inventoryMetrics.reduce(
        (sum, item) => sum + (toNumber(item.qty) * toNumber(item.price)), 0
      );

      res.json({
        overview: {
          totalCustomers,
          activeCustomers,
          suspendedCustomers,
          totalRevenue,
          totalExpenses,
          profit: totalRevenue - totalExpenses,
          inventoryValue,
          totalInvoices,
          paidInvoices,
        },
        customers,
        invoices,
        expenses,
        inventory,
        summary: {
          inactiveCustomers: totalCustomers - activeCustomers,
          inventoryItems: inventoryMetrics.length,
        },
        meta: {
          stage,
          detailsIncluded: includeDetails,
          detailsCount: {
            customers: customers.length,
            invoices: invoices.length,
            expenses: expenses.length,
            inventory: inventory.length,
          },
        },
      });
  } catch (error) {
    logger.error('Business report error:', error);
    res.status(500).json({ error: 'Failed to generate business report' });
  }
});

// Export report as PDF
router.get('/export/:type/pdf', authorize('admin', 'staff'), async (req: AuthRequest, res) => {
  try {
    const { type } = req.params;
    const filters = req.query;
    
    let data: any[] = [];
    
    switch (type) {
      case 'customers':
        data = await getCustomerReportData(filters);
        break;
      case 'invoices':
        data = await getInvoiceReportData(filters);
        break;
      case 'expenses':
        data = await getExpenseReportData(filters);
        break;
      case 'staff':
        data = await getStaffReportData(filters);
        break;
      case 'inventory':
        data = await getInventoryReportData(filters);
        break;
      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }
    
    const pdfBuffer = await generatePDFReport(type, data, filters);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${type}-report.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    logger.error('Export PDF error:', error);
    res.status(500).json({ error: 'Failed to generate PDF report' });
  }
});

// Export report as Excel
router.get('/export/:type/excel', authorize('admin', 'staff'), async (req: AuthRequest, res) => {
  try {
    const { type } = req.params;
    const filters = req.query;
    
    let data: any[] = [];
    
    switch (type) {
      case 'customers':
        data = await getCustomerReportData(filters);
        break;
      case 'invoices':
        data = await getInvoiceReportData(filters);
        break;
      case 'expenses':
        data = await getExpenseReportData(filters);
        break;
      case 'staff':
        data = await getStaffReportData(filters);
        break;
      case 'inventory':
        data = await getInventoryReportData(filters);
        break;
      case 'revenue': {
        const revenueData = await getRevenueReportData(filters);
        data = revenueData.invoices;
        break;
      }
      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }
    
    const excelBuffer = await generateExcelReport(type, data, filters);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${type}-report.xlsx`);
    res.send(excelBuffer);
  } catch (error) {
    logger.error('Export Excel error:', error);
    res.status(500).json({ error: 'Failed to generate Excel report' });
  }
});

// Get revenue report with filters
router.get('/revenue', authorize('admin', 'staff'), async (req: AuthRequest, res) => {
  try {
    const filters = req.query;
    const revenueData = await getRevenueReportData(filters);
    res.json(revenueData);
  } catch (error) {
    logger.error('Revenue report error:', error);
    res.status(500).json({ error: 'Failed to generate revenue report' });
  }
});

// Export report as CSV
router.get('/export/:type/csv', authorize('admin', 'staff'), async (req: AuthRequest, res) => {
  try {
    const { type } = req.params;
    const filters = req.query;
    
    let data: any[] = [];
    
    switch (type) {
      case 'customers':
        data = await getCustomerReportData(filters);
        break;
      case 'invoices':
        data = await getInvoiceReportData(filters);
        break;
      case 'expenses':
        data = await getExpenseReportData(filters);
        break;
      case 'staff':
        data = await getStaffReportData(filters);
        break;
      case 'inventory':
        data = await getInventoryReportData(filters);
        break;
      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }
    
    // Generate CSV
    const headers = Object.keys(data[0] || {}).join(',');
    const rows = data.map((item: any) => 
      Object.values(item).map((val: any) => 
        typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
      ).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${type}-report.csv`);
    res.send(csv);
  } catch (error) {
    logger.error('Export CSV error:', error);
    res.status(500).json({ error: 'Failed to generate CSV report' });
  }
});

// Profitability Reports (admin and staff can view)
router.get('/profitability', authorize('admin', 'staff'), async (req, res) => {
  try {
    const [connInvoices, installationExpenses, monthlyInvoices, operatingExpenses] = await Promise.all([
      supabase.from('invoices').select('paid_amount').eq('type', 'connection_fee').eq('status', 'paid'),
      supabase.from('expenses').select('amount').or('category.eq.Installation,reference_type.eq.NEW_CONNECTION'),
      supabase.from('invoices').select('paid_amount').eq('type', 'monthly_bill').eq('status', 'paid'),
      supabase.from('expenses').select('amount').neq('category', 'Installation')
    ]);

    const connectionFeeRevenue = (connInvoices.data || []).reduce((sum, i) => sum + toNumber(i.paid_amount), 0);
    const totalInstallationCost = (installationExpenses.data || []).reduce((sum, e) => sum + toNumber(e.amount), 0);
    const installationProfit = connectionFeeRevenue - totalInstallationCost;

    const monthlyRevenue = (monthlyInvoices.data || []).reduce((sum, i) => sum + toNumber(i.paid_amount), 0);
    const totalOperatingExpenses = (operatingExpenses.data || []).reduce((sum, e) => sum + toNumber(e.amount), 0);
    const businessProfit = monthlyRevenue - totalOperatingExpenses - totalInstallationCost;

    res.json({
      installationProfit: {
        connectionFeeRevenue,
        totalInstallationCost,
        profit: installationProfit,
        marginPercentage: connectionFeeRevenue > 0 ? Math.round((installationProfit / connectionFeeRevenue) * 100) : 0
      },
      businessProfit: {
        monthlyRevenue,
        operatingExpenses: totalOperatingExpenses,
        installationExpenses: totalInstallationCost,
        profit: businessProfit,
        marginPercentage: monthlyRevenue > 0 ? Math.round((businessProfit / monthlyRevenue) * 100) : 0
      }
    });
  } catch (error) {
    logger.error('Profitability report error:', error);
    res.status(500).json({ error: 'Failed to generate profitability report' });
  }
});

export default router;


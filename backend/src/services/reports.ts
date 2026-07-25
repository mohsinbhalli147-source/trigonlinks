import { getSupabaseClient } from '../database/client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

const supabase = getSupabaseClient();

// Generate PDF report
export const generatePDFReport = async (
  reportType: string,
  data: any[],
  filters: any = {}
): Promise<Buffer> => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`, 14, 22);
  
  // Add date range if provided
  if (filters.startDate || filters.endDate) {
    doc.setFontSize(10);
    const dateRange = `Date: ${filters.startDate ? format(new Date(filters.startDate), 'MMM dd, yyyy') : 'Start'} - ${filters.endDate ? format(new Date(filters.endDate), 'MMM dd, yyyy') : 'End'}`;
    doc.text(dateRange, 14, 30);
  }
  
  // Add generation time
  doc.setFontSize(8);
  doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 14, 36);
  
  // Define table columns based on report type
  let columns: string[] = [];
  let tableData: any[][] = [];
  
  switch (reportType) {
    case 'customers':
      columns = ['ID', 'Name', 'Mobile', 'Area', 'Package', 'Status', 'Fee', 'IPTV', 'Live IP'];
      tableData = data.map((c: any) => [
        c.id?.substring(0, 8) || 'N/A',
        c.name || 'N/A',
        c.mobile || 'N/A',
        c.area || 'N/A',
        c.package || 'N/A',
        c.status || 'N/A',
        `Rs. ${c.fee || 0}`,
        c.iptvEnabled ? 'Yes' : 'No',
        c.liveIpEnabled ? 'Yes' : 'No'
      ]);
      break;
      
    case 'invoices':
      columns = ['Invoice #', 'Customer', 'Amount', 'Paid', 'Status', 'Due Date'];
      tableData = data.map((i: any) => [
        i.invoiceNumber || 'N/A',
        i.customerName || 'N/A',
        `Rs. ${i.totalAmount || i.amount || 0}`,
        `Rs. ${i.paidAmount || 0}`,
        i.status || 'N/A',
        i.dueDate ? format(new Date(i.dueDate), 'MMM dd, yyyy') : 'N/A'
      ]);
      break;
      
    case 'expenses':
      columns = ['ID', 'Name', 'Category', 'Amount', 'Date'];
      tableData = data.map((e: any) => [
        e.id?.substring(0, 8) || 'N/A',
        e.name || 'N/A',
        e.category || 'N/A',
        `Rs. ${e.amount || 0}`,
        e.date ? format(new Date(e.date), 'MMM dd, yyyy') : 'N/A'
      ]);
      break;
      
    case 'staff':
      columns = ['ID', 'Name', 'Role', 'Phone', 'Status', 'Area'];
      tableData = data.map((s: any) => [
        s.id?.substring(0, 8) || 'N/A',
        s.name || 'N/A',
        s.role || 'N/A',
        s.phone || 'N/A',
        s.status || 'N/A',
        s.assignedArea || 'N/A'
      ]);
      break;
      
    case 'inventory':
      columns = ['ID', 'Name', 'Category', 'Quantity', 'Price', 'Status'];
      tableData = data.map((i: any) => [
        i.id?.substring(0, 8) || 'N/A',
        i.name || 'N/A',
        i.category || 'N/A',
        i.qty || 0,
        `Rs. ${i.price || 0}`,
        i.status || 'N/A'
      ]);
      break;
      
    default:
      columns = ['ID', 'Name', 'Status'];
      tableData = data.map((d: any) => [
        d.id?.substring(0, 8) || 'N/A',
        d.name || 'N/A',
        d.status || 'N/A'
      ]);
  }
  
  // Add table
  autoTable(doc, {
    head: [columns],
    body: tableData,
    startY: 45,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
  });
  
  // Add summary if applicable
  if (data.length > 0) {
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text(`Total Records: ${data.length}`, 14, finalY);
    
    // Add totals for financial reports
    if (reportType === 'invoices') {
      const totalAmount = data.reduce((sum: number, i: any) => sum + (i.totalAmount || i.amount || 0), 0);
      const totalPaid = data.reduce((sum: number, i: any) => sum + (i.paidAmount || 0), 0);
      doc.text(`Total Amount: Rs. ${totalAmount.toLocaleString()}`, 14, finalY + 8);
      doc.text(`Total Paid: Rs. ${totalPaid.toLocaleString()}`, 14, finalY + 16);
    } else if (reportType === 'expenses') {
      const totalExpenses = data.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
      doc.text(`Total Expenses: Rs. ${totalExpenses.toLocaleString()}`, 14, finalY + 8);
    }
  }
  
  return Buffer.from(doc.output('arraybuffer'));
};

// Generate Excel report
export const generateExcelReport = async (
  reportType: string,
  data: any[],
  filters: any = {}
): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(reportType.charAt(0).toUpperCase() + reportType.slice(1));
  
  // Define columns based on report type
  let columns: any[] = [];
  
  switch (reportType) {
    case 'customers':
      columns = [
        { header: 'ID', key: 'id', width: 15 },
        { header: 'Name', key: 'name', width: 25 },
        { header: 'Mobile', key: 'mobile', width: 15 },
        { header: 'Area', key: 'area', width: 15 },
        { header: 'Package', key: 'package', width: 15 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Fee', key: 'fee', width: 12 },
        { header: 'IPTV', key: 'iptvEnabled', width: 10 },
        { header: 'Live IP', key: 'liveIpEnabled', width: 10 },
      ];
      break;
      
    case 'invoices':
      columns = [
        { header: 'Invoice #', key: 'invoiceNumber', width: 20 },
        { header: 'Customer', key: 'customerName', width: 25 },
        { header: 'Amount', key: 'amount', width: 12 },
        { header: 'Paid', key: 'paidAmount', width: 12 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Due Date', key: 'dueDate', width: 15 },
      ];
      break;
      
    case 'expenses':
      columns = [
        { header: 'ID', key: 'id', width: 15 },
        { header: 'Name', key: 'name', width: 25 },
        { header: 'Category', key: 'category', width: 15 },
        { header: 'Amount', key: 'amount', width: 12 },
        { header: 'Date', key: 'date', width: 15 },
      ];
      break;
      
    case 'staff':
      columns = [
        { header: 'ID', key: 'id', width: 15 },
        { header: 'Name', key: 'name', width: 25 },
        { header: 'Role', key: 'role', width: 15 },
        { header: 'Phone', key: 'phone', width: 15 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Area', key: 'assignedArea', width: 15 },
      ];
      break;
      
    case 'inventory':
      columns = [
        { header: 'ID', key: 'id', width: 15 },
        { header: 'Name', key: 'name', width: 25 },
        { header: 'Category', key: 'category', width: 15 },
        { header: 'Quantity', key: 'qty', width: 12 },
        { header: 'Price', key: 'price', width: 12 },
        { header: 'Status', key: 'status', width: 12 },
      ];
      break;
      
    default:
      columns = [
        { header: 'ID', key: 'id', width: 15 },
        { header: 'Name', key: 'name', width: 25 },
        { header: 'Status', key: 'status', width: 12 },
      ];
  }
  
  worksheet.columns = columns;
  
  // Style header row
  worksheet.getRow(1).font = { bold: true, size: 12 };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '4287F5' },
  };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  
  // Add data
  data.forEach((item: any) => {
    const row: any = {};
    columns.forEach((col: any) => {
      if (col.key === 'dueDate' || col.key === 'date') {
        row[col.key] = item[col.key] ? format(new Date(item[col.key]), 'MMM dd, yyyy') : '';
      } else if (col.key === 'fee' || col.key === 'amount' || col.key === 'paidAmount' || col.key === 'price') {
        row[col.key] = `Rs. ${item[col.key] || 0}`;
      } else if (col.key === 'id') {
        row[col.key] = item[col.key]?.substring(0, 8) || 'N/A';
      } else if (col.key === 'iptvEnabled' || col.key === 'liveIpEnabled') {
        row[col.key] = item[col.key] ? 'Yes' : 'No';
      } else {
        row[col.key] = item[col.key] || '';
      }
    });
    worksheet.addRow(row);
  });
  
  // Add summary row
  if (data.length > 0) {
    const summaryRow = worksheet.addRow({});
    summaryRow.font = { bold: true };
    worksheet.mergeCells(`A${summaryRow.number}:B${summaryRow.number}`);
    worksheet.getCell(`A${summaryRow.number}`).value = `Total Records: ${data.length}`;
    
    // Add totals for financial reports
    if (reportType === 'invoices') {
      const totalAmount = data.reduce((sum: number, i: any) => sum + (i.totalAmount || i.amount || 0), 0);
      const totalPaid = data.reduce((sum: number, i: any) => sum + (i.paidAmount || 0), 0);
      
      const amountRow = worksheet.addRow({});
      amountRow.font = { bold: true };
      worksheet.mergeCells(`A${amountRow.number}:B${amountRow.number}`);
      worksheet.getCell(`A${amountRow.number}`).value = `Total Amount: Rs. ${totalAmount.toLocaleString()}`;
      
      const paidRow = worksheet.addRow({});
      paidRow.font = { bold: true };
      worksheet.mergeCells(`A${paidRow.number}:B${paidRow.number}`);
      worksheet.getCell(`A${paidRow.number}`).value = `Total Paid: Rs. ${totalPaid.toLocaleString()}`;
    } else if (reportType === 'expenses') {
      const totalExpenses = data.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
      
      const expenseRow = worksheet.addRow({});
      expenseRow.font = { bold: true };
      worksheet.mergeCells(`A${expenseRow.number}:B${expenseRow.number}`);
      worksheet.getCell(`A${expenseRow.number}`).value = `Total Expenses: Rs. ${totalExpenses.toLocaleString()}`;
    }
  }
  
  // Add metadata
  const metadataSheet = workbook.addWorksheet('Report Info');
  metadataSheet.addRow(['Report Type', reportType]);
  metadataSheet.addRow(['Generated', format(new Date(), 'MMM dd, yyyy HH:mm')]);
  if (filters.startDate) {
    metadataSheet.addRow(['Start Date', format(new Date(filters.startDate), 'MMM dd, yyyy')]);
  }
  if (filters.endDate) {
    metadataSheet.addRow(['End Date', format(new Date(filters.endDate), 'MMM dd, yyyy')]);
  }
  
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

// Get customer report data
export const getCustomerReportData = async (filters: any = {}) => {
  let query = supabase
    .from('customers')
    .select('*');

  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.area) {
    query = query.eq('area', filters.area);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Get invoice report data
export const getInvoiceReportData = async (filters: any = {}) => {
  let query = supabase
    .from('invoices')
    .select('*');

  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.startDate) {
    query = query.gte('created_at', new Date(filters.startDate).getTime());
  }
  if (filters.endDate) {
    query = query.lte('created_at', new Date(filters.endDate).getTime());
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Get expense report data
export const getExpenseReportData = async (filters: any = {}) => {
  let query = supabase
    .from('expenses')
    .select('*');

  if (filters.category) {
    query = query.eq('category', filters.category);
  }
  if (filters.startDate) {
    query = query.gte('date', new Date(filters.startDate).getTime());
  }
  if (filters.endDate) {
    query = query.lte('date', new Date(filters.endDate).getTime());
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Get staff report data
export const getStaffReportData = async (filters: any = {}) => {
  let query = supabase
    .from('staff')
    .select('*');

  if (filters.status) {
    query = query.eq('is_active', filters.status === 'active');
  }
  if (filters.role) {
    query = query.eq('role', filters.role);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Get inventory report data
export const getInventoryReportData = async (filters: any = {}) => {
  let query = supabase
    .from('inventory')
    .select('*');

  if (filters.category) {
    query = query.eq('category', filters.category);
  }
  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Get revenue report data
export const getRevenueReportData = async (filters: any = {}) => {
  const startDate = filters.startDate || startOfMonth(subMonths(new Date(), 1)).getTime();
  const endDate = filters.endDate || endOfMonth(subMonths(new Date(), 1)).getTime();

  const { data: invoices, error: invoicesError } = await supabase
    .from('invoices')
    .select('*')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (invoicesError) throw invoicesError;

  const { data: expenses, error: expensesError } = await supabase
    .from('expenses')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate);

  if (expensesError) throw expensesError;

  const totalRevenue = invoices.reduce((sum: number, i: any) => sum + (i.paid_amount || 0), 0);
  const totalExpenses = expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
  const profit = totalRevenue - totalExpenses;

  return {
    invoices,
    expenses,
    summary: {
      totalRevenue,
      totalExpenses,
      profit,
      invoiceCount: invoices.length,
      totalBilled: invoices.reduce((sum: number, i: any) => sum + (i.amount || 0), 0),
    }
  };
};


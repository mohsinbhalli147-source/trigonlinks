import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/customer_provider.dart';
import '../config/theme.dart';
import '../utils/constants.dart';

class BillsScreen extends StatefulWidget {
  const BillsScreen({super.key});

  @override
  State<BillsScreen> createState() => _BillsScreenState();
}

class _BillsScreenState extends State<BillsScreen> {
  String _safeSubstring(String text, int length) {
    if (text.isEmpty) return text;
    return text.substring(0, text.length < length ? text.length : length);
  }

  DateTime? _parseDate(dynamic value) {
    if (value == null) return null;
    if (value is int) return DateTime.fromMillisecondsSinceEpoch(value);
    if (value is String) {
      final numeric = int.tryParse(value);
      if (numeric != null) return DateTime.fromMillisecondsSinceEpoch(numeric);
      try {
        return DateTime.parse(value);
      } catch (e) {
        return null;
      }
    }
    return null;
  }
  
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CustomerProvider>().loadInvoices();
    });
  }

  @override
  Widget build(BuildContext context) {
    final customerProvider = context.watch<CustomerProvider>();
    final invoices = customerProvider.invoices;

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Bills'),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: () {
              // Show filter options
            },
          ),
        ],
      ),
      body: customerProvider.isLoading && invoices == null
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () async {
                await context.read<CustomerProvider>().loadInvoices();
              },
              child: invoices == null || invoices.isEmpty
                  ? _buildEmptyState()
                  : _buildBillsList(invoices),
            ),
      );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.receipt_long_outlined,
            size: 64,
            color: AppColors.textTertiary,
          ),
          const SizedBox(height: 16),
          Text(
            'No Bills Found',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Your billing history will appear here',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textTertiary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBillsList(List<dynamic> invoices) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: invoices.length,
      itemBuilder: (context, index) {
        final invoice = invoices[index];
        return _buildBillCard(invoice);
      },
    );
  }

  Widget _buildBillCard(dynamic invoice) {
    final id = invoice['id']?.toString() ?? '';
    final amount = invoice['amount'] ?? 0;
    final status = invoice['status'] ?? 'unpaid';
    final dueDate = invoice['due_date'];
    final createdAt = invoice['createdAt'];
    
    final isPaid = status == 'paid';
    final isPartial = status == 'partial';
    
    Color statusColor;
    String statusText;
    
    if (isPaid) {
      statusColor = AppColors.secondary;
      statusText = 'PAID';
    } else if (isPartial) {
      statusColor = AppColors.accent;
      statusText = 'PARTIAL';
    } else {
      statusColor = AppColors.error;
      statusText = 'UNPAID';
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () {
          _showInvoiceDetails(invoice);
        },
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Invoice #${_safeSubstring(id, 8).toUpperCase()}',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      statusText,
                      style: TextStyle(
                        color: statusColor,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Icon(Icons.attach_money, size: 20, color: AppColors.textSecondary),
                  const SizedBox(width: 8),
                  Text(
                    'Amount: ',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                  Text(
                    'Rs. $amount',
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: isPaid ? AppColors.secondary : AppColors.error,
                    ),
                  ),
                ],
              ),
              if (dueDate != null) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(Icons.calendar_today, size: 20, color: AppColors.textSecondary),
                    const SizedBox(width: 8),
                    Text(
                      'Due Date: ',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                    Builder(builder: (context) {
                      final dt = _parseDate(dueDate);
                      if (dt == null) return const SizedBox.shrink();
                      return Text(
                        DateFormat('yyyy-MM-dd').format(dt),
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w500,
                        ),
                      );
                    }),
                  ],
                ),
              ],
              if (createdAt != null) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(Icons.event, size: 20, color: AppColors.textTertiary),
                    const SizedBox(width: 8),
                    Builder(builder: (context) {
                      final dt = _parseDate(createdAt);
                      if (dt == null) return const SizedBox.shrink();
                      return Text(
                        'Issued: ${DateFormat('yyyy-MM-dd').format(dt)}',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textTertiary,
                        ),
                      );
                    }),
                  ],
                ),
              ],
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton.icon(
                    onPressed: () {
                      _downloadInvoice(invoice);
                    },
                    icon: const Icon(Icons.download, size: 18),
                    label: const Text('Download'),
                  ),
                  const SizedBox(width: 8),
                  if (!isPaid)
                    ElevatedButton.icon(
                      onPressed: () {
                        _payNow(invoice);
                      },
                      icon: const Icon(Icons.payment, size: 18),
                      label: const Text('Pay Now'),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showInvoiceDetails(dynamic invoice) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Invoice Details'),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildDetailRow('Invoice ID', invoice['id']?.toString() ?? ''),
              _buildDetailRow('Amount', 'Rs. ${invoice['amount'] ?? 0}'),
              _buildDetailRow('Status', invoice['status']?.toString() ?? ''),
              if (invoice['due_date'] != null)
                _buildDetailRow('Due Date', invoice['due_date']),
              if (invoice['paid_amount'] != null)
                _buildDetailRow('Paid Amount', 'Rs. ${invoice['paid_amount']}'),
              if (invoice['remaining_balance'] != null)
                _buildDetailRow('Remaining Balance', 'Rs. ${invoice['remaining_balance']}'),
              if (invoice['payment_method'] != null)
                _buildDetailRow('Payment Method', invoice['payment_method']),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Close'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              _downloadInvoice(invoice);
            },
            child: const Text('Download PDF'),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              '$label:',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _downloadInvoice(dynamic invoice) {
    // Implement PDF download
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Downloading invoice PDF...'),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _payNow(dynamic invoice) {
    // Implement payment flow
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Payment feature coming soon'),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}

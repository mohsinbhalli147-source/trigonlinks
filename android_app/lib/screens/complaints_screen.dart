import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/complaint_provider.dart';
import '../providers/customer_provider.dart';
import '../config/theme.dart';
import '../utils/constants.dart';
import 'create_complaint_screen.dart';

class ComplaintsScreen extends StatefulWidget {
  const ComplaintsScreen({super.key});

  @override
  State<ComplaintsScreen> createState() => _ComplaintsScreenState();
}

class _ComplaintsScreenState extends State<ComplaintsScreen> {
  String _selectedFilter = 'all';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ComplaintProvider>().loadComplaints();
    });
  }

  @override
  Widget build(BuildContext context) {
    final complaintProvider = context.watch<ComplaintProvider>();
    final complaints = complaintProvider.complaints;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Support Tickets'),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.filter_list),
            onSelected: (value) {
              setState(() {
                _selectedFilter = value;
              });
            },
            itemBuilder: (context) => [
              const PopupMenuItem(value: 'all', child: Text('All')),
              const PopupMenuItem(value: 'pending', child: Text('Pending')),
              const PopupMenuItem(value: 'in_progress', child: Text('In Progress')),
              const PopupMenuItem(value: 'resolved', child: Text('Resolved')),
              const PopupMenuItem(value: 'closed', child: Text('Closed')),
            ],
          ),
        ],
      ),
      body: complaintProvider.isLoading && complaints == null
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () async {
                await context.read<ComplaintProvider>().loadComplaints();
              },
              child: _buildComplaintsList(complaints),
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const CreateComplaintScreen()),
          );
        },
        icon: const Icon(Icons.add),
        label: const Text('New Ticket'),
      ),
    );
  }

  Widget _buildComplaintsList(List<dynamic>? complaints) {
    if (complaints == null || complaints.isEmpty) {
      return _buildEmptyState();
    }

    final filteredComplaints = _selectedFilter == 'all'
        ? complaints
        : complaints.where((c) => c['status'] == _selectedFilter).toList();

    if (filteredComplaints.isEmpty) {
      return _buildEmptyState();
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: filteredComplaints.length,
      itemBuilder: (context, index) {
        return _buildComplaintCard(filteredComplaints[index]);
      },
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.support_agent_outlined,
            size: 64,
            color: AppColors.textTertiary,
          ),
          const SizedBox(height: 16),
          Text(
            'No Tickets Found',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Create a support ticket to get help',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textTertiary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildComplaintCard(dynamic complaint) {
    final id = complaint['id']?.toString() ?? '';
    final category = complaint['category'] ?? 'Other';
    final description = complaint['description'] ?? '';
    final status = complaint['status'] ?? 'pending';
    final priority = complaint['priority'] ?? 'medium';
    final createdAt = complaint['created_at'];
    
    Color statusColor;
    IconData statusIcon;
    
    switch (status) {
      case 'pending':
        statusColor = AppColors.accent;
        statusIcon = Icons.pending;
        break;
      case 'in_progress':
        statusColor = AppColors.primary;
        statusIcon = Icons.autorenew;
        break;
      case 'resolved':
        statusColor = AppColors.secondary;
        statusIcon = Icons.check_circle;
        break;
      case 'closed':
        statusColor = AppColors.textTertiary;
        statusIcon = Icons.close;
        break;
      default:
        statusColor = AppColors.textTertiary;
        statusIcon = Icons.help;
    }

    Color priorityColor;
    switch (priority) {
      case 'high':
      case 'urgent':
        priorityColor = AppColors.error;
        break;
      case 'medium':
        priorityColor = AppColors.accent;
        break;
      default:
        priorityColor = AppColors.secondary;
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () {
          _showComplaintDetails(complaint);
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
                  Expanded(
                    child: Text(
                      category,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: priorityColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      priority.toUpperCase(),
                      style: TextStyle(
                        color: priorityColor,
                        fontWeight: FontWeight.bold,
                        fontSize: 10,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                description,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Icon(statusIcon, size: 16, color: statusColor),
                  const SizedBox(width: 4),
                  Text(
                    status.toUpperCase().replaceAll('_', ' '),
                    style: TextStyle(
                      color: statusColor,
                      fontWeight: FontWeight.w600,
                      fontSize: 12,
                    ),
                  ),
                  const Spacer(),
                  if (createdAt != null)
                    Text(
                      DateFormat('MMM dd, yyyy').format(
                        DateTime.fromMillisecondsSinceEpoch(createdAt),
                      ),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textTertiary,
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showComplaintDetails(dynamic complaint) {
    final status = complaint['status'] ?? 'pending';
    final isResolved = status == 'resolved' || status == 'closed';
    final isPending = status == 'pending';

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(complaint['category'] ?? 'Complaint Details'),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildDetailRow('Ticket ID', complaint['id']?.toString() ?? ''),
              _buildDetailRow('Category', complaint['category'] ?? ''),
              _buildDetailRow('Status', complaint['status']?.toString() ?? ''),
              _buildDetailRow('Priority', complaint['priority']?.toString() ?? ''),
              _buildDetailRow('Description', complaint['description'] ?? ''),
              if (complaint['created_at'] != null)
                _buildDetailRow(
                  'Created',
                  DateFormat('yyyy-MM-dd HH:mm').format(
                    DateTime.fromMillisecondsSinceEpoch(complaint['created_at']),
                  ),
                ),
              if (complaint['updated_at'] != null)
                _buildDetailRow(
                  'Last Updated',
                  DateFormat('yyyy-MM-dd HH:mm').format(
                    DateTime.fromMillisecondsSinceEpoch(complaint['updated_at']),
                  ),
                ),
            ],
          ),
        ),
        actions: [
          if (isPending)
            TextButton.icon(
              onPressed: () {
                Navigator.of(context).pop();
                // Reopen complaint
              },
              icon: const Icon(Icons.refresh, size: 18),
              label: const Text('Reopen'),
            ),
          if (isResolved)
            TextButton.icon(
              onPressed: () {
                Navigator.of(context).pop();
                _showRatingDialog(complaint);
              },
              icon: const Icon(Icons.star, size: 18),
              label: const Text('Rate Support'),
            ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Close'),
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
            width: 100,
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

  void _showRatingDialog(dynamic complaint) {
    int rating = 5;
    
    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) {
          return AlertDialog(
            title: const Text('Rate Support'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('How would you rate our support?'),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(5, (index) {
                    return IconButton(
                      icon: Icon(
                        index < rating ? Icons.star : Icons.star_border,
                        color: AppColors.accent,
                        size: 32,
                      ),
                      onPressed: () {
                        setState(() {
                          rating = index + 1;
                        });
                      },
                    );
                  }),
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Cancel'),
              ),
              ElevatedButton(
                onPressed: () {
                  Navigator.of(context).pop();
                  context.read<ComplaintProvider>().rateComplaint(
                    complaint['id'].toString(),
                    rating,
                  );
                },
                child: const Text('Submit'),
              ),
            ],
          );
        },
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/auth_provider.dart';
import '../providers/customer_provider.dart';
import '../config/theme.dart';
import '../utils/constants.dart';
import 'profile_screen.dart';
import 'bills_screen.dart';
import 'complaints_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CustomerProvider>().loadCustomerData();
    });
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final customerProvider = context.watch<CustomerProvider>();
    final userData = authProvider.userData;
    final customerData = customerProvider.customerData;

    if (customerProvider.isLoading && customerData == null) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    final name = customerData?['name'] ?? userData?['name'] ?? 'Customer';
    final status = customerData?['status'] ?? 'unknown';
    final packageName = customerData?['package'] ?? 'N/A';
    final fee = customerData?['fee'] ?? customerData?['monthlyFee'] ?? 0;
    final area = customerData?['area'] ?? 'N/A';
    final installDate = customerData?['installDate'] ?? customerData?['install_date'];
    final billingDate = customerData?['billingDate'] ?? customerData?['billing_date'];

    return RefreshIndicator(
      onRefresh: () async {
        await context.read<CustomerProvider>().loadCustomerData(forceRefresh: true);
      },
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Welcome Header
            Row(
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundColor: AppColors.primary,
                  child: Text(
                    name.isNotEmpty ? name.substring(0, 1).toUpperCase() : '?',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 24,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Welcome, $name',
                        style: Theme.of(context).textTheme.headlineSmall,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Manage your internet service',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Connection Status Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          status == 'active' ? Icons.check_circle : Icons.warning,
                          color: status == 'active' 
                              ? AppColors.secondary 
                              : AppColors.error,
                          size: 32,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Connection Status',
                                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: AppColors.textSecondary,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                status.toUpperCase(),
                                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                  color: status == 'active' 
                                      ? AppColors.secondary 
                                      : AppColors.error,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    const Divider(),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        _buildInfoItem(
                          icon: Icons.router,
                          label: 'Package',
                          value: packageName,
                        ),
                        const SizedBox(width: 24),
                        _buildInfoItem(
                          icon: Icons.location_on,
                          label: 'Area',
                          value: area,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Quick Actions Grid
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.2,
              children: [
                _buildQuickAction(
                  icon: Icons.person,
                  label: 'Profile',
                  color: AppColors.primary,
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const ProfileScreen()),
                    );
                  },
                ),
                _buildQuickAction(
                  icon: Icons.receipt_long,
                  label: 'My Bills',
                  color: AppColors.secondary,
                  onTap: () {
                    // Navigate to bills tab
                  },
                ),
                _buildQuickAction(
                  icon: Icons.support_agent,
                  label: 'Support',
                  color: AppColors.accent,
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const ComplaintsScreen()),
                    );
                  },
                ),
                _buildQuickAction(
                  icon: Icons.speed,
                  label: 'Speed Test',
                  color: AppColors.error,
                  onTap: () {
                    // Open speed test
                  },
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Billing Info Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.payments_outlined,
                          color: AppColors.accent,
                          size: 28,
                        ),
                        const SizedBox(width: 12),
                        Text(
                          'Billing Information',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        _buildInfoItem(
                          icon: Icons.attach_money,
                          label: 'Monthly Fee',
                          value: 'Rs. $fee',
                        ),
                        const SizedBox(width: 24),
                        _buildInfoItem(
                          icon: Icons.calendar_today,
                          label: 'Billing Date',
                          value: billingDate != null ? 'Day $billingDate' : 'N/A',
                        ),
                      ],
                    ),
                    if (installDate != null) ...[
                      const SizedBox(height: 16),
                      _buildInfoItem(
                        icon: Icons.event,
                        label: 'Installation Date',
                        value: installDate is String 
                            ? installDate 
                            : DateFormat('yyyy-MM-dd').format(DateTime.fromMillisecondsSinceEpoch(installDate)),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Account Info Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.account_circle_outlined,
                          color: AppColors.primary,
                          size: 28,
                        ),
                        const SizedBox(width: 12),
                        Text(
                          'Account Information',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    if (customerData?['username'] != null)
                      _buildInfoItem(
                        icon: Icons.person_outline,
                        label: 'Username',
                        value: customerData!['username'],
                      ),
                    if (customerData?['mobile'] != null) ...[
                      const SizedBox(height: 12),
                      _buildInfoItem(
                        icon: Icons.phone,
                        label: 'Phone',
                        value: customerData!['mobile'],
                      ),
                    ],
                    if (customerData?['email'] != null) ...[
                      const SizedBox(height: 12),
                      _buildInfoItem(
                        icon: Icons.email,
                        label: 'Email',
                        value: customerData!['email'],
                      ),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoItem({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: AppColors.textSecondary),
          const SizedBox(height: 4),
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: AppColors.textTertiary,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickAction({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 24),
              ),
              const SizedBox(height: 12),
              Text(
                label,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

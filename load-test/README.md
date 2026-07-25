# Load Testing with k6

This directory contains load testing scripts for the TRIGONLINKS ERP system using k6.

## Prerequisites

- k6 installed globally or via npm
- Backend server running on http://localhost:5000
- Frontend server running on http://localhost:5173
- Test user account: admin@trigonlinks.com / Admin@123456

## Running Load Tests

### Basic Load Test

```bash
# Using globally installed k6
k6 run load-test.js

# Using npm
npx k6 run load-test.js
```

### With Custom Environment Variables

```bash
API_BASE=http://your-api-url BASE_URL=http://your-frontend-url k6 run load-test.js
```

### Load Test Configuration

The load test is configured with the following stages:

1. **Ramp up to 100 users** (2 minutes)
2. **Sustain 100 users** (5 minutes)
3. **Ramp up to 500 users** (2 minutes)
4. **Sustain 500 users** (5 minutes)
5. **Ramp up to 1000 users** (2 minutes)
6. **Sustain 1000 users** (5 minutes)
7. **Ramp up to 2000 users** (2 minutes)
8. **Sustain 2000 users** (5 minutes)
9. **Ramp down to 0** (2 minutes)

Total test duration: ~25 minutes

### Thresholds

- **Response Time**: 95% of requests must complete below 2 seconds
- **Error Rate**: Must be below 5%

## Test Scenarios

The load test covers the following operations:

1. **Authentication**: Login requests
2. **Dashboard**: Fetch dashboard statistics
3. **Customers**: List, search, and create customers
4. **Connections**: List connections
5. **Billing**: Fetch invoices
6. **Reports**: Generate summary reports
7. **Packages**: List packages
8. **Inventory**: List inventory items
9. **Staff**: List staff members
10. **Areas**: List areas
11. **Expenses**: List expenses
12. **Complaints**: List complaints
13. **Announcements**: List announcements
14. **Notifications**: Fetch notifications

## Data Generation

The test generates 10,000 simulated customers with unique data:

- Unique names: "Load Test Customer 0-9999"
- Unique emails: "loadtest0-9999@example.com"
- Unique phone numbers: "0300" + 7-digit padded numbers
- Unique CNICs: 13-digit padded numbers

## Output

k6 provides real-time output including:

- Requests per second
- Response times (p50, p95, p99)
- Error rates
- Virtual User (VU) count

Results are also saved to JSON format for detailed analysis.

## Interpreting Results

### Success Criteria

- **Response Time**: p(95) < 2000ms
- **Error Rate**: < 5%
- **No crashes or memory leaks**

### Failure Indicators

- High error rates (>5%)
- Slow response times (>2s p95)
- Server crashes or timeouts
- Database connection errors

## Troubleshooting

### Connection Refused

Ensure both backend and frontend servers are running:

```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

### Authentication Failures

Verify the test user exists in the database:
- Email: admin@trigonlinks.com
- Password: Admin@123456

### Database Lock Errors

May indicate insufficient database capacity or connection pool exhaustion. Consider:
- Increasing database connection pool size
- Optimizing database queries
- Adding database indexes

## Performance Optimization Tips

Based on load test results, consider:

1. **Database Optimization**
   - Add indexes for frequently queried fields
   - Optimize complex queries
   - Implement query caching

2. **API Optimization**
   - Implement response caching
   - Use pagination for large datasets
   - Optimize payload sizes

3. **Infrastructure Scaling**
   - Add load balancers
   - Scale horizontally
   - Use CDN for static assets

4. **Code Optimization**
   - Implement lazy loading
   - Optimize rendering performance
   - Reduce bundle sizes

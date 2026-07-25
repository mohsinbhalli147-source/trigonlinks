@echo off
set TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJaUlNmTWlKaFFYbm9VTTFZMktHOSIsImVtYWlsIjoiYWRtaW5AdHJpZ29ubGlua3MuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzg0NjYwMTA1LCJleHAiOjE3ODQ2NjM3MDV9.ICA6gja5W9ypeGDqwQV_SSyHYiCtY2Y8s7QjbVmJnoc
set API=http://localhost:5000/api

echo === API ROUTES VERIFICATION ===
echo.

echo 1. Testing Users - Get All Users...
curl -s -X GET %API%/users -H "Authorization: Bearer %TOKEN%"
echo.
echo.

echo 2. Testing Users - Get Current User...
curl -s -X GET %API%/users/me -H "Authorization: Bearer %TOKEN%"
echo.
echo.

echo 3. Testing Customers - Get All Customers...
curl -s -X GET %API%/customers -H "Authorization: Bearer %TOKEN%"
echo.
echo.

echo 4. Testing Packages - Get All Packages...
curl -s -X GET %API%/packages -H "Authorization: Bearer %TOKEN%"
echo.
echo.

echo 5. Testing Connections - Get All Connections...
curl -s -X GET %API%/connections -H "Authorization: Bearer %TOKEN%"
echo.
echo.

echo 6. Testing Billing - Get All Billing...
curl -s -X GET %API%/billing -H "Authorization: Bearer %TOKEN%"
echo.
echo.

echo 7. Testing Invoices - Get All Invoices...
curl -s -X GET %API%/invoices -H "Authorization: Bearer %TOKEN%"
echo.
echo.

echo 8. Testing Inventory - Get All Inventory...
curl -s -X GET %API%/inventory -H "Authorization: Bearer %TOKEN%"
echo.
echo.

echo 9. Testing Staff - Get All Staff...
curl -s -X GET %API%/staff -H "Authorization: Bearer %TOKEN%"
echo.
echo.

echo 10. Testing Expenses - Get All Expenses...
curl -s -X GET %API%/expenses -H "Authorization: Bearer %TOKEN%"
echo.
echo.

echo 11. Testing New Customers - Get All New Customers...
curl -s -X GET %API%/new-customers -H "Authorization: Bearer %TOKEN%"
echo.
echo.

echo 12. Testing Areas - Get All Areas...
curl -s -X GET %API%/areas -H "Authorization: Bearer %TOKEN%"
echo.
echo.

echo 13. Testing Complaints - Get All Complaints...
curl -s -X GET %API%/complaints -H "Authorization: Bearer %TOKEN%"
echo.
echo.

echo 14. Testing Announcements - Get All Announcements...
curl -s -X GET %API%/announcements -H "Authorization: Bearer %TOKEN%"
echo.
echo.

echo 15. Testing Reports - Get Reports...
curl -s -X GET %API%/reports/summary -H "Authorization: Bearer %TOKEN%"
echo.
echo.

echo 16. Testing Dashboard - Get Dashboard Data...
curl -s -X GET %API%/dashboard -H "Authorization: Bearer %TOKEN%"
echo.
echo.

echo 17. Testing Roles - Get All Roles...
curl -s -X GET %API%/roles -H "Authorization: Bearer %TOKEN%"
echo.
echo.

echo 18. Testing Logs - Get All Logs...
curl -s -X GET %API%/logs -H "Authorization: Bearer %TOKEN%"
echo.
echo.

echo 19. Testing Notifications - Get All Notifications...
curl -s -X GET %API%/notifications -H "Authorization: Bearer %TOKEN%"
echo.
echo.

echo === API ROUTES TEST COMPLETE ===

@echo off
set TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJaUlNmTWlKaFFYbm9VTTFZMktHOSIsImVtYWlsIjoiYWRtaW5AdHJpZ29ubGlua3MuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzg0Njc4MjM0LCJleHAiOjE3ODQ2ODE4MzR9.oLG-ia1qU6dIYt2ws5-fkcZHn2YzkqzESeAVm3OONuU
set API=http://localhost:5000/api

echo === FIRESTORE READ/WRITE VERIFICATION ===
echo.

echo 1. Testing CREATE - Add New Customer...
curl -s -X POST %API%/customers -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json" -d "{\"name\":\"Test Customer\",\"mobile\":\"03001234567\",\"address\":\"Test Address\",\"area\":\"Test Area\",\"package\":\"Basic\",\"fee\":1500,\"status\":\"active\"}"
echo.
echo.

echo 2. Testing READ - Get All Customers...
curl -s -X GET %API%/customers -H "Authorization: Bearer %TOKEN%"
echo.
echo.

echo 3. Testing UPDATE - Update Customer Status...
curl -s -X PUT %API%/customers/YY6JqZ7Hu1SZM2VhmLey -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json" -d "{\"status\":\"suspended\"}"
echo.
echo.

echo 4. Testing CREATE - Add New Package...
curl -s -X POST %API%/packages -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json" -d "{\"name\":\"Test Package\",\"speed\":\"10 Mbps\",\"price\":2000,\"monthlyFee\":2000,\"status\":\"active\"}"
echo.
echo.

echo 5. Testing READ - Get All Packages...
curl -s -X GET %API%/packages -H "Authorization: Bearer %TOKEN%"
echo.
echo.

echo 6. Testing CREATE - Add New Complaint...
curl -s -X POST %API%/complaints -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json" -d "{\"customerId\":\"YY6JqZ7Hu1SZM2VhmLey\",\"category\":\"No Internet\",\"priority\":\"high\",\"description\":\"Test complaint for verification\",\"status\":\"pending\"}"
echo.
echo.

echo 7. Testing READ - Get All Complaints...
curl -s -X GET %API%/complaints -H "Authorization: Bearer %TOKEN%"
echo.
echo.

echo === FIRESTORE TEST COMPLETE ===

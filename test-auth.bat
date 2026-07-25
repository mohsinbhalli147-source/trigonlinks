@echo off
echo === LIVE PRODUCTION VERIFICATION ===
echo.

echo 1. Testing Health Check...
curl -s http://localhost:5000/health
echo.
echo.

echo 2. Testing Admin Login...
curl -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@trigonlinks.com\",\"password\":\"admin123\"}"
echo.
echo.

echo 3. Testing Customer Login...
curl -s -X POST http://localhost:5000/api/auth/customer-login -H "Content-Type: application/json" -d "{\"username\":\"testcustomer\",\"cnic\":\"1234567890123\"}"
echo.
echo.

echo === AUTHENTICATION TESTS COMPLETE ===

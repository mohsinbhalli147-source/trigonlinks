@echo off
set TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJaUlNmTWlKaFFYbm9VTTFZMktHOSIsImVtYWlsIjoiYWRtaW5AdHJpZ29ubGlua3MuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzg0Njc4MjM0LCJleHAiOjE3ODQ2ODE4MzR9.oLG-ia1qU6dIYt2ws5-fkcZHn2YzkqzESeAVm3OONuU
set API=http://localhost:5000/api

echo === NOTIFICATIONS API VERIFICATION ===
echo.

echo 1. Testing Get Notifications...
curl -s -X GET %API%/notifications -H "Authorization: Bearer %TOKEN%"
echo.
echo.

echo 2. Testing Get Unread Count...
curl -s -X GET %API%/notifications/unread-count -H "Authorization: Bearer %TOKEN%"
echo.
echo.

echo === NOTIFICATIONS TEST COMPLETE ===

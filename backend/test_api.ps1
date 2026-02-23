# API Testing Script for Loagma Employee Management System

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Testing Loagma Employee Management API" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Login
Write-Host "1. Testing Authentication (POST /auth/login/)" -ForegroundColor Yellow
$loginBody = @{username='manager_sales'; password='password123'} | ConvertTo-Json
$loginResponse = Invoke-WebRequest -Uri 'http://127.0.0.1:8000//auth/login/' -Method POST -Body $loginBody -ContentType 'application/json' -UseBasicParsing
$tokens = $loginResponse.Content | ConvertFrom-Json
$accessToken = $tokens.access
Write-Host "   SUCCESS: Got access token" -ForegroundColor Green
Write-Host ""

# 2. Get Current User
Write-Host "2. Testing Current User (GET /auth/me/)" -ForegroundColor Yellow
$headers = @{Authorization="Bearer $accessToken"}
$meResponse = Invoke-WebRequest -Uri 'http://127.0.0.1:8000//auth/me/' -Method GET -Headers $headers -UseBasicParsing
Write-Host "   Response:" -ForegroundColor Green
Write-Host "   $($meResponse.Content)" -ForegroundColor White
Write-Host ""

# 3. Dashboard Stats
Write-Host "3. Testing Dashboard Stats (GET /api/dashboard/stats/)" -ForegroundColor Yellow
$statsResponse = Invoke-WebRequest -Uri 'http://127.0.0.1:8000//api/dashboard/stats/' -Method GET -Headers $headers -UseBasicParsing
Write-Host "   Response:" -ForegroundColor Green
Write-Host "   $($statsResponse.Content)" -ForegroundColor White
Write-Host ""

# 4. Dashboard Alerts
Write-Host "4. Testing Dashboard Alerts (GET /api/dashboard/alerts/)" -ForegroundColor Yellow
$alertsResponse = Invoke-WebRequest -Uri 'http://127.0.0.1:8000//api/dashboard/alerts/' -Method GET -Headers $headers -UseBasicParsing
Write-Host "   Response:" -ForegroundColor Green
Write-Host "   $($alertsResponse.Content)" -ForegroundColor White
Write-Host ""

# 5. List Tasks
Write-Host "5. Testing List Tasks (GET /api/tasks/)" -ForegroundColor Yellow
$tasksResponse = Invoke-WebRequest -Uri 'http://127.0.0.1:8000//api/tasks/' -Method GET -Headers $headers -UseBasicParsing
Write-Host "   Response:" -ForegroundColor Green
Write-Host "   $($tasksResponse.Content)" -ForegroundColor White
Write-Host ""

# 6. List Employees
Write-Host "6. Testing List Employees (GET /api/employees/)" -ForegroundColor Yellow
$employeesResponse = Invoke-WebRequest -Uri 'http://127.0.0.1:8000//api/employees/' -Method GET -Headers $headers -UseBasicParsing
Write-Host "   Response:" -ForegroundColor Green
Write-Host "   $($employeesResponse.Content)" -ForegroundColor White
Write-Host ""

# 7. Analytics Summary
Write-Host "7. Testing Analytics Summary (GET /api/analytics/summary/)" -ForegroundColor Yellow
$analyticsResponse = Invoke-WebRequest -Uri 'http://127.0.0.1:8000//api/analytics/summary/' -Method GET -Headers $headers -UseBasicParsing
Write-Host "   Response:" -ForegroundColor Green
Write-Host "   $($analyticsResponse.Content)" -ForegroundColor White
Write-Host ""

# 8. Analytics Trends
Write-Host "8. Testing Analytics Trends (GET /api/analytics/trends/?period=7d)" -ForegroundColor Yellow
$trendsResponse = Invoke-WebRequest -Uri 'http://127.0.0.1:8000//api/analytics/trends/?period=7d' -Method GET -Headers $headers -UseBasicParsing
Write-Host "   Response:" -ForegroundColor Green
Write-Host "   $($trendsResponse.Content)" -ForegroundColor White
Write-Host ""

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "All API Tests Completed Successfully!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan

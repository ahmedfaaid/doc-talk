@echo off
echo Testing Legal RAG API Endpoints
echo ================================

echo.
echo 1. Health Check:
curl -s http://localhost:3000/health

echo.
echo.
echo 2. Legal Types:
curl -s http://localhost:3000/api/legal/types

echo.
echo.
echo 3. Legal Analysis:
curl -s -X POST http://localhost:3000/api/legal/analyze -H "Content-Type: application/json" -d "{\"query\":\"What are the liability implications of this contract?\",\"userId\":\"test-user\"}"

echo.
echo.
echo 4. User Context:
curl -s http://localhost:3000/api/legal/context/test-user

echo.
echo.
echo API Testing Complete!
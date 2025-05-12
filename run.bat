@echo off
REM Kill old Node.js and Vite processes
for /f "tokens=2" %%a in ('tasklist ^| findstr /i "node.exe"') do taskkill /PID %%a /F
for /f "tokens=2" %%a in ('tasklist ^| findstr /i "cmd.exe" ^| findstr /i "vite"') do taskkill /PID %%a /F
REM Start backend (Node.js Express)
cd backend
start cmd /k "node server.js"
cd ..
REM Start frontend (Vite)
cd frontend
start cmd /k "npm run dev"
cd ..

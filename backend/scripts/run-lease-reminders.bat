@echo off
REM Lease Reminder Job for Windows
REM This batch file runs the lease reminder job script
REM 
REM To schedule this to run daily:
REM 1. Open Task Scheduler
REM 2. Create Basic Task
REM 3. Set trigger to Daily at 9:00 AM
REM 4. Set action to start this batch file

echo === Lease Reminder Job Starting ===
echo Time: %date% %time%

cd /d "%~dp0.."
node scripts\lease-reminder-job.js

if %ERRORLEVEL% equ 0 (
    echo === Job completed successfully ===
) else (
    echo === Job failed with errors ===
)

echo End time: %date% %time%
pause

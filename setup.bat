@echo off
echo 🚀 Setting up Rental Tracker Application...

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js v18 or higher first.
    pause
    exit /b 1
)

echo ✅ Node.js detected

:: Install root dependencies
echo 📦 Installing root dependencies...
call npm install

:: Setup backend
echo 🔧 Setting up backend...
cd backend
call npm install

:: Copy environment file
if not exist .env (
    copy .env.example .env
    echo 📋 Created backend .env file from example
    echo ⚠️  Please update the .env file with your database connection and other settings
)

cd ..

:: Setup frontend
echo 🎨 Setting up frontend...
cd frontend
call npm install

:: Copy environment file
if not exist .env (
    copy .env.example .env
    echo 📋 Created frontend .env file from example
)

cd ..

echo ✅ Setup complete!
echo.
echo 📚 Next steps:
echo 1. Update backend\.env with your database connection string
echo 2. Start MongoDB if using MongoDB
echo 3. Run 'npm run dev' to start both frontend and backend
echo.
echo 🌐 The application will be available at:
echo    Frontend: http://localhost:5173
echo    Backend:  http://localhost:3000

pause

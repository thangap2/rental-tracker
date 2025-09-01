#!/bin/bash

echo "🚀 Setting up Rental Tracker Application..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js (v18 or higher) first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Node.js version $NODE_VERSION is not supported. Please install Node.js v18 or higher."
    exit 1
fi

echo "✅ Node.js version $NODE_VERSION detected"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Setup backend
echo "🔧 Setting up backend..."
cd backend
npm install

# Copy environment file
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📋 Created backend .env file from example"
    echo "⚠️  Please update the .env file with your database connection and other settings"
fi

cd ..

# Setup frontend
echo "🎨 Setting up frontend..."
cd frontend
npm install

# Copy environment file
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📋 Created frontend .env file from example"
fi

cd ..

echo "✅ Setup complete!"
echo ""
echo "📚 Next steps:"
echo "1. Update backend/.env with your database connection string"
echo "2. Start MongoDB (if using MongoDB)"
echo "3. Run 'npm run dev' to start both frontend and backend"
echo ""
echo "🌐 The application will be available at:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3000"

# Rental Tracker Application

A comprehensive rental lease tracking application designed for realtors to manage contact rental properties, lease dates, and property information.

## 🏗️ Architecture

This project follows a modern full-stack architecture:

- **Frontend**: Vue 3 + Bootstrap 5.3.2 + Vite
- **Backend**: Node.js + Express.js + Supabase (PostgreSQL)
- **State Management**: Pinia (Vue 3 store)
- **Authentication**: JWT-based authentication + Google OAuth
- **Database**: Supabase PostgreSQL with Row Level Security
- **API**: RESTful API with proper error handling

## 📁 Project Structure

```
rental-tracker/
├── backend/                 # Node.js Express API
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utility functions
│   │   ├── config/         # Configuration files
│   │   └── app.js          # Express app setup
│   ├── tests/              # Backend tests
│   └── package.json
├── frontend/               # Vue 3 SPA
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── views/          # Page components
│   │   ├── stores/         # Pinia stores
│   │   ├── services/       # API services
│   │   ├── utils/          # Utility functions
│   │   ├── assets/         # Static assets
│   │   ├── router/         # Vue Router setup
│   │   └── main.js         # App entry point
│   ├── public/             # Public assets
│   └── package.json
├── docs/                   # Documentation
└── package.json           # Root package.json
```

## 🚀 Features

- **Contact Management**: Add, edit, and manage contact information
- **Property Management**: Track rental properties with detailed information
- **Lease Tracking**: Monitor lease start/end dates with automated notifications
- **Dashboard**: Overview of all active leases and upcoming renewals
- **Reports**: Generate lease reports and summaries
- **Authentication**: Secure login system with JWT and Google OAuth support
- **Google OAuth**: Sign in with Google for seamless authentication
- **Responsive Design**: Bootstrap 5.3.2 for mobile-friendly interface

## 🛠️ Installation

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MongoDB or PostgreSQL

### Quick Start

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd rental-tracker
   npm run install:all
   ```

2. **Set up environment variables:**
   ```bash
   # Copy environment files
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

3. **Start development servers:**
   ```bash
   npm run dev
   ```

   This will start both frontend (http://localhost:5173) and backend (http://localhost:3000) servers.

## 📝 Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=3000
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:5173
CLIENT_URL=http://localhost:5173

# Supabase Configuration
SUPABASE_URL=your-supabase-url
SUPABASE_PUBLIC_KEY=your-supabase-public-key
SUPABASE_SECRET_KEY=your-supabase-secret-key

# Google OAuth Configuration (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:3000/api
VITE_API_URL=http://localhost:3000
```

## 🔐 Google OAuth Setup

To enable Google OAuth authentication, follow the detailed setup guide:

[Google OAuth Setup Guide](./docs/GOOGLE_OAUTH_SETUP.md)

Quick steps:
1. Create OAuth credentials in Google Cloud Console
2. Update environment variables with your credentials
3. Run the database migration for OAuth support
4. Test the integration

## 🧪 Testing

```bash
# Run all tests
npm test

# Run backend tests only
npm run test:backend

# Run frontend tests only
npm run test:frontend
```

## 📦 Production Build

```bash
# Build frontend for production
npm run build

# Start production server
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

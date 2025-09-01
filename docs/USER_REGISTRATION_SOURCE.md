# User Registration Source Tracking

This document explains the enhanced user registration system that tracks the source/method used for user registration.

## Overview

The users table has been enhanced to track how users registered for the application. This allows for better analytics, user experience customization, and account security.

## Database Changes

### New Columns Added to `users` Table:

1. **`registration_source`** (VARCHAR(20))
   - The source/method used for user registration
   - Allowed values: 'email', 'google', 'facebook', 'apple', 'linkedin', 'microsoft', 'other'
   - Default: 'email'

2. **`source_user_id`** (VARCHAR(255))
   - The external user ID from the registration source (e.g., Google ID, Facebook ID)
   - Used for OAuth providers to store their unique user identifier

3. **`source_metadata`** (JSONB)
   - Additional metadata from the registration source
   - Stores profile data, permissions, locale, etc. from OAuth providers

### Migration

Run the migration file: `backend/migrations/008_add_user_registration_source.sql`

```sql
-- Add the new columns
ALTER TABLE users ADD COLUMN registration_source VARCHAR(20) DEFAULT 'email' 
CHECK (registration_source IN ('email', 'google', 'facebook', 'apple', 'linkedin', 'microsoft', 'other'));

ALTER TABLE users ADD COLUMN source_user_id VARCHAR(255);
ALTER TABLE users ADD COLUMN source_metadata JSONB;

-- Update existing users
UPDATE users SET registration_source = 'email' WHERE password_hash IS NOT NULL;
UPDATE users SET registration_source = 'google', source_user_id = google_id 
WHERE google_id IS NOT NULL;
```

## Backend Implementation

### UserService Enhancements

1. **Enhanced `create()` method**: Now accepts `registrationSource`, `sourceUserId`, and `sourceMetadata`
2. **New `findBySourceUserId()` method**: Find users by their registration source and external ID
3. **Enhanced `linkGoogleAccount()` method**: Now updates registration source and metadata
4. **Enhanced `createFromGoogle()` method**: Stores Google profile metadata
5. **New `getUserRegistrationStats()` method**: Returns statistics on registration sources

### AuthController Enhancements

1. **Enhanced `register()` method**: Sets `registrationSource` to 'email' for email registrations
2. **Enhanced user responses**: All user-related endpoints now return `registrationSource`
3. **New `getRegistrationStats()` endpoint**: Admin-only endpoint for registration analytics

### New API Endpoints

- **GET `/api/auth/registration-stats`** (Admin only)
  - Returns statistics on user registration sources
  - Response:
    ```json
    {
      "success": true,
      "data": {
        "registrationSources": {
          "email": 45,
          "google": 23,
          "facebook": 5
        },
        "totalUsers": 73
      }
    }
    ```

## Frontend Implementation

### Enhanced User Profile

The Profile component (`frontend/src/views/Profile.vue`) now displays:

- Registration source with appropriate icons and badges
- Email verification status
- Enhanced user information layout
- Source-specific styling (Google = red badge, Email = blue badge, etc.)

### Registration Source Display

- **Icons**: Each source has a specific Bootstrap icon
- **Badges**: Color-coded badges for easy visual identification
- **Formatting**: User-friendly source names

## Registration Sources

| Source | Icon | Badge Color | Description |
|--------|------|-------------|-------------|
| email | envelope | blue | Traditional email/password registration |
| google | google | red | Google OAuth registration |
| facebook | facebook | blue | Facebook OAuth registration |
| apple | apple | dark | Apple OAuth registration |
| linkedin | linkedin | info | LinkedIn OAuth registration |
| microsoft | microsoft | warning | Microsoft OAuth registration |
| other | person-plus | secondary | Other registration methods |

## Usage Examples

### Creating a New User (Email Registration)

```javascript
const user = await userService.create({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  password: 'password123',
  registrationSource: 'email',
  emailVerified: false
});
```

### Creating a User from Google OAuth

```javascript
const user = await userService.createFromGoogle({
  googleId: 'google-user-id',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@gmail.com',
  profilePicture: 'https://google.com/avatar.jpg',
  profile: googleProfileData,
  locale: 'en'
});
```

### Linking Google Account to Existing User

```javascript
const updatedUser = await userService.linkGoogleAccount(
  userId, 
  googleId, 
  {
    profile: googleProfile,
    avatar_url: 'https://google.com/avatar.jpg',
    locale: 'en',
    verified_email: true
  }
);
```

## Security Considerations

1. **Source Verification**: The registration source helps identify the authentication method for security auditing
2. **OAuth Metadata**: Stored metadata can help with account verification and fraud detection
3. **Multi-source Accounts**: Users can have both email and OAuth authentication linked to the same account

## Analytics Benefits

1. **Registration Conversion**: Track which registration methods are most popular
2. **User Behavior**: Analyze user engagement by registration source
3. **Feature Usage**: Understand which features are used by different user types
4. **Marketing Insights**: Optimize marketing channels based on registration source data

## Future Enhancements

1. **Additional OAuth Providers**: Easy to add Facebook, Apple, LinkedIn, etc.
2. **Registration Analytics Dashboard**: Admin dashboard for registration trends
3. **Source-specific Features**: Customize user experience based on registration source
4. **Account Linking**: Allow users to link multiple OAuth accounts to one profile

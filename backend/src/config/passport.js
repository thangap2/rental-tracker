const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const userService = require('../services/userService');

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists with this Google ID
    let user = await userService.findByGoogleId(profile.id);
    
    if (user) {
      // User exists, return the user
      return done(null, user);
    }
    
    // Check if user exists with email, link Google account
    if (user) {
      // User exists with email, link Google account with metadata
      const metadata = {
        profile: {
          id: profile.id,
          displayName: profile.displayName,
          name: profile.name,
          photos: profile.photos,
          provider: profile.provider
        },
        avatar_url: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
        locale: profile._json.locale || null,
        verified_email: profile._json.email_verified || false
      };
      
      user = await userService.linkGoogleAccount(user.id, profile.id, metadata);
      return done(null, user);
    }
    
    // Create new user
    const newUser = await userService.createFromGoogle({
      googleId: profile.id,
      firstName: profile.name.givenName,
      lastName: profile.name.familyName,
      email: profile.emails[0].value,
      profilePicture: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
      role: 'realtor',
      profile: profile._json,
      locale: profile._json.locale
    });
    
    return done(null, newUser);
  } catch (error) {
    return done(error, null);
  }
}));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await userService.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;

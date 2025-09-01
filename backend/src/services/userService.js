const { supabase } = require('../config/database');
const bcrypt = require('bcryptjs');

class UserService {
  async findById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async findByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async create(userData) {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(userData.password, salt);

    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          first_name: userData.firstName,
          last_name: userData.lastName,
          email: userData.email,
          password_hash: passwordHash,
          phone: userData.phone,
          license_number: userData.licenseNumber,
          brokerage: userData.brokerage,
          role: userData.role || 'realtor',
          registration_source: userData.registrationSource || 'email',
          source_user_id: userData.sourceUserId || null,
          source_metadata: userData.sourceMetadata || null,
          email_verified: userData.emailVerified || false,
        },
      ])
      .select('id, first_name, last_name, email, role, phone, license_number, brokerage, registration_source, created_at')
      .single();

    if (error) throw error;
    return data;
  }

  async update(id, userData) {
    const updateData = {};
    
    if (userData.firstName) updateData.first_name = userData.firstName;
    if (userData.lastName) updateData.last_name = userData.lastName;
    if (userData.phone) updateData.phone = userData.phone;
    if (userData.licenseNumber) updateData.license_number = userData.licenseNumber;
    if (userData.brokerage) updateData.brokerage = userData.brokerage;

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select('id, first_name, last_name, email, role, phone, license_number, brokerage, updated_at')
      .single();

    if (error) throw error;
    return data;
  }

  async updatePassword(id, newPassword) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    const { error } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  async updateLastLogin(id) {
    const { error } = await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  async findByGoogleId(googleId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('google_id', googleId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findBySourceUserId(source, sourceUserId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('registration_source', source)
      .eq('source_user_id', sourceUserId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async linkGoogleAccount(userId, googleId, metadata = null) {
    const { data, error } = await supabase
      .from('users')
      .update({ 
        google_id: googleId,
        registration_source: 'google',
        source_user_id: googleId,
        source_metadata: metadata,
        email_verified: true
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async createFromGoogle(googleData) {
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          google_id: googleData.googleId,
          first_name: googleData.firstName,
          last_name: googleData.lastName,
          email: googleData.email,
          profile_picture: googleData.profilePicture,
          role: googleData.role || 'realtor',
          is_active: true,
          email_verified: true, // Google accounts are pre-verified
          registration_source: 'google',
          source_user_id: googleData.googleId,
          source_metadata: {
            profile: googleData.profile || null,
            avatar_url: googleData.profilePicture || null,
            locale: googleData.locale || null,
            verified_email: true
          }
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getUserRegistrationStats() {
    const { data, error } = await supabase
      .from('users')
      .select('registration_source')
      .eq('is_active', true);

    if (error) throw error;

    // Group by registration source
    const stats = data.reduce((acc, user) => {
      const source = user.registration_source || 'unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});

    return stats;
  }

  async verifyPassword(user, password) {
    // Get user with password hash
    const { data, error } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    console.log(`Password verification: Password: ${password}, Hash: ${data.password_hash}`);
    return await bcrypt.compare(password, data.password_hash);
  }
}

module.exports = new UserService();

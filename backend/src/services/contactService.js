const { supabase } = require('../config/database');

class ContactService {
  async findAll(realtorId, filters = {}) {
    let query = supabase
      .from('contacts')
      .select('*')
      .eq('realtor_id', realtorId);

    // Apply filters
    if (filters.contactType) {
      query = query.eq('contact_type', filters.contactType);
    }

    if (filters.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    if (filters.search) {
      query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    query = query.order('first_name', { ascending: true });

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  async findById(id, realtorId) {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .eq('realtor_id', realtorId)
      .single();

    if (error) throw error;
    return data;
  }

  async create(contactData, realtorId) {
    const { data, error } = await supabase
      .from('contacts')
      .insert([
        {
          first_name: contactData.firstName,
          last_name: contactData.lastName,
          email: contactData.email,
          phone: contactData.phone,
          alternate_phone: contactData.alternatePhone,
          street: contactData.address?.street,
          city: contactData.address?.city,
          state: contactData.address?.state,
          zip_code: contactData.address?.zipCode,
          country: contactData.address?.country || 'USA',
          contact_type: contactData.contactType || 'tenant',
          notes: contactData.notes,
          emergency_contact_name: contactData.emergencyContact?.name,
          emergency_contact_phone: contactData.emergencyContact?.phone,
          emergency_contact_relationship: contactData.emergencyContact?.relationship,
          preferred_contact_method: contactData.preferredContactMethod || 'email',
          realtor_id: realtorId,
        },
      ])
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  async update(id, contactData, realtorId) {
    const updateData = {};
    
    if (contactData.firstName) updateData.first_name = contactData.firstName;
    if (contactData.lastName) updateData.last_name = contactData.lastName;
    if (contactData.email) updateData.email = contactData.email;
    if (contactData.phone) updateData.phone = contactData.phone;
    if (contactData.alternatePhone) updateData.alternate_phone = contactData.alternatePhone;
    if (contactData.notes) updateData.notes = contactData.notes;
    if (contactData.contactType) updateData.contact_type = contactData.contactType;
    if (contactData.preferredContactMethod) updateData.preferred_contact_method = contactData.preferredContactMethod;
    if (contactData.isActive !== undefined) updateData.is_active = contactData.isActive;

    // Handle address updates
    if (contactData.address) {
      if (contactData.address.street) updateData.street = contactData.address.street;
      if (contactData.address.city) updateData.city = contactData.address.city;
      if (contactData.address.state) updateData.state = contactData.address.state;
      if (contactData.address.zipCode) updateData.zip_code = contactData.address.zipCode;
      if (contactData.address.country) updateData.country = contactData.address.country;
    }

    // Handle emergency contact updates
    if (contactData.emergencyContact) {
      if (contactData.emergencyContact.name) updateData.emergency_contact_name = contactData.emergencyContact.name;
      if (contactData.emergencyContact.phone) updateData.emergency_contact_phone = contactData.emergencyContact.phone;
      if (contactData.emergencyContact.relationship) updateData.emergency_contact_relationship = contactData.emergencyContact.relationship;
    }

    const { data, error } = await supabase
      .from('contacts')
      .update(updateData)
      .eq('id', id)
      .eq('realtor_id', realtorId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id, realtorId) {
    const { data, error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id)
      .eq('realtor_id', realtorId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  async count(realtorId, filters = {}) {
    let query = supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('realtor_id', realtorId);

    if (filters.contactType) {
      query = query.eq('contact_type', filters.contactType);
    }

    if (filters.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    const { count, error } = await query;

    if (error) throw error;
    return count;
  }
}

module.exports = new ContactService();

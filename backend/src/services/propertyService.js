const { supabase } = require('../config/database');

class PropertyService {
  async findAll(realtorId, filters = {}) {
    let query = supabase
      .from('properties')
      .select(`
        *,
        owner:owner_id (
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .eq('realtor_id', realtorId);

    // Apply filters
    if (filters.propertyType) {
      query = query.eq('property_type', filters.propertyType);
    }

    if (filters.city) {
      query = query.ilike('city', `%${filters.city}%`);
    }

    if (filters.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,street.ilike.%${filters.search}%,city.ilike.%${filters.search}%`);
    }

    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  async findById(id, realtorId) {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        owner:owner_id (
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .eq('id', id)
      .eq('realtor_id', realtorId)
      .single();

    if (error) throw error;
    return data;
  }

  async create(propertyData, realtorId) {
    const { data, error } = await supabase
      .from('properties')
      .insert([
        {
          title: propertyData.title,
          street: propertyData.address.street,
          city: propertyData.address.city,
          state: propertyData.address.state,
          zip_code: propertyData.address.zipCode,
          country: propertyData.address.country || 'USA',
          property_type: propertyData.propertyType,
          bedrooms: propertyData.bedrooms,
          bathrooms: propertyData.bathrooms,
          square_footage: propertyData.squareFootage,
          year_built: propertyData.yearBuilt,
          amenities: propertyData.amenities || [],
          parking_spaces: propertyData.parkingSpaces || 0,
          pet_allowed: propertyData.petPolicy?.allowed || false,
          pet_deposit: propertyData.petPolicy?.deposit,
          pet_restrictions: propertyData.petPolicy?.restrictions,
          utilities_included: propertyData.utilities?.included || [],
          utilities_notes: propertyData.utilities?.notes,
          description: propertyData.description,
          images: propertyData.images || [],
          owner_id: propertyData.owner,
          realtor_id: realtorId,
        },
      ])
      .select(`
        *,
        owner:owner_id (
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async update(id, propertyData, realtorId) {
    const updateData = {};
    
    if (propertyData.title) updateData.title = propertyData.title;
    if (propertyData.propertyType) updateData.property_type = propertyData.propertyType;
    if (propertyData.bedrooms !== undefined) updateData.bedrooms = propertyData.bedrooms;
    if (propertyData.bathrooms !== undefined) updateData.bathrooms = propertyData.bathrooms;
    if (propertyData.squareFootage !== undefined) updateData.square_footage = propertyData.squareFootage;
    if (propertyData.yearBuilt !== undefined) updateData.year_built = propertyData.yearBuilt;
    if (propertyData.amenities !== undefined) updateData.amenities = propertyData.amenities;
    if (propertyData.parkingSpaces !== undefined) updateData.parking_spaces = propertyData.parkingSpaces;
    if (propertyData.description) updateData.description = propertyData.description;
    if (propertyData.images !== undefined) updateData.images = propertyData.images;
    if (propertyData.owner) updateData.owner_id = propertyData.owner;
    if (propertyData.isActive !== undefined) updateData.is_active = propertyData.isActive;

    // Handle address updates
    if (propertyData.address) {
      if (propertyData.address.street) updateData.street = propertyData.address.street;
      if (propertyData.address.city) updateData.city = propertyData.address.city;
      if (propertyData.address.state) updateData.state = propertyData.address.state;
      if (propertyData.address.zipCode) updateData.zip_code = propertyData.address.zipCode;
      if (propertyData.address.country) updateData.country = propertyData.address.country;
    }

    // Handle pet policy updates
    if (propertyData.petPolicy) {
      if (propertyData.petPolicy.allowed !== undefined) updateData.pet_allowed = propertyData.petPolicy.allowed;
      if (propertyData.petPolicy.deposit !== undefined) updateData.pet_deposit = propertyData.petPolicy.deposit;
      if (propertyData.petPolicy.restrictions !== undefined) updateData.pet_restrictions = propertyData.petPolicy.restrictions;
    }

    // Handle utilities updates
    if (propertyData.utilities) {
      if (propertyData.utilities.included !== undefined) updateData.utilities_included = propertyData.utilities.included;
      if (propertyData.utilities.notes !== undefined) updateData.utilities_notes = propertyData.utilities.notes;
    }

    const { data, error } = await supabase
      .from('properties')
      .update(updateData)
      .eq('id', id)
      .eq('realtor_id', realtorId)
      .select(`
        *,
        owner:owner_id (
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id, realtorId) {
    const { data, error } = await supabase
      .from('properties')
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
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('realtor_id', realtorId);

    if (filters.propertyType) {
      query = query.eq('property_type', filters.propertyType);
    }

    if (filters.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    const { count, error } = await query;

    if (error) throw error;
    return count;
  }
}

module.exports = new PropertyService();

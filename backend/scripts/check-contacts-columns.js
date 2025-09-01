const { supabase } = require('../src/config/database');

async function checkContactsColumns() {
  try {
    console.log('🔍 Checking contacts table structure...');
    
    // Query the information_schema to get column information
    const { data, error } = await supabase
      .rpc('get_table_columns', { table_name: 'contacts' })
      .select('*');

    if (error) {
      console.log('❌ RPC call failed, trying direct query...');
      
      // Alternative approach - try to describe the table structure
      const { data: contactData, error: contactError } = await supabase
        .from('contacts')
        .select('*')
        .limit(1);
        
      if (contactError) {
        console.error('❌ Error querying contacts table:', contactError);
        
        // Try to get columns using SQL directly
        const { data: sqlData, error: sqlError } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable, column_default')
          .eq('table_name', 'contacts');
          
        if (sqlError) {
          console.error('❌ Error querying information schema:', sqlError);
        } else {
          console.log('📊 Contacts table columns from information_schema:');
          sqlData.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
          });
        }
      } else {
        console.log('✅ Contacts table accessible, sample record structure:');
        if (contactData && contactData.length > 0) {
          console.log('📊 Available columns:', Object.keys(contactData[0]));
        } else {
          console.log('📊 No records found in contacts table');
        }
      }
    } else {
      console.log('✅ Got column information:', data);
    }

    // Also check if we can create a test contact
    console.log('\n🧪 Testing contact creation...');
    const testContact = {
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      phone: '123-456-7890',
      contact_type: 'tenant',
      realtor_id: '00000000-0000-0000-0000-000000000000' // Dummy UUID
    };
    
    const { data: createData, error: createError } = await supabase
      .from('contacts')
      .insert([testContact])
      .select('*');
      
    if (createError) {
      console.error('❌ Error creating test contact:', createError);
      console.error('Error details:', createError.details);
      console.error('Error hint:', createError.hint);
      console.error('Error message:', createError.message);
    } else {
      console.log('✅ Test contact created successfully:', createData);
      
      // Clean up - delete the test contact
      await supabase
        .from('contacts')
        .delete()
        .eq('id', createData[0].id);
      console.log('🧹 Test contact cleaned up');
    }

  } catch (error) {
    console.error('❌ Script execution error:', error);
  }
}

checkContactsColumns();

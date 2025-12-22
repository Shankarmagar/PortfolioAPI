import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create client for public operations (with RLS)
export const supabase = createClient(supabaseUrl, supabaseKey);

// Create admin client for service operations (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

// Database connection test
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('id')
      .limit(1);
    
    if (error) throw error;
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

export default supabase;

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables
const isValidUrl = (url: string | undefined): boolean => {
  if (!url || url === 'undefined' || url.trim() === '') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const isValidKey = (key: string | undefined): boolean => {
  return !(!key || key === 'undefined' || key.trim() === '' || key.length < 10);
};

console.log('🔧 Environment validation:');
console.log('   SUPABASE_URL:', isValidUrl(supabaseUrl) ? 'VALID' : 'INVALID');
console.log('   SUPABASE_ANON_KEY:', isValidKey(supabaseAnonKey) ? 'VALID' : 'INVALID');
console.log('   URL value:', supabaseUrl);
console.log('   KEY preview:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NOT SET');

let supabase: any;

if (!isValidUrl(supabaseUrl) || !isValidKey(supabaseAnonKey)) {
  console.error('❌ CRITICAL: Missing or invalid Supabase environment variables!');
  console.error('📝 Please follow these steps:');
  console.error('');
  console.error('🔗 1. Go to: https://supabase.com/dashboard');
  console.error('📁 2. Select your NEW project');
  console.error('⚙️  3. Go to Settings > API');
  console.error('📋 4. Copy your Project URL and anon/public key');
  console.error('📝 5. Create/update your .env file with:');
  console.error('     EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co');
  console.error('     EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here');
  console.error('🗄️  6. CRITICAL: Set up database tables in your NEW Supabase project:');
  console.error('     a) Go to SQL Editor in Supabase Dashboard');
  console.error('     b) Click "New Query"');
  console.error('     c) Copy ALL contents of: supabase/migrations/20250708170359_aged_bush.sql');
  console.error('     d) Paste and click "Run"');
  console.error('     e) You should see "Migration completed successfully"');
  console.error('🔄 7. Restart your development server (Ctrl+C then npm run dev)');
  console.error('');
  console.error('⚠️  WITHOUT STEP 6, THE APP WILL NOT WORK!');
  console.error('');
  console.error('💡 Current values:');
  console.error('   URL:', supabaseUrl || 'NOT SET');
  console.error('   KEY:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 10)}...` : 'NOT SET');
  
  // Create a mock client to prevent crashes during development
  const mockClient = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signUp: () => Promise.resolve({ data: null, error: new Error('Supabase not configured. Please add your Supabase credentials to the .env file.') }),
      signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Supabase not configured. Please add your Supabase credentials to the .env file.') }),
      signOut: () => Promise.resolve({ error: null }),
    },
    from: () => ({
      select: () => ({ 
        eq: () => ({ 
          single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
          order: () => Promise.resolve({ data: [], error: new Error('Supabase not configured') })
        }) 
      }),
      insert: () => ({ 
        select: () => ({ 
          single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }) 
        }) 
      }),
      update: () => ({ 
        eq: () => Promise.resolve({ error: new Error('Supabase not configured') }) 
      }),
      delete: () => ({ 
        eq: () => Promise.resolve({ error: new Error('Supabase not configured') }) 
      }),
      upsert: () => ({ 
        select: () => ({ 
          single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }) 
        }) 
      }),
    }),
  };
  
  supabase = mockClient;
} else {
  console.log('✅ Supabase configured with URL:', supabaseUrl);
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

// Database types for better TypeScript support
export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserItinerary {
  id: string;
  user_id: string;
  destination: string;
  start_date: string;
  end_date: string;
  itinerary_data: any;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  itinerary_id?: string;
  title: string;
  content: string;
  location?: string;
  mood?: string;
  rating?: number;
  photos?: string[];
  created_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  interests?: string[];
  budget_range?: string;
  group_type?: string;
  accessibility_needs?: string[];
  created_at: string;
  updated_at: string;
}

export { supabase };
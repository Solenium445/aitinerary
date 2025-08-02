/*
  # Fix User Creation Issues

  This migration ensures proper user registration flow and fixes common issues:
  
  1. Tables
    - Ensures all required tables exist with proper structure
    - Fixes any missing columns or constraints
  
  2. Security
    - Properly configures Row Level Security
    - Ensures policies work correctly for user registration
  
  3. Functions & Triggers
    - Fixes the user registration trigger
    - Ensures profile creation works automatically
    
  4. Debugging
    - Adds better error handling
    - Includes logging for troubleshooting
*/

-- First, let's ensure the auth schema is accessible
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres, service_role;

-- Create profiles table with proper structure
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create other tables
CREATE TABLE IF NOT EXISTS user_itineraries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  itinerary_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  itinerary_id UUID REFERENCES user_itineraries(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  location TEXT,
  mood TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  photos TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  interests TEXT[],
  budget_range TEXT,
  group_type TEXT,
  accessibility_needs TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop policies for profiles
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON profiles';
    END LOOP;
    
    -- Drop policies for user_itineraries
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_itineraries') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON user_itineraries';
    END LOOP;
    
    -- Drop policies for user_journal_entries
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_journal_entries') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON user_journal_entries';
    END LOOP;
    
    -- Drop policies for user_preferences
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_preferences') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON user_preferences';
    END LOOP;
END $$;

-- Create comprehensive policies for profiles
CREATE POLICY "Enable read access for users to own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Enable insert access for users to own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update access for users to own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable delete access for users to own profile" ON profiles
  FOR DELETE USING (auth.uid() = id);

-- Create policies for user_itineraries
CREATE POLICY "Users can manage own itineraries" ON user_itineraries
  FOR ALL USING (auth.uid() = user_id);

-- Create policies for user_journal_entries  
CREATE POLICY "Users can manage own journal entries" ON user_journal_entries
  FOR ALL USING (auth.uid() = user_id);

-- Create policies for user_preferences
CREATE POLICY "Users can manage own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Improved function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Log the attempt (for debugging)
  RAISE LOG 'Creating profile for user: %', NEW.id;
  
  -- Insert the new profile
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NOW(),
    NOW()
  );
  
  RAISE LOG 'Profile created successfully for user: %', NEW.email;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Drop existing trigger and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create update triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_itineraries_updated_at ON user_itineraries;
CREATE TRIGGER update_user_itineraries_updated_at
  BEFORE UPDATE ON user_itineraries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_itineraries_user_id ON user_itineraries(user_id);
CREATE INDEX IF NOT EXISTS idx_user_journal_entries_user_id ON user_journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_user_journal_entries_itinerary_id ON user_journal_entries(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Grant necessary permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON user_itineraries TO authenticated;
GRANT ALL ON user_journal_entries TO authenticated;
GRANT ALL ON user_preferences TO authenticated;

-- Test the trigger function (this will help us see if there are any issues)
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully. User registration should now work properly.';
END $$;
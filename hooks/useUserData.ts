import { useState, useEffect } from 'react';
import { supabase, UserItinerary, JournalEntry, UserPreferences } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export function useUserItineraries() {
  const { user } = useAuth();
  const [itineraries, setItineraries] = useState<UserItinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadItineraries();
    }
  }, [user]);

  const loadItineraries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_itineraries')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItineraries(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load itineraries');
    } finally {
      setLoading(false);
    }
  };

  const saveItinerary = async (itineraryData: any, destination: string, startDate: string, endDate: string) => {
    try {
      const { data, error } = await supabase
        .from('user_itineraries')
        .insert({
          user_id: user?.id,
          destination,
          start_date: startDate,
          end_date: endDate,
          itinerary_data: itineraryData,
        })
        .select()
        .single();

      if (error) throw error;
      
      setItineraries(prev => [data, ...prev]);
      return { data, error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to save itinerary';
      return { data: null, error };
    }
  };

  const deleteItinerary = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_itineraries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setItineraries(prev => prev.filter(item => item.id !== id));
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to delete itinerary';
      return { error };
    }
  };

  return {
    itineraries,
    loading,
    error,
    saveItinerary,
    deleteItinerary,
    refreshItineraries: loadItineraries,
  };
}

export function useJournalEntries(itineraryId?: string) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadEntries();
    }
  }, [user, itineraryId]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('user_journal_entries')
        .select('*')
        .eq('user_id', user?.id);

      if (itineraryId) {
        query = query.eq('itinerary_id', itineraryId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load journal entries');
    } finally {
      setLoading(false);
    }
  };

  const saveEntry = async (entryData: Omit<JournalEntry, 'id' | 'user_id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('user_journal_entries')
        .insert({
          user_id: user?.id,
          ...entryData,
        })
        .select()
        .single();

      if (error) throw error;
      
      setEntries(prev => [data, ...prev]);
      return { data, error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to save journal entry';
      return { data: null, error };
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_journal_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setEntries(prev => prev.filter(item => item.id !== id));
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to delete journal entry';
      return { error };
    }
  };

  return {
    entries,
    loading,
    error,
    saveEntry,
    deleteEntry,
    refreshEntries: loadEntries,
  };
}

export function useUserPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .limit(1);

      if (error && error.code !== 'PGRST116') throw error;
      setPreferences(data && data.length > 0 ? data[0] : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (preferencesData: Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user?.id,
          ...preferencesData,
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) throw error;
      
      setPreferences(data);
      return { data, error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to save preferences';
      return { data: null, error };
    }
  };

  return {
    preferences,
    loading,
    error,
    savePreferences,
    refreshPreferences: loadPreferences,
  };
}

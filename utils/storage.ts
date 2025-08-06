// Simple, reliable storage utilities for React Native Expo
// Works on both web and mobile without circular dependencies

let memoryStorage: { [key: string]: string } = {};

// Simple web detection
const isWebEnvironment = () => {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
};

// Simple storage interface
export const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (isWebEnvironment()) {
        const value = window.localStorage.getItem(key);
        console.log(`💾 [Web] Retrieved ${key}:`, value ? 'Found' : 'Not found');
        return value;
      } else {
        // Try AsyncStorage for React Native
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          const value = await AsyncStorage.getItem(key);
          console.log(`📱 [Mobile] Retrieved ${key}:`, value ? 'Found' : 'Not found');
          return value;
        } catch {
          // Fallback to memory
          const value = memoryStorage[key] || null;
          console.log(`🧠 [Memory] Retrieved ${key}:`, value ? 'Found' : 'Not found');
          return value;
        }
      }
    } catch (error) {
      console.error(`❌ Error getting ${key}:`, error);
      return memoryStorage[key] || null;
    }
  },

  async setItem(key: string, value: string): Promise<boolean> {
    try {
      // Always save to memory first
      memoryStorage[key] = value;
      
      if (isWebEnvironment()) {
        window.localStorage.setItem(key, value);
        console.log(`💾 [Web] Saved ${key}`);
        return true;
      } else {
        // Try AsyncStorage for React Native
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          await AsyncStorage.setItem(key, value);
          console.log(`📱 [Mobile] Saved ${key}`);
          return true;
        } catch {
          console.log(`🧠 [Memory] Saved ${key} (AsyncStorage failed)`);
          return true; // Memory save succeeded
        }
      }
    } catch (error) {
      console.error(`❌ Error saving ${key}:`, error);
      return false;
    }
  },

  async removeItem(key: string): Promise<boolean> {
    try {
      delete memoryStorage[key];
      
      if (isWebEnvironment()) {
        window.localStorage.removeItem(key);
        console.log(`💾 [Web] Removed ${key}`);
      } else {
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          await AsyncStorage.removeItem(key);
          console.log(`📱 [Mobile] Removed ${key}`);
        } catch {
          console.log(`🧠 [Memory] Removed ${key} (AsyncStorage failed)`);
        }
      }
      return true;
    } catch (error) {
      console.error(`❌ Error removing ${key}:`, error);
      return false;
    }
  }
};

// Global memory for immediate access
export const globalMemory = {
  currentItinerary: null as any,
  
  set(itinerary: any) {
    this.currentItinerary = itinerary;
    console.log('🧠 Itinerary stored in global memory');
  },
  
  get() {
    return this.currentItinerary;
  },
  
  clear() {
    this.currentItinerary = null;
    console.log('🧠 Global memory cleared');
  }
};

// Itinerary-specific functions
export const saveItinerary = async (itinerary: any): Promise<boolean> => {
  try {
    console.log('🗑️ CLEARING all previous itinerary data...');
    
    // Step 1: Clear global memory FIRST
    globalMemory.clear();
    
    // Step 2: Load existing itineraries and manage the limit
    const existingItineraries = await loadAllItineraries();
    console.log(`📊 Found ${existingItineraries.length} existing itineraries`);
    
    // Step 3: Keep only the 4 most recent (so with new one = 5 max)
    if (existingItineraries.length >= 5) {
      const toKeep = existingItineraries
        .sort((a, b) => new Date(b.savedAt || b.generatedAt || 0).getTime() - new Date(a.savedAt || a.generatedAt || 0).getTime())
        .slice(0, 4); // Keep 4, add 1 new = 5 total
      
      console.log(`🧹 Limiting to 5 itineraries - keeping ${toKeep.length} most recent`);
      
      // Save the limited list back
      await storage.setItem('allItineraries', JSON.stringify(toKeep));
    }
    
    // Step 4: Clear current itinerary
    await storage.removeItem('currentItinerary');
    console.log('✅ Previous current itinerary cleared');
    
    console.log('💾 Saving new itinerary:', {
      destination: itinerary.destination || itinerary.location,
      days: itinerary.days?.length,
      timestamp: new Date().toISOString(),
      isNewGeneration: true
    });
    
    const now = new Date().toISOString();
    const itineraryData = {
      ...itinerary,
      savedAt: now,
      generatedAt: now,
      platform: isWebEnvironment() ? 'web' : 'mobile',
      version: Date.now(), // Add version to ensure uniqueness
      isLatest: true, // Flag to identify latest itinerary
      id: `itinerary_${Date.now()}` // Unique ID for tracking
    };
    
    // Step 5: Save to global memory immediately
    globalMemory.set(itineraryData);
    console.log('🧠 NEW itinerary set in global memory with timestamp:', now);
    
    // Step 6: Save to persistent storage as current
    const success = await storage.setItem('currentItinerary', JSON.stringify(itineraryData));
    
    // Step 7: Add to the all itineraries list
    const updatedList = [...(existingItineraries.slice(0, 4)), itineraryData];
    await storage.setItem('allItineraries', JSON.stringify(updatedList));
    console.log(`📚 Updated itineraries list - now contains ${updatedList.length} trips`);
    
    if (success) {
      console.log('✅ NEW itinerary saved successfully to persistent storage');
      console.log('🎯 Latest itinerary is now:', {
        destination: itineraryData.destination || itineraryData.location,
        savedAt: itineraryData.savedAt,
        version: itineraryData.version,
        totalStored: updatedList.length
      });
      return true;
    } else {
      console.log('⚠️ Persistent storage failed, but memory save succeeded');
      return true; // Memory save is enough
    }
  } catch (error) {
    console.error('❌ Error saving itinerary:', error);
    return false;
  }
};

// Load all stored itineraries
export const loadAllItineraries = async (): Promise<any[]> => {
  try {
    const data = await storage.getItem('allItineraries');
    if (data) {
      const itineraries = JSON.parse(data);
      console.log(`📚 Loaded ${itineraries.length} stored itineraries`);
      return Array.isArray(itineraries) ? itineraries : [];
    }
    return [];
  } catch (error) {
    console.error('❌ Error loading all itineraries:', error);
    return [];
  }
};

// Get itinerary history (for profile screen)
export const getItineraryHistory = async (): Promise<any[]> => {
  const allItineraries = await loadAllItineraries();
  return allItineraries
    .sort((a, b) => new Date(b.savedAt || b.generatedAt || 0).getTime() - new Date(a.savedAt || a.generatedAt || 0).getTime())
    .slice(0, 5); // Ensure max 5
};

export const loadItinerary = async (): Promise<any | null> => {
  try {
    console.log('📋 Loading itinerary (checking for LATEST)...');
    
    // Check global memory first (fastest)
    const memoryData = globalMemory.get();
    if (memoryData) {
      console.log('🧠 Found itinerary in global memory:', {
        destination: memoryData.destination || memoryData.location,
        savedAt: memoryData.savedAt,
        version: memoryData.version,
        isLatest: memoryData.isLatest
      });
      return memoryData;
    }
    
    console.log('🔍 No memory data, checking persistent storage...');
    
    // Check persistent storage
    const data = await storage.getItem('currentItinerary');
    
    if (data) {
      const parsed = JSON.parse(data);
      console.log('✅ Itinerary loaded from persistent storage:', {
        destination: parsed.destination || parsed.location,
        days: parsed.days?.length || 0,
        savedAt: parsed.savedAt,
        generatedAt: parsed.generatedAt,
        version: parsed.version,
        isLatest: parsed.isLatest
      });
      
      // Check if this is an old format itinerary (missing tracking fields)
      if (!parsed.savedAt && !parsed.generatedAt && !parsed.version && !parsed.isLatest) {
        console.log('🗑️ DETECTED OLD FORMAT ITINERARY - clearing it...');
        console.log('📊 Old itinerary details:', {
          destination: parsed.destination || parsed.location,
          days: parsed.days?.length || 0,
          hasTrackingFields: false
        });
        
        // Clear the old format itinerary
        await storage.removeItem('currentItinerary');
        globalMemory.clear();
        
        console.log('✅ Old format itinerary cleared - ready for new generation');
        return null; // Return null so user needs to generate new itinerary
      }
      
      // Save to global memory for faster access next time
      globalMemory.set(parsed);
      console.log('🧠 Cached latest itinerary in global memory');
      return parsed;
    } else {
      console.log('ℹ️ No saved itinerary found in persistent storage');
      return null;
    }
  } catch (error) {
    console.error('❌ Error loading itinerary:', error);
    return null;
  }
};

export const clearItinerary = async (): Promise<boolean> => {
  try {
    console.log('🗑️ Clearing ALL itinerary data...');
    globalMemory.clear();
    const success = await storage.removeItem('currentItinerary');
    console.log('✅ All itinerary data cleared (memory + storage)');
    return success;
  } catch (error) {
    console.error('❌ Error clearing itinerary:', error);
    return false;
  }
};

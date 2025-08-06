import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  DollarSign, 
  Star, 
  RefreshCw, 
  Shuffle, 
  Eye,
  Check,
  ChevronDown,
  ChevronUp,
  Navigation,
  Heart,
  Share,
  Download,
  Bookmark,
  Coffee,
  Camera,
  Utensils,
  TreePine,
  Music,
  Sun
} from 'lucide-react-native';
import ItineraryMap from '@/components/ItineraryMap';
import { loadItinerary } from '@/utils/storage';
import { useCallback } from 'react';

interface Activity {
  id: string;
  time: string;
  title: string;
  description: string;
  location: string;
  type: 'morning' | 'afternoon' | 'evening';
  confidence: number;
  estimated_cost_gbp?: number;
  duration_hours?: number;
  booking_required?: boolean;
  local_tip?: string;
}

interface Day {
  date: string;
  day_number: number;
  activities: Activity[];
}

interface Itinerary {
  days: Day[];
  total_estimated_cost_gbp: number;
  currency: string;
  travel_tips?: string[];
  local_phrases?: Array<{
    english: string;
    local: string;
    pronunciation: string;
  }>;
  destination?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
}

export default function ItineraryScreen() {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));
  const [showMap, setShowMap] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [swappingActivity, setSwappingActivity] = useState<string | null>(null);
  const [swappedActivities, setSwappedActivities] = useState<Set<string>>(new Set());

  // Wrap loadItineraryData in useCallback to prevent infinite loops
  const loadItineraryData = useCallback(async () => {
    console.log('🎯 ITINERARY SCREEN: Loading latest itinerary data...');
    try {
      setLoading(true);
      const savedItinerary = await loadItinerary();
      
      if (savedItinerary) {
        console.log('📋 ITINERARY SCREEN: Loaded itinerary:', {
          destination: savedItinerary.destination || savedItinerary.location,
          days: savedItinerary.days?.length,
          savedAt: savedItinerary.savedAt,
          generatedAt: savedItinerary.generatedAt,
          version: savedItinerary.version,
          isLatest: savedItinerary.isLatest,
          isNewGeneration: savedItinerary.isNewGeneration
        });
        
        // Check if this is an old format itinerary
        if (!savedItinerary.savedAt && !savedItinerary.generatedAt && !savedItinerary.version) {
          console.log('🗑️ DETECTED OLD FORMAT ITINERARY in itinerary screen');
          console.log('🔄 Clearing old itinerary and showing empty state...');
          
          // Clear the old itinerary
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('currentItinerary');
          }
          
          // Show empty state to encourage new generation
          setItinerary(null);
          setLoading(false);
          return;
        }
        
        // Verify this is the latest itinerary
        if (savedItinerary.isNewGeneration || savedItinerary.isLatest || savedItinerary.savedAt) {
          console.log('✅ CONFIRMED: This is the LATEST generated itinerary');
        } else {
          console.log('⚠️ WARNING: This might be an older itinerary');
        }
        
        setItinerary(savedItinerary);
      } else {
        console.log('ℹ️ ITINERARY SCREEN: No saved itinerary found, loading sample data');
        // Fallback to sample data
        const sampleItinerary: Itinerary = {
          days: [
            {
              date: new Date().toISOString().split('T')[0],
              day_number: 1,
              activities: [
                {
                  id: 'day1_activity1',
                  time: '09:00',
                  title: 'Welcome Breakfast',
                  description: 'Start your adventure with a traditional local breakfast at a charming neighborhood café.',
                  location: 'Local Café District',
                  type: 'morning',
                  confidence: 92,
                  estimated_cost_gbp: 15,
                  duration_hours: 1,
                  booking_required: false,
                  local_tip: 'Try the local pastries - they\'re freshly baked every morning!',
                },
                {
                  id: 'day1_activity2',
                  time: '11:00',
                  title: 'City Center Exploration',
                  description: 'Discover the heart of the city with its historic architecture and vibrant street life.',
                  location: 'Historic City Center',
                  type: 'morning',
                  confidence: 88,
                  estimated_cost_gbp: 0,
                  duration_hours: 2,
                  booking_required: false,
                  local_tip: 'Look for the hidden courtyards - they often have the most beautiful architecture.',
                },
                {
                  id: 'day1_activity3',
                  time: '14:00',
                  title: 'Local Market Experience',
                  description: 'Immerse yourself in local culture at the bustling market with fresh produce and artisanal goods.',
                  location: 'Central Market',
                  type: 'afternoon',
                  confidence: 90,
                  estimated_cost_gbp: 25,
                  duration_hours: 2,
                  booking_required: false,
                  local_tip: 'Bring cash and don\'t be afraid to sample the local specialties!',
                },
              ],
            },
          ],
          total_estimated_cost_gbp: 40,
          currency: 'GBP',
          destination: 'Your Destination',
        };
        
        setItinerary(sampleItinerary);
        console.log('📋 ITINERARY SCREEN: Sample itinerary loaded as fallback');
      }
    } catch (error) {
      console.error('❌ ITINERARY SCREEN: Error loading itinerary:', error);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array - only recreate if component unmounts/mounts

  // Use useFocusEffect to load data when tab becomes active
  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        console.log('🎯 Itinerary screen focused, loading data...');
        await loadItineraryData();
      };
      fetchData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate refresh
    await loadItineraryData();
    setRefreshing(false);
  };

  const toggleDayExpansion = (dayNumber: number) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dayNumber)) {
      newExpanded.delete(dayNumber);
    } else {
      newExpanded.add(dayNumber);
    }
    setExpandedDays(newExpanded);
  };

  const swapActivity = async (activityId: string) => {
    setSwappingActivity(activityId);
    
    try {
      const response = await fetch('/swap-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityId,
          currentActivity: itinerary?.days
            .flatMap(day => day.activities)
            .find(activity => activity.id === activityId),
          userPreferences: {
            destination: itinerary?.destination || 'Current location',
            interests: ['culture', 'food'],
            budget: 'mid-range',
            group: 'couple',
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.newActivity) {
          // Update the itinerary with the new activity
          setItinerary(prev => {
            if (!prev) return prev;
            
            const updatedDays = prev.days.map(day => ({
              ...day,
              activities: day.activities.map(activity =>
                activity.id === activityId ? result.newActivity : activity
              ),
            }));
            
            const updatedItinerary = { ...prev, days: updatedDays };
            
            // Save to localStorage
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem('currentItinerary', JSON.stringify(updatedItinerary));
            }
            
            return updatedItinerary;
          });
          
          // Mark activity as successfully swapped
          setSwappedActivities(prev => new Set([...prev, activityId]));
          
          Alert.alert('Success', 'Activity swapped successfully!');
        }
      }
    } catch (error) {
      console.error('Error swapping activity:', error);
      Alert.alert('Error', 'Failed to swap activity. Please try again.');
    } finally {
      setSwappingActivity(null);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'morning':
        return <Sun size={16} color="#f59e0b" />;
      case 'afternoon':
        return <Camera size={16} color="#3b82f6" />;
      case 'evening':
        return <Music size={16} color="#8b5cf6" />;
      default:
        return <MapPin size={16} color="#64748b" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const renderActivity = (activity: Activity, dayNumber: number) => {
    const isSwapping = swappingActivity === activity.id;
    const isSwapped = swappedActivities.has(activity.id);
    
    return (
      <View key={activity.id} style={styles.activityCard}>
        <View style={styles.activityHeader}>
          <View style={styles.activityTime}>
            <Clock size={14} color="#64748b" />
            <Text style={styles.timeText}>{activity.time}</Text>
            {getActivityIcon(activity.type)}
          </View>
          <View style={styles.activityActions}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                isSwapped && styles.swappedButton,
              ]}
              onPress={() => swapActivity(activity.id)}
              disabled={isSwapping}
            >
              {isSwapping ? (
                <RefreshCw size={16} color="#f59e0b" style={{ transform: [{ rotate: '45deg' }] }} />
              ) : isSwapped ? (
                <Check size={16} color="#ffffff" />
              ) : (
                <Shuffle size={16} color="#3b82f6" />
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Heart size={16} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.activityTitle}>{activity.title}</Text>
        <Text style={styles.activityDescription}>{activity.description}</Text>

        <View style={styles.activityLocation}>
          <MapPin size={14} color="#64748b" />
          <Text style={styles.locationText}>{activity.location}</Text>
        </View>

        <View style={styles.activityMeta}>
          <View style={styles.metaItem}>
            <DollarSign size={14} color="#10b981" />
            <Text style={styles.metaText}>£{activity.estimated_cost_gbp || 0}</Text>
          </View>
          <View style={styles.metaItem}>
            <Clock size={14} color="#64748b" />
            <Text style={styles.metaText}>{activity.duration_hours || 1}h</Text>
          </View>
          <View style={styles.metaItem}>
            <Star size={14} color="#fbbf24" />
            <Text style={styles.metaText}>{activity.confidence}%</Text>
          </View>
          {activity.booking_required && (
            <View style={[styles.metaItem, styles.bookingRequired]}>
              <Text style={styles.bookingText}>Booking Required</Text>
            </View>
          )}
        </View>

        {activity.local_tip && (
          <View style={styles.tipContainer}>
            <Text style={styles.tipLabel}>💡 Local Tip:</Text>
            <Text style={styles.tipText}>{activity.local_tip}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderDay = (day: Day) => {
    const isExpanded = expandedDays.has(day.day_number);
    const dayTotal = day.activities.reduce((sum, activity) => sum + (activity.estimated_cost_gbp || 0), 0);

    return (
      <View key={day.day_number} style={styles.dayContainer}>
        <TouchableOpacity
          style={styles.dayHeader}
          onPress={() => toggleDayExpansion(day.day_number)}
        >
          <View style={styles.dayInfo}>
            <Text style={styles.dayNumber}>Day {day.day_number}</Text>
            <Text style={styles.dayDate}>{formatDate(day.date)}</Text>
          </View>
          <View style={styles.dayMeta}>
            <Text style={styles.dayTotal}>£{dayTotal}</Text>
            {isExpanded ? (
              <ChevronUp size={20} color="#64748b" />
            ) : (
              <ChevronDown size={20} color="#64748b" />
            )}
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.dayContent}>
            <View style={styles.activitiesContainer}>
              {day.activities.map(activity => renderActivity(activity, day.day_number))}
            </View>
            
            <TouchableOpacity
              style={styles.mapButton}
              onPress={() => {
                setSelectedDay(day.day_number);
                setShowMap(!showMap);
              }}
            >
              <Navigation size={16} color="#8b5cf6" />
              <Text style={styles.mapButtonText}>
                {showMap && selectedDay === day.day_number ? 'Hide Map' : 'Show Map'}
              </Text>
            </TouchableOpacity>

            {showMap && selectedDay === day.day_number && (
              <ItineraryMap
                activities={day.activities}
                destination={itinerary?.destination || 'Current Location'}
                dayNumber={day.day_number}
              />
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Calendar size={32} color="#3b82f6" />
          <Text style={styles.loadingText}>Loading your itinerary...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!itinerary) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Calendar size={48} color="#94a3b8" />
          <Text style={styles.emptyTitle}>No Itinerary Found</Text>
          <Text style={styles.emptyText}>
            Create your first itinerary in the Setup tab to get started!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#3b82f6', '#1d4ed8']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>
              {itinerary.destination || itinerary.location || 'Your Trip'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {itinerary.days.length} day{itinerary.days.length !== 1 ? 's' : ''} • £{itinerary.total_estimated_cost_gbp} total
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton}>
              <Share size={20} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Bookmark size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Trip Overview */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <Calendar size={20} color="#3b82f6" />
            <Text style={styles.overviewTitle}>Trip Overview</Text>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{itinerary.days.length}</Text>
              <Text style={styles.statLabel}>Days</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>
                {itinerary.days.reduce((sum, day) => sum + day.activities.length, 0)}
              </Text>
              <Text style={styles.statLabel}>Activities</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>£{itinerary.total_estimated_cost_gbp}</Text>
              <Text style={styles.statLabel}>Total Cost</Text>
            </View>
          </View>
        </View>

        {/* Daily Itinerary */}
        <View style={styles.itinerarySection}>
          <Text style={styles.sectionTitle}>Daily Itinerary</Text>
          {itinerary.days.map(renderDay)}
        </View>

        {/* Travel Tips */}
        {itinerary.travel_tips && itinerary.travel_tips.length > 0 && (
          <View style={styles.tipsSection}>
            <Text style={styles.sectionTitle}>💡 Travel Tips</Text>
            <View style={styles.tipsContainer}>
              {itinerary.travel_tips.map((tip, index) => (
                <Text key={index} style={styles.tipItem}>• {tip}</Text>
              ))}
            </View>
          </View>
        )}

        {/* Local Phrases */}
        {itinerary.local_phrases && itinerary.local_phrases.length > 0 && (
          <View style={styles.phrasesSection}>
            <Text style={styles.sectionTitle}>🗣️ Useful Phrases</Text>
            <View style={styles.phrasesContainer}>
              {itinerary.local_phrases.map((phrase, index) => (
                <View key={index} style={styles.phraseItem}>
                  <Text style={styles.englishPhrase}>{phrase.english}</Text>
                  <Text style={styles.localPhrase}>{phrase.local}</Text>
                  <Text style={styles.pronunciation}>({phrase.pronunciation})</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#dbeafe',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  overviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginLeft: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  itinerarySection: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  dayContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  dayInfo: {
    flex: 1,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 2,
  },
  dayDate: {
    fontSize: 14,
    color: '#64748b',
  },
  dayMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  dayContent: {
    padding: 20,
    paddingTop: 0,
  },
  activitiesContainer: {
    gap: 16,
  },
  activityCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  activityActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  swappedButton: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  activityDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 12,
  },
  activityLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 4,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  bookingRequired: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bookingText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#92400e',
  },
  tipContainer: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  tipLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 12,
    color: '#1e40af',
    lineHeight: 16,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#faf5ff',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e9d5ff',
    gap: 8,
  },
  mapButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  tipsSection: {
    marginTop: 32,
  },
  tipsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tipItem: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
    marginBottom: 8,
  },
  phrasesSection: {
    marginTop: 32,
    marginBottom: 32,
  },
  phrasesContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  phraseItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  englishPhrase: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  localPhrase: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 2,
  },
  pronunciation: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
  },
});

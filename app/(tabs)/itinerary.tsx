import React, { useState, useEffect } from 'react';
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
  Sun,
  Thermometer,
  Globe
} from 'lucide-react-native';
import ItineraryMap from '@/components/ItineraryMap';

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

interface WeatherData {
  current: number;
  condition: string;
  icon: string;
  forecast: Array<{
    day: string;
    high: number;
    low: number;
    icon: string;
  }>;
}

interface TimeData {
  localTime: string;
  timezone: string;
  utcOffset: string;
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
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [timeData, setTimeData] = useState<TimeData | null>(null);

  useEffect(() => {
    loadItinerary();
  }, []);

  useEffect(() => {
    if (itinerary?.destination || itinerary?.location) {
      generateWeatherData(itinerary.destination || itinerary.location || 'London');
      generateTimeData(itinerary.destination || itinerary.location || 'London');
    }
  }, [itinerary]);

  const generateWeatherData = (destination: string) => {
    const weatherPatterns = {
      'epsom': { base: 12, variation: 8, icons: ['⛅', '🌦️', '☁️', '🌤️', '☀️'] },
      'london': { base: 14, variation: 6, icons: ['☁️', '🌦️', '⛅', '🌤️', '☀️'] },
      'barcelona': { base: 22, variation: 8, icons: ['☀️', '⛅', '🌤️', '☀️', '⛅'] },
      'madrid': { base: 20, variation: 10, icons: ['☀️', '⛅', '🌤️', '☀️', '⛅'] },
      'paris': { base: 16, variation: 6, icons: ['⛅', '🌦️', '☁️', '🌤️', '☀️'] },
      'rome': { base: 24, variation: 7, icons: ['☀️', '🌤️', '⛅', '☀️', '🌤️'] },
      'uk': { base: 12, variation: 8, icons: ['⛅', '🌦️', '☁️', '🌤️', '☀️'] },
    };

    const destKey = destination.toLowerCase().replace(/\s+/g, '').replace(',', '');
    let pattern = weatherPatterns[destKey];
    
    if (!pattern) {
      if (destKey.includes('uk') || destKey.includes('england') || destKey.includes('britain')) {
        pattern = weatherPatterns['uk'];
      } else {
        pattern = weatherPatterns['london'];
      }
    }

    const currentTemp = pattern.base + Math.floor(Math.random() * pattern.variation) - pattern.variation / 2;
    const currentIcon = pattern.icons[Math.floor(Math.random() * pattern.icons.length)];
    
    const forecast = ['Today', 'Tomorrow', 'Wed', 'Thu', 'Fri'].map((day, index) => {
      const high = pattern.base + Math.floor(Math.random() * pattern.variation) - pattern.variation / 4;
      const low = high - 3 - Math.floor(Math.random() * 5);
      return {
        day,
        high,
        low,
        icon: pattern.icons[index % pattern.icons.length],
      };
    });

    setWeatherData({
      current: currentTemp,
      condition: getWeatherCondition(currentIcon),
      icon: currentIcon,
      forecast,
    });
  };

  const generateTimeData = (destination: string) => {
    const timezones = {
      'epsom': { timezone: 'Europe/London', offset: '+0' },
      'london': { timezone: 'Europe/London', offset: '+0' },
      'barcelona': { timezone: 'Europe/Madrid', offset: '+1' },
      'madrid': { timezone: 'Europe/Madrid', offset: '+1' },
      'paris': { timezone: 'Europe/Paris', offset: '+1' },
      'rome': { timezone: 'Europe/Rome', offset: '+1' },
      'uk': { timezone: 'Europe/London', offset: '+0' },
    };

    const destKey = destination.toLowerCase().replace(/\s+/g, '').replace(',', '');
    let timeInfo = timezones[destKey];
    
    if (!timeInfo) {
      if (destKey.includes('uk') || destKey.includes('england') || destKey.includes('britain')) {
        timeInfo = timezones['uk'];
      } else {
        timeInfo = timezones['london'];
      }
    }

    const now = new Date();
    const offsetHours = parseInt(timeInfo.offset);
    const localTime = new Date(now.getTime() + (offsetHours * 60 * 60 * 1000));
    
    setTimeData({
      localTime: localTime.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
      timezone: timeInfo.timezone.split('/')[1],
      utcOffset: `UTC${timeInfo.offset === '+0' ? '' : timeInfo.offset}`,
    });
  };

  const getWeatherCondition = (icon: string) => {
    switch (icon) {
      case '☀️': return 'Sunny';
      case '🌤️': return 'Partly Cloudy';
      case '⛅': return 'Cloudy';
      case '☁️': return 'Overcast';
      case '🌦️': return 'Light Rain';
      case '🌧️': return 'Rainy';
      default: return 'Clear';
    }
  };

  const loadItinerary = () => {
    try {
      console.log('🔍 Starting itinerary load process...');
      
      // First check global memory storage (fallback when localStorage unavailable)
      if ((global as any).currentItinerary) {
        console.log('🧠 Found itinerary in global memory storage');
        const memoryItinerary = (global as any).currentItinerary;
        console.log('📋 Memory itinerary details:', {
          destination: memoryItinerary.destination || memoryItinerary.location,
          days: memoryItinerary.days?.length || 0,
          cost: memoryItinerary.total_estimated_cost_gbp,
        });
        
        if (memoryItinerary.days && Array.isArray(memoryItinerary.days) && memoryItinerary.days.length >= 1) {
          console.log('✅ Valid itinerary found in memory, loading...');
          setItinerary(memoryItinerary);
          setLoading(false);
          return;
        }
      }
      
      // Try to load from localStorage first
      if (typeof localStorage !== 'undefined') {
        console.log('💾 Checking localStorage for currentItinerary...');
        const savedItinerary = localStorage.getItem('currentItinerary');
        if (savedItinerary) {
          try {
            const parsed = JSON.parse(savedItinerary);
            console.log('📋 Found saved itinerary in localStorage:', {
              destination: parsed.destination || parsed.location,
              days: parsed.days?.length || 0,
              cost: parsed.total_estimated_cost_gbp,
              hasActivities: parsed.days?.[0]?.activities?.length > 0,
              firstActivity: parsed.days?.[0]?.activities?.[0]?.title,
              allDayNumbers: parsed.days?.map(d => d.day_number) || [],
              dateRange: parsed.days ? `${parsed.days[0]?.date} to ${parsed.days[parsed.days.length - 1]?.date}` : 'No dates'
            });
            
            // Validate the data structure
            if (parsed.days && Array.isArray(parsed.days) && parsed.days.length >= 1) {
              console.log('✅ Valid itinerary structure found, loading...');
              console.log(`📊 Loading itinerary with ${parsed.days.length} days, cost £${parsed.total_estimated_cost_gbp}`);
              setItinerary(parsed);
              setLoading(false);
              return;
            } else {
              console.log('⚠️ Invalid itinerary structure in localStorage');
              console.log('📊 Data structure:', { 
                hasDays: !!parsed.days, 
                isArray: Array.isArray(parsed.days), 
                length: parsed.days?.length 
              });
            }
          } catch (parseError) {
            console.error('❌ Error parsing saved itinerary:', parseError);
          }
        } else {
          console.log('📋 No currentItinerary found in localStorage');
        }
        
        // Check for any other itinerary keys
        console.log('🔍 Checking all localStorage keys for itinerary data...');
        const allKeys = Object.keys(localStorage);
        console.log('📋 Available keys:', allKeys);
        
        for (const key of allKeys) {
          if (key.includes('itinerary') || key.includes('trip') || key.includes('Itinerary')) {
            console.log(`🔍 Found potential itinerary key: ${key}`);
            try {
              const data = localStorage.getItem(key);
              if (data) {
                const parsed = JSON.parse(data);
                console.log(`📋 Data from ${key}:`, {
                  hasDays: !!parsed.days,
                  daysLength: parsed.days?.length,
                  destination: parsed.destination || parsed.location,
                  cost: parsed.total_estimated_cost_gbp,
                  firstDay: parsed.days?.[0]?.date,
                  lastDay: parsed.days?.[parsed.days?.length - 1]?.date
                });
                
                if (parsed.days && Array.isArray(parsed.days) && parsed.days.length >= 1) {
                  console.log(`✅ Using valid itinerary from ${key} with ${parsed.days.length} days`);
                  setItinerary(parsed);
                  setLoading(false);
                  return;
                }
              }
            } catch (error) {
              console.log(`❌ Failed to parse data from ${key}:`, error);
            }
          }
        }
      } else {
        console.log('⚠️ localStorage not available');
      }
      
      console.log('🔄 Falling back to user data check...');
      
      // Try to load from user's saved itineraries
      loadFromUserData();
      
    } catch (error) {
      console.error('Error loading itinerary:', error);
      loadSampleData();
    }
  };

  const loadFromUserData = async () => {
    try {
      console.log('🗄️ Attempting to load from user database...');
      
      // Try to get the most recent itinerary from the user's saved data
      // This would integrate with useUserItineraries hook
      
      // For now, check if there's any other stored data
      if (typeof localStorage !== 'undefined') {
        const keys = Object.keys(localStorage);
        console.log('🔍 Available localStorage keys:', keys);
        
        // Look for any itinerary-related data
        for (const key of keys) {
          if (key.includes('itinerary') || key.includes('trip')) {
            console.log(`🔍 Found potential itinerary data in key: ${key}`);
            try {
              const data = localStorage.getItem(key);
              if (data) {
                const parsed = JSON.parse(data);
                if (parsed.days && Array.isArray(parsed.days) && parsed.days.length > 0) {
                  console.log(`✅ Using itinerary from ${key}`);
                  setItinerary(parsed);
                  setLoading(false);
                  return;
                }
              }
            } catch (error) {
              console.log(`❌ Failed to parse data from ${key}`);
            }
          }
        }
      }
      
      console.log('📋 No user data found, loading sample data as final fallback');
      loadSampleData();
    } catch (error) {
      console.error('Error loading from user data:', error);
      loadSampleData();
    }
  };

  const loadSampleData = () => {
    console.log('📋 Loading sample itinerary data');
    try {
      // Get current date for realistic sample data
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      // Fallback to sample data
      const sampleItinerary: Itinerary = {
        days: [
          {
            date: today.toISOString().split('T')[0],
            day_number: 1,
            activities: [
              {
                id: 'day1_activity1',
                time: '09:00',
                title: 'Historic City Center',
                description: 'Explore the charming historic center with its traditional architecture and cultural landmarks.',
                location: 'City Center',
                type: 'morning',
                confidence: 92,
                estimated_cost_gbp: 0,
                duration_hours: 2,
                booking_required: false,
                local_tip: 'Start early to avoid crowds and get the best photos',
              },
              {
                id: 'day1_activity2',
                time: '14:00',
                title: 'Local Cuisine Experience',
                description: 'Enjoy authentic local cuisine at a traditional restaurant with regional specialties.',
                location: 'Restaurant District',
                type: 'afternoon',
                confidence: 88,
                estimated_cost_gbp: 35,
                duration_hours: 2,
                booking_required: true,
                local_tip: 'Try the chef\'s recommendation for the most authentic experience',
              },
              {
                id: 'day1_activity3',
                time: '19:00',
                title: 'Evening Stroll & Views',
                description: 'Take a relaxing evening walk to scenic viewpoints and enjoy the sunset.',
                location: 'Scenic Overlook',
                type: 'evening',
                confidence: 90,
                estimated_cost_gbp: 0,
                duration_hours: 2,
                booking_required: false,
                local_tip: 'Best time for photos is during golden hour',
              },
            ],
          },
          {
            date: tomorrow.toISOString().split('T')[0],
            day_number: 2,
            activities: [
              {
                id: 'day2_activity1',
                time: '10:00',
                title: 'Museum & Culture',
                description: 'Discover local history and culture at the city\'s premier museum.',
                location: 'Cultural District',
                type: 'morning',
                confidence: 95,
                estimated_cost_gbp: 20,
                duration_hours: 3,
                booking_required: false,
                local_tip: 'Audio guides are available in multiple languages',
              },
              {
                id: 'day2_activity2',
                time: '15:00',
                title: 'Shopping & Souvenirs',
                description: 'Browse local shops and markets for unique souvenirs and gifts.',
                location: 'Shopping Quarter',
                type: 'afternoon',
                confidence: 87,
                estimated_cost_gbp: 25,
                duration_hours: 1.5,
                booking_required: false,
                local_tip: 'Look for locally made crafts and artisanal products',
              },
            ],
          },
        ],
        total_estimated_cost_gbp: 80,
        currency: 'GBP',
        travel_tips: [
          'Download offline maps before exploring',
          'Learn basic local phrases for better interactions',
          'Carry cash for small vendors and tips',
          'Book popular attractions in advance',
        ],
        local_phrases: [
          { english: 'Hello', local: 'Hola', pronunciation: 'OH-lah' },
          { english: 'Thank you', local: 'Gracias', pronunciation: 'GRAH-see-ahs' },
          { english: 'Excuse me', local: 'Perdón', pronunciation: 'per-DOHN' },
        ],
        destination: 'Sample Destination',
      };
      
      setItinerary(sampleItinerary);
      console.log('📋 Sample itinerary loaded with', sampleItinerary.days.length, 'days');
    } catch (error) {
      console.error('Error loading itinerary:', error);
      Alert.alert('Error', 'Failed to load itinerary');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate refresh
    loadItinerary();
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
            
            // Save to localStorage if available, otherwise use global storage
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem('currentItinerary', JSON.stringify(updatedItinerary));
            } else {
              (global as any).currentItinerary = updatedItinerary;
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
        {/* Weather and Time Cards */}
        <View style={styles.infoCardsContainer}>
          {/* Weather Card */}
          {weatherData && (
            <View style={styles.weatherCard}>
              <View style={styles.weatherHeader}>
                <Thermometer size={20} color="#f59e0b" />
                <Text style={styles.weatherTitle}>Weather</Text>
              </View>
              <View style={styles.currentWeather}>
                <Text style={styles.weatherIcon}>{weatherData.icon}</Text>
                <View>
                  <Text style={styles.currentTemp}>{weatherData.current}°C</Text>
                  <Text style={styles.weatherCondition}>{weatherData.condition}</Text>
                </View>
              </View>
              <ScrollView horizontal style={styles.forecastContainer} showsHorizontalScrollIndicator={false}>
                {weatherData.forecast.slice(0, 4).map((day, index) => (
                  <View key={index} style={styles.forecastDay}>
                    <Text style={styles.forecastDayLabel}>{day.day}</Text>
                    <Text style={styles.forecastIcon}>{day.icon}</Text>
                    <Text style={styles.forecastTemp}>{day.high}°/{day.low}°</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Time Card */}
          {timeData && (
            <View style={styles.timeCard}>
              <View style={styles.timeHeader}>
                <Globe size={20} color="#3b82f6" />
                <Text style={styles.timeTitle}>Local Time</Text>
              </View>
              <Text style={styles.localTime}>{timeData.localTime}</Text>
              <Text style={styles.timezone}>{timeData.timezone}</Text>
              <Text style={styles.utcOffset}>{timeData.utcOffset}</Text>
            </View>
          )}
        </View>

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
  infoCardsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  weatherCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  weatherTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  currentWeather: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  weatherIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  currentTemp: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  weatherCondition: {
    fontSize: 12,
    color: '#64748b',
  },
  forecastContainer: {
    flexDirection: 'row',
  },
  forecastDay: {
    alignItems: 'center',
    marginRight: 16,
  },
  forecastDayLabel: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 4,
  },
  forecastIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  forecastTemp: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1e293b',
  },
  timeCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  localTime: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  timezone: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  utcOffset: {
    fontSize: 10,
    color: '#94a3b8',
  },
  overviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
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

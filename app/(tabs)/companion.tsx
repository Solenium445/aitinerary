import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Heart, 
  Smile, 
  Frown, 
  Zap, 
  Coffee, 
  Moon, 
  Sun, 
  Activity, 
  Droplets, 
  MapPin, 
  Clock, 
  TrendingUp,
  Battery,
  Target,
  Award,
  Calendar,
  Plus,
  Minus
} from 'lucide-react-native';

interface MoodSuggestion {
  id: string;
  mood: string;
  title: string;
  description: string;
  location: string;
  duration: string;
  type: 'relax' | 'energize' | 'explore' | 'social';
}

interface HealthEntry {
  date: string;
  sleep: number;
  steps: number;
  water: number;
  energy: number;
  mood: string;
}

const moods = [
  { id: 'energetic', label: 'Energetic', icon: Zap, color: '#f59e0b', suggestions: 'adventure' },
  { id: 'tired', label: 'Tired', icon: Coffee, color: '#8b5cf6', suggestions: 'relax' },
  { id: 'happy', label: 'Happy', icon: Smile, color: '#10b981', suggestions: 'social' },
  { id: 'stressed', label: 'Stressed', icon: Frown, color: '#ef4444', suggestions: 'calm' },
  { id: 'curious', label: 'Curious', icon: Sun, color: '#3b82f6', suggestions: 'explore' },
  { id: 'peaceful', label: 'Peaceful', icon: Moon, color: '#64748b', suggestions: 'nature' },
];

const moodSuggestions: Record<string, MoodSuggestion[]> = {
  energetic: [
    {
      id: 'hiking',
      mood: 'energetic',
      title: 'Mountain Hiking Trail',
      description: 'Challenge yourself with a scenic mountain hike offering breathtaking views and fresh air.',
      location: 'Local Nature Reserve',
      duration: '3-4 hours',
      type: 'explore',
    },
    {
      id: 'cycling',
      mood: 'energetic',
      title: 'City Bike Tour',
      description: 'Explore the city on two wheels, covering more ground while staying active.',
      location: 'City Center',
      duration: '2-3 hours',
      type: 'explore',
    },
  ],
  tired: [
    {
      id: 'spa',
      mood: 'tired',
      title: 'Relaxing Spa Experience',
      description: 'Unwind with a soothing massage and spa treatments to recharge your energy.',
      location: 'Local Wellness Center',
      duration: '2-3 hours',
      type: 'relax',
    },
    {
      id: 'cafe',
      mood: 'tired',
      title: 'Cozy Café Reading',
      description: 'Find a quiet corner in a charming café with a good book and quality coffee.',
      location: 'Neighborhood Café',
      duration: '1-2 hours',
      type: 'relax',
    },
  ],
  happy: [
    {
      id: 'market',
      mood: 'happy',
      title: 'Local Market Adventure',
      description: 'Explore vibrant local markets, meet friendly vendors, and discover unique treasures.',
      location: 'Central Market',
      duration: '2-3 hours',
      type: 'social',
    },
    {
      id: 'festival',
      mood: 'happy',
      title: 'Street Festival',
      description: 'Join local celebrations with music, food, and cultural performances.',
      location: 'Town Square',
      duration: '3-4 hours',
      type: 'social',
    },
  ],
  stressed: [
    {
      id: 'garden',
      mood: 'stressed',
      title: 'Peaceful Garden Walk',
      description: 'Stroll through tranquil botanical gardens surrounded by nature\'s beauty.',
      location: 'Botanical Gardens',
      duration: '1-2 hours',
      type: 'relax',
    },
    {
      id: 'meditation',
      mood: 'stressed',
      title: 'Meditation Session',
      description: 'Join a guided meditation class or find a quiet spot for personal reflection.',
      location: 'Wellness Center',
      duration: '1 hour',
      type: 'relax',
    },
  ],
  curious: [
    {
      id: 'museum',
      mood: 'curious',
      title: 'Hidden Museum Gems',
      description: 'Discover lesser-known museums with fascinating local history and culture.',
      location: 'Cultural District',
      duration: '2-3 hours',
      type: 'explore',
    },
    {
      id: 'workshop',
      mood: 'curious',
      title: 'Local Craft Workshop',
      description: 'Learn traditional crafts from local artisans and create your own souvenir.',
      location: 'Artisan Quarter',
      duration: '2-4 hours',
      type: 'explore',
    },
  ],
  peaceful: [
    {
      id: 'sunset',
      mood: 'peaceful',
      title: 'Sunset Viewpoint',
      description: 'Find the perfect spot to watch the sunset and reflect on your journey.',
      location: 'Scenic Overlook',
      duration: '1-2 hours',
      type: 'relax',
    },
    {
      id: 'temple',
      mood: 'peaceful',
      title: 'Quiet Temple Visit',
      description: 'Experience serenity at a local temple or spiritual site.',
      location: 'Historic Temple',
      duration: '1-2 hours',
      type: 'relax',
    },
  ],
};

export default function CompanionScreen() {
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [healthData, setHealthData] = useState<HealthEntry>({
    date: new Date().toISOString().split('T')[0],
    sleep: 7,
    steps: 5000,
    water: 6,
    energy: 7,
    mood: 'happy',
  });
  const [weeklyData, setWeeklyData] = useState<HealthEntry[]>([]);
  const [showHealthTracker, setShowHealthTracker] = useState(false);

  useEffect(() => {
    loadHealthData();
  }, []);

  const loadHealthData = () => {
    // Generate sample weekly data
    const week = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      week.push({
        date: date.toISOString().split('T')[0],
        sleep: 6 + Math.random() * 3,
        steps: 3000 + Math.random() * 7000,
        water: 4 + Math.random() * 6,
        energy: 5 + Math.random() * 4,
        mood: moods[Math.floor(Math.random() * moods.length)].id,
      });
    }
    setWeeklyData(week);
  };

  const updateHealthMetric = (metric: keyof HealthEntry, value: number | string) => {
    setHealthData(prev => ({
      ...prev,
      [metric]: value,
    }));
  };

  const saveHealthEntry = () => {
    // In a real app, save to storage
    Alert.alert('Success', 'Health data saved for today!');
    loadHealthData(); // Refresh weekly data
  };

  const getMoodColor = (moodId: string) => {
    const mood = moods.find(m => m.id === moodId);
    return mood?.color || '#64748b';
  };

  const getMoodIcon = (moodId: string) => {
    const mood = moods.find(m => m.id === moodId);
    return mood?.icon || Smile;
  };

  const renderMoodSuggestions = () => {
    if (!selectedMood) return null;

    const suggestions = moodSuggestions[selectedMood] || [];

    return (
      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>
          Perfect for your {selectedMood} mood:
        </Text>
        {suggestions.map((suggestion) => (
          <View key={suggestion.id} style={styles.suggestionCard}>
            <View style={styles.suggestionHeader}>
              <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
              <View style={[styles.suggestionType, { backgroundColor: getMoodColor(selectedMood) }]}>
                <Text style={styles.suggestionTypeText}>{suggestion.type}</Text>
              </View>
            </View>
            <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
            <View style={styles.suggestionMeta}>
              <View style={styles.suggestionMetaItem}>
                <MapPin size={14} color="#64748b" />
                <Text style={styles.suggestionMetaText}>{suggestion.location}</Text>
              </View>
              <View style={styles.suggestionMetaItem}>
                <Clock size={14} color="#64748b" />
                <Text style={styles.suggestionMetaText}>{suggestion.duration}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderHealthTracker = () => (
    <View style={styles.healthSection}>
      <View style={styles.healthHeader}>
        <Activity size={24} color="#10b981" />
        <Text style={styles.healthTitle}>Daily Wellbeing</Text>
      </View>

      {/* Today's Entry */}
      <View style={styles.healthCard}>
        <Text style={styles.healthCardTitle}>Today's Check-in</Text>
        
        {/* Sleep */}
        <View style={styles.metricRow}>
          <View style={styles.metricLabel}>
            <Moon size={20} color="#8b5cf6" />
            <Text style={styles.metricText}>Sleep: {healthData.sleep.toFixed(1)}h</Text>
          </View>
          <View style={styles.metricControls}>
            <TouchableOpacity
              style={styles.metricButton}
              onPress={() => updateHealthMetric('sleep', Math.max(0, healthData.sleep - 0.5))}
            >
              <Minus size={16} color="#64748b" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.metricButton}
              onPress={() => updateHealthMetric('sleep', Math.min(12, healthData.sleep + 0.5))}
            >
              <Plus size={16} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Steps */}
        <View style={styles.metricRow}>
          <View style={styles.metricLabel}>
            <Activity size={20} color="#f59e0b" />
            <Text style={styles.metricText}>Steps: {healthData.steps.toLocaleString()}</Text>
          </View>
          <View style={styles.metricControls}>
            <TouchableOpacity
              style={styles.metricButton}
              onPress={() => updateHealthMetric('steps', Math.max(0, healthData.steps - 500))}
            >
              <Minus size={16} color="#64748b" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.metricButton}
              onPress={() => updateHealthMetric('steps', healthData.steps + 500)}
            >
              <Plus size={16} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Water */}
        <View style={styles.metricRow}>
          <View style={styles.metricLabel}>
            <Droplets size={20} color="#3b82f6" />
            <Text style={styles.metricText}>Water: {healthData.water} glasses</Text>
          </View>
          <View style={styles.metricControls}>
            <TouchableOpacity
              style={styles.metricButton}
              onPress={() => updateHealthMetric('water', Math.max(0, healthData.water - 1))}
            >
              <Minus size={16} color="#64748b" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.metricButton}
              onPress={() => updateHealthMetric('water', healthData.water + 1)}
            >
              <Plus size={16} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Energy Level */}
        <View style={styles.metricRow}>
          <View style={styles.metricLabel}>
            <Battery size={20} color="#10b981" />
            <Text style={styles.metricText}>Energy: {healthData.energy}/10</Text>
          </View>
          <View style={styles.metricControls}>
            <TouchableOpacity
              style={styles.metricButton}
              onPress={() => updateHealthMetric('energy', Math.max(1, healthData.energy - 1))}
            >
              <Minus size={16} color="#64748b" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.metricButton}
              onPress={() => updateHealthMetric('energy', Math.min(10, healthData.energy + 1))}
            >
              <Plus size={16} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={saveHealthEntry}>
          <Text style={styles.saveButtonText}>Save Today's Entry</Text>
        </TouchableOpacity>
      </View>

      {/* Weekly Overview */}
      <View style={styles.healthCard}>
        <Text style={styles.healthCardTitle}>Weekly Overview</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weeklyScroll}>
          {weeklyData.map((day, index) => {
            const MoodIcon = getMoodIcon(day.mood);
            return (
              <View key={day.date} style={styles.dayCard}>
                <Text style={styles.dayLabel}>
                  {index === 6 ? 'Today' : new Date(day.date).toLocaleDateString('en-GB', { weekday: 'short' })}
                </Text>
                <MoodIcon size={20} color={getMoodColor(day.mood)} />
                <Text style={styles.dayMetric}>{day.sleep.toFixed(1)}h</Text>
                <Text style={styles.dayMetric}>{(day.steps / 1000).toFixed(1)}k</Text>
                <Text style={styles.dayMetric}>{day.water}💧</Text>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#ec4899', '#db2777']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Travel Companion</Text>
        <Text style={styles.headerSubtitle}>Your wellbeing & mood guide</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Mood Selector */}
        <View style={styles.moodSection}>
          <Text style={styles.sectionTitle}>How are you feeling today?</Text>
          <View style={styles.moodGrid}>
            {moods.map((mood) => {
              const IconComponent = mood.icon;
              const isSelected = selectedMood === mood.id;
              return (
                <TouchableOpacity
                  key={mood.id}
                  style={[
                    styles.moodButton,
                    isSelected && { backgroundColor: mood.color, borderColor: mood.color },
                  ]}
                  onPress={() => setSelectedMood(isSelected ? '' : mood.id)}
                >
                  <IconComponent
                    size={24}
                    color={isSelected ? '#ffffff' : mood.color}
                  />
                  <Text
                    style={[
                      styles.moodText,
                      isSelected && { color: '#ffffff' },
                      !isSelected && { color: mood.color },
                    ]}
                  >
                    {mood.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Mood-based Suggestions */}
        {renderMoodSuggestions()}

        {/* Health Tracker Toggle */}
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShowHealthTracker(!showHealthTracker)}
        >
          <Heart size={20} color="#ec4899" />
          <Text style={styles.toggleButtonText}>
            {showHealthTracker ? 'Hide' : 'Show'} Health Tracker
          </Text>
          <TrendingUp size={16} color="#64748b" />
        </TouchableOpacity>

        {/* Health Tracker */}
        {showHealthTracker && renderHealthTracker()}

        {/* Travel Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>💡 Wellbeing Tips for Travelers</Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipText}>
              • Stay hydrated - aim for 8 glasses of water daily{'\n'}
              • Get quality sleep - maintain your sleep schedule{'\n'}
              • Take breaks - don't overpack your itinerary{'\n'}
              • Move regularly - walk, stretch, or exercise{'\n'}
              • Listen to your body - rest when you need to{'\n'}
              • Practice mindfulness - enjoy the present moment{'\n'}
              • Connect with locals - social interaction boosts mood
            </Text>
          </View>
        </View>

        {/* Mood Insights */}
        <View style={styles.insightsSection}>
          <Text style={styles.insightsTitle}>🧠 Mood Insights</Text>
          <View style={styles.insightCard}>
            <Text style={styles.insightText}>
              Your mood affects your travel experience! When you're feeling energetic, 
              try active adventures. When tired, embrace slower-paced activities. 
              Remember, it's okay to adjust your plans based on how you feel.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fce7f3',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  moodSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  moodButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '47%',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  moodText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  suggestionsContainer: {
    marginTop: 32,
  },
  suggestionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  suggestionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
  },
  suggestionType: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  suggestionTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'capitalize',
  },
  suggestionDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 12,
  },
  suggestionMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  suggestionMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionMetaText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginTop: 32,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  healthSection: {
    marginTop: 24,
  },
  healthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  healthTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginLeft: 12,
  },
  healthCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  healthCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  metricLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metricText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  metricControls: {
    flexDirection: 'row',
    gap: 8,
  },
  metricButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  saveButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  weeklyScroll: {
    marginTop: 12,
  },
  dayCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginRight: 8,
    alignItems: 'center',
    minWidth: 60,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  dayMetric: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  tipsSection: {
    marginTop: 32,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  tipCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tipText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
  },
  insightsSection: {
    marginTop: 24,
    marginBottom: 32,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  insightCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  insightText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
});
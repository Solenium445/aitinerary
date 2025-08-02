import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, Search, MapPin, Star, Heart, MessageCircle, Share, Award, Clock, Thermometer } from 'lucide-react-native';

interface CommunityTip {
  id: string;
  author: string;
  avatar: string;
  location: string;
  title: string;
  content: string;
  category: 'hidden-gem' | 'safety' | 'shortcut' | 'food' | 'activity';
  likes: number;
  comments: number;
  rating: number;
}

interface WeatherData {
  city: string;
  current: number;
  forecast: Array<{
    day: string;
    high: number;
    low: number;
    icon: string;
  }>;
}

const communityTips: CommunityTip[] = [
  {
    id: '1',
    author: 'Sarah_Explorer',
    avatar: '🏃‍♀️',
    location: 'Barcelona, Spain',
    title: 'Hidden Beach Paradise',
    content: 'Skip the crowded Barceloneta and head to Cala Lloret! A stunning hidden cove just 30 minutes by train. Crystal clear water and way fewer tourists.',
    category: 'hidden-gem',
    likes: 127,
    comments: 23,
    rating: 4.8,
  },
  {
    id: '2',
    author: 'FoodieAlex',
    avatar: '🍕',
    location: 'Rome, Italy',
    title: 'Local\'s Pizza Secret',
    content: 'Forget the touristy spots! Try Pizza al Taglio da Checchino near Trastevere. Locals line up here daily. Get the marinara with fresh basil - incredible!',
    category: 'food',
    likes: 89,
    comments: 15,
    rating: 4.9,
  },
  {
    id: '3',
    author: 'NightOwlTom',
    avatar: '🦉',
    location: 'Berlin, Germany',
    title: 'Underground Club Access',
    content: 'Want to get into Berghain? Dress in all black, go alone or with one friend, learn some basic German phrases, and arrive after 1 AM. Confidence is key!',
    category: 'activity',
    likes: 203,
    comments: 45,
    rating: 4.6,
  },
];

const languageGuide = [
  { phrase: 'Hello', translation: 'Hola', pronunciation: 'OH-lah' },
  { phrase: 'Thank you', translation: 'Gracias', pronunciation: 'GRAH-see-ahs' },
  { phrase: 'Excuse me', translation: 'Perdón', pronunciation: 'per-DOHN' },
  { phrase: 'Where is...?', translation: '¿Dónde está...?', pronunciation: 'DOHN-deh eh-STAH' },
];

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [currentDestination, setCurrentDestination] = useState<string>('Barcelona');
  const [tripStartDate, setTripStartDate] = useState<Date | null>(null);
  const [daysUntilTrip, setDaysUntilTrip] = useState<number>(0);

  useEffect(() => {
    loadDestinationFromItinerary();
  }, []);

  useEffect(() => {
    if (currentDestination) {
      generateWeatherData(currentDestination);
    }
  }, [currentDestination]);

  useEffect(() => {
    if (tripStartDate) {
      calculateDaysUntilTrip();
    }
  }, [tripStartDate]);

  const loadDestinationFromItinerary = () => {
    try {
      // Try to load destination and start date from localStorage (if available)
      if (typeof localStorage !== 'undefined') {
        const savedItinerary = localStorage.getItem('currentItinerary');
        if (savedItinerary) {
          const parsed = JSON.parse(savedItinerary);
          
          // Extract destination from first activity location or use a default
          if (parsed.days && parsed.days.length > 0 && parsed.days[0].activities && parsed.days[0].activities.length > 0) {
            const firstLocation = parsed.days[0].activities[0].location;
            console.log('📍 Found first activity location:', firstLocation);
            
            // Extract city name from location string - try multiple patterns
            let cityMatch = firstLocation.match(/^([^,]+)/);
            if (cityMatch) {
              setCurrentDestination(cityMatch[1].trim());
            }
          }
          
          // Extract start date from first day
          // Also try to get destination from the itinerary metadata if available
          if (parsed.destination) {
            console.log('📍 Found itinerary destination:', parsed.destination);
            setCurrentDestination(parsed.destination);
          } else if (parsed.location) {
            console.log('📍 Found itinerary location:', parsed.location);
            setCurrentDestination(parsed.location);
          }
          
          if (parsed.days && parsed.days.length > 0 && parsed.days[0].date) {
            const startDate = new Date(parsed.days[0].date);
            if (!isNaN(startDate.getTime())) {
              setTripStartDate(startDate);
            }
          }
          
          return;
        }
      }
      console.log('⚠️ No saved itinerary found, using default destination');
      
      // Fallback to Barcelona if no itinerary found
      setCurrentDestination('Barcelona');
      // Set a sample future date for demo
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      setTripStartDate(futureDate);
    } catch (error) {
      console.error('Error loading destination from itinerary:', error);
      console.log('🔄 Using fallback destination: Barcelona');
      setCurrentDestination('Barcelona');
      // Set a sample future date for demo
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      setTripStartDate(futureDate);
    }
  };

  const calculateDaysUntilTrip = () => {
    if (!tripStartDate) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    const tripDate = new Date(tripStartDate);
    tripDate.setHours(0, 0, 0, 0); // Reset time to start of day
    
    const timeDifference = tripDate.getTime() - today.getTime();
    const daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
    
    setDaysUntilTrip(Math.max(0, daysDifference)); // Don't show negative days
  };

  const formatDateUK = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const generateWeatherData = (destination: string) => {
    // Generate realistic weather data based on destination
    const weatherPatterns = {
      'marbella': { base: 24, variation: 6, icons: ['☀️', '🌤️', '☀️', '⛅'] },
      'barcelona': { base: 22, variation: 8, icons: ['☀️', '⛅', '🌤️', '☀️'] },
      'madrid': { base: 20, variation: 10, icons: ['☀️', '⛅', '🌤️', '☀️'] },
      'paris': { base: 16, variation: 6, icons: ['⛅', '🌦️', '☁️', '🌤️'] },
      'london': { base: 14, variation: 5, icons: ['☁️', '🌦️', '⛅', '🌧️'] },
      'rome': { base: 24, variation: 7, icons: ['☀️', '🌤️', '⛅', '☀️'] },
      'amsterdam': { base: 15, variation: 6, icons: ['⛅', '🌦️', '☁️', '🌤️'] },
      'berlin': { base: 17, variation: 8, icons: ['⛅', '☁️', '🌤️', '🌦️'] },
      'vienna': { base: 18, variation: 9, icons: ['🌤️', '⛅', '☀️', '☁️'] },
      'prague': { base: 16, variation: 8, icons: ['⛅', '🌤️', '☁️', '🌦️'] },
      'lisbon': { base: 21, variation: 6, icons: ['☀️', '🌤️', '⛅', '☀️'] },
      'florence': { base: 23, variation: 7, icons: ['☀️', '🌤️', '⛅', '☀️'] },
      'venice': { base: 21, variation: 6, icons: ['🌤️', '⛅', '☀️', '🌦️'] },
      'costa del sol': { base: 25, variation: 5, icons: ['☀️', '🌤️', '☀️', '☀️'] },
      'spain': { base: 23, variation: 7, icons: ['☀️', '🌤️', '⛅', '☀️'] },
      'milan': { base: 19, variation: 8, icons: ['⛅', '🌤️', '☁️', '🌦️'] },
      'nice': { base: 24, variation: 5, icons: ['☀️', '🌤️', '☀️', '⛅'] },
      'lyon': { base: 18, variation: 7, icons: ['🌤️', '⛅', '☁️', '🌦️'] },
      'marseille': { base: 25, variation: 6, icons: ['☀️', '🌤️', '☀️', '⛅'] },
    };

    const destKey = destination.toLowerCase().replace(/\s+/g, '').replace(',', '');
    console.log('🌤️ Looking up weather for:', destKey);
    
    // Try exact match first, then partial matches
    let pattern = weatherPatterns[destKey];
    if (!pattern) {
      // Try partial matches for Spanish destinations
      if (destKey.includes('spain') || destKey.includes('costa') || destKey.includes('marbella')) {
        pattern = weatherPatterns['spain'];
      } else {
        pattern = weatherPatterns['barcelona']; // Default fallback
      }
    }

    const currentTemp = pattern.base + Math.floor(Math.random() * pattern.variation) - pattern.variation / 2;
    
    const forecast = ['Today', 'Tomorrow', 'Wed', 'Thu'].map((day, index) => {
      const high = pattern.base + Math.floor(Math.random() * pattern.variation) - pattern.variation / 4;
      const low = high - 5 - Math.floor(Math.random() * 5);
      return {
        day,
        high,
        low,
        icon: pattern.icons[index % pattern.icons.length],
      };
    });

    console.log(`🌤️ Generated weather for ${destination}: ${currentTemp}°C`);
    setWeatherData({
      city: destination,
      current: currentTemp,
      forecast,
    });
  };

  const categories = [
    { id: 'all', label: 'All', icon: '🌟' },
    { id: 'hidden-gem', label: 'Hidden Gems', icon: '💎' },
    { id: 'food', label: 'Food', icon: '🍕' },
    { id: 'safety', label: 'Safety', icon: '🛡️' },
    { id: 'activity', label: 'Activities', icon: '🎯' },
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'hidden-gem':
        return '#8b5cf6';
      case 'food':
        return '#f59e0b';
      case 'safety':
        return '#10b981';
      case 'activity':
        return '#3b82f6';
      default:
        return '#64748b';
    }
  };

  const filteredTips = communityTips.filter(tip => 
    (selectedCategory === 'all' || tip.category === selectedCategory) &&
    tip.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderTipCard = (tip: CommunityTip) => (
    <View key={tip.id} style={styles.tipCard}>
      <View style={styles.tipHeader}>
        <View style={styles.authorInfo}>
          <Text style={styles.avatar}>{tip.avatar}</Text>
          <View>
            <Text style={styles.authorName}>{tip.author}</Text>
            <View style={styles.locationRow}>
              <MapPin size={12} color="#64748b" />
              <Text style={styles.locationText}>{tip.location}</Text>
            </View>
          </View>
        </View>
        <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(tip.category) }]}>
          <Text style={styles.categoryText}>
            {categories.find(c => c.id === tip.category)?.icon}
          </Text>
        </View>
      </View>

      <Text style={styles.tipTitle}>{tip.title}</Text>
      <Text style={styles.tipContent}>{tip.content}</Text>

      <View style={styles.tipFooter}>
        <View style={styles.ratingRow}>
          <Star size={14} color="#fbbf24" />
          <Text style={styles.ratingText}>{tip.rating}</Text>
        </View>
        <View style={styles.tipActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Heart size={16} color="#64748b" />
            <Text style={styles.actionText}>{tip.likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MessageCircle size={16} color="#64748b" />
            <Text style={styles.actionText}>{tip.comments}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Share size={16} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const getCountdownMessage = () => {
    if (daysUntilTrip === 0) {
      return "Your trip starts today! 🎉";
    } else if (daysUntilTrip === 1) {
      return "Your trip starts tomorrow! 🎉";
    } else if (daysUntilTrip < 0) {
      return "Hope you're enjoying your trip! 🌟";
    } else {
      return "Get excited! 🎉";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#f97316', '#ea580c']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Explore & Discover</Text>
        <Text style={styles.headerSubtitle}>Tips from fellow travelers</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Search size={20} color="#64748b" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search tips and guides..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        {/* Categories */}
        <ScrollView 
          horizontal 
          style={styles.categoriesContainer}
          showsHorizontalScrollIndicator={false}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && styles.selectedCategory,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text
                style={[
                  styles.categoryLabel,
                  selectedCategory === category.id && styles.selectedCategoryLabel,
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Weather Forecast */}
        {weatherData && (
          <View style={styles.weatherCard}>
            <View style={styles.weatherHeader}>
              <Thermometer size={20} color="#f59e0b" />
              <Text style={styles.weatherTitle}>Weather Forecast - {weatherData.city}</Text>
            </View>
            <Text style={styles.currentTemp}>{weatherData.current}°C</Text>
            <ScrollView horizontal style={styles.forecastRow} showsHorizontalScrollIndicator={false}>
              {weatherData.forecast.map((day, index) => (
                <View key={index} style={styles.forecastItem}>
                  <Text style={styles.forecastDay}>{day.day}</Text>
                  <Text style={styles.forecastIcon}>{day.icon}</Text>
                  <Text style={styles.forecastTemp}>{day.high}°/{day.low}°</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Quick Language Guide */}
        <View style={styles.languageCard}>
          <View style={styles.languageHeader}>
            <Text style={styles.languageIcon}>🗣️</Text>
            <Text style={styles.languageTitle}>Quick Local Phrases</Text>
          </View>
          {languageGuide.map((item, index) => (
            <View key={index} style={styles.phraseRow}>
              <View style={styles.phraseLeft}>
                <Text style={styles.phraseText}>{item.phrase}</Text>
                <Text style={styles.translationText}>{item.translation}</Text>
              </View>
              <Text style={styles.pronunciationText}>{item.pronunciation}</Text>
            </View>
          ))}
        </View>

        {/* Community Tips */}
        <View style={styles.tipsSection}>
          <View style={styles.tipsHeader}>
            <Users size={20} color="#3b82f6" />
            <Text style={styles.tipsTitle}>Community Tips</Text>
            <View style={styles.tipsCount}>
              <Award size={16} color="#fbbf24" />
              <Text style={styles.tipsCountText}>{filteredTips.length}</Text>
            </View>
          </View>
          {filteredTips.map(renderTipCard)}
        </View>

        {/* Trip Countdown */}
        <View style={styles.countdownCard}>
          <LinearGradient
            colors={['#8b5cf6', '#7c3aed']}
            style={styles.countdownGradient}
          >
            <Clock size={24} color="#ffffff" />
            <Text style={styles.countdownTitle}>
              {daysUntilTrip <= 0 ? 'Your Trip' : 'Days Until Your Trip'}
            </Text>
            <Text style={styles.countdownNumber}>
              {daysUntilTrip <= 0 ? '🌟' : daysUntilTrip}
            </Text>
            <Text style={styles.countdownSubtitle}>{getCountdownMessage()}</Text>
            {tripStartDate && daysUntilTrip > 0 && (
              <Text style={styles.countdownDate}>
                Starting: {formatDateUK(tripStartDate)}
              </Text>
            )}
          </LinearGradient>
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
    color: '#fed7aa',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  searchSection: {
    marginTop: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    marginLeft: 12,
  },
  categoriesContainer: {
    marginTop: 20,
    marginBottom: 8,
  },
  categoryButton: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectedCategory: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  selectedCategoryLabel: {
    color: '#ffffff',
  },
  weatherCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  weatherTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginLeft: 8,
  },
  currentTemp: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginBottom: 16,
  },
  forecastRow: {
    flexDirection: 'row',
  },
  forecastItem: {
    alignItems: 'center',
    marginRight: 20,
  },
  forecastDay: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  forecastIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  forecastTemp: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
  languageCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  languageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  languageIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  languageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  phraseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  phraseLeft: {
    flex: 1,
  },
  phraseText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  translationText: {
    fontSize: 14,
    color: '#3b82f6',
    marginTop: 2,
  },
  pronunciationText: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
  },
  tipsSection: {
    marginTop: 32,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginLeft: 8,
    flex: 1,
  },
  tipsCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tipsCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
    marginLeft: 4,
  },
  tipCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    fontSize: 20,
    marginRight: 12,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  categoryBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryText: {
    fontSize: 16,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  tipContent: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 16,
  },
  tipFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 4,
  },
  tipActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  countdownCard: {
    marginTop: 24,
    marginBottom: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  countdownGradient: {
    padding: 24,
    alignItems: 'center',
  },
  countdownTitle: {
    fontSize: 16,
    color: '#ffffff',
    marginTop: 8,
    marginBottom: 12,
  },
  countdownNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  countdownSubtitle: {
    fontSize: 14,
    color: '#e9d5ff',
  },
  countdownDate: {
    fontSize: 12,
    color: '#ddd6fe',
    marginTop: 8,
    fontWeight: '500',
  },
});

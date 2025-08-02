import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Calendar, DollarSign, Users, Heart, Sun, Camera, TreePine, Utensils, Music, Loader, Accessibility, Armchair as Wheelchair, UserCheck, Route, Map as MapIcon } from 'lucide-react-native';
import { router } from 'expo-router';
import DatePicker from '@/components/DatePicker';
import { useAuth } from '@/contexts/AuthContext';
import { useUserItineraries, useUserPreferences } from '@/hooks/useUserData';

const interests = [
  { id: 'beaches', label: 'Beaches', icon: Sun },
  { id: 'food', label: 'Food & Dining', icon: Utensils },
  { id: 'history', label: 'History & Culture', icon: Camera },
  { id: 'nature', label: 'Nature & Parks', icon: TreePine },
  { id: 'nightlife', label: 'Nightlife', icon: Music },
  { id: 'relaxing', label: 'Relaxing', icon: Heart },
];

const groupTypes = [
  { id: 'solo', label: 'Solo Travel' },
  { id: 'couple', label: 'Couple' },
  { id: 'family', label: 'Family' },
  { id: 'friends', label: 'Friends' },
  { id: 'party', label: 'Party Crowd' },
];

const budgetRanges = [
  { id: 'budget', label: 'Budget (£50-100/day)' },
  { id: 'mid', label: 'Mid-range (£100-200/day)' },
  { id: 'luxury', label: 'Luxury (£200+/day)' },
];

const accessibilityOptions = [
  { 
    id: 'wheelchair', 
    label: 'Wheelchair accessible venues', 
    icon: Wheelchair,
    description: 'Venues with ramps, lifts, and accessible facilities'
  },
  { 
    id: 'elderly', 
    label: 'Elderly-friendly activities and transport', 
    icon: UserCheck,
    description: 'Comfortable seating, shorter walks, and accessible transport'
  },
  { 
    id: 'stepfree', 
    label: 'Step-free routes where possible', 
    icon: Route,
    description: 'Avoiding stairs and steep inclines when alternatives exist'
  },
  { 
    id: 'reduced', 
    label: 'Reduced walking distances', 
    icon: MapIcon,
    description: 'Shorter routes and more frequent rest stops'
  },
];

export default function SetupScreen() {
  const { user, profile } = useAuth();
  const { saveItinerary } = useUserItineraries();
  const { preferences, savePreferences } = useUserPreferences();
  
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedBudget, setSelectedBudget] = useState(preferences?.budget_range || '');
  const [selectedGroup, setSelectedGroup] = useState(preferences?.group_type || '');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(preferences?.interests || []);
  const [selectedAccessibility, setSelectedAccessibility] = useState<string[]>(preferences?.accessibility_needs || []);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('');

  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev =>
      prev.includes(interestId)
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    );
  };

  const toggleAccessibility = (accessibilityId: string) => {
    setSelectedAccessibility(prev =>
      prev.includes(accessibilityId)
        ? prev.filter(id => id !== accessibilityId)
        : [...prev, accessibilityId]
    );
  };

  const formatDateUK = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const generateItinerary = async () => {
    if (!destination || !startDate || !endDate || !selectedBudget || !selectedGroup) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    if (endDate <= startDate) {
      Alert.alert('Invalid Dates', 'End date must be after start date.');
      return;
    }

    setIsGenerating(true);
    setGenerationStatus('Preparing your trip details...');

    const tripData = {
      destination,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      budget: selectedBudget,
      group: selectedGroup,
      interests: selectedInterests,
      accessibility: selectedAccessibility,
    };

    // Save user preferences
    await savePreferences({
      interests: selectedInterests,
      budget_range: selectedBudget,
      group_type: selectedGroup,
      accessibility_needs: selectedAccessibility,
    });

    console.log('🚀 Sending trip data:', tripData);

    try {
      setGenerationStatus('Connecting to AI travel advisor...');
      
      const response = await fetch('/generate-itinerary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tripData),
      });

      setGenerationStatus('Processing your personalized itinerary...');

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Received itinerary result:', result);
        
        // Save itinerary to user's account
        if (result.itinerary) {
          const { error: saveError } = await saveItinerary(
            result.itinerary,
            tripData.destination,
            tripData.startDate,
            tripData.endDate
          );
          
          if (saveError) {
            console.error('Failed to save itinerary:', saveError);
          } else {
            console.log('💾 Itinerary saved to user account');
          }
        }
        
        // Also save to localStorage for immediate access
        if (typeof localStorage !== 'undefined' && result.itinerary) {
          const completeItinerary = {
            ...result.itinerary,
            destination: tripData.destination,
            location: tripData.destination,
            startDate: tripData.startDate,
            endDate: tripData.endDate,
          };
          try {
            localStorage.setItem('currentItinerary', JSON.stringify(completeItinerary));
            localStorage.setItem('latestItinerary', JSON.stringify(completeItinerary));
            console.log('💾 Saved itinerary to localStorage and backup');
          } catch (storageError) {
            console.warn('⚠️ localStorage not available, using memory storage');
            // Store in global variable as fallback
            (global as any).currentItinerary = completeItinerary;
          }
        } else {
          console.warn('⚠️ localStorage not available, using memory storage');
          // Store in global variable as fallback
          (global as any).currentItinerary = result.itinerary;
        }
        
        setGenerationStatus('Finalizing recommendations...');
        
        setTimeout(() => {
          const tripDuration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          
          let accessibilityMessage = '';
          if (selectedAccessibility.length > 0) {
            accessibilityMessage = `\n\n♿ Accessibility preferences included for a comfortable and inclusive experience`;
          }
          
          Alert.alert(
            'Success!', 
            `🎉 Your ${tripDuration}-day itinerary is ready!\n\n${result.ai_powered ? '🤖 Powered by AI' : '📋 Sample itinerary provided'}\n\nTrip: ${formatDateUK(startDate)} to ${formatDateUK(endDate)}${accessibilityMessage}\n\n✨ TAP THE "ITINERARY" TAB BELOW to view your complete ${tripDuration}-day travel plan with activities, costs, and local tips!`,
            [
              {
                text: '📋 View My Itinerary',
                onPress: () => {
                  // For mobile compatibility, use replace instead of push
                  setTimeout(() => {
                    router.replace('/(tabs)/itinerary');
                  }, 100);
                }
              },
              {
                text: 'Create Another Trip',
                style: 'cancel',
                onPress: () => {
                  console.log('User chose to stay on setup page');
                }
              }
            ]
          );
          
          if (result.debug_info) {
            console.log('🔧 Debug Info:', result.debug_info);
          }
        }, 1000);
      } else {
        const errorData = await response.json();
        console.error('❌ API Error:', errorData);
        Alert.alert('Error', errorData.error || 'Failed to generate itinerary. Please try again.');
      }
    } catch (error) {
      console.error('💥 Network Error:', error);
      Alert.alert(
        'Connection Error', 
        'Unable to connect to the AI service. Please check:\n\n• Your Ollama server is running\n• The server is accessible at the configured URL\n• The llama2:latest model is installed'
      );
    } finally {
      setIsGenerating(false);
      setGenerationStatus('');
    }
  };

  const today = new Date();
  const maxDate = new Date();
  maxDate.setFullYear(today.getFullYear() + 2);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#60a5fa', '#3b82f6']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Plan Your Adventure</Text>
        <Text style={styles.headerSubtitle}>
          Welcome back, {profile?.full_name || 'Traveler'}! Tell us about your dream trip
        </Text>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Destination */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin size={24} color="#3b82f6" />
            <Text style={styles.sectionTitle}>Where are you going?</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Enter your destination (e.g., Barcelona, Spain)"
            value={destination}
            onChangeText={setDestination}
            placeholderTextColor="#94a3b8"
          />
        </View>

        {/* Dates */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={24} color="#3b82f6" />
            <Text style={styles.sectionTitle}>Travel Dates</Text>
          </View>
          <Text style={styles.dateFormatHint}>Dates will be shown in DD/MM/YYYY format</Text>
          <View style={styles.dateRow}>
            <DatePicker
              value={startDate}
              onDateChange={setStartDate}
              placeholder="Start date"
              minimumDate={today}
              maximumDate={maxDate}
              style={styles.halfInput}
            />
            <DatePicker
              value={endDate}
              onDateChange={setEndDate}
              placeholder="End date"
              minimumDate={startDate || today}
              maximumDate={maxDate}
              style={styles.halfInput}
            />
          </View>
          {startDate && endDate && (
            <Text style={styles.datePreview}>
              Trip duration: {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days
              {'\n'}From {formatDateUK(startDate)} to {formatDateUK(endDate)}
            </Text>
          )}
        </View>

        {/* Budget */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <DollarSign size={24} color="#3b82f6" />
            <Text style={styles.sectionTitle}>Budget Range (Sterling)</Text>
          </View>
          {budgetRanges.map((budget) => (
            <TouchableOpacity
              key={budget.id}
              style={[
                styles.optionButton,
                selectedBudget === budget.id && styles.selectedOption,
              ]}
              onPress={() => setSelectedBudget(budget.id)}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedBudget === budget.id && styles.selectedOptionText,
                ]}
              >
                {budget.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Group Type */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={24} color="#3b82f6" />
            <Text style={styles.sectionTitle}>Group Type</Text>
          </View>
          <View style={styles.groupGrid}>
            {groupTypes.map((group) => (
              <TouchableOpacity
                key={group.id}
                style={[
                  styles.groupButton,
                  selectedGroup === group.id && styles.selectedGroup,
                ]}
                onPress={() => setSelectedGroup(group.id)}
              >
                <Text
                  style={[
                    styles.groupText,
                    selectedGroup === group.id && styles.selectedGroupText,
                  ]}
                >
                  {group.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Interests */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Heart size={24} color="#3b82f6" />
            <Text style={styles.sectionTitle}>Your Interests</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Select all that apply</Text>
          <View style={styles.interestsGrid}>
            {interests.map((interest) => {
              const IconComponent = interest.icon;
              const isSelected = selectedInterests.includes(interest.id);
              return (
                <TouchableOpacity
                  key={interest.id}
                  style={[
                    styles.interestButton,
                    isSelected && styles.selectedInterest,
                  ]}
                  onPress={() => toggleInterest(interest.id)}
                >
                  <IconComponent
                    size={24}
                    color={isSelected ? '#ffffff' : '#3b82f6'}
                  />
                  <Text
                    style={[
                      styles.interestText,
                      isSelected && styles.selectedInterestText,
                    ]}
                  >
                    {interest.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Accessibility Options */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Accessibility size={24} color="#10b981" />
            <Text style={styles.sectionTitle}>Accessibility Preferences</Text>
          </View>
          <Text style={styles.accessibilitySubtitle}>
            Help us make your trip comfortable and inclusive by sharing any accessibility needs
          </Text>
          <View style={styles.accessibilityGrid}>
            {accessibilityOptions.map((option) => {
              const IconComponent = option.icon;
              const isSelected = selectedAccessibility.includes(option.id);
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.accessibilityButton,
                    isSelected && styles.selectedAccessibility,
                  ]}
                  onPress={() => toggleAccessibility(option.id)}
                >
                  <View style={styles.accessibilityHeader}>
                    <IconComponent
                      size={20}
                      color={isSelected ? '#ffffff' : '#10b981'}
                    />
                    <Text
                      style={[
                        styles.accessibilityLabel,
                        isSelected && styles.selectedAccessibilityLabel,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.accessibilityDescription,
                      isSelected && styles.selectedAccessibilityDescription,
                    ]}
                  >
                    {option.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.accessibilityNote}>
            <Text style={styles.accessibilityNoteText}>
              💚 Sharing these preferences helps us recommend venues, routes, and activities that ensure everyone can enjoy the journey comfortably.
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]} 
          onPress={generateItinerary}
          disabled={isGenerating}
        >
          <LinearGradient
            colors={isGenerating ? ['#94a3b8', '#64748b'] : ['#f97316', '#ea580c']}
            style={styles.generateGradient}
          >
            {isGenerating && <Loader size={20} color="#ffffff" style={styles.loadingIcon} />}
            <Text style={styles.generateButtonText}>
              {isGenerating ? 'Generating Your Itinerary...' : 'Generate My Itinerary'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {isGenerating && generationStatus && (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>{generationStatus}</Text>
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
    color: '#dbeafe',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  section: {
    marginTop: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  accessibilitySubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  dateFormatHint: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  datePreview: {
    fontSize: 14,
    color: '#10b981',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    textAlign: 'center',
    fontWeight: '600',
  },
  optionButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectedOption: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  optionText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#ffffff',
  },
  groupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  groupButton: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  selectedGroup: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  groupText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  selectedGroupText: {
    color: '#ffffff',
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  interestButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '47%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  selectedInterest: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  interestText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  selectedInterestText: {
    color: '#ffffff',
  },
  accessibilityGrid: {
    gap: 12,
  },
  accessibilityButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  selectedAccessibility: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  accessibilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  accessibilityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 12,
    flex: 1,
  },
  selectedAccessibilityLabel: {
    color: '#ffffff',
  },
  accessibilityDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  selectedAccessibilityDescription: {
    color: '#f0fdf4',
  },
  accessibilityNote: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  accessibilityNoteText: {
    fontSize: 14,
    color: '#166534',
    lineHeight: 20,
    textAlign: 'center',
  },
  generateButton: {
    marginVertical: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loadingIcon: {
    marginRight: 8,
  },
  generateButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statusContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
});

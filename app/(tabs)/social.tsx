import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Users, 
  BookOpen, 
  Heart, 
  Search, 
  MapPin, 
  Star, 
  MessageCircle, 
  Share, 
  Award, 
  Clock, 
  Camera, 
  Plus,
  Save,
  X,
  Smile,
  Coffee,
  Moon,
  Sun,
  Activity,
  Droplets,
  Battery,
  Zap,
  Frown
} from 'lucide-react-native';

const moods = [
  { id: 'energetic', label: 'Energetic', icon: Zap, color: '#f59e0b' },
  { id: 'tired', label: 'Tired', icon: Coffee, color: '#8b5cf6' },
  { id: 'happy', label: 'Happy', icon: Smile, color: '#10b981' },
  { id: 'stressed', label: 'Stressed', icon: Frown, color: '#ef4444' },
  { id: 'curious', label: 'Curious', icon: Sun, color: '#3b82f6' },
  { id: 'peaceful', label: 'Peaceful', icon: Moon, color: '#64748b' },
];

const communityTips = [
  {
    id: '1',
    author: 'Sarah_Explorer',
    avatar: '🏃‍♀️',
    location: 'Barcelona, Spain',
    title: 'Hidden Beach Paradise',
    content: 'Skip the crowded Barceloneta and head to Cala Lloret! A stunning hidden cove just 30 minutes by train.',
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
    content: 'Try Pizza al Taglio da Checchino near Trastevere. Locals line up here daily!',
    category: 'food',
    likes: 89,
    comments: 15,
    rating: 4.9,
  },
];

const journalEntries = [
  {
    id: '1',
    date: '2024-01-15',
    location: 'Barcelona, Spain',
    title: 'First Day in Barcelona',
    content: 'What an incredible start! The Sagrada Família was breathtaking...',
    mood: 'amazing',
    rating: 5,
    photos: ['https://images.pexels.com/photos/1388030/pexels-photo-1388030.jpeg?auto=compress&cs=tinysrgb&w=400'],
  },
  {
    id: '2',
    date: '2024-01-15',
    location: 'Gothic Quarter, Barcelona',
    title: 'Lunch in the Gothic Quarter',
    content: 'Found this amazing little tapas bar. The paella was divine!',
    mood: 'happy',
    rating: 4,
    photos: ['https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400'],
  },
];

export default function SocialScreen() {
  const [activeSection, setActiveSection] = useState<'explore' | 'journal' | 'companion'>('explore');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [isWriting, setIsWriting] = useState(false);
  const [newEntry, setNewEntry] = useState({
    title: '',
    content: '',
    location: '',
    mood: 'happy',
    rating: 5,
  });

  const sections = [
    { id: 'explore', label: 'Explore', icon: Users, color: '#f97316' },
    { id: 'journal', label: 'Journal', icon: BookOpen, color: '#f59e0b' },
    { id: 'companion', label: 'Companion', icon: Heart, color: '#ec4899' },
  ];

  const renderExploreSection = () => (
    <View style={styles.sectionContent}>
      {/* Search */}
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

      {/* Community Tips */}
      <Text style={styles.subsectionTitle}>🌟 Community Tips</Text>
      {communityTips.map((tip) => (
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
            <View style={styles.ratingContainer}>
              <Star size={14} color="#fbbf24" />
              <Text style={styles.ratingText}>{tip.rating}</Text>
            </View>
          </View>

          <Text style={styles.tipTitle}>{tip.title}</Text>
          <Text style={styles.tipContent}>{tip.content}</Text>

          <View style={styles.tipFooter}>
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
      ))}
    </View>
  );

  const renderJournalSection = () => (
    <View style={styles.sectionContent}>
      {!isWriting ? (
        <>
          <View style={styles.journalHeader}>
            <Text style={styles.subsectionTitle}>📖 Travel Journal</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setIsWriting(true)}
            >
              <Plus size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {journalEntries.map((entry) => (
            <View key={entry.id} style={styles.journalCard}>
              <View style={styles.journalHeader}>
                <Text style={styles.journalDate}>
                  {new Date(entry.date).toLocaleDateString('en-GB')}
                </Text>
                <View style={styles.journalLocation}>
                  <MapPin size={14} color="#64748b" />
                  <Text style={styles.locationText}>{entry.location}</Text>
                </View>
              </View>

              <Text style={styles.journalTitle}>{entry.title}</Text>
              
              <View style={styles.starRating}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    color={star <= entry.rating ? '#fbbf24' : '#e5e7eb'}
                    fill={star <= entry.rating ? '#fbbf24' : 'transparent'}
                  />
                ))}
              </View>

              <Text style={styles.journalContent}>{entry.content}</Text>

              {entry.photos && entry.photos.length > 0 && (
                <ScrollView horizontal style={styles.journalPhotos} showsHorizontalScrollIndicator={false}>
                  {entry.photos.map((photo, index) => (
                    <Image key={index} source={{ uri: photo }} style={styles.journalPhoto} />
                  ))}
                </ScrollView>
              )}
            </View>
          ))}
        </>
      ) : (
        <View style={styles.writingContainer}>
          <View style={styles.writingHeader}>
            <Text style={styles.writingTitle}>New Journal Entry</Text>
            <View style={styles.writingActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsWriting(false)}
              >
                <X size={20} color="#64748b" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => {
                  Alert.alert('Success', 'Journal entry saved!');
                  setIsWriting(false);
                }}
              >
                <Save size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.writingForm}>
            <TextInput
              style={styles.titleInput}
              placeholder="Entry title..."
              value={newEntry.title}
              onChangeText={(text) => setNewEntry(prev => ({ ...prev, title: text }))}
            />
            
            <TextInput
              style={styles.contentInput}
              placeholder="Write about your experience..."
              value={newEntry.content}
              onChangeText={(text) => setNewEntry(prev => ({ ...prev, content: text }))}
              multiline
              numberOfLines={8}
            />
          </ScrollView>
        </View>
      )}
    </View>
  );

  const renderCompanionSection = () => (
    <View style={styles.sectionContent}>
      <Text style={styles.subsectionTitle}>💝 How are you feeling?</Text>
      
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

      {selectedMood && (
        <View style={styles.moodSuggestion}>
          <Text style={styles.suggestionTitle}>Perfect for your {selectedMood} mood:</Text>
          <View style={styles.suggestionCard}>
            <Text style={styles.suggestionText}>
              {selectedMood === 'energetic' && 'Try a hiking trail or bike tour to channel that energy!'}
              {selectedMood === 'tired' && 'Find a cozy café or spa for some relaxation time.'}
              {selectedMood === 'happy' && 'Explore local markets and connect with friendly locals!'}
              {selectedMood === 'stressed' && 'Visit a peaceful garden or take a mindful walk.'}
              {selectedMood === 'curious' && 'Check out museums or take a cultural workshop.'}
              {selectedMood === 'peaceful' && 'Find a scenic viewpoint for sunset watching.'}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.wellbeingTips}>
        <Text style={styles.subsectionTitle}>🧠 Wellbeing Tips</Text>
        <View style={styles.tipsList}>
          <Text style={styles.tipItem}>• Stay hydrated - aim for 8 glasses daily</Text>
          <Text style={styles.tipItem}>• Take breaks - don't overpack your itinerary</Text>
          <Text style={styles.tipItem}>• Listen to your body - rest when needed</Text>
          <Text style={styles.tipItem}>• Practice mindfulness - enjoy the moment</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#8b5cf6', '#7c3aed']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Social & Wellbeing</Text>
        <Text style={styles.headerSubtitle}>Explore, journal, and track your mood</Text>
      </LinearGradient>

      {/* Section Selector */}
      <View style={styles.sectionSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {sections.map((section) => {
            const IconComponent = section.icon;
            const isSelected = activeSection === section.id;
            return (
              <TouchableOpacity
                key={section.id}
                style={[
                  styles.sectionButton,
                  isSelected && { backgroundColor: section.color, borderColor: section.color },
                ]}
                onPress={() => setActiveSection(section.id as any)}
              >
                <IconComponent
                  size={20}
                  color={isSelected ? '#ffffff' : section.color}
                />
                <Text
                  style={[
                    styles.sectionButtonText,
                    isSelected && { color: '#ffffff' },
                    !isSelected && { color: section.color },
                  ]}
                >
                  {section.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeSection === 'explore' && renderExploreSection()}
        {activeSection === 'journal' && renderJournalSection()}
        {activeSection === 'companion' && renderCompanionSection()}
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
    color: '#e9d5ff',
  },
  sectionSelector: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  sectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  sectionContent: {
    paddingTop: 20,
    paddingBottom: 32,
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
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
    marginBottom: 24,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    marginLeft: 12,
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
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 4,
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
  journalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#10b981',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  journalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  journalDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  journalLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  journalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    marginTop: 8,
  },
  starRating: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 4,
  },
  journalContent: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 16,
  },
  journalPhotos: {
    marginBottom: 16,
  },
  journalPhoto: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
  },
  writingContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  writingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  writingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  writingActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: '#10b981',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  writingForm: {
    maxHeight: 400,
  },
  titleInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  contentInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
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
  },
  moodText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  moodSuggestion: {
    marginBottom: 24,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  suggestionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  suggestionText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  wellbeingTips: {
    marginTop: 16,
  },
  tipsList: {
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
});

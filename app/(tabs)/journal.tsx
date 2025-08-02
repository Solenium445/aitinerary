import React, { useState, useEffect } from 'react';
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
import { BookOpen, Camera, MapPin, Clock, Heart, Star, Plus, CreditCard as Edit3, Save, X, Calendar, Mic, Image as ImageIcon, Smile, MessageCircle, Award, Bookmark } from 'lucide-react-native';
import { useJournalEntries } from '@/hooks/useUserData';
import * as ImagePicker from 'expo-image-picker';

interface JournalEntry {
  id: string;
  date: string;
  location: string;
  title: string;
  content: string;
  mood: string;
  rating: number;
  photos: string[];
  activityId?: string;
  tags: string[];
  reflection?: string;
}

interface PhotoMemory {
  id: string;
  uri: string;
  location: string;
  timestamp: string;
  caption?: string;
}

const moodEmojis = {
  amazing: '🤩',
  happy: '😊',
  good: '🙂',
  okay: '😐',
  tired: '😴',
  stressed: '😰',
};

const samplePhotos: PhotoMemory[] = [
  {
    id: '1',
    uri: 'https://images.pexels.com/photos/1388030/pexels-photo-1388030.jpeg?auto=compress&cs=tinysrgb&w=400',
    location: 'Sagrada Família, Barcelona',
    timestamp: '2024-01-15T10:30:00Z',
    caption: 'Incredible architecture by Gaudí',
  },
  {
    id: '2',
    uri: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400',
    location: 'Local Tapas Bar, Barcelona',
    timestamp: '2024-01-15T14:15:00Z',
    caption: 'Amazing paella and sangria',
  },
  {
    id: '3',
    uri: 'https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&cs=tinysrgb&w=400',
    location: 'Park Güell, Barcelona',
    timestamp: '2024-01-15T16:45:00Z',
    caption: 'Colorful mosaics and city views',
  },
];

const sampleEntries: JournalEntry[] = [
  {
    id: '1',
    date: '2024-01-15',
    location: 'Barcelona, Spain',
    title: 'First Day in Barcelona',
    content: 'What an incredible start to our Barcelona adventure! The Sagrada Família was even more breathtaking in person than in photos. The intricate details and the way light filters through the stained glass windows created such a magical atmosphere. We spent hours just walking around and taking it all in.',
    mood: 'amazing',
    rating: 5,
    photos: ['1', '3'],
    tags: ['architecture', 'gaudí', 'sightseeing'],
    reflection: 'This trip is already exceeding my expectations. The energy of the city is infectious, and I can\'t wait to explore more tomorrow.',
  },
  {
    id: '2',
    date: '2024-01-15',
    location: 'Gothic Quarter, Barcelona',
    title: 'Lunch in the Gothic Quarter',
    content: 'Found this amazing little tapas bar tucked away in the Gothic Quarter. The paella was absolutely divine, and the sangria was the perfect complement. The owner was so friendly and gave us recommendations for tomorrow.',
    mood: 'happy',
    rating: 4,
    photos: ['2'],
    tags: ['food', 'tapas', 'local culture'],
    reflection: 'Food really is a universal language. Even with limited Spanish, we connected with the locals through shared appreciation of good food.',
  },
];

export default function JournalScreen() {
  const { entries, loading, saveEntry, deleteEntry, refreshEntries } = useJournalEntries();
  const [photos, setPhotos] = useState<PhotoMemory[]>(samplePhotos);
  const [isWriting, setIsWriting] = useState(false);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'entries' | 'photos' | 'reflections'>('entries');
  const [newEntry, setNewEntry] = useState<Partial<JournalEntry>>({
    title: '',
    content: '',
    location: '',
    mood: 'happy',
    rating: 5,
    tags: [],
  });
  const [saving, setSaving] = useState(false);

  const startNewEntry = () => {
    setNewEntry({
      title: '',
      content: '',
      location: '',
      mood: 'happy',
      rating: 5,
      tags: [],
      date: new Date().toISOString().split('T')[0],
    });
    setIsWriting(true);
  };

  const saveNewEntry = async () => {
    if (!newEntry.title || !newEntry.content) {
      Alert.alert('Missing Information', 'Please add a title and content for your entry.');
      return;
    }

    setSaving(true);
    
    try {
      const entryData = {
        title: newEntry.title,
        content: newEntry.content,
        location: newEntry.location || 'Current Location',
        mood: newEntry.mood || 'happy',
        rating: newEntry.rating || 5,
        photos: [], // Will be implemented with photo upload
      };

      const { error } = await saveEntry(entryData);
      
      if (error) {
        console.error('Error saving journal entry:', error);
        Alert.alert('Error', 'Failed to save journal entry. Please try again.');
      } else {
        setIsWriting(false);
        setNewEntry({});
        Alert.alert('Success', 'Journal entry saved successfully!');
        await refreshEntries(); // Refresh the list
      }
    } catch (error) {
      console.error('Exception saving journal entry:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const cancelEntry = () => {
    setIsWriting(false);
    setNewEntry({});
  };

  const addPhotoToEntry = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to add photos.');
        return;
      }

      Alert.alert(
        'Add Photo',
        'Choose how to add a photo:',
        [
          {
            text: 'Take Photo',
            onPress: async () => {
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
              });
              
              if (!result.canceled && result.assets[0]) {
                // In a real app, you'd upload this to storage
                console.log('Photo taken:', result.assets[0].uri);
                Alert.alert('Photo Added', 'Photo functionality is ready for implementation!');
              }
            },
          },
          {
            text: 'Choose from Library',
            onPress: async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
              });
              
              if (!result.canceled && result.assets[0]) {
                // In a real app, you'd upload this to storage
                console.log('Photo selected:', result.assets[0].uri);
                Alert.alert('Photo Added', 'Photo functionality is ready for implementation!');
              }
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } catch (error) {
      console.error('Error adding photo:', error);
      Alert.alert('Error', 'Failed to add photo. Please try again.');
    }
  };

  const deleteJournalEntry = async (entryId: string) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this journal entry? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteEntry(entryId);
            if (error) {
              Alert.alert('Error', 'Failed to delete entry. Please try again.');
            } else {
              Alert.alert('Success', 'Journal entry deleted.');
              await refreshEntries();
            }
          },
        },
      ]
    );
  };

  const renderStarRating = (rating: number, onPress?: (rating: number) => void) => (
    <View style={styles.starRating}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => onPress?.(star)}
          disabled={!onPress}
        >
          <Star
            size={20}
            color={star <= rating ? '#fbbf24' : '#e5e7eb'}
            fill={star <= rating ? '#fbbf24' : 'transparent'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderWritingInterface = () => (
    <View style={styles.writingContainer}>
      <View style={styles.writingHeader}>
        <Text style={styles.writingTitle}>New Journal Entry</Text>
        <View style={styles.writingActions}>
          <TouchableOpacity style={styles.cancelButton} onPress={cancelEntry}>
            <X size={20} color="#64748b" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={saveEntry}>
            <Save size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.writingForm} showsVerticalScrollIndicator={false}>
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Title</Text>
          <TextInput
            style={styles.titleInput}
            value={newEntry.title}
            onChangeText={(text) => setNewEntry(prev => ({ ...prev, title: text }))}
            placeholder="Give your entry a title..."
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Location</Text>
          <View style={styles.locationInput}>
            <MapPin size={16} color="#64748b" />
            <TextInput
              style={styles.locationText}
              value={newEntry.location}
              onChangeText={(text) => setNewEntry(prev => ({ ...prev, location: text }))}
              placeholder="Where are you?"
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>How was it?</Text>
          {renderStarRating(newEntry.rating || 5, (rating) => 
            setNewEntry(prev => ({ ...prev, rating }))
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Mood</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moodSelector}>
            {Object.entries(moodEmojis).map(([mood, emoji]) => (
              <TouchableOpacity
                key={mood}
                style={[
                  styles.moodButton,
                  newEntry.mood === mood && styles.selectedMoodButton,
                ]}
                onPress={() => setNewEntry(prev => ({ ...prev, mood }))}
              >
                <Text style={styles.moodEmoji}>{emoji}</Text>
                <Text style={[
                  styles.moodLabel,
                  newEntry.mood === mood && styles.selectedMoodLabel,
                ]}>
                  {mood}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Your Experience</Text>
          <TextInput
            style={styles.contentInput}
            value={newEntry.content}
            onChangeText={(text) => setNewEntry(prev => ({ ...prev, content: text }))}
            placeholder="Write about your experience, what you saw, how you felt..."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={8}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity style={styles.photoButton} onPress={addPhotoToEntry}>
          <Camera size={20} color="#3b82f6" />
          <Text style={styles.photoButtonText}>Add Photos</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.saveButton, styles.saveEntryButton, saving && styles.saveButtonDisabled]} 
          onPress={saveNewEntry}
          disabled={saving}
        >
          {saving ? (
            <Text style={styles.saveButtonText}>Saving...</Text>
          ) : (
            <>
              <Save size={20} color="#ffffff" />
              <Text style={styles.saveButtonText}>Save Entry</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderJournalEntries = () => (
    <ScrollView style={styles.entriesContainer} showsVerticalScrollIndicator={false}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your journal entries...</Text>
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <BookOpen size={32} color="#94a3b8" />
          <Text style={styles.emptyTitle}>No journal entries yet</Text>
          <Text style={styles.emptyText}>
            Start documenting your travels by tapping the + button above!
          </Text>
        </View>
      ) : (
        entries.map((entry) => (
        <View key={entry.id} style={styles.entryCard}>
          <View style={styles.entryHeader}>
            <View style={styles.entryMeta}>
              <Text style={styles.entryDate}>
                {new Date(entry.created_at).toLocaleDateString('en-GB', { 
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
              <View style={styles.entryLocation}>
                <MapPin size={14} color="#64748b" />
                <Text style={styles.entryLocationText}>{entry.location}</Text>
              </View>
            </View>
            <View style={styles.entryMood}>
              <Text style={styles.entryMoodEmoji}>
                {entry.mood ? moodEmojis[entry.mood as keyof typeof moodEmojis] || '😊' : '😊'}
              </Text>
            </View>
          </View>

          <Text style={styles.entryTitle}>{entry.title}</Text>
          
          {entry.rating && renderStarRating(entry.rating)}

          <Text style={styles.entryContent}>{entry.content}</Text>

          {entry.photos && entry.photos.length > 0 && (
            <ScrollView horizontal style={styles.entryPhotos} showsHorizontalScrollIndicator={false}>
              {entry.photos.map((photoId) => {
                const photo = photos.find(p => p.id === photoId);
                return photo ? (
                  <Image key={photoId} source={{ uri: photo.uri }} style={styles.entryPhoto} />
                ) : null;
              })}
            </ScrollView>
          )}

          <View style={styles.entryActions}>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteJournalEntry(entry.id)}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
        ))
      )}
      
      {!loading && entries.length === 0 && (
        <TouchableOpacity style={styles.createFirstEntryButton} onPress={startNewEntry}>
          <Plus size={20} color="#ffffff" />
          <Text style={styles.createFirstEntryText}>Create Your First Entry</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );

  const renderPhotoGallery = () => (
    <ScrollView style={styles.photosContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.photosGrid}>
        {photos.map((photo) => (
          <TouchableOpacity key={photo.id} style={styles.photoItem}>
            <Image source={{ uri: photo.uri }} style={styles.photoImage} />
            <View style={styles.photoOverlay}>
              <Text style={styles.photoLocation}>{photo.location}</Text>
              <Text style={styles.photoTime}>
                {new Date(photo.timestamp).toLocaleDateString()}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderReflections = () => (
    <ScrollView style={styles.reflectionsContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.reflectionPrompts}>
        <Text style={styles.reflectionPromptsTitle}>✨ Reflection Prompts</Text>
        <View style={styles.promptCard}>
          <Text style={styles.promptText}>What was the most surprising thing you discovered today?</Text>
        </View>
        <View style={styles.promptCard}>
          <Text style={styles.promptText}>How did this experience change your perspective?</Text>
        </View>
        <View style={styles.promptCard}>
          <Text style={styles.promptText}>What would you tell someone visiting this place?</Text>
        </View>
      </View>

      <View style={styles.memoryKeepsakes}>
        <Text style={styles.keepsakesTitle}>🎁 Memory Keepsakes</Text>
        {entries.filter(e => e.reflection).map((entry) => (
          <View key={entry.id} style={styles.keepsakeCard}>
            <Text style={styles.keepsakeTitle}>{entry.title}</Text>
            <Text style={styles.keepsakeReflection}>{entry.reflection}</Text>
            <Text style={styles.keepsakeDate}>{entry.date}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const views = [
    { id: 'entries', label: 'Entries', icon: BookOpen },
    { id: 'photos', label: 'Photos', icon: ImageIcon },
    { id: 'reflections', label: 'Reflections', icon: MessageCircle },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#f59e0b', '#d97706']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Travel Journal</Text>
          <Text style={styles.headerSubtitle}>Capture your memories & reflections</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your journal...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#f59e0b', '#d97706']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Travel Journal</Text>
        <Text style={styles.headerSubtitle}>Capture your memories & reflections</Text>
      </LinearGradient>

      {!isWriting && (
        <>
          {/* View Selector */}
          <View style={styles.viewSelector}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {views.map((view) => {
                const IconComponent = view.icon;
                const isSelected = selectedView === view.id;
                return (
                  <TouchableOpacity
                    key={view.id}
                    style={[
                      styles.viewButton,
                      isSelected && styles.selectedViewButton,
                    ]}
                    onPress={() => setSelectedView(view.id as any)}
                  >
                    <IconComponent
                      size={20}
                      color={isSelected ? '#ffffff' : '#64748b'}
                    />
                    <Text
                      style={[
                        styles.viewButtonText,
                        isSelected && styles.selectedViewButtonText,
                      ]}
                    >
                      {view.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            
            <TouchableOpacity style={styles.newEntryButton} onPress={startNewEntry}>
              <Plus size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {selectedView === 'entries' && renderJournalEntries()}
            {selectedView === 'photos' && renderPhotoGallery()}
            {selectedView === 'reflections' && renderReflections()}
          </View>
        </>
      )}

      {isWriting && renderWritingInterface()}
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
    color: '#fef3c7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
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
  createFirstEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f59e0b',
    borderRadius: 16,
    padding: 20,
    marginTop: 32,
    gap: 8,
  },
  createFirstEntryText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  viewSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  viewButton: {
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
  selectedViewButton: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginLeft: 6,
  },
  selectedViewButtonText: {
    color: '#ffffff',
  },
  newEntryButton: {
    backgroundColor: '#10b981',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  entriesContainer: {
    flex: 1,
    paddingTop: 20,
  },
  entryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  entryMeta: {
    flex: 1,
  },
  entryDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  entryLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryLocationText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  entryMood: {
    alignItems: 'center',
  },
  entryMoodEmoji: {
    fontSize: 24,
  },
  entryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  starRating: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 4,
  },
  entryContent: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 16,
  },
  entryPhotos: {
    marginBottom: 16,
  },
  entryPhoto: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
  },
  entryActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#dc2626',
  },
  writingContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  writingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  writingTitle: {
    fontSize: 20,
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
  saveEntryButton: {
    flexDirection: 'row',
    width: 'auto',
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginBottom: 32,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  writingForm: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  titleInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  locationText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
  },
  moodSelector: {
    flexDirection: 'row',
  },
  moodButton: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginRight: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minWidth: 70,
  },
  selectedMoodButton: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  moodEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'capitalize',
  },
  selectedMoodLabel: {
    color: '#ffffff',
  },
  contentInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minHeight: 120,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3b82f6',
    marginBottom: 32,
  },
  photoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
    marginLeft: 8,
  },
  photosContainer: {
    flex: 1,
    paddingTop: 20,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoItem: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
  },
  photoLocation: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  photoTime: {
    fontSize: 10,
    color: '#e5e7eb',
  },
  reflectionsContainer: {
    flex: 1,
    paddingTop: 20,
  },
  reflectionPrompts: {
    marginBottom: 32,
  },
  reflectionPromptsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  promptCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  promptText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  memoryKeepsakes: {
    marginBottom: 32,
  },
  keepsakesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  keepsakeCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  keepsakeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 8,
  },
  keepsakeReflection: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 18,
    marginBottom: 8,
  },
  keepsakeDate: {
    fontSize: 12,
    color: '#a16207',
  },
});

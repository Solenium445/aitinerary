import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import DownloadButton from '@/components/DownloadButton';
import { User, Mail, Settings, LogOut, CreditCard as Edit3, Save, X, MapPin, Calendar, Heart, Camera, Shield, Bell, CircleHelp as HelpCircle, ChevronRight, Plus, Star, Clock, Trash2, Eye } from 'lucide-react-native';
import { Loader } from 'lucide-react-native';
import { useUserItineraries, useJournalEntries, useUserPreferences } from '@/hooks/useUserData';

export default function ProfileScreen() {
  const { user, profile, signOut, updateProfile } = useAuth();
  const { itineraries, loading: itinerariesLoading, refreshItineraries } = useUserItineraries();
  const { entries, loading: entriesLoading, refreshEntries } = useJournalEntries();
  const { preferences, loading: preferencesLoading, savePreferences, refreshPreferences } = useUserPreferences();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(profile?.full_name || '');
  const [refreshing, setRefreshing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const handleSaveProfile = async () => {
    if (!editedName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    const { error } = await updateProfile({
      full_name: editedName.trim(),
    });

    if (error) {
      Alert.alert('Error', 'Failed to update profile');
    } else {
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    }
  };

  const handleSignOut = () => {
    if (signingOut) return; // Prevent multiple clicks
    
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              setSigningOut(true);
              console.log('🚪 Starting sign out process...');
              
              const { error } = await signOut();
              
              // Always consider it successful since we clear local state
                console.log('✅ Sign out successful');
              
              // Force immediate navigation
              router.replace('/(auth)/welcome');
              
            } catch (error) {
              console.error('❌ Sign out exception:', error);
              // Still navigate even on error to prevent stuck state
              router.replace('/(auth)/welcome');
            } finally {
              setSigningOut(false);
            }
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refreshItineraries(),
      refreshEntries(),
      refreshPreferences(),
    ]);
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const renderMyTrips = () => (
    <View style={styles.sectionCard}>
      <TouchableOpacity 
        style={styles.sectionHeader}
        onPress={() => toggleSection('trips')}
      >
        <View style={styles.sectionHeaderLeft}>
          <View style={[styles.sectionIcon, { backgroundColor: '#3b82f620' }]}>
            <MapPin size={20} color="#3b82f6" />
          </View>
          <View>
            <Text style={styles.sectionTitle}>My Trips</Text>
            <Text style={styles.sectionSubtitle}>
              {itinerariesLoading ? 'Loading...' : `${itineraries.length} saved itineraries`}
            </Text>
          </View>
        </View>
        <ChevronRight 
          size={20} 
          color="#94a3b8" 
          style={{ 
            transform: [{ rotate: expandedSection === 'trips' ? '90deg' : '0deg' }] 
          }} 
        />
      </TouchableOpacity>

      {expandedSection === 'trips' && (
        <View style={styles.sectionContent}>
          {itinerariesLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading your trips...</Text>
            </View>
          ) : itineraries.length === 0 ? (
            <View style={styles.emptyState}>
              <MapPin size={32} color="#94a3b8" />
              <Text style={styles.emptyStateTitle}>No trips found yet</Text>
              <Text style={styles.emptyStateText}>
                Start planning your first adventure in the Setup tab!
              </Text>
            </View>
          ) : (
            <View style={styles.itemsList}>
              {itineraries.slice(0, 3).map((trip) => (
                <View key={trip.id} style={styles.tripItem}>
                  <View style={styles.tripInfo}>
                    <Text style={styles.tripDestination}>{trip.destination}</Text>
                    <View style={styles.tripMeta}>
                      <Calendar size={12} color="#64748b" />
                      <Text style={styles.tripDates}>
                        {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.tripAction}
                    onPress={() => {
                      try {
                        // Save the selected itinerary to localStorage for viewing
                        if (typeof localStorage !== 'undefined') {
                          const itineraryToSave = {
                            ...trip.itinerary_data,
                            destination: trip.destination,
                            location: trip.destination,
                            startDate: trip.start_date,
                            endDate: trip.end_date,
                          };
                          localStorage.setItem('currentItinerary', JSON.stringify(itineraryToSave));
                          console.log('💾 Saved itinerary to localStorage for viewing');
                        }
                        // Navigate to itinerary tab
                        router.push('/(tabs)/itinerary');
                      } catch (error) {
                        console.error('Error viewing itinerary:', error);
                        Alert.alert('Error', 'Unable to view itinerary. Please try again.');
                      }
                    }}
                  >
                    <Eye size={16} color="#3b82f6" />
                  </TouchableOpacity>
                </View>
              ))}
              {itineraries.length > 3 && (
                <TouchableOpacity style={styles.viewAllButton}>
                  <Text style={styles.viewAllText}>View all {itineraries.length} trips</Text>
                  <ChevronRight size={16} color="#3b82f6" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );

  const renderTravelJournal = () => (
    <View style={styles.sectionCard}>
      <TouchableOpacity 
        style={styles.sectionHeader}
        onPress={() => toggleSection('journal')}
      >
        <View style={styles.sectionHeaderLeft}>
          <View style={[styles.sectionIcon, { backgroundColor: '#f59e0b20' }]}>
            <Camera size={20} color="#f59e0b" />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Travel Journal</Text>
            <Text style={styles.sectionSubtitle}>
              {entriesLoading ? 'Loading...' : `${entries.length} journal entries`}
            </Text>
          </View>
        </View>
        <ChevronRight 
          size={20} 
          color="#94a3b8" 
          style={{ 
            transform: [{ rotate: expandedSection === 'journal' ? '90deg' : '0deg' }] 
          }} 
        />
      </TouchableOpacity>

      {expandedSection === 'journal' && (
        <View style={styles.sectionContent}>
          {entriesLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading your memories...</Text>
            </View>
          ) : entries.length === 0 ? (
            <View style={styles.emptyState}>
              <Camera size={32} color="#94a3b8" />
              <Text style={styles.emptyStateTitle}>No journal entries yet</Text>
              <Text style={styles.emptyStateText}>
                Start documenting your travels in the Journal tab!
              </Text>
            </View>
          ) : (
            <View style={styles.itemsList}>
              {entries.slice(0, 3).map((entry) => (
                <View key={entry.id} style={styles.journalItem}>
                  <View style={styles.journalInfo}>
                    <Text style={styles.journalTitle}>{entry.title}</Text>
                    <View style={styles.journalMeta}>
                      <Clock size={12} color="#64748b" />
                      <Text style={styles.journalDate}>
                        {formatDate(entry.created_at)}
                      </Text>
                      {entry.rating && (
                        <>
                          <Star size={12} color="#fbbf24" />
                          <Text style={styles.journalRating}>{entry.rating}/5</Text>
                        </>
                      )}
                    </View>
                    <Text style={styles.journalPreview} numberOfLines={2}>
                      {entry.content}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.journalAction}>
                    <Eye size={16} color="#f59e0b" />
                  </TouchableOpacity>
                </View>
              ))}
              {entries.length > 3 && (
                <TouchableOpacity style={styles.viewAllButton}>
                  <Text style={styles.viewAllText}>View all {entries.length} entries</Text>
                  <ChevronRight size={16} color="#f59e0b" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );

  const renderTravelPreferences = () => (
    <View style={styles.sectionCard}>
      <TouchableOpacity 
        style={styles.sectionHeader}
        onPress={() => toggleSection('preferences')}
      >
        <View style={styles.sectionHeaderLeft}>
          <View style={[styles.sectionIcon, { backgroundColor: '#ec489920' }]}>
            <Heart size={20} color="#ec4899" />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Travel Preferences</Text>
            <Text style={styles.sectionSubtitle}>
              {preferencesLoading ? 'Loading...' : preferences ? 'Configured' : 'Not set up yet'}
            </Text>
          </View>
        </View>
        <ChevronRight 
          size={20} 
          color="#94a3b8" 
          style={{ 
            transform: [{ rotate: expandedSection === 'preferences' ? '90deg' : '0deg' }] 
          }} 
        />
      </TouchableOpacity>

      {expandedSection === 'preferences' && (
        <View style={styles.sectionContent}>
          {preferencesLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading your preferences...</Text>
            </View>
          ) : !preferences ? (
            <View style={styles.emptyState}>
              <Heart size={32} color="#94a3b8" />
              <Text style={styles.emptyStateTitle}>No preferences set</Text>
              <Text style={styles.emptyStateText}>
                Set up your travel preferences in the Setup tab for personalized recommendations!
              </Text>
            </View>
          ) : (
            <View style={styles.preferencesContent}>
              {preferences.interests && preferences.interests.length > 0 && (
                <View style={styles.preferenceGroup}>
                  <Text style={styles.preferenceLabel}>Interests</Text>
                  <View style={styles.interestTags}>
                    {preferences.interests.map((interest, index) => (
                      <View key={index} style={styles.interestTag}>
                        <Text style={styles.interestTagText}>{interest}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              
              {preferences.budget_range && (
                <View style={styles.preferenceGroup}>
                  <Text style={styles.preferenceLabel}>Budget Range</Text>
                  <Text style={styles.preferenceValue}>{preferences.budget_range}</Text>
                </View>
              )}
              
              {preferences.group_type && (
                <View style={styles.preferenceGroup}>
                  <Text style={styles.preferenceLabel}>Group Type</Text>
                  <Text style={styles.preferenceValue}>{preferences.group_type}</Text>
                </View>
              )}
              
              {preferences.accessibility_needs && preferences.accessibility_needs.length > 0 && (
                <View style={styles.preferenceGroup}>
                  <Text style={styles.preferenceLabel}>Accessibility Needs</Text>
                  <View style={styles.accessibilityTags}>
                    {preferences.accessibility_needs.map((need, index) => (
                      <View key={index} style={styles.accessibilityTag}>
                        <Text style={styles.accessibilityTagText}>{need}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              
              <TouchableOpacity style={styles.editPreferencesButton}>
                <Text style={styles.editPreferencesText}>Edit Preferences</Text>
                <Settings size={16} color="#ec4899" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );

  const renderNotifications = () => (
    <View style={styles.sectionCard}>
      <TouchableOpacity 
        style={styles.sectionHeader}
        onPress={() => toggleSection('notifications')}
      >
        <View style={styles.sectionHeaderLeft}>
          <View style={[styles.sectionIcon, { backgroundColor: '#10b98120' }]}>
            <Bell size={20} color="#10b981" />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Notifications</Text>
            <Text style={styles.sectionSubtitle}>Manage your alerts and reminders</Text>
          </View>
        </View>
        <ChevronRight 
          size={20} 
          color="#94a3b8" 
          style={{ 
            transform: [{ rotate: expandedSection === 'notifications' ? '90deg' : '0deg' }] 
          }} 
        />
      </TouchableOpacity>

      {expandedSection === 'notifications' && (
        <View style={styles.sectionContent}>
          <View style={styles.notificationSettings}>
            <View style={styles.notificationItem}>
              <View style={styles.notificationInfo}>
                <Text style={styles.notificationTitle}>Trip Reminders</Text>
                <Text style={styles.notificationDescription}>
                  Get notified about upcoming trips and activities
                </Text>
              </View>
              <View style={styles.notificationToggle}>
                <Text style={styles.toggleText}>On</Text>
              </View>
            </View>
            
            <View style={styles.notificationItem}>
              <View style={styles.notificationInfo}>
                <Text style={styles.notificationTitle}>Journal Prompts</Text>
                <Text style={styles.notificationDescription}>
                  Daily reminders to document your experiences
                </Text>
              </View>
              <View style={styles.notificationToggle}>
                <Text style={styles.toggleText}>Off</Text>
              </View>
            </View>
            
            <View style={styles.notificationItem}>
              <View style={styles.notificationInfo}>
                <Text style={styles.notificationTitle}>Budget Alerts</Text>
                <Text style={styles.notificationDescription}>
                  Alerts when you're approaching budget limits
                </Text>
              </View>
              <View style={styles.notificationToggle}>
                <Text style={styles.toggleText}>On</Text>
              </View>
            </View>
          </View>
          
          <Text style={styles.notificationNote}>
            💡 Notification settings are currently in development. Full functionality coming soon!
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Profile</Text>
        <Text style={styles.headerSubtitle}>Manage your account and preferences</Text>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <User size={32} color="#667eea" />
            </View>
            <View style={styles.profileInfo}>
              {isEditing ? (
                <View style={styles.editContainer}>
                  <TextInput
                    style={styles.editInput}
                    value={editedName}
                    onChangeText={setEditedName}
                    placeholder="Enter your name"
                    autoFocus
                  />
                  <View style={styles.editActions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => {
                        setIsEditing(false);
                        setEditedName(profile?.full_name || '');
                      }}
                    >
                      <X size={16} color="#64748b" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.editButton, styles.saveButton]}
                      onPress={handleSaveProfile}
                    >
                      <Save size={16} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.nameContainer}>
                  <Text style={styles.profileName}>
                    {profile?.full_name || 'Travel Enthusiast'}
                  </Text>
                  <TouchableOpacity
                    style={styles.editIconButton}
                    onPress={() => setIsEditing(true)}
                  >
                    <Edit3 size={16} color="#64748b" />
                  </TouchableOpacity>
                </View>
              )}
              <View style={styles.emailContainer}>
                <Mail size={14} color="#64748b" />
                <Text style={styles.profileEmail}>{user?.email}</Text>
              </View>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{itineraries.length}</Text>
              <Text style={styles.statLabel}>Trips</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{entries.length}</Text>
              <Text style={styles.statLabel}>Memories</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>
                {preferences?.interests?.length || 0}
              </Text>
              <Text style={styles.statLabel}>Interests</Text>
            </View>
          </View>
        </View>

        {/* Data Sections */}
        {renderMyTrips()}
        {renderTravelJournal()}
        {renderTravelPreferences()}
        {renderNotifications()}

        {/* Download Section */}
        <View style={styles.downloadSection}>
          <Text style={styles.downloadTitle}>📦 Export Project</Text>
          <Text style={styles.downloadSubtitle}>Download your project files</Text>
          <View style={styles.downloadButtons}>
            <DownloadButton type="source" style={styles.downloadButton} />
            <DownloadButton type="build" style={[styles.downloadButton, styles.buildButton]} />
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity 
          style={[styles.signOutButton, signingOut && styles.signOutButtonDisabled]} 
          onPress={handleSignOut}
          disabled={signingOut}
        >
          {signingOut ? (
            <Loader size={20} color="#ef4444" />
          ) : (
            <LogOut size={20} color="#ef4444" />
          )}
          <Text style={styles.signOutText}>
            {signingOut ? 'Signing Out...' : 'Sign Out'}
          </Text>
        </TouchableOpacity>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>TravelMate v1.0.0</Text>
          <Text style={styles.appInfoText}>Made with ❤️ for travelers</Text>
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
    color: '#e0e7ff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 64,
    height: 64,
    backgroundColor: '#f0f4ff',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginRight: 8,
  },
  editIconButton: {
    padding: 4,
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  editInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#667eea',
    paddingVertical: 4,
    marginRight: 12,
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 8,
  },
  saveButton: {
    backgroundColor: '#667eea',
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileEmail: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  sectionContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  itemsList: {
    paddingTop: 16,
  },
  tripItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tripInfo: {
    flex: 1,
  },
  tripDestination: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  tripMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripDates: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  tripAction: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
  },
  journalItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  journalInfo: {
    flex: 1,
  },
  journalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  journalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  journalDate: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
    marginRight: 8,
  },
  journalRating: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  journalPreview: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 18,
  },
  journalAction: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fef3c7',
    alignSelf: 'flex-start',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    marginRight: 4,
  },
  preferencesContent: {
    paddingTop: 16,
  },
  preferenceGroup: {
    marginBottom: 20,
  },
  preferenceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  preferenceValue: {
    fontSize: 14,
    color: '#64748b',
    textTransform: 'capitalize',
  },
  interestTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  interestTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
    textTransform: 'capitalize',
  },
  accessibilityTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  accessibilityTag: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  accessibilityTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
  },
  editPreferencesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fdf2f8',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 8,
    gap: 8,
  },
  editPreferencesText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ec4899',
  },
  notificationSettings: {
    paddingTop: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 18,
  },
  notificationToggle: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
  },
  notificationNote: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  downloadSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  downloadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  downloadSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  downloadButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  downloadButton: {
    flex: 1,
  },
  buildButton: {
    backgroundColor: '#10b981',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginTop: 32,
    borderWidth: 1,
    borderColor: '#fee2e2',
    gap: 12,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  signOutButtonDisabled: {
    opacity: 0.6,
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 32,
  },
  appInfoText: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
});
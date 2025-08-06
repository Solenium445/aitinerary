import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Menu, Plane, Map, Users, DollarSign, FileText, ChevronRight, Compass, Heart, Camera, Settings, CircleHelp as HelpCircle, Star, User } from 'lucide-react-native';

interface MenuItem {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  route: string;
}

const menuItems: MenuItem[] = [
  {
    id: 'profile',
    title: 'Profile & Account',
    description: 'Manage your account and preferences',
    icon: User,
    color: '#667eea',
    route: '/(tabs)/profile',
  },
  {
    id: 'tools',
    title: 'Offline Tools',
    description: 'Currency, maps, emergency contacts',
    icon: Map,
    color: '#8b5cf6',
    route: '/(tabs)/tools',
  },
  {
    id: 'social',
    title: 'Social & Journal',
    description: 'Community tips and travel journal',
    icon: Users,
    color: '#f97316',
    route: '/(tabs)/social',
  },
  {
    id: 'budget',
    title: 'Budget Tracker',
    description: 'Monitor your travel spending',
    icon: DollarSign,
    color: '#10b981',
    route: '/(tabs)/budget',
  },
  {
    id: 'documents',
    title: 'Travel Documents',
    description: 'Store important travel papers',
    icon: FileText,
    color: '#1e40af',
    route: '/(tabs)/documents',
  },
];

const quickActions = [
  {
    id: 'emergency',
    title: 'Emergency Contacts',
    icon: '🚨',
    action: () => router.push('/(tabs)/tools'),
  },
  {
    id: 'currency',
    title: 'Currency Converter',
    icon: '💱',
    action: () => router.push('/(tabs)/tools'),
  },
  {
    id: 'phrases',
    title: 'Local Phrases',
    icon: '🗣️',
    action: () => router.push('/(tabs)/tools'),
  },
];

export default function MenuScreen() {
  const navigateToItem = (route: string) => {
    router.push(route as any);
  };

  const renderMenuItem = (item: MenuItem) => {
    const IconComponent = item.icon;
    
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.menuItem}
        onPress={() => navigateToItem(item.route)}
      >
        <View style={[styles.menuIcon, { backgroundColor: `${item.color}20` }]}>
          <IconComponent size={24} color={item.color} />
        </View>
        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>{item.title}</Text>
          <Text style={styles.menuDescription}>{item.description}</Text>
        </View>
        <ChevronRight size={20} color="#94a3b8" />
      </TouchableOpacity>
    );
  };

  const renderQuickAction = (action: any) => (
    <TouchableOpacity
      key={action.id}
      style={styles.quickAction}
      onPress={action.action}
    >
      <Text style={styles.quickActionIcon}>{action.icon}</Text>
      <Text style={styles.quickActionTitle}>{action.title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Menu size={28} color="#ffffff" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>More Options</Text>
            <Text style={styles.headerSubtitle}>All your travel tools in one place</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚀 Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map(renderQuickAction)}
          </View>
        </View>

        {/* Main Menu Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 All Features</Text>
          <View style={styles.menuList}>
            {menuItems.map(renderMenuItem)}
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfoSection}>
          <View style={styles.appInfoCard}>
            <Compass size={24} color="#667eea" />
            <Text style={styles.appInfoTitle}>AItinerary</Text>
            <Text style={styles.appInfoDescription}>
              Your complete travel companion with AI-powered recommendations, 
              offline tools, and personalized itineraries.
            </Text>
            <View style={styles.appInfoStats}>
              <View style={styles.statItem}>
                <Star size={16} color="#fbbf24" />
                <Text style={styles.statText}>4.8/5 Rating</Text>
              </View>
              <View style={styles.statItem}>
                <Heart size={16} color="#ef4444" />
                <Text style={styles.statText}>10K+ Users</Text>
              </View>
            </View>
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 16,
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e0e7ff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: '30%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
  },
  menuList: {
    gap: 12,
  },
  menuItem: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  appInfoSection: {
    marginTop: 32,
    marginBottom: 32,
  },
  appInfoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  appInfoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 12,
    marginBottom: 8,
  },
  appInfoDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  appInfoStats: {
    flexDirection: 'row',
    gap: 24,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
});

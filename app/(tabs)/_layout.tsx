import { Tabs } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { MapPin, Calendar, MessageCircle, Menu, Plane } from 'lucide-react-native';

export default function TabLayout() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      console.log('🔄 Tab layout: No user, redirecting to welcome');
      router.replace('/(auth)/welcome');
    }
  }, [user, loading]);

  if (loading) {
    return null;
  }
  
  if (!user) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          height: 88,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Plan Trip',
          tabBarIcon: ({ size, color }) => (
            <MapPin size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="itinerary"
        options={{
          title: 'My Trip',
          tabBarIcon: ({ size, color }) => (
            <Calendar size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="advisor"
        options={{
          title: 'AI Chat',
          tabBarIcon: ({ size, color }) => (
            <MessageCircle size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Hidden Gems',
          tabBarIcon: ({ size, color }) => (
            <Menu size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="flights"
        options={{
          title: 'Flights',
          tabBarIcon: ({ size, color }) => (
            <Plane size={size} color={color} />
          ),
        }}
      />
      {/* Hide other tabs from bottom navigation */}
      <Tabs.Screen
        name="profile"
        options={{
          href: null, // This hides it from tab bar
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          href: null, // This hides it from tab bar
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          href: null, // This hides it from tab bar
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          href: null, // This hides it from tab bar
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          href: null, // This hides it from tab bar
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          href: null, // This hides it from tab bar
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null, // This hides it from tab bar
        }}
      />
      <Tabs.Screen
        name="companion"
        options={{
          href: null, // This hides it from tab bar
        }}
      />
    </Tabs>
  );
}

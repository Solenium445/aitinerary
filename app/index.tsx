import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { View, Text, StyleSheet } from 'react-native';
import { Loader } from 'lucide-react-native';

export default function IndexScreen() {
  const { user, loading } = useAuth();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    console.log('🔄 Index screen - User state:', user?.email || 'No user', 'Loading:', loading);
    
    // Only navigate if component is still mounted
    if (mountedRef.current) {
      if (user) {
        console.log('✅ User authenticated, redirecting to tabs');
        router.replace('/(tabs)');
      } else {
        console.log('❌ No user, redirecting to welcome');
        router.replace('/(auth)/welcome');
      }
    }
  }, [user, loading]);

  return (
    <View style={styles.container}>
      <Loader size={32} color="#667eea" />
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  text: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 16,
  },
});
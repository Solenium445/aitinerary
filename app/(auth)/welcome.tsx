import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MapPin, Compass, Heart, Camera } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.gradient}
        >
          {/* Hero Image */}
          <View style={styles.heroContainer}>
            <Image
              source={{ uri: 'https://images.pexels.com/photos/346885/pexels-photo-346885.jpeg?auto=compress&cs=tinysrgb&w=800' }}
              style={styles.heroImage}
            />
            <View style={styles.heroOverlay}>
              <View style={styles.logoContainer}>
                <Compass size={48} color="#ffffff" />
                <Text style={styles.logoText}>TravelMate</Text>
              </View>
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.textContent}>
              <Text style={styles.title}>Your Personal Travel Companion</Text>
              <Text style={styles.subtitle}>
                Plan amazing trips, discover hidden gems, and create unforgettable memories with AI-powered recommendations
              </Text>

              {/* Features */}
              <View style={styles.features}>
                <View style={styles.feature}>
                  <MapPin size={20} color="#ffffff" />
                  <Text style={styles.featureText}>Smart Itineraries</Text>
                </View>
                <View style={styles.feature}>
                  <Heart size={20} color="#ffffff" />
                  <Text style={styles.featureText}>Personalized Recommendations</Text>
                </View>
                <View style={styles.feature}>
                  <Camera size={20} color="#ffffff" />
                  <Text style={styles.featureText}>Travel Journal</Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => {
                  console.log('🚀 Get Started button pressed');
                  router.push('/(auth)/signup');
                }}
              >
                <Text style={styles.primaryButtonText}>Get Started</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  console.log('🔑 Login button pressed');
                  router.push('/(auth)/login');
                }}
              >
                <Text style={styles.secondaryButtonText}>I already have an account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  gradient: {
    minHeight: height,
  },
  heroContainer: {
    height: Math.min(height * 0.4, 300),
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: Math.min(28, width * 0.07),
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: Math.min(36, width * 0.08),
  },
  subtitle: {
    fontSize: Math.min(16, width * 0.04),
    color: '#e0e7ff',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  features: {
    marginBottom: 24,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  featureText: {
    fontSize: Math.min(16, width * 0.04),
    color: '#ffffff',
    marginLeft: 12,
    fontWeight: '600',
  },
  actions: {
    paddingBottom: 16,
    marginTop: 20,
  },
  primaryButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    fontSize: Math.min(18, width * 0.045),
    fontWeight: 'bold',
    color: '#667eea',
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: Math.min(16, width * 0.04),
    color: '#e0e7ff',
    fontWeight: '600',
  },
});

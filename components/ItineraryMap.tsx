import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Navigation, Clock, Star, ExternalLink, Maximize2, Minimize2, Loader } from 'lucide-react-native';

interface Activity {
  id: string;
  title: string;
  description: string;
  location: string;
  time: string;
  type: 'morning' | 'afternoon' | 'evening';
  confidence: number;
  estimated_cost_gbp?: number;
  duration_hours?: number;
}

interface MapMarker {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  time: string;
  type: 'morning' | 'afternoon' | 'evening';
  cost: number;
  location: string;
}

interface ItineraryMapProps {
  activities: Activity[];
  destination: string;
  dayNumber: number;
}

// Fallback coordinates for major cities
const CITY_COORDINATES = {
  'barcelona': { lat: 41.3851, lng: 2.1734 },
  'madrid': { lat: 40.4168, lng: -3.7038 },
  'paris': { lat: 48.8566, lng: 2.3522 },
  'london': { lat: 51.5074, lng: -0.1278 },
  'rome': { lat: 41.9028, lng: 12.4964 },
  'amsterdam': { lat: 52.3676, lng: 4.9041 },
  'berlin': { lat: 52.5200, lng: 13.4050 },
  'vienna': { lat: 48.2082, lng: 16.3738 },
  'prague': { lat: 50.0755, lng: 14.4378 },
  'lisbon': { lat: 38.7223, lng: -9.1393 },
  'florence': { lat: 43.7696, lng: 11.2558 },
  'venice': { lat: 45.4408, lng: 12.3155 },
  'milan': { lat: 45.4642, lng: 9.1900 },
  'naples': { lat: 40.8518, lng: 14.2681 },
  'seville': { lat: 37.3886, lng: -5.9823 },
  'valencia': { lat: 39.4699, lng: -0.3763 },
  'marbella': { lat: 36.5108, lng: -4.8856 },
  'malaga': { lat: 36.7213, lng: -4.4214 },
  'granada': { lat: 37.1773, lng: -3.5986 },
  'bilbao': { lat: 43.2627, lng: -2.9253 },
  'nice': { lat: 43.7102, lng: 7.2620 },
  'lyon': { lat: 45.7640, lng: 4.8357 },
  'marseille': { lat: 43.2965, lng: 5.3698 },
  'brussels': { lat: 50.8503, lng: 4.3517 },
  'antwerp': { lat: 51.2194, lng: 4.4025 },
  'zurich': { lat: 47.3769, lng: 8.5417 },
  'geneva': { lat: 46.2044, lng: 6.1432 },
  'munich': { lat: 48.1351, lng: 11.5820 },
  'hamburg': { lat: 53.5511, lng: 9.9937 },
  'cologne': { lat: 50.9375, lng: 6.9603 },
  'frankfurt': { lat: 50.1109, lng: 8.6821 },
  'dublin': { lat: 53.3498, lng: -6.2603 },
  'edinburgh': { lat: 55.9533, lng: -3.1883 },
  'glasgow': { lat: 55.8642, lng: -4.2518 },
  'manchester': { lat: 53.4808, lng: -2.2426 },
  'liverpool': { lat: 53.4084, lng: -2.9916 },
  'birmingham': { lat: 52.4862, lng: -1.8904 },
  'bristol': { lat: 51.4545, lng: -2.5879 },
  'copenhagen': { lat: 55.6761, lng: 12.5683 },
  'stockholm': { lat: 59.3293, lng: 18.0686 },
  'oslo': { lat: 59.9139, lng: 10.7522 },
  'helsinki': { lat: 60.1699, lng: 24.9384 },
  'budapest': { lat: 47.4979, lng: 19.0402 },
  'warsaw': { lat: 52.2297, lng: 21.0122 },
  'krakow': { lat: 50.0647, lng: 19.9450 },
  'athens': { lat: 37.9838, lng: 23.7275 },
  'istanbul': { lat: 41.0082, lng: 28.9784 },
  'porto': { lat: 41.1579, lng: -8.6291 },
};

export default function ItineraryMap({ activities, destination, dayNumber }: ItineraryMapProps) {
  const [mapData, setMapData] = useState<any>(null);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateMapData();
  }, [activities, destination]);

  const geocodeLocation = async (location: string, baseCoords: { lat: number; lng: number }) => {
    try {
      // First try Google Places API if available
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
      
      if (apiKey && apiKey !== 'undefined' && apiKey.trim() !== '') {
        console.log(`🗺️ Geocoding "${location}" using Google Places API`);
        
        const query = `${location}, ${destination}`;
        
        // Create timeout controller for compatibility
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`,
          { signal: controller.signal }
        );
        
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (data.status === 'OK' && data.results && data.results.length > 0) {
            const result = data.results[0];
            console.log(`✅ Found coordinates for "${location}": ${result.geometry.location.lat}, ${result.geometry.location.lng}`);
            return {
              lat: result.geometry.location.lat,
              lng: result.geometry.location.lng,
              formatted_address: result.formatted_address,
            };
          } else {
            console.log(`⚠️ No geocoding results for "${location}": ${data.status}`);
          }
        }
      }

      // Fallback: try to match location with known landmarks
      const locationLower = location.toLowerCase();
      
      // Check for specific landmarks or areas
      const landmarkCoords = getLandmarkCoordinates(locationLower, baseCoords);
      if (landmarkCoords) {
        console.log(`📍 Using landmark coordinates for "${location}"`);
        return landmarkCoords;
      }

      // Generate intelligent offset based on location type
      const offset = getLocationOffset(locationLower, baseCoords);
      console.log(`🎯 Using intelligent offset for "${location}"`);
      return offset;

    } catch (error) {
      console.error(`❌ Error geocoding "${location}":`, error);
      // Return a small random offset from base coordinates
      return {
        lat: baseCoords.lat + (Math.random() - 0.5) * 0.01,
        lng: baseCoords.lng + (Math.random() - 0.5) * 0.01,
      };
    }
  };

  const getLandmarkCoordinates = (location: string, baseCoords: { lat: number; lng: number }) => {
    // Barcelona landmarks
    if (location.includes('sagrada') || location.includes('familia')) {
      return { lat: 41.4036, lng: 2.1744 };
    }
    if (location.includes('park güell') || location.includes('park guell')) {
      return { lat: 41.4145, lng: 2.1527 };
    }
    if (location.includes('gothic quarter') || location.includes('barrio gótico')) {
      return { lat: 41.3833, lng: 2.1761 };
    }
    if (location.includes('las ramblas') || location.includes('la rambla')) {
      return { lat: 41.3781, lng: 2.1701 };
    }
    if (location.includes('casa batlló') || location.includes('batllo')) {
      return { lat: 41.3916, lng: 2.1649 };
    }
    if (location.includes('casa milà') || location.includes('la pedrera')) {
      return { lat: 41.3954, lng: 2.1619 };
    }
    if (location.includes('barceloneta')) {
      return { lat: 41.3755, lng: 2.1901 };
    }
    if (location.includes('camp nou')) {
      return { lat: 41.3809, lng: 2.1228 };
    }

    // Madrid landmarks
    if (location.includes('prado') || location.includes('museo del prado')) {
      return { lat: 40.4138, lng: -3.6921 };
    }
    if (location.includes('retiro') || location.includes('parque del retiro')) {
      return { lat: 40.4153, lng: -3.6844 };
    }
    if (location.includes('puerta del sol')) {
      return { lat: 40.4168, lng: -3.7038 };
    }
    if (location.includes('plaza mayor')) {
      return { lat: 40.4155, lng: -3.7074 };
    }
    if (location.includes('royal palace') || location.includes('palacio real')) {
      return { lat: 40.4179, lng: -3.7143 };
    }

    // Paris landmarks
    if (location.includes('eiffel') || location.includes('tour eiffel')) {
      return { lat: 48.8584, lng: 2.2945 };
    }
    if (location.includes('louvre')) {
      return { lat: 48.8606, lng: 2.3376 };
    }
    if (location.includes('notre dame') || location.includes('notre-dame')) {
      return { lat: 48.8530, lng: 2.3499 };
    }
    if (location.includes('champs-élysées') || location.includes('champs elysees')) {
      return { lat: 48.8698, lng: 2.3076 };
    }
    if (location.includes('arc de triomphe')) {
      return { lat: 48.8738, lng: 2.2950 };
    }
    if (location.includes('montmartre') || location.includes('sacré-cœur')) {
      return { lat: 48.8867, lng: 2.3431 };
    }

    // Rome landmarks
    if (location.includes('colosseum') || location.includes('colosseo')) {
      return { lat: 41.8902, lng: 12.4922 };
    }
    if (location.includes('vatican') || location.includes('st peter')) {
      return { lat: 41.9029, lng: 12.4534 };
    }
    if (location.includes('trevi fountain') || location.includes('fontana di trevi')) {
      return { lat: 41.9009, lng: 12.4833 };
    }
    if (location.includes('spanish steps') || location.includes('scalinata')) {
      return { lat: 41.9058, lng: 12.4823 };
    }
    if (location.includes('pantheon')) {
      return { lat: 41.8986, lng: 12.4769 };
    }

    // London landmarks
    if (location.includes('big ben') || location.includes('westminster')) {
      return { lat: 51.4994, lng: -0.1245 };
    }
    if (location.includes('tower bridge')) {
      return { lat: 51.5055, lng: -0.0754 };
    }
    if (location.includes('london eye')) {
      return { lat: 51.5033, lng: -0.1196 };
    }
    if (location.includes('buckingham palace')) {
      return { lat: 51.5014, lng: -0.1419 };
    }
    if (location.includes('british museum')) {
      return { lat: 51.5194, lng: -0.1270 };
    }
    if (location.includes('tate modern')) {
      return { lat: 51.5076, lng: -0.0994 };
    }

    return null;
  };

  const getLocationOffset = (location: string, baseCoords: { lat: number; lng: number }) => {
    // Generate offsets based on location type and common patterns
    let latOffset = 0;
    let lngOffset = 0;

    // Historic/Old Town areas - usually central
    if (location.includes('historic') || location.includes('old town') || location.includes('centro') || 
        location.includes('centre') || location.includes('downtown') || location.includes('city center')) {
      latOffset = (Math.random() - 0.5) * 0.005; // Very close to center
      lngOffset = (Math.random() - 0.5) * 0.005;
    }
    // Markets - usually central but slightly offset
    else if (location.includes('market') || location.includes('mercado') || location.includes('marché')) {
      latOffset = (Math.random() - 0.5) * 0.008;
      lngOffset = (Math.random() - 0.5) * 0.008;
    }
    // Beaches - usually south/east of city center
    else if (location.includes('beach') || location.includes('playa') || location.includes('plage')) {
      latOffset = -0.01 + Math.random() * 0.005; // Slightly south
      lngOffset = 0.01 + Math.random() * 0.005;  // Slightly east
    }
    // Parks - can be anywhere but usually larger offsets
    else if (location.includes('park') || location.includes('parque') || location.includes('parc') || 
             location.includes('garden') || location.includes('jardín')) {
      latOffset = (Math.random() - 0.5) * 0.015;
      lngOffset = (Math.random() - 0.5) * 0.015;
    }
    // Museums - usually in cultural districts
    else if (location.includes('museum') || location.includes('museo') || location.includes('musée') || 
             location.includes('gallery') || location.includes('galería')) {
      latOffset = (Math.random() - 0.5) * 0.01;
      lngOffset = (Math.random() - 0.5) * 0.01;
    }
    // Restaurants/Cafes - distributed throughout
    else if (location.includes('restaurant') || location.includes('café') || location.includes('bar') || 
             location.includes('tapas') || location.includes('bistro')) {
      latOffset = (Math.random() - 0.5) * 0.012;
      lngOffset = (Math.random() - 0.5) * 0.012;
    }
    // Viewpoints - usually on hills/elevated areas
    else if (location.includes('viewpoint') || location.includes('mirador') || location.includes('overlook') || 
             location.includes('hill') || location.includes('tower')) {
      latOffset = 0.005 + Math.random() * 0.01; // Slightly north (hills often north)
      lngOffset = (Math.random() - 0.5) * 0.01;
    }
    // Shopping areas - usually central
    else if (location.includes('shopping') || location.includes('mall') || location.includes('boutique') || 
             location.includes('store') || location.includes('tienda')) {
      latOffset = (Math.random() - 0.5) * 0.008;
      lngOffset = (Math.random() - 0.5) * 0.008;
    }
    // Default for other locations
    else {
      latOffset = (Math.random() - 0.5) * 0.01;
      lngOffset = (Math.random() - 0.5) * 0.01;
    }

    return {
      lat: baseCoords.lat + latOffset,
      lng: baseCoords.lng + lngOffset,
    };
  };

  const generateMapData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get base coordinates for the destination
      const destKey = destination.toLowerCase().split(',')[0].trim().replace(/\s+/g, '');
      let baseCoords = CITY_COORDINATES[destKey];
      
      // If no exact match, try partial matching
      if (!baseCoords) {
        for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
          if (destKey.includes(key) || key.includes(destKey)) {
            baseCoords = coords;
            break;
          }
        }
      }
      
      // Final fallback to Barcelona
      if (!baseCoords) {
        console.log(`⚠️ No coordinates found for "${destination}", using Barcelona as fallback`);
        baseCoords = CITY_COORDINATES['barcelona'];
      }

      console.log(`🗺️ Base coordinates for ${destination}: ${baseCoords.lat}, ${baseCoords.lng}`);

      // Geocode each activity location
      const markers: MapMarker[] = [];
      
      for (let i = 0; i < activities.length; i++) {
        const activity = activities[i];
        console.log(`📍 Processing activity ${i + 1}: "${activity.title}" at "${activity.location}"`);
        
        try {
          const coords = await geocodeLocation(activity.location, baseCoords);
          
          markers.push({
            id: activity.id,
            title: activity.title,
            description: activity.description,
            latitude: coords.lat,
            longitude: coords.lng,
            time: activity.time,
            type: activity.type,
            cost: activity.estimated_cost_gbp || 0,
            location: activity.location,
          });
          
          console.log(`✅ Added marker for "${activity.title}": ${coords.lat}, ${coords.lng}`);
        } catch (error) {
          console.error(`❌ Failed to geocode "${activity.location}":`, error);
          // Add with base coordinates as fallback
          markers.push({
            id: activity.id,
            title: activity.title,
            description: activity.description,
            latitude: baseCoords.lat + (Math.random() - 0.5) * 0.01,
            longitude: baseCoords.lng + (Math.random() - 0.5) * 0.01,
            time: activity.time,
            type: activity.type,
            cost: activity.estimated_cost_gbp || 0,
            location: activity.location,
          });
        }
      }

      setMapData({
        center: baseCoords,
        markers,
        destination,
      });
      
      console.log(`🗺️ Generated map with ${markers.length} markers for ${destination}`);
      setLoading(false);
    } catch (error) {
      console.error('❌ Error generating map data:', error);
      setError('Failed to load map data');
      setLoading(false);
    }
  };

  const getMarkerColor = (type: string) => {
    switch (type) {
      case 'morning':
        return '#fbbf24'; // Amber
      case 'afternoon':
        return '#f97316'; // Orange
      case 'evening':
        return '#8b5cf6'; // Purple
      default:
        return '#64748b'; // Gray
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'morning':
        return '🌅';
      case 'afternoon':
        return '☀️';
      case 'evening':
        return '🌙';
      default:
        return '📍';
    }
  };

  const openInMaps = (marker: MapMarker) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${marker.latitude},${marker.longitude}`,
      android: `geo:0,0?q=${marker.latitude},${marker.longitude}`,
      web: `https://www.google.com/maps/search/?api=1&query=${marker.latitude},${marker.longitude}`,
    });
    
    if (url) {
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        // For mobile, you'd use Linking.openURL(url)
        console.log('Open in maps:', url);
      }
    }
  };

  const renderWebMap = () => {
    if (!mapData) return null;

    const { center, markers } = mapData;

    return (
      <View style={styles.webMapContainer}>
        {/* Custom map overlay with markers */}
        <View style={styles.mapOverlay}>
          <View style={styles.mapHeader}>
            <View style={styles.mapTitleContainer}>
              <MapPin size={20} color="#ffffff" />
              <Text style={styles.mapTitle}>Day {dayNumber} - {destination}</Text>
            </View>
            <TouchableOpacity
              style={styles.fullscreenButton}
              onPress={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? (
                <Minimize2 size={20} color="#ffffff" />
              ) : (
                <Maximize2 size={20} color="#ffffff" />
              )}
            </TouchableOpacity>
          </View>
          
          {/* Activity markers list */}
          <View style={styles.markersContainer}>
            {markers.map((marker, index) => (
              <TouchableOpacity
                key={marker.id}
                style={[
                  styles.markerItem,
                  selectedMarker?.id === marker.id && styles.selectedMarkerItem,
                ]}
                onPress={() => setSelectedMarker(selectedMarker?.id === marker.id ? null : marker)}
              >
                <View style={[styles.markerIcon, { backgroundColor: getMarkerColor(marker.type) }]}>
                  <Text style={styles.markerNumber}>{index + 1}</Text>
                </View>
                <View style={styles.markerInfo}>
                  <Text style={styles.markerTitle}>{marker.title}</Text>
                  <View style={styles.markerMeta}>
                    <Clock size={12} color="#64748b" />
                    <Text style={styles.markerTime}>{marker.time}</Text>
                    <Text style={styles.markerType}>{getTypeIcon(marker.type)}</Text>
                  </View>
                  <Text style={styles.markerLocation}>{marker.location}</Text>
                </View>
                <TouchableOpacity
                  style={styles.directionsButton}
                  onPress={() => openInMaps(marker)}
                >
                  <Navigation size={16} color="#3b82f6" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>

          {/* Selected marker details */}
          {selectedMarker && (
            <View style={styles.markerDetails}>
              <Text style={styles.markerDetailsTitle}>{selectedMarker.title}</Text>
              <Text style={styles.markerDetailsDescription}>{selectedMarker.description}</Text>
              <View style={styles.markerDetailsFooter}>
                <View style={styles.markerDetailsMeta}>
                  <Clock size={14} color="#64748b" />
                  <Text style={styles.markerDetailsTime}>{selectedMarker.time}</Text>
                  {selectedMarker.cost > 0 && (
                    <>
                      <Text style={styles.markerDetailsSeparator}>•</Text>
                      <Text style={styles.markerDetailsCost}>£{selectedMarker.cost}</Text>
                    </>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.openMapsButton}
                  onPress={() => openInMaps(selectedMarker)}
                >
                  <ExternalLink size={14} color="#ffffff" />
                  <Text style={styles.openMapsText}>Open in Maps</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.coordinatesInfo}>
                <Text style={styles.coordinatesText}>
                  📍 {selectedMarker.latitude.toFixed(4)}, {selectedMarker.longitude.toFixed(4)}
                </Text>
              </View>
            </View>
          )}

          {/* Map integration hint */}
          <View style={styles.mapIntegrationHint}>
            <Text style={styles.hintText}>
              💡 Tap "Open in Maps" to navigate with your preferred map app
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, isFullscreen && styles.fullscreenContainer]}>
        <View style={styles.loadingContainer}>
          <Loader size={24} color="#8b5cf6" />
          <Text style={styles.loadingText}>Loading map locations...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, isFullscreen && styles.fullscreenContainer]}>
        <View style={styles.errorContainer}>
          <MapPin size={24} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={generateMapData}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!mapData || !mapData.markers || mapData.markers.length === 0) {
    return (
      <View style={[styles.container, isFullscreen && styles.fullscreenContainer]}>
        <View style={styles.emptyContainer}>
          <MapPin size={24} color="#64748b" />
          <Text style={styles.emptyText}>No locations to display</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, isFullscreen && styles.fullscreenContainer]}>
      {renderWebMap()}
    </View>
  );
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: 16,
    minHeight: 300,
  },
  fullscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    borderRadius: 0,
    minHeight: screenHeight,
  },
  webMapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapOverlay: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#8b5cf6',
  },
  mapTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 8,
  },
  fullscreenButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  markersContainer: {
    flex: 1,
    padding: 16,
  },
  markerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectedMarkerItem: {
    borderColor: '#8b5cf6',
    backgroundColor: '#faf5ff',
  },
  markerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  markerNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  markerInfo: {
    flex: 1,
  },
  markerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  markerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  markerTime: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
    marginRight: 8,
  },
  markerType: {
    fontSize: 14,
  },
  markerLocation: {
    fontSize: 11,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  directionsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
  },
  markerDetails: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  markerDetailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  markerDetailsDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 12,
  },
  markerDetailsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  markerDetailsMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  markerDetailsTime: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  markerDetailsSeparator: {
    fontSize: 12,
    color: '#64748b',
    marginHorizontal: 8,
  },
  markerDetailsCost: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  openMapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  openMapsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 4,
  },
  coordinatesInfo: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 8,
  },
  coordinatesText: {
    fontSize: 11,
    color: '#64748b',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  mapIntegrationHint: {
    backgroundColor: '#eff6ff',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#bfdbfe',
  },
  hintText: {
    fontSize: 12,
    color: '#1e40af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    marginTop: 8,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 8,
  },
});

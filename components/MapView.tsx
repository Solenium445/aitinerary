import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { MapPin, Navigation } from 'lucide-react-native';

interface MapMarker {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  type: 'food' | 'activity' | 'accommodation';
}

interface TravelMapProps {
  location?: string;
  markers?: MapMarker[];
  style?: any;
}

export default function TravelMap({ location = 'Barcelona', markers = [], style }: TravelMapProps) {
  const [mapData, setMapData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMapData();
  }, [location]);

  const fetchMapData = async () => {
    try {
      const response = await fetch(`/map?location=${encodeURIComponent(location)}`);
      if (response.ok) {
        const data = await response.json();
        setMapData(data);
      } else {
        // Fallback to default location
        setMapData({
          center: { latitude: 41.3851, longitude: 2.1734 },
          markers: [],
        });
      }
    } catch (error) {
      console.error('Error fetching map data:', error);
      Alert.alert('Error', 'Unable to load map data');
    } finally {
      setLoading(false);
    }
  };

  const getMarkerColor = (type: string) => {
    switch (type) {
      case 'food':
        return '#f59e0b';
      case 'activity':
        return '#3b82f6';
      case 'accommodation':
        return '#10b981';
      default:
        return '#64748b';
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, style, styles.loadingContainer]}>
        <Navigation size={24} color="#64748b" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  if (!mapData) {
    return (
      <View style={[styles.container, style, styles.errorContainer]}>
        <MapPin size={24} color="#dc2626" />
        <Text style={styles.errorText}>Unable to load map</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: mapData.center.latitude,
          longitude: mapData.center.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
      >
        {mapData.markers.map((marker: MapMarker) => (
          <Marker
            key={marker.id}
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
            title={marker.title}
            description={marker.description}
            pinColor={getMarkerColor(marker.type)}
          />
        ))}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
            title={marker.title}
            description={marker.description}
            pinColor={getMarkerColor(marker.type)}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
  },
  map: {
    flex: 1,
    minHeight: 200,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 8,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    marginTop: 8,
  },
});
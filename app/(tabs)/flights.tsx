import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plane, Search, MapPin, Clock, Wifi, WifiOff, Car, Accessibility, Info, ExternalLink, Globe, Navigation, Phone, Building } from 'lucide-react-native';

interface UKAirport {
  name: string;
  iata: string;
  icao: string;
  city: string;
  region: string;
  lat: number;
  lon: number;
  website: string;
  wifi: {
    available: boolean;
    free: boolean;
    details: string;
  };
  accessibility: {
    wheelchair_accessible: boolean;
    assistance_available: boolean;
    details: string;
  };
  parking: {
    available: boolean;
    cost_per_day: string;
    booking_required: boolean;
    details: string;
  };
  taxi_services: string[];
  car_hire: string[];
  terminal_count: number;
}

const ukAirports: UKAirport[] = [
  {
    name: "London Heathrow Airport",
    iata: "LHR",
    icao: "EGLL",
    city: "London",
    region: "Greater London",
    lat: 51.4700,
    lon: -0.4543,
    website: "https://www.heathrow.com",
    wifi: {
      available: true,
      free: true,
      details: "Free WiFi throughout all terminals - HeathrowWiFi network"
    },
    accessibility: {
      wheelchair_accessible: true,
      assistance_available: true,
      details: "Full wheelchair access, assistance dogs welcome, special assistance booking available"
    },
    parking: {
      available: true,
      cost_per_day: "£25-45",
      booking_required: true,
      details: "Multiple car parks, pre-booking recommended for better rates"
    },
    taxi_services: ["Heathrow Taxis", "Uber", "Addison Lee", "Black Cabs"],
    car_hire: ["Hertz", "Avis", "Enterprise", "Budget", "Europcar", "Sixt"],
    terminal_count: 5
  },
  {
    name: "London Gatwick Airport",
    iata: "LGW",
    icao: "EGKK",
    city: "London",
    region: "West Sussex",
    lat: 51.1481,
    lon: -0.1903,
    website: "https://www.gatwickairport.com",
    wifi: {
      available: true,
      free: true,
      details: "Free WiFi in both terminals - Gatwick_Free_WiFi"
    },
    accessibility: {
      wheelchair_accessible: true,
      assistance_available: true,
      details: "Wheelchair accessible throughout, assistance available 24/7"
    },
    parking: {
      available: true,
      cost_per_day: "£15-35",
      booking_required: false,
      details: "Short and long stay options, better rates online"
    },
    taxi_services: ["Gatwick Taxis", "Uber", "Checker Cars"],
    car_hire: ["Hertz", "Avis", "Budget", "Enterprise", "Europcar"],
    terminal_count: 2
  },
  {
    name: "Manchester Airport",
    iata: "MAN",
    icao: "EGCC",
    city: "Manchester",
    region: "Greater Manchester",
    lat: 53.3537,
    lon: -2.2750,
    website: "https://www.manchesterairport.co.uk",
    wifi: {
      available: true,
      free: true,
      details: "Free WiFi across all 3 terminals - Manchester_Airport_WiFi"
    },
    accessibility: {
      wheelchair_accessible: true,
      assistance_available: true,
      details: "Full accessibility, hearing loops, assistance booking required"
    },
    parking: {
      available: true,
      cost_per_day: "£12-28",
      booking_required: false,
      details: "Multiple parking options, shuttle buses to terminals"
    },
    taxi_services: ["Manchester Airport Taxis", "Uber", "Street Cars"],
    car_hire: ["Hertz", "Avis", "Enterprise", "Budget", "Sixt"],
    terminal_count: 3
  },
  {
    name: "Birmingham Airport",
    iata: "BHX",
    icao: "EGBB",
    city: "Birmingham",
    region: "West Midlands",
    lat: 52.4539,
    lon: -1.7480,
    website: "https://www.birminghamairport.co.uk",
    wifi: {
      available: true,
      free: true,
      details: "Free WiFi throughout terminal - BHX_Free_WiFi"
    },
    accessibility: {
      wheelchair_accessible: true,
      assistance_available: true,
      details: "Wheelchair accessible, assistance dogs welcome, special help available"
    },
    parking: {
      available: true,
      cost_per_day: "£10-25",
      booking_required: false,
      details: "Short and long stay parking, pre-book for discounts"
    },
    taxi_services: ["Birmingham Airport Taxis", "Uber", "A2B Radio Cars"],
    car_hire: ["Hertz", "Avis", "Enterprise", "Budget"],
    terminal_count: 1
  },
  {
    name: "Edinburgh Airport",
    iata: "EDI",
    icao: "EGPH",
    city: "Edinburgh",
    region: "Scotland",
    lat: 55.9500,
    lon: -3.3725,
    website: "https://www.edinburghairport.com",
    wifi: {
      available: true,
      free: true,
      details: "Free WiFi throughout - Edinburgh_Airport_WiFi"
    },
    accessibility: {
      wheelchair_accessible: true,
      assistance_available: true,
      details: "Full wheelchair access, assistance available, accessible toilets"
    },
    parking: {
      available: true,
      cost_per_day: "£8-22",
      booking_required: false,
      details: "Multiple parking zones, book online for better rates"
    },
    taxi_services: ["Edinburgh Airport Taxis", "Uber", "Central Taxis"],
    car_hire: ["Hertz", "Avis", "Enterprise", "Budget", "Europcar"],
    terminal_count: 1
  },
  {
    name: "Glasgow Airport",
    iata: "GLA",
    icao: "EGPF",
    city: "Glasgow",
    region: "Scotland",
    lat: 55.8719,
    lon: -4.4331,
    website: "https://www.glasgowairport.com",
    wifi: {
      available: true,
      free: true,
      details: "Free WiFi available - Glasgow_Airport_WiFi"
    },
    accessibility: {
      wheelchair_accessible: true,
      assistance_available: true,
      details: "Wheelchair accessible, assistance booking available"
    },
    parking: {
      available: true,
      cost_per_day: "£7-20",
      booking_required: false,
      details: "Short and long stay options, online booking discounts"
    },
    taxi_services: ["Glasgow Airport Taxis", "Uber", "TOA Taxis"],
    car_hire: ["Hertz", "Avis", "Enterprise", "Budget"],
    terminal_count: 1
  },
  {
    name: "Bristol Airport",
    iata: "BRS",
    icao: "EGGD",
    city: "Bristol",
    region: "Somerset",
    lat: 51.3827,
    lon: -2.7191,
    website: "https://www.bristolairport.co.uk",
    wifi: {
      available: true,
      free: true,
      details: "Free WiFi throughout terminal - Bristol_Airport_WiFi"
    },
    accessibility: {
      wheelchair_accessible: true,
      assistance_available: true,
      details: "Wheelchair accessible, assistance available with advance booking"
    },
    parking: {
      available: true,
      cost_per_day: "£6-18",
      booking_required: false,
      details: "Silver Zone and Purple Zone parking, shuttle service"
    },
    taxi_services: ["Bristol Airport Taxis", "Uber", "A1 Taxis"],
    car_hire: ["Hertz", "Avis", "Enterprise", "Budget"],
    terminal_count: 1
  },
  {
    name: "Newcastle Airport",
    iata: "NCL",
    icao: "EGNT",
    city: "Newcastle",
    region: "Tyne and Wear",
    lat: 55.0375,
    lon: -1.6917,
    website: "https://www.newcastleairport.com",
    wifi: {
      available: true,
      free: true,
      details: "Free WiFi throughout - Newcastle_Airport_WiFi"
    },
    accessibility: {
      wheelchair_accessible: true,
      assistance_available: true,
      details: "Full accessibility, assistance dogs welcome"
    },
    parking: {
      available: true,
      cost_per_day: "£5-15",
      booking_required: false,
      details: "Short and long stay parking, good value rates"
    },
    taxi_services: ["Newcastle Airport Taxis", "Uber", "Noda Taxis"],
    car_hire: ["Hertz", "Avis", "Enterprise", "Budget"],
    terminal_count: 1
  },
  {
    name: "Liverpool John Lennon Airport",
    iata: "LPL",
    icao: "EGGP",
    city: "Liverpool",
    region: "Merseyside",
    lat: 53.3336,
    lon: -2.8497,
    website: "https://www.liverpoolairport.com",
    wifi: {
      available: true,
      free: true,
      details: "Free WiFi available - Liverpool_Airport_WiFi"
    },
    accessibility: {
      wheelchair_accessible: true,
      assistance_available: true,
      details: "Wheelchair accessible, assistance available"
    },
    parking: {
      available: true,
      cost_per_day: "£4-12",
      booking_required: false,
      details: "Affordable parking rates, pre-book for discounts"
    },
    taxi_services: ["Liverpool Airport Taxis", "Uber", "Delta Taxis"],
    car_hire: ["Hertz", "Avis", "Enterprise"],
    terminal_count: 1
  },
  {
    name: "Leeds Bradford Airport",
    iata: "LBA",
    icao: "EGNM",
    city: "Leeds",
    region: "West Yorkshire",
    lat: 53.8659,
    lon: -1.6606,
    website: "https://www.leedsbradfordairport.co.uk",
    wifi: {
      available: true,
      free: true,
      details: "Free WiFi throughout terminal"
    },
    accessibility: {
      wheelchair_accessible: true,
      assistance_available: true,
      details: "Wheelchair accessible, assistance available with booking"
    },
    parking: {
      available: true,
      cost_per_day: "£5-14",
      booking_required: false,
      details: "Good value parking, shuttle to terminal"
    },
    taxi_services: ["Leeds Bradford Taxis", "Uber", "Amber Cars"],
    car_hire: ["Hertz", "Avis", "Enterprise"],
    terminal_count: 1
  },
  {
    name: "Belfast International Airport",
    iata: "BFS",
    icao: "EGAA",
    city: "Belfast",
    region: "Northern Ireland",
    lat: 54.6575,
    lon: -6.2158,
    website: "https://www.belfastairport.com",
    wifi: {
      available: true,
      free: true,
      details: "Free WiFi throughout - Belfast_Airport_WiFi"
    },
    accessibility: {
      wheelchair_accessible: true,
      assistance_available: true,
      details: "Full wheelchair access, assistance available"
    },
    parking: {
      available: true,
      cost_per_day: "£4-12",
      booking_required: false,
      details: "Multiple parking options, good value rates"
    },
    taxi_services: ["Belfast Airport Taxis", "Uber", "Value Cabs"],
    car_hire: ["Hertz", "Avis", "Enterprise", "Budget"],
    terminal_count: 1
  }
];

export default function FlightsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UKAirport[]>(ukAirports);
  const [selectedAirport, setSelectedAirport] = useState<UKAirport | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults(ukAirports);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = ukAirports.filter(airport =>
      airport.name.toLowerCase().includes(query) ||
      airport.iata.toLowerCase().includes(query) ||
      airport.icao.toLowerCase().includes(query) ||
      airport.city.toLowerCase().includes(query) ||
      airport.region.toLowerCase().includes(query)
    );

    setSearchResults(filtered);
  };

  const openWebsite = (url: string) => {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
  };

  const openMaps = (airport: UKAirport) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${airport.lat},${airport.lon}`;
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
  };

  const renderAirportCard = (airport: UKAirport) => (
    <View key={airport.iata} style={styles.airportCard}>
      <View style={styles.airportHeader}>
        <View style={styles.airportCodes}>
          <Text style={styles.airportIata}>{airport.iata}</Text>
          <Text style={styles.airportIcao}>{airport.icao}</Text>
        </View>
        <View style={styles.locationInfo}>
          <MapPin size={16} color="#64748b" />
          <Text style={styles.locationText}>{airport.city}, {airport.region}</Text>
        </View>
      </View>
      
      <Text style={styles.airportName}>{airport.name}</Text>
      
      {/* WiFi Info */}
      <View style={styles.infoSection}>
        <View style={styles.infoHeader}>
          {airport.wifi.available ? (
            <Wifi size={16} color="#10b981" />
          ) : (
            <WifiOff size={16} color="#ef4444" />
          )}
          <Text style={styles.infoTitle}>WiFi</Text>
        </View>
        <Text style={styles.infoText}>
          {airport.wifi.free ? '✅ Free WiFi' : '❌ Paid WiFi'} - {airport.wifi.details}
        </Text>
      </View>

      {/* Accessibility Info */}
      <View style={styles.infoSection}>
        <View style={styles.infoHeader}>
          <Accessibility size={16} color="#3b82f6" />
          <Text style={styles.infoTitle}>Accessibility</Text>
        </View>
        <Text style={styles.infoText}>
          {airport.accessibility.wheelchair_accessible ? '♿ Wheelchair accessible' : '❌ Limited access'} - {airport.accessibility.details}
        </Text>
      </View>

      {/* Parking Info */}
      <View style={styles.infoSection}>
        <View style={styles.infoHeader}>
          <Car size={16} color="#f59e0b" />
          <Text style={styles.infoTitle}>Parking</Text>
        </View>
        <Text style={styles.infoText}>
          {airport.parking.cost_per_day} per day - {airport.parking.details}
        </Text>
      </View>

      {/* Car Hire */}
      <View style={styles.infoSection}>
        <View style={styles.infoHeader}>
          <Car size={16} color="#8b5cf6" />
          <Text style={styles.infoTitle}>Car Hire</Text>
        </View>
        <Text style={styles.infoText}>
          {airport.car_hire.join(', ')}
        </Text>
      </View>

      {/* Taxi Services */}
      <View style={styles.infoSection}>
        <View style={styles.infoHeader}>
          <Phone size={16} color="#ec4899" />
          <Text style={styles.infoTitle}>Taxi Services</Text>
        </View>
        <Text style={styles.infoText}>
          {airport.taxi_services.join(', ')}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => openWebsite(airport.website)}
        >
          <Globe size={16} color="#3b82f6" />
          <Text style={styles.actionText}>Website</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => openMaps(airport)}
        >
          <Navigation size={16} color="#10b981" />
          <Text style={styles.actionText}>Directions</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setSelectedAirport(airport)}
        >
          <Info size={16} color="#f59e0b" />
          <Text style={styles.actionText}>Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0ea5e9', '0284c7']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>UK Airport Guide</Text>
        <Text style={styles.headerSubtitle}>Complete airport information & services</Text>
      </LinearGradient>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search UK airports by name, code, or city..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            placeholderTextColor="#94a3b8"
          />
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Search size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {searchResults.length} UK Airport{searchResults.length !== 1 ? 's' : ''} Found
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {searchResults.map(renderAirportCard)}
      </ScrollView>

      {/* Airport Details Modal */}
      {selectedAirport && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedAirport.name}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedAirport(null)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalSection}>📍 Location: {selectedAirport.city}, {selectedAirport.region}</Text>
              <Text style={styles.modalSection}>🏢 Terminals: {selectedAirport.terminal_count}</Text>
              <Text style={styles.modalSection}>📶 WiFi: {selectedAirport.wifi.details}</Text>
              <Text style={styles.modalSection}>♿ Accessibility: {selectedAirport.accessibility.details}</Text>
              <Text style={styles.modalSection}>🚗 Parking: {selectedAirport.parking.details}</Text>
              <Text style={styles.modalSection}>🚕 Taxis: {selectedAirport.taxi_services.join(', ')}</Text>
              <Text style={styles.modalSection}>🚙 Car Hire: {selectedAirport.car_hire.join(', ')}</Text>
            </ScrollView>
          </View>
        </View>
      )}
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
    color: '#bae6fd',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    marginLeft: 12,
    paddingVertical: 12,
  },
  searchButton: {
    backgroundColor: '#0ea5e9',
    borderRadius: 12,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultsHeader: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  resultsCount: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  airportCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  airportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  airportCodes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  airportIata: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  airportIcao: {
    fontSize: 14,
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 4,
  },
  airportName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  infoSection: {
    marginBottom: 12,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginLeft: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#64748b',
  },
  modalBody: {
    maxHeight: 300,
  },
  modalSection: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 12,
  },
});

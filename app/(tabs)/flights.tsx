import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plane, Search, MapPin, Clock, Globe, Building, ExternalLink } from 'lucide-react-native';

interface Airport {
  name: string;
  iata_code: string;
  icao_code: string;
  country: string;
  city: string;
  lat: number;
  lon: number;
  timezone: string;
  website?: string;
}

const majorAirports: Airport[] = [
  {
    name: "London Heathrow Airport",
    iata_code: "LHR",
    icao_code: "EGLL",
    country: "United Kingdom",
    city: "London",
    lat: 51.4700,
    lon: -0.4543,
    timezone: "Europe/London",
    website: "https://www.heathrow.com"
  },
  {
    name: "London Gatwick Airport",
    iata_code: "LGW",
    icao_code: "EGKK",
    country: "United Kingdom",
    city: "London",
    lat: 51.1481,
    lon: -0.1903,
    timezone: "Europe/London",
    website: "https://www.gatwickairport.com"
  },
  {
    name: "Manchester Airport",
    iata_code: "MAN",
    icao_code: "EGCC",
    country: "United Kingdom",
    city: "Manchester",
    lat: 53.3537,
    lon: -2.2750,
    timezone: "Europe/London",
    website: "https://www.manchesterairport.co.uk"
  },
  {
    name: "Charles de Gaulle Airport",
    iata_code: "CDG",
    icao_code: "LFPG",
    country: "France",
    city: "Paris",
    lat: 49.0097,
    lon: 2.5479,
    timezone: "Europe/Paris",
    website: "https://www.parisaeroport.fr"
  },
  {
    name: "Amsterdam Schiphol Airport",
    iata_code: "AMS",
    icao_code: "EHAM",
    country: "Netherlands",
    city: "Amsterdam",
    lat: 52.3086,
    lon: 4.7639,
    timezone: "Europe/Amsterdam",
    website: "https://www.schiphol.nl"
  },
  {
    name: "Frankfurt Airport",
    iata_code: "FRA",
    icao_code: "EDDF",
    country: "Germany",
    city: "Frankfurt",
    lat: 50.0333,
    lon: 8.5706,
    timezone: "Europe/Berlin",
    website: "https://www.frankfurt-airport.com"
  },
  {
    name: "Barcelona-El Prat Airport",
    iata_code: "BCN",
    icao_code: "LEBL",
    country: "Spain",
    city: "Barcelona",
    lat: 41.2971,
    lon: 2.0785,
    timezone: "Europe/Madrid",
    website: "https://www.aena.es"
  },
  {
    name: "Madrid-Barajas Airport",
    iata_code: "MAD",
    icao_code: "LEMD",
    country: "Spain",
    city: "Madrid",
    lat: 40.4719,
    lon: -3.5626,
    timezone: "Europe/Madrid",
    website: "https://www.aena.es"
  },
  {
    name: "Rome Fiumicino Airport",
    iata_code: "FCO",
    icao_code: "LIRF",
    country: "Italy",
    city: "Rome",
    lat: 41.8003,
    lon: 12.2389,
    timezone: "Europe/Rome",
    website: "https://www.adr.it"
  },
  {
    name: "Milan Malpensa Airport",
    iata_code: "MXP",
    icao_code: "LIMC",
    country: "Italy",
    city: "Milan",
    lat: 45.6306,
    lon: 8.7281,
    timezone: "Europe/Rome",
    website: "https://www.milanomalpensa.eu"
  },
  {
    name: "Zurich Airport",
    iata_code: "ZUR",
    icao_code: "LSZH",
    country: "Switzerland",
    city: "Zurich",
    lat: 47.4647,
    lon: 8.5492,
    timezone: "Europe/Zurich",
    website: "https://www.flughafen-zuerich.ch"
  },
  {
    name: "Vienna International Airport",
    iata_code: "VIE",
    icao_code: "LOWW",
    country: "Austria",
    city: "Vienna",
    lat: 48.1103,
    lon: 16.5697,
    timezone: "Europe/Vienna",
    website: "https://www.viennaairport.com"
  },
  {
    name: "Brussels Airport",
    iata_code: "BRU",
    icao_code: "EBBR",
    country: "Belgium",
    city: "Brussels",
    lat: 50.9014,
    lon: 4.4844,
    timezone: "Europe/Brussels",
    website: "https://www.brusselsairport.be"
  },
  {
    name: "Copenhagen Airport",
    iata_code: "CPH",
    icao_code: "EKCH",
    country: "Denmark",
    city: "Copenhagen",
    lat: 55.6181,
    lon: 12.6561,
    timezone: "Europe/Copenhagen",
    website: "https://www.cph.dk"
  },
  {
    name: "Stockholm Arlanda Airport",
    iata_code: "ARN",
    icao_code: "ESSA",
    country: "Sweden",
    city: "Stockholm",
    lat: 59.6519,
    lon: 17.9186,
    timezone: "Europe/Stockholm",
    website: "https://www.swedavia.com"
  },
  {
    name: "Oslo Airport",
    iata_code: "OSL",
    icao_code: "ENGM",
    country: "Norway",
    city: "Oslo",
    lat: 60.1939,
    lon: 11.1004,
    timezone: "Europe/Oslo",
    website: "https://avinor.no"
  },
  {
    name: "Dublin Airport",
    iata_code: "DUB",
    icao_code: "EIDW",
    country: "Ireland",
    city: "Dublin",
    lat: 53.4213,
    lon: -6.2701,
    timezone: "Europe/Dublin",
    website: "https://www.dublinairport.com"
  },
  {
    name: "Lisbon Airport",
    iata_code: "LIS",
    icao_code: "LPPT",
    country: "Portugal",
    city: "Lisbon",
    lat: 38.7813,
    lon: -9.1363,
    timezone: "Europe/Lisbon",
    website: "https://www.ana.pt"
  },
  {
    name: "Athens International Airport",
    iata_code: "ATH",
    icao_code: "LGAV",
    country: "Greece",
    city: "Athens",
    lat: 37.9364,
    lon: 23.9445,
    timezone: "Europe/Athens",
    website: "https://www.aia.gr"
  },
  {
    name: "Istanbul Airport",
    iata_code: "IST",
    icao_code: "LTFM",
    country: "Turkey",
    city: "Istanbul",
    lat: 41.2619,
    lon: 28.7414,
    timezone: "Europe/Istanbul",
    website: "https://www.istairport.com"
  }
];

export default function AirportsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAirports, setFilteredAirports] = useState<Airport[]>(majorAirports);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    filterAirports();
  }, [searchQuery]);

  const filterAirports = () => {
    if (!searchQuery.trim()) {
      setFilteredAirports(majorAirports);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = majorAirports.filter(airport =>
      airport.name.toLowerCase().includes(query) ||
      airport.iata_code.toLowerCase().includes(query) ||
      airport.icao_code.toLowerCase().includes(query) ||
      airport.city.toLowerCase().includes(query) ||
      airport.country.toLowerCase().includes(query)
    );

    setFilteredAirports(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    filterAirports();
    setRefreshing(false);
  };

  const openWebsite = (url: string) => {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
  };

  const renderAirportCard = (airport: Airport) => (
    <View key={airport.iata_code} style={styles.airportCard}>
      <View style={styles.airportHeader}>
        <View style={styles.airportCodes}>
          <Text style={styles.airportIata}>{airport.iata_code}</Text>
          <Text style={styles.airportIcao}>{airport.icao_code}</Text>
        </View>
        <View style={styles.countryInfo}>
          <Globe size={16} color="#64748b" />
          <Text style={styles.countryText}>{airport.country}</Text>
        </View>
      </View>
      
      <Text style={styles.airportName}>{airport.name}</Text>
      <Text style={styles.cityName}>{airport.city}</Text>
      
      <View style={styles.airportDetails}>
        <View style={styles.airportDetail}>
          <MapPin size={14} color="#64748b" />
          <Text style={styles.detailText}>
            {airport.lat.toFixed(4)}, {airport.lon.toFixed(4)}
          </Text>
        </View>
        <View style={styles.airportDetail}>
          <Clock size={14} color="#64748b" />
          <Text style={styles.detailText}>{airport.timezone}</Text>
        </View>
      </View>

      {airport.website && (
        <TouchableOpacity 
          style={styles.websiteButton}
          onPress={() => openWebsite(airport.website!)}
        >
          <ExternalLink size={14} color="#3b82f6" />
          <Text style={styles.websiteText}>Visit Website</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0ea5e9', '#0284c7']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Airport Directory</Text>
        <Text style={styles.headerSubtitle}>Major international airports worldwide</Text>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search airports by name, code, or city..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94a3b8"
          />
        </View>
      </View>

      <View style={styles.resultsHeader}>
        <Building size={20} color="#3b82f6" />
        <Text style={styles.resultsCount}>
          {filteredAirports.length} Airport{filteredAirports.length !== 1 ? 's' : ''}
          {searchQuery ? ` matching "${searchQuery}"` : ''}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.airportsContainer}>
          {filteredAirports.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Building size={48} color="#94a3b8" />
              <Text style={styles.emptyTitle}>No airports found</Text>
              <Text style={styles.emptyText}>
                Try searching with a different term
              </Text>
            </View>
          ) : (
            filteredAirports.map(renderAirportCard)
          )}
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
    color: '#bae6fd',
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchInputContainer: {
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
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  airportsContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
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
  },
  airportCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    gap: 12,
  },
  airportIata: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0ea5e9',
  },
  airportIcao: {
    fontSize: 14,
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontFamily: 'monospace',
  },
  countryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 4,
  },
  airportName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  cityName: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 16,
  },
  airportDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  airportDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 6,
  },
  websiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  websiteText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    marginLeft: 6,
  },
});

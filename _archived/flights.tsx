import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plane, Search, MapPin, Clock, Calendar, TrendingUp, TrendingDown, Loader, CircleAlert as AlertCircle, Navigation, Users, Zap, Globe, Building, Route, Info } from 'lucide-react-native';

interface Flight {
  flight_date: string;
  flight_status: string;
  departure: {
    airport: string;
    timezone: string;
    iata: string;
    icao: string;
    terminal: string;
    gate: string;
    delay: number;
    scheduled: string;
    estimated: string;
    actual: string;
  };
  arrival: {
    airport: string;
    timezone: string;
    iata: string;
    icao: string;
    terminal: string;
    gate: string;
    baggage: string;
    delay: number;
    scheduled: string;
    estimated: string;
    actual: string;
  };
  airline: {
    name: string;
    iata: string;
    icao: string;
  };
  flight: {
    number: string;
    iata: string;
    icao: string;
    codeshared: any;
  };
  aircraft: {
    registration: string;
    iata: string;
    icao: string;
    icao24: string;
  };
  live: {
    updated: string;
    latitude: number;
    longitude: number;
    altitude: number;
    direction: number;
    speed_horizontal: number;
    speed_vertical: number;
    is_ground: boolean;
  };
}

interface Airport {
  airport_name: string;
  iata_code: string;
  icao_code: string;
  country_name: string;
  country_iso2: string;
  latitude: number;
  longitude: number;
  timezone: string;
  gmt: string;
  phone: string;
  website: string;
}

interface Airline {
  airline_name: string;
  iata_code: string;
  icao_code: string;
  country_name: string;
  country_iso2: string;
  fleet_average_age: number;
  fleet_size: number;
  callsign: string;
  hub_code: string;
  status: string;
}

export default function FlightsScreen() {
  const [activeTab, setActiveTab] = useState<'flights' | 'airports' | 'airlines'>('flights');
  const [searchQuery, setSearchQuery] = useState('');
  const [flights, setFlights] = useState<Flight[]>([]);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiConfigured, setApiConfigured] = useState(true);

  useEffect(() => {
    // Load initial data
    fetchData('flights');
  }, []);

  const fetchData = async (endpoint: string, query: string = '') => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        endpoint,
        limit: '20',
      });

      if (query.trim()) {
        params.append('query', query.trim());
      }

      const response = await fetch(`/flight-tracker?${params}`);
      const result = await response.json();

      if (!result.success) {
        if (result.error?.includes('API key not configured')) {
          setApiConfigured(false);
          setError('Aviation Stack API not configured. Please add your API key to continue.');
        } else {
          setError(result.error || 'Failed to fetch data');
        }
        return;
      }

      setApiConfigured(true);

      switch (endpoint) {
        case 'flights':
          setFlights(result.data || []);
          break;
        case 'airports':
          setAirports(result.data || []);
          break;
        case 'airlines':
          setAirlines(result.data || []);
          break;
      }

    } catch (error) {
      console.error('Error fetching flight data:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      fetchData(activeTab, searchQuery);
    } else {
      fetchData(activeTab);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData(activeTab, searchQuery);
    setRefreshing(false);
  };

  const getFlightStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'en-route':
        return '#10b981';
      case 'landed':
        return '#3b82f6';
      case 'scheduled':
        return '#f59e0b';
      case 'cancelled':
        return '#ef4444';
      case 'delayed':
        return '#f97316';
      default:
        return '#64748b';
    }
  };

  const getFlightStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'en-route':
        return <Plane size={16} color="#10b981" />;
      case 'landed':
        return <TrendingDown size={16} color="#3b82f6" />;
      case 'scheduled':
        return <Clock size={16} color="#f59e0b" />;
      case 'cancelled':
        return <AlertCircle size={16} color="#ef4444" />;
      case 'delayed':
        return <TrendingUp size={16} color="#f97316" />;
      default:
        return <Info size={16} color="#64748b" />;
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'N/A';
    try {
      return new Date(timeString).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return timeString;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const renderFlightCard = (flight: Flight, index: number) => (
    <View key={index} style={styles.flightCard}>
      <View style={styles.flightHeader}>
        <View style={styles.flightInfo}>
          <Text style={styles.flightNumber}>
            {flight.airline?.name} {flight.flight?.iata || flight.flight?.number}
          </Text>
          <View style={styles.statusContainer}>
            {getFlightStatusIcon(flight.flight_status)}
            <Text style={[styles.flightStatus, { color: getFlightStatusColor(flight.flight_status) }]}>
              {flight.flight_status}
            </Text>
          </View>
        </View>
        <Text style={styles.flightDate}>{formatDate(flight.flight_date)}</Text>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.airportInfo}>
          <Text style={styles.airportCode}>{flight.departure?.iata}</Text>
          <Text style={styles.airportName}>{flight.departure?.airport}</Text>
          <View style={styles.timeInfo}>
            <Clock size={12} color="#64748b" />
            <Text style={styles.timeText}>
              {formatTime(flight.departure?.actual || flight.departure?.estimated || flight.departure?.scheduled)}
            </Text>
          </View>
          {flight.departure?.gate && (
            <Text style={styles.gateInfo}>Gate {flight.departure.gate}</Text>
          )}
        </View>

        <View style={styles.routeLine}>
          <View style={styles.routeDot} />
          <View style={styles.routePath} />
          <Plane size={16} color="#3b82f6" />
          <View style={styles.routePath} />
          <View style={styles.routeDot} />
        </View>

        <View style={styles.airportInfo}>
          <Text style={styles.airportCode}>{flight.arrival?.iata}</Text>
          <Text style={styles.airportName}>{flight.arrival?.airport}</Text>
          <View style={styles.timeInfo}>
            <Clock size={12} color="#64748b" />
            <Text style={styles.timeText}>
              {formatTime(flight.arrival?.actual || flight.arrival?.estimated || flight.arrival?.scheduled)}
            </Text>
          </View>
          {flight.arrival?.baggage && (
            <Text style={styles.gateInfo}>Baggage {flight.arrival.baggage}</Text>
          )}
        </View>
      </View>

      {flight.live && (
        <View style={styles.liveInfo}>
          <View style={styles.liveIndicator}>
            <Zap size={12} color="#10b981" />
            <Text style={styles.liveText}>Live Tracking</Text>
          </View>
          <View style={styles.liveDetails}>
            <Text style={styles.liveDetail}>Alt: {flight.live.altitude}ft</Text>
            <Text style={styles.liveDetail}>Speed: {flight.live.speed_horizontal}km/h</Text>
            <Text style={styles.liveDetail}>Dir: {flight.live.direction}°</Text>
          </View>
        </View>
      )}

      {flight.aircraft && (
        <View style={styles.aircraftInfo}>
          <Text style={styles.aircraftText}>
            Aircraft: {flight.aircraft.iata} • Registration: {flight.aircraft.registration}
          </Text>
        </View>
      )}
    </View>
  );

  const renderAirportCard = (airport: Airport, index: number) => (
    <View key={index} style={styles.airportCard}>
      <View style={styles.airportHeader}>
        <View style={styles.airportCodes}>
          <Text style={styles.airportIata}>{airport.iata_code}</Text>
          <Text style={styles.airportIcao}>{airport.icao_code}</Text>
        </View>
        <View style={styles.countryInfo}>
          <Globe size={16} color="#64748b" />
          <Text style={styles.countryText}>{airport.country_name}</Text>
        </View>
      </View>
      
      <Text style={styles.airportName}>{airport.airport_name}</Text>
      
      <View style={styles.airportDetails}>
        <View style={styles.airportDetail}>
          <MapPin size={14} color="#64748b" />
          <Text style={styles.detailText}>
            {airport.latitude?.toFixed(4)}, {airport.longitude?.toFixed(4)}
          </Text>
        </View>
        <View style={styles.airportDetail}>
          <Clock size={14} color="#64748b" />
          <Text style={styles.detailText}>{airport.timezone} (GMT{airport.gmt})</Text>
        </View>
      </View>

      {airport.website && (
        <TouchableOpacity style={styles.websiteButton}>
          <Globe size={14} color="#3b82f6" />
          <Text style={styles.websiteText}>Visit Website</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderAirlineCard = (airline: Airline, index: number) => (
    <View key={index} style={styles.airlineCard}>
      <View style={styles.airlineHeader}>
        <View style={styles.airlineCodes}>
          <Text style={styles.airlineIata}>{airline.iata_code}</Text>
          <Text style={styles.airlineIcao}>{airline.icao_code}</Text>
        </View>
        <View style={styles.airlineStatus}>
          <Text style={[styles.statusBadge, { 
            backgroundColor: airline.status === 'active' ? '#10b981' : '#64748b' 
          }]}>
            {airline.status}
          </Text>
        </View>
      </View>
      
      <Text style={styles.airlineName}>{airline.airline_name}</Text>
      
      <View style={styles.airlineDetails}>
        <View style={styles.airlineDetail}>
          <Globe size={14} color="#64748b" />
          <Text style={styles.detailText}>{airline.country_name}</Text>
        </View>
        <View style={styles.airlineDetail}>
          <Users size={14} color="#64748b" />
          <Text style={styles.detailText}>Fleet: {airline.fleet_size} aircraft</Text>
        </View>
        <View style={styles.airlineDetail}>
          <Calendar size={14} color="#64748b" />
          <Text style={styles.detailText}>Avg Age: {airline.fleet_average_age} years</Text>
        </View>
      </View>

      {airline.callsign && (
        <Text style={styles.callsign}>Callsign: {airline.callsign}</Text>
      )}
    </View>
  );

  const renderApiSetupMessage = () => (
    <View style={styles.setupContainer}>
      <AlertCircle size={48} color="#f59e0b" />
      <Text style={styles.setupTitle}>Aviation Stack API Setup Required</Text>
      <Text style={styles.setupText}>
        To use the flight tracker, you need to configure your Aviation Stack API key:
      </Text>
      <View style={styles.setupSteps}>
        <Text style={styles.setupStep}>1. Add your API key to the .env file:</Text>
        <Text style={styles.setupCode}>EXPO_PUBLIC_AVIATION_STACK_API_KEY=ebd1a681da44f2e45bc859918374d8d2</Text>
        <Text style={styles.setupStep}>2. Restart the development server</Text>
      </View>
      <TouchableOpacity 
        style={styles.retryButton}
        onPress={() => fetchData(activeTab)}
      >
        <Text style={styles.retryText}>Test Connection</Text>
      </TouchableOpacity>
    </View>
  );

  const tabs = [
    { id: 'flights', label: 'Flights', icon: Plane },
    { id: 'airports', label: 'Airports', icon: Building },
    { id: 'airlines', label: 'Airlines', icon: Globe },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0ea5e9', '#0284c7']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Flight Tracker</Text>
        <Text style={styles.headerSubtitle}>Real-time flight information</Text>
      </LinearGradient>

      {!apiConfigured ? (
        renderApiSetupMessage()
      ) : (
        <>
          {/* Tab Selector */}
          <View style={styles.tabContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={[styles.tab, isActive && styles.activeTab]}
                    onPress={() => {
                      setActiveTab(tab.id as any);
                      fetchData(tab.id);
                    }}
                  >
                    <IconComponent size={20} color={isActive ? '#ffffff' : '#64748b'} />
                    <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Search size={20} color="#64748b" />
              <TextInput
                style={styles.searchInput}
                placeholder={
                  activeTab === 'flights' 
                    ? 'Flight number (e.g. BA123) or airport code (e.g. LHR)'
                    : activeTab === 'airports'
                    ? 'Airport name or code (e.g. Heathrow or LHR)'
                    : 'Airline name or code (e.g. British Airways or BA)'
                }
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

          {/* Content */}
          <ScrollView
            style={styles.content}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          >
            {loading && !refreshing && (
              <View style={styles.loadingContainer}>
                <Loader size={32} color="#0ea5e9" />
                <Text style={styles.loadingText}>Loading {activeTab}...</Text>
              </View>
            )}

            {error && (
              <View style={styles.errorContainer}>
                <AlertCircle size={24} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => fetchData(activeTab)}>
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}

            {!loading && !error && (
              <>
                {activeTab === 'flights' && (
                  <View style={styles.resultsContainer}>
                    {flights.length === 0 ? (
                      <View style={styles.emptyContainer}>
                        <Plane size={48} color="#94a3b8" />
                        <Text style={styles.emptyTitle}>No flights found</Text>
                        <Text style={styles.emptyText}>
                          Try searching for a specific flight number or airport code
                        </Text>
                      </View>
                    ) : (
                      <>
                        <Text style={styles.resultsTitle}>
                          {flights.length} Flight{flights.length !== 1 ? 's' : ''} Found
                        </Text>
                        {flights.map(renderFlightCard)}
                      </>
                    )}
                  </View>
                )}

                {activeTab === 'airports' && (
                  <View style={styles.resultsContainer}>
                    {airports.length === 0 ? (
                      <View style={styles.emptyContainer}>
                        <Building size={48} color="#94a3b8" />
                        <Text style={styles.emptyTitle}>No airports found</Text>
                        <Text style={styles.emptyText}>
                          Try searching for an airport name or code
                        </Text>
                      </View>
                    ) : (
                      <>
                        <Text style={styles.resultsTitle}>
                          {airports.length} Airport{airports.length !== 1 ? 's' : ''} Found
                        </Text>
                        {airports.map(renderAirportCard)}
                      </>
                    )}
                  </View>
                )}

                {activeTab === 'airlines' && (
                  <View style={styles.resultsContainer}>
                    {airlines.length === 0 ? (
                      <View style={styles.emptyContainer}>
                        <Globe size={48} color="#94a3b8" />
                        <Text style={styles.emptyTitle}>No airlines found</Text>
                        <Text style={styles.emptyText}>
                          Try searching for an airline name or code
                        </Text>
                      </View>
                    ) : (
                      <>
                        <Text style={styles.resultsTitle}>
                          {airlines.length} Airline{airlines.length !== 1 ? 's' : ''} Found
                        </Text>
                        {airlines.map(renderAirlineCard)}
                      </>
                    )}
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </>
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
  tabContainer: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
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
  activeTab: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#ffffff',
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 16,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  resultsContainer: {
    paddingTop: 20,
    paddingBottom: 32,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
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
    lineHeight: 24,
  },
  flightCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  flightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  flightInfo: {
    flex: 1,
  },
  flightNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flightStatus: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
    textTransform: 'capitalize',
  },
  flightDate: {
    fontSize: 14,
    color: '#64748b',
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  airportInfo: {
    flex: 1,
    alignItems: 'center',
  },
  airportCode: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  airportName: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 8,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 4,
  },
  gateInfo: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
  },
  routeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
  },
  routePath: {
    width: 20,
    height: 2,
    backgroundColor: '#e2e8f0',
  },
  liveInfo: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
    marginLeft: 4,
  },
  liveDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  liveDetail: {
    fontSize: 12,
    color: '#16a34a',
  },
  aircraftInfo: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 8,
  },
  aircraftText: {
    fontSize: 12,
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
  countryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 4,
  },
  airportDetails: {
    marginTop: 12,
    gap: 8,
  },
  airportDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
  },
  websiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  websiteText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    marginLeft: 6,
  },
  airlineCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  airlineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  airlineCodes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  airlineIata: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  airlineIcao: {
    fontSize: 14,
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  airlineStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    textTransform: 'capitalize',
  },
  airlineName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  airlineDetails: {
    gap: 8,
  },
  airlineDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callsign: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
    fontStyle: 'italic',
  },
  setupContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  setupTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  setupText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  setupSteps: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: '100%',
  },
  setupStep: {
    fontSize: 14,
    color: '#1e293b',
    marginBottom: 8,
    fontWeight: '600',
  },
  setupCode: {
    fontSize: 12,
    color: '#3b82f6',
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
    fontFamily: 'monospace',
    marginBottom: 16,
  },
});

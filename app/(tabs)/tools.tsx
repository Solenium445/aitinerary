import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Map, Wifi, WifiOff, Calculator, Phone, MessageSquare, Download, MapPin, Globe, Shield, Clock, Banknote, Languages, Navigation, Bookmark, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Info } from 'lucide-react-native';

interface CurrencyRate {
  code: string;
  name: string;
  rate: number;
  symbol: string;
}

interface EmergencyContact {
  country: string;
  police: string;
  medical: string;
  fire: string;
  tourist: string;
}

interface OfflineMap {
  id: string;
  name: string;
  size: string;
  downloaded: boolean;
  lastUpdated?: string;
}

const currencyRates: CurrencyRate[] = [
  { code: 'EUR', name: 'Euro', rate: 1.17, symbol: '€' },
  { code: 'USD', name: 'US Dollar', rate: 1.00, symbol: '$' },
  { code: 'JPY', name: 'Japanese Yen', rate: 110.0, symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', rate: 1.25, symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', rate: 1.35, symbol: 'A$' },
  { code: 'CHF', name: 'Swiss Franc', rate: 0.92, symbol: 'CHF' },
];

const emergencyContacts: EmergencyContact[] = [
  {
    country: 'Spain',
    police: '091',
    medical: '061',
    fire: '080',
    tourist: '902 102 112',
  },
  {
    country: 'France',
    police: '17',
    medical: '15',
    fire: '18',
    tourist: '3975',
  },
  {
    country: 'Italy',
    police: '113',
    medical: '118',
    fire: '115',
    tourist: '039 039 039',
  },
  {
    country: 'Germany',
    police: '110',
    medical: '112',
    fire: '112',
    tourist: '030 25 00 25',
  },
  {
    country: 'UK',
    police: '999',
    medical: '999',
    fire: '999',
    tourist: '0845 22 55 121',
  },
];

const offlineMaps: OfflineMap[] = [
  { id: 'barcelona', name: 'Barcelona City Center', size: '45 MB', downloaded: true, lastUpdated: '2024-01-15' },
  { id: 'madrid', name: 'Madrid Metro Area', size: '67 MB', downloaded: false },
  { id: 'paris', name: 'Paris & Suburbs', size: '89 MB', downloaded: true, lastUpdated: '2024-01-10' },
  { id: 'rome', name: 'Rome Historic Center', size: '52 MB', downloaded: false },
  { id: 'london', name: 'Greater London', size: '156 MB', downloaded: false },
];

const essentialPhrases = [
  { category: 'Greetings', phrases: [
    { english: 'Hello', spanish: 'Hola', french: 'Bonjour', italian: 'Ciao', german: 'Hallo' },
    { english: 'Thank you', spanish: 'Gracias', french: 'Merci', italian: 'Grazie', german: 'Danke' },
    { english: 'Please', spanish: 'Por favor', french: 'S\'il vous plaît', italian: 'Per favore', german: 'Bitte' },
  ]},
  { category: 'Emergency', phrases: [
    { english: 'Help!', spanish: '¡Ayuda!', french: 'Au secours!', italian: 'Aiuto!', german: 'Hilfe!' },
    { english: 'Call police', spanish: 'Llama a la policía', french: 'Appelez la police', italian: 'Chiama la polizia', german: 'Rufen Sie die Polizei' },
    { english: 'I need a doctor', spanish: 'Necesito un médico', french: 'J\'ai besoin d\'un médecin', italian: 'Ho bisogno di un medico', german: 'Ich brauche einen Arzt' },
  ]},
  { category: 'Navigation', phrases: [
    { english: 'Where is...?', spanish: '¿Dónde está...?', french: 'Où est...?', italian: 'Dove si trova...?', german: 'Wo ist...?' },
    { english: 'How much?', spanish: '¿Cuánto cuesta?', french: 'Combien ça coûte?', italian: 'Quanto costa?', german: 'Wie viel kostet das?' },
    { english: 'I don\'t understand', spanish: 'No entiendo', french: 'Je ne comprends pas', italian: 'Non capisco', german: 'Ich verstehe nicht' },
  ]},
];

export default function ToolsScreen() {
  const [isOffline, setIsOffline] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string>('converter');
  const [amount, setAmount] = useState('100');
  const [fromCurrency, setFromCurrency] = useState('GBP');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [selectedCountry, setSelectedCountry] = useState('Spain');
  const [selectedLanguage, setSelectedLanguage] = useState('spanish');

  useEffect(() => {
    // Simulate offline detection
    const checkConnection = () => {
      if (Platform.OS === 'web') {
        setIsOffline(!navigator.onLine);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  const convertCurrency = () => {
    const fromRate = fromCurrency === 'GBP' ? 1 : currencyRates.find(c => c.code === fromCurrency)?.rate || 1;
    const toRate = toCurrency === 'GBP' ? 1 : currencyRates.find(c => c.code === toCurrency)?.rate || 1;
    const gbpAmount = parseFloat(amount) / fromRate;
    const convertedAmount = gbpAmount * toRate;
    return convertedAmount.toFixed(2);
  };

  const downloadMap = (mapId: string) => {
    Alert.alert(
      'Download Map',
      'This would download the offline map for use without internet connection.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Download', onPress: () => {
          Alert.alert('Success', 'Map downloaded successfully!');
        }},
      ]
    );
  };

  const renderCurrencyConverter = () => (
    <View style={styles.toolCard}>
      <View style={styles.toolHeader}>
        <Calculator size={24} color="#f59e0b" />
        <Text style={styles.toolTitle}>Currency Converter</Text>
        {isOffline && <WifiOff size={16} color="#ef4444" />}
      </View>

      <View style={styles.converterContainer}>
        <View style={styles.currencyRow}>
          <Text style={styles.currencyLabel}>From:</Text>
          <View style={styles.currencySelector}>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="Amount"
            />
            <TouchableOpacity style={styles.currencyButton}>
              <Text style={styles.currencyCode}>{fromCurrency}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.converterArrow}>
          <Text style={styles.arrowText}>↓</Text>
        </View>

        <View style={styles.currencyRow}>
          <Text style={styles.currencyLabel}>To:</Text>
          <View style={styles.currencySelector}>
            <Text style={styles.convertedAmount}>{convertCurrency()}</Text>
            <TouchableOpacity style={styles.currencyButton}>
              <Text style={styles.currencyCode}>{toCurrency}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView horizontal style={styles.currencyList} showsHorizontalScrollIndicator={false}>
          {currencyRates.map((currency) => (
            <TouchableOpacity
              key={currency.code}
              style={styles.currencyItem}
              onPress={() => setToCurrency(currency.code)}
            >
              <Text style={styles.currencySymbol}>{currency.symbol}</Text>
              <Text style={styles.currencyName}>{currency.code}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderEmergencyContacts = () => {
    const contacts = emergencyContacts.find(c => c.country === selectedCountry);
    
    return (
      <View style={styles.toolCard}>
        <View style={styles.toolHeader}>
          <Phone size={24} color="#ef4444" />
          <Text style={styles.toolTitle}>Emergency Contacts</Text>
          <Shield size={16} color="#10b981" />
        </View>

        <View style={styles.countrySelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {emergencyContacts.map((country) => (
              <TouchableOpacity
                key={country.country}
                style={[
                  styles.countryButton,
                  selectedCountry === country.country && styles.selectedCountryButton,
                ]}
                onPress={() => setSelectedCountry(country.country)}
              >
                <Text
                  style={[
                    styles.countryButtonText,
                    selectedCountry === country.country && styles.selectedCountryButtonText,
                  ]}
                >
                  {country.country}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {contacts && (
          <View style={styles.contactsList}>
            <View style={styles.contactItem}>
              <View style={styles.contactIcon}>
                <Shield size={20} color="#ef4444" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Police</Text>
                <Text style={styles.contactNumber}>{contacts.police}</Text>
              </View>
            </View>

            <View style={styles.contactItem}>
              <View style={styles.contactIcon}>
                <Phone size={20} color="#10b981" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Medical Emergency</Text>
                <Text style={styles.contactNumber}>{contacts.medical}</Text>
              </View>
            </View>

            <View style={styles.contactItem}>
              <View style={styles.contactIcon}>
                <AlertTriangle size={20} color="#f59e0b" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Fire Department</Text>
                <Text style={styles.contactNumber}>{contacts.fire}</Text>
              </View>
            </View>

            <View style={styles.contactItem}>
              <View style={styles.contactIcon}>
                <Info size={20} color="#3b82f6" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Tourist Helpline</Text>
                <Text style={styles.contactNumber}>{contacts.tourist}</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderOfflineMaps = () => (
    <View style={styles.toolCard}>
      <View style={styles.toolHeader}>
        <Map size={24} color="#8b5cf6" />
        <Text style={styles.toolTitle}>Offline Maps</Text>
        {isOffline ? <WifiOff size={16} color="#ef4444" /> : <Wifi size={16} color="#10b981" />}
      </View>

      <Text style={styles.toolDescription}>
        Download maps for offline use when you don't have internet connection.
      </Text>

      <View style={styles.mapsList}>
        {offlineMaps.map((map) => (
          <View key={map.id} style={styles.mapItem}>
            <View style={styles.mapInfo}>
              <Text style={styles.mapName}>{map.name}</Text>
              <Text style={styles.mapSize}>{map.size}</Text>
              {map.lastUpdated && (
                <Text style={styles.mapUpdated}>Updated: {map.lastUpdated}</Text>
              )}
            </View>
            <TouchableOpacity
              style={[
                styles.mapButton,
                map.downloaded ? styles.downloadedButton : styles.downloadButton,
              ]}
              onPress={() => !map.downloaded && downloadMap(map.id)}
            >
              {map.downloaded ? (
                <CheckCircle size={20} color="#10b981" />
              ) : (
                <Download size={20} color="#3b82f6" />
              )}
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );

  const renderPhrasebook = () => (
    <View style={styles.toolCard}>
      <View style={styles.toolHeader}>
        <Languages size={24} color="#3b82f6" />
        <Text style={styles.toolTitle}>Essential Phrases</Text>
        <MessageSquare size={16} color="#64748b" />
      </View>

      <View style={styles.languageSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['spanish', 'french', 'italian', 'german'].map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[
                styles.languageButton,
                selectedLanguage === lang && styles.selectedLanguageButton,
              ]}
              onPress={() => setSelectedLanguage(lang)}
            >
              <Text
                style={[
                  styles.languageButtonText,
                  selectedLanguage === lang && styles.selectedLanguageButtonText,
                ]}
              >
                {lang.charAt(0).toUpperCase() + lang.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.phrasesContainer}>
        {essentialPhrases.map((category) => (
          <View key={category.category} style={styles.phraseCategory}>
            <Text style={styles.categoryTitle}>{category.category}</Text>
            {category.phrases.map((phrase, index) => (
              <View key={index} style={styles.phraseItem}>
                <Text style={styles.englishPhrase}>{phrase.english}</Text>
                <Text style={styles.translatedPhrase}>
                  {phrase[selectedLanguage as keyof typeof phrase]}
                </Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const tools = [
    { id: 'converter', label: 'Currency', icon: Calculator },
    { id: 'emergency', label: 'Emergency', icon: Phone },
    { id: 'maps', label: 'Maps', icon: Map },
    { id: 'phrases', label: 'Phrases', icon: Languages },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#8b5cf6', '#7c3aed']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Offline Survival Tools</Text>
        <Text style={styles.headerSubtitle}>Essential tools for any situation</Text>
        <View style={styles.connectionStatus}>
          {isOffline ? (
            <>
              <WifiOff size={16} color="#fbbf24" />
              <Text style={styles.statusText}>Offline Mode</Text>
            </>
          ) : (
            <>
              <Wifi size={16} color="#10b981" />
              <Text style={styles.statusText}>Connected</Text>
            </>
          )}
        </View>
      </LinearGradient>

      {/* Tool Selector */}
      <View style={styles.toolSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tools.map((tool) => {
            const IconComponent = tool.icon;
            const isSelected = selectedTool === tool.id;
            return (
              <TouchableOpacity
                key={tool.id}
                style={[
                  styles.toolButton,
                  isSelected && styles.selectedToolButton,
                ]}
                onPress={() => setSelectedTool(tool.id)}
              >
                <IconComponent
                  size={20}
                  color={isSelected ? '#ffffff' : '#64748b'}
                />
                <Text
                  style={[
                    styles.toolButtonText,
                    isSelected && styles.selectedToolButtonText,
                  ]}
                >
                  {tool.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedTool === 'converter' && renderCurrencyConverter()}
        {selectedTool === 'emergency' && renderEmergencyContacts()}
        {selectedTool === 'maps' && renderOfflineMaps()}
        {selectedTool === 'phrases' && renderPhrasebook()}

        {/* Offline Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>🛡️ Offline Survival Tips</Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipText}>
              • Download maps and translation apps before traveling{'\n'}
              • Save important phone numbers in your contacts{'\n'}
              • Take screenshots of important information{'\n'}
              • Carry a physical map as backup{'\n'}
              • Learn basic phrases in the local language{'\n'}
              • Keep emergency cash in local currency{'\n'}
              • Know your embassy's contact information
            </Text>
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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e9d5ff',
    marginBottom: 12,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 6,
  },
  toolSelector: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  toolButton: {
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
  selectedToolButton: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  toolButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginLeft: 6,
  },
  selectedToolButtonText: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  toolCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  toolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  toolTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginLeft: 12,
    flex: 1,
  },
  toolDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 20,
  },
  converterContainer: {
    gap: 16,
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currencyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    width: 60,
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  amountInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flex: 1,
  },
  convertedAmount: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#16a34a',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    flex: 1,
    textAlign: 'center',
  },
  currencyButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  currencyCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  converterArrow: {
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 24,
    color: '#64748b',
  },
  currencyList: {
    marginTop: 16,
  },
  currencyItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginRight: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minWidth: 60,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  currencyName: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  countrySelector: {
    marginBottom: 20,
  },
  countryButton: {
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectedCountryButton: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  countryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  selectedCountryButtonText: {
    color: '#ffffff',
  },
  contactsList: {
    gap: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  contactIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  contactNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginTop: 2,
  },
  mapsList: {
    gap: 12,
  },
  mapItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  mapInfo: {
    flex: 1,
  },
  mapName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  mapSize: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  mapUpdated: {
    fontSize: 12,
    color: '#10b981',
    marginTop: 2,
  },
  mapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadButton: {
    backgroundColor: '#eff6ff',
  },
  downloadedButton: {
    backgroundColor: '#f0fdf4',
  },
  languageSelector: {
    marginBottom: 20,
  },
  languageButton: {
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectedLanguageButton: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  languageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  selectedLanguageButtonText: {
    color: '#ffffff',
  },
  phrasesContainer: {
    maxHeight: 400,
  },
  phraseCategory: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  phraseItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  englishPhrase: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  translatedPhrase: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginTop: 4,
  },
  tipsSection: {
    marginTop: 32,
    marginBottom: 32,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  tipCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tipText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
  },
});
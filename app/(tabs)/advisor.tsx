import React, { useState, useRef, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Loader, 
  MapPin, 
  Clock, 
  DollarSign,
  Star,
  Lightbulb,
  Camera,
  Utensils,
  Settings,
  Calendar
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useUserItineraries } from '@/hooks/useUserData';
import { loadItinerary } from '@/utils/storage';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  suggestions?: string[];
}

interface TripInfo {
  destination: string;
  duration: number;
  totalCost: number;
  startDate: string;
  daysUntil: number;
}

export default function AdvisorScreen() {
  const { user, profile } = useAuth();
  const { itineraries } = useUserItineraries();
  const [messages, setMessages] = useState<Message[]>([
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [welcomeMessageAdded, setWelcomeMessageAdded] = useState(false);
  const [tripInfo, setTripInfo] = useState<TripInfo | null>(null);
  const [greetingText, setGreetingText] = useState<string>('');
  const welcomeOpacity = useRef(new Animated.Value(0)).current;
  const welcomeSlideY = useRef(new Animated.Value(20)).current;
  const greetingOpacity = useRef(new Animated.Value(0)).current;
  const greetingSlideY = useRef(new Animated.Value(10)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const [quickQuestions, setQuickQuestions] = useState([
    {
      id: 'weather',
      text: 'What\'s the weather like?',
      icon: '🌤️',
    },
    {
      id: 'food',
      text: 'Best local restaurants?',
      icon: '🍽️',
    },
    {
      id: 'transport',
      text: 'How to get around?',
      icon: '🚇',
    },
    {
      id: 'safety',
      text: 'Safety tips?',
      icon: '🛡️',
    },
  ]);

  useEffect(() => {
    loadTripDataForWelcome();
  }, [profile]); // Reload when profile changes

  // Add focus effect to reload data when tab becomes active
  useFocusEffect(
    React.useCallback(() => {
      console.log('🎯 Advisor screen focused, reloading trip data...');
      loadTripDataForWelcome();
    }, [])
  );

  const loadTripDataForWelcome = async () => {
    try {
      console.log('🔍 Loading trip data for AI advisor...');
      
      // Force reload from storage to get the latest itinerary
      const savedItinerary = await loadItinerary();
      console.log('📱 Advisor loading itinerary:', savedItinerary?.destination || 'No destination found');
      
      if (savedItinerary) {
        console.log('📱 Found trip data in storage:', savedItinerary.destination || savedItinerary.location);
        
        const startDate = new Date(savedItinerary.startDate || savedItinerary.days?.[0]?.date);
        const endDate = new Date(savedItinerary.endDate || savedItinerary.days?.[savedItinerary.days.length - 1]?.date);
        const today = new Date();
        const daysUntilTrip = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const tripDuration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || savedItinerary.days?.length || 1;
        const totalCost = savedItinerary.total_estimated_cost_gbp || 0;
        
        setTripInfo({
          destination: savedItinerary.destination || savedItinerary.location || 'Your Destination',
          duration: tripDuration,
          totalCost: totalCost,
          startDate: savedItinerary.startDate || savedItinerary.days?.[0]?.date,
          daysUntil: daysUntilTrip,
        });
        
        // Generate personalized greeting
        const userName = profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : '';
        let greeting = '';
        
        const destinationName = savedItinerary.destination || savedItinerary.location || 'Your Destination';
        console.log('🎯 Using destination for greeting:', destinationName);
        
        if (daysUntilTrip > 0) {
          greeting = `Welcome${userName}! You're off to **${destinationName}** in just **${daysUntilTrip} day${daysUntilTrip !== 1 ? 's' : ''}** — let's start planning the little details together.`;
        } else if (daysUntilTrip === 0) {
          greeting = `Welcome${userName}! Your **${destinationName}** adventure starts TODAY! I'm here to help with any last-minute questions or local tips.`;
        } else {
          greeting = `Welcome back${userName}! Hope you're enjoying **${destinationName}**! I'm here to help with recommendations and answer any questions about your trip.`;
        }
        
        setGreetingText(greeting);
        console.log('✅ Trip data loaded for AI advisor');
        
        // Generate personalized quick questions
        generatePersonalizedQuestions(destinationName, daysUntilTrip);
        return;
      }
      
      // Fallback if no trip data
      const userName = profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : '';
      setGreetingText(`Hey there${userName}! Ready to plan something magical?`);
      console.log('ℹ️ No trip data found, using default greeting');
      
    } catch (error) {
      console.error('❌ Error loading trip data for advisor:', error);
      const userName = profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : '';
      setGreetingText(`Hey there${userName}! Ready to plan something magical?`);
    }
  };

  const generatePersonalizedQuestions = (destination: string, daysUntil: number) => {
    const destLower = destination.toLowerCase();
    const personalizedQuestions = [];
    
    // Weather question - always personalized
    personalizedQuestions.push({
      id: 'weather',
      text: `Weather in ${destination.split(',')[0]}?`,
      icon: '🌤️',
    });
    
    // Food question - personalized by destination
    if (destLower.includes('spain') || destLower.includes('barcelona') || destLower.includes('madrid')) {
      personalizedQuestions.push({
        id: 'food',
        text: 'Best tapas bars?',
        icon: '🥘',
      });
    } else if (destLower.includes('italy') || destLower.includes('rome') || destLower.includes('florence')) {
      personalizedQuestions.push({
        id: 'food',
        text: 'Authentic pasta places?',
        icon: '🍝',
      });
    } else if (destLower.includes('france') || destLower.includes('paris')) {
      personalizedQuestions.push({
        id: 'food',
        text: 'Best bistros & cafés?',
        icon: '🥐',
      });
    } else {
      personalizedQuestions.push({
        id: 'food',
        text: `Local food in ${destination.split(',')[0]}?`,
        icon: '🍽️',
      });
    }
    
    // Transport question - personalized by destination
    if (destLower.includes('london')) {
      personalizedQuestions.push({
        id: 'transport',
        text: 'Tube vs bus tips?',
        icon: '🚇',
      });
    } else if (destLower.includes('paris')) {
      personalizedQuestions.push({
        id: 'transport',
        text: 'Metro navigation?',
        icon: '🚇',
      });
    } else if (destLower.includes('barcelona')) {
      personalizedQuestions.push({
        id: 'transport',
        text: 'Metro vs walking?',
        icon: '🚇',
      });
    } else {
      personalizedQuestions.push({
        id: 'transport',
        text: `Getting around ${destination.split(',')[0]}?`,
        icon: '🚇',
      });
    }
    
    // Time-sensitive questions based on days until trip
    if (daysUntil > 7) {
      personalizedQuestions.push({
        id: 'planning',
        text: 'What to book in advance?',
        icon: '📅',
      });
    } else if (daysUntil > 0) {
      personalizedQuestions.push({
        id: 'packing',
        text: 'What should I pack?',
        icon: '🧳',
      });
    } else {
      personalizedQuestions.push({
        id: 'current',
        text: 'What to do right now?',
        icon: '⭐',
      });
    }
    
    // Destination-specific cultural question
    if (destLower.includes('japan')) {
      personalizedQuestions.push({
        id: 'culture',
        text: 'Japanese etiquette?',
        icon: '🎌',
      });
    } else if (destLower.includes('spain')) {
      personalizedQuestions.push({
        id: 'culture',
        text: 'Spanish customs?',
        icon: '💃',
      });
    } else if (destLower.includes('italy')) {
      personalizedQuestions.push({
        id: 'culture',
        text: 'Italian dining rules?',
        icon: '🇮🇹',
      });
    } else {
      personalizedQuestions.push({
        id: 'culture',
        text: `${destination.split(',')[0]} customs?`,
        icon: '🎭',
      });
    }
    
    // Hidden gems - always personalized
    personalizedQuestions.push({
      id: 'hidden',
      text: `Hidden gems in ${destination.split(',')[0]}?`,
      icon: '💎',
    });
    
    setQuickQuestions(personalizedQuestions);
    console.log('✅ Generated personalized questions for', destination);
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  useEffect(() => {
    // Simple welcome message - no complex logic
    if (!welcomeMessageAdded && greetingText) {
      setWelcomeMessageAdded(true);
    }
  }, [greetingText, welcomeMessageAdded]);

  useEffect(() => {
    // Animate welcome message when it's added
    if (messages.length > 0 && !messages[0].isUser) {
      Animated.parallel([
        Animated.timing(welcomeOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(welcomeSlideY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [messages]);

  useEffect(() => {
    // Animate greeting when it appears
    if (greetingText) {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(greetingOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(greetingSlideY, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
      }, 200); // Quick delay after header
    }
  }, [greetingText]);


  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    } catch {
      return '';
    }
  };

  const testConnection = async () => {
    try {
      console.log('🔧 Starting connection test...');
      const response = await fetch('/test-ollama');
      const results = await response.json();
      console.log('📊 Test results received:', results);
      
      const debugMessage: Message = {
        id: Date.now().toString(),
        text: `🔧 Connection Test Results:\n\n${results.tests.map(test => 
          `${test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️'} ${test.name}: ${test.details}`
        ).join('\n')}\n\nOverall: ${results.summary.overall}\n\n${results.summary.recommendations.length > 0 ? 'Recommendations:\n' + results.summary.recommendations.map(r => `• ${r}`).join('\n') : ''}`,
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, debugMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: `❌ Connection test failed: ${error.message}`,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/chat-advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text.trim(),
          conversationHistory: messages.slice(-5), // Send last 5 messages for context
          userProfile: {
            destination: tripInfo?.destination || 'Current location',
            interests: ['food', 'culture', 'photography'],
            budget: 'mid-range',
            group: 'couple',
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        const advisorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: result.response,
          isUser: false,
          timestamp: new Date(),
          suggestions: result.suggestions,
        };

        setMessages(prev => [...prev, advisorMessage]);
        
        // Log debug info if available
        if (result.debug_info) {
          console.log('🔧 Chat Debug Info:', result.debug_info);
        }
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'I\'m having trouble connecting right now. Here are some general travel tips: Always carry a copy of your passport, learn basic local phrases, and research local customs before you go!',
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    sendMessage(question);
  };

  const handleSuggestionPress = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const renderMessage = (message: Message) => (
    <View key={message.id} style={[
      styles.messageContainer,
      message.isUser ? styles.userMessage : styles.advisorMessage,
    ]}>
      <View style={styles.messageHeader}>
        <View style={styles.messageIcon}>
          {message.isUser ? (
            <User size={16} color="#ffffff" />
          ) : (
            <Bot size={16} color="#ffffff" />
          )}
        </View>
        <Text style={styles.messageTime}>
          {message.timestamp.toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      </View>
      
      <Animated.View style={[
        styles.messageBubble,
        message.isUser ? styles.userBubble : styles.advisorBubble,
      ]}>
        <Text style={[
          styles.messageText,
          message.isUser ? styles.userText : styles.advisorText,
        ]}>
          {message.text}
        </Text>
      </Animated.View>

      {message.suggestions && message.suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsLabel}>💡 You might also ask:</Text>
          {message.suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionButton}
              onPress={() => handleSuggestionPress(suggestion)}
            >
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderGreeting = () => {
    if (!greetingText) return null;

    return (
      <Animated.View style={[
        styles.greetingContainer,
        {
          opacity: greetingOpacity,
          transform: [{ translateY: greetingSlideY }],
        },
      ]}>
        <Text style={styles.greetingText}>{greetingText}</Text>
        {tripInfo && tripInfo.daysUntil > 0 && (
          <Text style={styles.greetingSubtext}>
            {formatDate(tripInfo.startDate)}
          </Text>
        )}
      </Animated.View>
    );
  };
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#2196f3', '#1e88e5']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <MessageCircle size={24} color="#ffffff" />
            <Text style={styles.advisorTitle}>AI Travel Advisor</Text>
          </View>
          <TouchableOpacity 
            style={styles.debugButton}
            onPress={testConnection}
          >
            <Settings size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
        
        {tripInfo && (
          <View style={styles.tripInfoContainer}>
            <Text style={styles.tripDestination}>{tripInfo.destination}</Text>
            <View style={styles.tripDetails}>
              <Text style={styles.tripDetail}>
                {tripInfo.duration} day{tripInfo.duration !== 1 ? 's' : ''}
              </Text>
              <Text style={styles.tripSeparator}>•</Text>
              <Text style={styles.tripDetail}>£{tripInfo.totalCost} total</Text>
              {tripInfo.daysUntil > 0 && (
                <>
                  <Text style={styles.tripSeparator}>•</Text>
                  <Text style={styles.tripCountdown}>
                    {tripInfo.daysUntil} day{tripInfo.daysUntil !== 1 ? 's' : ''} to go
                  </Text>
                </>
              )}
            </View>
          </View>
        )}
        
        {!tripInfo && (
          <View style={styles.defaultHeaderInfo}>
            <Text style={styles.defaultTitle}>Your AI travel companion</Text>
            <Text style={styles.defaultSubtitle}>Ask me anything about your travels</Text>
          </View>
        )}
      </LinearGradient>

      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Greeting Message */}
        {renderGreeting()}

        <View style={styles.messagesSection}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.messagesContent}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map(renderMessage)}
            
            {isLoading && (
              <View style={[styles.messageContainer, styles.advisorMessage]}>
                <View style={styles.messageHeader}>
                  <View style={styles.messageIcon}>
                    <Bot size={16} color="#ffffff" />
                  </View>
                  <Text style={styles.messageTime}>Now</Text>
                </View>
                <View style={[styles.messageBubble, styles.advisorBubble, styles.loadingBubble]}>
                  <Loader size={16} color="#2196f3" />
                  <Text style={styles.loadingText}>Thinking...</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Quick Questions */}
          <View style={styles.quickQuestionsContainer}>
            <Text style={styles.quickQuestionsTitle}>Quick Questions:</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.quickQuestionsScroll}
            >
              {quickQuestions.map((question) => (
                <TouchableOpacity
                  key={question.id}
                  style={styles.quickQuestionButton}
                  onPress={() => handleQuickQuestion(question.text)}
                >
                  <Text style={styles.quickQuestionIcon}>{question.icon}</Text>
                  <Text style={styles.quickQuestionText}>{question.text}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Input Area */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask me anything about your trip..."
              placeholderTextColor="#94a3b8"
              multiline
              maxLength={500}
              editable={!isLoading}
              returnKeyType="send"
              onSubmitEditing={() => {
                if (inputText.trim() && !isLoading) {
                  sendMessage(inputText);
                }
              }}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
              onPress={() => sendMessage(inputText)}
              disabled={!inputText.trim() || isLoading}
            >
              <Send size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    paddingVertical: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  advisorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 8,
  },
  debugButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tripInfoContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  tripDestination: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
    textAlign: 'center',
  },
  tripDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  tripDetail: {
    fontSize: 12,
    color: '#bbdefb',
  },
  tripSeparator: {
    fontSize: 12,
    color: '#bbdefb',
    marginHorizontal: 8,
  },
  tripCountdown: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  defaultHeaderInfo: {
    alignItems: 'center',
    marginTop: 8,
  },
  defaultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  defaultSubtitle: {
    fontSize: 12,
    color: '#bbdefb',
  },
  chatContainer: {
    flex: 1,
  },
  messagesSection: {
    flex: 1,
  },
  greetingContainer: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 14,
    color: '#475569',
    fontStyle: 'italic',
    lineHeight: 18,
    textAlign: 'center',
  },
  greetingSubtext: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },
  titleContainer: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  advisorMessage: {
    alignItems: 'flex-start',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  messageIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2196f3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  messageTime: {
    fontSize: 12,
    color: '#64748b',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#3b82f6',
    borderBottomRightRadius: 4,
  },
  advisorBubble: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#ffffff',
  },
  advisorText: {
    color: '#1e293b',
    fontStyle: 'normal',
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
  },
  suggestionsContainer: {
    marginTop: 12,
    maxWidth: '80%',
  },
  suggestionsLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
    fontWeight: '600',
  },
  suggestionButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  suggestionText: {
    fontSize: 14,
    color: '#475569',
  },
  quickQuestionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  quickQuestionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 6,
  },
  quickQuestionsScroll: {
    flexDirection: 'row',
  },
  quickQuestionButton: {
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quickQuestionIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  quickQuestionText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1e293b',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sendButton: {
    backgroundColor: '#2196f3',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
});

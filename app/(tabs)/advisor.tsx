import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
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
  Settings
} from 'lucide-react-native';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  suggestions?: string[];
}

const quickQuestions = [
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
  {
    id: 'culture',
    text: 'Local customs?',
    icon: '🎭',
  },
  {
    id: 'hidden',
    text: 'Hidden gems?',
    icon: '💎',
  },
];

export default function AdvisorScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your personal travel advisor. I can help you with recommendations, answer questions about your itinerary, suggest local experiences, and provide travel tips. What would you like to know?',
      isUser: false,
      timestamp: new Date(),
      suggestions: [
        'Tell me about local food',
        'What should I pack?',
        'Best photo spots?',
        'Cultural etiquette tips',
      ],
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

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
            destination: 'Barcelona', // This would come from user's trip data
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
      
      <View style={[
        styles.messageBubble,
        message.isUser ? styles.userBubble : styles.advisorBubble,
      ]}>
        <Text style={[
          styles.messageText,
          message.isUser ? styles.userText : styles.advisorText,
        ]}>
          {message.text}
        </Text>
      </View>

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

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#06b6d4', '#0891b2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <MessageCircle size={28} color="#ffffff" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Travel Advisor</Text>
            <Text style={styles.headerSubtitle}>Your AI travel companion</Text>
          </View>
          <TouchableOpacity 
            style={styles.debugButton}
            onPress={testConnection}
          >
            <Settings size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messagesContent}
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
                <Loader size={16} color="#06b6d4" />
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
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim() || isLoading}
          >
            <Send size={20} color="#ffffff" />
          </TouchableOpacity>
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
    paddingVertical: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#cffafe',
    marginTop: 2,
  },
  debugButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatContainer: {
    flex: 1,
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
    backgroundColor: '#06b6d4',
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
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
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
    backgroundColor: '#06b6d4',
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
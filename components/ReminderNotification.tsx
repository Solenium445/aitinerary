import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { Bell, X, Clock, CircleCheck as CheckCircle, MapPin, Plane, Hotel, Camera } from 'lucide-react-native';

interface Reminder {
  id: string;
  type: 'flight' | 'hotel' | 'activity' | 'location' | 'suggestion';
  title: string;
  description: string;
  time: string;
  location: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}

interface ReminderNotificationProps {
  reminder: Reminder;
  onComplete: (id: string) => void;
  onSnooze: (id: string) => void;
  onDismiss: (id: string) => void;
}

export default function ReminderNotification({
  reminder,
  onComplete,
  onSnooze,
  onDismiss,
}: ReminderNotificationProps) {
  const [slideAnim] = useState(new Animated.Value(-100));
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Slide in animation
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, []);

  const slideOut = (callback: () => void) => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      callback();
    });
  };

  const getIcon = () => {
    switch (reminder.type) {
      case 'flight':
        return <Plane size={20} color="#3b82f6" />;
      case 'hotel':
        return <Hotel size={20} color="#10b981" />;
      case 'activity':
        return <Camera size={20} color="#f59e0b" />;
      case 'location':
        return <MapPin size={20} color="#8b5cf6" />;
      case 'suggestion':
        return <Bell size={20} color="#ec4899" />;
      default:
        return <Bell size={20} color="#64748b" />;
    }
  };

  const getPriorityColor = () => {
    switch (reminder.priority) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#64748b';
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          borderLeftColor: getPriorityColor(),
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            {getIcon()}
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{reminder.title}</Text>
            <Text style={styles.time}>
              {new Date(reminder.time).toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={() => slideOut(() => onDismiss(reminder.id))}
          >
            <X size={16} color="#64748b" />
          </TouchableOpacity>
        </View>

        <Text style={styles.description}>{reminder.description}</Text>

        <View style={styles.locationContainer}>
          <MapPin size={14} color="#64748b" />
          <Text style={styles.location}>{reminder.location}</Text>
        </View>

        <View style={styles.actions}>
          {reminder.type !== 'suggestion' && reminder.type !== 'location' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={() => slideOut(() => onComplete(reminder.id))}
            >
              <CheckCircle size={16} color="#ffffff" />
              <Text style={styles.completeButtonText}>Complete</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.snoozeButton]}
            onPress={() => slideOut(() => onSnooze(reminder.id))}
          >
            <Clock size={16} color="#64748b" />
            <Text style={styles.snoozeButtonText}>Snooze</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    margin: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 2,
  },
  time: {
    fontSize: 12,
    color: '#64748b',
  },
  dismissButton: {
    padding: 4,
  },
  description: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  location: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  completeButton: {
    backgroundColor: '#10b981',
    flex: 1,
  },
  completeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  snoozeButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flex: 1,
  },
  snoozeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
});
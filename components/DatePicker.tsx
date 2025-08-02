import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';

interface DatePickerProps {
  value: Date | null;
  onDateChange: (date: Date) => void;
  placeholder: string;
  minimumDate?: Date;
  maximumDate?: Date;
  style?: any;
}

export default function DatePicker({
  value,
  onDateChange,
  placeholder,
  minimumDate,
  maximumDate,
  style,
}: DatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'web') {
      // On web, the picker stays open
      if (selectedDate) {
        onDateChange(selectedDate);
      }
    } else {
      // On mobile, close the picker
      setShowPicker(false);
      if (selectedDate) {
        onDateChange(selectedDate);
      }
    }
  };

  const formatDateUK = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, style]}>
        <input
          type="date"
          value={value ? value.toISOString().split('T')[0] : ''}
          onChange={(e) => {
            if (e.target.value) {
              onDateChange(new Date(e.target.value));
            }
          }}
          min={minimumDate ? minimumDate.toISOString().split('T')[0] : undefined}
          max={maximumDate ? maximumDate.toISOString().split('T')[0] : undefined}
          style={{
            width: '100%',
            padding: 16,
            fontSize: 16,
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            backgroundColor: '#ffffff',
            color: '#1e293b',
          }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowPicker(true)}
      >
        <Calendar size={20} color="#64748b" />
        <Text style={[styles.dateText, !value && styles.placeholderText]}>
          {value ? formatDateUK(value) : placeholder}
        </Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  dateButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dateText: {
    fontSize: 16,
    color: '#1e293b',
    marginLeft: 12,
    flex: 1,
  },
  placeholderText: {
    color: '#94a3b8',
  },
});